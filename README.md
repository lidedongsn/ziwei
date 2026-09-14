# 紫微 · 开发工具箱

轻量 Chrome 开发工具箱，当前提供 JSON 工具。使用原生 JavaScript、ES Modules 和 Manifest V3，无第三方依赖。源码可直接加载，也可构建独立安装目录。

## 安装

1. 打开 Chrome 的 `chrome://extensions`。
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本目录（包含 manifest.json）。
4. 在工具栏固定 紫微，点击图标打开独立工具标签页。

也可以选中网页中的 JSON，右键点击「使用 紫微 格式化」。不会自动替换网页或拦截接口。

## 功能

- 输入或粘贴后自动格式化（停止输入 300 毫秒后更新），支持压缩、语法校验。自动校验不会移动光标，手动格式化或校验可定位错误。
- 代码语法高亮、可折叠树形视图、键和值搜索高亮。
- 树形中点击字段或值，高亮当前行、各级父字段及配对括号；点击箭头折叠，重复点击字段、点击空白或按 Esc 取消高亮。
- 2 / 4 空格或 Tab 缩进，递归按键排序（保持数组顺序）。
- JSON 字符串转义、去转义；复制结果、下载 JSON。
- 文件选择与拖入导入，支持 UTF-8 BOM。
- 明暗主题；⌘ / Ctrl + Enter 格式化。
- 保留大整数、长小数、科学计数法、负零和重复属性的原始表示。

数据仅在本机内存中处理，不发起网络请求，不保存输入历史。主题偏好保存在本地；右键传入的文本临时存放于 Chrome session storage，工具页读取后立即删除。关闭浏览器也会清除 session storage。

单次输入上限 2 MB，嵌套上限 200 层。树形最多展示 8,000 个节点，代码、复制和下载仍保留完整结果。仅支持严格 JSON，不支持 JSON5、注释或尾随逗号。

## 工程结构

```text
index.html                  工具箱页面
manifest.json               Chrome 扩展配置
src/
  main.js                   页面启动入口
  extension/background.js   扩展按钮、右键菜单与数据传递
  shared/theme.js           公共主题逻辑
  styles/index.css          主题、布局与组件样式
  tools/json/
    parser.js               无损 JSON 解析与序列化（纯函数）
    view.js                 高亮、树形渲染、节点选中状态
    controller.js           输入处理、自动格式化、文件与交互
scripts/                    预览、检查与构建脚本
tests/                      Node.js 自动化测试
dist/ziwei/                 构建后的可加载扩展（不提交）
```

## 开发与验证

使用 Node.js 22 或更高版本，无需 `npm install`。

```sh
npm run dev    # 本地预览 http://127.0.0.1:8080
npm test
npm run check
npm run build  # 检查 + 测试 + 生成 dist/ziwei
```

`check` 校验 JavaScript 语法、本地模块路径、扩展入口和版本一致性。`build` 仅打包运行文件，不包含测试、开发脚本和说明文档。再次构建会替换生成的 `dist/ziwei`。

开发时直接加载仓库根目录；交付时加载 `dist/ziwei`。修改源码后刷新页面；修改扩展配置或后台脚本后，在扩展管理页点击重新加载。使用构建目录时需重新构建。

`npm run dev` 仅绑定本机地址，可通过 `PORT=8081 npm run dev` 更换端口。它不自动刷新页面。扩展按钮和右键菜单需在 Chrome 加载扩展后验证。

也可沿用 pyenv 预览：

```sh
pyenv exec python -m http.server 8080
```

新增工具的接入方式和手工验证步骤见 [开发说明](docs/development.md)。

扩展配置依据：[Chrome Manifest 文档](https://developer.chrome.com/docs/extensions/mv3/manifest)、[chrome.action 文档](https://developer.chrome.com/docs/extensions/reference/api/action)。权限仅包括右键菜单 `contextMenus` 和临时数据传递 `storage`。
