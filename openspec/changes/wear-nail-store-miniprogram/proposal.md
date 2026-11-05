# Proposal

## Why

当前仓库只有一个 uni-app 默认脚手架页面，没有任何业务能力。需要把它变成一个可出售穿戴甲（成品甲片）的微信小程序，让顾客能完成「看货 → 加购 → 下单 → 收货」的闭环；同时店主需要一个仅自己可见的空间，记录每款美甲的甲片型号、色号、饰品用量与分步制作工艺——这些是商业机密，一旦随普通用户接口下发就等于泄题。

本变更只规划小程序端（页面、交互、数据层与接口契约），服务端另行立项；因此所有接口按契约先行、由本地 mock 层实现，后续替换真实服务端时页面逻辑不变。

但仓库目前仍是 `uni-preset-vue` 生成的 JS 空壳：没有 TypeScript、状态管理、UI 组件库，`vite.config.js` 只有默认配置，`package.json` 还挂着 10 余个用不到的平台包。直接在其上写 20 多个页面，类型错误只能在运行时暴露，跨页状态与视觉规范也会各自为政。因此本变更把「工程基线升级」与「业务实现」合并为一次交付：先锁定 TypeScript + Pinia + uView Pro 基线，再在其上写业务。

## What Changes

- 工程基线升级：`vite.config.js` → `vite.config.ts`（`@` 别名、按 mode 加载环境变量），`src/main.js` → `src/main.ts`，全量 TypeScript strict 且 `type-check` 为门槛；引入 Pinia 2.1.7 与统一持久化插件、uView Pro 0.6.23（easycom + 主题覆盖）；`package.json` 只保留 H5 与微信小程序脚本并移除多余平台包。
- 搭建小程序骨架：`pages.json` 配置 5 个 tabBar 页面（首页 / 商品 / 购物车 / 订单 / 我的）与主包页面、`pages-admin` 管理端分包（不进 tabBar）。
- 用户端页面：首页（轮播 + 推荐位 + 风格/甲型分类入口）、商品列表（分类筛选、封面/名称/售价/销量）、商品详情（多图、规格选择、加购/立即购买、收藏）、购物车（多规格行、数量增减、选中结算）、结算下单（地址、备注、支付）、订单列表与详情（状态流转、物流、确认收货、申请售后）、个人中心（微信授权登录、订单/收藏/地址入口、客服）、地址管理与编辑、尺码测量指引页。
- 管理端分包页面：隐藏入口 + 管理员鉴权页、商品管理列表与编辑（基础展示信息、规格库存、上下架）、制作档案编辑（材料清单行、分步图文步骤、排序、成本核算）、订单管理（筛选、详情、填单号发货、售后处理）。
- 数据层与契约：统一 `request` 封装 + 本地 mock 适配层（内存 + 本地缓存持久化），为每个接口定义请求/响应字段与可见性等级；普通用户视图的数据选择器只投影公开字段，档案相关字段仅在管理端接口契约中出现。
- 权限落地（前端侧）：`admin` 分包路由守卫（非管理员一律重定向首页并提示）、管理端入口不出现于 tabBar、管理端页面不引用任何用户端组件或公共 mutable 状态。
- 明确不做：材料库存与低库存提醒、数据看板、优惠券/满减、评价审核后台、分享海报生成、真实微信支付商户对接（支付结果由 mock 模拟）。

## Capabilities

### New Capabilities
- `product-catalog`: 首页推荐与分类入口、商品列表筛选、商品详情与规格选择、公开的尺码测量指引。
- `shopping-cart`: 多规格购物车行的增删改、选中状态与结算金额计算。
- `customer-orders`: 下单支付（含地址与备注）、订单状态流转、物流查看、确认收货、申请售后。
- `user-account`: 微信授权登录与会话、个人中心聚合入口、收藏、收货地址管理、客服入口。
- `admin-console`: 管理员入口与鉴权、前端路由守卫、管理端商品管理、管理端订单处理（发货与售后）。
- `craft-archive`: 制作档案的材料清单、分步图文工艺、排序与成本核算，仅管理端可读写。
- `data-visibility`: 接口契约分层与字段可见性约束，确保普通用户链路绝不出现档案与成本字段。
 
### Modified Capabilities
<!-- 项目当前没有任何既有 spec，无修改项。 -->

## Impact

- 配置：`vite.config.ts`、`tsconfig.json`、`tsconfig.node.json`、`.env.development`、`.env.production`、`src/pages.json`（easycom、tabBar、主包/分包路由）、`src/manifest.json`（小程序 appid 与应用信息）、`src/uni.scss`（设计 token 与 uView Pro 主题覆盖）。
- 新增代码：`src/main.ts`、`src/types/**`、`src/stores/**`（Pinia setup store：登录态、购物车、管理员态）、`src/config/**`、`src/pages/**`（用户端页面）、`src/pages-admin/**`（管理端分包）、`src/api/**`（TS 契约与请求封装）、`src/mock/**`（mock 数据与适配层）、`src/components/**`（仅业务特有组件，通用交互复用 uView Pro）、`src/utils/**`（价格、路由守卫、存储）。
- 依赖：新增 `uview-pro@0.6.23`、`pinia@2.1.7`、`typescript`、`vue-tsc`、`@vue/tsconfig`、`@types/node`、`sass@1.63.2`；移除 `@dcloudio` 中非 H5/微信小程序的平台包；Vue 保持 `3.4.21` 与编译器配套。
- 构建目标：仅 H5 与微信小程序，脚本收敛为 `dev:h5`、`build:h5`、`dev:mp-weixin`、`build:mp-weixin`、`type-check`。
- 外部系统：微信登录与支付接口仅按契约占位，真实对接延后到服务端立项阶段。
