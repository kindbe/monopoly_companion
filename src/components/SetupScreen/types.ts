import type React from "react";
import type { BiddingMode } from "@/common/auctionTypes";

export type SetupScreenProps = {
  mode: BiddingMode;
  setMode: (mode: BiddingMode) => void;
  includeRailroads: boolean;
  setIncludeRailroads: (enabled: boolean) => void;
  includeUtilities: boolean;
  setIncludeUtilities: (enabled: boolean) => void;
  propertyCount: number;
  setPropertyCount: (count: number) => void;
  maxProperties: number;
  increment: number;
  setIncrement: (increment: number) => void;
  bidDeadline: number;
  setBidDeadline: (seconds: number) => void;
  playerNames: string[];
  updatePlayerName: (index: number, name: string) => void;
  addPlayer: () => void;
  removePlayer: (index: number) => void;
  startBidding: () => void;
  hostMultiplayer: () => void;
  joinMultiplayer: () => void;
  message: string;
};
