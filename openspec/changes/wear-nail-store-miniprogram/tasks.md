# Tasks

## 1. 工程骨架与配置

- [ ] 1.1 在 `src/pages.json` 配置 5 个 tabBar 页（首页 / 商品 / 购物车 / 订单 / 我的）、主包商品详情页与 `pages-user`、`pages-admin` 两个分包，并为 `pages/index` 配置仅预下载 `pages-user` 的 `preloadRule`；验证：`npm run dev:mp-weixin` 编译无报错，微信开发者工具底部出现 5 个 tab 且 tabBar 中无管理端条目。
- [ ] 1.2 新建 `src/config/env.js`（`MOCK_MODE`、请求 baseURL、管理口令占位）与 `src/uni.scss` 设计 token（主色、圆角、间距、字号），并在 `src/App.vue` 全局引入基础样式；验证：首页任取一个区块，其颜色与圆角取自变量而非硬编码值。
- [ ] 1.3 补齐 `src/manifest.json` 的微信小程序 appid 与名称，添加 tabBar 图标与占位封面资源；验证：开发者工具不再提示 appid 缺失，tabBar 图标正常显示。
- [ ] 1.4 建立 `src/utils/` 基础工具：`price.js`（分/元格式化、金额求和）、`storage.js`（带 key 前缀与 JSON 序列化）、`router.js`（封装 `navigateTo/redirectTo/switchTab` 并统一处理登录与管理员拦截）；验证：`price.js` 对 0、小数、大额三种输入的单测或控制台断言输出正确。

## 2. 接口契约与本地数据层

- [ ] 2.1 编写 `src/api/contract.js`，用 JSDoc `@typedef` 定义 `PublicProduct`、`PublicProductDetail`、`AdminProduct`、`CraftArchive`、`MaterialLine`、`CraftStep`、`CartLine`、`Order`、`Address`、`AdminSession`，并导出 `PUBLIC_PRODUCT_FIELDS`、`SENSITIVE_KEYS` 白名单/敏感键常量；验证：模块可被导入且两组常量与 `specs/data-visibility` 列出的字段一致。
- [ ] 2.2 实现 `src/api/projections.js`：`toPublicProduct`、`toPublicProductDetail`、`toPublicOrder`、`toAdminProduct` 四个白名单投影函数与 `assertNoSensitive(obj, path)`；验证：对含 `materials/steps/costPrice` 的完整对象投影后，`assertNoSensitive` 通过且结果中不存在这些键。
- [ ] 2.3 编写 `src/mock/seed.js` 与 `src/mock/db.js`：种子数据覆盖至少 8 个商品（含 2 个下架）、每个商品多规格库存、3 份制作档案、若干历史订单与地址，读写经 `uni.setStorageSync` 持久化；验证：清空缓存后首次进入可读到种子数据，修改后重启小程序改动仍在。
- [ ] 2.4 实现 `src/mock/handlers.js`：按接口路径分发商品、购物车、订单、地址、收藏、售后、管理端商品、档案、管理端订单等 handler，所有用户端出口经投影并调用 `assertNoSensitive`，所有管理端出口先校验 `admin_session`；验证：控制台直接调用用户端商品详情 handler 返回对象中无敏感键，无 token 调用档案 handler 返回无权限错误。
- [ ] 2.5 编写 `src/api/transport.js` 与各域 API（`productApi`、`cartApi`、`orderApi`、`userApi`、`addressApi`、`adminApi`），mock 分支带 200~400ms 延迟并统一错误结构 `{ code, message }`；验证：`MOCK_MODE=true` 时页面调用均返回数据，置为 `false` 时走 `uni.request` 且在无后端情况下给出可读错误提示。
- [ ] 2.6 新增 `docs/api-contract.md` 记录每个接口的路径、入参、返回字段与可见性等级（公开 / 管理员），标注档案类接口为管理员专属；验证：文档列出的接口与 `src/api/*.js` 导出逐一对应，无遗漏或多出。

## 3. 登录、个人中心、地址与收藏

- [ ] 3.1 实现 `src/store/session.js` 与 `src/api/user.js` 的登录/登出/会话恢复（mock 返回固定昵称头像，真实模式走 `uni.login` 换 code），并在 `src/App.vue` 的 `onShow` 实现启动静默登录：检查本地 `user_session`，无会话或 `uni.checkSession` 失效时静默换取会话写回 storage，失败不阻塞进入、不弹任何登录弹窗；验证：清空缓存后首次启动无登录弹窗且后台完成静默登录，登录后个人中心显示昵称头像，重启小程序仍保持登录，登出后恢复未登录态。
- [ ] 3.2 实现个人中心页 `src/pages/profile/index.vue`：登录引导、订单状态快捷入口、收藏、地址管理、客服入口，并支持长按版本号触发管理端跳转（跳转前不做任何管理数据请求）；验证：未登录时入口点击先触发登录，长按版本号跳转到 `pages-admin/auth`。
- [ ] 3.3 实现收藏能力：商品详情收藏按钮、`src/pages-user/favorite/index.vue` 列表与移除、下架商品标记；验证：收藏后详情按钮变为已收藏，收藏列表可移除且详情状态同步，已下架收藏项不可点击购买。
- [ ] 3.4 实现地址管理 `src/pages-user/address/list.vue` 与 `edit.vue`：新增/编辑/删除、首条自动默认、设为默认、收货人/手机号/详细地址校验；验证：手机号填 `123` 提交被拦截并定位字段，删除默认地址后剩余地址自动成为默认。
- [ ] 3.5 实现快捷登录弹层 `src/components/login-sheet.vue` 并接入 `useAuthGuard()`：未登录触发需要身份的动作（下单/结算、收藏、查看订单、个人中心入口）时弹出底部弹层，同意授权后建立会话并继续原动作、保留所在页面；关闭或拒绝则留在当前页可继续浏览，不循环弹出；mock 模式模拟登录成功，真实模式预留 `getPhoneNumber` 手机号快捷按钮（契约不变）；验证：未登录分别触发加购与收藏均弹出弹层，拒绝后留在原页可继续浏览且不再自动弹出，同意后原动作继续完成且页面未跳转丢失。

## 4. 商品浏览主流程

- [ ] 4.1 实现首页 `src/pages/index/index.vue`：轮播（`swiper`）、推荐商品位、风格与甲型分类入口、空态；验证：仅展示上架商品，点击分类进入列表页且筛选条件已带入，删空推荐数据时不报错并显示空态。
- [ ] 4.2 实现商品列表页 `src/pages/product/list.vue`：封面/名称/售价/销量、风格与甲型筛选、清空筛选、空态与加载态；验证：切换筛选后结果收敛，清空后恢复全量，页面源码中不出现成本或工艺字段。
- [ ] 4.3 实现公共组件 `product-card`、`price-tag`、`empty-state`、`sku-picker`（规格弹层）；验证：`sku-picker` 在未选全规格时确认按钮禁用，库存为 0 的规格展示售罄且不可选。
- [ ] 4.4 实现商品详情页 `src/pages/product/detail.vue`：多图轮播、名称/售价/销量、规格选择、加入购物车、立即购买、收藏入口、尺码指引入口；验证：未选规格点购买被提示拦截，选好规格后两种按钮分别进入购物车与结算流程，页面 DOM 中不含材料/步骤/成本区块。
- [ ] 4.5 实现尺码测量指引页 `src/pages-user/guide/size.vue`：测量步骤图文、尺码对照表、常见问题；验证：任意角色可直接打开，页面内容仅涉及测量与选码。

## 5. 购物车

- [ ] 5.1 实现 `src/store/cart.js` 与 `cartApi`：按 `skuId` 分行、同规格数量合并、增删改数量、库存上限、本地持久化、退出登录清空；验证：同规格二次加购变为一行且数量累加，超过库存上限时数量不再增加并提示。
- [ ] 5.2 实现购物车页 `src/pages/cart/index.vue`：行内规格与库存展示、勾选/全选、合计件数与金额、失效行标记、去结算；验证：勾选两行后合计金额等于各行售价×数量之和，无勾选时结算按钮禁用，下架商品行不计入合计。
- [ ] 5.3 打通「加入购物车 → 未登录先登录 → 登录后继续加购」链路，保留所选规格；验证：未登录加购后完成登录，购物车中仍出现该规格行。

## 6. 下单、支付与订单

- [ ] 6.1 实现结算页 `src/pages-user/checkout/index.vue`：商品清单、默认地址选择、备注（≤100 字）、金额合计、提交订单；验证：无地址提交被拦截并跳转地址编辑页，填写备注后订单详情可见该备注。
- [ ] 6.2 实现 `src/api/payment.js` 与订单创建：创建 `pending_pay` 订单、清理购物车已选中行、mock 支付成功/取消两分支、待付款超时自动取消；验证：支付成功订单变 `pending_ship`，取消后仍为 `pending_pay` 且详情有「继续支付」，超时订单变 `cancelled`。
- [ ] 6.3 实现订单列表 `src/pages/order/list.vue`：状态筛选（全部/待付款/待发货/待收货/已完成）、订单卡片信息、空态；验证：切换筛选结果正确，卡片含订单号、缩略图、规格、数量、实付金额与状态。
- [ ] 6.4 实现订单详情 `src/pages-user/order/detail.vue`：按状态渲染操作（继续支付/取消、查看物流、确认收货、再次购买、申请售后）与物流轨迹；验证：确认收货后状态变 `completed`，查看物流展示公司与单号及倒序轨迹，发货前取消变 `cancelled`。
- [ ] 6.5 实现售后申请 `src/pages-user/aftersale/apply.vue`：类型选择、原因与说明、提交后订单显示「售后处理中」、重复申请拦截；验证：提交一次后再点申请被阻止并提示当前进度。

## 7. 管理端鉴权与访问控制

- [ ] 7.1 实现 `src/store/admin.js`（`admin_session` 独立 key，含 token 与过期时间）、`src/pages-admin/auth/index.vue` 口令鉴权页与 `src/pages-admin/index/index.vue` 工作台（商品管理 / 订单管理 / 退出）；验证：正确口令进入工作台，错误口令提示失败且不写会话，退出后再次进入需重新鉴权。
- [ ] 7.2 实现 `src/utils/admin-guard.js` 的 `useAdminGuard()` 与 `uni.addInterceptor` 的导航拦截，在每个管理端页面 `onLoad` 首行调用，失败时 `uni.reLaunch` 到首页并 toast「无管理权限」；验证：开发者工具直接输入管理端路径或以普通用户身份长按版本号进入，均被重定向首页且页面不发起管理接口请求。
- [ ] 7.3 校验 tabBar 与常规可见区域无管理入口，且 `pages-admin` 未配置预下载；验证：检查 `src/pages.json` 与页面源码，tabBar 列表仅含 5 个用户端页面，`preloadRule` 不含 `pages-admin`。

## 8. 管理端商品管理

- [ ] 8.1 实现 `src/pages-admin/product/list.vue`：商品列表、上下架切换、搜索、进入编辑与制作档案入口；验证：切换上下架后用户端列表/详情即时反映，下架商品不可加购。
- [ ] 8.2 实现 `src/pages-admin/product/edit.vue`：名称、展示图、风格/甲型分类、售价、规格（尺码×甲片数量）与库存维护、必填与数值校验，新增默认下架；验证：漏填名称或售价时保存被拦截并高亮字段，新增商品保存后为下架态，编辑售价不改动历史订单成交价。

## 9. 制作档案（管理员专属）

- [ ] 9.1 实现材料清单编辑（`src/components/material-row.vue` + 档案页材料区）：类别、名称、型号/色号、用量与单位，增行/改/删、必填校验、序号收紧；验证：缺名称或用量时整份档案保存被阻止，删除中间行后序号连续。
- [ ] 9.2 实现分步制作步骤编辑（`src/components/step-editor.vue`）：说明文字 + 至少一张步骤图、上移/下移、图片全屏预览（左右切换）；验证：缺图或缺说明无法保存，调整顺序后保存并按新顺序重进可见。
- [ ] 9.3 实现成本核算区：材料成本、其他成本、预估总成本与按售价计算的预估毛利，负值/非数字拦截，售价变更后重算毛利；验证：输入 `-5` 保存被拒，改价后重开档案毛利变化而成本值不变。
- [ ] 9.4 将档案写入 mock 数据并与商品解耦存储，删除商品时级联删除档案；验证：删除商品后直接调用档案 handler 返回不存在，用户端商品详情响应不含档案键。
- [ ] 9.5 补充档案页面的字段断言调用（保存前与读取后各一次 `assertNoSensitive` 不适用于档案本身，改为断言用户端出口），并确认 `pages/`、`pages-user/` 下无任何 `craft` 或 `adminApi` 引用；验证：全局搜索引用结果为 0，构建产物中用户端页面不包含档案接口字符串。

## 10. 管理端订单处理

- [ ] 10.1 实现 `src/pages-admin/order/list.vue`：状态筛选、订单号搜索、实付金额与下单时间展示；验证：筛选与搜索组合结果正确，空结果有空态。
- [ ] 10.2 实现 `src/pages-admin/order/detail.vue`：订单与收货信息、填写物流公司与运单号发货（必填校验，成功后状态转 `pending_receive`）、售后同意退款/拒绝并填理由；验证：缺单号提交被阻止，发货后用户端可查看物流，拒绝售后后用户端显示理由，同意退款后订单标记已退款且不可再申请。

## 11. 集成验收

- [ ] 11.1 端到端走通用户主流程：浏览 → 加购 → 结算 → 支付 → 订单列表与详情，确认每一步状态与金额正确；同时确认启动过程为静默登录、全程无强制登录弹窗，未登录可完整浏览商品；验证：微信开发者工具真机预览完整走通一遍并记录截图。
- [ ] 11.2 端到端走通管理流程：管理员创建商品 → 填材料清单与制作步骤 → 保存 → 用户端打开该商品详情，确认无任何材料/步骤/成本字段；验证：用 `assertNoSensitive` 对实际响应断言通过，并在详情页全部 DOM 文本中搜索材料名关键词无命中。
- [ ] 11.3 验证越权拦截：普通用户通过路径直入、长按入口、分享链接三种方式访问管理端页面均被重定向首页；验证：三种方式各执行一次，均停留首页且有「无管理权限」提示。

## Workflow follow-up

- 归档前确认 `openspec validate wear-nail-store-miniprogram` 通过。
- 实现完成后运行 `/opsx:archive` 归档本 change。
