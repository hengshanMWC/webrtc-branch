import type { SenderOptions } from './type'
import { EventNames } from './type'
import { MagicWebrtc } from './MagicWebrtc'
function mergeOptions(options?: SenderOptions) {
  return {
    timeout: options?.timeout,
    peer: {
      ...options?.peer,
      initiator: true,
    },
  }
}

export class Sender extends MagicWebrtc {
  public constructor(options?: SenderOptions) {
    super(mergeOptions(options))
    this.initSenderEvent()
  }

  private initSenderEvent() {
    this.on('signal', (data: any) => {
      const { type, sdp, candidate, renegotiate, transceiverRequest } = data
      switch (type) {
        case 'offer':
          this.emit(EventNames.Offer, data)
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

  addReceiverSDP(sdp: any) {
    console.log('addReceiverSDP', sdp)
    this.signal(sdp)
  }

  addReceiverCandidate(candidate: any) {
    this.signal(candidate)
  }
}
