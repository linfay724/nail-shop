export type NavigationGuard = (url: string) => boolean

const guards: NavigationGuard[] = []

/** 注册导航守卫，返回 false 时阻止跳转（登录 / 管理员拦截在此挂载） */
export function addNavigationGuard(guard: NavigationGuard): void {
  guards.push(guard)
}

function runGuards(url: string): boolean {
  return guards.every((guard) => guard(url))
}

export function navigateTo(url: string): void {
  if (!runGuards(url)) {
    return
  }

  uni.navigateTo({ url })
}

export function redirectTo(url: string): void {
  if (!runGuards(url)) {
    return
  }

  uni.redirectTo({ url })
}

export function switchTab(url: string): void {
  uni.switchTab({ url })
}

export function reLaunch(url: string): void {
  uni.reLaunch({ url })
}
