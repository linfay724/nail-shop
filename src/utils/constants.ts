export const ADMIN_ROUTE_PREFIX = '/pages-admin/'

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_pay: '待付款',
  pending_ship: '待发货',
  pending_receive: '待收货',
  completed: '已完成',
  cancelled: '已取消',
}

export const ORDER_STATUS_TABS = [
  { name: '全部', value: 'all' },
  { name: '待付款', value: 'pending_pay' },
  { name: '待发货', value: 'pending_ship' },
  { name: '待收货', value: 'pending_receive' },
  { name: '已完成', value: 'completed' },
] as const

/** 管理端订单筛选：「售后」按是否存在协商记录筛选 */
export const ADMIN_ORDER_TABS = [
  { name: '全部', value: 'all' },
  { name: '待发货', value: 'pending_ship' },
  { name: '待收货', value: 'pending_receive' },
  { name: '售后', value: 'aftersale' },
] as const

export const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  tip: '甲片',
  gel: '甲油胶',
  ornament: '饰品',
  other: '其他',
}
