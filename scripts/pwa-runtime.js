"use strict";

const fs = require("fs");
const path = require("path");
const { stableOutputHash } = require("../tools/output-hash");

const ORIGIN = "https://edgeone-page.edgeone.app";
const LOCALES = {
  "zh-CN": {
    name: "EdgeOne Page 中文站",
    description: "面向腾讯云 EdgeOne Pages 的简体中文和英文双语站点。",
    offline: "当前处于离线状态",
    message: "网络恢复后，请刷新页面继续浏览。已经访问过的页面仍可离线打开。",
    home: "返回中文首页",
    reload: "重新加载",
  },
  en: {
    name: "EdgeOne Page English",
    description: "A Simplified Chinese and English Hexo site optimized for Tencent EdgeOne Pages.",
   