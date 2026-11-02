#!/usr/bin/env node
/**
 * Read-only diagnostic for the user's installed EdgeOne Makers MCP.
 *
 * Allowed actions:
 *   MCP JSON-RPC initialize, notifications/initialized, tools/list
 *   EdgeOne API DescribePagesProjects
 *
 * Never invokes deploy_html or deploy_folder_or_zip.
 * Never prints or stores the API token.
 *
 * Run via PowerShell wrapper: .\\tools\\verify-edgeone-mcp.ps1
 */
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';

const TIMEOUT_MS = 15000;
const defaultEntry = join(
  process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'),
  'Programs', 'EdgeOneMCP', 'node_modules', '@edgeone', 'makers-mcp',
  'dist', 'index.js'
);
const entry = process.env.EDGEONE_MCP_ENTRY || defaultEntry;
let mcpOK = false;
let apiOK = false;

function status(label, message) {
  process.stdout.write(`[${label}] ${message}\n`);
}

async function testMcp() {
  status('MCP', `Checking local entry: ${entry}`);
  if (!existsSync(entry)) {
    status('FAIL', 'MCP entry file not found. Set EDGEONE_MCP_ENTRY to its local index.js.');
    return;
  }
  const child = spawn(process.execPath, [entry], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const pending = new Map();
  let nextId = 0;
  let readBuffer = '';
  let ignoredNonJson = 0;
  let recentError = '';

  const failPending = (reason) => {
    for (const [id, p] of pending) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
      pending.delete(id);
    }
  };
  child.on('error', (error) => failPending(`MCP process error: ${error.code || error.name}`));
  child.on('exit', (code) => failPending(`MCP process exited (code ${code})`));
  child.stderr.on('data', (chunk) => {
    // Do not echo arbitrary MCP logs, which may include credentials.
    recentError = String(chunk).slice(-300);
  });
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    readBuffer += chunk;
    for (;;) {
      const pos = readBuffer.indexOf('\n');
      if (pos === -1) break;
      const line = readBuffer.slice(0, pos).trim();
      readBuffer = readBuffer.slice(pos + 1);
      if (!line) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        ignoredNonJson++;
        continue;
      }
      const p = pending.get(message.id);
      if (!p) continue;
      pending.delete(message.id);
      clearTimeout(p.timer);
      if (message.error) p.reject(new Error(`JSON-RPC error ${message.error.code || ''}`));
      else p.resolve(message.result);
    }
  });

  function send(method, params, notify = false) {
    if (notify) {
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
      return Promise.resolve();
    }
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method} timed out after ${TIMEOUT_MS}ms`));
      }, TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n', (err) => {
        if (err) {
          clearTimeout(timer);
          pending.delete(id);
          reject(new Error(`Unable to write to MCP process: ${err.code || err.name}`));
        }
      });
    });
  }

  try {
    const init = await send('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'edgeone-readonly-diagnostic', version: '1.0.0' },
    });
    if (!init || !init.serverInfo) throw new Error('Initialize response missing serverInfo');
    await send('notifications/initialized', {}, true);
    status('PASS', `MCP initialized: ${init.serverInfo.name || 'unknown'} ${init.serverInfo.version || ''}`);

    const toolResult = await send('tools/list', {});
    if (!Array.isArray(toolResult?.tools)) throw new Error('tools/list returned no tools array');
    const names = toolResult.tools.map((t) => t.name).filter(Boolean);
    status('PASS', `MCP tools/list succeeded (${names.length} tools): ${names.join(', ') || '(none)'}`);
    status('SAFE', 'No MCP tool was invoked; no deployment attempted.');
    if (ignoredNonJson) status('NOTE', `MCP emitted ${ignoredNonJson} non-JSON stdout line(s).`);
    mcpOK = true;
  } catch (error) {
    status('FAIL', `MCP handshake: ${error.message}`);
    if (recentError) status('NOTE', 'MCP process wrote to stderr; diagnostic intentionally hides raw log text.');
  } finally {
    failPending('Diagnostic finished');
    child.kill();
  }
}

async function testApi() {
  const token = process.env.EDGEONE_PAGES_API_TOKEN?.trim();
  if (!token) {
    status('SKIP', 'No EDGEONE_PAGES_API_TOKEN in this process. Cloud authorization was NOT tested.');
    return;
  }
  const endpoints = [
    'https://pages-api.edgeone.ai/v1',
    'https://pages-api.cloud.tencent.com/v1',
  ];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ Action: 'DescribePagesProjects', PageNumber: 1, PageSize: 1 }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch { data = null; }
      if (response.ok && data?.Code === 0) {
        apiOK = true;
        status('PASS', `Tencent EdgeOne read-only API authorized at ${endpoint}; Code=0`);
        break;
      }
      status('FAIL', `API at ${endpoint}: HTTP ${response.status}, Code=${data?.Code ?? 'unavailable'}`);
    } catch (error) {
      status('FAIL', `API at ${endpoint}: ${error.name || 'network error'}`);
    }
  }
  if (!apiOK) status('NOTE', 'No endpoint returned Code=0. Check token region/permissions/network; do not paste token into chat.');
}

await testMcp();
await testApi();
status('RESULT', `MCP=${mcpOK ? 'PASS' : 'FAIL'}; CloudAPI=${apiOK ? 'PASS' : process.env.EDGEONE_PAGES_API_TOKEN ? 'FAIL' : 'NOT_TESTED'}`);
process.exitCode = mcpOK && apiOK ? 0 : 1;
