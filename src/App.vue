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
  /* 主色：樱花粉 */
  --u-type-primary: #ff8fb1;
  --u-type-primary-rgb: 255, 143, 177;
  --u-type-primary-dark: #f2729d;
  --u-type-primary-dark-rgb: 242, 114, 157;
  --u-type-primary-disabled: #ffd3e2;
  --u-type-primary-disabled-rgb: 255, 211, 226;
  --u-type-primary-light: #fff0f6;
  --u-type-primary-light-rgb: 255, 240, 246;

  /* 信息色：婴儿蓝 */
  --u-type-info: #8ec9f5;
  --u-type-info-rgb: 142, 201, 245;
  --u-type-info-light: #eef7ff;
  --u-type-info-light-rgb: 238, 247, 255;

  /* 文字与底色：柔和紫灰 */
  --u-main-color: #514b63;
  --u-content-color: #6f688a;
  --u-tips-color: #a29cbd;
  --u-light-color: #c9c4da;
  --u-border-color: #f3edf8;
  --u-bg-color: #faf9fe;

  background-color: #faf9fe;
  /* 粉蓝雾面渐变底 */
  background-image: linear-gradient(180deg, #fff4f9 0%, #f7faff 40%, #faf9fe 100%);
  background-attachment: fixed;
}

/* 全局胶囊按钮 */
.u-button {
  border-radius: 999rpx;
}

/* 弹层顶部圆角统一加大 */
.u-popup__content {
  border-radius: 32rpx 32rpx 0 0;
}
</style>
