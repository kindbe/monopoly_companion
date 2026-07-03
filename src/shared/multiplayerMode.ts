export type MultiplayerMode = "webrtc" | "websocket" | "unavailable"

export function chooseMultiplayerMode({
  requestedMode,
  hasWebRtc,
  hasWebSocket
}: {
  requestedMode: string | undefined
  hasWebRtc: boolean
  hasWebSocket: boolean
}): MultiplayerMode {
  if (requestedMode === "webrtc" && hasWebRtc) {
    return "webrtc"
  }
  if (hasWebSocket) {
    return "websocket"
  }
  return "unavailable"
}

export function browserSupportsWebRtc() {
  return (
    typeof RTCPeerConnection !== "undefined" &&
    typeof RTCDataChannel !== "undefined"
  )
}
