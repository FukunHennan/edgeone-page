# EdgeOne Page

A modern, responsive Hexo blog theme with multi-language support (简体中文 / 繁體中文 / English).

## Features

- Multi-language switching (real-time, no page reload)
- Responsive design (desktop / tablet / mobile)
- Dark/Light mode toggle
- Article TOC sidebar
- Search functionality
- Code highlighting
- EXIF image viewer

## Local Development

```bash
npm install
npx hexo server
```

## Build

```bash
npx hexo clean && npx hexo generate
```

Output directory: `public/`

## Deploy to EdgeOne Pages

1. Push this repo to GitHub/GitLab
2. Go to [EdgeOne Pages Console](https://console.cloud.tencent.com/edgeone/pages)
3. Connect your Git repository
4. EdgeOne will auto-detect Hexo framework
5. Build command: `npx hexo generate`
6. Output directory: `public`
7. Click Deploy

## Language Switching

The navbar contains a `<select>` dropdown that switches between:
- 简体中文 (zh-CN)
- 繁體中文 (zh-TW)
- English (en)

Language preference is saved in `localStorage` and persists across visits.

## Project Structure

```
├── _config.yml          # Hexo site config
├── package.json
├── source/              # Blog content (posts, pages)
├── scaffolds/           # Post templates
├── themes/
│   └── edg-one-page/    # Theme files
│       ├── _config.yml  # Theme config
│       ├── layout/      # EJS templates
│       ├── source/      # CSS, JS, fonts
│       ├── scripts/     # Hexo helpers & filters
│       └── languages/   # i18n YAML files
└── .edgeone/
    └── config.json      # EdgeOne Pages build config
```
