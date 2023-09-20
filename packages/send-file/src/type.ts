import type FileSend from './lib/fileSend'

export interface FileUpload {
  sendFile (shareFile: ShareFile, changeProgress: ChangeProgress): Promise<File>
  cancelFile (): void
}

export interface WebRtcFileOptions {
  timeout?: number
  md5: boolean
  eventProcessingCenter?(webRtcFile: WebrtcEventParams): void
}
export interface WebrtcEventParams {
  fileSend: FileSend
  msg: string
}
export type ChangeProgress = (id: number, progress: number) => void

export enum UpFileEvent {
  Progress = 'progress',
  Error = 'error',
  Cancel = 'cancel',
  Complete = 'complete',
}

export interface ShareFile {
  id: number
  file: File
}
