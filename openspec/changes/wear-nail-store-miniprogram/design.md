# Design

## Context

仓库是 `uni-preset-vue` 生成的 uni-app 3.0 + Vue 3.4.21 空壳：入口为 `src/main.js`，`src/pages.json` 只有一个默认页，`src/uni.scss` 仅有框架默认变量，`package.json` 还挂着 10 余个平台的脚本与 `@dcloudio` 包，依赖里没有 TypeScript、状态管理、UI 组件库或 Sass。本变更把「工程基线升级」与「业务实现」合并交付，目标基线：TypeScript strict（`npm run type-check` 为门槛）、Pinia 2.1.7（`src/stores` + `createUniPersistPlugin`）、uView Pro 0.6.23（easycom `^u-(.*)`，主题经 `uni.scss` 覆盖）、`@` → `src` 别名、仅保留 H5 与微信小程序两端。构建目标为微信小程序（`npm run dev:mp-weixin`），微信主包体积上限 2MB。

本变更只做小程序端。服务端未立项，因此数据来源必须是一层可替换的本地 mock，接口契约先定死，后续接真实服务端时页面与组件不改动。需求见 `proposal.md` 与 `specs/*/spec.md`。

## Goals / Non-Goals

**Goals:**

- 先建立可执行的工程基线：`npm run type-check`、`build:h5`、`build:mp-weixin` 三条命令必须通过，再在其上写业务代码。
- 建立可正常运行、可演示完整下单闭环的小程序骨架，尺寸与分包结构符合微信主包限制。
- 把「公开数据」与「档案数据」在类型、模块、调用链三个层面隔离，做到用户端代码里根本不存在读取档案的路径。
- 让 mock 层与真实后端共享同一份接口契约（参数、返回字段、错误码），替换成本仅限一个 transport 文件。
- 全部业务代码以 TypeScript strict 编写，跨页状态一律用 Pinia setup store，通用交互优先复用 uView Pro 组件。

**Non-Goals:**

- 不实现真实微信支付、真实登录换 openid、真实文件上传；这些以契约占位 + mock 分支表达。
- 不引入 ESLint、Prettier、单元测试框架、CI 或额外请求库（沿用 `uni.request`），不装 `unplugin-auto-import`；不升级 Vue 主/次版本与 uni-app 编译器版本。
- 不做材料库存、数据看板、优惠券、评价审核、分享海报。

## Decisions

### 0. 工程基线：构建配置、TypeScript、Pinia 与 uView Pro

业务开工前先完成工程基线，六个接入点各自收敛到单一位置：

- **构建配置**：`vite.config.js` → `vite.config.ts`。`@` 别名用 `fileURLToPath(new URL('./src', import.meta.url))`（Windows 下 `new URL().pathname` 会得到带前导斜杠的 `/E:/...`，直接当别名会解析失败）；`loadEnv(mode, process.cwd(), 'VITE_')` 读取环境变量，`.env.development` / `.env.production` 只声明 `VITE_APP_ENV`；`build.sourcemap` 生产关闭；`server.port = 5173`。
- **TS 配置拆分**：`tsconfig.json` extends `@vue/tsconfig/tsconfig.json`、`strict: true`、`baseUrl` + `paths["@/*"]`、`types: ["@dcloudio/types", "uview-pro/types"]`，include `src/**/*.{ts,d.ts,vue}` 且**不含** `node` 类型；`tsconfig.node.json` 单独服务 `vite.config.ts`。`type-check` = `vue-tsc --noEmit && tsc --noEmit -p tsconfig.node.json`。
- **TypeScript 全量**：`src/main.js` → `src/main.ts`，`App.vue` 用 `defineComponent` + `lang="ts"`，页面统一 `<script setup lang="ts">`；删除根 `shims-uni.d.ts` 与拼写错误的 `src/shime-uni.d.ts`，合并到 `src/types/shims-uni.d.ts`（`*.vue` 声明 + `ComponentCustomOptions extends App.AppInstance & Page.PageInstance`）与 `src/types/env.d.ts`；不开 `allowJs` 做增量迁移。
- **Pinia**：`pinia@2.1.7`（2.2 起要求 Vue ≥ 3.5.11，与 3.4.21 冲突）；`src/stores/index.ts` 唯一实例，`src/stores/persist.ts` 提供 `createUniPersistPlugin(prefix)`（`uni.getStorageSync` 回填 + `$subscribe({ detached: true })` 写回），`src/types/pinia.d.ts` 增强 `persist` 选项，业务 store 不写 `as any`。
- **uView Pro**：`uview-pro@0.6.23` 精确锁定（0.x 阶段），四处接入缺一不可——依赖、`pages.json` 的 `easycom`（`autoscan: true` + `"^u-(.*)": "uview-pro/components/u-$1/u-$1.vue"`）、`main.ts` 的 `app.use(uviewPro)`、样式（`uni.scss` 先声明项目 token 再 `@import 'uview-pro/theme.scss'`，`App.vue` 引 `uview-pro/index.scss`）；`tsconfig` 的 `types` 加 `uview-pro/types`；Sass 锁 `1.63.2`（uView Pro 仍用 `@import` 旧语法，1.80+ 会产生弃用告警）。
- **平台裁剪**：脚本收敛为 `dev:h5`、`build:h5`、`dev:mp-weixin`、`build:mp-weixin`、`type-check`；移除 `@dcloudio` 中非 H5/微信小程序的平台包与 `uni-quickapp-webview`；Vue 与所有 `@dcloudio/*` 版本保持与当前编译器一致，保留 `vue-i18n` 不动。

**理由**：类型与状态范式必须在业务代码之前定死，否则 20 多个页面写完再切 TS/Pinia 等于重写；uView Pro 走 easycom 按需打包，能在引入组件库的同时守住 2MB 主包限制。**替代方案**：把基线拆成独立变更先行（归档清晰，但两次交付之间仓库长期不可用，而业务尚未开工，合并代价最低）；保留 JS + 手写组件（类型错误运行时才暴露，视觉规范各自为政）。

### 1. 目录与分包划分

主包只保留首屏必需与可被分享直达的页面，其余进分包：

| 位置 | 内容 | 理由 |
| --- | --- | --- |
| 主包 `src/pages/` | `index`（首页）、`product/list`、`product/detail`、`cart`、`order/list`、`profile`（5 个 tabBar 页 + 详情页） | tabBar 页必须在主包；详情页是分享落地页，放主包避免二次跳转 |
| 分包 `src/pages-user/` | 结算、订单详情、售后申请、地址列表/编辑、收藏、尺码指引、登录 | 非首屏路径，降低主包体积 |
| 分包 `src/pages-admin/` | 管理端鉴权、工作台、商品列表/编辑、制作档案、订单列表/详情 | 与用户端物理隔离，且天然不参与首屏下载 |

`pages.json` 中两个分包均配置 `preloadRule`（仅对 `pages/index` 预下载 `pages-user`），`pages-admin` 不预下载。图片一律使用远程 URL（mock 内为占位地址），避免把演示图塞进包内。

**替代方案**：全部页面放主包（简单，但 5 个 tab + 12 个二级页 + 管理端会逼近体积上限，且管理端代码进入用户包违反隔离目标）；改用 Taro（需重写脚手架，收益不足）。

### 2. 状态管理用 Pinia setup store，复用统一持久化插件

`src/stores/session.ts`、`src/stores/cart.ts`、`src/stores/admin.ts` 均用 `defineStore('name', () => { ... })` setup 语法，持久化统一走基线提供的 `createUniPersistPlugin`：session store 以 `persist: true` 存 token 与过期时间，cart store 按用户维度 key 持久化并在登录后加载、登出时 `$reset` + 清 key，admin store 用独立 key `admin_session` 与用户会话完全分离。

**理由**：Pinia 已是工程基线，store 天然跨页单例，且有 devtools 与统一持久化插件；再写模块级 `reactive` 会形成两套状态范式，且 `type-check` 难以约束 store 边界。**替代方案**：模块级 `reactive` composable（零额外依赖，但与基线并存产生双范式，持久化逻辑要各写一遍）；`pinia-plugin-persistedstate`（需为小程序写 storage 适配，基线的自写插件更轻）。

### 3. 路由守卫：跳转封装 + 页面入场校验双保险

uni-app 没有全局路由守卫，因此组合两层：

1. `src/utils/router.ts` 封装 `navigateTo / redirectTo / switchTab`（参数与返回类型显式标注），管理端相关跳转前统一调用 `requireAdminSession()`；未通过则不跳转并提示。
2. 每个管理端页面在 `onLoad` 调用 `useAdminGuard()`（`src/utils/admin-guard.ts`）：校验本地管理员会话 → 无效则 `uni.reLaunch({ url: '/pages/index/index' })` 并 toast「无管理权限」，同时返回 `false` 让页面不发起任何管理接口请求。

第 2 层是真正的拦截点，用于覆盖扫码进入、开发者工具直接输入路径、分享链接等绕过入口。用户端需要登录的页面同理用 `useAuthGuard()`，但采用「先登录后继续」而非重定向；其登录引导形态统一为快捷登录弹层（见决策 10）。

**理由**：小程序 `app.json` 无法声明式地做鉴权，页面级守卫是唯一可靠落点；双层可避免漏改某一处跳转。**替代方案**：`uni.addInterceptor` 拦截 `navigateTo`（可覆盖 `uni.navigateTo` 直接调用，但对 `reLaunch`/扫码启动路径仍不完整，故作为补充而非替代——实现时同时注册该拦截器）。

### 4. 数据层三段式：contract → transport → mock

- `src/api/contract.ts`：用 `interface` / `type` 导出 `PublicProduct`、`PublicProductDetail`、`AdminProduct`、`CraftArchive`、`MaterialLine`、`CraftStep`、`CartLine`、`Order`、`Address`、`AdminSession` 等契约，并显式导出 `PUBLIC_PRODUCT_FIELDS`、`SENSITIVE_KEYS` 常量（类型用 `as const` 收窄）。
- `src/api/transport.ts`：唯一发起请求的地方。`MOCK_MODE` 为真时路由到 `src/mock/handlers.ts`，否则走 `uni.request` 并附带对应 token（用户 token / 管理 token 分开存放）。
- `src/api/*.ts`：按域暴露 `productApi / cartApi / orderApi / userApi / addressApi / adminApi`，入参与返回值全部取自 `contract.ts`，页面只依赖这一层。
- `src/mock/db.ts`：完整数据（含档案与成本）的单一存储，`uni.setStorageSync` 持久化；`src/mock/seed.ts` 提供演示商品、档案与订单种子数据。
- `src/mock/handlers.ts`：按接口路径分发，返回前必须经过投影函数。

**理由**：页面不感知 mock 存在，替换后端只改 `transport.ts` 的 baseURL 与分支；契约集中在单文件便于与后端对齐。**替代方案**：直接在页面里调 mock（改动小但后端接入时要重写所有页面）；引入请求库如 `luch-request`（多一层依赖，`uni.request` 已够用）。

### 5. 字段投影采用「白名单 pick + 运行时断言」

`src/api/projections.ts` 提供 `toPublicProduct()`、`toPublicProductDetail()`、`toPublicOrder()`、`toAdminProduct()`，入参与返回类型均引用 `contract.ts`。公开投影按白名单逐字段赋值，返回新对象（不 `delete` 原对象、不置 `null`）。同时导出 `SENSITIVE_KEYS = ['materials', 'steps', 'costPrice', 'materialCost', 'otherCost'] as const` 与 `assertNoSensitive(obj: unknown, path: string): void`。

- mock 的每个用户端 handler 出口调用 `assertNoSensitive`，命中即抛出（开发期直接暴露问题）。
- 开发模式下 `transport.ts` 对所有公开响应再跑一次 `assertNoSensitive`，作为与后端联调时的兜底回归检查。
- 用户端模块不 import `craft` 相关文件；管理端接口只放在 `adminApi` 中，`pages-admin` 之外的代码不引用 `adminApi`。

**理由**：需求要求「字段不存在」而非「隐藏」，白名单投影是最贴近该语义的实现；断言把约束变成可执行检查。**替代方案**：依赖后端保证（前端无法验证，验收时无法自证）；UI 层条件渲染（数据层仍然泄露，不满足要求）。

### 6. 管理员入口与鉴权形态

个人中心页监听版本号文本的长按 / 连续点击（7 次），触发 `pages-admin/auth`；鉴权页要求输入管理口令（mock 校验固定口令，真实环境替换为账号密码换成 admin token）。鉴权成功写入 `adminSession`（含 token 与过期时间），并记录在**独立 storage key** `admin_session`，与用户会话 `user_session` 完全分离。管理端工作台提供退出，退出即清 key 并回首页。

**理由**：需求要求隐藏入口且不进 tabBar；长按版本号是常见且不干扰普通用户的模式。**替代方案**：扫码进入（需真实小程序码与后端，MVP 无法自测，但页面本身支持路径直入，后续配码即可）；固定路径（易被普通用户误入，体验差）。

### 7. 支付与登录走 mock 分支

`src/api/payment.ts` 暴露 `payOrder(orderId: string)`：`MOCK_MODE` 时弹出「模拟支付成功 / 取消」选择器，真实模式调用 `uni.requestPayment` 并透传 `timeStamp/nonceStr/package/signType/paySign`。登录 `login()` 同理：mock 返回固定昵称头像，真实模式走 `uni.login` 换 code 后由后端换 session；该能力同时服务启动静默登录与快捷登录弹层（见决策 10）。

**理由**：无商户号与后端，真实支付无法跑通；把差异收敛在一个文件，验收时可用环境开关切换。

### 8. 数据模型要点

- `product`：`id, name, cover, images[], style, shape, price, sales, onSale, skus[]`；`sku` 由 `size + pieceCount` 唯一确定，持有 `stock` 与可选 `priceDelta`。
- `cartLine`：`skuId, productId, size, pieceCount, quantity, selected, snapshot{name, cover, price, stock}`（快照避免商品改价影响已加购展示）。
- `order`：`id, status(pending_pay|pending_ship|pending_receive|completed|cancelled), items[](含下单快照), amount, addressSnapshot, remark, logistics{company, no, traces[]}, afterSale{type, reason, status, rejectReason}, timestamps`。
- `craftArchive`：`productId, materials[{category, name, spec, amount, unit}], steps[{order, description, images[]}], materialCost, otherCost, updatedAt`；与 `product` 分表存储，普通商品查询永不 join 该表。
- `address`：`id, receiver, phone, region[], detail, isDefault`。

### 9. 样式与组件约定

在基线 `src/uni.scss` 的结构上扩展设计 token（豆沙/裸粉系主色、圆角、间距、字号）：项目变量必须先于 `@import 'uview-pro/theme.scss'` 声明，才能借 `!default` 覆盖 uView Pro 主题。通用交互一律复用 uView Pro（`u-popup` 弹层、`u-empty` 空态、`u-button`、`u-form` 校验等），不重复自绘；业务特有组件放 `src/components/` 并显式 import（easycom 只接管 `u-` 前缀）：`product-card`、`price-tag`、`sku-picker`（基于 `u-popup`）、`order-card`、`material-row`、`step-editor`、`admin-gate`、`login-sheet`（基于 `u-popup` 的快捷登录弹层）。全部 rpx 布局，图片 `mode="aspectFill"` + `lazy-load`。

### 10. 登录时机：启动静默登录 + 按需快捷登录弹窗

启动路径不做强制登录弹窗，分两层：

1. **启动静默登录**：`App.vue` 的 `onShow` 检查本地 `user_session`；无会话或 `uni.checkSession` 校验失效时，调用 `uni.login` 换 code，经 `userApi` 静默换取会话并写回 storage。`uni.login` 换 code 无需用户授权同意，全程无感知；静默失败（弱网等）不阻塞进入，保持浏览态，待下次需要身份的动作再补票。
2. **按需快捷登录弹窗**：浏览类路径（首页、商品列表/详情、尺码指引）不要求登录；当下单/结算、收藏、查看订单等需要身份的动作触发 `useAuthGuard()` 未通过时，弹出快捷登录弹层（`src/components/login-sheet.vue`，基于 `u-popup` 的底部弹层；真实模式提供 `getPhoneNumber` 手机号快捷按钮，mock 模式直接模拟成功）。用户拒绝或关闭弹层则留在当前页面继续浏览，不循环弹出。

**理由**：启动强制弹窗会打断浏览、被拒后状态难处理（循环弹或未登录裸奔），微信审核也不鼓励启动强授权；美甲店业务的真实登录动机是手机号（下单联系顾客），放在动作节点授权意愿更高。启动静默登录同时补上决策 3 中 `uni.addInterceptor` 覆盖不到的扫码/`reLaunch` 直入路径。**替代方案**：启动时弹快捷登录弹窗（打断体验、拒绝态处理尴尬）；维持纯页面级被动登录（未登录时首次网络请求即失败，体验差且无兜底）。

## Risks / Trade-offs

- 前端守卫可被绕过（改本地 storage 或伪造 token）→ mock 层同样按 token 校验并投影，且契约层明确标注真实安全由后端字段过滤承担；验收只声明前端拦截效果，不宣称安全边界。
- mock 数据与未来后端契约漂移 → 契约与投影集中在 `api/`，后端接入时以 `contract.ts` 为对齐清单，并保留 `assertNoSensitive` 联调回归。
- 基线与业务同批交付 → 首次可运行时间推迟，基线问题会直接阻塞业务；缓解：任务 0.x 先行，`type-check` 与双端构建作为每步门槛，基线阶段不写业务代码。
- uView Pro 处于 0.x，接口可能破坏性变更 → 精确锁定 `0.6.23`，接入点只出现在固定的四处，升级作为独立变更并跑双端回归。
- Pinia 锁 2.1.7、Sass 锁 1.63.2 均偏旧 → 仅为兼容当前 Vue 3.4.21 与 uView Pro 的 `@import` 语法，升级条件写进 Open Questions，不在此期间混入其他依赖升级。
- easycom `^u-(.*)` 会接管所有 `u-` 前缀组件 → 自研组件一律放 `src/components` 并显式 import，不使用 `u-` 前缀。
- 主包体积超限 → 已分包；若仍超限，把 `product/detail` 迁入 `pages-user` 并接受分享落地多一跳。
- 长按版本号入口难以被店主发现 → 在管理端鉴权页保留直接路径，并写入使用说明；后续可加扫码入口。
- 购物车/收藏使用本地存储，换设备不同步 → MVP 明确接受，真实后端接入时改为服务端购物车（`cartApi` 签名不变）。
- 图片使用远程占位地址，弱网下详情页空白 → 加骨架屏与失败占位图，封面使用固定尺寸避免布局抖动。

## Migration Plan

纯新增，无历史数据与线上版本，无需迁移。落地顺序：工程基线（依赖、构建配置、TS 迁移、Pinia、uView Pro、双端冒烟）→ 契约与 mock → Pinia stores 与登录 → 用户端主流程 → 管理端与档案 → 守卫与字段校验回归。基线阶段结束前不写业务代码；每阶段以 `type-check` 与双端构建为门槛。回滚方式为丢弃本分支改动（无副作用写入线上环境）。

首次运行需在 `src/manifest.json` 填入自测 appid，并在 `src/config/env.ts` 保持 `MOCK_MODE = true`。

## Open Questions

- `createUniPersistPlugin(prefix)` 的前缀取值与 `user_session`、`admin_session` 两个既有 key 的关系（前缀会改变实际 storage key），在实施第一步定稿。
- Pinia 升级到 2.2+ 与 Sass 升级到 1.80+ 的前提分别是 uni-app 编译器升到 Vue 3.5.x、uView Pro 改用新 `@use` 语法，均属独立变更。
- 真实微信支付与客服消息需商户号与后端，待服务端立项时确定。
- 管理端入口最终形态（长按版本号 or 专属小程序码）可在接入后端后定稿，两者共用同一鉴权页。
- 真实模式 `getPhoneNumber` 手机号快捷登录要求非个人主体且完成认证的小程序，接入后端时确认资质；mock 阶段以模拟登录替代，契约不变。
