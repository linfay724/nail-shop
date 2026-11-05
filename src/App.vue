<script lang="ts">
import { defineComponent } from 'vue'
import { useSessionStore } from '@/stores/session'
import { installAdminInterceptor } from '@/utils/admin-guard'

export default defineComponent({
  onLaunch() {
    installAdminInterceptor()
  },
  onShow() {
    // 启动静默登录：无会话时后台换票，不弹任何登录弹窗
    void useSessionStore().silentLogin()
  },
  onHide() {
    console.log('App Hide')
  },
})
</script>

<style lang="scss">
@import 'uview-pro/index.scss';

/* uView Pro 的主题变量在 theme.scss 中直接声明，覆盖必须放在其后 */
page {
  --u-type-primary: #c98b7a;
  --u-type-primary-dark: #b3735f;
  --u-type-primary-disabled: #e6c4ba;
  --u-type-primary-light: #f7ece8;
  --u-type-primary-light-rgb: 247, 236, 232;
  background-color: #fdfaf8;
}
</style>
