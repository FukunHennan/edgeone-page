---
title: 简历
layout: page
comments: false
---

<div class="resume-page">
  <div class="resume-toolbar">
    <div class="resume-toolbar-info">
      <h1>简历 · 可直接导出 PDF</h1>
      <p>点击「编辑内容」可直接修改下方简历，改动自动保存在本机浏览器；点击「导出 PDF」立即生成并下载 A4 简历文件，可直接发送给 HR。</p>
    </div>
    <div class="resume-toolbar-actions">
      <button type="button" class="resume-btn ghost" id="resume-edit">编辑内容</button>
      <button type="button" class="resume-btn ghost" id="resume-reset">重置内容</button>
      <button type="button" class="resume-btn primary" id="resume-print">导出 PDF</button>
    </div>
  </div>
  <div class="resume-sheet-wrap">
    <div class="resume-sheet" id="resume-sheet">
<header class="r-head">
<div class="r-head-main">
<h2 class="r-name" data-field="name">陈富坤</h2>
<p class="r-target" data-field="target">求职意向：嵌入式 / 自动化工程师</p>
</div>
<ul class="r-contact">
<li data-field="phone">电话：15039416203</li>
<li data-field="email">邮箱：15039416203@163.com</li>
<li data-field="github">GitHub：github.com/FukunHennan</li>
<li data-field="location">地址：河南省周口</li>
</ul>
</header>
<section class="r-block">
<h3 class="r-title">教育背景</h3>
<div class="r-row">
<span class="r-org" data-field="edu-school">黄淮学院 · 自动化（本科）</span>
<span class="r-date" data-field="edu-date">2022.09 – 2026.06</span>
</div>
<p class="r-line" data-field="edu-courses">主修课程：C 语言、微机原理、嵌入式开发与应用、单片机原理及应用、数字 / 模拟电子技术、PLC 技术、自动控制原理、电路分析。</p>
</section>
<section class="r-block">
<h3 class="r-title">专业技能</h3>
<ul class="r-skills">
<li data-field="skill-1"><b>通信协议：</b>熟悉 UART、IIC、SPI、CAN、ModBus 及 TCP/IP、HTTP、MQTT 的原理与实际应用。</li>
<li data-field="skill-2"><b>开发环境：</b>熟悉 MDK、VSCode、CubeMX 及 RT-Thread、FreeRTOS 等嵌入式实时操作系统。</li>
<li data-field="skill-3"><b>硬件设计：</b>熟练运用嘉立创 EDA、SolidWorks 进行硬件设计及三维建模。</li>
<li data-field="skill-4"><b>上位机开发：</b>熟练使用 C# 及 QT 进行上位机开发，具备 PLC 与 NI 数据采集卡联合调试经验。</li>
</ul>
</section>
<section class="r-block">
<h3 class="r-title">项目经历</h3>
<div class="r-item">
<div class="r-row">
<span class="r-org" data-field="p1-name">非标自动化流水线 · 数字孪生系统</span>
</div>
<p class="r-line" data-field="p1-desc">基于西门子 S7-1500 主控的数字孪生系统，使用 UG 完成机械设计与 3D 建模、Eplan 完成电气设计，结合 TIA 实现数字化控制与系统集成，最终迭代为单片机替代 PLC；使用 C# / QT 开发 PLC 与 NI 采集卡联合调试上位机及自定义串口上位机。</p>
</div>
<div class="r-item">
<div class="r-row">
<span class="r-org" data-field="p2-name">水下机器人（控制部分）</span>
</div>
<p class="r-line" data-field="p2-desc">硬件基于 STM32F407、软件基于 HAL 库开发；通过 IMU 与扩展 ADC 进行姿态检测和环境感知，以舵机、无刷电机为动力，采用 Modbus RTU 通信，并与 Linux 设备约定数据格式，完成传感器数据上传与动力命令下发。</p>
</div>
<div class="r-item">
<div class="r-row">
<span class="r-org" data-field="p3-name">ESP32 物联网与图形化编程</span>
</div>
<p class="r-line" data-field="p3-desc">在青少年编程培训班兼职，从事以 ESP32 为主的物联网开发、图形化编程研究、图形化函数库开发及手机 APP 开发。</p>
</div>
</section>
<section class="r-block">
<h3 class="r-title">获得荣誉</h3>
<p class="r-line" data-field="awards">西门子杯流程行业自动化（省级三等奖）、全国大学生电子设计大赛（省级二等奖）、华中数控数字孪生大赛（省级二等奖）、蓝桥杯多次省级及以上奖项；校三好学生。</p>
</section>
<section class="r-block">
<h3 class="r-title">取得证书</h3>
<p class="r-line" data-field="certs">普通话二级；全国计算机二级（C 语言）。</p>
</section>
<section class="r-block">
<h3 class="r-title">自我评价</h3>
<p class="r-line" data-field="summary">学习能力强，能快速适应新环境与新挑战；做事严谨认真，具备良好的执行力与责任感；善于沟通、乐于合作，注重团队目标，对工作充满热情，积极寻求自我提升。</p>
</section>
    </div>
  </div>
</div>

<style>
/* ===== 屏幕显示样式 ===== */
.resume-page{padding:8px 0 60px}
.resume-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;margin:0 auto 28px;max-width:920px;border:1px solid var(--border-color,#e5e7eb);border-radius:16px;background:var(--card-bg,rgba(255,255,255,.6))}
.resume-toolbar-info h1{margin:0 0 4px;font-size:1.15rem;font-weight:700}
.resume-toolbar-info p{margin:0;font-size:.85rem;opacity:.75;line-height:1.5;max-width:560px}
.resume-toolbar-actions{display:flex;gap:10px;flex-wrap:wrap}
.resume-btn{appearance:none;border:none;cursor:pointer;padding:9px 18px;border-radius:10px;font-size:.9rem;font-weight:600;transition:transform .15s,box-shadow .15s,background .15s,opacity .15s}
.resume-btn:active{transform:translateY(1px)}
.resume-btn:disabled{opacity:.6;cursor:wait}
.resume-btn.primary{background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:#fff;box-shadow:0 8px 20px rgba(79,70,229,.3)}
.resume-btn.ghost{background:transparent;border:1px solid var(--border-color,#d1d5db);color:inherit}
.resume-btn.is-on{background:#4f46e5;color:#fff;border-color:#4f46e5}

.resume-sheet-wrap{display:flex;justify-content:center}
.resume-sheet{width:210mm;flex:0 0 auto;min-height:297mm;background:#fff;color:#1f2937;padding:14mm 15mm;box-sizing:border-box;box-shadow:0 18px 50px rgba(15,23,42,.18);border-radius:2px;font-size:10pt;line-height:1.55;font-family:"Microsoft YaHei","PingFang SC",Arial,sans-serif}

/* 编辑模式 */
.resume-sheet.is-editing [data-field]:hover{outline:1px dashed #a5b4fc;outline-offset:2px;border-radius:3px;cursor:text}
.resume-sheet [data-field]:focus{outline:2px solid #6366f1;outline-offset:2px;border-radius:3px;background:rgba(99,102,241,.05)}

/* ===== A4 简历内部排版 ===== */
.r-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:10px;border-bottom:2.5px solid #1f2937;margin-bottom:12px}
.r-name{margin:0;font-size:21pt;font-weight:800;letter-spacing:2px;color:#111827}
.r-target{margin:6px 0 0;font-size:10.5pt;color:#4b5563}
.r-contact{list-style:none;margin:0;padding:0;text-align:right;font-size:9pt;color:#374151;line-height:1.75}

.r-block{margin-bottom:11px}
.r-title{margin:0 0 5px;font-size:11.5pt;font-weight:700;color:#111827;padding-left:9px;border-left:4px solid #4f46e5;line-height:1.2}
.r-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.r-org{font-weight:700;font-size:10pt;color:#1f2937}
.r-date{font-size:9pt;color:#6b7280;white-space:nowrap}
.r-line{margin:3px 0 0;font-size:9.8pt;color:#374151;text-align:justify}
.r-item{margin-bottom:7px}
.r-item:last-child{margin-bottom:0}
.r-skills{list-style:none;margin:0;padding:0}
.r-skills li{font-size:9.8pt;color:#374151;margin-bottom:2.5px;padding-left:14px;position:relative}
.r-skills li::before{content:"";position:absolute;left:2px;top:8px;width:5px;height:5px;border-radius:50%;background:#8b5cf6}
.r-skills b{color:#111827}
</style>

<script>(function(){
  var STORAGE_KEY="resume-zh-CN-v1";

  function init(){
    var root=document.querySelector(".resume-page");
    if(!root||root.dataset.ready)return;
    root.dataset.ready="1";

    var sheet=document.getElementById("resume-sheet");
    var editBtn=document.getElementById("resume-edit");
    var printBtn=document.getElementById("resume-print");
    var resetBtn=document.getElementById("resume-reset");
    if(!sheet)return;

    var fields=sheet.querySelectorAll("[data-field]");
    var editing=false,saveTimer=null,prevMinHeight="";
    var values={};
    try{values=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{};}catch(e){values={};}

    // 恢复本地保存内容
    fields.forEach(function(el){
      var k=el.getAttribute("data-field");
      if(Object.prototype.hasOwnProperty.call(values,k))el.textContent=values[k];
    });

    function nextFrame(){return new Promise(function(r){setTimeout(r,30);});}

    function setEditing(on){
      editing=on;
      fields.forEach(function(el){
        if(on)el.setAttribute("contenteditable","true");
        else el.removeAttribute("contenteditable");
      });
      sheet.classList.toggle("is-editing",on);
      editBtn.classList.toggle("is-on",on);
      editBtn.textContent=on?"完成编辑":"编辑内容";
    }

    // 粘贴强制纯文本
    sheet.addEventListener("paste",function(e){
      if(!editing)return;
      e.preventDefault();
      var text=(e.clipboardData||window.clipboardData).getData("text/plain");
      document.execCommand("insertText",false,text);
    });

    // 自动保存
    sheet.addEventListener("input",function(e){
      var el=e.target.closest&&e.target.closest("[data-field]");
      if(!el)return;
      values[el.getAttribute("data-field")]=el.textContent;
      clearTimeout(saveTimer);
      saveTimer=setTimeout(function(){
        try{localStorage.setItem(STORAGE_KEY,JSON.stringify(values));}catch(err){}
      },300);
    });

    editBtn.addEventListener("click",function(){setEditing(!editing);});

    resetBtn.addEventListener("click",function(){
      if(window.confirm("确定清空所有本地修改并恢复默认简历吗？")){
        try{localStorage.removeItem(STORAGE_KEY);}catch(e){}
        window.location.reload();
      }
    });

    /* ===== 直接导出 PDF：html2canvas-pro + jsPDF ===== */

    function loadScript(src){
      return new Promise(function(resolve,reject){
        var s=document.createElement("script");
        s.src=src;s.async=false;
        s.onload=function(){resolve();};
        s.onerror=function(){reject(new Error("依赖加载失败："+src));};
        document.head.appendChild(s);
      });
    }
    function ensureLibs(){
      var p=[];
      if(!window.html2canvas)p.push(loadScript("../js/libs/html2canvas-pro.min.js"));
      if(!window.jspdf||!window.jspdf.jsPDF)p.push(loadScript("../js/libs/jspdf.umd.min.js"));
      return Promise.all(p);
    }

    // 在分页线附近寻找纯白行，避免切断文字
    function findWhiteRow(ctx,width,y,minY,maxY){
      for(var yy=y;yy>=minY;yy--){
        var d=ctx.getImageData(0,yy,width,1).data,white=true;
        for(var x=0;x<d.length;x+=12){
          if(d[x]<245||d[x+1]<245||d[x+2]<245){white=false;break;}
        }
        if(white)return yy;
      }
      for(var yy2=y+1;yy2<=maxY;yy2++){
        var d2=ctx.getImageData(0,yy2,width,1).data,white2=true;
        for(var x2=0;x2<d2.length;x2+=12){
          if(d2[x2]<245||d2[x2+1]<245||d2[x2+2]<245){white2=false;break;}
        }
        if(white2)return yy2;
      }
      return y;
    }

    // capture 前移除外部字体：防止克隆文档 fonts.ready 因 gstatic 挂起
    function stripExternalFonts(){
      document.querySelectorAll("link").forEach(function(n){
        var h=n.href||"";
        if((n.as==="font"||/stylesheet|preload/.test(n.rel))&&
           /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(h)){
          n.parentNode.removeChild(n);
        }
      });
      Array.prototype.forEach.call(document.styleSheets,function(sh){
        try{
          var rules=sh.cssRules;
          for(var i=rules.length-1;i>=0;i--){
            if(rules[i] instanceof CSSFontFaceRule)sh.deleteRule(i);
          }
        }catch(e){/* 跨域样式表，其链接已移除 */}
      });
      return nextFrame();
    }

    function exportPDF(){
      if(printBtn.disabled)return;
      var wasEditing=editing;
      setEditing(false);
      printBtn.disabled=true;
      var oldText=printBtn.textContent;
      printBtn.textContent="正在生成 PDF…";

      ensureLibs().then(nextFrame).then(function(){
        // 让画布按实际内容高度渲染，去掉 A4 空白尾页
        prevMinHeight=sheet.style.minHeight;
        sheet.style.minHeight="0";
        return nextFrame();
      }).then(stripExternalFonts).then(function(){
        return window.html2canvas(sheet,{
          scale:2,
          backgroundColor:"#ffffff",
          useCORS:true,
          logging:false,
          onclone:function(doc){
            // 简历样式完全自包含：移除外部样式表，避免等待网络资源导致挂起
            doc.querySelectorAll('link[rel="stylesheet"],link[as="font"]').forEach(function(node){
              node.parentNode.removeChild(node);
            });
            // 清除 @font-face，防止 fonts.ready 因字体资源挂起（简历只用系统字体）
            doc.querySelectorAll("style").forEach(function(node){
              node.textContent=node.textContent.replace(/@font-face\s*{[^}]*}/gi,"");
            });
            var st=doc.createElement("style");
            st.textContent="*{box-sizing:border-box}";
            doc.head.appendChild(st);
          }
        });
      }).then(function(canvas){
        sheet.style.minHeight=prevMinHeight||"";

        var jsPDF=window.jspdf.jsPDF;
        var pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
        var pageW=210,pageH=297;
        var pxPerMm=canvas.width/pageW;
        var pxPageH=Math.floor(pageH*pxPerMm);
        var tolerance=Math.round(6*pxPerMm);

        var tmp=document.createElement("canvas");
        tmp.width=canvas.width;
        var srcCtx=canvas.getContext("2d");

        var position=0,pageIndex=0;
        while(position<canvas.height){
          var sliceH=pxPageH;
          if(position+sliceH<canvas.height){
            // 智能避开文字行
            sliceH=findWhiteRow(srcCtx,canvas.width,position+pxPageH,
              position+pxPageH-tolerance,position+pxPageH+tolerance)-position;
          }else{
            sliceH=canvas.height-position;
          }

          tmp.height=Math.ceil(sliceH);
          var outCtx=tmp.getContext("2d");
          outCtx.fillStyle="#ffffff";
          outCtx.fillRect(0,0,tmp.width,tmp.height);
          outCtx.drawImage(canvas,0,position,canvas.width,sliceH,0,0,canvas.width,sliceH);

          var data=tmp.toDataURL("image/jpeg",0.92);
          var hMm=sliceH/pxPerMm;
          if(pageIndex>0)pdf.addPage("a4","portrait");
          pdf.addImage(data,"JPEG",0,0,pageW,hMm);

          position+=Math.floor(sliceH);
          pageIndex++;
        }
        pdf.save("陈富坤-简历.pdf");
      }).catch(function(err){
        sheet.style.minHeight=prevMinHeight||"";
        alert("PDF 生成失败："+((err&&err.message)||err));
      }).then(function(){
        printBtn.disabled=false;
        printBtn.textContent=oldText;
        if(wasEditing)setEditing(true);
      });
    }

    printBtn.addEventListener("click",exportPDF);
  }

  document.addEventListener("DOMContentLoaded",init);
  document.addEventListener("swup:contentReplaced",init);
  init();
})();</script>
