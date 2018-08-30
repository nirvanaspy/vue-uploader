<template>
  <div>
    <uploader
      :options="options"
      :autoStart="true"
      :file-status-text="statusText"
      class="uploader-example"
      ref="uploader"
      @file-complete="fileComplete"
      @complete="complete"
      @files-added="checkMd5()"
      @file-success="fileSuccess"
    >
    </uploader>
    <span slot="footer" class="dialog-footer" style="display: block;text-align: center;margin-top: 20px;">
      <span @click="uploadFile">确 定</span>
    </span>
  </div>
</template>

<script>
  /*eslint-disable*/
  import SparkMD5 from 'spark-md5'
  import axios from 'axios'

  export default {
    data () {
      return {
        options: {
          // target: 'http://192.168.31.13:8080/files/chunks',
          // testChunks: true,
          target: '/boot/uploader/chunk',
          testChunks: true,
          simultaneousUploads: 3,
          autoStart: false,
          chunkSize: 50 * 1024 * 1024,
          // generateUniqueIdentifier: this.preprocess,
          preprocess: this.preprocess
        },
        attrs: {
          accept: 'image/*'
        },
        statusText: {
          success: '成功了',
          error: '出错了',
          uploading: '上传中',
          paused: '暂停中',
          waiting: '等待中'
        },
        componentId: 'abc',
        parentNodeId: 'def'
      }
    },
    methods: {
      catchAll() {
        console.log('all',event)
      },
      preprocess (chunk) {
        console.log(chunk.preprocessState)
        // 上传或test之前执行,生成md5(如果file存在md5 就不生成了)
        console.log(chunk)
        if(!chunk.md5res) {
          let chunkSize = this.$refs.uploader.uploader.opts.chunkSize
          let file = chunk.file.file
          let SparkMD5 = require('spark-md5')
          // let spark = new SparkMD5.ArrayBuffer()
          let spark = new SparkMD5()
          let fileReader = new FileReader()
          let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
          let chunks = Math.ceil(file.size / chunkSize)
          let currentChunk = 0
          fileReader.onload = e => {
            spark.appendBinary(e.target.result)
            currentChunk++
            /*if(zenFile.preprocessState == 2) {
              return
            }*/
            if (currentChunk < chunks) {
              let a = 'deal with' + currentChunk + '剩余' + (chunks - currentChunk)
              console.log(a)
              load()
            } else {
              chunk.md5res = spark.end()
              chunk.componentId = this.componentId
              chunk.parentNodeId = this.parentNodeId
              chunk.uniqueIdentifier = chunk.md5res
            }
            fileReader.onerror = e => reject(e)
          }

          let load = () => {
            var start = currentChunk * chunkSize
            var end = start + chunkSize >= file.size ? file.size : start + chunkSize
            fileReader.readAsBinaryString(file.slice(start, end))
          }
          load()
        }
        if (chunk.file.md5 === '' || chunk.file.md5 == null) {
          this.fileMd5HeadTailTime(chunk.file, this.$refs.uploader.uploader.opts.chunkSize, chunk).then(() => {
            chunk.preprocessFinished()
          })
        } else {
          chunk.preprocessFinished()
        }
      },
      fileMd5HeadTailTime (zenFile, chunkSize, chunk) {
        return new Promise((resolve, reject) => {
          let file = zenFile.file
          let SparkMD5 = require('spark-md5')
          // let spark = new SparkMD5.ArrayBuffer()
          let spark = new SparkMD5()
          let fileReader = new FileReader()
          let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
          let chunks = Math.ceil(file.size / chunkSize)
          let currentChunk = 0
          chunk.md5 = chunk.md5res
          zenFile.md5 = chunk.md5res
          alert('结束了')
          resolve()

          /*fileReader.onload = e => {
            spark.appendBinary(e.target.result)
            currentChunk++
            console.log(chunk.preprocessState)
            /!*if(zenFile.preprocessState == 2) {
              return
            }*!/
            if (currentChunk < chunks) {
              let a = 'deal with' + currentChunk + '剩余' + (chunks - currentChunk)
              console.log(a)
              load()
            } else {
              zenFile.md5 = spark.end()
              zenFile.componentId = this.componentId
              zenFile.parentNodeId = this.parentNodeId
              zenFile.uniqueIdentifier = zenFile.md5
              resolve()
            }
            fileReader.onerror = e => reject(e)
          }

          let load = () => {
            var start = currentChunk * chunkSize
            var end = start + chunkSize >= file.size ? file.size : start + chunkSize
            fileReader.readAsBinaryString(file.slice(start, end))
          }
          load()*/
        })
      },
      mergeFile (md5, chunkNum, totalSize, name, path) {
        var qs = require('qs')
        let data = {
          'identifier': md5,
          'totalChunks': chunkNum,
          'totalSize': totalSize,
          'filename': name,
          'relativePath': path
        }
        let datapost = qs.stringify(data)
        axios.post('http://192.168.31.13:8080/files/chunks/merge', datapost, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          }
        })
      },
      checkMd5 (file, fileList) {
        console.log(this.$refs.uploader.uploader.files)
      },
      complete () {
        console.log('complete', arguments)
      },
      // 上传文件夹时 fileComplete 第一个参数为根文件（文件夹），第二个参数为最后一个上传的文件
      fileComplete () {
        console.log('file complete', arguments)
        // alert(arguments[1].uniqueIdentifier)
        // this.mergeFile(zenFile.md5, chunks, file.size)
        // this.mergeFile(arguments[0].uniqueIdentifier, arguments[0].chunks.length, arguments[0].size)
      },
      // 上传文件时 fileSuccess 第一个参数为根文件， 第二个参数为上传的文件
      fileSuccess () {
        console.log('fileSuccess', arguments)
        // this.fileMd5HeadTailTime(arguments[1].file, this.$refs.uploader.uploader.opts.chunkSize)
        // this.mergeFile(arguments[1].uniqueIdentifier, arguments[1].chunks.length, arguments[1].size, arguments[1].name, arguments[1].relativePath)
      },
      uploadFile () {
        let formData = new FormData()
        formData.append('parentnodeid', this.parentNodeId)
        this.fileAll = this.$refs.uploader.uploader.files
        for (var i = 0; i < this.fileAll.length; i++) {
          // let fileMd5 = this.getFileMD5(this.fileAll[i].file)
          // alert(fileMd5)
          // this.fileAll[i].file.md5Res = fileMd5
          // alert(this.fileAll[i].file.md5Res)
          //判断数组里是文件夹还是文件
          formData.append('files', this.fileAll[i].file)
        }
        /*saveFiles(this.componentId, formData).then((res) => {
          this.uploading = false
          this.$refs.uploader.uploader.cancel()
          this.getList()
          this.listLoading = false
          this.uploadDialog = false
        }).catch((error) => {
          this.listLoading = false
          this.uploading = false
          this.$notify({
            title: '失败',
            message: '上传失败',
            type: 'error',
            duration: 2000
          })
        })*/
      },
      /*fileComplete() {
        console.log('file complete', arguments)
        const file = arguments[0].file;
        axios.post('/boot/uploader/mergeFile', qs.stringify({
          filename: file.name,
          identifier: arguments[0].uniqueIdentifier,
          totalSize: file.size,
          type: file.type
        })).then(function (response) {
          console.log(response);
        }).catch(function (error) {
          console.log(error);
        });
      }*/
      // 获得文件md5
      getFileMD5 (file, callback) {
        //声明必要的变量
        // const spark = new SparkMD5()
        var fileReader = new FileReader(),
          //文件每块分割2M，计算分割详情
          chunkSize = 2097152,
          chunks = Math.ceil(file.size / chunkSize),
          currentChunk = 0,
          //创建md5对象（基于SparkMD5）
          spark = new SparkMD5()
        //每块文件读取完毕之后的处理
        fileReader.onload = function (e) {
          //每块交由sparkMD5进行计算
          spark.appendBinary(e.target.result)
          currentChunk++
          //如果文件处理完成计算MD5，如果还有分片继续处理
          if (currentChunk < chunks) {
            loadNext()
          } else {
            // callback(spark.end())
            // console.log('finished loading');
            // console.info('computed hash', spark.end());

            let fileMd5
            fileMd5 = spark.end()
            // alert(fileMd5)
            return fileMd5
          }
        }

        //处理单片文件的上传
        function loadNext () {
          var start = currentChunk * chunkSize,
            end = start + chunkSize >= file.size ? file.size : start + chunkSize
          fileReader.readAsBinaryString(file.slice(start, end))
        }

        loadNext()
      }
    },
    mounted () {
      this.$nextTick(() => {
        window.uploader = this.$refs.uploader.uploader
      })
    }
  }
</script>

<style>
  .uploader-example {
    width: 880px;
    padding: 15px;
    margin: 40px auto 0;
    font-size: 12px;
    box-shadow: 0 0 10px rgba(0, 0, 0, .4);
  }

  .uploader-example .uploader-btn {
    margin-right: 4px;
  }

  .uploader-example .uploader-list {
    max-height: 440px;
    overflow: auto;
    overflow-x: hidden;
    overflow-y: auto;
  }
</style>
