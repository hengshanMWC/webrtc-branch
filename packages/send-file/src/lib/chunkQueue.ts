import { getFileName } from '../utils'
import { FILE_ERROR_CODE, FileError } from '../error'
import type { CurrentReject, CurrentResolve } from './fileSend'
const BYTES_PER_CHUNK = 1200

export class ChunkQueue {
  file: File
  private chunkFrequency = 0 // 文件
  private currentResolve?: CurrentResolve | undefined
  private currentReject?: CurrentReject | undefined
  private fileChunk = 0 // 文件的读取完成度
  private queue: ArrayBuffer[] = []
  private dataChannel: RTCDataChannel
  private fileReader: FileReader
  private _handleLoad: ChunkQueue['handleLoad']
  private cd?: (chunk: ArrayBuffer) => void
  constructor(dataChannel: RTCDataChannel, file: File) {
    this.file = file
    this.dataChannel = dataChannel
    this.fileReader = new FileReader()
    this._handleLoad = this.handleLoad.bind(this)
    this.fileReader.addEventListener('error', () => {
      this.handleFileReaderError()
    })
  }

  get fileName() {
    return getFileName(this.file)
  }

  get full() {
    return this.dataChannel.bufferedAmount > this.dataChannel.bufferedAmountLowThreshold
  }

  get writeProgress() {
    const currentProgress = BYTES_PER_CHUNK * this.chunkFrequency
    return currentProgress / this.file.size
  }

  get readProgress() {
    const currentProgress = BYTES_PER_CHUNK * this.fileChunk
    return currentProgress / this.file.size
  }

  get writeEnd() {
    return this.writeProgress >= 1
  }

  get readEnd() {
    return this.readProgress >= 1
  }

  packageStream(cd: (chunk: ArrayBuffer) => void) {
    const p = new Promise((resolve: CurrentResolve, reject: CurrentReject) => {
      this.init()
      this.currentResolve = resolve
      this.currentReject = reject
      this.fileReader.addEventListener('load', this._handleLoad)
      this.cd = cd
      this.readNextChunk()
    })
    p.finally(() => this.init())
    return p
  }

  init() {
    this.currentResolve = undefined
    this.currentReject = undefined
    this.cd = undefined
    this.chunkFrequency = 0
    this.fileChunk = 0
    this.removeLoad()
    this.clear()
  }

  private removeLoad() {
    this.fileReader.removeEventListener('load', this._handleLoad)
  }

  private clear() {
    this.queue.length = 0
  }

  private add(buffer: ArrayBuffer) {
    this.queue.push(buffer)
  }

  private pop() {
    return this.queue.shift()
  }

  private write() {
    while (this.queue.length) {
      if (this.full) {
        this.onbufferedamountlow()
        break
      }
      ++this.chunkFrequency
      const chunk = this.pop()
      chunk && chunk.byteLength && this.cd && this.cd(chunk)
    }
    if (this.writeEnd)
      this.triggerResolve(this.file)

    else
      this.readNextChunk()
  }

  private readNextChunk() {
    const start = BYTES_PER_CHUNK * this.fileChunk++
    const end = Math.min(this.file.size, start + BYTES_PER_CHUNK)
    this.fileReader.readAsArrayBuffer(this.file.slice(start, end))
  }

  private handleLoad() {
    this.handleChunk(this.fileReader.result as ArrayBuffer)
  }

  private onbufferedamountlow() {
    this.dataChannel.onbufferedamountlow = () => {
      this.dataChannel.onbufferedamountlow = null
      this.write()
    }
  }

  private handleChunk(chunk: ArrayBuffer) {
    this.add(chunk)
    // 是否满了
    if (this.full) {
      // 满了进队列
      this.onbufferedamountlow()
    }
    else {
      this.write()
    }
  }

  private handleFileReaderError() {
    const errorInfo = `${this.fileName}分片失败`
    this.triggerReject(new FileError(
      FILE_ERROR_CODE.FileReader,
      errorInfo,
    ))
  }

  private triggerReject(err: FileError) {
    if (typeof this.currentReject === 'function') {
      this.currentReject(err)
      this.currentReject = undefined
    }
  }

  private triggerResolve(file: File) {
    if (typeof this.currentResolve === 'function') {
      this.currentResolve(file)
      this.currentResolve = undefined
    }
  }
}
