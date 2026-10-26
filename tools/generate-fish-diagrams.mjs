import { mkdir, writeFile } from 'node:fs/promises';

const siteDir = new URL('../astro-static/projects/fish/', import.meta.url);
const sourceDir = new URL('../docs/fish-articles/diagrams/', import.meta.url);
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const diagrams = [
  {
    id: 'technology-map', title: 'Technology and responsibilities', width: 850, height: 550,
    nodes: [
      { id: 'web', kind: 'lane', x: 40, y: 86, w: 770, h: 88, title: 'Browser interfaces', detail: ['HTML / CSS / JavaScript + React / Vite', 'Player and referee workflows; device administration'], tone: 'green' },
      { id: 'control', kind: 'lane', x: 40, y: 188, w: 770, h: 88, title: 'Control hub', detail: ['Go + Gorilla WebSocket', 'Identity, leases, commands, match state'], tone: 'blue' },
      { id: 'firmware', kind: 'lane', x: 40, y: 290, w: 770, h: 88, title: 'Device firmware', detail: ['ESP32-C3 + Arduino / PlatformIO', 'Servo motion, telemetry, local stop checks'], tone: 'orange' },
      { id: 'video', kind: 'lane', x: 40, y: 392, w: 770, h: 88, title: 'Camera and video', detail: ['Python + OpenCV / Flask / aiortc / PyAV', 'Capture, framing, streaming, recording'], tone: 'teal' },
    ],
    edges: [],
    footer: 'These rows describe responsibilities, not a single sequential call path.',
  },
  {
    id: 'design-checks', title: 'Three different checks', width: 900, height: 345,
    nodes: [
      { id: 'identity', x: 30, y: 102, w: 260, h: 172, title: 'Device identity', detail: ['HMAC challenge at registration', 'Shared deployment key', 'Nonce + normalized MAC'], tone: 'green' },
      { id: 'ownership', x: 320, y: 102, w: 260, h: 172, title: 'Control ownership', detail: ['Device + account + client lease', 'Reject stale or other-owner input', 'Clear queued motion on stop'], tone: 'blue' },
      { id: 'update', x: 610, y: 102, w: 260, h: 172, title: 'Firmware result', detail: ['SHA-256 image check', 'Reboot and reconnect', 'New bootId + version + build'], tone: 'orange' },
    ],
    edges: [],
    footer: 'Registration, motion admission, and OTA completion need separate evidence.',
  },
  {
    id: 'architecture', title: 'Fish system architecture', width: 1120, height: 510,
    nodes: [
      { id: 'browser', x: 36, y: 170, w: 238, h: 122, title: 'Browser', detail: ['Player / referee / admin', 'React console + HTML match UI'], tone: 'green' },
      { id: 'go', x: 392, y: 170, w: 288, h: 122, title: 'Go controller :8081', detail: ['Identity, leases, match state', 'Commands, API, video proxy'], tone: 'blue' },
      { id: 'esp', x: 850, y: 65, w: 232, h: 116, title: 'ESP32-C3 firmware', detail: ['Motion + telemetry', 'Arduino / PlatformIO'], tone: 'orange' },
      { id: 'python', x: 850, y: 292, w: 232, h: 122, title: 'Python video :8091', detail: ['Camera, WebRTC, recording', 'OpenCV / aiortc / Flask'], tone: 'teal' },
    ],
    edges: [
      { from: 'browser', to: 'go', points: '274,231 392,231', label: 'HTTP + WebSocket', lx: 333, ly: 151 },
      { from: 'go', to: 'esp', points: '680,201 756,201 756,123 850,123', label: 'WebSocket / JSON', lx: 768, ly: 103 },
      { from: 'go', to: 'python', points: '680,256 750,256 750,353 850,353', label: 'camera API / JPEG proxy', lx: 761, ly: 332 },
      { from: 'python', to: 'browser', points: '850,388 802,388 802,458 155,458 155,292', label: 'direct / TURN WebRTC media', lx: 510, ly: 440, dashed: true },
    ],
    footer: 'Control and media have separate paths. The JPEG fallback passes through the Go origin.',
  },
  {
    id: 'frontend-backend-flow', title: 'Frontend and backend request flow', width: 1000, height: 475,
    nodes: [
      { id: 'browser', x: 30, y: 120, w: 240, h: 126, title: 'Browser frontend', detail: ['Match page + admin console', 'Input and video display'], tone: 'green' },
      { id: 'go', x: 380, y: 120, w: 240, h: 126, title: 'Go service', detail: ['Accounts + match state', 'Control admission + API'], tone: 'blue' },
      { id: 'esp', x: 730, y: 120, w: 240, h: 126, title: 'ESP32 firmware', detail: ['Motion + telemetry', 'Local stop checks'], tone: 'orange' },
      { id: 'python', x: 380, y: 320, w: 240, h: 102, title: 'Python video', detail: ['Camera + WebRTC + recording'], tone: 'teal' },
    ],
    edges: [
      { from: 'browser', to: 'go', points: '270,183 380,183', label: 'HTTP / WebSocket', lx: 325, ly: 105 },
      { from: 'go', to: 'esp', points: '620,183 730,183', label: 'device WS / JSON', lx: 675, ly: 105 },
      { from: 'go', to: 'python', points: '500,246 500,320', label: 'video API / signaling', lx: 611, ly: 288 },
      { from: 'python', to: 'browser', points: '380,371 150,371 150,246', label: 'direct / TURN media', lx: 265, ly: 352, dashed: true },
    ],
    footer: 'Go handles control and signaling. Normal WebRTC media does not pass through Go.',
  },
  {
    id: 'public-access', title: 'Public web access through Cloudflare Tunnel', width: 1160, height: 420,
    nodes: [
      { id: 'remote', x: 28, y: 125, w: 230, h: 112, title: 'Remote browser', detail: ['Pages, API, WebSocket'], tone: 'green' },
      { id: 'edge', x: 315, y: 125, w: 230, h: 112, title: 'Cloudflare edge', detail: ['Public hostname'], tone: 'blue' },
      { id: 'tunnel', x: 602, y: 125, w: 230, h: 112, title: 'cloudflared', detail: ['Outbound tunnel'], tone: 'teal' },
      { id: 'go', x: 889, y: 125, w: 240, h: 112, title: 'Go :8081', detail: ['Web + signaling'], tone: 'blue' },
      { id: 'python', x: 889, y: 282, w: 240, h: 82, title: 'Python :8091', detail: ['Local HTTP API'], tone: 'orange' },
    ],
    edges: [
      { from: 'remote', to: 'edge', points: '258,181 315,181' },
      { from: 'edge', to: 'tunnel', points: '545,181 602,181' },
      { from: 'tunnel', to: 'go', points: '832,181 889,181' },
      { from: 'go', to: 'python', points: '1009,237 1009,282' },
    ],
    footer: 'Tunnel publishes the web entry; WebRTC media uses a separate path.',
  },
  {
    id: 'lan-reachability', title: 'Can the browser use a direct media path?', width: 1100, height: 440,
    nodes: [
      { id: 'entry', x: 25, y: 145, w: 220, h: 116, title: 'Open the website', detail: ['Stable domain via Tunnel', 'Web entry responds'], tone: 'green' },
      { id: 'probe', x: 295, y: 145, w: 220, h: 116, title: 'Try host candidates', detail: ['Browser + Python', 'No TURN in this stage'], tone: 'blue' },
      { id: 'verify', x: 565, y: 145, w: 220, h: 116, title: 'Verify media', detail: ['ICE connection', 'First + fresh frames'], tone: 'teal' },
      { id: 'direct', x: 835, y: 65, w: 235, h: 112, title: 'Direct path works', detail: ['Keep the usable video'], tone: 'green' },
      { id: 'next', x: 835, y: 255, w: 235, h: 112, title: 'Direct path fails', detail: ['Continue to other paths'], tone: 'orange' },
    ],
    edges: [
      { from: 'entry', to: 'probe', points: '245,203 295,203' },
      { from: 'probe', to: 'verify', points: '515,203 565,203' },
      { from: 'verify', to: 'direct', points: '785,178 810,178 810,121 835,121', label: 'usable', lx: 796, ly: 95 },
      { from: 'verify', to: 'next', points: '785,228 810,228 810,311 835,311', label: 'failed', lx: 796, ly: 289 },
    ],
    footer: 'The current selector tests ICE and delivered frames; it does not classify LAN access by IP.',
  },
  {
    id: 'media-path', title: 'Signaling and media are separate paths', width: 1160, height: 445,
    nodes: [
      { id: 'browser', x: 30, y: 104, w: 260, h: 105, title: 'Browser', detail: ['Session + viewing rights'], tone: 'green' },
      { id: 'go', x: 450, y: 104, w: 260, h: 105, title: 'Go signaling', detail: ['Offer / answer proxy'], tone: 'blue' },
      { id: 'python', x: 870, y: 104, w: 260, h: 105, title: 'Python video', detail: ['Capture + aiortc'], tone: 'teal' },
      { id: 'direct', x: 30, y: 280, w: 335, h: 96, title: 'Direct media', detail: ['Python → browser', 'Host ICE candidates'], tone: 'green' },
      { id: 'turn', x: 412, y: 280, w: 335, h: 96, title: 'TURN relay', detail: ['Python → TURN → browser', 'Temporary relay credentials'], tone: 'blue' },
      { id: 'jpeg', x: 794, y: 280, w: 335, h: 96, title: 'JPEG fallback', detail: ['Python → Go → browser', 'Same-origin WebSocket'], tone: 'orange' },
    ],
    edges: [
      { from: 'browser', to: 'go', points: '290,156 450,156', label: 'offer', lx: 370, ly: 135 },
      { from: 'go', to: 'python', points: '710,156 870,156', label: 'local API', lx: 790, ly: 135 },
    ],
    footer: 'The Go origin carries signaling and JPEG fallback; normal WebRTC frames bypass it.',
  },
  {
    id: 'video-fallback', title: 'Video transport path selection', width: 1160, height: 420,
    nodes: [
      { id: 'direct', x: 30, y: 132, w: 310, h: 166, title: '1. Direct WebRTC', detail: ['Host candidates only', 'ICE + first and fresh frames', 'Stay while video is usable'], tone: 'green' },
      { id: 'relay', x: 425, y: 132, w: 310, h: 166, title: '2. TURN relay', detail: ['Relay candidates only', 'ICE + first and fresh frames', 'Stay while video is usable'], tone: 'blue' },
      { id: 'snapshot', x: 820, y: 132, w: 310, h: 166, title: '3. JPEG snapshots', detail: ['Same-origin WebSocket via Go', 'Send the newest frame only', 'Reconnect snapshots on failure'], tone: 'teal' },
    ],
    edges: [
      { from: 'direct', to: 'relay', points: '340,215 425,215', label: 'failed / stale', lx: 382, ly: 115 },
      { from: 'relay', to: 'snapshot', points: '735,215 820,215', label: 'failed / no TURN', lx: 778, ly: 115 },
    ],
    footer: 'The current selector checks ICE and delivered frames; IP subnet comparison is not used.',
  },
  {
    id: 'control-flow', title: 'Motion command lifecycle', width: 1200, height: 490,
    nodes: [
      { id: 'input', x: 30, y: 150, w: 186, h: 105, title: 'Browser input', detail: ['Key / button', 'Account + client'], tone: 'green' },
      { id: 'auth', x: 263, y: 150, w: 190, h: 105, title: 'Go admission', detail: ['Session + role', 'Device assigned?'], tone: 'blue' },
      { id: 'lease', x: 500, y: 150, w: 190, h: 105, title: 'Control lease', detail: ['Device + account', 'Browser client + TTL'], tone: 'blue' },
      { id: 'queue', x: 737, y: 150, w: 190, h: 105, title: 'Motion queue', detail: ['Expiry before send', 'STOP clears stale motion'], tone: 'teal' },
      { id: 'firmware', x: 974, y: 150, w: 196, h: 105, title: 'ESP32 firmware', detail: ['Servo motion', 'Heartbeat / stop checks'], tone: 'orange' },
      { id: 'reject', x: 380, y: 342, w: 190, h: 80, title: 'Reject command', detail: ['No motion sent'], tone: 'gray' },
      { id: 'stop', x: 777, y: 342, w: 190, h: 80, title: 'STOP + reset', detail: ['Lease / motion expiry'], tone: 'orange' },
    ],
    edges: [
      { from: 'input', to: 'auth', points: '216,203 263,203' },
      { from: 'auth', to: 'lease', points: '453,203 500,203' },
      { from: 'lease', to: 'queue', points: '690,203 737,203' },
      { from: 'queue', to: 'firmware', points: '927,203 974,203' },
      { from: 'auth', to: 'reject', points: '358,255 358,310 475,310 475,342', label: 'invalid', lx: 398, ly: 297 },
      { from: 'lease', to: 'reject', points: '595,255 595,310 475,310 475,342', label: 'expired / other owner', lx: 576, ly: 291 },
      { from: 'queue', to: 'stop', points: '832,255 832,342', label: 'timeout', lx: 870, ly: 301 },
      { from: 'stop', to: 'firmware', points: '967,382 1072,382 1072,255', dashed: true },
    ],
    footer: 'The lease, queued-command deadline, and firmware connectivity checks are distinct boundaries.',
  },
  {
    id: 'communication-lifecycle', title: 'Control messages and connection recovery', width: 1000, height: 485,
    nodes: [
      { id: 'browser', x: 30, y: 125, w: 240, h: 116, title: 'Browser', detail: ['/ws/control', 'Input + lease renewal'], tone: 'green' },
      { id: 'go', x: 380, y: 125, w: 240, h: 116, title: 'Go controller', detail: ['Auth + lease + queue', 'Command routing'], tone: 'blue' },
      { id: 'esp', x: 730, y: 125, w: 240, h: 116, title: 'ESP32 firmware', detail: ['/ws/device', 'Motion + telemetry'], tone: 'orange' },
      { id: 'browserRecovery', x: 30, y: 316, w: 240, h: 105, title: 'Browser disconnect', detail: ['Reconnect control socket', 'Renew or reacquire lease'], tone: 'gray' },
      { id: 'goRecovery', x: 380, y: 316, w: 240, h: 105, title: 'Go safety boundary', detail: ['Ping / pong, lease expiry', 'Drop old motion; queue STOP'], tone: 'blue' },
      { id: 'espRecovery', x: 730, y: 316, w: 240, h: 105, title: 'Device safety boundary', detail: ['Deadman / heartbeat timeout', 'Local stop; reconnect'], tone: 'orange' },
    ],
    edges: [
      { from: 'browser', to: 'go', points: '270,183 380,183', label: 'control frames', lx: 325, ly: 105 },
      { from: 'go', to: 'esp', points: '620,183 730,183', label: 'command JSON', lx: 675, ly: 105 },
      { from: 'browser', to: 'browserRecovery', points: '150,241 150,316', dashed: true },
      { from: 'go', to: 'goRecovery', points: '500,241 500,316', dashed: true },
      { from: 'esp', to: 'espRecovery', points: '850,241 850,316', dashed: true },
    ],
    footer: 'ESP32 initiates /ws/device. Transport liveness and permission to move are checked separately.',
  },
  {
    id: 'competition-video-lifecycle', title: 'Live view, recording, replay, and download', width: 1160, height: 475,
    nodes: [
      { id: 'camera', x: 25, y: 181, w: 205, h: 110, title: 'USB camera', detail: ['Connected to Fish host', 'Captured by Python'], tone: 'green' },
      { id: 'frames', x: 295, y: 181, w: 245, h: 110, title: 'Shared player frames', detail: ['Rotation + player crop', 'Latest timestamped source'], tone: 'teal' },
      { id: 'live', x: 605, y: 81, w: 225, h: 110, title: 'Live video', detail: ['WebRTC direct / TURN', 'JPEG fallback via Go'], tone: 'blue' },
      { id: 'recorder', x: 605, y: 281, w: 225, h: 110, title: 'Server recording', detail: ['PyAV encodes H.264', 'Finalize local MP4'], tone: 'orange' },
      { id: 'viewer', x: 895, y: 81, w: 240, h: 110, title: 'Match live view', detail: ['Browser video display'], tone: 'green' },
      { id: 'archive', x: 895, y: 281, w: 240, h: 110, title: 'Replay / download', detail: ['Authenticated Go HTTP', 'MP4 Range / file fetch'], tone: 'green' },
    ],
    edges: [
      { from: 'camera', to: 'frames', points: '230,236 295,236' },
      { from: 'frames', to: 'live', points: '540,211 570,211 570,136 605,136' },
      { from: 'frames', to: 'recorder', points: '540,261 570,261 570,336 605,336' },
      { from: 'live', to: 'viewer', points: '830,136 895,136' },
      { from: 'recorder', to: 'archive', points: '830,336 895,336' },
    ],
    footer: 'Live delivery and server recording share the player frame source; replay and download read the saved MP4.',
  },
  {
    id: 'competition-flow', title: 'Competition state and recording', width: 1190, height: 520,
    nodes: [
      { id: 'assign', x: 28, y: 145, w: 180, h: 94, title: 'Assign devices', detail: ['Blue / red seats'], tone: 'green' },
      { id: 'field', x: 250, y: 145, w: 180, h: 94, title: 'Prepare field', detail: ['Camera + readiness'], tone: 'green' },
      { id: 'record', x: 472, y: 145, w: 180, h: 94, title: 'Start recording', detail: ['Must succeed first'], tone: 'blue' },
      { id: 'running', x: 694, y: 145, w: 180, h: 94, title: 'Running', detail: ['Timer + scoring'], tone: 'teal' },
      { id: 'pause', x: 916, y: 145, w: 246, h: 94, title: 'Paused', detail: ['Timer stops; control and', 'recording continue'], tone: 'orange' },
      { id: 'blocked', x: 472, y: 345, w: 180, h: 88, title: 'Start blocked', detail: ['Camera / record failed'], tone: 'gray' },
      { id: 'finish', x: 694, y: 345, w: 180, h: 88, title: 'Finish', detail: ['Finalize match + MP4'], tone: 'blue' },
      { id: 'replay', x: 916, y: 345, w: 246, h: 88, title: 'Replay', detail: ['Scores, events, video'], tone: 'green' },
    ],
    edges: [
      { from: 'assign', to: 'field', points: '208,192 250,192' },
      { from: 'field', to: 'record', points: '430,192 472,192' },
      { from: 'record', to: 'running', points: '652,192 694,192', label: 'success', lx: 673, ly: 126 },
      { from: 'record', to: 'blocked', points: '562,239 562,345', label: 'failure', lx: 601, ly: 290 },
      { from: 'running', to: 'pause', points: '874,192 916,192', label: 'pause', lx: 895, ly: 126 },
      { from: 'pause', to: 'running', points: '1038,145 1038,89 784,89 784,145', label: 'resume', lx: 913, ly: 74 },
      { from: 'running', to: 'finish', points: '784,239 784,345', label: 'end', lx: 815, ly: 290 },
      { from: 'pause', to: 'finish', points: '1038,239 1038,306 784,306 784,345' },
      { from: 'finish', to: 'replay', points: '874,389 916,389' },
    ],
    footer: 'Match timing, device control, and camera recording remain separate states.',
  },
];

const chinese = {
  'technology-map': {
    title: '技术栈与职责',
    nodes: {
      web: ['浏览器界面', 'HTML / CSS / JavaScript + React / Vite', '选手与裁判操作；设备管理'],
      control: ['控制中枢', 'Go + Gorilla WebSocket', '身份、租约、指令、赛事状态'],
      firmware: ['设备固件', 'ESP32-C3 + Arduino / PlatformIO', '舵机运动、状态回传、本地停止'],
      video: ['相机与视频', 'Python + OpenCV / Flask / aiortc / PyAV', '采集、构图、直播、录像'],
    },
    edges: [],
    footer: '四层代表模块职责，并非单向调用顺序。',
  },
  'design-checks': {
    title: '三类校验，各有边界',
    nodes: {
      identity: ['设备身份', '注册时 HMAC 挑战应答', '共享部署密钥', 'nonce + 规范化 MAC'],
      ownership: ['控制归属', '设备 + 账号 + 客户端租约', '拒绝过期和越权操作', '停止时清除旧运动'],
      update: ['升级结果', 'SHA-256 镜像校验', '重启并重新上线', '新 bootId + 版本 + 构建'],
    },
    edges: [],
    footer: '注册、运动准入和 OTA 完成分别需要不同证据。',
  },
  architecture: {
    title: 'Fish 系统架构',
    nodes: {
      browser: ['浏览器', '选手 / 裁判 / 管理员', 'React 管理台 + 赛事页'],
      go: ['Go 控制器 :8081', '身份、租约、赛事状态', '指令、API、视频代理'],
      esp: ['ESP32-C3 固件', '运动与状态回传', 'Arduino / PlatformIO'],
      python: ['Python 视频 :8091', '相机、WebRTC、录像', 'OpenCV / aiortc / Flask'],
    },
    edges: ['HTTP / WebSocket', 'WebSocket / JSON', '相机 API / JPEG 代理', '直连 / TURN 视频'],
    footer: '控制与视频分开传输；JPEG 降级流经过同源 Go 入口。',
  },
  'frontend-backend-flow': {
    title: '前后端请求与设备、视频流程',
    nodes: {
      browser: ['浏览器前端', '赛事页 + 管理台', '操作输入与视频展示'],
      go: ['Go 服务', '账号 + 赛事状态', '控制准入 + API'],
      esp: ['ESP32 固件', '运动 + 状态回传', '本地停止检查'],
      python: ['Python 视频', '相机 + WebRTC + 录像'],
    },
    edges: ['HTTP / WebSocket', '设备 WS / JSON', '视频 API / 信令', '直连 / TURN 媒体'],
    footer: 'Go 处理控制和信令；正常 WebRTC 画面不经过 Go。',
  },
  'public-access': {
    title: '经 Cloudflare Tunnel 发布网页入口',
    nodes: {
      remote: ['外网浏览器', '页面、API、WebSocket'],
      edge: ['Cloudflare 边缘', '公网域名'],
      tunnel: ['cloudflared', '主动建立 Tunnel'],
      go: ['Go :8081', '网页与信令'],
      python: ['Python :8091', '本机 HTTP API'],
    },
    edges: [],
    footer: 'Tunnel 发布网页入口；WebRTC 媒体另走直连或中继链路。',
  },
  'lan-reachability': {
    title: '浏览器能否使用直连视频路径？',
    nodes: {
      entry: ['打开网站', '稳定域名经 Tunnel', '网页入口可达'],
      probe: ['尝试 host 候选', '浏览器 + Python', '本阶段不使用 TURN'],
      verify: ['验证画面', 'ICE 连通', '首帧 + 后续画面'],
      direct: ['直连可用', '保持当前画面'],
      next: ['直连不可用', '继续尝试其他路径'],
    },
    edges: [null, null, '可用', '失败'],
    footer: '当前程序依据 ICE 与实际画面判断，不通过 IP 比较认定局域网。',
  },
  'media-path': {
    title: '信令与视频媒体分开传输',
    nodes: {
      browser: ['浏览器', '会话与画面权限'],
      go: ['Go 信令入口', '转发 offer / answer'],
      python: ['Python 视频服务', '采集画面 + aiortc'],
      direct: ['媒体直连', 'Python → 浏览器', 'host ICE 候选'],
      turn: ['TURN 中继', 'Python → TURN → 浏览器', '临时中继凭据'],
      jpeg: ['JPEG 降级', 'Python → Go → 浏览器', '同源 WebSocket'],
    },
    edges: ['offer', '本机 API'],
    footer: 'Go 承载信令和 JPEG 降级；正常 WebRTC 画面不经过 Go。',
  },
  'video-fallback': {
    title: '视频传输路径选择',
    nodes: {
      direct: ['1. WebRTC 直连', '仅使用 host 候选', '检查 ICE、首帧与后续画面', '画面可用则保持'],
      relay: ['2. TURN 中继', '仅使用 relay 候选', '检查 ICE、首帧与后续画面', '画面可用则保持'],
      snapshot: ['3. JPEG 快照', '经 Go 的同源 WebSocket', '只转发最新画面', '断线后重连快照'],
    },
    edges: ['失败 / 停帧', '失败 / 无 TURN'],
    footer: '当前选路依据 ICE 与实际画面；IP 网段比较没有参与。',
  },
  'control-flow': {
    title: '运动指令生命周期',
    nodes: {
      input: ['浏览器输入', '按键 / 按钮', '账号 + 客户端'],
      auth: ['Go 接入检查', '会话 + 角色', '设备已分配？'],
      lease: ['控制权租约', '设备 + 账号', '客户端 + 有效期'],
      queue: ['运动队列', '送达前检查过期', '停止时清理旧运动'],
      firmware: ['ESP32 固件', '执行舵机运动', '心跳 / 停止检查'],
      reject: ['拒绝指令', '不下发运动'],
      stop: ['停止并重置', '租约 / 运动过期'],
    },
    edges: [null, null, null, null, '无权限', '过期 / 其他持有者', '超时', null],
    footer: '控制权租约、队列截止时间与固件连接检查是不同的安全边界。',
  },
  'communication-lifecycle': {
    title: '控制消息与断线恢复',
    nodes: {
      browser: ['浏览器', '/ws/control', '输入 + 租约续期'],
      go: ['Go 控制器', '授权 + 租约 + 队列', '指令路由'],
      esp: ['ESP32 固件', '/ws/device', '运动 + 状态回传'],
      browserRecovery: ['浏览器断线', '重连控制通道', '续期或重取租约'],
      goRecovery: ['Go 安全边界', 'Ping / Pong、租约过期', '清旧运动；下发 STOP'],
      espRecovery: ['设备安全边界', '动作 / 心跳超时', '本地停止；重新连接'],
    },
    edges: ['控制帧', '指令 JSON', null, null, null],
    footer: 'ESP32 主动连接 /ws/device；连接存活与运动资格分别判断。',
  },
  'competition-video-lifecycle': {
    title: '比赛画面的直播、录制、回放与下载',
    nodes: {
      camera: ['USB 摄像头', '连接 Fish 主机', '由 Python 采集'],
      frames: ['共享选手画面源', '旋转 + 有效区裁剪', '按采集时间提供新帧'],
      live: ['实时画面', 'WebRTC 直连 / TURN', 'JPEG 经 Go 兜底'],
      recorder: ['主机端录像', 'PyAV 编码 H.264', '结束后封存 MP4'],
      viewer: ['比赛直播', '浏览器展示画面'],
      archive: ['回放 / 下载', '经 Go 鉴权的 HTTP', 'MP4 分段播放 / 文件下载'],
    },
    edges: [],
    footer: '直播与录像共用选手画面源；回放和下载读取已封存的 MP4。',
  },
  'competition-flow': {
    title: '赛事状态与录像流程',
    nodes: {
      assign: ['分配设备', '蓝 / 红队席位'],
      field: ['准备场地', '相机 + 设备确认'],
      record: ['启动录像', '成功后才能开赛'],
      running: ['比赛进行', '计时 + 计分'],
      pause: ['比赛暂停', '计时停；控制与', '录像继续'],
      blocked: ['阻止开赛', '相机 / 录像失败'],
      finish: ['结束比赛', '封存记录 + MP4'],
      replay: ['比赛回放', '比分、事件、视频'],
    },
    edges: [null, null, '成功', '失败', '暂停', '继续', '结束', null, null],
    footer: '比赛计时、设备控制和相机录像各自维护状态。',
  },
};

const localize = (diagram) => {
  const copy = structuredClone(diagram);
  const translation = chinese[diagram.id];
  copy.title = translation.title;
  copy.footer = translation.footer;
  copy.nodes = copy.nodes.map((node) => {
    const [title, ...detail] = translation.nodes[node.id];
    return { ...node, title, detail };
  });
  copy.edges = copy.edges.map((edge, index) => ({ ...edge, label: translation.edges[index] ?? undefined }));
  return copy;
};

const colors = {
  green: ['#edf4ee', '#58775e'], blue: ['#edf3f9', '#537391'],
  teal: ['#e9f5f3', '#3e7771'], orange: ['#fff3e8', '#aa7447'],
  gray: ['#f1f2f1', '#7a8580'],
};
const svgNode = (node) => {
  const [fill, stroke] = colors[node.tone];
  if (node.kind === 'lane') {
    const lines = node.detail.map((line, index) => `<text x="${node.x + 246}" y="${node.y + 34 + index * 27}" class="lane-detail">${escape(line)}</text>`).join('');
    return `<g><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/><rect x="${node.x}" y="${node.y}" width="8" height="${node.h}" fill="${stroke}"/><text x="${node.x + 25}" y="${node.y + 53}" class="lane-title">${escape(node.title)}</text>${lines}</g>`;
  }
  const cx = node.x + node.w / 2;
  const lines = node.detail.map((line, index) => `<text x="${cx}" y="${node.y + 59 + index * 19}" class="detail">${escape(line)}</text>`).join('');
  return `<g><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><text x="${cx}" y="${node.y + 31}" class="title">${escape(node.title)}</text>${lines}</g>`;
};
const svgEdge = (edge) => `<g><polyline points="${edge.points}" fill="none" stroke="#65756f" stroke-width="2" stroke-linejoin="round" marker-end="url(#arrow)" ${edge.dashed ? 'stroke-dasharray="6 5"' : ''}/>${edge.label ? `<text x="${edge.lx}" y="${edge.ly}" class="edge-label">${escape(edge.label)}</text>` : ''}</g>`;
const svg = (diagram, zh = false) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${diagram.width} ${diagram.height}" role="img" aria-labelledby="title desc">
<title id="title">${escape(diagram.title)}</title><desc id="desc">${escape(diagram.footer)}</desc>
<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M1 1 L7 4.5 L1 8" fill="none" stroke="#65756f" stroke-width="1.5"/></marker></defs>
<style>text{font-family:Arial,Helvetica,sans-serif;letter-spacing:0;fill:#263630}.heading{font-size:${zh ? 30 : 26}px;font-weight:700}.title{font-size:${zh ? 22 : 19}px;font-weight:700;text-anchor:middle}.detail{font-size:${zh ? 18 : 16}px;text-anchor:middle;fill:#4c5a55}.lane-title{font-size:${zh ? 23 : 21}px;font-weight:700}.lane-detail{font-size:${zh ? 18 : 16}px;fill:#4c5a55}.edge-label{font-size:${zh ? 16 : 14}px;text-anchor:middle;fill:#53645e}.footer{font-size:${zh ? 17 : 15}px;fill:#64716d}</style>
<rect width="${diagram.width}" height="${diagram.height}" fill="#fff"/><text x="30" y="44" class="heading">${escape(diagram.title)}</text>
${diagram.edges.map(svgEdge).join('\n')}
${diagram.nodes.map(svgNode).join('\n')}
<text x="30" y="${diagram.height - 26}" class="footer">${escape(diagram.footer)}</text></svg>\n`;

const mx = (diagram) => {
  const cells = diagram.nodes.map((node, index) => {
    const [fill, stroke] = colors[node.tone];
    const value = [node.title, ...node.detail].join('<br>');
    return `<mxCell id="n${index}" value="${escape(value)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${fill};strokeColor=${stroke};fontColor=#263630;fontFamily=Helvetica;fontSize=14;align=${node.kind === 'lane' ? 'left' : 'center'};verticalAlign=middle;spacing=8;" vertex="1" parent="1"><mxGeometry x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" as="geometry"/></mxCell>`;
  });
  const edges = diagram.edges.map((edge, index) => {
    const points = edge.points.split(' ').map((p) => p.split(',').map(Number));
    const via = points.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join('');
    return `<mxCell id="e${index}" value="${escape(edge.label || '')}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=0;strokeColor=#65756f;strokeWidth=2;endArrow=blockThin;${edge.dashed ? 'dashed=1;' : ''}fontColor=#53645e;fontSize=12;" edge="1" parent="1" source="n${diagram.nodes.findIndex((n) => n.id === edge.from)}" target="n${diagram.nodes.findIndex((n) => n.id === edge.to)}"><mxGeometry relative="1" as="geometry">${via ? `<Array as="points">${via}</Array>` : ''}</mxGeometry></mxCell>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net"><diagram id="${diagram.id}" name="${escape(diagram.title)}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${diagram.width}" pageHeight="${diagram.height}" background="#FFFFFF"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}${edges.join('')}</root></mxGraphModel></diagram></mxfile>\n`;
};

await Promise.all([mkdir(siteDir, { recursive: true }), mkdir(sourceDir, { recursive: true })]);
for (const { diagram, filename } of [
  ...diagrams.map((diagram) => ({ diagram, filename: diagram.id })),
  ...diagrams.map((diagram) => ({ diagram: localize(diagram), filename: `${diagram.id}-zh` })),
]) {
  await Promise.all([
    writeFile(new URL(`${filename}.svg`, siteDir), svg(diagram, filename.endsWith('-zh'))),
    writeFile(new URL(`${filename}.drawio`, sourceDir), mx(diagram)),
  ]);
}

const cover = (zh) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 293" role="img" aria-labelledby="title desc">
<title id="title">Fish ${zh ? '机器鱼平台方案' : 'robot platform design'}</title>
<desc id="desc">${zh ? '浏览器、Go 控制器、ESP32 固件与 Python 视频服务的职责关系' : 'Browser, Go controller, ESP32 firmware, and Python video service responsibilities'}</desc>
<style>text{font-family:Arial,Helvetica,sans-serif;fill:#20352e;letter-spacing:0}.brand{font-size:29px;font-weight:700}.sub{font-size:13px;fill:#59736a}.node{font-size:15px;font-weight:700;text-anchor:middle}.link{stroke:#658178;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}</style>
<rect width="520" height="293" fill="#edf3ef"/>
<g transform="translate(0 54)">
<text x="25" y="44" class="brand">Fish</text><text x="102" y="41" class="sub">${zh ? '机器鱼平台 · 系统方案' : 'Robot platform · system design'}</text>
<path class="link" d="M124 119 H200 M302 119 H380 M251 138 V158 H390"/>
<path class="link" d="M194 115 l6 4 -6 4 M374 115 l6 4 -6 4 M385 154 l5 4 -5 4"/>
<rect x="24" y="96" width="100" height="45" rx="5" fill="#fff" stroke="#809b8b"/><text x="74" y="124" class="node">${zh ? '浏览器' : 'Browser'}</text>
<rect x="200" y="96" width="102" height="45" rx="5" fill="#fff" stroke="#6a86a0"/><text x="251" y="124" class="node">Go</text>
<rect x="380" y="96" width="115" height="45" rx="5" fill="#fff" stroke="#ad865b"/><text x="437.5" y="124" class="node">ESP32</text>
<text x="410" y="165" class="sub">Python ${zh ? '视频' : 'video'}</text>
</g>
</svg>\n`;
await Promise.all([
  writeFile(new URL('cover-zh.svg', siteDir), cover(true)),
  writeFile(new URL('cover.svg', siteDir), cover(false)),
]);
