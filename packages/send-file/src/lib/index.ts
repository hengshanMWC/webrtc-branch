import { EventEmitter } from 'eventemitter3'
import type { Sender } from '@abmao/magic-webrtc'
import { timeout } from '../constants'
import type { ChangeProgress, FileUpload, ShareFile, WebRtcFileOptions } from '../type'
import { UpFileEvent } from '../type'
import FileSend from './fileSend'
import type { DataRelay, DataRelayPro } from './dataRelay'
const defaultOptions = {
  timeout,
  md5: false,
}
export class WebRtcFile extends EventEmitter implements FileUpload {
  private currentFileSend: FileSend | null
  public dataRelay: DataRelay | DataRelayPro
  public webrtc: Sender
  public options: WebRtcFileOptions
  private currentChangeProgress!: ChangeProgress

  constructor(webrtc: Sender, dataRelay: DataRelay | DataRelayPro, options?: WebRtcFileOptions) {
    super()
    this.currentFileSend = null
    this.webrtc = webrtc
    this.dataRelay = dataRelay
    this.options = Object.assign(defaultOptions, options)
    this.onEvent()
  }

  get idle() {
    return !this.currentFileSend
  }

  private onEvent() {
    this.on(UpFileEvent.Progress, (id: number, progress: number) => {
      if (typeof this.currentChangeProgress === 'function')
        this.currentChangeProgress(id, Math.floor(progress * 100))
    })
  }

  sendFile(
    shareFile: ShareFile,
    changeProgress: ChangeProgress,
  ) {
    this.currentFileSend = new FileSend(shareFile.file, this, shareFile.id)
    this.currentChangeProgress = changeProgress
    return this.currentFileSend.sendFile()
  }

  cancelFile() {
    this.currentFileSend?.cancelFileSend()
  }
}

