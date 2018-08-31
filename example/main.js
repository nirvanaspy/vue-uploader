import Vue from 'vue'
import uploader from '../src'
import App from './App.vue'
import SparkMD5 from 'spark-md5'
import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(uploader)
Vue.use(Element)
// Vue.prototype.uploadFile = uploadFile
// Vue.use(SparkMD5)

/* eslint-disable no-new */
new Vue({
  render(createElement) {
    return createElement(App)
  }
}).$mount('#app')
