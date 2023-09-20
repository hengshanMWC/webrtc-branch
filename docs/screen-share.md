# 屏幕投放
用于屏幕投放

## 安装
```
npm i @abmao/magic-webrtc @abmao/magic-webrtc-screen-share
```

## Api

### ScreenShare
创建ScreenShare实例，用于屏幕投放
#### 类型
```ts
class ScreenShare extends EventEmitter {
    webrtc: Sender;
    constructor(webrtc: Sender, dataRelay: DataRelay);
    /**
     * 屏幕共享传输
     */
    screenShare(stream?: MediaStream): void;
    /** 取消投屏 */
    cancelScreenShare(): void;
}
// 主要用来发送webrtc
abstract class DataRelay {
    abstract screenShareStart(): void;
    abstract ScreenShareCancel(): void;
}
```

#### 详细信息
为了更好的复用，ScreenShare 从两端数据协议中抽离出 DataRelay 抽象类，要想使用 ScreenShare 能力需要实现抽象类的功能。

peer 需要两端保持一致的数据结构通讯，但是不同团队之间难一保持一致，为了顺利复用行为，便出现了 DataRelay 数据层，用来抽离不同对接方的数据结构差异
#### 示例
```ts
import { Sender } from '@abmao/magic-webrtc'
import { sender, ScreenShare } from '@abmao/magic-webrtc-screen-share'
const receiver = new Sender()
class SendData extends DataRelay {
  screenShareStart() {
    // 投屏开始处理
  }

  ScreenShareCancel() {
    // 投屏取消处理
  }
}
const screenShare = new ScreenShare(sender, new SendData())
screenShare.screenShare(stream)
screenShare.cancelScreenShare()
```