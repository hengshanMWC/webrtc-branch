import type SimplePeer from 'simple-peer'

export interface MagicWebrtcOptions {
  /**
   * simple-peer options 透传，会和默认值做覆盖合并
   * 详看 https://github.com/feross/simple-peer#api
   */
  peer?: SimplePeer.Options
  timeout?: number
  /**
   * 接收到文件共享请求时触发，返回 boolean 来决定是否接受共享文件
   */
  // onFileShareInitiate?: (fileInfo: IFileInitiateInfo) => Promise<boolean>;
}

type PeerPacking = Omit<SimplePeer.Options, 'initiator'>

export interface SenderOptions {
  /**
  * simple-peer options 透传，会和默认值做覆盖合并
  * 详看 https://github.com/feross/simple-peer#api
  */
  timeout?: number
  peer?: PeerPacking
}

export interface ReceiverOptions {
  /**
  * peer 传递的是simple-peer options 透传，会和默认值做覆盖合并
  * 详看 https://github.com/feross/simple-peer#api
  */
  peer?: PeerPacking
  timeout?: number
}

export enum EventNames {
  StartConnect = 'startConnect',
  CheckConnect = 'checkConnect',
  Candidate = 'candidate',
  Renegotiate = 'renegotiate',
  TransceiverRequest = 'transceiverRequest',
  Offer = 'offer', // 发送端
  Answer = 'answer', // 接收端
}
