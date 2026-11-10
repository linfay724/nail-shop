# Design

## Context

仓库是 `uni-preset-vue` 生成的 uni-app 3.0 + Vue 3.4.21 空壳：入口为 `src/main.js`，`src/pages.json` 只有一个默认页，`src/uni.scss` 仅有框架默认变量，`package.json` 还挂着 10 余个平台的脚本与 `@dcloudio` 包，依赖里没有 TypeScript、状态管理、UI 组件库或 Sass。本变更把「工程基线升级」与「业务实现」合并交付，目标基线：TypeScript strict（`npm run type-check` 为门槛）、Pinia 2.1.7（`src/stores` + `createUniPersistPlugin`）、uView Pro 0.6.23（easycom `^u-(.*)`，主题经 `uni.scss` 覆盖）、`@` → `src` 别名、仅保留 H5 与微信小程序两端。构建目标为微信小程序（`npm run dev:mp-weixin`），微信主包体积上限 2MB。

本变更只做小程序端。服务端未立项，因此数据来源必须是一层可替换的本地 mock，接口契约先定死，后续接真实服务端时页面与组件不改动。需求见 `proposal.md` 与 `specs/*/spec.md`。

增量前提改变了三处基线假设：一是商品不再是「一个价格 + 一个甲型」，而是「尺码 × 甲型」的组合矩阵，且预计上千款商品需要分页与按名称/标签搜索；二是管理端不再是一个口令，而是「店主 + 美甲师」多账号、一人一码扫码进入，权限既要在前端拦截也要在数据层拒绝；三是交易规则从「只有商品金额」变为「商品金额 + 由店主配置的运费（满 2 副包邮）」，并且售后不再走线上流程。因此规格模型、账号模型与金额计算方式在本次一并落定，避免先按单规格实现再整体重写。

## Goals / Non-Goals

**Goals:**

- 先建立可执行的工程基线：`npm run type-check`、`build:h5`、`build:mp-weixin` 三条命令必须通过，再在其上写业务代码。
- 建立可正常运行、可演示完整下单闭环的小程序骨架，尺寸与分包结构符合微信主包限制。
- 把「公开数据」与「档案数据」在类型、模块、调用链三个层面隔离，做到用户端代码里根本不存在读取档案的路径。
- 让 mock 层与真实后端共享同一份接口契约（参数、返回字段、错误码），替换成本仅限一个 transport 文件。
- 全部业务代码以 TypeScript strict 编写，跨页状态一律用 Pinia setup store，通用交互优先复用 uView Pro 组件。
- 规格模型一次到位：尺码（S/M/L/其他）× 甲型（短圆/中长/长梯/其他）的组合矩阵、独立库存与价格差、「其他」的定制备注，避免后续从单规格迁移。
- 权限双层可验证：前端按角色拦截页面与入口，数据层（mock handler，未来后端）按会话角色与主体拒绝越权请求并做字段投影。
- 交易金额可解释：商品小计 + 运费（满 X 副包邮，否则固定邮费），阈值与邮费由店主配置，结算页与订单页展示一致且可核对。

**Non-Goals:**

- 不实现真实微信支付、真实登录换 openid、真实文件上传、真实小程序码生成；这些以契约占位 + mock 分支表达。
- 不引入 ESLint、Prettier、单元测试框架、CI 或额外请求库（沿用 `uni.request`），不装 `unplugin-auto-import`；不升级 Vue 主/次版本与 uni-app 编译器版本。
- 不做材料库存管理与低库存提醒、数据看板、优惠券/满减、线上退款或退货流程、定制报价表单、批量商品导入、评价审核后台、分享海报。
- 不做拼音、中文分词或同义词的高级搜索，搜索仅按名称与标签做字面匹配。
- 不做真实的微信客服消息、评论回复、点赞或评价追评。

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
| 主包 `src/pages/` | `index`（首页）、`product/list`（分类 tab）、`product/detail`、`cart`、`order/list`、`profile`（4 个 tabBar 页 + 详情页与订单列表页） | tabBar 页必须在主包；详情页是分享落地页，放主包避免二次跳转；订单列表从个人中心与支付流程进入，仍留主包 |
| 分包 `src/pages-user/` | 结算、订单详情、售后协商、地址列表/编辑、收藏、尺码指引、发表评价、用户协议、隐私政策、登录 | 非首屏路径，降低主包体积 |
| 分包 `src/pages-admin/` | 扫码入口（`auth`）、工作台、商品列表/编辑、制作资料列表、制作档案、订单列表/详情、评价管理、运费配置、账号管理 | 与用户端物理隔离，且天然不参与首屏下载 |

`pages.json` 中两个分包均配置 `preloadRule`（仅对 `pages/index` 预下载 `pages-user`），`pages-admin` 不预下载。图片一律使用远程 URL（mock 内为占位地址），避免把演示图塞进包内。

**替代方案**：全部页面放主包（简单，但 4 个 tab + 12 个二级页 + 管理端会逼近体积上限，且管理端代码进入用户包违反隔离目标）；改用 Taro（需重写脚手架，收益不足）。

### 2. 状态管理用 Pinia setup store，复用统一持久化插件

`src/stores/session.ts`、`src/stores/cart.ts`、`src/stores/admin.ts` 均用 `defineStore('name', () => { ... })` setup 语法，持久化统一走基线提供的 `createUniPersistPlugin`：session store 以 `persist: true` 存 token 与过期时间，cart store 按用户维度 key 持久化并在登录后加载、登出时 `$reset` + 清 key，admin store 用独立 key `admin_session` 与用户会话完全分离。

增量后 store 职责再细分：`admin` 会话增加 `accountId / role / merchantId / qrCodeId`，并暴露 `hasPermission(p)`；`favorite` store **不持久化**（服务端为准，登录后拉取，登出清空）；`shipping` 配置读取后缓存于 `useShippingStore`（同样不持久化，避免店主改配置后员工端读到旧值）。

**理由**：Pinia 已是工程基线，store 天然跨页单例，且有 devtools 与统一持久化插件；再写模块级 `reactive` 会形成两套状态范式，且 `type-check` 难以约束 store 边界。**替代方案**：模块级 `reactive` composable（零额外依赖，但与基线并存产生双范式，持久化逻辑要各写一遍）；`pinia-plugin-persistedstate`（需为小程序写 storage 适配，基线的自写插件更轻）。

### 3. 路由守卫：跳转封装 + 页面入场校验双保险

uni-app 没有全局路由守卫，因此组合两层：

1. `src/utils/router.ts` 封装 `navigateTo / redirectTo / switchTab`（参数与返回类型显式标注），管理端相关跳转前统一调用 `requireAdminSession()`；未通过则不跳转并提示。
2. 每个管理端页面在 `onLoad` 调用 `useAdminGuard()`（`src/utils/admin-guard.ts`）：校验本地管理员会话 → 无效则 `uni.reLaunch({ url: '/pages/index/index' })` 并 toast「无管理权限」，同时返回 `false` 让页面不发起任何管理接口请求。

第 2 层是真正的拦截点，用于覆盖扫码进入、开发者工具直接输入路径、分享链接等绕过入口。用户端需要登录的页面同理用 `useAuthGuard()`，但采用「先登录后继续」而非重定向；其登录引导形态统一为快捷登录弹层（见决策 10）。

管理端加入角色后，`useAdminGuard()` 扩展为 `useAdminGuard(required?: Permission)`（`src/utils/admin-guard.ts`）：先校验会话与账号状态，再按 `ROLE_PERMISSIONS[session.role]` 判断所需权限，缺权限时重定向工作台而非首页。路由跳转封装同样接受 `required` 参数，保证「入口不渲染」与「直入被拦截」两件事都由同一张权限表决定（见决策 12）。

**理由**：小程序 `app.json` 无法声明式地做鉴权，页面级守卫是唯一可靠落点；双层可避免漏改某一处跳转。**替代方案**：`uni.addInterceptor` 拦截 `navigateTo`（可覆盖 `uni.navigateTo` 直接调用，但对 `reLaunch`/扫码启动路径仍不完整，故作为补充而非替代——实现时同时注册该拦截器）。

### 4. 数据层三段式：contract → transport → mock

- `src/api/contract.ts`：用 `interface` / `type` 导出 `PublicProduct`、`PublicProductDetail`、`AdminProduct`、`ProductSku`、`CraftArchive`、`MaterialLine`、`CraftStep`、`CartLine`、`Order`、`Address`、`AdminSession`、`StaffAccount`、`QrCode`、`Review`、`ShippingConfig` 等契约，并显式导出 `PUBLIC_PRODUCT_FIELDS`、`SENSITIVE_KEYS`、`SIZE_LABELS`、`SHAPE_LABELS` 常量（类型用 `as const` 收窄）。
- `src/api/transport.ts`：唯一发起请求的地方。`MOCK_MODE` 为真时路由到 `src/mock/handlers.ts`，否则走 `uni.request` 并附带对应 token（用户 token / 管理 token 分开存放）。
- `src/api/*.ts`：按域暴露 `productApi / cartApi / orderApi / userApi / addressApi / adminApi`，入参与返回值全部取自 `contract.ts`，页面只依赖这一层。
- `src/mock/db.ts`：完整数据（含档案与成本）的单一存储，`uni.setStorageSync` 持久化；`src/mock/seed.ts` 提供演示商品、档案与订单种子数据。
- `src/mock/handlers.ts`：按接口路径分发，返回前必须经过投影函数。

**理由**：页面不感知 mock 存在，替换后端只改 `transport.ts` 的 baseURL 与分支；契约集中在单文件便于与后端对齐。**替代方案**：直接在页面里调 mock（改动小但后端接入时要重写所有页面）；引入请求库如 `luch-request`（多一层依赖，`uni.request` 已够用）。

### 5. 字段投影采用「白名单 pick + 运行时断言」

`src/api/projections.ts` 提供 `toPublicProduct()`、`toPublicProductDetail()`、`toPublicOrder()`、`toAdminProduct()`、`toArtistArchive()`、`toOwnerArchive()`，入参与返回类型均引用 `contract.ts`。公开投影按白名单逐字段赋值，返回新对象（不 `delete` 原对象、不置 `null`）。同时导出 `SENSITIVE_KEYS = ['materials', 'steps', 'cost', 'costPrice', 'materialCost', 'hours', 'suggestedPrice'] as const` 与 `assertNoSensitive(obj: unknown, path: string): void`；档案投影再分两级：`toArtistArchive()` 保留 materials/steps 并剔除 cost 整块，`toOwnerArchive()` 保留全部字段。

- mock 的每个用户端 handler 出口调用 `assertNoSensitive`，命中即抛出（开发期直接暴露问题）。
- 档案 handler 按会话角色选择投影函数，美甲师拿到的响应里成本键从结构上不存在（不是置 0 或隐藏）。
- 开发模式下 `transport.ts` 对所有公开响应再跑一次 `assertNoSensitive`，作为与后端联调时的兜底回归检查。
- 用户端模块不 import `craft` 相关文件；管理端接口只放在 `adminApi` 中，`pages-admin` 之外的代码不引用 `adminApi`。
- 角色越权不只靠投影兜底：写接口在 handler 入口先 `requirePermission()`，投影只负责「能读的范围内少给字段」。

**理由**：需求要求「字段不存在」而非「隐藏」，白名单投影是最贴近该语义的实现；断言把约束变成可执行检查。**替代方案**：依赖后端保证（前端无法验证，验收时无法自证）；UI 层条件渲染（数据层仍然泄露，不满足要求）。

### 6. 管理员入口与鉴权形态：扫码 + 一人一码

入口改为扫码，不再是口令：

- `pages-admin/auth/index` 接收 `entry` 查询参数，来源有两种：`uni.scanCode` 扫普通二维码时的 `result`，或小程序码 `scene`（`options.query.scene`，需 `decodeURIComponent`）。两种来源统一归一化为 `entry` 字符串后交给 `staffApi.resolveEntry(entry)`。
- 校验返回 `{ token, expiresAt, accountId, role, merchantId, qrCodeId }`；成功写入 `adminSession`（Pinia `stores/admin`，独立 storage key `admin_session`，与 `user_session` 完全分离），失败按 `code` 区分「入口码已失效」「无管理权限」「账号已停用」并回首页。
- 一人一码：`qrCodes` 表按 `code → { accountId, merchantId, status }` 存储，一个账号同一时刻只有一条有效码；停用账号时把码置为 `invalid`，重新启用时生成新码并作废旧码。
- 账号来源：管理端不提供「新增美甲师」与「分配角色」，账号由服务端预置（mock 以种子账号模拟），前端只做查看、停用/启用与重新生成入口码；这样客户端不存在「自行创建高权限账号」的路径，角色只能由服务端开通时确定。
- 码的可见范围：仅店主在账号管理页可查看、复制、转发自己与员工的入口码；`pages-admin` 之外的任何页面都不渲染可点击的入口链接，tabBar 与个人中心常规区域不含入口；个人中心允许展示一条纯文案的「管理端入口：扫码进入」说明占位卡（不可点击、不含跳转、无数据请求，与原型 v1.1 一致）。
- 不再保留口令登录通道；mock 模式下 `auth` 页提供「使用演示入口码」按钮（仅 `MOCK_MODE` 渲染），从种子数据里取店主/美甲师码，便于本地自测，真实环境不出现。
- 主体隔离：校验通过后 `merchantId` 进入会话，所有管理接口（商品、档案、订单、评价、运费、账号）都以该 `merchantId` 作为查询与写入的硬性条件，mock 的 `loadDb()` 按主体过滤。

**理由**：一人一码把「谁可以进管理端」变成可发放、可吊销的对象，停用即失效是需求的硬性验收点；口令无法表达「一人一码」与「按主体隔离」，且多账号共用口令等于没有账号体系。**替代方案**：保留口令 + 另一套账号表（口令一旦外泄无法定位到人，也无法单独吊销）；长按版本号进入后输入账号密码（仍不能满足「停用后扫码校验失败」的验收路径）。**取舍**：真实小程序码需要后端生成，本变更以「入口码字符串 + mock 校验」跑通全部前端路径，接入后端时只替换 `staffApi.resolveEntry` 的实现。

### 7. 支付与登录走 mock 分支

`src/api/payment.ts` 暴露 `payOrder(orderId: string)`：`MOCK_MODE` 时弹出「模拟支付成功 / 取消」选择器，真实模式调用 `uni.requestPayment` 并透传 `timeStamp/nonceStr/package/signType/paySign`。登录 `login()` 同理：mock 返回固定昵称头像，真实模式走 `uni.login` 换 code 后由后端换 session；该能力同时服务启动静默登录与快捷登录弹层（见决策 10）。

**理由**：无商户号与后端，真实支付无法跑通；把差异收敛在一个文件，验收时可用环境开关切换。

### 8. 数据模型要点

- `product`：`id, merchantId, name, cover, images[], video?, style, tags[], price, unit: '副', piecesPerSet, sales, onSale, isAccessory, skus[]`。`unit` 固定为「副」，`piecesPerSet` 取 10 或 12（未配置时详情页提示「以实物为准」）；`isAccessory = true` 的商品即工具包，不参与副数统计。甲型不再是商品级单值，列表的甲型筛选走 `skus.some(sku => sku.shape === target)`。
- `productSku`：`{ id, size: 'S' | 'M' | 'L' | 'OTHER', shape: 'SHORT_ROUND' | 'MEDIUM' | 'LONG_TAPER' | 'OTHER', stock, priceDiff }`。只有店主配置过的组合才写入数组，不生成 4×4 的笛卡尔积；组合唯一键为 `productId + size + shape`，成品价 = `product.price + sku.priceDiff`，`priceDiff` 允许为负但成品价不得 ≤ 0。
- `cartLine`：`skuId, productId, size, shape, isAccessory, quantity, selected, snapshot{name, cover, price, stock, unit, piecesPerSet}`（快照避免商品改价影响已加购展示）。定制备注属于订单级字段，不下沉到购物车行。
- `order`：`id, merchantId, status(pending_pay|pending_ship|pending_receive|completed|cancelled), items[](含 size/shape/unit 快照), goodsAmount, shippingFee, amount, addressSnapshot, customNote, logistics{company, no, traces[]}, reviewed, timestamps`；`amount = goodsAmount + shippingFee`，`customNote` 在结算时按「是否含其他规格」决定是否必填；普通订单备注 `remark` 移除（原型结算页仅保留定制备注）。`afterSale` 字段整体移除。
- `shippingConfig`：`{ merchantId, freeShippingThreshold: 2, flatFee }`，按主体存一条；结算与下单都以它为准，前端不写死 2 副。
- `aftersaleRequest`：`{ id, merchantId, orderId, userId, type, description, media[], status: 'pending' | 'resolved', createdAt }`；仅作为售后协商意向记录（用户提交后跳转客服会话），不产生退款/退货状态，店主可在管理端按「售后」筛选查看并标记已处理；工作台「待处理售后」计数取未标记已处理的记录数。
- `craftArchive`：`{ productId, materials[{category, name, spec, amount, unit}], steps[{order, title, desc, images[], video?}], cost{materialCost, hours, suggestedPrice}, updatedAt }`。与 `product` 分表存储，普通商品查询永不 join 该表；`cost` 只在 `toOwnerArchive()` 的返回类型里出现，`toArtistArchive()` 的类型中根本没有该字段。
- `staffAccount`：`{ accountId, role: 'owner' | 'artist', merchantId, qrCodeId, status: 'active' | 'disabled', name }`；一个 `merchantId` 下仅一个 owner。
- `qrCode`：`{ code, accountId, merchantId, status: 'active' | 'invalid' }`；`accountId` 与 `code` 一一对应，停用账号或重新启用都会翻转旧码状态。
- `review`：`{ id, merchantId, productId, orderId, userId, rating, content, media[{ type: 'image' | 'video', url }], visible, createdAt }`；`visible` 由店主控制，用户端只读取 `visible = true` 的评价。
- `address`：`id, receiver, phone, region[], detail, isDefault`。

### 9. 样式与组件约定

在基线 `src/uni.scss` 的结构上扩展设计 token（豆沙/裸粉系主色、圆角、间距、字号）：项目变量必须先于 `@import 'uview-pro/theme.scss'` 声明，才能借 `!default` 覆盖 uView Pro 主题。通用交互一律复用 uView Pro（`u-popup` 弹层、`u-empty` 空态、`u-button`、`u-form` 校验等），不重复自绘；业务特有组件放 `src/components/` 并显式 import（easycom 只接管 `u-` 前缀）：`product-card`、`price-tag`、`sku-picker`（基于 `u-popup`，尺码 × 甲型双组选择）、`order-card`、`material-row`、`step-editor`、`media-uploader`（图片与短视频选择、预览、删除）、`review-card`（含图/视频播放）、`shipping-bar`（商品小计/运费/合计）、`legal-doc`（协议正文渲染）、`login-sheet`（基于 `u-popup` 的快捷登录弹层）。全部 rpx 布局，图片 `mode="aspectFill"` + `lazy-load`。

### 10. 登录时机：启动静默登录 + 按需快捷登录弹窗

启动路径不做强制登录弹窗，分两层：

1. **启动静默登录**：`App.vue` 的 `onShow` 检查本地 `user_session`；无会话或 `uni.checkSession` 校验失效时，调用 `uni.login` 换 code，经 `userApi` 静默换取会话并写回 storage。`uni.login` 换 code 无需用户授权同意，全程无感知；静默失败（弱网等）不阻塞进入，保持浏览态，待下次需要身份的动作再补票。
2. **按需快捷登录弹窗**：浏览类路径（首页、商品列表/详情、尺码指引）不要求登录；当下单/结算、收藏、查看订单等需要身份的动作触发 `useAuthGuard()` 未通过时，弹出快捷登录弹层（`src/components/login-sheet.vue`，基于 `u-popup` 的底部弹层；真实模式提供 `getPhoneNumber` 手机号快捷按钮，mock 模式直接模拟成功）。用户拒绝或关闭弹层则留在当前页面继续浏览，不循环弹出。

**理由**：启动强制弹窗会打断浏览、被拒后状态难处理（循环弹或未登录裸奔），微信审核也不鼓励启动强授权；美甲店业务的真实登录动机是手机号（下单联系顾客），放在动作节点授权意愿更高。启动静默登录同时补上决策 3 中 `uni.addInterceptor` 覆盖不到的扫码/`reLaunch` 直入路径。**替代方案**：启动时弹快捷登录弹窗（打断体验、拒绝态处理尴尬）；维持纯页面级被动登录（未登录时首次网络请求即失败，体验差且无兜底）。

### 11. 规格矩阵按「已配置组合」存储，「其他」备注落在订单

商品持有扁平的 `skus[]`，只有店主实际配置的组合才存在，不预生成 4×4 全矩阵：

- 尺码枚举 `S | M | L | OTHER`，甲型枚举 `SHORT_ROUND | MEDIUM | LONG_TAPER | OTHER`，中文展示名由 `SIZE_LABELS` / `SHAPE_LABELS` 映射，避免中文字面量散落在页面里。
- `sku-picker` 先选尺码、再按已配置组合过滤可选甲型；未配置的组合置灰而非隐藏，用户能看出「这个组合没做」而不是以为漏加载。
- 选中 `OTHER` 时，详情页只提示「需在下单页填写定制备注」，真正的必填校验放在结算页：结算商品的 `skus` 中任一 `size === 'OTHER' || shape === 'OTHER'` 就展示定制备注输入框并校验非空。备注写入 `order.customNote`，为订单级字段，因此加购阶段同一 SKU 仍可合并为一行，不引入「同 SKU 不同备注」的行分裂。
- 商品价格拆成 `product.price`（基础价）+ `sku.priceDiff`（可为负），成品价在投影层算好再下发，页面不重复做加法；管理端校验成品价 > 0。

**理由**：全矩阵会产生大量 `stock = 0` 的僵尸 SKU，管理端无法区分「没做」与「卖完」；订单级备注比 SKU 级备注少一层数据结构，且符合「定制诉求只在一次下单里表达一次」的实际场景。**替代方案**：SKU 内嵌 `customNote`（同一 SKU 多行、购物车合并规则复杂）；用 `pieceCount` 代替甲型（无法表达短圆/中长/长梯的工艺差异）。

### 12. 角色权限用一张表驱动前端与数据层

`src/utils/permissions.ts` 导出 `Role = 'owner' | 'artist'` 与 `ROLE_PERMISSIONS: Record<Role, Permission[]>`，页面入口渲染、路由守卫、mock handler 三处都读同一张表：

| 能力 | owner | artist |
| --- | --- | --- |
| 商品列表与详情（管理视角）/ 编辑 / 上下架 | ✓ | — |
| 制作资料读取（材料清单 + 步骤） | ✓ | ✓ |
| 制作档案写入（材料、步骤、成本） | ✓ | — |
| 成本与工时读取 | ✓ | — |
| 订单查看与发货 | ✓ | — |
| 评价查看 / 隐藏 / 删除 | ✓ | — |
| 运费配置 | ✓ | — |
| 账号管理 / 发码 / 停用 / 重新生成码 | ✓ | — |

- 前端：工作台按 `ROLE_PERMISSIONS` 过滤模块；`useAdminGuard('product:write')` 之类在页面 `onLoad` 首行拦截；跳转封装同样校验，双重避免「入口隐藏了但路径可直入」。
- 数据层：mock handler 入口 `requirePermission(session, 'order:ship')`，不通过直接返回 `403`，并在返回前按角色选投影函数。真实后端接入时这张表对应后端的权限中间件，前端表只负责体验。
- 美甲师不复用商品管理页：单独提供 `pages-admin/craft/list.vue`（只读商品+档案入口），避免在同一个页面里用 `v-if` 藏按钮，藏漏一个就是越权入口。

**理由**：权限散落在各页面的 `v-if` 里无法审计，也无法保证接口层一致；一张表可以同时被 UI、守卫和 handler 引用，改一处即全局生效。**替代方案**：按角色复制两套页面（维护成本翻倍，且数据层仍需另做校验）。

### 13. 运费由纯函数计算，服务端为权威

`src/utils/shipping.ts` 提供 `calcShipping(config: ShippingConfig, paidSets: number): number`：`paidSets >= freeShippingThreshold` 返回 0，否则返回 `flatFee`。`paidSets` 只累加 `isAccessory !== true` 的行数量，工具包不参与。

- 结算页展示三段金额：商品小计、运费（含「已满 X 副包邮 / 再买 Y 副包邮」提示）、应付合计。
- 下单时 mock 的 `order/create` 用同一函数重新计算并写入 `order.shippingFee`，**不信任前端传来的金额**；前端传入的金额仅用于展示对账。
- `shippingConfig` 缺失时回退到 `{ freeShippingThreshold: 2, flatFee: 0 }`？不采用：缺失即视为未配置，按 `freeShippingThreshold: 2` + `flatFee: 8`（`src/config/env.ts` 的默认值）计算并提示店主尽快配置，避免「静默包邮」造成资损。

**理由**：金额计算必须只有一个实现，否则「1 副收 8 元、2 副免邮」在购物车、结算页、订单详情三处很容易算出三个结果。**替代方案**：在页面内联计算（三处重复，改规则必漏）；把运费写进每个 SKU（运费是主体级配置而非商品属性，改一次要动上千条数据）。

### 14. 搜索只做字面匹配 + 标签，分页在契约层

`productApi.search({ keyword, sort, page, pageSize })` 返回 `{ list, total, page, hasMore }`：

- 匹配规则：`name.includes(keyword)` 或 `tags.some(tag => tag.includes(keyword))`，大小写不敏感，`keyword` 去首尾空格后为空则不按关键字过滤。
- 排序 `sort` 枚举为 `default | sales | newest | price`（综合 / 销量 / 上新 / 价格，对应原型列表页排序 chips），替代旧的风格/甲型筛选参数 `style` / `shape`；用户端不再提供分类筛选。
- 列表页与搜索结果页共用同一个分页容器：首屏 `page = 1`，`onReachBottom` 时 `page + 1`，`hasMore === false` 后停止请求并展示「没有更多了」。
- 搜索入口位于商品列表页（「分类」tab）顶部；首页不含搜索框与分类入口，仅「全部款式」链接跳转列表页。列表页 `onLoad` 读取参数后重置到第一页。
- 明确不做拼音、分词、同义词与搜索历史（历史属于本地便利功能，不进入 MVP 契约）。

**理由**：上千款商品在 mock 内存里做 `includes` 完全够用，分页契约一旦定死，接真实后端时只改 transport；过早引入分词会把 ES/分词器依赖带进 MVP。**替代方案**：一次性拉全量到前端过滤（上千条数据在低端机上首屏明显变慢，且与分页契约冲突）。

### 15. 素材统一走 `media` 适配层

- 商品详情：`product.images[]` 走 `u-swiper`，`product.video` 最多 1 个，用原生 `<video>` 或 uView 播放组件，无视频时整块不渲染。
- 制作步骤：`step.images[]`（上限 9 张）+ `step.video?`（最多 1 个），编辑态用 `uni.chooseMedia({ mediaType: ['image','video'] })`，预览用 `uni.previewImage`；排序沿用现有上移/下移，不引入拖拽库。
- 评价：`media[{ type, url }]`，图片上限 9 张或 1 个视频（二选一，避免一条评价同时塞满两种媒体）。
- 上传统一收敛到 `src/api/upload.ts`：mock 模式直接返回本地临时路径（页面可立即预览），真实模式调 `uni.uploadFile`；页面不直接调用 `uni.uploadFile`，便于后端接入时替换。
- 所有媒体 URL 一律远程地址或临时路径，不把演示视频打进包内（主包 2MB 限制）。

### 16. 收藏改为服务端同步，本地只做缓存

`favoriteApi.list() / toggle(productId)` 读写 mock 的 `favorites: { [userId]: string[] }`；登录成功后拉取一次写入 `stores/favorite`（不 `persist`），商品详情与收藏列表都读 store，`toggle` 先乐观更新再以服务端结果为准，失败回滚并 toast。退出登录清空 store。

**理由**：需求要求「A 设备收藏、B 设备可见」，本地持久化在该场景下必然失败；把收藏放进服务端也让「收藏已下架」能在列表渲染时即时判断。**替代方案**：本地存储 + 登录时上传合并（冲突规则难解释，且首次登录前的收藏无法归属账号）。

### 17. 评价先发先显，隐藏即从用户端消失

- 发表入口只在 `order.status === 'completed'` 且 `order.reviewed === false` 时出现；提交写 `review` 表并置 `order.reviewed = true`，同一订单项只能评一次。
- 用户端只读 `visible = true` 的评价，按 `createdAt` 倒序分页；评分统计在投影时按可见评价重算，隐藏后统计同步变化。
- 店主在 `pages-admin/review/list.vue` 可隐藏/恢复/删除；删除为物理删除，隐藏为 `visible = false`。管理端列表展示关联订单号，但不 join 制作档案与成本。

### 18. 协议页为内容配置驱动

`src/config/legal.ts` 导出 `legalDocs: { key: 'terms' | 'privacy', title, version, updatedAt, sections: { heading, paragraphs[] }[] }`；两个独立页面 `src/pages-user/legal/terms.vue` 与 `privacy.vue` 各自只传自己的 `key` 给共用组件 `src/components/legal-doc.vue`，`sections` 为空时展示「内容整理中」占位。正文后续补充只改配置，不发版不改页面结构。

## Risks / Trade-offs

- 前端守卫可被绕过（改本地 storage 或伪造 token）→ mock 层同样按 token 校验并投影，且契约层明确标注真实安全由后端字段过滤承担；验收只声明前端拦截效果，不宣称安全边界。
- mock 数据与未来后端契约漂移 → 契约与投影集中在 `api/`，后端接入时以 `contract.ts` 为对齐清单，并保留 `assertNoSensitive` 联调回归。
- 基线与业务同批交付 → 首次可运行时间推迟，基线问题会直接阻塞业务；缓解：任务 0.x 先行，`type-check` 与双端构建作为每步门槛，基线阶段不写业务代码。
- uView Pro 处于 0.x，接口可能破坏性变更 → 精确锁定 `0.6.23`，接入点只出现在固定的四处，升级作为独立变更并跑双端回归。
- Pinia 锁 2.1.7、Sass 锁 1.63.2 均偏旧 → 仅为兼容当前 Vue 3.4.21 与 uView Pro 的 `@import` 语法，升级条件写进 Open Questions，不在此期间混入其他依赖升级。
- easycom `^u-(.*)` 会接管所有 `u-` 前缀组件 → 自研组件一律放 `src/components` 并显式 import，不使用 `u-` 前缀。
- 主包体积超限 → 已分包；若仍超限，把 `product/detail` 迁入 `pages-user` 并接受分享落地多一跳。
- 入口码遗失或转发给非授权者 → 码与账号一一绑定，店主可停用账号或重新生成码；管理端不做「长期有效口令」，避免一码泄露即全员可进。
- 扫码链路依赖 `scene` 解析，开发者工具与真机行为不同 → `auth` 页同时接受 `entry` 与 `scene` 两种参数，mock 模式提供演示码按钮，真机验收时再走一次真实二维码。
- 角色权限只在前端生效 → mock handler 逐个写接口做 `requirePermission`，并把「美甲师调用改价/上下架被拒」列为验收场景，真实后端接入时以同一张权限表复刻。
- 一人一码的生成与小程序码图片需要后端 → MVP 只生成入口码字符串与分享文案，二维码图片由后端后续补；前端不假设扫码来源一定存在 `scene`。
- 购物车仍用本地存储 → 换设备不可见属于已接受的边界；收藏改为服务端同步，二者差异在实现时容易混淆，统一在 store 命名上区分（`cart` 为本地、`favorite` 为服务端缓存）。
- 运费阈值与固定邮费可被店主改错 → 管理端做非负与阈值 ≥ 1 的校验，结算页展示明细（商品小计 / 运费 / 合计），金额异常能被用户看见而不是静默吞掉。
- 上千款商品全量拉取会拖慢首屏 → 列表、搜索、收藏均分页，管理端商品列表同样分页与按关键字过滤。
- 评价先发先显存在违规内容风险 → 依赖店主隐藏/删除兜底，并在协议页写明评价规范；MVP 不做关键词过滤与人工审核队列。
- 图片与视频使用远程地址或临时路径，弱网下详情页空白 → 加骨架屏与失败占位图，封面使用固定尺寸避免布局抖动；视频不自动播放，点击后才加载。

## Migration Plan

本变更仍无线上版本，但工作区已有按旧模型（单值甲型 + `pieceCount`、口令管理端、本地收藏、线上售后）完成的实现，需要就地迁移而非纯新增。落地顺序：契约与 mock 数据模型升级（枚举、SKU 矩阵、运费配置、账号/入口码、评价）→ 迁移种子数据与旧购物车/订单数据（旧 SKU 的 `pieceCount` 转为商品级 `piecesPerSet`，旧商品级 `shape` 下放到每个 SKU 的 `shape`，读取时做一次兼容转换后写回新结构）→ 规格选择与结算金额改造 → 扫码入口与角色权限 → 内容与素材、搜索分页、收藏同步、协议页 → 移除线上售后与口令登录 → 验收回归。每阶段以 `type-check` 与双端构建为门槛。

首次运行需在 `src/manifest.json` 填入自测 appid，并在 `src/config/env.ts` 保持 `MOCK_MODE = true`。

## Open Questions

- `createUniPersistPlugin(prefix)` 的前缀取值与 `user_session`、`admin_session` 两个既有 key 的关系（前缀会改变实际 storage key），在实施第一步定稿。
- Pinia 升级到 2.2+ 与 Sass 升级到 1.80+ 的前提分别是 uni-app 编译器升到 Vue 3.5.x、uView Pro 改用新 `@use` 语法，均属独立变更。
- 真实微信支付与客服消息需商户号与后端，待服务端立项时确定。
- 真实小程序码的生成与领取方式（`getwxacodeunlimit` 的 `scene` 长度上限 32 字符）需在接入后端时确认；入口码字符串或将改为短码 + 服务端映射。
- 工时如何折算为人工成本（固定时薪还是店主自填单价）暂按「工时 × 主体配置时薪」预留字段，MVP 不强制计算人工成本，只展示工时。
- 多主体隔离目前只在 mock 层按 `merchantId` 过滤，真实环境需要后端在鉴权阶段绑定主体并在每条查询强制注入，需与后端确认不可绕过的实现方式。
- 新增美甲师账号与角色变更由服务端/后台工具完成，前端不提供入口；mock 阶段以种子账号模拟，需与后端确认开通流程与账号-主体绑定方式。
- 工具包是否需要独立库存与规格（当前按无规格商品处理）待店主确认；若需要，按普通商品的 SKU 结构扩展即可，契约不变。
- 评价是否需要「仅购买者可评」之外的限制（如同 IP 频次）留待真实运营反馈。
- 真实模式 `getPhoneNumber` 手机号快捷登录要求非个人主体且完成认证的小程序，接入后端时确认资质；mock 阶段以模拟登录替代，契约不变。
