"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_ROOT = path.join(PROJECT_ROOT, "public");
const SITE_ORIGIN = "https://edgeone-page.edgeone.app";
const LANGUAGES = {
  "zh-CN": {
    title: "EdgeOne Page",
    description: "面向腾讯云 EdgeOne Pages 的简体中文和英文双语站点。",
    notFoundTitle: "页面未找到",
   