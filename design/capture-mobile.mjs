import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 35000 + Math.floor(Math.random() * 20000);
const profile = join(root, '.temp', `style-cdp-${port}`);
const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });

async function targets() {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) return response.json();
    } catch { /* Browser is starting. */ }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error('Edge debugging endpoint did not start');
}

try {
  const page = (await targets()).find((target) => target.type === 'page');
  if (!page) throw new Error('No browser page available');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((done, fail) => {
    socket.addEventListener('open', done, { once: true });
    socket.addEventListener('error', fail, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { done, fail } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) fail(new Error(message.error.message));
    else done(message.result);
  });
  const send = (method, params = {}) => new Promise((done, fail) => {
    const nextId = ++id;
    pending.set(nextId, { done, fail });
    socket.send(JSON.stringify({ id: nextId, method, params }));
  });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
    screenWidth: 390, screenHeight: 844,
  });
  await mkdir(join(root, 'design', 'previews'), { recursive: true });
  const url = pathToFileURL(join(root, 'design', 'style-study.html')).href;
  for (const [number, view] of ['landscape', 'workbench', 'night'].entries()) {
    await send('Page.navigate', { url: `${url}?view=${view}` });
    await new Promise((done) => setTimeout(done, 600));
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const output = join(root, 'design', 'previews', `0${number + 1}-${view}-mobile.png`);
    await writeFile(output, Buffer.from(data, 'base64'));
    console.log(output);
  }
  socket.close();
} finally {
  browser.kill();
}
