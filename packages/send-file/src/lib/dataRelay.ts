export abstract class DataRelay {
  abstract requestSendFile(data: RequestSendFileParams): void

  abstract sendFileChunk(data: SendFileChunkParams): void

  abstract cancelFileSend(data: CancelFileSendParams): void

  abstract fileSendComplete(data: FileSendCompleteParams): void

  abstract fileSendError(data: FileSendErrorParams): void
}

export abstract class DataRelayPro extends DataRelay {
  abstract verifyAllowSendFile(data: VerifyParams): boolean
  abstract verifyNotAllowSendFile(data: VerifyParams): boolean
  abstract verifyFileReceiveError(data: VerifyParams): verifyFileReceiveErrorReturns
  abstract verifyCancelFileReceive(data: VerifyParams): boolean
  abstract verifyFileSendComplete(data: VerifyParams): boolean
}

export interface RequestSendFileParams {
  id: number
  file: File
  name: string
  size: number
  type: string
}
export interface SendFileChunkParams {
  id: number
  file: File
  chunk: ArrayBuffer
}
export interface CancelFileSendParams {
  id: number
  file: File
}
export interface FileSendCompleteParams {
  id: number
  file: File
  md5?: string
}
export interface FileSendErrorParams {
  id: number
  file: File
  errorInfo?: string
}

export interface VerifyParams {
  id: number
  file: File
  msg: string
}

export interface verifyFileReceiveErrorReturns {
  verify: boolean
  errorInfo?: string
}
