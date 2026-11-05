# Proposal

## Why

当前仓库仍是 `uni-preset-vue` 默认 JS 脚手架：入口是 `main.js`，构建配置只有一个 `vite.config.js`，依赖里既没有类型系统，也没有状态管理库和 UI 组件库。接下来要实现的小程序包含 7 个业务能力、20 多个页面，若继续用 JS + 手写组件推进，类型错误只能在运行时暴露，跨页状态与视觉规范也会各自为政。

同时，进行中的 `wear-nail-store-miniprogram` 变更把「不引入 TypeScript、Pinia、UI 组件库，不改造构建配置」写进了 design 的 Non-Goals 与 tasks，和目标技术栈直接冲突。必须先完成地基升级，再按新栈重写该变更的实现计划，否则两份计划会互相矛盾。

## What Changes

- **构建配置改造**：`vite.config.js` 改为 `vite.config.ts`，补齐 `@` → `src` 别名、按 mode 加载环境变量、构建 sourcemap 开关；`package.json` 脚本精简为 H5 与微信小程序两端的 dev/build，加上 `type-check`；移除仅服务于其他小程序/鸿蒙/快应用的 `@dcloudio` 平台包。
- **TypeScript 全量 + strict**：`src/main.js` → `src/main.ts`，`App.vue` 与现有页面脚本改为 `lang="ts"`，合并重复的 shims 到 `src/types/`，新增 `tsconfig.json`、环境变量与 `*.vue` 模块声明；`npm run type-check`（`vue-tsc`）成为可执行验收门槛。
- **引入 Pinia**：安装并在 `main.ts` 注册 Pinia，确立 `src/stores/` 目录约定（setup store + `defineStore`），提供基于 `uni.getStorageSync/setStorageSync` 的按需持久化插件，并落地一个示例 store 验证跨页共享与重启恢复。
- **引入 uView Pro**：npm 安装 `uview-pro`，在 `pages.json` 配置 easycom 自动引入、`main.ts` 注册插件、`uni.scss` 引入并覆盖主题变量、`App.vue` 引入基础样式，同时接入其 TypeScript 类型入口，使 `uni.$u` 与组件 props 有类型提示。
- **技术栈替代关系**：本变更优先于 `wear-nail-store-miniprogram`。既有变更暂停，待本变更落地后，其 design 的 Non-Goals 与 tasks 中的 `.js` 路径、composable 状态方案、自绘组件方案需按新栈重写（**BREAKING** 对该变更的既有计划，不影响已交付代码）。
- **明确不做**：不实现任何业务页面、接口契约或业务状态域（登录/购物车/订单/档案等留待后续变更）；不引入 ESLint / Prettier / CI 流水线；不升级 Vue 主版本；不采用 `uni_modules` 方式安装 uView Pro；不改 `vue-i18n` 与现有页面结构。

## Capabilities

### New Capabilities

无。本变更只调整工程配置、依赖与开发约定，不改变任何用户可见行为，也不新增业务能力；按 `skip_specs: true` 跳过 spec 阶段，技术决策在 `design.md` 中记录。

### Modified Capabilities

无。`openspec/specs/` 目前没有任何已归档能力。

## Impact

- 构建与配置：新增 `vite.config.ts` 替换 `vite.config.js`、`tsconfig.json`、`.env.development`、`.env.production`；修改 `package.json`、`src/pages.json`（easycom）、`src/uni.scss`（主题变量）、`src/App.vue`（TS + 基础样式）、根 `shims-uni.d.ts`（删除并合并）。
- 新增代码：`src/main.ts`（替换 `src/main.js`）、`src/types/env.d.ts`、`src/types/shims-uni.d.ts`、`src/stores/index.ts`、`src/stores/persist.ts`、`src/stores/app.ts`；`src/pages/index/index.vue` 改写为 TS + uView Pro + Pinia 的最小验证页。
- 依赖：新增 `uview-pro@0.6.23`、`pinia@2.1.7`、`typescript@~5.9.3`、`vue-tsc@^2.2.12`、`@vue/tsconfig@^0.9.1`、`@types/node`、`sass@1.63.2`；移除 `@dcloudio/uni-app-plus`、`uni-mp-alipay/baidu/jd/kuaishou/lark/qq/toutiao/xhs/harmony`、`uni-app-harmony`、`uni-quickapp-webview`。
- 兼容性：Vue 保持 `3.4.21`（与当前 uni-app 编译器版本配套），Pinia 固定 `2.1.7`（2.2 及以上要求 Vue ≥ 3.5.11）；uView Pro 首个版本锁定 `0.6.23`；构建目标仅 H5 与微信小程序。
- 既有变更：`wear-nail-store-miniprogram` 暂停，本变更归档后需重写其 design 与 tasks 以匹配新栈；其能力划分与业务需求本身不变。
- 外部系统：无新增外部服务，不涉及微信登录/支付。
