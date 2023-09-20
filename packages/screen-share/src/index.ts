import { EventEmitter } from 'eventemitter3'
import type { Sender } from '@abmao/magic-webrtc'
import { ERtcCatEventsName } from './events'
import type { DataRelay } from './dataRelay'
export class ScreenShare extends EventEmitter {
  private _mediaStream: MediaStream | undefined
  public webrtc: Sender
  private dataRelay: DataRelay
  public constructor(webrtc: Sender, dataRelay: DataRelay) {
    super()
    this.webrtc = webrtc
    this.dataRelay = dataRelay
  }

  /**
   * 屏幕共享传输
   */
  public screenShare(stream?: MediaStream) {
    try {
      // if (!this.connected) {
      //   throw new Error('WebRTC is not connected');
      // }

      const handler = (stream: MediaStream) => {
        this._startSendMediaStream(stream)
        // 告知另一端开始投屏了
        this.dataRelay.screenShareStart()
        // 告知自己这端要开始投屏了
        this._screenShareStart()
      }

      if (navigator.mediaDevices && !stream) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(handler)
          .catch((err) => {
            this.webrtc.emit(ERtcCatEventsName.ScreenShareError, err)
          })
      }
      if (stream)
        handler(stream)
    }
    catch (err) {
      console.error('[RtcCat Error]', err)
      this.emit(ERtcCatEventsName.ScreenShareError, err)
    }
  }

  /** 取消投屏 */
  public cancelScreenShare() {
    this.dataRelay.ScreenShareCancel()
    // 触发内部cancelScreenShare
    this._screenShareCancel()
  }

  /** 发送媒体流 */
  private _startSendMediaStream = (stream: MediaStream) => {
    this._mediaStream = stream
    this.webrtc.addStream(stream)
  }

  /** 开始投屏 */
  private _screenShareStart = () => {
    this.emit(ERtcCatEventsName.ScreenShareStart)
  }

  /** 触发投屏结束事件 */
  private _screenShareCancel = () => {
    if (this._mediaStream) {
      this.webrtc.removeStream(this._mediaStream)
      this._mediaStream = undefined
    }
    this.emit(ERtcCatEventsName.ScreenShareEnd)
  }
}
