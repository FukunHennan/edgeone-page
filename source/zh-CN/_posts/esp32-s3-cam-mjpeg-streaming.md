---
title: ESP32-S3-CAM + Home Assistant 视频推流实战：从 3 秒抓拍到 0.3 秒实时画面
description: 在 ESP32-S3-CAM（Ai-Thinker，OV2640）上用 ESPHome 的 MJPEG Web Server 实现低延时视频直推，配合树莓派上的 Python 标准库转发服务解决单客户端限制，接入自绘智能家居面板与 Home Assistant。含完整固件配置、卡顿根因（modem sleep 与单缓冲反压）、转发加固三件套、断流自愈与实测延时数据。
date: 2026-11-19 08:00:00
updated: 2026-11-19 14:00:00
lang: zh-CN
translation_key: esp32-s3-cam-mjpeg-streaming
content_type: article
published: true
tags: [esp32, home-assistant, esphome, raspberry-pi, mjpeg]
---

把一块几十块钱的 ESP32-S3-CAM 接进 Home Assistant 之后，大多数人得到的第一个体验是：画面能动，但每次刷新要等一两秒，像在看监控抓拍而不是实时视频。本文记录我把这条链路从"抓拍模式"改造成"MJPEG 直推 + 服务端分发"的完整过程：为什么 ESP32-S3 只能走 MJPEG、固件怎么配、单客户端限制怎么绕、流卡顿的两个隐蔽根因怎么查、浏览器端有哪些反直觉的坑，以及每一步的实测数据。整套方案已部署上线，夜景 12.8fps、亮景 13.4fps，服务端帧龄 ≤0.08 秒。

## 一、问题：HA 默认摄像头为什么慢

我的链路是：ESP32-S3-CAM（ESPHome 固件）→ HA 的 ESPHome 集成 → 自绘面板通过 HA 的 `camera_proxy` 接口取图。在树莓派上对 `GET /api/camera_proxy/camera.s3_cam` 实测：

| 指标 | 实测值 |
|---|---|
| 单帧耗时 | **0.24 ~ 2.98 秒** |
| 空闲时设备帧率 | 0.1 fps（`idle_framerate` 休眠） |
| HA 实体 `supported_features` | 0（无流能力） |

慢的根因有三层：

1. **设备在睡觉**。ESPHome 的 `esp32_camera` 默认 `idle_framerate: 0.1fps`，没人看时几乎停帧，每次请求要先唤醒传感器、重新出图。
2. **按需单帧模型**。ESPHome 原生 API 的摄像头是"请求一帧给一帧"，不是持续流；HA 的 `camera_proxy` 每次都要走完整条请求链。
3. **没有流能力**。`supported_features=0` 意味着 HA 的 WebRTC/HLS 转发在这个实体上根本不可用——不是配置问题，是设备端没有流可转。

结论：在"请求-响应"模型里优化缓存只能治标，要治本必须让设备**主动持续出流**。

## 二、先认清硬件事实：ESP32-S3 没有 H.264

选方案前先把芯片能力摆清楚，这一步能省掉大量无效尝试：

| 方案 | ESP32-S3 可行性 | 说明 |
|---|---|---|
| RTSP / H.264 | ❌ | S3 **没有硬件 H.264 编码器**，软编码在 640x480 下帧率惨不忍睹 |
| WebRTC / HLS（HA 转发） | ❌ | 依赖上游有流；ESPHome 摄像头实体无流能力 |
| **MJPEG over HTTP** | ✅ | OV2640 传感器**硬件输出 JPEG**，ESP32 只做搬运，这是硬件下限 |
| 升级 ESP32-P4 | ✅（换硬件） | P4 带硬件 H.264 编码器，才是 WebRTC 的正解 |

MJPEG 的本质是"一个 HTTP 长连接里连续发 JPEG"，服务端 `Content-Type: multipart/x-mixed-replace`，浏览器 `<img>` 原生支持。640x480 @ 15fps 下帧间隔约 67ms，加上曝光、JPEG 搬运、WiFi 传输与解码，**端到端延时预期 0.2~0.4 秒**——比抓拍模式快一个数量级，且不需要任何转码。

代价也要说清楚：MJPEG 没有帧间压缩，带宽约为同画质 H.264 的 5~10 倍（640x480 q12 约 2~5 Mbps，视画面复杂度），无音频，只适合局域网。家庭监控场景这些都可以接受。

## 三、固件侧：ESPHome 一个组件搞定（含防卡顿配置）

ESPHome 自带 `esp32_camera_web_server` 组件，两种模式：`snapshot`（单帧）和 `stream`（持续 MJPEG）。我们要后者。下面是**最终上线版**配置——注意 `power_save_mode`、`frame_buffer_count`、`agc_gain_ceiling` 三处，它们是后来排查流卡顿才补上的，缺一个都会卡（第五节详述）：

```yaml
esphome:
  name: esp32-s3-cam

esp32:
  board: esp32-s3-devkitc-1
  framework:
    type: arduino

psram:
  mode: octal        # S3-CAM 的 PSRAM 是 octal，配错会出图异常
  speed: 80MHz

api:                 # 保留：HA 集成、OTA、快照都靠它
ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  power_save_mode: none   # 关键！默认 modem sleep 会让推流忽快忽慢

i2c:
  - id: camera_i2c
    sda: GPIO4
    scl: GPIO5

esp32_camera:
  name: "S3 摄像头"
  external_clock:
    pin: GPIO15
    frequency: 20MHz
  i2c_id: camera_i2c
  data_pins: [GPIO11, GPIO9, GPIO8, GPIO10, GPIO12, GPIO18, GPIO17, GPIO16]
  vsync_pin: GPIO6
  href_pin: GPIO7
  pixel_clock_pin: GPIO13
  resolution: 640x480
  frame_buffer_count: 2   # 关键！单缓冲会因发送反压丢帧卡顿
  max_framerate: 15 fps
  idle_framerate: 0.1 fps   # 没人看流时继续省电休眠
  jpeg_quality: 12
  agc_gain_ceiling: 16x   # 限制自动增益，夜景不至于曝光拉满掉帧率

# 关键新增：MJPEG 直推口
esp32_camera_web_server:
  - port: 8080
    mode: stream

# 流冻死时远程自救（web_server 单连接卡死只能重启恢复）
button:
  - platform: restart
    name: "S3 摄像头重启"
```

三个容易踩的点：

- **引脚表**：ESPHome 官方文档没有 Ai-Thinker S3-CAM 的示例，用 **S3-EYE 族**引脚即可（上面这份已实测出图）。错引脚只会 probe 失败，OTA 可修，无变砖风险。
- **流激活时相机跑满帧率**：`stream` 模式有客户端连接时相机会按 `max_framerate` 持续工作，功耗和发热明显上升。所以后面的转发服务做了"无人观看自动断流"，让设备平时继续休眠。
- **重启按钮不是装饰**：ESP32 的 httpd 有一个罕见的僵尸态（第五节），一旦发生只有重启能救。把它暴露成 HA 按钮，转发服务就能自动按（第七节）。

烧录不需要串口：在树莓派的 ESPHome 容器里编译，然后 OTA 无线推送：

```bash
docker exec esphome esphome compile /config/esp32_s3_cam.yaml
docker exec esphome esphome upload /config/esp32_s3_cam.yaml --device esp32-s3-cam.local
```

刷完 `curl http://esp32-s3-cam.local:8080/` 能看到 multipart 头即成功。

## 四、单客户端限制：服务端拉一路、分发 N 路

`esp32_camera_web_server` 的 `stream` 模式**同一时间只接受一个客户端**。浏览器直接连设备的话，开第二个标签页就黑屏，HA 想同时取流也会被挤掉。

正解是在树莓派上加一层转发：后端只拉一路设备流，按 multipart 边界切出 JPEG，缓存**最新一帧**，再向任意多个浏览器分发。架构：

```text
ESP32-S3-CAM :8080 ──(1 路 MJPEG)──> 树莓派 grabber 线程
                                        │ 按 boundary 切帧，只存最新帧
                                        ▼
                                   /api/camstream ──(N 路 MJPEG)──> 浏览器 1..N
                                   /api/camstat   ──(JSON 心跳)───> 前端存活判定
                                   /api/cam       ──(单帧 JPEG)───> 快照回退
```

全部 Python 标准库实现，无第三方依赖。拉流切帧核心（最终版，含 linger 与 read1，原因见第五节）：

```python
CAM_STREAM = "http://esp32-s3-cam.local:8080/"
CAM_LINGER = 30.0   # 最后一个浏览器离开后继续拉流 30s 再断上游
_camlock = threading.Lock()
_cam = {"frame": None, "ts": 0.0, "seq": 0, "clients": 0,
        "worker": None, "last_client": 0.0}

def _cam_grabber():
    """从 ESP32 MJPEG 口拉流，按 multipart 边界切帧，只保留最新一帧。"""
    while True:
        with _camlock:
            if _cam["clients"] == 0 and time.time() - _cam["last_client"] > CAM_LINGER:
                _cam["worker"] = None      # 无人观看超过 linger：断上游，设备回休眠
                return
        try:
            r = urllib.request.urlopen(CAM_STREAM, timeout=10)
            ctype = r.headers.get("Content-Type", "")
            boundary = None
            for part in ctype.split(";"):
                part = part.strip()
                if part.startswith("boundary="):
                    boundary = part[9:].strip('"').encode()
            if boundary is None:
                boundary = b"123456789000000000000987654321"  # ESPHome 默认
            delim = b"--" + boundary
            buf = b""
            while True:
                with _camlock:
                    if _cam["clients"] == 0 and time.time() - _cam["last_client"] > CAM_LINGER:
                        r.close(); _cam["worker"] = None; return
                # read1：有多少读多少。read(N) 会阻塞到攒满 N 字节，
                # 小帧场景下凭空增加数秒延时
                chunk = r.read1(65536) if hasattr(r, "read1") else r.read(16384)
                if not chunk:
                    break
                buf += chunk
                while True:
                    i = buf.find(delim)
                    j = buf.find(delim, i + len(delim)) if i >= 0 else -1
                    if i < 0 or j < 0:
                        break
                    part = buf[i + len(delim):j]
                    buf = buf[j:]
                    k = part.find(b"\xff\xd8")   # JPEG SOI 魔数
                    if k < 0:
                        continue
                    with _camlock:
                        _cam["frame"] = part[k:].rstrip(b"\r\n")
                        _cam["ts"] = time.time()
                        _cam["seq"] += 1
                if len(buf) > 4 * 1024 * 1024:   # 防异常流撑爆内存
                    buf = b""
        except Exception:
            time.sleep(2)                        # 设备重启/断网，2s 后重连
```

分发端给每个浏览器开一个循环，只在 `seq` 变化时写帧（40ms 一拍，约 25fps 上限，足够跟上设备的 15fps）。注意**12 秒宽限**：缓存帧过期不能立即断开，否则冷启动/设备恢复期间前端会陷入重试风暴：

```python
def cam_stream(self):
    with _camlock:
        _cam["clients"] += 1
        _cam["last_client"] = time.time()
        if _cam["worker"] is None:
            _cam["worker"] = threading.Thread(target=_cam_grabber, daemon=True)
            _cam["worker"].start()
    try:
        self.send_response(200)
        self.send_header("Content-Type",
                         "multipart/x-mixed-replace; boundary=hapanel")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        last = -1
        connected = time.time()
        while True:
            with _camlock:
                seq, frame, fts = _cam["seq"], _cam["frame"], _cam["ts"]
            fresh = frame is not None and time.time() - fts <= 12
            if not fresh and time.time() - connected > 12:
                return                # 宽限期满仍无新鲜帧：断开让前端回退快照
            if fresh and seq != last:
                self.wfile.write(
                    b"--hapanel\r\nContent-Type: image/jpeg\r\nContent-Length: "
                    + str(len(frame)).encode() + b"\r\n\r\n" + frame + b"\r\n")
                self.wfile.flush()
                last = seq
            time.sleep(0.04)
    except (BrokenPipeError, ConnectionResetError, OSError):
        pass
    finally:
        with _camlock:
            _cam["clients"] -= 1
            _cam["last_client"] = time.time()   # linger 计时起点
```

这层转发带来三个额外好处：

1. **设备只被一个客户端打扰**，HA 的 ESPHome 原生摄像头（快照、自动化触发）不受影响；
2. **无人观看自动断上游**（30s linger 后），设备回到 0.1fps 休眠，功耗发热与改造前一致；
3. 快照接口 `/api/cam` 可以优先返回流里 3 秒内的新鲜帧，回退路径也变快了。

## 五、流卡顿的最后一公里：modem sleep 与单缓冲反压

第一版上线后画面能动，但**忽快忽慢，偶尔冻结十几秒**，而单帧抓拍始终正常。排查走了三步，每一步都反直觉：

**第一步：先怀疑网络，用 ping 定量。** 设备 WiFi 信号满格，但 `ping esp32-s3-cam.local` 出现秒级延迟尖峰——信号好却延迟大，这是 ESP32 **WiFi modem sleep** 的典型指纹：默认省电模式下射频周期性休眠，TCP 发送要等唤醒窗口。修复一行：`wifi: power_save_mode: none`。摄像头是常供电设备，省电模式纯属负优化。

**第二步：设备直连稳定、经转发就卡 → 查采集侧。** 用脚本直连设备 8080 口拉流计数，帧率稳定；问题出在 grabber。两个根因：

- `esp32_camera` 默认 `frame_buffer_count: 1`：发送稍慢，采集就没有空缓冲可写，**整帧丢弃**，表现为帧率抖动。改 2 后采集与发送解耦。
- Python 的 `r.read(16384)` 会**阻塞到攒满 16384 字节**才返回。夜景 JPEG 一帧才几 KB，攒满要等好几帧——凭空引入数秒延时。改 `r.read1(65536)`（有多少读多少）后帧龄立刻降到 0.1s 以内。

**第三步：间歇性停顿的元凶——httpd 僵尸窗口。** 修完前两步仍偶发 2~4 分钟的完全冻结。交叉对比发现规律：**每次冻结都发生在浏览器刷新/切页之后**。ESP32 的 `esp32_camera_web_server` 是单连接 httpd，客户端中途断开后它会进入"卡在发送"的僵尸态，期间拒绝一切新连接，只能等超时或重启。而转发服务旧逻辑"缓存帧过期→立即 EOF→前端自动重试"恰好制造了重连 churn，反复触发这个僵尸窗口。

修复就是第四节的**加固三件套**：

1. **12s 宽限**：分发端缓存帧过期不立即 EOF，给 grabber 冷启动/设备恢复留时间；
2. **30s linger**：最后一个浏览器离开后 grabber 继续拉流 30s（丢弃帧），刷新/切页不再触发设备连接的 stop/start；
3. **read1 读流**：消灭攒缓冲延时。

三件套上线后冻结消失。教训：**对单连接嵌入式 httpd，"快速失败快速重试"是反模式，保持连接稳定比什么都重要。**

## 六、浏览器端大坑：Chrome 不逐帧触发 load

这是整个改造里最反直觉的一点：`<img src="multipart流">` 在 Chrome 里**只有首帧触发 `load` 事件**，后续帧静默替换画面。如果你用 `onload` 更新"最后画面时间"或判定 LIVE，时间戳会永远卡在首帧——画面明明在动，UI 却显示离线。

正解是**存活判定走服务端心跳**，与画面渲染解耦。后端加一个 `/api/camstat`：

```python
# {"seq": 帧序号, "age": 最新帧年龄(秒), "clients": 在线浏览器数}
```

前端每 2 秒查一次，`age < 4` 即 LIVE；流断了自动回退 1.5 秒快照轮询，30 秒后重试流模式：

```javascript
async function camCheck() {
  if (camMode !== "stream") {
    if (Date.now() - lastFrame > 8000) camDead();
    return;
  }
  try {
    const s = await (await fetch("/api/camstat")).json();
    if (s.age != null && s.age < 4) camLive();          // 心跳新鲜 → LIVE
    else if (Date.now() - lastFrame > 6000) camSnapshotMode();
  } catch (e) {
    if (Date.now() - lastFrame > 6000) camSnapshotMode();
  }
}
setInterval(camCheck, 2000);
```

顺带一提，控制类控件要做到"秒级以内"，光靠 1 秒轮询还不够，还要**乐观更新**：点击瞬间先按预期渲染 UI，2.5 秒内设备真值追上即确认，超时回滚。视频走流、状态走快轮询、交互走乐观更新，三层叠加才是完整的"实时模式"。

## 七、断流自愈：让面板自己按重启按钮

加固三件套消灭了已知冻结路径，但嵌入式设备总有意外（WiFi 掉线、httpd 未知卡死）。最后一道保险是**自愈**：grabber 发现"有观看者且超过 60 秒没有新帧"时，自动调 HA 服务按下第三节暴露的重启按钮：

```python
CAM_HEAL_AFTER = 60.0      # 停滞阈值
CAM_HEAL_COOLDOWN = 300.0  # 冷却，防重启循环

def _cam_maybe_heal(started):
    with _camlock:
        if _cam["clients"] == 0:          # 没人看就不折腾设备
            return
        now = time.time()
        last = _cam["ts"] or started      # 从未出帧时以 worker 启动时刻计
        if now - last < CAM_HEAL_AFTER or now - _cam["heal_ts"] < CAM_HEAL_COOLDOWN:
            return
        _cam["heal_ts"] = now
    ha_req("/api/services/button/press", {"entity_id": CAM_RESTART_BTN})
```

两个设计细节：**冷却 300 秒**是防重启循环的关键——设备重启+回连约 10~20 秒，远小于冷却，正常恢复不会触发第二次；**只在有观看者时触发**，没人看时设备爱睡睡，不浪费重启。实测模拟停滞后按钮调用准确发出，冷却期内不重复。

## 八、要不要接回 HA？一个名额的取舍

固件暴露 8080 之后，HA 其实多了一个选项：用自带的 **MJPEG IP Camera** 集成直接消费 `http://esp32-s3-cam.local:8080/`，HA 里也能拿到低延时画面。

但注意第四节的名额问题：**设备只接受一个流客户端**。HA 的 MJPEG 集成和树莓派转发服务只能二选一。我的取舍是：

- **转发服务做唯一流消费者**，自绘面板的所有浏览器共享这一路；
- HA 保留 ESPHome 原生摄像头实体，负责快照、移动侦测类自动化——这些是单帧语义，本来就不需要流。

如果未来换 ESP32-P4（硬件 H.264），就可以走 go2rtc/WebRTC，HA 原生体验与多客户端兼得，那是下一阶段的升级路线。

## 九、实测与验证（最终上线数据）

树莓派 4B + Ai-Thinker ESP32-S3-CAM，640x480@15fps，固件 2026-11-19 OTA 推送（上传 21 秒），面板同日部署上线：

| 项 | 抓拍模式 | MJPEG 直推 + 转发（最终版） |
|---|---|---|
| 画面更新 | 0.24 ~ 2.98 s/帧 | 持续流，**夜景 12.8fps / 亮景 13.4fps** |
| 服务端帧龄 | 每次请求现唤醒 | **≤0.08s**（心跳连续采样） |
| 端到端延时 | 秒级 | ~0.2~0.4s（帧龄 + 分发 ≤40ms + 解码） |
| 冷启动/重连首帧 | — | **0.22s**（linger 内重连秒出帧） |
| 多浏览器 | 各自请求互相挤占 | 一路拉流 N 路分发 |
| 无人观看 | 设备休眠 | 同样休眠（30s linger 后自动断） |
| 断流恢复 | — | 快照回退 + 30s 重试 + **60s 停滞自愈重启** |

实测还有两个反直觉的现象：

- **夜景纯黑时相邻帧字节完全相同**。关灯后画面是静态纯黑，JPEG 编码确定性输出，隔 1 秒抓两帧哈希一致——但这不代表流死了。判活必须看 `seq` 是否增长、`age` 是否新鲜，不能比帧内容。
- **低照度会拉低帧率**。自动曝光在暗光下延长单帧曝光时间，fps 会下降；`agc_gain_ceiling: 16x` 限制增益后夜景仍稳在 12.8fps。带宽实测仅 ~0.4Mbps（夜景 q12），比预估低一个量级，白天复杂画面会更高。

转发服务用 mock MJPEG 源做了 **13 项回归**（纯标准库、不触真机）：流首帧、fan-out 边界、12s 宽限不立即 EOF、linger 保持与到期退出、快照回退、自愈触发与冷却均在列。有三个测试环境的坑值得单独记：

- **Windows 的 `SO_REUSEADDR` 允许两个进程绑定同一端口且都"成功"**，mock 与演示服务撞端口时测试会连到错误的流，数据看似正常实则全错。mock 端口必须与常驻进程错开。
- multipart 切帧不要按 `\r\n\r\n` 找头结束，直接找 JPEG SOI（`FF D8`）魔数最稳，不同固件的头部格式差异全部免疫。
- 测"停滞自愈"时要先等上一个测试残留的 grabber 线程退出，否则它会回连 mock 源补帧，让停滞永远不成立。

## 十、代码与后续

完整实现都在项目仓库里：固件配置 `esphome/esp32_s3_cam.yaml`，转发服务与前端 `ha-panel/serve.py`（单文件、纯标准库），回归 `ha-panel/test_serve.py`。**整套已部署上线**：面板摄像头卡片 LIVE 常绿，控制类控件延时 <1s。后续路线：一是把实时模式推广到监控面板其余页面，二是换 ESP32-P4 走硬件 H.264 + WebRTC。

如果你手上也是 ESP32-S3 + OV2640 的组合，记住一句话就够了：**别找 H.264，MJPEG 直推就是这块芯片的天花板，而天花板已经够低延时了。**
