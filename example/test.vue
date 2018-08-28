<template>
  <div>
    <uploader
      :options="options"
      :autoStart="false"
      :file-status-text="statusText" class="uploader-example" ref="uploader" @file-complete="fileComplete" @complete="complete" @files-added="checkMd5()">
    </uploader>
    <span slot="footer" class="dialog-footer">
    <span @click="uploadFile">确 定</span>
  </span>
  </div>
</template>

<script>
  /*eslint-disable*/
  import SparkMD5 from 'spark-md5'
  export default {
    data () {
      return {
        options: {
          // target: 'http://192.168.31.13:8080/files/chunks',
          // testChunks: false,
          target: '/boot/uploader/chunk',
          testChunks: true,
          simultaneousUploads: 1,
          autoStart: false,
          chunkSize: 10 * 1024 * 1024,
          generateUniqueIdentifier: function (file) {
            return file.md5Res
            // console.log(file)
            /*file.md5Res = ''
            var fileReader = new FileReader(),
              //文件每块分割2M，计算分割详情
              chunkSize = 2097152,
              chunks = Math.ceil(file.size / chunkSize),
              currentChunk = 0,
              //创建md5对象（基于SparkMD5）
              spark = new SparkMD5()
            //每块文件读取完毕之后的处理
            fileReader.onload = function(e) {
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

                // let fileMd5
                // fileMd5 = spark.end()
                // file.md5Res = spark.end()
                // alert(fileMd5)
                return spark.end()
              }
            }
            //处理单片文件的上传
            function loadNext() {
              var start = currentChunk * chunkSize,
                end = start + chunkSize >= file.size ? file.size : start + chunkSize
              fileReader.readAsBinaryString(file.slice(start, end))
            }
            loadNext()
            // var md5Res = (fileReader.onload)
            // alert(md5Res)
            // return file.md5Res*/
          },
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
        }
      }
    },
    methods: {
      preprocess (chunk) {
        // 上传或test之前执行,生成md5(如果file存在md5 就不生成了)
        if (chunk.file.md5 === '' || chunk.file.md5 == null) {
          this.fileMd5HeadTailTime(chunk.file, this.$refs.uploader.uploader.opts.chunkSize).then(() => {
            chunk.preprocessFinished()
          })
        } else {
          chunk.preprocessFinished()
        }
      },
      fileMd5HeadTailTime(zenFile, chunkSize){
        return new Promise((resolve, reject) => {
          let file = zenFile.file
          let SparkMD5 = require('spark-md5')
          // let spark = new SparkMD5.ArrayBuffer()
          let spark = new SparkMD5()
          let fileReader = new FileReader()
          let blobSlice =
            File.prototype.slice ||
            File.prototype.mozSlice ||
            File.prototype.webkitSlice
          let chunks = Math.ceil(file.size / chunkSize)
          let currentChunk = 0

          fileReader.onload = e => {
            spark.appendBinary(e.target.result)
            currentChunk++
            if (currentChunk < chunks) {
              load()
            } else {
              zenFile.md5 = spark.end()
              resolve()

            }
            // spark.append(e.target.result)
            /*if (currentChunk === chunks - 1) {
              // 所有 首尾chunks 完毕 追加lastModifier
              // let time = new Int8Array(longToByteArray(file.lastModified))
              // spark.append(time)
              // console.info('computed hash', spark.end()) // Compute hash
              zenFile.md5 = spark.end()
              resolve()
            } else {
              currentChunk = chunks - 1 // 第一块读完直接读取最后一块
              if (currentChunk <= 0) {
                // 若只分了一块 直接tm组合时间拼接md5
                // let time = new Int8Array(longToByteArray(file.lastModified))
                // spark.append(time)
                zenFile.md5 = spark.end()
                resolve()
              } else {
                load()
              }
            }*/
            fileReader.onerror = e => reject(e)
          }

          let load = () => {
            var start = currentChunk * chunkSize
            var end = start + chunkSize >= file.size ? file.size : start + chunkSize
            // fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
            fileReader.readAsBinaryString(file.slice(start, end))
          }

          load()
        })},
      checkMd5(file, fileList) {
        // alert(2222)
        // console.log(file)
        // console.log(fileList)
        /*for(var i = 0; i < this.$refs.uploader.files.length; i++ ) {
          console.log(3333)
        }*/
        console.log(this.$refs.uploader.uploader.files)
      },
      complete () {
        console.log('complete', arguments)
      },
      fileComplete () {
        console.log('file complete', arguments)
        alert(arguments[0].uniqueIdentifier)
      },
      uploadFile() {
        let formData = new FormData()
        formData.append('parentnodeid', this.parentNodeId)
        this.fileAll = this.$refs.uploader.uploader.files
        for (var i = 0; i < this.fileAll.length; i++) {
          let fileMd5 = this.getFileMD5(this.fileAll[i].file)
          alert(fileMd5)
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
      getFileMD5(file, callback) {
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
        fileReader.onload = function(e) {
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
            alert(fileMd5)
            return fileMd5
          }
        }
        //处理单片文件的上传
        function loadNext() {
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
