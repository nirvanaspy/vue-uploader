/* eslint-disable */
import Vue from 'vue'
import axios from 'axios'
let serviceConfig = 'http://' + '192.168.31.13' + ':' + '8080'

// let qs = require('qs')
const service = axios.create({
  baseURL: serviceConfig // api的base_url
})

service.interceptors.request.use(config => {
  return config
}, error => {
  // Do something with request error
  console.log(error) // for debug
  Promise.reject(error)
})

// respone interceptor
service.interceptors.response.use(
  // response => response,
  response => {
//判断是否超过刷新token
    return response
  },
  error => {
    return Promise.reject(error)
  })

export default service
