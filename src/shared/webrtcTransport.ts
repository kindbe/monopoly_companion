import type { ClientCommand, ServerEvent } from "./multiplayer";
import type { SignalingClientMessage, SignalingServerEvent } from "./signaling";

type DataChannelLike = {
  readyState: string;
  onopen: (() => void) | null;
  onclose?: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  send(message: string): void;
};

type PeerConnectionLike = {
  ondatachannel: ((event: { channel: DataChannelLike }) => void) | null;
  onicecandidate?: ((event: { candidate: RTCIceCandidateInit | null }) => void) | null;
  oniceconnectionstatechange: (() => void) | null;
  iceConnectionState: string;
  createDataChannel(label: string): DataChannelLike;
  createOffer(): Promise<RTCSessionDescriptionInit>;
  createAnswer(): Promise<RTCSessionDescriptionInit>;
  setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
};

export type PeerConnectionConstructor = new (configuration?: RTCConfiguration) => PeerConnectionLike;

export type WebRtcHostTransport = {
  connect(): void;
  handleSignal(event: SignalingServerEvent): Promise<void>;
  sendPlayerEvent(peerId: string, event: ServerEvent): void;
};

export type WebRtcPlayerTransport = {
  connect(): void;
  handleSignal(event: SignalingServerEvent): Promise<void>;
  sendJoin(): void;
  raiseBid(input: Omit<Extract<ClientCommand, { type: "raise-bid" }>, "type">): void;
  skipProperty(input: Omit<Extract<ClientCommand, { type: "skip-property" }>, "type">): void;
};

type HostTransportOptions = {
  joinCode: string;
  iceServers?: RTCIceServer[];
  RTCPeerConnectionCtor?: PeerConnectionConstructor;
  sendSignal: (message: SignalingClientMessage) => void;
  onPlayerIntent: (peerId: string, message: ClientCommand) => void;
  onError?: (message: string) => void;
};

type PlayerTransportOptions = {
  joinCode: string;
  playerName: string;
  iceServers?: RTCIceServer[];
  RTCPeerConnectionCtor?: PeerConnectionConstructor;
  sendSignal: (message: SignalingClientMessage) => void;
  onEvent: (event: ServerEvent) => void;
  onError?: (message: string) => void;
};

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function createWebRtcHostTransport({
  joinCode,
  iceServers = DEFAULT_ICE_SERVERS,
  RTCPeerConnectionCtor = RTCPeerConnection as unknown as PeerConnectionConstructor,
  sendSignal,
  onPlayerIntent,
  onError = () => {}
}: HostTransportOptions): WebRtcHostTransport {
  const peers = new Map<string, { connection: PeerConnectionLike; channel: DataChannelLike }>();

  function connect() {
    sendSignal({ type: "register-host", joinCode });
  }

  async function handleSignal(event: SignalingServerEvent) {
    if (event.type === "signaling-peer-joined") {
      const connection = createPeerConnection(RTCPeerConnectionCtor, iceServers, onError, (candidate) => {
        sendIceCandidate(sendSignal, event.peerId, candidate);
      });
      const channel = connection.createDataChannel("monopoly-game");
      wireHostChannel(event.peerId, channel, onPlayerIntent, onError);
      peers.set(event.peerId, { connection, channel });
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      sendSignal({ type: "signal-offer", peerId: event.peerId, description: { type: "offer", sdp: offer.sdp ?? "" } });
      return;
    }
    if (event.type === "signaling-answer") {
      await peers.get(event.peerId)?.connection.setRemoteDescription(event.description);
      return;
    }
    if (event.type === "signaling-ice-candidate") {
      await peers.get(event.peerId)?.connection.addIceCandidate(event.candidate);
    }
  }

  function sendPlayerEvent(peerId: string, event: ServerEvent) {
    sendChannelMessage(peers.get(peerId)?.channel ?? null, event);
  }

  return {
    connect,
    handleSignal,
    sendPlayerEvent
  };
}

export function createWebRtcPlayerTransport({
  joinCode,
  playerName,
  iceServers = DEFAULT_ICE_SERVERS,
  RTCPeerConnectionCtor = RTCPeerConnection as unknown as PeerConnectionConstructor,
  sendSignal,
  onEvent,
  onError = () => {}
}: PlayerTransportOptions): WebRtcPlayerTransport {
  let hostPeerId: string | null = null;
  let connection: PeerConnectionLike | null = null;
  let channel: DataChannelLike | null = null;

  function connect() {
    sendSignal({ type: "join-signaling", joinCode, playerName });
  }

  async function handleSignal(event: SignalingServerEvent) {
    if (event.type === "signaling-joined") {
      hostPeerId = event.hostPeerId;
      connection = createPeerConnection(RTCPeerConnectionCtor, iceServers, onError, (candidate) => {
        if (hostPeerId) {
          sendIceCandidate(sendSignal, hostPeerId, candidate);
        }
      });
      connection.ondatachannel = ({ channel: nextChannel }) => {
        channel = nextChannel;
        wirePlayerChannel(nextChannel, onEvent, onError, flushPendingCommands);
      };
      return;
    }
    if (event.type === "signaling-offer") {
      hostPeerId = event.peerId;
      connection ??= createPeerConnection(RTCPeerConnectionCtor, iceServers, onError, (candidate) => {
        if (hostPeerId) {
          sendIceCandidate(sendSignal, hostPeerId, candidate);
        }
      });
      connection.ondatachannel = ({ channel: nextChannel }) => {
        channel = nextChannel;
        wirePlayerChannel(nextChannel, onEvent, onError, flushPendingCommands);
      };
      await connection.setRemoteDescription(event.description);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      sendSignal({ type: "signal-answer", peerId: event.peerId, description: { type: "answer", sdp: answer.sdp ?? "" } });
      return;
    }
    if (event.type === "signaling-ice-candidate") {
      await connection?.addIceCandidate(event.candidate);
    }
  }

  function sendJoin() {
    sendGameCommand({ type: "join-session", joinCode, name: playerName });
  }

  function sendGameCommand(command: ClientCommand) {
    if (!hostPeerId) {
      pendingCommands.push(command);
      return;
    }
    if (!sendChannelMessage(channel, command)) {
      pendingCommands.push(command);
    }
  }
  const pendingCommands: ClientCommand[] = [];

  function flushPendingCommands() {
    for (const command of pendingCommands.splice(0)) {
      sendChannelMessage(channel, command);
    }
  }

  return {
    connect,
    handleSignal,
    sendJoin,
    raiseBid(input) {
      sendGameCommand({ type: "raise-bid", ...input });
    },
    skipProperty(input) {
      sendGameCommand({ type: "skip-property", ...input });
    }
  };
}

function createPeerConnection(
  RTCPeerConnectionCtor: PeerConnectionConstructor,
  iceServers: RTCIceServer[],
  onError: (message: string) => void,
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void
) {
  const connection = new RTCPeerConnectionCtor({ iceServers });
  connection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate?.(event.candidate);
    }
  };
  connection.oniceconnectionstatechange = () => {
    if (connection.iceConnectionState === "failed" || connection.iceConnectionState === "disconnected") {
      onError("WebRTC connection failed.");
    }
  };
  return connection;
}

function wireHostChannel(
  peerId: string,
  channel: DataChannelLike,
  onPlayerIntent: (peerId: string, message: ClientCommand) => void,
  onError: (message: string) => void
) {
  channel.onmessage = (event) => {
    const message = parsePeerMessage<ClientCommand>(event.data, onError);
    if (message) {
      onPlayerIntent(peerId, message);
    }
  };
}

function wirePlayerChannel(
  channel: DataChannelLike,
  onEvent: (event: ServerEvent) => void,
  onError: (message: string) => void,
  onOpen: () => void
) {
  channel.onopen = onOpen;
  channel.onclose = () => {
    onError("Host is unavailable.");
  };
  channel.onmessage = (event) => {
    const message = parsePeerMessage<ServerEvent>(event.data, onError);
    if (message) {
      onEvent(message);
    }
  };
}

function sendChannelMessage(channel: DataChannelLike | null, message: ClientCommand | ServerEvent) {
  if (channel?.readyState === "open") {
    channel.send(JSON.stringify(message));
    return true;
  }
  return false;
}

function parsePeerMessage<T>(data: unknown, onError: (message: string) => void): T | null {
  try {
    return JSON.parse(String(data)) as T;
  } catch {
    onError("Invalid peer message.");
    return null;
  }
}

function sendIceCandidate(sendSignal: (message: SignalingClientMessage) => void, peerId: string, candidate: RTCIceCandidateInit) {
  if (!candidate.candidate) {
    return;
  }
  sendSignal({
    type: "signal-ice-candidate",
    peerId,
    candidate: {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }
  });
}
