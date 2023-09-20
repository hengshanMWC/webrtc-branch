import type { ReceiverOptions } from './type'
import { EventNames } from './type'
import { MagicWebrtc } from './MagicWebrtc'

export class Receiver extends MagicWebrtc {
  public constructor(options?: ReceiverOptions) {
    super(options)
    this.initReceiverEvent()
  }

  private initReceiverEvent() {
    this.on('signal', (data: any) => {
      const { type, sdp, candidate, renegotiate, transceiverRequest } = data
      switch (type) {
        case 'answer':
          this.emit(EventNames.Answer, data)
          break
        case 'candidate':
          this.emit(EventNames.Candidate, data)
          break
        case 'renegotiate':
          this.emit(EventNames.Renegotiate, data)
          break
        case 'transceiverRequest':
          this.emit(EventNames.TransceiverRequest, data)
          break
        default:
          break
      }
    })
  }

  addSenderSDP(sdp) {
    console.log('addSenderSDP', sdp)
    this.signal(sdp)
  }

  addSenderCandidate(candidate) {
    this.signal(candidate)
  }
}
