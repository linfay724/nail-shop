import { createSSRApp } from 'vue'
import uviewPro from 'uview-pro'
import App from './App.vue'
import { pinia } from './stores'

export function createApp() {
  const app = createSSRApp(App)
  app.use(pinia)
  app.use(uviewPro)

  return {
    app,
  }
}
