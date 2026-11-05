# 接口契约

数据层三段式：`src/api/contract.ts`（类型）→ `src/api/transport.ts`（唯一请求出口）→ `src/mock/handlers.ts`（本地实现）。
`MOCK_MODE = true` 时全部请求走 mock；接真实后端只改 `transport.ts` 与 `src/config/env.ts`。

金额单位统一为「分」。错误结构统一为 `{ code: number; message: string }`。

## 可见性等级

- **公开**：未登录用户可访问，响应经过 `toPublicProduct` / `toPublicProductDetail` 白名单投影，并断言不含 `materials / steps / costPrice / materialCost / otherCost`。
- **用户**：需要用户会话（`user_session` token）。
- **管理员**：需要管理会话（`admin_session` token），校验失败返回 `403`，不返回任何数据。

## 用户端

| 路径 | 等级 | 入参 | 返回 |
| --- | --- | --- | --- |
| `product/list` | 公开 | `{ style?, shape? }` | `PublicProduct[]` |
| `product/detail` | 公开 | `{ id }` | `PublicProductDetail` |
| `user/login` | 公开 | `{ nickname?, phone? }` | `UserSession` |
| `user/session` | 用户 | `{ token }` | `UserSession` |
| `user/logout` | 用户 | `{}` | `{ success }` |
| `cart/list` | 用户 | `{}` | `CartLine[]` |
| `cart/save` | 用户 | `{ lines: CartLine[] }` | `CartLine[]` |
| `favorite/list` | 用户 | `{}` | `PublicProduct[]` |
| `favorite/toggle` | 用户 | `{ productId }` | `{ favorite }` |
| `address/list` | 用户 | `{}` | `Address[]` |
| `address/save` | 用户 | `{ address }` | `Address[]` |
| `address/remove` | 用户 | `{ id }` | `Address[]` |
| `order/list` | 用户 | `{ status }` | `PublicOrder[]` |
| `order/detail` | 用户 | `{ id }` | `PublicOrder` |
| `order/create` | 用户 | `{ items, addressId, remark }` | `PublicOrder` |
| `order/pay` | 用户 | `{ id }` | `PublicOrder` |
| `order/cancel` | 用户 | `{ id }` | `PublicOrder` |
| `order/confirm` | 用户 | `{ id }` | `PublicOrder` |
| `order/aftersale` | 用户 | `{ id, type, reason, description }` | `PublicOrder` |

## 管理端（管理员专属）

| 路径 | 入参 | 返回 |
| --- | --- | --- |
| `admin/login` | `{ passcode }` | `AdminSession` |
| `admin/product/list` | `{}` | `AdminProduct[]` |
| `admin/product/save` | `{ product }` | `AdminProduct[]` |
| `admin/product/toggle` | `{ id, onSale }` | `AdminProduct[]` |
| `admin/product/remove` | `{ id }` | `{ success }` |
| `admin/craft/get` | `{ productId }` | `CraftArchive` |
| `admin/craft/save` | `{ archive }` | `CraftArchive` |
| `admin/order/list` | `{ status, keyword }` | `PublicOrder[]` |
| `admin/order/detail` | `{ id }` | `PublicOrder` |
| `admin/order/ship` | `{ id, company, no }` | `PublicOrder` |
| `admin/order/aftersale` | `{ id, approve, rejectReason }` | `PublicOrder` |

`admin/craft/get` 与 `admin/craft/save` 为档案类接口，仅管理员可访问；用户端 API 模块不导出任何档案方法，`pages/`、`pages-user/` 不引用 `adminApi`。
