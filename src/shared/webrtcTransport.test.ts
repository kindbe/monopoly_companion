import { describe, expect, it, vi } from "vitest";
import { createWebRtcHostTransport, createWebRtcPlayerTransport, type PeerConnectionConstructor } from "./webrtcTransport";

describe("WebRTC multiplayer transports", () => {
  it("negotiates host and player data channels and sends game messages directly", async () => {
    const signalingMessages: unknown[] = [];
    const hostIntents: unknown[] = [];
    const playerEvents: unknown[] = [];
    const hostPeer = new FakePeerConnection();
    const playerPeer = new FakePeerConnection();
    const peers = [hostPeer, playerPeer];

    const host = createWebRtcHostTransport({
      joinCode: "TABLE1",
      RTCPeerConnectionCtor: fakePeerConnectionFactory(peers),
      sendSignal: (message) => signalingMessages.push({ from: "host", message }),
      onPlayerIntent: (peerId, message) => hostIntents.push({ peerId, message })
    });
    const player = createWebRtcPlayerTransport({
      joinCode: "TABLE1",
      playerName: "Joelle",
      RTCPeerConnectionCtor: fakePeerConnectionFactory(peers),
      sendSignal: (message) => signalingMessages.push({ from: "player", message }),
      onEvent: (event) => playerEvents.push(event)
    });

    player.sendJoin();
    host.connect();
    player.connect();
    await host.handleSignal({ type: "signaling-peer-joined", peerId: "player-peer", playerName: "Joelle" });
    await player.handleSignal({
      type: "signaling-offer",
      peerId: "host-peer",
      description: { type: "offer", sdp: "fake-offer" }
    });
    await host.handleSignal({
      type: "signaling-answer",
      peerId: "player-peer",
      description: { type: "answer", sdp: "fake-answer" }
    });
    linkPeers(hostPeer, playerPeer);

    player.raiseBid({ joinCode: "TABLE1", playerId: "player-2", increment: 10 });
    host.sendPlayerEvent("player-peer", {
      type: "joined",
      joinCode: "TABLE1",
      playerId: "player-2"
    });

    expect(signalingMessages).toEqual([
      { from: "host", message: { type: "register-host", joinCode: "TABLE1" } },
      { from: "player", message: { type: "join-signaling", joinCode: "TABLE1", playerName: "Joelle" } },
      {
        from: "host",
        message: { type: "signal-offer", peerId: "player-peer", description: { type: "offer", sdp: "fake-offer" } }
      },
      {
        from: "player",
        message: { type: "signal-answer", peerId: "host-peer", description: { type: "answer", sdp: "fake-answer" } }
      }
    ]);
    expect(hostIntents).toEqual([
      { peerId: "player-peer", message: { type: "join-session", joinCode: "TABLE1", name: "Joelle" } },
      { peerId: "player-peer", message: { type: "raise-bid", joinCode: "TABLE1", playerId: "player-2", increment: 10 } }
    ]);
    expect(playerEvents).toEqual([{ type: "joined", joinCode: "TABLE1", playerId: "player-2" }]);
  });

  it("reports malformed messages and failed ICE setup", async () => {
    const errors: string[] = [];
    const peer = new FakePeerConnection();
    const host = createWebRtcHostTransport({
      joinCode: "TABLE1",
      RTCPeerConnectionCtor: fakePeerConnectionFactory([peer]),
      sendSignal: vi.fn(),
      onPlayerIntent: vi.fn(),
      onError: (message) => errors.push(message)
    });

    await host.handleSignal({ type: "signaling-peer-joined", peerId: "player-peer", playerName: "Joelle" });
    peer.channel?.receive("{bad json");
    peer.failIce();

    expect(errors).toEqual(["Invalid peer message.", "WebRTC connection failed."]);
  });

  it("reports host unavailability when the player data channel closes", async () => {
    const errors: string[] = [];
    const playerPeer = new FakePeerConnection();
    const player = createWebRtcPlayerTransport({
      joinCode: "TABLE1",
      playerName: "Joelle",
      RTCPeerConnectionCtor: fakePeerConnectionFactory([playerPeer]),
      sendSignal: vi.fn(),
      onEvent: vi.fn(),
      onError: (message) => errors.push(message)
    });

    await player.handleSignal({
      type: "signaling-offer",
      peerId: "host-peer",
      description: { type: "offer", sdp: "fake-offer" }
    });
    const channel = new FakeDataChannel();
    playerPeer.ondatachannel?.({ channel });
    channel.close();

    expect(errors).toEqual(["Host is unavailable."]);
  });
});

function fakePeerConnectionFactory(peers: FakePeerConnection[]) {
  return class FakeCtor {
    constructor() {
      const peer = peers.shift();
      if (!peer) {
        throw new Error("No fake peer connection queued.");
      }
      return peer;
    }
  } as unknown as PeerConnectionConstructor;
}

function linkPeers(hostPeer: FakePeerConnection, playerPeer: FakePeerConnection) {
  const hostChannel = hostPeer.channel;
  if (!hostChannel) {
    throw new Error("Host channel missing.");
  }
  const playerChannel = new FakeDataChannel();
  hostChannel.peer = playerChannel;
  playerChannel.peer = hostChannel;
  playerPeer.ondatachannel?.({ channel: playerChannel });
  hostChannel.open();
  playerChannel.open();
}

class FakePeerConnection {
  channel: FakeDataChannel | null = null;
  ondatachannel: ((event: { channel: FakeDataChannel }) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  iceConnectionState = "new";

  createDataChannel() {
    this.channel = new FakeDataChannel();
    return this.channel;
  }

  async createOffer() {
    return { type: "offer" as const, sdp: "fake-offer" };
  }

  async createAnswer() {
    return { type: "answer" as const, sdp: "fake-answer" };
  }

  async setLocalDescription() {}

  async setRemoteDescription() {}

  async addIceCandidate() {}

  failIce() {
    this.iceConnectionState = "failed";
    this.oniceconnectionstatechange?.();
  }
}

class FakeDataChannel {
  peer: FakeDataChannel | null = null;
  readyState = "connecting";
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  send(message: string) {
    this.peer?.receive(message);
  }

  receive(message: string) {
    this.onmessage?.({ data: message });
  }

  open() {
    this.readyState = "open";
    this.onopen?.();
  }

  close() {
    this.readyState = "closed";
    this.onclose?.();
  }
}
