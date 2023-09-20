import SimplePeer from 'simple-peer'
import type { MagicWebrtcOptions } from './type'
import {
  EventNames,
} from './type'

// 默认的 simple-peer 配置
const DEFAULT_PEER_OPTIONS: SimplePeer.Options = {
  objectMode: true,
  offerOptions: {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  },
}

const DEFAULT_TIMEOUT = 5000

/**
 * init:初始化(未连接)
 * connecting:连接中
 * connected:连接成功
 */
export type webrtcConnectState = 'new' | 'checking' | 'connected' | any

export class MagicWebrtc extends SimplePeer {
  private connecSucc: Boolean = false
  // on(event: EventNames.StartConnect, listener: (iceConnectionState: 'connected' | 'completed') => void): this

  public constructor(options?: MagicWebrtcOptions) {
    super(
      Object.assign({}, DEFAULT_PEER_OPTIONS, options?.peer || {}, {
        objectMode: true, // objectMode 必须是 true，不允许更改
      }),
    )
    this._initEvent()
    this._checkConnect(options?.timeout || DEFAULT_TIMEOUT)
  }

  /**
   * 发送数据
   */
  public _sendProtocol = (data: any) => {
    // console.log("_sendProtocol")
    const json = JSON.stringify(data)
    this.send(json)
  }

  /**
   * 初始化事件，处理内部状态
   */
  private _initEvent() {
    this.on('error', (err) => {
      console.error('SimplePeer error', err)
    })
    this.on('iceStateChange', (iceConnectionState: string, iceGatheringState) => {
      if (this.connecSucc === false && (iceConnectionState === 'connected' || iceConnectionState === 'completed')) {
        // 表示:连接成功
        this.connecSucc = true
        this.emit(EventNames.StartConnect, iceConnectionState)
      }
    })
  }

  /**
     * 连接检测
     */
  private _checkConnect(timeout = 5000): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('emit checkConnect')
        this.emit(EventNames.CheckConnect, this.connecSucc)
        if (this.connecSucc) {
          resolve(true)
        }
        else {
          reject()
        }
      }, timeout)
    })
  }
}
