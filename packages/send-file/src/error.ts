export class FileError extends Error {
  code: FileErrorCodeType
  constructor(code: FileErrorCodeType, message?: string) {
    super(message)
    this.name = `FileError.${code}`
    this.code = code
  }
}

export const FILE_ERROR_CODE = {
  RefuseFile: '@RefuseFile', // 拒绝接收文件
  SendFile: '@SendFile', // 发送文件失败
  FileReader: '@FileReader', // 文件分片失败
  ReceiveFile: '@ReceiveFile', // 接收文件失败
  CancelFileReceive: '@CancelFileReceive', // 文件取消接收
  Overtime: '@Overtime', // 超时
  WebrtcError: '@WebrtcError', // webrtc报错
  WebrtcClose: '@WebrtcClose', // webrtc关闭
  WebrtcDisconnected: '@WebrtcDisconnected', // webrtc连接断开
  Other: '@Other',
} as const

export type FileErrorCode = typeof FILE_ERROR_CODE

export type FileErrorCodeType = {
  [key in keyof FileErrorCode]: FileErrorCode[key]
}[keyof FileErrorCode]
