/*
 * EdgeOne Page startup information.
 *
 * The original upstream script contacted an external version service during
 * every Hexo startup. This project keeps startup deterministic and offline by
 * reporting local information only.
 */
"use strict";

const { version } = require("../../package.json");
const { ensurePrefix } = require("../utils/log-prefix");

hexo.on("ready", () => {
  hexo.log.info(
    ensurePrefix(
      `EdgeOne Page v${version} ready. Repository: https://github.com/FukunHennan/edgeone-page`,
    ),
  );
});
