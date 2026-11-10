# Tasks

> 前置条件：无（本变更自带工程基线）。第 0 节完成并通过 `npm run type-check`、`build:h5`、`build:mp-weixin` 后，才进入业务任务。全部代码使用 TypeScript（`strict`）、Pinia setup store 与 uView Pro 组件；不新建 `.js` 文件。
>
> 增量说明：第 12–15 节为本次产品决策的增量任务，会重写部分已完成实现。冲突时以 12–15 节为准，被取代的旧任务为：4.3（`sku-picker` 的尺码 + 甲片数量）、4.4（详情页规格与素材）、5.1（购物车按 `skuId` 分行，语义改为尺码 × 甲型）、6.1（结算页无运费与定制备注）、6.5（线上售后申请）、7.1 与 7.2（口令鉴权与长按入口）、8.2（商品仅维护尺码与甲片数量）、10.2（管理端售后审批）。
>
> 原型对齐增量：第 16 节按 `docs/nail-prototype-v1.html`（v1.1）对齐页面与流程，冲突时以 16 节为准，被取代的旧任务为：1.1（5 个 tabBar）、4.1（首页搜索入口与分类入口）、4.2（列表页分类筛选）、4.4（详情页工具包勾选与尺码指引入口）、6.1（结算页订单备注）、6.4（订单详情售后入口形态）、13.4（售后改为协商意向页 + 协商记录）、13.5（独立运费配置页并入「评价与规则」页）、14.5（账号管理的新增美甲师与分配角色）、14.7（独立评价管理页并入「评价与规则」页）。

## 0. 工程基线

### 依赖与构建配置

- [x] 0.1 调整 `package.json` 依赖：新增 `uview-pro@0.6.23`、`pinia@2.1.7`、`typescript@~5.9.3`、`vue-tsc@^2.2.12`、`@vue/tsconfig@^0.9.1`、`@types/node`、`sass@1.63.2`；移除 `@dcloudio/uni-app-plus`、`uni-app-harmony`、`uni-mp-alipay/baidu/jd/kuaishou/lark/qq/toutiao/xhs/harmony`、`uni-quickapp-webview`；验证：`npm install` 成功且无 ERESOLVE，`npm ls vue pinia uview-pro typescript vue-tsc sass` 版本与计划一致。
- [x] 0.2 新建 `tsconfig.json`（extends `@vue/tsconfig/tsconfig.json`、`strict: true`、`paths["@/*"] → ["./src/*"]`、`types: ["@dcloudio/types"]`、include `src/**/*.ts|d.ts|vue`）与 `tsconfig.node.json`（仅 `vite.config.ts`、`types: ["node"]`）；验证：`npx tsc --noEmit -p tsconfig.node.json` 通过，且应用侧配置不含 `node` 类型。
- [x] 0.3 将 `vite.config.js` 替换为 `vite.config.ts`：`fileURLToPath(new URL('./src', import.meta.url))` 配置 `@` 别名、`loadEnv(mode, process.cwd(), 'VITE_')` 读取环境变量、`build.sourcemap` 仅非生产开启、固定 `server.port = 5173`；验证：`npm run dev:h5` 启动于 5173，页面中通过 `@/` 导入的模块可编译。
- [x] 0.4 新增 `.env.development`、`.env.production`（均只声明 `VITE_APP_ENV`）与 `src/types/env.d.ts`（`/// <reference types="vite/client" />`、`ImportMetaEnv.VITE_APP_ENV`）；验证：`npm run build:h5` 产物中 `import.meta.env.VITE_APP_ENV` 被替换为对应值，且类型检查对未声明的 `import.meta.env.VITE_XXX` 报错。
- [x] 0.5 收敛 `package.json` 脚本为 `dev:h5`、`build:h5`、`dev:mp-weixin`、`build:mp-weixin`、`type-check`（`vue-tsc --noEmit && tsc --noEmit -p tsconfig.node.json`）；验证：`npm run` 列表只有这 5 条，`npm run type-check` 在空壳工程下退出码为 0。

### TypeScript 迁移

- [x] 0.6 迁移入口与现有组件：`src/main.js` → `src/main.ts`，`src/App.vue` 改用 `defineComponent` + `lang="ts"`，`src/pages/index/index.vue` 改为 `<script setup lang="ts">` 并为 `ref` 显式标注类型；验证：`npm run type-check` 零错误，`npm run build:h5` 与 `npm run build:mp-weixin` 均成功。
- [x] 0.7 合并重复类型声明：删除根 `shims-uni.d.ts` 与 `src/shime-uni.d.ts`，新建 `src/types/shims-uni.d.ts`（`*.vue` 模块声明 + `ComponentCustomOptions extends App.AppInstance & Page.PageInstance`）；验证：`npm run type-check` 零错误，仓库内不再存在两份 `ComponentCustomOptions` 声明，页面 `onLoad`/`onLaunch` 有类型提示。
- [x] 0.8 清理残留 JS：确认 `src/` 下无 `.js` 文件、无未声明 `lang="ts"` 的 `<script>` 块，`vue-i18n` 等未使用依赖保持原状；验证：`Get-ChildItem -Recurse src -Filter *.js` 无输出，全量搜索 `<script>` 仅命中带 `lang="ts"` 的块。

### Pinia

- [x] 0.9 新建 `src/stores/index.ts`（唯一 `createPinia()` 实例并安装持久化插件）、`src/stores/persist.ts`（`createUniPersistPlugin(prefix)`：`uni.getStorageSync` 回填、`store.$subscribe({ detached: true })` 写回、支持 `persist: true | { key, paths }`）、`src/types/pinia.d.ts`（对 `DefineStoreOptionsBase` 增强 `persist` 选项），并在 `main.ts` 中 `app.use(pinia)`；验证：`npm run type-check` 零错误，store 定义处无需 `as any` 即可传 `persist`。
- [x] 0.10 新建示例 store `src/stores/app.ts`（启动次数、最近活跃时间，`persist: true`），在演示页通过 `@/stores/app` 读取并自增；验证：H5 刷新后计数保留，微信开发者工具重新编译/重启后计数保留，storage 中出现带统一前缀的 key。
- [x] 0.11 验证持久化的边界：清空对应 storage key 后计数回到初始值，未声明 `persist` 的 store 不写 storage；验证：开发者工具 Storage 面板操作后页面行为符合预期，且 `src/stores/persist.ts` 对缺失/损坏数据不抛异常。

### uView Pro 接入

- [x] 0.12 在 `src/pages.json` 增加 `easycom`（`autoscan: true` + `"^u-(.*)": "uview-pro/components/u-$1/u-$1.vue"`），`src/main.ts` 中 `app.use(uviewPro)`，`src/uni.scss` 先声明设计 token 再 `@import 'uview-pro/theme.scss'`，`src/App.vue` 的 `<style lang="scss">` 引入 `uview-pro/index.scss`；验证：演示页使用 `<u-button>` 在 H5 与微信开发者工具中正常渲染，无需手动 import。
- [x] 0.13 在 `tsconfig.json` 的 `types` 加入 `uview-pro/types`，演示页调用 `uni.$u.toast` 并给 `u-button` 传 `type`；验证：`npm run type-check` 零错误，编辑器可提示 `uni.$u` 与组件 props，运行时点击按钮出现 toast。
- [x] 0.14 核验按需打包与体积：`npm run build:mp-weixin` 后检查 `dist/build/mp-weixin` 只包含实际使用组件的代码；验证：产物中不存在整库组件拷贝（未使用的组件如 `u-calendar` 不出现），微信开发者工具显示主包体积 < 2MB。

### 基线集成验收

- [x] 0.15 顺序执行 `npm run type-check`、`npm run build:h5`、`npm run build:mp-weixin`，三条命令退出码均为 0 且无报错；验证：命令输出保留为验收证据。
- [ ] 0.16 双端冒烟：H5 与微信开发者工具中演示页渲染 uView Pro 按钮、Pinia 计数可自增且重启保留、`uni.$u` 调用正常，控制台无 error、无 Sass 弃用告警；验证：两端各完整操作一次并记录截图。
- [x] 0.17 核验平台裁剪与残留：`package.json` 不含已删除平台包、`npm run` 不含其他平台脚本、`node_modules/@dcloudio` 不含已移除包；验证：命令输出与文件内容一致，`npm run type-check` 仍通过。

## 1. 基线校验与业务工具

- [x] 1.1 在基线上补齐路由结构：`src/pages.json` 配置 5 个 tabBar 页（首页 / 商品 / 购物车 / 订单 / 我的）、主包商品详情页与 `pages-user`、`pages-admin` 两个分包，并为 `pages/index` 配置仅预下载 `pages-user` 的 `preloadRule`（保留 easycom `^u-(.*)` 规则）；验证：`npm run dev:mp-weixin` 与 `npm run type-check` 均通过，微信开发者工具出现 5 个 tab 且 tabBar 中无管理端条目。
- [x] 1.2 在 `src/config/env.ts` 增补业务配置（`MOCK_MODE`、请求 baseURL、管理口令占位，类型显式声明），并在 `src/uni.scss` 中于 `@import 'uview-pro/theme.scss'` **之前**扩展设计 token（主色、圆角、间距、字号）；验证：`u-button` 主色显示为项目主色，首页任一区块颜色与圆角取自变量而非硬编码。
- [x] 1.3 补齐 `src/manifest.json` 的微信小程序 appid 与名称，添加 tabBar 图标与占位封面资源；验证：开发者工具不再提示 appid 缺失，tabBar 图标正常显示，主包体积仍在上限内。
- [x] 1.4 建立 `src/utils/` 业务工具（全部 `.ts`，函数签名显式标注）：`price.ts`（分/元格式化、金额求和）、`storage.ts`（key 前缀 + JSON 序列化，读接口用泛型）、`router.ts`（封装 `navigateTo/redirectTo/switchTab` 并统一处理登录与管理员拦截）；验证：`npm run type-check` 通过，`price.ts` 对 0、小数、大额三种输入的控制台断言输出正确。

## 2. 接口契约与本地数据层（TS）

- [x] 2.1 编写 `src/api/contract.ts`，用 `interface` / `type` 导出 `PublicProduct`、`PublicProductDetail`、`AdminProduct`、`CraftArchive`、`MaterialLine`、`CraftStep`、`CartLine`、`Order`、`Address`、`AdminSession`，并以 `as const` 导出 `PUBLIC_PRODUCT_FIELDS`、`SENSITIVE_KEYS`；验证：`npm run type-check` 通过，两组常量与 `specs/data-visibility` 列出的字段一致。
- [x] 2.2 实现 `src/api/projections.ts`：`toPublicProduct`、`toPublicProductDetail`、`toPublicOrder`、`toAdminProduct` 四个白名单投影函数（入参与返回类型取自 `contract.ts`）与 `assertNoSensitive(obj: unknown, path: string): void`；验证：对含 `materials/steps/costPrice` 的完整对象投影后，`assertNoSensitive` 通过且结果类型中不存在这些键。
- [x] 2.3 编写 `src/mock/seed.ts` 与 `src/mock/db.ts`（种子与数据存储均使用契约类型）：种子数据覆盖至少 8 个商品（含 2 个下架）、每个商品多规格库存、3 份制作档案、若干历史订单与地址，读写经 `uni.setStorageSync` 持久化；验证：清空缓存后首次进入可读到种子数据，修改后重启小程序改动仍在。
- [x] 2.4 实现 `src/mock/handlers.ts`：按接口路径分发商品、购物车、订单、地址、收藏、售后、管理端商品、档案、管理端订单等 handler，返回类型均为契约类型，所有用户端出口经投影并调用 `assertNoSensitive`，所有管理端出口先校验 `admin_session`；验证：控制台直接调用用户端商品详情 handler 返回对象中无敏感键，无 token 调用档案 handler 返回无权限错误。
- [x] 2.5 编写 `src/api/transport.ts` 与各域 API（`productApi`、`cartApi`、`orderApi`、`userApi`、`addressApi`、`adminApi`，均为 `.ts`），mock 分支带 200~400ms 延迟，统一错误类型 `{ code: number; message: string }` 并在 transport 层归一化；验证：`MOCK_MODE=true` 时页面调用均返回数据，置为 `false` 时走 `uni.request` 且在无后端情况下给出可读错误提示。
- [x] 2.6 新增 `docs/api-contract.md` 记录每个接口的路径、入参、返回字段与可见性等级（公开 / 管理员），标注档案类接口为管理员专属；验证：文档列出的接口与 `src/api/*.ts` 导出逐一对应，无遗漏或多出。

## 3. 登录、个人中心、地址与收藏（Pinia + uView Pro）

- [x] 3.1 实现 `src/stores/session.ts`（`defineStore` setup 语法 + 基线 `createUniPersistPlugin` 持久化 token 与过期时间）与 `src/api/user.ts` 的登录/登出/会话恢复（mock 返回固定昵称头像，真实模式走 `uni.login` 换 code），并在 `src/App.vue` 的 `onShow` 实现启动静默登录：检查本地 `user_session`，无会话或 `uni.checkSession` 失效时静默换取会话写回 store，失败不阻塞进入、不弹任何登录弹窗；验证：清空缓存后首次启动无登录弹窗且后台完成静默登录，登录后个人中心显示昵称头像，重启小程序仍保持登录，登出后恢复未登录态。
- [x] 3.2 实现个人中心页 `src/pages/profile/index.vue`（`<script setup lang="ts">`）：登录引导、订单状态快捷入口、收藏、地址管理、客服入口，入口区用 uView Pro 的 `u-cell-group`/`u-cell` 组织，并支持长按版本号触发管理端跳转（跳转前不做任何管理数据请求）；验证：未登录时入口点击先触发登录，长按版本号跳转到 `pages-admin/auth`。
- [x] 3.3 实现收藏能力：商品详情收藏按钮、`src/pages-user/favorite/index.vue` 列表与移除、下架商品标记；验证：收藏后详情按钮变为已收藏，收藏列表可移除且详情状态同步，已下架收藏项不可点击购买。
- [x] 3.4 实现地址管理 `src/pages-user/address/list.vue` 与 `edit.vue`：新增/编辑/删除、首条自动默认、设为默认、收货人/手机号/详细地址校验（表单用 `u-form` + `u-form-item` 规则校验）；验证：手机号填 `123` 提交被拦截并定位字段，删除默认地址后剩余地址自动成为默认。
- [x] 3.5 实现快捷登录弹层 `src/components/login-sheet.vue`（基于 `u-popup` 的底部弹层，props/emits 显式类型）并接入 `useAuthGuard()`：未登录触发需要身份的动作（下单/结算、收藏、查看订单、个人中心入口）时弹出，同意授权后建立会话并继续原动作、保留所在页面；关闭或拒绝则留在当前页可继续浏览，不循环弹出；mock 模式模拟登录成功，真实模式预留 `getPhoneNumber` 手机号快捷按钮（契约不变）；验证：未登录分别触发加购与收藏均弹出弹层，拒绝后留在原页可继续浏览且不再自动弹出，同意后原动作继续完成且页面未跳转丢失。

## 4. 商品浏览主流程

- [x] 4.1 实现首页 `src/pages/index/index.vue`：轮播用 `u-swiper`、推荐商品位、风格与甲型分类入口、空态用 `u-empty`；验证：仅展示上架商品，点击分类进入列表页且筛选条件已带入，删空推荐数据时不报错并显示空态。
- [x] 4.2 实现商品列表页 `src/pages/product/list.vue`：封面/名称/售价/销量、风格与甲型筛选（`u-dropdown` 或 `u-tabs`）、清空筛选、空态（`u-empty`）与加载态；验证：切换筛选后结果收敛，清空后恢复全量，页面源码中不出现成本或工艺字段。
- [x] 4.3 实现业务组件 `product-card`、`price-tag`、`sku-picker`（`.vue` + `<script setup lang="ts">`，`sku-picker` 基于 `u-popup`；空态不自绘，直接用 `u-empty`）；验证：`sku-picker` 在未选全规格时确认按钮禁用，库存为 0 的规格展示售罄且不可选；`npm run type-check` 对组件 props 无报错。
- [x] 4.4 实现商品详情页 `src/pages/product/detail.vue`：多图轮播（`u-swiper`）、名称/售价/销量、规格选择、加入购物车、立即购买、收藏入口、尺码指引入口；验证：未选规格点购买被提示拦截，选好规格后两种按钮分别进入购物车与结算流程，页面 DOM 中不含材料/步骤/成本区块。
- [x] 4.5 实现尺码测量指引页 `src/pages-user/guide/size.vue`：测量步骤图文、尺码对照表、常见问题；验证：任意角色可直接打开，页面内容仅涉及测量与选码。

## 5. 购物车（Pinia）

- [x] 5.1 实现 `src/stores/cart.ts`（setup store + `persist` 按用户维度 key）与 `cartApi`：按 `skuId` 分行、同规格数量合并、增删改数量、库存上限、登出时 `$reset` 并清 key；验证：同规格二次加购变为一行且数量累加，超过库存上限时数量不再增加并提示。
- [x] 5.2 实现购物车页 `src/pages/cart/index.vue`：行内规格与库存展示、勾选/全选用 `u-checkbox-group`、数量用 `u-number-box`、合计件数与金额、失效行标记、去结算；验证：勾选两行后合计金额等于各行售价×数量之和，无勾选时结算按钮禁用，下架商品行不计入合计。
- [x] 5.3 打通「加入购物车 → 未登录弹快捷登录 → 登录后继续加购」链路，保留所选规格；验证：未登录加购在弹出的 `login-sheet` 完成登录后，购物车中仍出现该规格行。

## 6. 下单、支付与订单

- [x] 6.1 实现结算页 `src/pages-user/checkout/index.vue`：商品清单、默认地址选择、备注（`u-textarea`，`maxlength=100`）、金额合计、提交订单；验证：无地址提交被拦截并跳转地址编辑页，填写备注后订单详情可见该备注。
- [x] 6.2 实现 `src/api/payment.ts` 与订单创建：`payOrder(orderId: string)` 类型化，创建 `pending_pay` 订单、清理购物车已选中行、mock 支付成功/取消两分支、待付款超时自动取消；验证：支付成功订单变 `pending_ship`，取消后仍为 `pending_pay` 且详情有「继续支付」，超时订单变 `cancelled`。
- [x] 6.3 实现订单列表 `src/pages/order/list.vue`：状态筛选（`u-tabs`：全部/待付款/待发货/待收货/已完成）、订单卡片信息、空态；验证：切换筛选结果正确，卡片含订单号、缩略图、规格、数量、实付金额与状态。
- [x] 6.4 实现订单详情 `src/pages-user/order/detail.vue`：按状态渲染操作（继续支付/取消、查看物流、确认收货、再次购买、申请售后）与物流轨迹（`u-steps`）；验证：确认收货后状态变 `completed`，查看物流展示公司与单号及倒序轨迹，发货前取消变 `cancelled`。（其中的售后入口已被 13.4 改为「联系客服」）
- [x] 6.5 实现售后申请 `src/pages-user/aftersale/apply.vue`：类型选择（`u-radio-group`）、原因与说明（`u-form` 校验）、提交后订单显示「售后处理中」、重复申请拦截；验证：提交一次后再点申请被阻止并提示当前进度。（已被 13.4 取代：线上售后整体移除）

## 7. 管理端鉴权与访问控制

- [x] 7.1 实现 `src/stores/admin.ts`（setup store，`persist` 指向独立 key `admin_session`，含 token 与过期时间）、`src/pages-admin/auth/index.vue` 口令鉴权页（`u-form`）与 `src/pages-admin/index/index.vue` 工作台（商品管理 / 订单管理 / 退出）；验证：正确口令进入工作台，错误口令提示失败且不写会话，退出后再次进入需重新鉴权。
- [x] 7.2 实现 `src/utils/admin-guard.ts` 的 `useAdminGuard(): boolean` 与 `uni.addInterceptor` 的导航拦截（拦截器回调类型显式标注，避免 `any`），在每个管理端页面 `onLoad` 首行调用，失败时 `uni.reLaunch` 到首页并 toast「无管理权限」；验证：开发者工具直接输入管理端路径或以普通用户身份长按版本号进入，均被重定向首页且页面不发起管理接口请求。
- [x] 7.3 校验 tabBar 与常规可见区域无管理入口，且 `pages-admin` 未配置预下载；验证：检查 `src/pages.json` 与页面源码，tabBar 列表仅含 5 个用户端页面，`preloadRule` 不含 `pages-admin`。

## 8. 管理端商品管理

- [x] 8.1 实现 `src/pages-admin/product/list.vue`：商品列表、上下架切换（`u-switch`）、搜索（`u-search`）、进入编辑与制作档案入口；验证：切换上下架后用户端列表/详情即时反映，下架商品不可加购。
- [x] 8.2 实现 `src/pages-admin/product/edit.vue`：名称、展示图、风格/甲型分类、售价、规格（尺码×甲片数量）与库存维护、必填与数值校验（`u-form` 规则），新增默认下架；验证：漏填名称或售价时保存被拦截并高亮字段，新增商品保存后为下架态，编辑售价不改动历史订单成交价。

## 9. 制作档案（管理员专属）

- [x] 9.1 实现材料清单编辑（`src/components/material-row.vue`，props 用契约类型 + 档案页材料区）：类别、名称、型号/色号、用量与单位，增行/改/删、必填校验、序号收紧；验证：缺名称或用量时整份档案保存被阻止，删除中间行后序号连续。
- [x] 9.2 实现分步制作步骤编辑（`src/components/step-editor.vue`）：说明文字 + 至少一张步骤图（上传/选择走 `uni.chooseMedia`，预览用 `uni.previewImage` 支持左右切换）、上移/下移；验证：缺图或缺说明无法保存，调整顺序后保存并按新顺序重进可见。
- [x] 9.3 实现成本核算区：材料成本、其他成本、预估总成本与按售价计算的预估毛利（金额换算复用 `utils/price.ts`），负值/非数字拦截，售价变更后重算毛利；验证：输入 `-5` 保存被拒，改价后重开档案毛利变化而成本值不变。
- [x] 9.4 将档案写入 mock 数据并与商品解耦存储，删除商品时级联删除档案；验证：删除商品后直接调用档案 handler 返回不存在，用户端商品详情响应不含档案键。
- [x] 9.5 确认 `pages/`、`pages-user/` 下无任何 `craft` 或 `adminApi` 引用，并校验用户端出口投影：保存前与读取后均调用 `assertNoSensitive`；验证：全局搜索引用结果为 0，构建产物中用户端页面不包含档案接口字符串。

## 10. 管理端订单处理

- [x] 10.1 实现 `src/pages-admin/order/list.vue`：状态筛选、订单号搜索（`u-search`）、实付金额与下单时间展示；验证：筛选与搜索组合结果正确，空结果有空态。
- [x] 10.2 实现 `src/pages-admin/order/detail.vue`：订单与收货信息、填写物流公司与运单号发货（`u-form` 必填校验，成功后状态转 `pending_receive`）、售后同意退款/拒绝并填理由（`u-radio-group` + 说明）；验证：缺单号提交被阻止，发货后用户端可查看物流，拒绝售后后用户端显示理由，同意退款后订单标记已退款且不可再申请。（售后审批部分已被 13.4 取代：线上退款流程移除，改为展示定制备注）

## 11. 集成验收

- [ ] 11.1 端到端走通用户主流程：浏览 → 加购 → 结算 → 支付 → 订单列表与详情，确认每一步状态与金额正确；同时确认启动过程为静默登录、全程无强制登录弹窗，未登录可完整浏览商品；验证：微信开发者工具真机预览完整走通一遍并记录截图，`npm run type-check` 通过。
- [x] 11.2 端到端走通管理流程：管理员创建商品 → 填材料清单与制作步骤 → 保存 → 用户端打开该商品详情，确认无任何材料/步骤/成本字段；验证：用 `assertNoSensitive` 对实际响应断言通过，并在详情页全部 DOM 文本中搜索材料名关键词无命中。
- [ ] 11.3 验证越权拦截：普通用户通过路径直入、无管理会话（或伪造 admin token）、分享链接三种方式访问管理端页面均被拦截；验证：三种方式各执行一次，均不渲染管理数据且有权限提示。

## 12. 增量：规格模型、内容素材与搜索

- [x] 12.1 重写 `src/api/contract.ts`：新增 `Size = 'S' | 'M' | 'L' | 'OTHER'`、`Shape = 'SHORT_ROUND' | 'MEDIUM' | 'LONG_TAPER' | 'OTHER'`、`SIZE_LABELS` / `SHAPE_LABELS`、`ProductSku { id, size, shape, stock, priceDiff }`；`PublicProduct` 增加 `unit: '副'`、`piecesPerSet`、`tags[]`、`video?`、`isAccessory`；`CraftStep` 改为 `{ order, title, desc, images[], video? }`，`CraftArchive` 的 `materialCost/otherCost` 收敛为 `cost { materialCost, hours, suggestedPrice }`；新增 `ShippingConfig`、`StaffAccount`、`QrCode`、`Review`；`SENSITIVE_KEYS` 增加 `cost`、`hours`、`suggestedPrice`；验证：`npm run type-check` 通过，`SIZE_LABELS`/`SHAPE_LABELS` 覆盖全部枚举且无中文散落在页面。
- [x] 12.2 迁移 `src/mock/seed.ts` 与 `src/mock/db.ts`：商品种子改为「已配置组合」的扁平 `skus[]`（每个商品 3–6 个组合、含 1 个 `OTHER` 组合用于验收）、补充 `tags`、至少 1 个商品带 `video`、1 个工具包商品（`isAccessory: true`）；`MockDb` 增加 `shippingConfig`、`staffAccounts`、`qrCodes`、`reviews`，`favorites` 改为 `Record<string, string[]>`（按 userId）；验证：清空缓存后首次进入读到新结构，`pieceCount` 字段在仓库中零残留，工具包不出现在商品列表的穿戴甲筛选中。
- [x] 12.3 重写 `src/components/sku-picker.vue`：先选尺码（S/M/L/其他）再按已配置组合过滤甲型（短圆/中长/长梯/其他），未配置组合置灰显示「未提供」，选中 `OTHER` 时展示「下单需填写定制备注」提示，价格按 `product.price + sku.priceDiff` 计算；验证：选择「其他」尺码后仅出现该尺码下已配置的甲型，未配置组合不可点击，库存为 0 的组合同样置灰并提示售罄。
- [x] 12.4 改造 `src/pages/product/detail.vue`：图片轮播 + 最多 1 个商品视频（无视频不渲染）、「单位：副 / 每副 X 片」说明（未配置时提示以实物为准）、工具包勾选加购、尺码指引入口；验证：带视频商品可播放且不自动播放，工具包加购后购物车出现独立行，详情页 DOM 与接口响应均无档案字段。
- [x] 12.5 实现搜索与分页：`productApi.search({ keyword, style, shape, page, pageSize })` 返回 `{ list, total, page, hasMore }`，按 `name` 与 `tags` 字面匹配；`src/pages/product/list.vue` 支持关键字参数、`onReachBottom` 加载下一页、`hasMore === false` 展示「没有更多了」，首页搜索框跳转并带上关键字；验证：输入名称片段与标签片段均能命中，翻到末页后不再请求，输入拼音返回空结果且不报错。
- [x] 12.6 实现评价：`src/api/review.ts` + `src/pages-user/review/edit.vue`（评分、文字、最多 9 图或 1 个视频、提交后置 `order.reviewed`）、商品详情评价列表（倒序 + 分页 + 评分统计 + 空态）、同一订单项重复评价拦截；验证：完成订单可发带图与带视频评价，发布后立即出现在详情页首位，再次进入该订单不再出现发表入口。
- [x] 12.7 收藏改服务端同步：`src/api/favorite.ts` 读写 mock 的 `favorites[userId]`，`src/stores/favorite.ts` 不持久化，登录成功后拉取、`toggle` 先乐观更新再以响应为准（失败回滚），登出清空；验证：设备 A 收藏后清缓存重进（模拟设备 B）并登录同账号，收藏列表与详情按钮均为已收藏。
- [x] 12.8 新增协议与政策页：`src/config/legal.ts`（`terms` / `privacy` 的标题、版本号、更新日期、章节数组）、`src/components/legal-doc.vue`、`src/pages-user/legal/terms.vue` 与 `privacy.vue`，个人中心加入两个入口；验证：未登录可直接打开，`sections` 为空时展示占位说明，改配置后页面展示新版本号。
- [x] 12.9 同步更新 `docs/api-contract.md`：补充搜索分页、评价、收藏、运费配置、账号与入口码接口的路径、入参与可见性等级（公开 / artist / owner）；验证：文档条目与 `src/api/*.ts` 导出一一对应。

## 13. 增量：运费、结算与售后

- [x] 13.1 新增 `src/utils/shipping.ts` 的 `calcShipping(config, paidSets): number` 与 `countPaidSets(lines)`（只累加非配件行），`src/api/shipping.ts` 暴露 `getConfig` / `saveConfig`，`src/stores/shipping.ts` 缓存配置（不持久化）；验证：1 副返回 `flatFee`、2 副返回 0、只有工具包时按未达阈值处理，阈值改为 3 后 2 副开始收费。
- [x] 13.2 改造 `src/pages-user/checkout/index.vue`：展示商品小计 / 运费 / 应付合计与「已满 X 副包邮 / 再买 Y 副包邮」提示；当结算行含 `OTHER` 尺码或甲型时展示定制备注输入框并做必填校验（`u-form`），未填写时提交被阻止并定位字段；验证：1 副显示固定邮费且合计正确，2 副运费为 0，含「其他」组合不填备注无法提交。
- [x] 13.3 改造订单创建与 `src/api/contract.ts` 的 `Order`：新增 `goodsAmount`、`shippingFee`、`customNote`、`reviewed`，移除 `afterSale`；mock 的 `order/create` 用 `calcShipping` 重新计算金额并忽略前端传入的运费；验证：篡改前端金额后订单实付仍为服务端计算结果，定制备注在订单详情可见，`afterSale` 字段在契约与 mock 中零残留。
- [x] 13.4 移除线上售后：删除 `src/pages-user/aftersale/apply.vue` 与 `pages.json` 中对应路由，订单详情把「申请售后」替换为「联系客服」（携带订单号上下文），管理端订单详情移除同意退款/拒绝售后；验证：全局搜索无 `aftersale` 路由与 `handleAfterSale` 引用，订单页无退款入口，客服入口可打开客服会话。
- [x] 13.5 新增管理端运费配置页 `src/pages-admin/shipping/config.vue`：包邮阈值（≥1 的整数）与固定邮费（≥0）表单校验，保存写 `shippingConfig` 并按 `merchantId` 隔离；验证：填 0 或负数被拒，保存后用户端结算立即按新配置计算。

## 14. 增量：多账号、角色与扫码入口

- [x] 14.1 扩展数据层权限：`src/utils/permissions.ts` 导出 `Role`、`Permission`、`ROLE_PERMISSIONS` 与 `hasPermission`；mock handler 入口统一 `requirePermission(session, permission)`，无权限返回 `403`；`src/api/projections.ts` 增加 `toArtistArchive()`（无 `cost`）与 `toOwnerArchive()`，`pages-admin` 按角色选择投影；验证：美甲师调用改价/上下架/发货/账号接口均返回 `403` 且数据不变，档案响应中不存在 `cost` 键。
- [x] 14.2 新增账号与入口码能力：`src/api/staff.ts` 的 `resolveEntry(code)`、`listAccounts()`、`createArtist(name)`、`setStatus(accountId, status)`、`setRole(accountId, role)`、`regenerateCode(accountId)`；mock `qrCodes` 按 `code → { accountId, merchantId, status }` 校验，停用账号时把其码置 `invalid`，重新启用生成新码；验证：停用后 `resolveEntry` 返回「入口码已失效」，旧码始终失效。
- [x] 14.3 改造管理端入口为扫码：`src/pages-admin/auth/index.vue` 读取 `entry` 与 `scene` 参数（`decodeURIComponent`）调用 `resolveEntry`，成功写 `admin_session`（含 `accountId / role / merchantId / qrCodeId`）并进工作台，失败按错误码提示并回首页；移除口令表单，`MOCK_MODE` 下额外渲染「使用演示入口码」按钮；验证：店主码进店主工作台，美甲师码进美甲师工作台，篡改码被拒且不泄露账号信息。
- [x] 14.4 角色守卫与工作台：`src/utils/admin-guard.ts` 的 `useAdminGuard(permission?)` 与路由拦截按 `ROLE_PERMISSIONS` 判断，工作台按权限过滤模块，缺权限重定向工作台并提示；验证：美甲师工作台不渲染商品/订单/评价/运费/账号模块，直入 `pages-admin/product/edit` 被重定向。
- [x] 14.5 新增账号管理页 `src/pages-admin/staff/list.vue`（仅 owner）：账号列表（角色、状态、码状态）、新增美甲师、查看/复制入口码、停用/启用、重新生成码、分配角色；验证：新增后拿到唯一码，停用后列表显示已停用且该码扫码失败，重新启用后旧码仍失败、新码可进入。
- [x] 14.6 美甲师只读链路：新增 `src/pages-admin/craft/list.vue`（只读制作资料列表）与 `src/pages-admin/craft/edit.vue` 的只读模式（隐藏保存、增删改按钮，成本区不渲染），工作台为美甲师只放这一个入口；验证：美甲师可按商品名找到档案并查看步骤图文与视频，页面无任何保存按钮，接口响应无成本字段。
- [x] 14.7 新增评价管理页 `src/pages-admin/review/list.vue`（仅 owner）：按商品筛选、查看评价内容与关联订单号、隐藏/恢复/删除；验证：隐藏后用户端详情评价列表与评分统计同步移除，恢复后重新出现，删除不可恢复。
- [x] 14.8 清理旧入口：移除个人中心长按版本号跳转与 `admin/login` 口令接口，`pages.json` 中管理端页面标题与路由按新结构更新（新增 `craft/list`、`review/list`、`shipping/config`、`staff/list`）；验证：全局搜索无 `passcode` 与长按入口代码，tabBar 仍无管理端条目，`preloadRule` 仍不含 `pages-admin`。

## 15. 增量验收

- [x] 15.1 普通用户请求商品详情，响应体不含 `materials` / `steps` / `cost`：用 `assertNoSensitive` 对列表、搜索、详情、收藏四个出口逐一断言，并检查详情页 DOM 无材料名关键词。
- [x] 15.2 美甲师扫码进入管理端可读制作步骤，调用改价与上下架接口被拒绝：分别调用 `adminApi.saveProduct` 与 `toggleProduct`，断言返回无权限且商品价格与上下架状态未变。
- [x] 15.3 店主发码给美甲师，停用后该码扫码校验失败：新增账号 → 记录码 → 扫码成功 → 停用 → 同一码扫码失败 → 重新启用生成新码可进入。
- [x] 15.4 用户选择「其他」尺码或甲型时，下单页出现定制备注并校验：分别覆盖尺码为其他、甲型为其他、两者皆为其他三种情况，空备注提交均被阻止。
- [x] 15.5 购物车含 1 副时收固定邮费，含 2 副及以上免邮：核对结算页三段金额与订单 `goodsAmount + shippingFee = amount`，并验证工具包不计入副数。
- [x] 15.6 收藏在设备 A 添加后，设备 B 登录同账号可见：清空本地缓存模拟换设备，登录后收藏列表与详情按钮状态一致。
- [x] 15.7 管理员隐藏某条评价后用户端不再展示：隐藏后用户端列表与评分统计均无该条，恢复后重新出现。
- [x] 15.8 商品名称/标签搜索返回分页结果：断言响应含 `total` 与 `hasMore`，翻页无重复项，末页后不再请求；同时确认 `npm run type-check` 与双端构建通过。

## 16. 增量：原型 v1.1 对齐（tabBar、首页/列表改版、售后协商、管理端整合）

> 对齐基准：`docs/nail-prototype-v1.html`（v1.1）。全部改动保持 TypeScript strict 与既有工程约定。

- [x]  调整 `src/pages.json`：tabBar 收敛为 4 个页面（首页 / 分类(`product/list`) / 购物车 / 我的），移除「订单」tab，个人中心保留「我的订单」入口（含状态快捷入口）；验证：微信开发者工具显示 4 个 tab，tabBar 无管理端与订单条目，个人中心可进入订单列表。
- [x]  改版首页 `src/pages/index/index.vue`：品牌区 + hero 轮播（约 3 帧大图）+ 推荐商品位 + 服务说明卡，移除搜索框与风格/甲型分类入口，保留「全部款式 →」跳转列表页；验证：首页无搜索框与分类入口，推荐位仅含上架商品，点击「全部款式」进入列表页。
- [x]  改造商品列表页 `src/pages/product/list.vue`：顶部搜索框 + 「综合 / 销量 / 上新 / 价格」排序 chips（`productApi.search` 增加 `sort` 参数并移除 `style`/`shape` 筛选参数），保留关键字搜索与分页；验证：切换排序后结果变化且回到第一页，按名称与标签搜索命中，分页行为不变。
- [x]  改造商品详情页 `src/pages/product/detail.vue`：移除工具包勾选加购控件（改为「含工具包可选」文案）与尺码指引入口；工具包作为独立商品在列表可搜可购；尺码指引入口保留在个人中心；验证：详情页无工具包勾选控件与尺码指引入口，工具包商品可独立加购且不计入包邮副数。
- [x]  改造结算页 `src/pages-user/checkout/index.vue` 与 `Order` 契约：移除普通订单备注输入与 `remark` 字段（保留定制备注 `customNote` 及其必填校验）；验证：结算页仅有定制备注输入，`remark` 在契约、mock 与页面中零残留。
- [x]  实现售后协商页 `src/pages-user/aftersale/apply.vue` 与 `AfterSaleRequest` 契约：问题类型单选（尺寸不合适/商品破损或瑕疵/与描述不符/其他问题）、问题描述、凭证上传（图片或视频），提交后写入 `pending` 协商记录并跳转客服会话；订单详情入口文案改为「申请售后 / 联系客服协商」；验证：提交后客服会话可打开、协商记录入库，订单状态不变，全局无线上退款/退货入口。
- [x]  管理端对齐：工作台顶部增加「在售商品 / 待发货 / 待处理售后」三项计数，并为店主增加「制作档案」独立入口；工作台保留「评价管理」与「运费规则配置」两个 cell，两者进入同一个「评价与规则」页（分别定位到评价区块与运费区块），移除原 `review/list` 与 `shipping/config` 独立路由；订单列表增加「售后」筛选（展示存在协商记录的订单）与卡片内联「填物流单号」快捷发货（弹层表单、必填校验）；协商记录可标记已处理；验证：三项计数正确，「售后」筛选与内联发货生效，标记已处理后计数减少，店主可从工作台直达制作档案，两个 cell 进入同一页面且区块定位正确，`pages.json` 无被合并页面的路由。
- [x]  个人中心增加「管理端入口：扫码进入」纯文案说明占位卡（不可点击、无跳转、无数据请求）；验证：卡片点击无任何响应，卡片内无 `navigateTo` 等跳转代码。
- [x]  购物车页增加包邮进度提示（「已选商品共 X 副，满足满 Y 副包邮 / 再买 Z 副包邮」）；验证：勾选 1 副与 2 副时提示文案正确，工具包不计入副数。
- [ ] 16.10 增量验收：`npm run type-check`、`build:h5`、`build:mp-weixin` 通过；按原型 v1.1 走查首页 → 分类 → 详情 → 购物车 → 结算 → 订单 → 售后协商与管理端（工作台 / 评价与规则 / 账号管理）全链路，界面与原型逐一对照无缺失区块；验证：走查记录保留，越权拦截与字段投影验收（15.1–15.7）仍通过。
- [x]  账号管理收敛：移除 `src/pages-admin/staff/list.vue` 的「新增美甲师」与「分配角色」入口，移除 `staffApi.createArtist` / `setRole` 及对应 mock handler，账号改由 mock 种子数据预置；保留账号列表（角色、状态、码状态）、停用/启用、查看/复制入口码与重新生成码；验证：账号管理页无新增与角色变更入口，全局搜索无 `createArtist` / `setRole` 残留，停用、重新启用与重新生成码链路仍可用。

## Workflow follow-up

- 归档前确认 `openspec validate wear-nail-store-miniprogram` 通过。
- 实现完成后运行 `/opsx:archive` 归档本 change。
