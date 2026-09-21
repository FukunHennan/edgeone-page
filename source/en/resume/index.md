---
title: Resume
layout: page
comments: false
---

<div class="resume-page">
  <div class="resume-toolbar">
    <div class="resume-toolbar-info">
      <h1>Resume · One-click PDF Export</h1>
      <p>Click "Edit" to change the resume below; changes are saved automatically in this browser. Click "Export PDF" to instantly generate and download an A4 resume ready to send to recruiters.</p>
    </div>
    <div class="resume-toolbar-actions">
      <button type="button" class="resume-btn ghost" id="resume-edit">Edit</button>
      <button type="button" class="resume-btn ghost" id="resume-reset">Reset</button>
      <button type="button" class="resume-btn primary" id="resume-print">Export PDF</button>
    </div>
  </div>
  <div class="resume-sheet-wrap">
    <div class="resume-sheet" id="resume-sheet">
<header class="r-head">
<div class="r-head-main">
<h2 class="r-name" data-field="name">Chen Fukun</h2>
<p class="r-target" data-field="target">Objective: Embedded / Automation Engineer</p>
</div>
<ul class="r-contact">
<li data-field="phone">Phone: +86 150-3941-6203</li>
<li data-field="email">Email: 15039416203@163.com</li>
<li data-field="github">GitHub: github.com/FukunHennan</li>
<li data-field="location">Location: Zhoukou, Henan, China</li>
</ul>
</header>
<section class="r-block">
<h3 class="r-title">Education</h3>
<div class="r-row">
<span class="r-org" data-field="edu-school">Huanghuai University · Automation (B.Eng.)</span>
<span class="r-date" data-field="edu-date">2022.09 – 2026.06</span>
</div>
<p class="r-line" data-field="edu-courses">Key coursework: C Programming, Microcomputer Principles, Embedded Development & Applications, MCU Principles & Applications, Digital / Analog Electronics, PLC Technology, Automatic Control Theory, Circuit Analysis.</p>
</section>
<section class="r-block">
<h3 class="r-title">Skills</h3>
<ul class="r-skills">
<li data-field="skill-1"><b>Communication protocols:</b> UART, IIC, SPI, CAN, ModBus, TCP/IP, HTTP, MQTT — principles and practical application.</li>
<li data-field="skill-2"><b>Tools & RTOS:</b> MDK, VSCode, CubeMX; RT-Thread and FreeRTOS embedded real-time operating systems.</li>
<li data-field="skill-3"><b>Hardware design:</b> JLC EDA and SolidWorks for hardware design and 3D modeling.</li>
<li data-field="skill-4"><b>Host software:</b> C# and Qt for host application development; joint PLC and NI data-acquisition-card debugging experience.</li>
</ul>
</section>
<section class="r-block">
<h3 class="r-title">Project Experience</h3>
<div class="r-item">
<div class="r-row">
<span class="r-org" data-field="p1-name">Non-standard Automated Line · Digital Twin</span>
</div>
<p class="r-line" data-field="p1-desc">A digital twin system controlled by a Siemens S7-1500 PLC: mechanical design and 3D modeling in UG, electrical design in Eplan, and digital control and system integration via TIA; the final iteration replaced the PLC with an MCU. Built C# / Qt host applications for joint PLC + NI acquisition-card debugging and custom serial-data hosts.</p>
</div>
<div class="r-item">
<div class="r-row">
<span class="r-org" data-field="p2-name">Underwater Robot (Control)</span>
</div>
<p class="r-line" data-field="p2-desc">Hardware based on STM32F407; software on the HAL library. An IMU and extended ADC handle attitude detection and environmental sensing; servos and brushless motors provide propulsion. Modbus RTU is the communication protocol, with a custom data format for a Linux device to upload sensor data and dispatch propulsion commands.</p>
</div>
<div class="r-item">
<div class="r-row">
<span class="r-org" data-field="p3-name">ESP32 IoT & Visual Programming</span>
</div>
<p class="r-line" data-field="p3-desc">Worked part-time at a youth programming program on ESP32-based IoT development, visual-programming research, visual function library development, and mobile app development.</p>
</div>
</section>
<section class="r-block">
<h3 class="r-title">Honors & Awards</h3>
<p class="r-line" data-field="awards">Siemens Cup Process Industry Automation (Provincial Third Prize), National Undergraduate Electronics Design Contest (Provincial Second Prize), HNC Digital Twin Competition (Provincial Second Prize), multiple provincial or higher Lanqiao Cup awards; University Merit Student.</p>
</section>
<section class="r-block">
<h3 class="r-title">Certificates</h3>
<p class="r-line" data-field="certs">Mandarin Proficiency Test Level 2; National Computer Rank Examination Level 2 (C Language).</p>
</section>
<section class="r-block">
<h3 class="r-title">Self-evaluation</h3>
<p class="r-line" data-field="summary">A strong learner who adapts quickly to new environments and challenges; rigorous and responsible, with solid execution and accountability; a collaborative communicator focused on team goals and passionate about continuous improvement.</p>
</section>
    </div>
  </div>
</div>

<style>
/* ===== On-screen styles ===== */
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
.resume-sheet{width:210mm;flex:0 0 auto;min-height:297mm;background:#fff;color:#1f2937;padding:14mm 15mm;box-sizing:border-box;box-shadow:0 18px 50px rgba(15,23,42,.18);border-radius:2px;font-size:10pt;line-height:1.55;font-family:Arial,Helvetica,sans-serif}

/* Edit mode */
.resume-sheet.is-editing [data-field]:hover{outline:1px dashed #a5b4fc;outline-offset:2px;border-radius:3px;cursor:text}
.resume-sheet [data-field]:focus{outline:2px solid #6366f1;outline-offset:2px;border-radius:3px;background:rgba(99,102,241,.05)}

/* ===== A4 resume layout ===== */
.r-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:10px;border-bottom:2.5px solid #1f2937;margin-bottom:12px}
.r-name{margin:0;font-size:21pt;font-weight:800;letter-spacing:1px;color:#111827}
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
  var STORAGE_KEY="resume-en-v1";

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
      editBtn.textContent=on?"Done":"Edit";
    }

    sheet.addEventListener("paste",function(e){
      if(!editing)return;
      e.preventDefault();
      var text=(e.clipboardData||window.clipboardData).getData("text/plain");
      document.execCommand("insertText",false,text);
    });

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
      if(window.confirm("Clear all local changes and restore the default resume?")){
        try{localStorage.removeItem(STORAGE_KEY);}catch(e){}
        window.location.reload();
      }
    });

    /* ===== Direct PDF export: html2canvas-pro + jsPDF ===== */

    function loadScript(src){
      return new Promise(function(resolve,reject){
        var s=document.createElement("script");
        s.src=src;s.async=false;
        s.onload=function(){resolve();};
        s.onerror=function(){reject(new Error("Failed to load: "+src));};
        document.head.appendChild(s);
      });
    }
    function ensureLibs(){
      var p=[];
      if(!window.html2canvas)p.push(loadScript("../js/libs/html2canvas-pro.min.js"));
      if(!window.jspdf||!window.jspdf.jsPDF)p.push(loadScript("../js/libs/jspdf.umd.min.js"));
      return Promise.all(p);
    }

    // Find a blank row near the page boundary to avoid cutting through text
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

    // Remove external fonts before capture so the cloned fonts.ready cannot hang
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
        }catch(e){/* cross-origin sheet; its link was removed */}
      });
      return nextFrame();
    }

    function exportPDF(){
      if(printBtn.disabled)return;
      var wasEditing=editing;
      setEditing(false);
      printBtn.disabled=true;
      var oldText=printBtn.textContent;
      printBtn.textContent="Generating PDF…";

      ensureLibs().then(nextFrame).then(function(){
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
            // Resume styling is fully self-contained: drop external stylesheets
            doc.querySelectorAll('link[rel="stylesheet"],link[as="font"]').forEach(function(node){
              node.parentNode.removeChild(node);
            });
            // Strip @font-face so fonts.ready cannot hang (resume uses system fonts only)
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
        pdf.save("Chen-Fukun-Resume.pdf");
      }).catch(function(err){
        sheet.style.minHeight=prevMinHeight||"";
        alert("PDF generation failed: "+((err&&err.message)||err));
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
