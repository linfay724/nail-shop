<template>
  <view class="guide">
    <view class="block">
      <text class="title">如何测量甲床</text>
      <text class="text">1. 用软尺横跨指甲最宽处，记录毫米数。</text>
      <text class="text">2. 左右手分别测量，取较大值作为选码依据。</text>
      <text class="text">3. 拇指明显宽于其他手指时，按下单时的甲片数量选择。</text>
    </view>

    <view class="block">
      <text class="title">尺码对照</text>
      <view class="table">
        <view class="tr head">
          <text class="td">尺码</text>
          <text class="td">甲床宽度</text>
          <text class="td">适合甲型</text>
        </view>
        <view class="tr">
          <text class="td">S</text>
          <text class="td">10-12 mm</text>
          <text class="td">圆甲 / 方甲</text>
        </view>
        <view class="tr">
          <text class="td">M</text>
          <text class="td">12-14 mm</text>
          <text class="td">方甲 / 杏仁甲</text>
        </view>
        <view class="tr">
          <text class="td">L</text>
          <text class="td">14-16 mm</text>
          <text class="td">芭蕾甲 / 杏仁甲</text>
        </view>
      </view>
    </view>

    <view class="block">
      <text class="title">常见问题</text>
      <text class="text">Q：测量有 1mm 误差怎么办？ A：优先选择偏大一码，可用锉条微调。</text>
      <text class="text">Q：甲片数量怎么选？ A：10 片适合日常单色，20 片用于搭配或备用。</text>
    </view>
  </view>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.guide {
  min-height: 100vh;
  padding: $app-space-base;
  background-color: $app-color-bg;
}

.block {
  margin-bottom: $app-space-base;
  padding: $app-space-base;
  background-color: #fff;
  border-radius: $app-radius-base;
}

.title {
  display: block;
  margin-bottom: $app-space-sm;
  font-size: $app-font-lg;
  color: $app-color-text;
  font-weight: 600;
}

.text {
  display: block;
  margin-bottom: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
  line-height: 1.6;
}

.table {
  border: 1rpx solid $app-color-border;
  border-radius: $app-radius-sm;
}

.tr {
  display: flex;
  border-bottom: 1rpx solid $app-color-border;
}

.head {
  background-color: $app-color-primary-light;
}

.td {
  flex: 1;
  padding: $app-space-xs;
  font-size: $app-font-sm;
  color: $app-color-text;
  text-align: center;
}
</style>
