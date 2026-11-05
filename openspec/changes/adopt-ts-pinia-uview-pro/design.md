# Design

## Context

仓库现状（已核实）：

- uni-app `3.0.0-5030420261029002` + Vue `3.4.21` + Vite `5.2.8`（精确版本），入口为 `src/main.js`，只有一个默认演示页；`pages.json` 未配置 easycom，`uni.scss` 只有框架默认变量。
- 类型声明存在两份重复文件：根 `shims-uni.d.ts` 与 `src/shime-uni.d.ts`（后者文件名拼写有误），都只声明了 `ComponentCustomOptions`。
- 依赖里没有 TypeScript、状态管理、UI 组件库、Sass；`package.json` 保留了 10 余个平台的 dev/build 脚本与对应 `@dcloudio` 包。
- 目标技术栈的关键版本约束：Pinia `2.2.8` 起要求 `vue >= 3.5.11`，而本项目 Vue 由 uni-app 编译器配套锁定在 `3.4.21`；`uview-pro@0.6.23` 以源码 `index.ts` 分发、类型入口为 `uview-pro/types`（该版本不存在 `global.d.ts`），且样式依赖 Sass。

动机与范围见 `proposal.md`；本变更不产生 spec 增量（`skip_specs: true`），以下决策即为实现约束。

## Goals / Non-Goals

**Goals:**

- 建立一条可执行的工程基线：`npm run type-check`、`npm run build:h5`、`npm run build:mp-weixin` 三个命令必须全部成功。
- 让 TypeScript、Pinia、uView Pro 的接入点各自收敛到单一位置（`tsconfig` / `src/stores` / `pages.json` + `main.ts` + `uni.scss`），后续业务代码不重复配置。
- 把「用户可见行为不变」作为硬约束：本变更后页面仍是演示页，不出现任何业务逻辑。

**Non-Goals:**

- 不产出业务页面、接口层、mock 数据、登录/购物车/订单状态域。
- 不引入 ESLint、Prettier、单元测试框架或 CI。
- 不升级 Vue 主/次版本，不更换 uni-app 编译器版本，不引入 `unplugin-auto-import` 等额外编译插件。
- 不迁移 `wear-nail-store-miniprogram` 的产物；该变更的 design/tasks 重写发生在本变更归档之后。

## Decisions

### 1. 构建配置改为 TypeScript，并显式声明别名与环境变量

`vite.config.js` 替换为 `vite.config.ts`：

- 别名 `@` → `src`，用 `fileURLToPath(new URL('./src', import.meta.url))` 实现。Windows 下 `new URL(...).pathname` 会得到带前导斜杠的 `/E:/...`，直接用作别名会解析失败；`fileURLToPath` 是唯一跨平台安全写法。
- 用 `loadEnv(mode, process.cwd(), 'VITE_')` 读取环境变量，`.env.development` / `.env.production` 只声明 `VITE_APP_ENV`；后续变更需要 mock 开关、API baseURL 时再追加，不在本次预埋无用变量。
- `build.sourcemap` 由 mode 决定（生产关闭），`server.port` 固定为 `5173` 便于团队对齐。

`tsconfig.json` 与 `tsconfig.node.json` 拆分：

- 应用侧 `tsconfig.json`：`extends: "@vue/tsconfig/tsconfig.json"`，显式 `strict: true`，`baseUrl: "."`，`paths: { "@/*": ["./src/*"] }`，`types: ["@dcloudio/types", "uview-pro/types"]`，`include` 覆盖 `src/**/*.ts`、`src/**/*.d.ts`、`src/**/*.vue`。**不引入 `node` 类型**，避免 `process`、`Buffer` 之类 Node 全局在 `src/` 中被误用（小程序运行时不存在）。
- 构建侧 `tsconfig.node.json` 独立声明 `types: ["node"]`，只 `include` `vite.config.ts`。
- `type-check` 脚本为 `vue-tsc --noEmit && tsc --noEmit -p tsconfig.node.json`，两个配置都被检查。

**替代方案**：保留 `vite.config.js`（改动最小，但别名无法被 TS 感知，配置与代码两套路径规则）；用 `path.resolve(__dirname, 'src')`（依赖配置被当作 CJS 加载，切 ESM 后失效）；只用一个 tsconfig 并引入 `node` 类型（少一个文件，但 Node 全局会泄漏进应用代码）。均不采用。

### 2. TypeScript 全量 strict，迁移现有全部脚本

- `src/main.js` → `src/main.ts`；`App.vue`、`src/pages/index/index.vue` 的 `<script>` 改为 `lang="ts"`。
- 类型声明去重：删除根 `shims-uni.d.ts` 与 `src/shime-uni.d.ts`，新建 `src/types/shims-uni.d.ts`（`*.vue` 模块声明 + `ComponentCustomOptions extends App.AppInstance & Page.PageInstance`，保证 `onLaunch/onLoad` 在 Options API 中合法）与 `src/types/env.d.ts`（`vite/client` 引用 + `ImportMetaEnv`）。
- `App.vue` 使用 `defineComponent` 导出，生命周期钩子由上述 shim 提供类型。
- 现有演示页改为 `<script setup lang="ts">`，用 `ref` 显式声明类型，作为「TS + uView Pro + Pinia 三者同时可用」的最小验证点。

**替代方案**：增量迁移（保留 `allowJs`，只让新代码用 TS）——会长期存在两套写法，且无法把 `type-check` 作为门槛；不采用。

### 3. Pinia 固定 2.1.7，状态目录与持久化插件集中管理

- 版本选择：`pinia@2.1.7`（peer `vue ^3.3.0`）。Pinia `2.2.x`/`3.x`/`4.x` 均要求 `vue >= 3.5.11`，与当前 Vue `3.4.21` 冲突；强行升级 Vue 会牵动 uni-app 编译器配套版本，不在本次范围。
- `src/stores/index.ts` 创建并导出唯一 `pinia` 实例，`main.ts` 中 `app.use(pinia)`；业务 store 一律放 `src/stores/*.ts`，用 setup 语法 `defineStore('name', () => {...})`。
- `src/stores/persist.ts` 提供 `createUniPersistPlugin(prefix)`：读取 store 的 `persist` 选项（`true | { key?: string; paths?: string[] }`），初始化时 `uni.getStorageSync` 回填、`store.$subscribe(..., { detached: true })` 写回。类型通过 `src/types/pinia.d.ts` 对 `DefineStoreOptionsBase` 做模块增强，避免 `as any`。
- 提供一个无业务语义的 `src/stores/app.ts`（启动次数、最近活跃时间，`persist: true`），演示页读取并自增，用于验证「跨页共享 + 重启恢复」。
- 持久化不使用 `pinia-plugin-persistedstate`：其默认 storage 面向 `localStorage`，需要额外适配 `uni` API，且多一个依赖；自写插件约 30 行，行为可见可控。

**替代方案**：沿用原变更设计的模块级 `reactive` composable（零依赖，但无 devtools、无统一插件机制，跨页状态边界靠人工约定）；`pinia-plugin-persistedstate`（成熟但需为小程序写 storage 适配层）。不采用。

### 4. uView Pro 采用 npm + easycom，版本精确锁定

接入点固定为四处，缺一不可：

1. `package.json`：`"uview-pro": "0.6.23"`（0.x 阶段，精确版本，升级单独发起）。
2. `src/pages.json`：`easycom.autoscan = true`，`custom` 规则 `"^u-(.*)": "uview-pro/components/u-$1/u-$1.vue"`，组件按需打包，无需手动 import。
3. `src/main.ts`：`import uviewPro from 'uview-pro'`，`app.use(uviewPro)`。
4. 样式：`src/uni.scss` 中先声明项目设计 token（品牌色等），再 `@import 'uview-pro/theme.scss'`（主题变量带 `!default`，先定义后导入才能覆盖）；`App.vue` 的 `<style lang="scss">` 中 `@import 'uview-pro/index.scss'` 引入基础类。

类型：`tsconfig.json` 的 `types` 加入 `uview-pro/types`（已核实 0.6.23 的类型入口是 `types/index.d.ts`，并提供 `Uni.$u` 全局增强；官方文档提到的 `uview-pro/global` 在该版本不存在，不能照抄）。

Sass 固定 `1.63.2`：uView Pro 样式仍使用 `@import` 旧语法，较新的 Sass（1.80+）会产生大量弃用告警甚至阻断；`1.63.2` 是官方安装文档给出的锁定版本。

**替代方案**：`uni_modules` 方式安装（HBuilderX 升级方便，但会把库源码提交进仓库、无法用 lockfile 锁定）；不采用。easycom 规则若写成 `^u-([^-].*)` 会漏掉 `u--input` 这类双横线组件，按官方 `^u-(.*)` 配置。

### 5. 平台与依赖裁剪

- 只保留 H5 与微信小程序：脚本收敛为 `dev:h5`、`build:h5`、`dev:mp-weixin`、`build:mp-weixin`、`type-check`。
- 移除 `@dcloudio/uni-app-plus`、`uni-app-harmony`、`uni-mp-alipay/baidu/jd/kuaishou/lark/qq/toutiao/xhs/harmony`、`uni-quickapp-webview` 及对应 `dev/build` 脚本；保留 `@dcloudio/uni-app`、`uni-components`、`uni-h5`、`uni-mp-weixin`、`vite-plugin-uni`、`uni-cli-shared`、`uni-stacktracey`、`uni-automator`、`@dcloudio/types`。
- 保留 `vue-i18n`（脚手架默认依赖，删除属无关改动）；`vite` 与所有 `@dcloudio/*` 版本保持与当前编译器完全一致，不做升级。

**替代方案**：保留全部平台脚本（兼容性最好，但每个平台包都要安装、脚本列表噪声大，且与「只做微信小程序」目标不符）。

### 6. 与既有变更的衔接方式

本变更不改写 `wear-nail-store-miniprogram` 的文件，只在其归档后按以下映射重写：

| 既有计划 | 新栈下的落地 |
| --- | --- |
| `src/api/contract.js` 的 JSDoc `@typedef` | 同名 `.ts`，改为 `interface` / `type` 导出 |
| `src/store/session.js`、`cart.js`、`admin.js` 的 `reactive` | `src/stores/session.ts`、`cart.ts`、`admin.ts` 的 setup store |
| `src/utils/*.js` | `src/utils/*.ts`，函数签名显式标注 |
| 自绘 `product-card`、`empty-state`、`sku-picker` 等 | 优先组合 uView Pro 组件，仅业务特有组件放 `src/components` |
| 构建/配置类任务 1.1~1.4 | 由本变更完成，重写时删除或改为「校验已就绪」 |

在重写前，该变更视为暂停状态：不继续勾选任务，避免按旧栈产出 `.js` 文件。

## Risks / Trade-offs

- **uView Pro 处于 0.x，接口可能破坏性变更** → 精确锁定 `0.6.23`，easycom 规则与样式导入只出现在 4 个固定位置，升级作为独立变更并跑双端构建回归。
- **Sass 锁定 1.63.2 偏旧** → 仅用于编译，不执行运行时逻辑；在 uView Pro 迁移到新语法或 Sass 2 前不升级，升级时以双端构建通过为准。
- **Pinia 锁 2.1.7 缺少新版本能力** → 等 uni-app 编译器把 Vue 带到 3.5.x 后再统一升级 Pinia，届时只改 `package.json` 与 `src/stores`，页面无感。
- **strict 模式暴露 uni-app 生命周期参数类型缺失** → 依赖 `@dcloudio/types` 与 `ComponentCustomOptions` shim；第三方 `.d.ts` 冲突由 `@vue/tsconfig` 默认的 `skipLibCheck` 吸收，仍报错则收窄到具体文件而不是关掉 strict。
- **easycom `^u-(.*)` 会劫持所有 `u-` 前缀组件** → 项目自研组件统一用 `app-` 前缀或显式 import，约定写入后续开发规范。
- **删除平台包后误执行旧平台命令** → 脚本同步删除，`npm run` 列表即能力列表；将来恢复某端时按当前编译器版本一次性加回对应包与脚本。
- **主包体积** → uView Pro 通过 easycom 按需打包；验收时检查 `dist/build/mp-weixin` 只包含实际使用的组件，主包保持 2MB 以内。
- **Windows 路径与大小写** → 别名统一 `@/`，导入路径大小写与文件名严格一致；构建在 Windows 上验证，避免大小写不敏感掩盖问题。

## Migration Plan

1. 停手既有变更：不再推进 `wear-nail-store-miniprogram` 的任务，避免产出 JS 实现。
2. 安装依赖并改造构建配置（TS 配置、别名、环境变量、脚本与平台包裁剪），先保证空壳可编译。
3. 迁移入口与现有页面到 TS，删除重复 shims；此时 `type-check` 应通过。
4. 接入 Pinia（实例 + 持久化插件 + 示例 store）与 uView Pro（easycom + 注册 + 主题 + 类型）。
5. 双端构建与运行验证：H5 与微信开发者工具中演示页展示 uView Pro 按钮、Pinia 计数在重启后保留。
6. 本变更归档后，按上表重写 `wear-nail-store-miniprogram` 的 design 与 tasks，再恢复其实现。

回滚：本变更不涉及数据迁移与线上发布，回滚即还原分支（`package.json`、lockfile、配置文件与 `src/` 改动），无残留状态。

## Open Questions

- 是否在业务开发开始前补充 ESLint + Prettier：可在后续独立变更中决定，不影响本设计。
- 是否把 Vue 升级到 3.5.x 以使用新版 Pinia：需先确认 uni-app 编译器配套版本，属独立升级事项。
- uView Pro 主题色最终取值：本变更只建立 token 与覆盖机制，具体色值随视觉方案在业务变更中确定。
