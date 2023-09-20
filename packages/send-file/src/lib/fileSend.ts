import { ArrayBuffer as ArrayBufferMd5 } from 'spark-md5'
import { getFileInfo, getFileName, getRandomInt } from '../utils'
import { FILE_ERROR_CODE, FileError } from '../error'
import { UpFileEvent } from '../type'
import { ChunkQueue } from './chunkQueue'
import type { verifyFileReceiveErrorReturns } from './dataRelay'
import { DataRelayPro } from './dataRelay'
import type { WebRtcFile } from './index'
const DataRelayProWarn = '没有继承DataRelayPro类'
export default class FileSend {
  file: File
  id: number
  private spark: ArrayBufferMd5 | null = null
  private timer?: NodeJS.Timeout
  private chunkQueue: ChunkQueue
  private currentResolve?: CurrentResolve | undefined
  private currentReject?: CurrentReject | undefined
  private _eventProcessingCenter: (msg: string) => void
  private eventWebrtcError: (error: Error) => void
  private eventWebrtcClose: () => void
  private eventWebrtcDisconnected: (iceConnectionState: string) => void
  private webRtcFile: WebRtcFile
  constructor(file: File, webRtcFile: WebRtcFile, id?: number) {
    this.id = id || getRandomInt()
    this.file = file
    this.webRtcFile = webRtcFile
    this.chunkQueue = new ChunkQueue((this.webRtcFile.webrtc as any)._channel, file)
    if (webRtcFile.options.md5) {
      this.spark = new ArrayBufferMd5()
    }
    this._eventProcessingCenter = (msg: string) => {
      if (this.webRtcFile.options.eventProcessingCenter) {
        this.webRtcFile.options.eventProcessingCenter({
          fileSend: this,
          msg,
        })
      }
    }
    this.eventWebrtcError = (error: Error) => {
      this.fileSendError(error.message)
    }
    this.eventWebrtcClose = () => {
      this.fileSendError(`${this.viewFileName}传输失败，webrtc已经关闭`)
    }
    this.eventWebrtcDisconnected = (iceConnectionState: string) => {
      /**
         * 设备端杀死进程或断开网络触发
        */
      if (iceConnectionState === 'disconnected') {
        this.fileSendError(`${this.viewFileName}传输失败，webrtc已经断开连接`)
      }
    }
  }

  get shareFile() {
    return {
      id: this.id,
      file: this.file,
    }
  }

  private get viewFileName() {
    return `文件(${this.file.name})`
  }

  private get dataRelay() {
    return this.webRtcFile.dataRelay
  }

  private get timeout() {
    return this.webRtcFile.options.timeout
  }

  sendFile() {
    const p = new Promise((resolve: CurrentResolve, reject: CurrentReject) => {
      this.currentResolve = resolve
      this.currentReject = reject
      this.addWebrtcEvent()
      return this.notice()
        .then(() => {
          return this.chunkQueue.packageStream((chunk) => {
            this.handleLoad(chunk)
          })
        })
        .then(() => this.fileSendComplete())
        .catch(err => this.handleFileReaderError(err))
    })
    p.finally(() => this.init())
    return p
  }

  cancelFileSend() {
    this.init()
    try {
      this.dataRelay.cancelFileSend(this.getSendData())
    }
    catch (err) {
      console.log(err, `${this.viewFileName}取消失败`)
    }
  }

  triggerReject(err: FileError) {
    if (typeof this.currentReject === 'function') {
      this.currentReject(err)
      this.currentReject = undefined
    }
  }

  triggerResolve() {
    if (typeof this.currentResolve === 'function') {
      this.currentResolve(this.file)
      this.currentResolve = undefined
    }
  }

  private cancelFileReceive() {
    this.triggerReject(new FileError(FILE_ERROR_CODE.CancelFileReceive))
  }

  private fileSendError(errorInfo?: string) {
    this.triggerReject(new FileError(FILE_ERROR_CODE.SendFile, errorInfo))
  }

  private fileReceiveError(errorInfo?: string) {
    this.triggerReject(new FileError(FILE_ERROR_CODE.ReceiveFile, errorInfo))
  }

  private getSendData<T extends object>(data?: any): FileSend['shareFile'] & T {
    return {
      ...this.shareFile,
      ...data,
    }
  }

  private init() {
    this.currentReject = undefined
    this.currentResolve = undefined
    this.timer && clearTimeout(this.timer)
    this.removeWebrtcEvent()
    this.chunkQueue.init()
  }

  private addWebrtcEvent() {
    this.webRtcFile.webrtc.on('data', this._eventProcessingCenter)
    this.webRtcFile.webrtc.on('error', this.eventWebrtcError)
    this.webRtcFile.webrtc.on('close', this.eventWebrtcClose)
    this.webRtcFile.webrtc.on('iceStateChange', this.eventWebrtcDisconnected)
  }

  private removeWebrtcEvent() {
    this.webRtcFile.webrtc.off('data', this._eventProcessingCenter)
    this.webRtcFile.webrtc.off('error', this.eventWebrtcError)
    this.webRtcFile.webrtc.off('close', this.eventWebrtcClose)
    this.webRtcFile.webrtc.off('iceStateChange', this.eventWebrtcDisconnected)
  }

  private fileSendComplete() {
    const result: {
      md5?: string
    } = {}
    if (this.spark) {
      result.md5 = this.spark.end()
    }
    try {
      this.dataRelay.fileSendComplete(this.getSendData(result))
      this.fileSendCompleteVerify()
    }
    catch (err) {
      this.fileSendError(err.message)
    }
  }

  private fileSendCompleteVerify() {
    if (this.dataRelay instanceof DataRelayPro) {
      const handleEvent = (msg: string) => {
        let isSendComplete: boolean
        let isReceiveCancel: boolean
        let isReceiveError: boolean
        let errorInfo: string | undefined

        if (this.dataRelay instanceof DataRelayPro) {
          let msgData: verifyFileReceiveErrorReturns
          try {
            isSendComplete = this.dataRelay.verifyFileSendComplete(this.getSendData({
              msg,
            }))
            isReceiveCancel = this.dataRelay.verifyCancelFileReceive(this.getSendData({
              msg,
            }))
            msgData = this.dataRelay.verifyFileReceiveError(this.getSendData({
              msg,
            }))
          }
          catch (err) {
            removeEvent()
            this.fileSendError(err.message)
            return
          }
          isReceiveError = msgData.verify
          errorInfo = msgData.errorInfo
        }
        else {
          removeEvent()
          this.triggerReject(new FileError(FILE_ERROR_CODE.Other, DataRelayProWarn))
          return
        }

        const timer = setTimeout(() => {
          removeEvent()
          const message = `${this.viewFileName}接收完成无响应`
          this.triggerReject(new FileError(FILE_ERROR_CODE.Overtime, message))
        }, this.timeout)

        if (isSendComplete) {
          clearInterval(timer)
          removeEvent()
          this.triggerResolve()
        }
        else if (isReceiveCancel) {
          clearInterval(timer)
          removeEvent()
          this.cancelFileReceive()
        }
        else if (isReceiveError) {
          clearInterval(timer)
          removeEvent()
          this.fileReceiveError(errorInfo)
        }
      }

      const removeEvent = () => this.webRtcFile.webrtc.off('data', handleEvent)
      this.webRtcFile.webrtc.on('data', handleEvent)
    }
    else {
      this.triggerResolve()
    }
  }

  handleFileReaderError(error: FileError) {
    const errorInfo = error.message
    try {
      this.dataRelay.fileSendError(this.getSendData({
        errorInfo,
      }))
      this.triggerReject(error)
    }
    catch (err) {
      this.fileSendError(err.message)
    }
  }

  private notice() {
    const data = {
      id: this.id,
      ...getFileInfo(this.file),
    }
    const fileName = getFileName(this.shareFile.file)

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const message = `${fileName}发送前接受端不应答`
        removeEvent()
        reject(new FileError(FILE_ERROR_CODE.Overtime, message))
      }, this.timeout)
      const removeEvent = () => {
        this.timer = timer
        clearInterval(timer)
        this.webRtcFile.webrtc.off('data', handleEvent)
      }

      const handleEvent = (msg: string) => {
        let pass: boolean
        let refuse: boolean
        if (this.dataRelay instanceof DataRelayPro) {
          try {
            pass = this.dataRelay.verifyAllowSendFile(this.getSendData({
              msg,
            }))
            refuse = this.dataRelay.verifyNotAllowSendFile(this.getSendData({
              msg,
            }))
          }
          catch (err) {
            removeEvent()
            resolve(new FileError(FILE_ERROR_CODE.WebrtcError, err.message))
            return
          }
        }
        else {
          removeEvent()
          resolve(new FileError(FILE_ERROR_CODE.Other, DataRelayProWarn))
          return
        }

        if (pass) {
          removeEvent()
          resolve(data)
        }
        // 不接收
        else if (refuse) {
          removeEvent()
          const message = `${fileName}被拒绝`
          reject(new FileError(FILE_ERROR_CODE.RefuseFile, message))
        }
      }
      if (this.dataRelay instanceof DataRelayPro) {
        this.webRtcFile.webrtc.on('data', handleEvent)
      }
      else {
        resolve(data)
      }
      try {
        this.dataRelay.requestSendFile(this.getSendData(data))
      }
      catch (err) {
        this.fileSendError(err.message)
      }
    })
  }

  private handleLoad(chunk: ArrayBuffer) {
    try {
      this.dataRelay.sendFileChunk(this.getSendData({
        chunk,
      }))
      this.spark?.append(chunk)
      this.changeProgress(Math.min(this.chunkQueue.writeProgress, 1))
    }
    catch (err) {
      this.fileSendError(err.message)
    }
  }

  private changeProgress(progress: number) {
    this.webRtcFile.emit(UpFileEvent.Progress, this.id, progress)
  }
}
export type CurrentResolve = (data: File) => void
export type CurrentReject = (err: FileError) => void
