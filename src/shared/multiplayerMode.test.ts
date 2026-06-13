import { describe, expect, it } from "vitest";
import { chooseMultiplayerMode } from "./multiplayerMode";

describe("multiplayer mode selection", () => {
  it("uses WebRTC only when explicitly enabled and browser APIs are available", () => {
    expect(chooseMultiplayerMode({ requestedMode: "webrtc", hasWebRtc: true, hasWebSocket: true })).toBe("webrtc");
    expect(chooseMultiplayerMode({ requestedMode: "webrtc", hasWebRtc: false, hasWebSocket: true })).toBe("websocket");
    expect(chooseMultiplayerMode({ requestedMode: "websocket", hasWebRtc: true, hasWebSocket: true })).toBe("websocket");
  });

  it("returns unavailable when neither transport can run", () => {
    expect(chooseMultiplayerMode({ requestedMode: "webrtc", hasWebRtc: false, hasWebSocket: false })).toBe("unavailable");
  });
});
