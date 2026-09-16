---
title: 项目
layout: page
comments: false
---

<div class="ph-projects">
  <div class="ph-projects-head">
    <span class="ph-kicker">BUILDING · PROJECT ARCHIVE</span>
    <h1>项目</h1>
    <p>这里不是 GitHub 链接列表，而是持续更新的工程档案。每个项目会逐步关联开发日志、知识笔记、工具和仓库。</p>
  </div>

  <div class="ph-project-filters" role="group" aria-label="项目筛选">
    <button class="active" data-filter="all">全部</button>
    <button data-filter="active">进行中</button>
    <button data-filter="research">研究</button>
    <button data-filter="software">软件</button>
    <button data-filter="embedded">嵌入式</button>
  </div>

  <div class="ph-project-list">
    <article class="ph-project" data-kind="active embedded">
      <div class="ph-project-main"><span class="ph-status ph-green">ACTIVE · ROBOTICS</span><h2>Fish Robot Platform</h2><p>面向机器人鱼的控制平台，覆盖 ESP32 设备端、WebSocket 通信、OTA、舵机/RGB 控制以及可视化 Web UI。</p><div class="ph-tags"><span>ESP32</span><span>WebSocket</span><span>OTA</span><span>Robot</span><span>Web UI</span></div><div class="ph-links"><a href="https://github.com/FukunHennan">GitHub ↗</a><a href="/zh-CN/notes/">相关 Notes →</a></div></div><b class="ph-no">01</b>
    </article>
    <article class="ph-project" data-kind="research active">
      <div class="ph-project-main"><span class="ph-status ph-purple">RESEARCH · VISION</span><h2>DVS + RGB Camera System</h2><p>事件相机与 Hikrobot RGB 相机的双目标定、同步、视场映射和多模态视觉融合实验。</p><div class="ph-tags"><span>DVS</span><span>RGB</span><span>OpenCV</span><span>Calibration</span><span>Fusion</span></div><div class="ph-links"><a href="/zh-CN/notes/">视觉笔记 →</a></div></div><b class="ph-no">02</b>
    </article>
    <article class="ph-project" data-kind="software active">
      <div class="ph-project-main"><span class="ph-status ph-blue">SOFTWARE · DESKTOP</span><h2>Service Center</h2><p>面向 Linux / Windows 的本地服务管理中心：服务注册、端口、日志、健康状态、systemd / SCM 与 MCP。</p><div class="ph-tags"><span>Python</span><span>Tauri</span><span>Vue</span><span>systemd</span><span>MCP</span></div><div class="ph-links"><a href="/zh-CN/notes/">相关 Notes →</a></div></div><b class="ph-no">03</b>
    </article>
    <article class="ph-project" data-kind="embedded">
      <div class="ph-project-main"><span class="ph-status ph-orange">LAB · EMBEDDED</span><h2>ESP32 Lab</h2><p>无线下载、网络、传感器、供电与嵌入式实验的长期集合，作为其他项目的基础技术实验场。</p><div class="ph-tags"><span>ESP32-C3</span><span>ESP32-S3</span><span>Wi-Fi</span><span>OTA</span><span>Hardware</span></div><div class="ph-links"><a href="/zh-CN/notes/">ESP32 Notes →</a><a href="/zh-CN/tools/">工具箱 →</a></div></div><b class="ph-no">04</b>
    </article>
  </div>
</div>

<style>
.ph-projects{max-width:1120px;margin:0 auto;padding:18px 0 56px}.ph-projects-head{padding:30px 0 26px}.ph-kicker,.ph-status{font-size:11px;font-weight:800;letter-spacing:.14em;color:#2563eb}.ph-projects-head h1{font-size:clamp(3.2rem,7vw,5.8rem);line-height:1;margin:.15em 0;letter-spacing:-.055em}.ph-projects-head p{max-width:720px;opacity:.68;font-size:1.08rem;line-height:1.8}.ph-project-filters{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 28px}.ph-project-filters button{appearance:none;border:1px solid rgba(100,116,139,.2);background:transparent;color:inherit;border-radius:999px;padding:8px 14px;cursor:pointer;transition:.2s}.ph-project-filters button:hover,.ph-project-filters button.active{color:#2563eb;background:rgba(37,99,235,.1);border-color:rgba(37,99,235,.25)}.ph-project-list{border-top:1px solid rgba(100,116,139,.18)}.ph-project{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:28px;padding:34px 8px;border-bottom:1px solid rgba(100,116,139,.18);transition:.25s}.ph-project:hover{padding-left:18px;background:linear-gradient(90deg,rgba(37,99,235,.045),transparent)}.ph-project[hidden]{display:none}.ph-project-main{max-width:800px}.ph-project h2{font-size:clamp(1.7rem,3vw,2.45rem);letter-spacing:-.035em;margin:.3em 0}.ph-project p{opacity:.68;line-height:1.75}.ph-no{font-size:3.8rem;line-height:1;color:rgba(100,116,139,.13)}.ph-green{color:#16a34a}.ph-purple{color:#7c3aed}.ph-blue{color:#0284c7}.ph-orange{color:#ea580c}.ph-tags,.ph-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.ph-tags span{font-size:.78rem;padding:6px 10px;border:1px solid rgba(100,116,139,.2);border-radius:999px}.ph-links{gap:18px}.ph-links a{font-size:.85rem;font-weight:700;color:#2563eb}.ph-links a:hover{text-decoration:underline}@media(max-width:650px){.ph-project{grid-template-columns:1fr;padding:26px 4px}.ph-project:hover{padding-left:4px}.ph-no{display:none}}
</style>

<script>
(function(){function bind(){var root=document.querySelector('.ph-projects');if(!root||root.dataset.bound)return;root.dataset.bound='1';var buttons=root.querySelectorAll('[data-filter]'),items=root.querySelectorAll('.ph-project');buttons.forEach(function(btn){btn.addEventListener('click',function(){buttons.forEach(function(x){x.classList.remove('active')});btn.classList.add('active');var f=btn.dataset.filter;items.forEach(function(item){item.hidden=f!=='all'&&!item.dataset.kind.split(' ').includes(f)})})})}document.addEventListener('DOMContentLoaded',bind);document.addEventListener('swup:contentReplaced',bind);bind()})();
</script>