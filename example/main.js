import Vue from 'vue'
import uploader from '../src'
import App from './App.vue'
import SparkMD5 from 'spark-md5'

Vue.use(uploader)
// Vue.prototype.uploadFile = uploadFile
// Vue.use(SparkMD5)

/* eslint-disable no-new */
new Vue({
  render(createElement) {
    return createElement(App)
  }
}).$mount('#app')
