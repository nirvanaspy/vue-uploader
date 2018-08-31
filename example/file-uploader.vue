<template>
  <div>
    <uploader
      :options="options"
      :autoStart="autoStart"
      :file-status-text="statusText"
      class="manage-uploader"
      ref="uploader"
      @file-complete="fileComplete"
      @complete="complete"
      @files-added="checkMd5"
      @file-success="fileSuccess"
      v-loading="md5Loading"
    >
      <uploader-unsupport></uploader-unsupport>
      <uploader-drop>
        <p>拖拽文件到此处或</p>
        <uploader-btn>选择文件</uploader-btn>
        <!--<uploader-btn :directory="true">选择文件夹</uploader-btn>-->
      </uploader-drop>
      <uploader-list ref="uploaderList"></uploader-list>
    </uploader>
    <!--<span slot="footer" class="dialog-footer" style="display: block;text-align: center;margin-top: 20px;">
      <span @click="uploadFile">确 定</span>
    </span>-->
  </div>
</template>

<script>
  /*eslint-disable*/
  import SparkMD5 from 'spark-md5'
  import axios from 'axios'

  export default {
    props: {
      parentNodeId: {
        type: String,
        default: ''
      },
      componentId: {
        type: String,
        default: '05473be4-6b45-443f-9edc-314c3c12b8'
      },
    },
    data () {
      return {
        options: {
          target: 'http://192.168.31.13:8080/files/chunks',
          // testChunks: true,
          // target: '/boot/uploader/chunk',
          testChunks: false,
          simultaneousUploads: 10,
          autoStart: false,
          chunkSize: 80 * 1024 * 1024,
          // generateUniqueIdentifier: this.preprocess,
          // preprocess: this.preprocess
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
        autoStart: false,
        /*componentId: 'abc',
        parentNodeId: 'def',*/
        fileTreeList: [],
        md5Loading: false
      }
    },
    methods: {
      catchAll() {
        console.log('all',event)
      },
      preprocess (chunk) {
        // console.log(chunk.preprocessState)
        // 上传或test之前执行,生成md5(如果file存在md5 就不生成了)
        if (chunk.file.md5 === '' || chunk.file.md5 == null) {
          this.fileMd5HeadTailTime(chunk.file, this.$refs.uploader.uploader.opts.chunkSize).then(() => {
            chunk.preprocessFinished()
          })
        } else {
          chunk.preprocessFinished()
        }
        /*this.fileMd5HeadTailTime(chunk.file, this.$refs.uploader.uploader.opts.chunkSize).then(() => {
          chunk.preprocessFinished()
        })*/
      },
      fileMd5HeadTailTime (zenFile, chunkSize) {
        return new Promise((resolve, reject) => {
          let file = zenFile.file
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
              zenFile.md5 = spark.end()
              zenFile.componentId = this.componentId
              zenFile.parentNodeId = this.parentNodeId
              zenFile.uniqueIdentifier = zenFile.md5
              /*axios.get('http://192.168.31.13:8080/files/hasmd5',{
                headers: {
                  "content-type": "application/x-www-form-urlencoded"
                },
                params: {
                  MD5: zenFile.md5
                }
              }).then((res) => {
                if(res.data.data == true) {
                  alert('该文件已存在')
                } else if(res.data.data == false){
                  resolve()
                }
              })*/
              resolve()
            }
            fileReader.onerror = e => reject(e)
          }

          let load = () => {
            var start = currentChunk * chunkSize
            var end = start + chunkSize >= file.size ? file.size : start + chunkSize
            fileReader.readAsBinaryString(file.slice(start, end))
          }
          load()
        })
      },
      checkMd5 (fileAdded, fileList) {
        // console.log(this.$refs.uploader.uploader.files)
        this.md5Loading = true
        console.log(fileAdded)
        console.log(fileAdded.length)
        // let SparkMD5 = require('spark-md5')
        // let SparkMD5 = require('spark-md5')
        let chunkSize = this.$refs.uploader.uploader.opts.chunkSize
        let completeFlag = 0
        let that = this
        for(var i = 0; i < fileAdded.length; i++) {
          let fileA = fileAdded[i]
          this.resolveMd5(fileA, chunkSize).then(function (result) {
            console.log(result)
            fileA.md5 = result
            fileA.uniqueIdentifier = result
            axios.get('http://192.168.31.13:8080/files/hasmd5',{
              headers: {
                "content-type": "application/x-www-form-urlencoded"
              },
              params: {
                MD5: fileA.md5
              }
            }).then((res) => {
              if (res.data.data.id) {
                that.md5Loading = false
                let infoList = [{
                  fileId: res.data.data.id,
                  MD5: fileA.md5,
                  name: fileA.name,
                  relativePath: '/' + fileA.relativePath
                }]
                let datapost = JSON.stringify(infoList)
                axios.post('http://192.168.31.13:8080/components/05473be4-6b45-443f-9edc-314c3c12b818/uploadfiles',datapost, {
                  headers: {
                    'content-type': 'application/json;charset=utf-8', //设置请求头信息
                    'parentNodeId': that.parentNodeId
                  }
                })
                that.$refs.uploader.uploader.removeFile(fileA)
              } else if (res.data.data == false) {
                completeFlag++
                if(completeFlag === fileAdded.length) {
                  console.log(fileAdded)
                  console.log('-------')
                  that.md5Loading = false
                  let allFile = that.$refs.uploader.uploader.files
                  console.log(allFile)
                  that.$refs.uploader.uploader.upload()
                }
              }
            })
          })
        }
        /*for(var i = 0; i < fileAdded.length; i++) {
          return new Promise((resolve, reject) => {
            let zenFile = fileAdded[i]
            let file = fileAdded[i].file
            // let spark = new SparkMD5.ArrayBuffer()
            let spark = new SparkMD5()
            let fileReader = new FileReader()
            let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
            let chunks = Math.ceil(file.size / chunkSize)
            let currentChunk = 0

            fileReader.onload = e => {
              spark.appendBinary(e.target.result)
              currentChunk++
              /!*if(zenFile.preprocessState == 2) {
                return
              }*!/
              if (currentChunk < chunks) {
                let a = 'deal with' + currentChunk + '剩余' + (chunks - currentChunk)
                console.log(a)
                load()
              } else {
                // console.log(zenFile)
                // zenFile.md5 = spark.end()
                // fileAdded[i].componentId = this.componentId
                // fileAdded[i].parentNodeId = this.parentNodeId
                // fileAdded[i].uniqueIdentifier = fileAdded[i].md5
                // zenFile.uniqueIdentifier = zenFile.md5
                resolve(spark.end())
                /!*if(zenFile.md5 === 'ad9f98bbebb0ecc86cb374d5bf3c4386') {
                  alert('已存在')
                  this.$refs.uploader.uploader.removeFile(zenFile)
                }*!/
                /!*axios.get('http://192.168.31.13:8080/files/hasmd5',{
                  headers: {
                    "content-type": "application/x-www-form-urlencoded"
                  },
                  params: {
                    MD5: file[i].md5
                  }
                }).then((res) => {
                  if(res.data.data == true) {
                    alert('该文件已存在')
                  } else if(res.data.data == false){
                    resolve()
                  }
                }).catch(
                  resolve()
                )*!/
              }
              fileReader.onerror = e => reject(e)
            }

            let load = () => {
              var start = currentChunk * chunkSize
              var end = start + chunkSize >= file.size ? file.size : start + chunkSize
              fileReader.readAsBinaryString(file.slice(start, end))
            }
            load()
          })
        }*/

      },
      resolveMd5(zenfile,chunkSize) {
        return new Promise((resolve, reject) => {
          let file = zenfile.file
          // let spark = new SparkMD5.ArrayBuffer()
          if(zenfile.md5){
            resolve(zenfile.md5)
          }else{
            let spark = new SparkMD5()
            let fileReader = new FileReader()
            let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
            let chunks = Math.ceil(file.size / chunkSize)
            let currentChunk = 0

            fileReader.onload = e => {
              spark.appendBinary(e.target.result)
              currentChunk++
              if (currentChunk < chunks) {
                let a = 'deal with' + currentChunk + '剩余' + (chunks - currentChunk)
                console.log(a)
                load()
              } else {
                resolve(spark.end())
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
      fileTreeInfo () {

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
        let data = {
          'identifier': arguments[1].uniqueIdentifier,
          'totalChunks': arguments[1].chunks.length,
          'totalSize': arguments[1].size,
          'filename': arguments[1].name,
          'relativePath': arguments[1].relativePath
        }
        let datapost = qs.stringify(data)
        axios.post('http://192.168.31.13:8080/files/chunks/merge', datapost, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          }
        }).then((res)=> {
          let infoList = [{
            fileId: res.data.data.id,
            MD5: arguments[1].md5,
            name: arguments[1].name,
            relativePath: '/' + arguments[1].relativePath
          }]
          let datapost = JSON.stringify(infoList)
          axios.post('http://192.168.31.13:8080/components/05473be4-6b45-443f-9edc-314c3c12b818/uploadfiles',datapost, {
            headers: {
              'content-type': 'application/json;charset=utf-8', //设置请求头信息
              'parentNodeId': this.parentNodeId
            }
          })
        })

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
