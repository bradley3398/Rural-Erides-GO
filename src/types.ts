/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. HARDWARE & CLASSIFICATION
// ==========================================
export enum PEVType {
  SCOOTER = "Electric Scooter",
  BIKE = "Electric Bike",
  EUC = "Electric Unicycle (EUC)",
  SKATEBOARD = "Electric Skateboard",
  ETRIKE = "Electric Trike",
  EMOPED = "Electric Moped",
  CUSTOM = "Custom Build / Other",
}

// ==========================================
// 2. LIVE RADAR & TELEMETRY
// ==========================================
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RideMetrics {
  speed: number;
  topSpeed: number;
  distance: number; // in miles
  duration: number; // in seconds
  isTracking: boolean;
  pevType: PEVType;
  batteryEst: number; // percentage
  coordinates: Coordinates[];
}

export interface ActiveRider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  pevType: PEVType;
  battery: number;
  lastUpdated: number; // epoch timestamp
}

export interface SavedRide {
  id: string;
  date: string;
  duration: number;
  maxSpeed: number;
  avgSpeed: number;
  distance: number;
  pevType: PEVType;
  notes?: string;
}

// ==========================================
// 3. COMMUNITY FORUM & RIDER BOARD (UNIFIED)
// ==========================================
// Note: We use ForumPost and ForumReply as the master standard 
// to prevent data collisions across the app.

export interface ForumReply {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  timestamp_epoch?: number;
  isAI?: boolean;
}

export interface ForumPost {
  id: string;
  author: string;
  userBadge?: string; // Unified from BoardPost
  message: string;
  timestamp: string;
  timestamp_epoch?: number;
  pevType?: PEVType;
  likes: number;
  isLiked?: boolean;
  flagged?: boolean; // Unified from BoardPost
  reportsCount?: number; // Unified from BoardPost
  category?: "GENERAL" | "TROUBLESHOOT";
  imageUrl?: string;
  replies?: ForumReply[];
}

// ==========================================
// 4. GEMINI AI CO-PILOT GROUNDING
// ==========================================
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
}

export interface GroundedSearchResult {
  text: string;
  groundingMetadata?: GroundingMetadata;
}