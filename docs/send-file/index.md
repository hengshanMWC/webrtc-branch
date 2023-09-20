# 文件传输
用于文件传输，有两种不同的交互版本提供，[基础交互](/send-file/dataRelay)与[高级交互](/send-file/dataRelayPro)

## 安装
```
npm i @abmao/magic-webrtc @abmao/magic-webrtc-send-file
```

## Api

### WebRtcFile
创建WebRtcFile实例，用于文件传输

#### 类型
##### WebRtcFile
```ts
import type { Sender } from '@abmao/magic-webrtc';
import { EventEmitter } from 'eventemitter3';
class WebRtcFile extends EventEmitter implements FileUpload {
    constructor(webrtc: Sender, dataRelay: DataRelay | DataRelayPro, options?: WebRtcFileOptions);
    // 是否空闲
    get idle(): boolean;
    // 发送文件
    sendFile(shareFile: ShareFile, changeProgress: ChangeProgress): Promise<File>; 
    // 取消发送
    cancelFile(): void;
}
interface WebRtcFileOptions {
    timeout?: number; // 检测连接的时间，默认5000ms
    md5: boolean; // 计算文件md5的值，体现在FileSendCompleteParams上
    eventProcessingCenter?(webRtcFile: WebrtcEventParams): void; // 文件传输时开始监听事件，文件传输结束自动解绑
}
```
##### DataRelay

主要用来发送webrtc，msg是webrtc接收数据
- **id**: 文件传输id
- **file**: 传输的文件
```ts
abstract class DataRelay {
    // webrtc发送：请求发送文件
    abstract requestSendFile(data: RequestSendFileParams): void;
    // webrtc发送：发送文件块
    abstract sendFileChunk(data: SendFileChunkParams): void;
    // webrtc发送：取消文件发送
    abstract cancelFileSend(data: CancelFileSendParams): void;
    // webrtc发送：发送文件完成
    abstract fileSendComplete(data: FileSendCompleteParams): void;
    // webrtc发送：发送文件失败
    abstract fileSendError(data: FileSendErrorParams): void;
}

interface RequestSendFileParams {
  id: number
  file: File
  name: string // 文件名
  size: number // 文件大小，单位bytes
  type: string // 文件类型
}
interface SendFileChunkParams {
  id: number
  file: File 
  chunk: ArrayBuffer // 文件块
}
interface CancelFileSendParams {
  id: number
  file: File
}
interface FileSendCompleteParams {
  id: number
  file: File
  md5?: string // 文件md5的值
}
interface FileSendErrorParams {
  id: number
  file: File
  errorInfo?: string // 错误信息
}
```
##### DataRelayPro

主要用来处理webrtc数据，msg是webrtc接收数据
```ts
abstract class DataRelayPro extends DataRelay {
    // webrtc接收：允许发送
    abstract verifyAllowSendFile(data: VerifyParams): boolean;
    // webrtc接收：不允许发送
    abstract verifyNotAllowSendFile(data: VerifyParams): boolean;
    // webrtc接收：文件接收失败
    abstract verifyFileReceiveError(data: VerifyParams): verifyFileReceiveErrorReturns;
    // webrtc接收：取消文件接收
    abstract verifyCancelFileReceive(data: VerifyParams): boolean;
    // webrtc接收：文件接收完成
    abstract verifyFileSendComplete(data: VerifyParams): boolean;
}

interface VerifyParams {
  id: number
  file: File
  msg: string // webrtc接收到的信息
}

interface verifyFileReceiveErrorReturns {
  verify: boolean // 是否通过
  errorInfo?: string
}
```
- **msg**: webrtc接收到的消息

#### 详细信息
peer 需要两端保持一致的数据结构通讯，但是不同团队之间难以保持一致，为了顺利复用行为，便出现了 DataRelay 数据层，用来抽离不同对接方的数据结构差异。所以在使用该能力时，要先实现 DataRelay 抽象类

有两种模式分别是 DataRelay 和 DataRelayPro 两种模式,DataRelayPro提供了更高级的能力，用于处理接收方事件
#### 示例
```ts
import { WebRtcFile } from '@abmao/magic-webrtc-send-file';
import { Sender } from '@abmao/magic-webrtc';
import EventFactory from './eventFactory';
class EventFactory extends DataRelayPro {
  eventProcessingCenter ({
    fileSend,
    msg,
  }: WebrtcEventParams) {
    // data事件回调
  }

  requestSendFile (data: RequestSendFileParams) {
    // 请求发送文件
  }

  sendFileChunk (data: SendFileChunkParams) {
    // 发送文件块
  }

  cancelFileSend (data: CancelFileSendParams) {
    // 取消文件发送
  }

  fileSendComplete (data: FileSendCompleteParams) {
    // 发送文件完成
  }

  fileSendError (data: FileSendErrorParams) {
    // 发送文件失败
  }
}
const sender = new Sender()
const webRtcFile = new WebRtcFile(sender, new EventFactory());
```
----------

### FileSend
webrtc文件传输核心
#### 类型
```ts
class FileSend {
    file: File;
    id: number;
    constructor(file: File, webRtcFile: WebRtcFile, id?: number);
    get shareFile(): {
        id: number;
        file: File;
    };
    // 发送文件
    sendFile(): Promise<File>;
    // 取消发送
    cancelFileSend(): void;
    // 错误结束
    triggerReject(err: FileError): void;
    // 正确结束
    triggerResolve(): void;
    // 接收文件错误
    handleFileReaderError(error: FileError): void;
}
type CurrentResolve = (data: File) => void;
type CurrentReject = (err: FileError) => void;
```

#### 详细信息
WebRtcFile内部发送功能的实例，该实例会出现在DataRelay的eventProcessingCenter方法的参数里面，

#### 实例
```ts
class EventFactory extends DataRelayPro {
  eventProcessingCenter ({
    fileSend,
    msg,
  }: WebrtcEventParams) {
    const data = JSON.parse(msg)
    if (data.type === 'error') {
      fileSend.triggerReject()
    }
  }
}
```

### ChunkQueue
webrtc文件分片
#### 类型
```ts
class ChunkQueue {
    file: File;
    constructor(dataChannel: RTCDataChannel, file: File);
    packageStream(cd: (chunk: ArrayBuffer) => void): Promise<File>;
    removeLoad(): void;
}
```

#### 详细信息
用于webrtc文件分片

#### 实例
```ts
import { ChunkQueue } from '@abmao/magic-webrtc-send-file'
const chunkQueue = new ChunkQueue(_channel, file)
chunkQueue.packageStream((chunk) => {
  console.log('ArrayBuffer', chunk)
})
  .then(file => console.log('文件', file))
```

