Fish brings robot-fish control, match operations, and live video into one platform. Following the order of development, this article explains the platform's purpose, technology choices, device communication, public web access, video transport, and match recording. It focuses on design and implementation decisions rather than screenshots of the finished interface.

**Build sequence:** define service responsibilities → connect the browser and ESP32 control channel → expose the web entry through Tunnel → establish direct, TURN, and snapshot video paths → add match recording, replay, and download.

Descriptions of the “current implementation” refer to Fish code reviewed in October 2026. Later changes are not automatically reflected here.

## Platform goals and functions

| User | Main capability |
| --- | --- |
| Player | Control an assigned robot fish and watch the match video |
| Referee | Assign devices, run the clock and scoring, adjust the picture, and record and replay matches |
| Administrator | Monitor devices and manage firmware updates |

The platform consists of a browser, a Go control service, ESP32 firmware, and a Python video service. Commands, web requests, and video media take different paths, so access, connection maintenance, and failure handling must be designed separately.

## 1. Service responsibilities and technology choices

![Request and media paths between the browser, Go, ESP32, and Python](/projects/fish/frontend-backend-flow.svg)

| Part | Original choice | Reason at the time |
| --- | --- | --- |
| Control service | Go | I was learning Go and wanted to try server development, without prior experience on a comparable project |
| Video service | Python | Existing Python video tools made it practical to reuse camera and processing code |
| Web frontend | Plain pages alongside React | I had little frontend or backend project experience and initially relied mainly on AI suggestions |

### How the frontend and backend technologies fit together

| Technology | Role in Fish | Boundary to keep in mind |
| --- | --- | --- |
| Plain HTML, CSS, and JavaScript | Build the match page and handle interaction, control messages, and video playback | Direct DOM logic needs clearer separation of events, state, and styles as features grow |
| React | Organize the administration console into components with managed state and data flow | React is used for the console, not for the entire frontend |
| Vite | Provide the development and build workflow for both frontend entries | It is a build tool, not a replacement for UI architecture or state organization |
| Go | Serve HTTP APIs and control connections; maintain accounts, device assignment, control leases, and match state | Go authorizes and routes commands; normal WebRTC media does not pass through it |
| Python | Reuse camera and video tools, provide WebRTC tracks through asyncio-based aiortc, and record on the host | Browser playback state must not be mistaken for recording state |

The ESP32 firmware executes motion and retains an independent local stop mechanism. Using different UI approaches for the match page and console has made styles and interactions more costly to maintain.

**Recommendation in hindsight:** keep the existing plain match page and React console for now. First unify style tokens such as colors and spacing, and separate control state, network requests, and video playback from direct DOM manipulation. Continue using React for new administration features. If the match page grows and shared state or interactions become the main maintenance burden, evaluate a gradual migration. Measure page load and time to first video frame separately; the framework choice alone does not explain either result.

## 2. Communication between the web page and ESP32

The browser does not connect directly to the robot fish. The browser and ESP32 each maintain a WebSocket connection to Go. Go verifies the account, device assignment, and control lease before forwarding a command; the device reports state and telemetry back to Go.

![Control messages and disconnection recovery between the browser, Go, and ESP32](/projects/fish/communication-lifecycle.svg)

| Stage | Current implementation | On disconnection or timeout |
| --- | --- | --- |
| Browser → Go | HTTP handles login and device assignment; commands use same-origin `/ws/control`, while device state arrives through SSE | Reconnect the control WebSocket; reacquire the lease if control authority has expired |
| ESP32 → Go | The device initiates `/ws/device` and proves its identity with a random challenge and HMAC; commands and state use JSON | Firmware stops motion, then tries to reconnect and register |
| Connection maintenance | Go uses WebSocket Ping/Pong; the device also sends application heartbeats and status | Close a timed-out connection and mark the device offline |
| Motion admission | Go checks the lease, command order, and deadline; firmware checks the motion expiry | Clear old motion and enqueue STOP; firmware can also stop locally |

A live connection does not mean an old motion command should continue running. Connection timeout and motion expiry are separate safeguards: an expired action should stop even before a network failure is formally detected. A reconnected browser must still pass control authorization.

![Motion command admission and stopping from browser to ESP32](/projects/fish/control-flow.svg)

New control entry points should reuse Go's admission logic and preserve queue deadlines, STOP, and firmware-local stopping. The firmware's safe stop ends oscillation and returns to the center angle; it does not cut power to the servos.

## 3. Frontend access path and public web entry

Fish runs on a local computer. The project has a domain that can be used long term, but the host lacks a publicly reachable IP address for inbound access. Initially, remote users could open neither the web page nor the live video. This section addresses how the browser loads the frontend, calls APIs, and exchanges signaling; video frames use the separate media paths in the next section.

![Remote browser reaching Go through Cloudflare Tunnel](/projects/fish/public-access.svg)

| Frontend traffic | Path |
| --- | --- |
| Pages and static assets | Browser → long-lived domain → Cloudflare → Tunnel → Go; Go returns HTML, CSS, and JavaScript |
| HTTP APIs and signaling | The browser calls Go through the same entry; WebRTC offer/answer is exchanged over HTTP, and Go calls the local Python API |
| Control WebSocket | The browser reaches Go's `/ws/control` through the same entry; JPEG fallback also uses the same-origin path |

`cloudflared` on the Fish host establishes the Tunnel outbound. The existing domain can therefore serve as a stable web entry without a publicly reachable inbound IP address. This entry carries pages, APIs, control messages, and signaling. Normal WebRTC media is neither forwarded by Go nor carried through Tunnel. A page loading successfully does not establish that video can connect directly.

## 4. Video media paths and fallback

At first, a remote client could not directly reach the Fish host running the Go and Python video services. Even after the frontend path was available, camera video still needed a media path from that host to the browser. “Device” here means the Fish host, not the ESP32 robot fish.

Python captures camera frames and exposes a WebRTC video track through aiortc. The browser exchanges connection descriptions through Go's HTTP API. Media first attempts a direct connection, then TURN if direct access fails. If neither WebRTC path works, Go forwards JPEG snapshots over a same-origin WebSocket.

### Why WebRTC needs signaling and ICE

| Connection stage | General principle | Fish implementation |
| --- | --- | --- |
| Signaling | Peers exchange offer/answer descriptions; WebRTC does not mandate a particular signaling transport | The browser exchanges descriptions with Python through Go's HTTP API; the web entry negotiates but does not carry normal video media |
| ICE connectivity checks | Peers gather candidate addresses and test which network path can connect; TURN can relay when direct access is unavailable | Fish first tries a host-candidate-only direct connection, then a separate relay-candidate-only TURN attempt |
| Media delivery | After connection, the browser receives frames on a WebRTC video track | Fish also checks the first frame and subsequent updates; connection state alone does not prove that video remains usable |

These stages explain why “the website opens” and “the video plays” require separate checks. The direct-then-TURN sequence is Fish's current selection policy, not a sequence mandated by WebRTC for every application.

![WebRTC signaling and the direct, TURN, and JPEG media paths](/projects/fish/media-path.svg)

The project was experimental when TURN was added, so the separate relay path also allowed its behavior to be observed. TURN is attempted after direct failure; the design does not assume that relaying is faster.

### How direct reachability is determined

If both the visitor PC's and Fish host's private addresses are available, comparing IP addresses and subnet masks can suggest that they may share a subnet. It cannot prove media reachability. When the web page is accessed through Tunnel, Go also cannot recover the PC's private IP from the web request source. The current selector does not compare IPs; it tests ICE connectivity, first-frame arrival, and continued frame updates.

![Testing whether the browser can use a direct media path to the Fish host](/projects/fish/lan-reachability.svg)

### How failure falls back

![Fallback from direct WebRTC to TURN and JPEG snapshots](/projects/fish/video-fallback.svg)

A failed or interrupted connection, ended video track, decode error, first-frame timeout, or sustained stale video advances to the next stage. JPEG snapshots are the final fallback when WebRTC is unavailable: Go obtains frames from Python and sends only updated JPEGs to the browser. The snapshot WebSocket reconnects after disconnection. This adds another possible path, but it also fails if the same-origin web connection is unavailable; it is not an absolute availability guarantee.

The current implementation degrades in order: **direct → TURN → snapshots**. Once a session enters snapshot mode, it only reconnects the snapshot stream and does not automatically return to WebRTC. Continuous comparison of latency or loss and automatic selection of the best path remain under development.

## 5. Live match video, recording, replay, and download

Live video lets participants observe the match. Recording, replay, and download complete the post-match record for review, dispute checks, and archiving. The USB camera is connected to the Fish host, where Python already captures the frames, so recording is produced on the host rather than by capturing the browser's playback.

![USB camera frames branching into live video and host recording, then replay and download](/projects/fish/competition-video-lifecycle.svg)

After rotation and cropping to the players' active area, the same processed frame source feeds live video and server-side recording. Live video follows the media paths above. Recording is independently encoded as H.264 MP4, using real capture timestamps and a capped encoding frame rate rather than duplicating frames to fill gaps. A browser WebRTC failure does not itself stop host recording; recording depends on the camera and recorder state.

![Device assignment, recording start, match pause, and replay flow](/projects/fish/competition-flow.svg)

| Stage | Current implementation | Boundary to preserve |
| --- | --- | --- |
| Start | Confirm real camera frames; Go asks Python to start recording, then starts the clock only after success | A recording failure blocks an official start |
| Pause | Pause the clock while recording continues | Keep clock and recording states separate |
| Finish | Python finalizes the MP4; Go stores the video address and encoding statistics in the match record | Replay uses the finalized file, not the live connection |
| Replay | The browser plays the MP4 through an authenticated same-origin HTTP endpoint and can jump to scoring events | HTTP Range enables seeking; events need timestamps |
| Download | The browser obtains the MP4 through the same endpoint and saves it | The current client first loads the entire file into memory, which increases use for large videos |

Recording retains the same framing as the players' live view. Rotation and active-area settings should not be changed during a recording. Replay and download use Go-proxied HTTP file endpoints, not the live TURN path.

Official documentation: [React](https://react.dev/learn) · [Go net/http](https://pkg.go.dev/net/http) · [aiortc](https://aiortc.readthedocs.io/en/latest/) · [WebRTC peer connections](https://webrtc.org/getting-started/peer-connections) · [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/concepts/) · [Cloudflare TURN](https://developers.cloudflare.com/realtime/turn/generate-credentials/)
