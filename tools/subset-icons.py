#!/usr/bin/env python3
"""把 Font Awesome Pro 完整字体裁剪成站点实际使用的字形。

为什么需要这一步
----------------
`themes/edg-one-page/source/fontawesome/subset.min.css` 只裁剪了 **CSS 规则**，
它引用的 woff2 仍是 Font Awesome 官方完整字体：solid/regular 各有 3157 个字形、
brands 有 531 个，而本站一共只用 9 个图标。这 812 KB 里 99.7% 永远不会被绘制。

产物
----
`assets/fa-subset/*.woff2` —— 已提交到仓库，构建时直接拷贝，不依赖本脚本。
所以 **正常构建不需要 Python**；只有增删图标时才重跑：

    npm run subset:icons

维护方式
--------
1. 改下面 ICONS（新增图标时把 className 与码点一起写上）；
2. 同步 `subset.min.css` 里的 `.fa-xxx:before{content:"\\fxxx"}`；
3. 运行 `npm run subset:icons`，提交更新后的 `assets/fa-subset/*.woff2`。
"""
import os
import subprocess
import sys

from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'themes/edg-one-page/source/webfonts')
OUTPUT = os.path.join(ROOT, 'assets/fa-subset')

# 站点实际渲染的图标 —— 与 subset.min.css 的 :before 规则必须保持一致。
ICONS = {
    'fa-solid-900': {
        0xF002: 'fa-magnifying-glass',
    },
    'fa-regular-400': {
        0xF007: 'fa-user',
        0xF015: 'fa-house',
        0xF044: 'fa-pen-to-square',
        0xF07C: 'fa-folder-open',
        0xF15C: 'fa-file-lines',
        0xF249: 'fa-note-sticky',
        0xF2C2: 'fa-id-card',
    },
    'fa-brands-400': {
        0xF09B: 'fa-github',
    },
}


def build(name, codepoints):
    src = os.path.join(SOURCE, name + '.ttf')
    if not os.path.exists(src):
        sys.exit(f'[subset-icons] 找不到源字体: {src}')
    dst = os.path.join(OUTPUT, name + '.woff2')
    os.makedirs(OUTPUT, exist_ok=True)
    cmd = [
        'pyftsubset', src,
        '--unicodes=' + ','.join('U+%04X' % cp for cp in sorted(codepoints)),
        '--flavor=woff2', '--with-zopfli',
        '--layout-features=', '--no-hinting', '--desubroutinize',
        '--drop-tables+=DSIG',
        '--output-file=' + dst,
    ]
    if subprocess.run(cmd, capture_output=True).returncode != 0:
        sys.exit(f'[subset-icons] pyftsubset 失败: {name}')

    font = TTFont(dst)
    got = sorted(font.getBestCmap())
    want = sorted(codepoints)
    if got != want:
        sys.exit(f'[subset-icons] 码点不一致 {name}: {got} != {want}')

    before = os.path.getsize(os.path.join(SOURCE, name + '.woff2'))
    after = os.path.getsize(dst)
    names = ', '.join(codepoints[cp] for cp in want)
    print(f'  {name}.woff2  {before:>7} B -> {after:>5} B   [{names}]')


def main():
    print('[subset-icons] 重新生成 assets/fa-subset：')
    for name, codepoints in ICONS.items():
        build(name, codepoints)
    print('[subset-icons] 完成。记得把 assets/fa-subset/*.woff2 一起提交。')


if __name__ == '__main__':
    main()
