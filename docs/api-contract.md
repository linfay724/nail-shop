# 接口契约

数据层三段式：`src/api/contract.ts`（类型）→ `src/api/transport.ts`（唯一请求出口）→ `src/mock/handlers.ts`（本地实现）。
`MOCK_MODE = true` 时全部请求走 mock；接真实后端只改 `transport.ts` 与 `src/config/env.ts`。

金额单位统一为「分」。错误结构统一为 `{ code: number; message: string }`。分页统一返回 `{ list, total, page, hasMore }`。

## 可见性等级

- **公开**：未登录用户可访问，响应经过 `toPublicProduct` / `toPublicProductDetail` / `toPublicReview` 白名单投影，并断言不含 `materials / steps / cost / costPrice / materialCost / hours / suggestedPrice`。
- **用户**：需要用户会话（`user_session` token）。
- **美甲师**：需要有效管理会话且角色为 `artist`，只读材料与步骤，响应经 `toArtistArchive` 投影（结构上不存在 `cost`）。
- **店主**：需要有效管理会话且角色为 `owner`，可读写商品、档案、订单、评价、运费与账号；档案经 `toOwnerArchive` 投影。
- **管理员**：需要管理会话（`admin_session` token）。越权或凭证失效返回 `403`，不返回任何数据。

权限点集中在 `src/utils/permissions.ts` 的 `ROLE_PERMISSIONS`，前端入口、路由守卫与 mock handler 共用同一张表。

## 用户端

| 路径 | 等级 | 入参 | 返回 |
| --- | --- | --- | --- |
| `product/list` | 公开 | `{ keyword?, sort?, page?, pageSize? }` | `PagedResult<PublicProduct>` |
| `product/search` | 公开 | `{ keyword?, sort?, page?, pageSize? }` | `PagedResult<PublicProduct>` |
| `product/accessory/list` | 公开 | `{}` | `PublicProduct[]`（工具包等配件） |
| `product/detail` | 公开 | `{ id }` | `PublicProductDetail` |
| `user/login` | 公开 | `{ nickname?, phone? }` | `UserSession` |
| `user/session` | 用户 | `{}`（token 由 transport 注入） | `UserSession` |
| `user/logout` | 用户 | `{}` | `{ success }` |
| `cart/list` | 用户 | `{}` | `CartLine[]` |
| `cart/save` | 用户 | `{ lines: CartLine[] }` | `CartLine[]` |
| `favorite/list` | 用户 | `{ page?, pageSize? }` | `PagedResult<PublicProduct>` |
| `favorite/ids` | 用户 | `{}` | `string[]` |
| `favorite/toggle` | 用户 | `{ productId }` | `{ favorite }` |
| `address/list` | 用户 | `{}` | `Address[]` |
| `address/save` | 用户 | `{ address }` | `Address[]` |
| `address/remove` | 用户 | `{ id }` | `Address[]` |
| `order/list` | 用户 | `{ status }` | `PublicOrder[]` |
| `order/detail` | 用户 | `{ id }` | `PublicOrder` |
| `order/create` | 用户 | `{ items, addressId, customNote? }` | `PublicOrder`（服务端重算运费与合计） |
| `order/pay` | 用户 | `{ id }` | `PublicOrder` |
| `order/cancel` | 用户 | `{ id }` | `PublicOrder` |
| `order/confirm` | 用户 | `{ id }` | `PublicOrder` |
| `review/list` | 公开 | `{ productId, page?, pageSize? }` | `ReviewPage`（仅 `visible` 评价） |
| `review/create` | 用户 | `{ orderId, rating, content, media }` | `PublicReview` |
| `shipping/config` | 公开 | `{}` | `ShippingConfig` |
| `aftersale/create` | 用户 | `{ orderId, type, description, media? }` | `AfterSaleRequest`（`status = pending`，订单状态不变） |
| `aftersale/list` | 用户 | `{ orderId? }` | `AfterSaleRequest[]` |

`product/list` 与 `product/search` 的 `sort` 取 `default | sales | newest | price`（综合 / 销量 / 上新 / 价格），不再支持风格与甲型筛选。

`order/create` 的 `customNote` 在商品含 `size === 'OTHER'` 或 `shape === 'OTHER'` 时必填；运费由 `calcShipping(配置, 已结算副数)` 计算，配件不计入副数。

售后仅记录协商意向：`aftersale/create` 写入 `pending` 记录后由前端跳转客服会话，处理在线下完成，不产生退款/退货状态，也不改变订单状态。

## 管理端（扫码会话 + 角色校验）

| 路径 | 所需权限 | 入参 | 返回 |
| --- | --- | --- | --- |
| `staff/resolve` | 公开 | `{ code }` | `AdminSession` |
| `admin/product/list` | `product:read` | `{ keyword?, page?, pageSize? }` | `PagedResult<AdminProduct>` |
| `admin/product/get` | `product:read` | `{ id }` | `AdminProduct` |
| `admin/product/save` | `product:write` | `{ product }` | `{ success }` |
| `admin/product/toggle` | `product:write` | `{ id, onSale }` | `AdminProduct` |
| `admin/product/remove` | `product:write` | `{ id }` | `{ success }`（同时删除档案） |
| `admin/craft/list` | `craft:read` | `{}` | `CraftProductSummary[]` |
| `admin/craft/get` | `craft:read` | `{ productId }` | `CraftArchive`（owner）/ `ArtistCraftArchive`（artist） |
| `admin/craft/save` | `craft:write` | `{ archive }` | `CraftArchive` |
| `admin/order/list` | `order:read` | `{ status, keyword }` | `PublicOrder[]`（`status = aftersale` 时按协商记录筛选） |
| `admin/order/detail` | `order:read` | `{ id }` | `PublicOrder` |
| `admin/order/ship` | `order:write` | `{ id, company, no }` | `PublicOrder` |
| `admin/stats` | `order:read` | `{}` | `{ onSaleProducts, pendingShip, pendingAfterSale }` |
| `admin/aftersale/list` | `order:read` | `{ orderId? }` | `AfterSaleRequest[]` |
| `admin/aftersale/resolve` | `order:write` | `{ id }` | `AfterSaleRequest`（仅标记已处理，订单状态不变） |
| `admin/review/list` | `review:manage` | `{ productId? }` | `Review[]` |
| `admin/review/visible` | `review:manage` | `{ id, visible }` | `{ success }` |
| `admin/review/remove` | `review:manage` | `{ id }` | `{ success }` |
| `admin/shipping/save` | `shipping:manage` | `{ freeShippingThreshold, flatFee }` | `ShippingConfig` |
| `admin/staff/list` | `staff:manage` | `{}` | `StaffAccountView[]` |
| `admin/staff/status` | `staff:manage` | `{ accountId, status }` | `{ success }`（停用即令入口码失效） |
| `admin/staff/regenerate` | `staff:manage` | `{ accountId }` | `{ code }` |

账号由服务端预置（mock 以种子账号模拟），管理端不提供新增账号与角色分配接口。

档案类接口仅管理端可访问；用户端 API 模块不导出任何档案方法，`pages/`、`pages-user/` 不引用 `adminApi`。
`staff/resolve` 是唯一的管理端入口：校验入口码状态与账号状态，成功返回含 `role / merchantId / qrCodeId` 的会话，停用账号的码立即失效。
