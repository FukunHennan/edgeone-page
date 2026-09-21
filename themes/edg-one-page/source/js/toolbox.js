(function () {
  'use strict';

  function init() {
    var root = document.querySelector('.toolbox-workspace');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    var cards = Array.prototype.slice.call(root.querySelectorAll('[data-tool]'));
    var filters = Array.prototype.slice.call(root.querySelectorAll('[data-tool-filter]'));
    var search = root.querySelector('#tool-search');
    var count = root.querySelector('#tool-count');
    var panel = root.querySelector('#tool-panel');
    var kind = 'all';
    var english = document.documentElement.lang === 'en';

    function list() {
      var query = (search.value || '').toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var matchesKind = kind === 'all' || card.dataset.kind.split(' ').includes(kind);
        var matchesSearch = !query || card.dataset.search.toLowerCase().includes(query) || card.innerText.toLowerCase().includes(query);
        card.hidden = !(matchesKind && matchesSearch);
        if (!card.hidden) visible += 1;
      });
      count.textContent = visible + (english ? ' tools' : ' 个工具');
    }

    function shell(title, description, body) {
      panel.hidden = false;
      panel.innerHTML = '<div class="tool-panel-head"><div><small>TOOL WORKSPACE</small><h2>' + title + '</h2><p>' + description + '</p></div><button id="tool-close" type="button">×</button></div>' + body;
      panel.querySelector('#tool-close').onclick = function () { panel.hidden = true; panel.innerHTML = ''; };
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function openTool(key) {
      if (key === 'json') {
        shell('JSON Formatter', english ? 'Format, minify and validate JSON.' : '格式化、压缩并检查 JSON。', '<textarea id="tool-a" placeholder="' + (english ? 'Paste JSON…' : '粘贴 JSON…') + '"></textarea><div class="tool-actions"><button id="format" type="button">' + (english ? 'Format' : '格式化') + '</button><button id="mini" type="button">' + (english ? 'Minify' : '压缩') + '</button></div><pre id="tool-out"></pre>');
        var input = panel.querySelector('#tool-a'); var output = panel.querySelector('#tool-out');
        function run(minify) { try { output.textContent = JSON.stringify(JSON.parse(input.value), null, minify ? 0 : 2); } catch (error) { output.textContent = (english ? 'JSON error: ' : 'JSON 错误：') + error.message; } }
        panel.querySelector('#format').onclick = function () { run(false); }; panel.querySelector('#mini').onclick = function () { run(true); };
      } else if (key === 'base64') {
        shell('Base64', english ? 'UTF-8 Base64 encoding and decoding.' : 'UTF-8 文本 Base64 编码与解码。', '<textarea id="tool-a"></textarea><div class="tool-actions"><button id="enc" type="button">' + (english ? 'Encode' : '编码') + '</button><button id="dec" type="button">' + (english ? 'Decode' : '解码') + '</button></div><pre id="tool-out"></pre>');
        var text = panel.querySelector('#tool-a'); var result = panel.querySelector('#tool-out');
        panel.querySelector('#enc').onclick = function () { result.textContent = btoa(unescape(encodeURIComponent(text.value))); };
        panel.querySelector('#dec').onclick = function () { try { result.textContent = decodeURIComponent(escape(atob(text.value.trim()))); } catch (_) { result.textContent = english ? 'Decode error' : '无法解码'; } };
      } else if (key === 'radix') {
        shell(english ? 'Radix Converter' : '进制转换', english ? 'Enter decimal, hexadecimal or binary.' : '输入十进制、十六进制或二进制。', '<input id="tool-a" class="tool-input" placeholder="255 / 0xFF / 0b11111111"><div class="radix-results"><div><small>BIN</small><b id="bin">—</b></div><div><small>DEC</small><b id="dec">—</b></div><div><small>HEX</small><b id="hex">—</b></div></div>');
        var radix = panel.querySelector('#tool-a'); radix.oninput = function () { var value = radix.value.trim(); var number = value.startsWith('0x') ? parseInt(value, 16) : value.startsWith('0b') ? parseInt(value.slice(2), 2) : parseInt(value, 10); panel.querySelector('#bin').textContent = isNaN(number) ? '—' : number.toString(2); panel.querySelector('#dec').textContent = isNaN(number) ? '—' : number; panel.querySelector('#hex').textContent = isNaN(number) ? '—' : '0x' + number.toString(16).toUpperCase(); };
      } else if (key === 'timestamp') {
        shell(english ? 'Timestamp' : '时间戳', english ? 'Convert Unix timestamps.' : '转换 Unix 时间戳。', '<input id="tool-a" class="tool-input"><pre id="tool-out"></pre>');
        var stamp = panel.querySelector('#tool-a'); var stampOut = panel.querySelector('#tool-out'); stamp.oninput = function () { var number = Number(stamp.value); if (!number) { stampOut.textContent = ''; return; } if (number < 1e12) number *= 1000; var date = new Date(number); stampOut.textContent = isNaN(date.getTime()) ? (english ? 'Invalid timestamp' : '无效时间戳') : date.toString(); };
      } else if (key === 'crc') {
        shell('CRC-16 / CCITT-FALSE', english ? 'poly 0x1021, init 0xFFFF.' : '参数：poly 0x1021，init 0xFFFF。', '<textarea id="tool-a"></textarea><div class="tool-actions"><button id="calc" type="button">' + (english ? 'Calculate CRC' : '计算 CRC') + '</button></div><pre id="tool-out"></pre>');
        panel.querySelector('#calc').onclick = function () { var bytes = new TextEncoder().encode(panel.querySelector('#tool-a').value); var crc = 0xFFFF; bytes.forEach(function (value) { crc ^= value << 8; for (var i = 0; i < 8; i += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF; }); panel.querySelector('#tool-out').textContent = '0x' + crc.toString(16).toUpperCase().padStart(4, '0'); };
      } else if (key === 'diff') {
        shell(english ? 'Text Diff' : '文本 Diff', english ? 'Compare two texts line by line.' : '逐行比较两段文本。', '<div class="diff-inputs"><textarea id="tool-a"></textarea><textarea id="tool-b"></textarea></div><div class="tool-actions"><button id="compare" type="button">' + (english ? 'Compare' : '开始对比') + '</button></div><pre id="tool-out"></pre>');
        panel.querySelector('#compare').onclick = function () { var a = panel.querySelector('#tool-a').value.split('\n'); var b = panel.querySelector('#tool-b').value.split('\n'); var lines = []; for (var i = 0; i < Math.max(a.length, b.length); i += 1) { if (a[i] === b[i]) lines.push('  ' + (a[i] || '')); else { if (a[i] !== undefined) lines.push('- ' + a[i]); if (b[i] !== undefined) lines.push('+ ' + b[i]); } } panel.querySelector('#tool-out').textContent = lines.join('\n'); };
      }
    }

    filters.forEach(function (button) { button.onclick = function () { filters.forEach(function (item) { item.classList.remove('active'); }); button.classList.add('active'); kind = button.dataset.toolFilter; list(); }; });
    cards.forEach(function (card) { card.onclick = function () { openTool(card.dataset.tool); }; });
    search.oninput = list;
    list();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('swup:contentReplaced', init);
  init();
}());
