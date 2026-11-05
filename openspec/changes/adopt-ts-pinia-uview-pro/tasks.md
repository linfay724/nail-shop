# Tasks

## 1. 依赖与构建配置

- [ ] 1.1 调整 `package.json` 依赖：新增 `uview-pro@0.6.23`、`pinia@2.1.7`、`typescript@~5.9.3`、`vue-tsc@^2.2.12`、`@vue/tsconfig@^0.9.1`、`@types/node`、`sass@1.63.2`；移除 `@dcloudio/uni-app-plus`、`uni-app-harmony`、`uni-mp-alipay/baidu/jd/kuaishou/lark/qq/toutiao/xhs/harmony`、`uni-quickapp-webview`；验证：`npm install` 成功且无 ERESOLVE，`npm ls vue pinia uview-pro typescript vue-tsc sass` 版本与计划一致。
- [ ] 1.2 新建 `tsconfig.json`（extends `@vue/tsconfig/tsconfig.json`、`strict: true`、`paths["@/*"] → ["./src/*"]`、`types: ["@dcloudio/types"]`、include `src/**/*.ts|d.ts|vue`）与 `tsconfig.node.json`（仅 `vite.config.ts`、`types: ["node"]`）；验证：`npx tsc --noEmit -p tsconfig.node.json` 通过，且应用侧配置不含 `node` 类型。
- [ ] 1.3 将 `vite.config.js` 替换为 `vite.config.ts`：`fileURLToPath(new URL('./src', import.meta.url))` 配置 `@` 别名、`loadEnv(mode, process.cwd(), 'VITE_')` 读取环境变量、`build.sourcemap` 仅非生产开启、固定 `server.port = 5173`；验证：`npm run dev:h5` 启动于 5173，页面中通过 `@/` 导入的模块可编译（该导入在 3.x 接入时落地）。
- [ ] 1.4 新增 `.env.development`、`.env.production`（均只声明 `VITE_APP_ENV`）与 `src/types/env.d.ts`（`/// <reference types="vite/client" />`、`ImportMetaEnv.VITE_APP_ENV`）；验证：`npm run build:h5` 产物中 `import.meta.env.VITE_APP_ENV` 被替换为对应值，且类型检查对未声明的 `import.meta.env.VITE_XXX` 报错。
- [ ] 1.5 收敛 `package.json` 脚本为 `dev:h5`、`build:h5`、`dev:mp-weixin`、`build:mp-weixin`、`type-check`（`vue-tsc --noEmit && tsc --noEmit -p tsconfig.node.json`）；验证：`npm run` 列表只有这 5 条，`npm run type-check` 在空壳工程下退出码为 0。

## 2. TypeScript 迁移

- [ ] 2.1 迁移入口与现有组件：`src/main.js` → `src/main.ts`，`src/App.vue` 改用 `defineComponent` + `lang="ts"`，`src/pages/index/index.vue` 改为 `<script setup lang="ts">` 并为 `ref` 显式标注类型；验证：`npm run type-check` 零错误，`npm run build:h5` 与 `npm run build:mp-weixin` 均成功。
- [ ] 2.2 合并重复类型声明：删除根 `shims-uni.d.ts` 与 `src/shime-uni.d.ts`，新建 `src/types/shims-uni.d.ts`（`*.vue` 模块声明 + `ComponentCustomOptions extends App.AppInstance & Page.PageInstance`）；验证：`npm run type-check` 零错误，仓库内不再存在两份 `ComponentCustomOptions` 声明，页面 `onLoad`/`onLaunch` 有类型提示。
- [ ] 2.3 清理残留 JS：确认 `src/` 下无 `.js` 文件、无 `<script>`（未声明 `lang="ts"`）块，`vue-i18n` 等未使用依赖保持原状；验证：`Get-ChildItem -Recurse src -Filter *.js` 无输出，全量搜索 `<script>` 仅命中带 `lang="ts"` 的块。

## 3. Pinia

- [ ] 3.1 新建 `src/stores/index.ts`（唯一 `createPinia()` 实例并安装持久化插件）、`src/stores/persist.ts`（`createUniPersistPlugin(prefix)`：`uni.getStorageSync` 回填、`store.$subscribe({ detached: true })` 写回、支持 `persist: true | { key, paths }`）、`src/types/pinia.d.ts`（对 `DefineStoreOptionsBase` 增强 `persist` 选项），并在 `main.ts` 中 `app.use(pinia)`；验证：`npm run type-check` 零错误，store 定义处无需 `as any` 即可传 `persist`。
- [ ] 3.2 新建示例 store `src/stores/app.ts`（启动次数、最近活跃时间，`persist: true`），在演示页通过 `@/stores/app` 读取并自增；验证：H5 刷新后计数保留，微信开发者工具重新编译/重启后计数保留，storage 中出现带统一前缀的 key。
- [ ] 3.3 验证持久化的边界：清空对应 storage key 后计数回到初始值，未声明 `persist` 的 store 不写 storage；验证：开发者工具 Storage 面板操作后页面行为符合预期，且 `src/stores/persist.ts` 对缺失/损坏数据不抛异常。

## 4. uView Pro 接入

- [ ] 4.1 在 `src/pages.json` 增加 `easycom`（`autoscan: true` + `"^u-(.*)": "uview-pro/components/u-$1/u-$1.vue"`），`src/main.ts` 中 `app.use(uviewPro)`，`src/uni.scss` 先声明设计 token 再 `@import 'uview-pro/theme.scss'`，`src/App.vue` 的 `<style lang="scss">` 引入 `uview-pro/index.scss`；验证：演示页使用 `<u-button>` 在 H5 与微信开发者工具中正常渲染，无需手动 import。
- [ ] 4.2 在 `tsconfig.json` 的 `types` 加入 `uview-pro/types`，演示页调用 `uni.$u.toast` 并给 `u-button` 传 `type`；验证：`npm run type-check` 零错误，编辑器可提示 `uni.$u` 与组件 props，运行时点击按钮出现 toast。
- [ ] 4.3 核验按需打包与体积：`npm run build:mp-weixin` 后检查 `dist/build/mp-weixin` 只包含实际使用组件的代码；验证：产物中不存在整库组件拷贝（未使用的组件如 `u-calendar` 不出现），微信开发者工具显示主包体积 < 2MB。

## 5. 双端集成验收

- [ ] 5.1 顺序执行 `npm run type-check`、`npm run build:h5`、`npm run build:mp-weixin`，三条命令退出码均为 0 且无报错；验证：命令输出保留为验收证据。
- [ ] 5.2 双端冒烟：H5 与微信开发者工具中演示页渲染 uView Pro 按钮、Pinia 计数可自增且重启保留、`uni.$u` 调用正常，控制台无 error、无 Sass 弃用告警；验证：两端各完整操作一次并记录截图。
- [ ] 5.3 核验平台裁剪与残留：`package.json` 不含已删除平台包、`npm run` 不含其他平台脚本、`node_modules/@dcloudio` 不含已移除包；验证：命令输出与文件内容一致，`npm run type-check` 仍通过。

## Workflow follow-up

- 归档前运行 `openspec validate adopt-ts-pinia-uview-pro` 并确认通过。
- 本变更归档后，按 `design.md` 第 6 节的映射重写 `wear-nail-store-miniprogram` 的 design 与 tasks（`.js` → `.ts`、composable → Pinia store、自绘组件 → uView Pro），再恢复该变更的实现；本变更内不修改该变更文件。
- 实现完成后运行 `/opsx:archive` 归档本 change。
