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
  /* 主色：莓果（与原型 .btn / .price 一致），主色衬底为标签粉 */
  --u-type-primary: #8c3b4a;
  --u-type-primary-rgb: 140, 59, 74;
  --u-type-primary-dark: #73303c;
  --u-type-primary-dark-rgb: 115, 48, 60;
  --u-type-primary-disabled: #d8d2d1;
  --u-type-primary-disabled-rgb: 216, 210, 209;
  --u-type-primary-light: #fdf3f4;
  --u-type-primary-light-rgb: 253, 243, 244;

  /* 信息色：薰衣草 */
  --u-type-info: #7c6cf0;
  --u-type-info-rgb: 124, 108, 240;
  --u-type-info-light: #f0edff;
  --u-type-info-light-rgb: 240, 237, 255;

  /* 文字与底色：暖灰 */
  --u-main-color: #3a3335;
  --u-content-color: #756b6d;
  --u-tips-color: #9a8f91;
  --u-light-color: #c8bfbd;
  --u-border-color: #f0eae8;
  --u-bg-color: #faf7f5;

  background-color: #faf7f5;
}

/* 全局胶囊按钮 */
.u-button {
  border-radius: 999rpx;
  font-weight: 600;
}

/* 弹层顶部圆角 */
.u-popup__content {
  border-radius: 28rpx 28rpx 0 0;
}

/**
 * 管理端主题：页面根节点加 .admin-theme 即把 uView 主色切换为原型的管理端紫，
 * 与用户端的莓果主色区分。
 */
.admin-theme {
  --u-type-primary: #7c6cf0;
  --u-type-primary-rgb: 124, 108, 240;
  --u-type-primary-dark: #6a5ae0;
  --u-type-primary-dark-rgb: 106, 90, 224;
  --u-type-primary-disabled: #d9d4f7;
  --u-type-primary-disabled-rgb: 217, 212, 247;
  --u-type-primary-light: #f0edff;
  --u-type-primary-light-rgb: 240, 237, 255;
  --u-type-info: #7c6cf0;
  --u-type-info-light: #f0edff;
  --u-main-color: #3a3335;
  --u-content-color: #756b6d;
  --u-tips-color: #9a8f91;
  --u-border-color: #f0eae8;
  --u-bg-color: #f5f4f3;
}
</style>
