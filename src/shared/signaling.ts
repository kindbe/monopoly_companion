export type SignalingDescription = {
  type: "offer" | "answer";
  sdp: string;
};

export type SignalingIceCandidate = {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
};

export type SignalingClientMessage =
  | { type: "register-host"; joinCode: string }
  | { type: "join-signaling"; joinCode: string; playerName: string }
  | { type: "signal-offer"; peerId: string; description: SignalingDescription }
  | { type: "signal-answer"; peerId: string; description: SignalingDescription }
  | { type: "signal-ice-candidate"; peerId: string; candidate: SignalingIceCandidate }
  | { type: "peer-connected"; peerId: string };

export type SignalingServerEvent =
  | { type: "signaling-registered"; joinCode: string }
  | { type: "signaling-joined"; joinCode: string; hostPeerId: string }
  | { type: "signaling-peer-joined"; peerId: string; playerName: string }
  | { type: "signaling-offer"; peerId: string; description: SignalingDescription }
  | { type: "signaling-answer"; peerId: string; description: SignalingDescription }
  | { type: "signaling-ice-candidate"; peerId: string; candidate: SignalingIceCandidate }
  | { type: "signaling-peer-connected"; peerId: string }
  | { type: "signaling-error"; message: string };

export function isSignalingClientMessage(value: unknown): value is SignalingClientMessage {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return false;
  }
  return [
    "register-host",
    "join-signaling",
    "signal-offer",
    "signal-answer",
    "signal-ice-candidate",
    "peer-connected"
  ].includes(String((value as { type: unknown }).type));
}

export function isGameMessageType(type: string) {
  return [
    "create-session",
    "join-session",
    "start-bidding",
    "submit-bid",
    "raise-bid",
    "skip-property",
    "host-state",
    "player-state",
    "joined"
  ].includes(type);
}
