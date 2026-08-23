"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { ActiveRider, PEVType } from "../types";
import { 
  Users, MapPin, RefreshCw, Send, Trash2, 
  Settings, ShieldAlert, AlertTriangle, AlertOctagon, Search,
  Crosshair, X, Filter, CloudLightning,
  Palette, MousePointerClick, LocateFixed,
  Camera, Loader2, DownloadCloud, Megaphone,
  SunMoon, ThumbsUp, Radar, CloudSun, RadioReceiver, Volume2, VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { locationService } from "../services/LocationService";

// 🔥 PURE FIRESTORE INTEGRATION
import { db } from "../services/firebase";
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, addDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";

// 🔥 MODULAR COMPONENTS
import SetupIdentityPanel from "./Radar/SetupIdentityPanel";
import UniversalSettingsPanel from "./Radar/UniversalSettingsPanel";
import NetworkOpsPanel from "./Radar/NetworkOpsPanel";
import LivePilotsPanel from "./Radar/LivePilotsPanel";
import WalkieTalkieWidget from "./Radar/WalkieTalkieWidget";

const USER_ID = typeof window !== 'undefined' ? localStorage.getItem("radar_user_id") || `rider_${Math.random().toString(36).substr(2, 9)}` : "sys_pending";
if (typeof window !== 'undefined') localStorage.setItem("radar_user_id", USER_ID);

const DISALLOWED_KEYWORDS = ["abuse", "idiot", "jerk", "asshole", "bitch", "crap", "damn", "fuck", "shit", "bastard", "trash", "hate", "kill", "stupid", "moron", "spam", "scam"];

function checkContentSafety(text: string): { safe: boolean; blockedWord?: string } {
  const normalized = text.toLowerCase();
  for (const word of DISALLOWED_KEYWORDS) {
    if (normalized.includes(word)) return { safe: false, blockedWord: word };
  }
  return { safe: true };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number, useMetric: boolean): number {
  const R = useMetric ? 6371.0 : 3958.8; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const getTimeAgo = (timestamp: any) => {
  if (!timestamp) return "Just now";
  const timeMs = typeof timestamp === 'number' ? timestamp : (timestamp.toMillis ? timestamp.toMillis() : Date.now());
  const diff = Math.floor((Date.now() - timeMs) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const MAP_LAYERS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};

type ThemeColor = 'lime' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'void';

export default function RiderRadar(props: any) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  const initialLoadDone = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const userMarkerRef = useRef<L.Marker | null>(null);
  const rangeCircleRef = useRef<L.Circle | null>(null);
  const geoFenceCircleRef = useRef<L.Circle | null>(null);
  const customPinMarkerRef = useRef<L.Marker | null>(null);
  const otherMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const meetupMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const hazardMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const waypointMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const sosMarkersRef = useRef<{ [key: string]: L.Marker }>({}); 

  const [mounted, setMounted] = useState(false);
  const callsign = props.callsign || "";

  const [theme, setTheme] = useState<ThemeColor>(() => {
    if (props.theme) return props.theme;
    if (typeof window !== 'undefined') return (localStorage.getItem("rural_theme") as ThemeColor) || 'lime';
    return 'lime';
  });

  useEffect(() => { if (props.theme) setTheme(props.theme); }, [props.theme]);

  const [pevType, setPevType] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem("radar_pev_type") || "Electric Scooter" : "Electric Scooter");
  const [userStatus, setUserStatus] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem("radar_user_status") || "Cruising" : "Cruising");
  const [estRange, setEstRange] = useState<number>(() => typeof window !== 'undefined' ? parseInt(localStorage.getItem("radar_est_range") || "20") : 20);
  const [useMetric, setUseMetric] = useState<boolean>(() => typeof window !== 'undefined' ? localStorage.getItem("rt_use_metric") === "true" || localStorage.getItem("radar_use_metric") === "true" : false);

  useEffect(() => { if (props.useMetric !== undefined) setUseMetric(props.useMetric); }, [props.useMetric]);

  const [telemetryInterval, setTelemetryInterval] = useState<number>(() => typeof window !== 'undefined' ? parseInt(localStorage.getItem("radar_telemetry_interval") || "1000") : 1000);
  const [radarRadius, setRadarRadius] = useState<number>(() => typeof window !== 'undefined' ? parseInt(localStorage.getItem("radar_scan_radius") || "50") : 50);

  const [speedFilter, setSpeedFilter] = useState<string>("ALL"); 
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); 
  const [meshLatency, setMeshLatency] = useState<number>(24); 
  const [gpsPrecision, setGpsPrecision] = useState<string>("HIGH (HDOP 0.8)"); 
  const [rulerMode, setRulerMode] = useState<boolean>(false); 
  const [rulerPoints, setRulerPoints] = useState<[number, number][]>([]); 
  const [announcementModalOpen, setAnnouncementModalOpen] = useState<boolean>(false); 
  const [announcementText, setAnnouncementText] = useState<string>(""); 
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null); 
  const [compassBearingToTarget, setCompassBearingToTarget] = useState<number | null>(null); 
  
  const [nightVisionMode, setNightVisionMode] = useState<boolean>(false); 
  const [geoFenceRadius, setGeoFenceRadius] = useState<number>(5); 
  const [geoFenceCenter, setGeoFenceCenter] = useState<{lat: number, lng: number} | null>(null); 
  const [sunsetCountdown, setSunsetCountdown] = useState<string>("Resolving..."); 
  const [elevationHistory, setElevationHistory] = useState<number[]>([120, 135, 140, 155, 150, 165]); 

  const [activeChannel, setActiveChannel] = useState<string>("CH-1: GENERAL FLEET");
  const [squelchLevel, setSquelchLevel] = useState<number>(3);
  const [micBoost, setMicBoost] = useState<boolean>(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [performanceSaver, setPerformanceSaver] = useState<boolean>(false);
  const [proximityAlerts, setProximityAlerts] = useState<boolean>(true);
  const [meshNetworkActive, setMeshNetworkActive] = useState<boolean>(true);

  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(false);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(() => typeof window !== 'undefined' ? localStorage.getItem("radar_ghost_mode") === "true" || localStorage.getItem("rt_privacy_mode") === "true" : false);
  
  const [userLat, setUserLat] = useState<number>(() => locationService.getCurrentUpdate()?.lat || 0);
  const [userLng, setUserLng] = useState<number>(() => locationService.getCurrentUpdate()?.lng || 0);
  const [speed, setSpeed] = useState<number>(0);

  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_LAYERS>("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [customPin, setCustomPin] = useState<{lat: number, lng: number, name: string} | null>(null);
  
  const [showRiders, setShowRiders] = useState(true);
  const [showMeetups, setShowMeetups] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showWaypoints, setShowWaypoints] = useState(true);

  const [riders, setRiders] = useState<ActiveRider[]>([]);
  const [meetups, setMeetups] = useState<any[]>([]);
  const [pings, setPings] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [waypoints, setWaypoints] = useState<any[]>([]);
  
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [isNetworkOffline, setIsNetworkOffline] = useState<boolean>(false);
  const [proximityWarning, setProximityWarning] = useState<string | null>(null);

  const [pingMessage, setPingMessage] = useState<string>("");
  const [pingImage, setPingImage] = useState<string | null>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [prevPingId, setPrevPingId] = useState<string | null>(null);

  const [meetupDesc, setMeetupDesc] = useState<string>("");
  const [isSettingMeetup, setIsSettingMeetup] = useState<boolean>(false);
  const [hazardType, setHazardType] = useState<string>("🕳️ Pothole / Washout");
  const [isSettingHazard, setIsSettingHazard] = useState<boolean>(false);
  const [waypointTitle, setWaypointTitle] = useState<string>("");
  const [waypointCategory, setWaypointCategory] = useState<string>("⚡ Charging Station");
  const [isSettingWaypoint, setIsSettingWaypoint] = useState<boolean>(false);

  const [profileSaved, setProfileSaved] = useState<boolean>(false);
  const hasCenteredRef = useRef<boolean>(false);
  const [timeTicker, setTimeTicker] = useState(Date.now()); 

  const isGlobalNightVision = typeof window !== 'undefined' ? localStorage.getItem("rt_night_vision") === "true" || nightVisionMode : false;
  const isDayMode = typeof window !== 'undefined' ? localStorage.getItem("rt_day_mode") === "true" : false;

  const getTheme = () => {
    if (isGlobalNightVision) return { text: 'text-amber-500', bg: 'bg-amber-600', border: 'border-amber-900', shadow: 'shadow-[0_0_20px_rgba(217,119,6,0.3)]', dim: 'bg-amber-950/30 text-amber-400 border-amber-900/40', hex: '#d97706', hover: 'hover:text-amber-300' };
    const baseTheme = theme;
    const themes: any = {
      rural: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', dim: 'bg-white/5 text-[#39ff14] border-white/10', hex: '#39ff14', hover: 'hover:text-white' },
      lime: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', dim: 'bg-white/5 text-[#39ff14] border-white/10', hex: '#39ff14', hover: 'hover:text-white' },
      cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', dim: 'bg-white/5 text-cyan-400 border-white/10', hex: '#06b6d4', hover: 'hover:text-white' },
      emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', dim: 'bg-white/5 text-emerald-400 border-white/10', hex: '#10b981', hover: 'hover:text-white' },
      amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', dim: 'bg-white/5 text-amber-400 border-white/10', hex: '#f59e0b', hover: 'hover:text-white' },
      rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', dim: 'bg-white/5 text-rose-400 border-white/10', hex: '#f43f5e', hover: 'hover:text-white' },
      purple: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500', shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', dim: 'bg-white/5 text-purple-400 border-white/10', hex: '#a855f7', hover: 'hover:text-white' },
      void: { text: 'text-white', bg: 'bg-zinc-800', border: 'border-zinc-500', shadow: 'shadow-[0_0_20px_rgba(255,255,255,0.1)]', dim: 'bg-zinc-900/50 text-white border-zinc-700/50', hex: '#ffffff', hover: 'hover:text-white' }
    };
    return themes[baseTheme] || themes.rural;
  };
  const t = getTheme();

  const bgBase = isDayMode ? "bg-zinc-200" : (isGlobalNightVision ? "bg-[#150a00]" : "bg-transparent");
  const bgPanel = isDayMode ? "bg-white border-zinc-300 shadow-md" : (isGlobalNightVision ? "bg-[#2a1200]/90 border-amber-900" : "bg-black/40 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]");
  const bgCard = isDayMode ? "bg-zinc-50 border-zinc-200" : "bg-white/5 border-white/10 shadow-inner backdrop-blur-md hover:bg-white/10";
  const bgInput = isDayMode ? "bg-white border-zinc-300 text-zinc-900" : "bg-black/50 border-white/10 text-white focus:border-white/30 backdrop-blur-md shadow-inner";
  const bgList = isDayMode ? "bg-zinc-100 border-zinc-300" : "bg-white/5 border-white/10";
  const txtMain = isDayMode ? "text-zinc-900" : "text-white";
  const txtMuted = isDayMode ? "text-zinc-500" : "text-zinc-400";
  const brd = isDayMode ? "border-zinc-300" : "border-white/10";

  useEffect(() => { setMounted(true); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  
  useEffect(() => {
    const handleThemeSync = () => {
      const savedTheme = (localStorage.getItem("rural_theme") || localStorage.getItem("rt_theme") || 'lime') as ThemeColor;
      setTheme(savedTheme);
    };
    window.addEventListener('theme-sync', handleThemeSync);
    window.addEventListener('storage', handleThemeSync);
    return () => { window.removeEventListener('theme-sync', handleThemeSync); window.removeEventListener('storage', handleThemeSync); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTimeTicker(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateEphemeris = () => {
      const now = new Date(); const sunset = new Date(); sunset.setHours(20, 15, 0); 
      const diffMs = sunset.getTime() - now.getTime();
      if (diffMs > 0) {
        const hrs = Math.floor(diffMs / 3600000); const mins = Math.floor((diffMs % 3600000) / 60000);
        setSunsetCountdown(`${hrs}h ${mins}m to Dusk`);
      } else { setSunsetCountdown("Night Operations Active"); }
    };
    updateEphemeris();
    const interval = setInterval(updateEphemeris, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpvoteHazard = (hazardId: string) => {
    updateDoc(doc(db, "radar_hazards", hazardId), { upvotes: increment(1) }).catch(() => { setSafetyWarning("Could not record upvote while offline."); });
  };

  useEffect(() => {
    if (!mounted) return;
    try {
      const cRiders = localStorage.getItem("radar_cache_riders"); if (cRiders) setRiders(JSON.parse(cRiders));
      const cMeetups = localStorage.getItem("radar_cache_meetups"); if (cMeetups) setMeetups(JSON.parse(cMeetups));
      const cHazards = localStorage.getItem("radar_cache_hazards"); if (cHazards) setHazards(JSON.parse(cHazards));
      const cWaypoints = localStorage.getItem("radar_cache_waypoints"); if (cWaypoints) setWaypoints(JSON.parse(cWaypoints));
      const cPings = localStorage.getItem("radar_cache_pings"); if (cPings) setPings(JSON.parse(cPings));
    } catch(e) {}

    const unsubRiders = onSnapshot(collection(db, "radar_riders"), (snapshot) => {
      setIsNetworkOffline(false); setMeshNetworkActive(true); setMeshLatency(Math.floor(Math.random() * 15) + 12);
      const activeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(r => (Date.now() - (r.lastUpdated || 0)) < 1000 * 60 * 30); 
      setRiders(activeData); localStorage.setItem("radar_cache_riders", JSON.stringify(activeData));
    }, () => { setIsNetworkOffline(true); setMeshNetworkActive(false); setMeshLatency(999); });

    const unsubMeetups = onSnapshot(collection(db, "radar_meetups"), (snapshot) => { const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setMeetups(data); localStorage.setItem("radar_cache_meetups", JSON.stringify(data)); }, () => {});
    const unsubHazards = onSnapshot(collection(db, "radar_hazards"), (snapshot) => { const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setHazards(data); localStorage.setItem("radar_cache_hazards", JSON.stringify(data)); }, () => {});
    const unsubWaypoints = onSnapshot(collection(db, "radar_waypoints"), (snapshot) => { const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setWaypoints(data); localStorage.setItem("radar_cache_waypoints", JSON.stringify(data)); }, () => {});
    const qPings = query(collection(db, "radar_pings"), orderBy("timestamp", "desc"));
    const unsubPings = onSnapshot(qPings, (snapshot) => { const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setPings(data); localStorage.setItem("radar_cache_pings", JSON.stringify(data)); }, () => {});

    return () => { unsubRiders(); unsubMeetups(); unsubHazards(); unsubWaypoints(); unsubPings(); };
  }, [mounted]);

  useEffect(() => {
    if (!customPin || userLat === 0 || userLng === 0) { setCompassBearingToTarget(null); return; }
    const dLon = (customPin.lng - userLng) * (Math.PI / 180);
    const lat1 = userLat * (Math.PI / 180); const lat2 = customPin.lat * (Math.PI / 180);
    const y = Math.sin(dLon) * Math.cos(lat2); const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * (180 / Math.PI); brng = (brng + 360) % 360;
    setCompassBearingToTarget(Math.round(brng));
  }, [customPin, userLat, userLng]);

  useEffect(() => {
    if (userLat === 0 || userLng === 0) return;
    if (!geoFenceCenter) { setGeoFenceCenter({ lat: userLat, lng: userLng }); } else {
      const distFromHome = calculateDistance(geoFenceCenter.lat, geoFenceCenter.lng, userLat, userLng, useMetric);
      if (distFromHome > geoFenceRadius) { setProximityWarning(`🚨 GEO-FENCE ALARM: You have wandered ${distFromHome.toFixed(1)} ${useMetric ? 'km' : 'mi'} from base!`); }
    }
    if (!proximityAlerts) return;

    let closest: { name: string; dist: number } | null = null;
    riders.forEach(r => {
      if (r.id !== USER_ID && r.lat !== 0) {
        const d = calculateDistance(userLat, userLng, r.lat, r.lng, useMetric);
        if (d <= 0.25 && (!closest || d < closest.dist)) { closest = { name: r.name, dist: d }; }
      }
    });

    hazards.forEach(h => {
      if (h.lat !== 0) {
        const d = calculateDistance(userLat, userLng, h.lat, h.lng, useMetric);
        if (d <= 0.20 && (!closest || d < closest.dist)) { closest = { name: `⚠️ ${h.type}`, dist: d }; }
      }
    });

    if (closest) {
      const unitStr = useMetric ? `${(closest.dist * 1.60934 * 1000).toFixed(0)}m` : `${(closest.dist * 5280).toFixed(0)}ft`;
      setProximityWarning(`PROXIMITY ALERT: ${closest.name} is only ${unitStr} away!`);
    } else if (calculateDistance(geoFenceCenter?.lat || userLat, geoFenceCenter?.lng || userLng, userLat, userLng, useMetric) <= geoFenceRadius) {
      setProximityWarning(null);
    }
  }, [userLat, userLng, riders, hazards, proximityAlerts, useMetric, geoFenceCenter, geoFenceRadius]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      pings.forEach((item: any) => {
        if (item.audioData && item.timestamp) {
          const timeMs = typeof item.timestamp === 'number' ? item.timestamp : (item.timestamp?.toMillis ? item.timestamp.toMillis() : now);
          if (now - timeMs > 60 * 1000) { deleteDoc(doc(db, "radar_pings", item.id)).catch(() => {}); }
        }
      });
    }, 5000);
    return () => clearInterval(cleanupInterval);
  }, [pings]);

  const playSquelchSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
  };

  useEffect(() => {
    if (pings.length > 0 && autoPlayAudio) {
      const latest = pings[0];
      if (latest.id !== prevPingId) {
        setPrevPingId(latest.id);
        if (latest.audioData && latest.sender !== callsign) {
          playSquelchSound();
          const audio = new Audio(latest.audioData);
          audio.play().catch(e => console.warn("Browser auto-play restriction blocked audio:", e));
        }
      }
    }
  }, [pings, autoPlayAudio, callsign, prevPingId]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let lastPostTime = 0;

    if (isSharingLocation) {
      if (!navigator.geolocation) { alert("GPS is not supported by your browser."); setIsSharingLocation(false); return; }
      if (!locationService.isTracking) locationService.start(pevType as PEVType);

      const handleUpdate = (update: any) => {
        setUserLat(update.lat); setUserLng(update.lng); setSpeed(update.speed);
        if (update.altitude) { setElevationHistory(prev => [...prev.slice(-7), Math.round(update.altitude * 3.28084)]); }

        const now = Date.now();
        const activeInterval = performanceSaver ? Math.max(telemetryInterval, 4000) : telemetryInterval;
        if (!isGhostMode && (now - lastPostTime >= activeInterval)) {
          sendTelemetryUpdate(update.lat, update.lng, update.speed); lastPostTime = now;
        }
      };

      locationService.addListener(handleUpdate);
      unsubscribe = () => locationService.removeListener(handleUpdate);
    } else {
      if (locationService.isTracking) locationService.stop();
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [isSharingLocation, callsign, pevType, userStatus, isGhostMode, telemetryInterval, performanceSaver]);

  const sendTelemetryUpdate = (lat: number, lng: number, currentSpeed: number, overrideGhost?: boolean, overrideSharing?: boolean) => {
    const ghost = overrideGhost !== undefined ? overrideGhost : isGhostMode;
    const sharing = overrideSharing !== undefined ? overrideSharing : isSharingLocation;
    if (ghost || !sharing) return;
    const activeBattPct = parseInt(localStorage.getItem("rural_pev_capacity") || "88");
    const activeVoltage = parseFloat(localStorage.getItem("rural_pev_voltage") || "52.4");

    setDoc(doc(db, "radar_riders", USER_ID), {
      name: callsign || "Unknown Pilot", lat, lng, speed: currentSpeed, pevType, status: userStatus, lastUpdated: Date.now(), batteryPct: activeBattPct, voltage: activeVoltage
    }).catch(() => { setIsNetworkOffline(true); });
  };

  const removeSelfFromRadar = () => { deleteDoc(doc(db, "radar_riders", USER_ID)).catch(() => {}); };

  const toggleBroadcast = () => {
    const newState = !isSharingLocation;
    setIsSharingLocation(newState);
    if (!newState) { if (locationService.isTracking) locationService.stop(); removeSelfFromRadar(); 
    } else {
      if (!locationService.isTracking) locationService.start(pevType as PEVType);
      if (userLat !== 0 && !isGhostMode) sendTelemetryUpdate(userLat, userLng, speed, isGhostMode, newState);
    }
  };

  const handleGhostModeToggle = (val: boolean) => {
    setIsGhostMode(val); localStorage.setItem("radar_ghost_mode", val ? "true" : "false"); localStorage.setItem("rt_privacy_mode", val ? "true" : "false");
    if (val) removeSelfFromRadar(); else if (isSharingLocation && userLat !== 0) sendTelemetryUpdate(userLat, userLng, speed, val, isSharingLocation);
  };

  const saveRadarConfig = () => {
    localStorage.setItem("radar_pev_type", pevType); localStorage.setItem("radar_user_status", userStatus); localStorage.setItem("radar_est_range", estRange.toString());
    localStorage.setItem("radar_use_metric", useMetric ? "true" : "false"); localStorage.setItem("rt_use_metric", useMetric ? "true" : "false");
    localStorage.setItem("radar_telemetry_interval", telemetryInterval.toString()); localStorage.setItem("radar_scan_radius", radarRadius.toString()); localStorage.setItem("radar_autoplay_audio", autoPlayAudio ? "true" : "false");
    setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000);
    if (isSharingLocation) { if (isGhostMode) removeSelfFromRadar(); else sendTelemetryUpdate(userLat, userLng, speed); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingImg(true); const file = e.target.files[0]; const formData = new FormData(); formData.append("image", file);
      const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY; 
      try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) setPingImage(data.data.url);
      } catch (err) { alert("Image upload failed. Try again."); } 
      finally { setIsUploadingImg(false); }
    }
  };

  const startRecording = async () => {
    try {
      playSquelchSound();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: micBoost ? 32000 : 16000 } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder; audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        playSquelchSound();
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader(); reader.readAsDataURL(audioBlob);
        reader.onloadend = () => { handleSendWalkieTransmission(reader.result as string); };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start(); setIsRecording(true);
    } catch (err) { alert("Microphone access denied. Check browser permissions."); }
  };

  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); } };

  const handleSendWalkieTransmission = (audioBase64: string) => {
    const safeLat = userLat !== 0 ? userLat : 35.2757; const safeLng = userLng !== 0 ? userLng : -95.1244; setSafetyWarning(null);
    addDoc(collection(db, "radar_pings"), { sender: callsign || "Pilot", pevType, message: `🎙️ [${activeChannel}] Voice Transmission`, audioData: audioBase64, channel: activeChannel, lat: safeLat, lng: safeLng, type: "walkie", timestamp: serverTimestamp() }).catch(() => setSafetyWarning("Offline Protocol: Voice transmission queued."));
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault(); if (!searchQuery.trim()) return; setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat); const lng = parseFloat(data[0].lon);
        setCustomPin({ lat, lng, name: data[0].display_name.split(',')[0] }); mapRef.current?.setView([lat, lng], 15, { animate: true }); setSearchQuery("");
      } else { alert("Satellite could not lock onto that location."); }
    } catch (err) { alert("Error querying routing satellite."); } finally { setIsSearching(false); }
  };

  const handleTargetCrosshair = async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    setCustomPin({ lat: center.lat, lng: center.lng, name: "Resolving Target..." });
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}`);
        const data = await res.json();
        setCustomPin({ lat: center.lat, lng: center.lng, name: data.display_name?.split(',')[0] || "Custom Target" });
    } catch { setCustomPin({ lat: center.lat, lng: center.lng, name: `Target (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})` }); }
  };

  const handleProposeMeetup = () => {
    const targetLat = customPin ? customPin.lat : userLat; const targetLng = customPin ? customPin.lng : userLng;
    if (!meetupDesc.trim() || targetLat === 0) return;
    const descSafety = checkContentSafety(meetupDesc);
    if (!descSafety.safe) { setSafetyWarning("Meetup description flagged for restricted terms."); return; }
    const description = meetupDesc; setMeetupDesc(""); setIsSettingMeetup(false); setCustomPin(null); setSafetyWarning(null);
    addDoc(collection(db, "radar_meetups"), { lat: targetLat, lng: targetLng, description: `🚴‍♂️ [GHOST GROUP RIDE] ${description}`, setBy: callsign || "Pilot", timestamp: serverTimestamp() }).catch(() => setSafetyWarning("Offline Protocol: Group ride event will broadcast when connection is restored."));
  };

  const handleDropHazard = () => {
    const targetLat = customPin ? customPin.lat : userLat; const targetLng = customPin ? customPin.lng : userLng;
    if (targetLat === 0) return;
    const type = hazardType; setIsSettingHazard(false); setCustomPin(null); setSafetyWarning(null);
    addDoc(collection(db, "radar_hazards"), { reporter: callsign || "Pilot", type, lat: targetLat, lng: targetLng, timestamp: serverTimestamp() })
      .catch(() => setSafetyWarning("Offline Protocol: Hazard will broadcast when connection is restored."));
  };

  const handleDropWaypoint = () => {
    const targetLat = customPin ? customPin.lat : userLat; const targetLng = customPin ? customPin.lng : userLng;
    if (targetLat === 0) return;
    const title = waypointTitle.trim() || "Trail Waypoint"; const category = waypointCategory;
    setWaypointTitle(""); setIsSettingWaypoint(false); setCustomPin(null); setSafetyWarning(null);
    addDoc(collection(db, "radar_waypoints"), { creator: callsign || "Pilot", title, category, lat: targetLat, lng: targetLng, timestamp: serverTimestamp() }).catch(() => setSafetyWarning("Offline Protocol: Waypoint will broadcast when connection is restored."));
  };

  const handleSendPing = (overrideMessage?: string) => {
    const msgToSent = overrideMessage || pingMessage;
    if (!msgToSent.trim() && !pingImage) return;
    const pingSafety = checkContentSafety(msgToSent);
    if (!pingSafety.safe) { alert("Message blocked: Contains restricted words."); return; }
    const safeLat = userLat !== 0 ? userLat : 35.2757; const safeLng = userLng !== 0 ? userLng : -95.1244;
    const imgCache = pingImage;
    setPingMessage(""); setPingImage(null); setSafetyWarning(null);
    addDoc(collection(db, "radar_pings"), { sender: callsign || "Pilot", pevType, message: msgToSent, imageUrl: imgCache || null, audioData: null, lat: safeLat, lng: safeLng, type: "standard", timestamp: serverTimestamp() }).catch(() => setSafetyWarning("Offline Protocol: Message will transmit when cellular connection is restored."));
  };

  const handleAssembleHere = () => {
    if (window.confirm("Broadcast emergency muster beacon (Assemble Here) to all connected riders?")) {
      const safeLat = userLat !== 0 ? userLat : 35.2757; const safeLng = userLng !== 0 ? userLng : -95.1244; setSafetyWarning(null);
      addDoc(collection(db, "radar_pings"), { sender: callsign || "Pilot", message: `⛺ FLEET MUSTER: ASSEMBLE HERE! Rally point set by ${callsign || "Pilot"}.`, lat: safeLat, lng: safeLng, type: "standard", timestamp: serverTimestamp() }).catch(() => setSafetyWarning("Offline Protocol: Muster beacon queued."));
    }
  };

  const handleSendSOS = () => {
    if (window.confirm("Broadcast SOS emergency beacon to all nearby riders?")) {
      const safeLat = userLat !== 0 ? userLat : 35.2757; const safeLng = userLng !== 0 ? userLng : -95.1244; setSafetyWarning(null);
      addDoc(collection(db, "radar_pings"), { sender: callsign || "Pilot", message: "🚨 S.O.S. EMERGENCY! ASSISTANCE REQUIRED!", lat: safeLat, lng: safeLng, type: "sos", timestamp: serverTimestamp() }).catch(() => setSafetyWarning("Offline Protocol: SOS queued."));
    }
  };

  const handleGlobalDelete = (item: any) => {
    if (!window.confirm("Delete this from the global network for everyone?")) return;
    try {
      if (item.description) { deleteDoc(doc(db, "radar_meetups", item.id)); } 
      else if (item.reporter) { deleteDoc(doc(db, "radar_hazards", item.id)); } 
      else if (item.category && item.title) { deleteDoc(doc(db, "radar_waypoints", item.id)); }
      else { deleteDoc(doc(db, "radar_pings", item.id)); }
    } catch { setSafetyWarning("Cannot delete while operating offline."); }
  };

  const exportTelemetryJson = () => {
    const exportData = { exportedAt: new Date().toISOString(), waypoints, hazards, meetups };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a'); downloadAnchor.setAttribute("href", dataStr); downloadAnchor.setAttribute("download", `radar_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor); downloadAnchor.click(); downloadAnchor.remove(); alert("Waypoint and hazard telemetry exported successfully.");
  };

  // --- Map Engine Initialization ---
  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [userLat !== 0 ? userLat : 35.2757, userLng !== 0 ? userLng : -95.1244], zoom: 13, zoomControl: false, attributionControl: false, });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (rulerMode) { setRulerPoints(prev => [...prev, [lat, lng]]); return; }
      setCustomPin({ lat, lng, name: "Scanning Grid..." });
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => { setCustomPin({ lat, lng, name: data.display_name?.split(',')[0] || `Grid (${lat.toFixed(4)}, ${lng.toFixed(4)})` }); })
        .catch(() => { setCustomPin({ lat, lng, name: `Target (${lat.toFixed(4)}, ${lng.toFixed(4)})` }); });
    });

    const layer = L.tileLayer(MAP_LAYERS[mapStyle], { maxZoom: 20 }).addTo(map); tileLayerRef.current = layer;
    L.control.zoom({ position: "bottomright" }).addTo(map); mapRef.current = map;
    setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 300);
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [mounted, rulerMode]);

  useEffect(() => { if (tileLayerRef.current) tileLayerRef.current.setUrl(MAP_LAYERS[mapStyle]); }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (userLat !== 0 && userLng !== 0 && !hasCenteredRef.current) { mapRef.current.setView([userLat, userLng], 14); hasCenteredRef.current = true; }
  }, [userLat, userLng]);

  const recenterMap = () => { if (userLat !== 0 && userLng !== 0 && mapRef.current) { mapRef.current.setView([userLat, userLng], 15, { animate: true }); } };

  // --- Rendering Live Network Map Elements ---
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (customPin) {
      const targetIcon = L.divIcon({
        className: "radar-target-marker",
        html: `<div class="relative flex items-center justify-center"><span class="absolute inline-flex h-14 w-14 rounded-full border border-white/50 animate-ping"></span><span class="relative inline-flex rounded-full h-5 w-5 bg-white border-2 border-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.8)]"></span><div class="absolute -top-7 whitespace-nowrap bg-zinc-900/95 text-[9px] font-bold text-white px-2 py-1 rounded border border-zinc-700 shadow-xl">🎯 ${customPin.name} ${compassBearingToTarget !== null ? `(${compassBearingToTarget}°)` : ''}</div></div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      });
      if (customPinMarkerRef.current) { customPinMarkerRef.current.setLatLng([customPin.lat, customPin.lng]).setIcon(targetIcon); } 
      else { customPinMarkerRef.current = L.marker([customPin.lat, customPin.lng], { icon: targetIcon, zIndexOffset: 1000 }).addTo(map); }
    } else if (customPinMarkerRef.current) {
      customPinMarkerRef.current.remove(); customPinMarkerRef.current = null;
    }

    if (userLat !== 0 && userLng !== 0) {
      const isOffline = !isSharingLocation || isGhostMode;
      const userIcon = L.divIcon({
        className: "radar-user-marker",
        html: `<div class="relative flex items-center justify-center">${!isOffline ? `<span class="absolute inline-flex h-8 w-8 rounded-full ${t.bg} opacity-30 animate-ping"></span>` : ''}<span class="relative inline-flex rounded-full h-4.5 w-4.5 ${isOffline ? 'bg-zinc-500 border-zinc-700' : `${t.bg} border-zinc-950`} flex items-center justify-center shadow-lg"></span>${isOffline ? `<div class="absolute -top-6 whitespace-nowrap bg-zinc-900/90 text-[9px] font-bold text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 shadow">OFFLINE / GHOST</div>` : ''}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      });
      
      if (userMarkerRef.current) { userMarkerRef.current.setLatLng([userLat, userLng]).setIcon(userIcon); } 
      else { userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 900 }).addTo(map).bindPopup(`<strong class="text-zinc-900">You (${callsign || "Pilot"})</strong>`); }

      const multiplier = useMetric ? 1000 : 1609.34;
      if (estRange > 0 && !isGhostMode) {
        if (rangeCircleRef.current) {
          rangeCircleRef.current.setLatLng([userLat, userLng]); rangeCircleRef.current.setRadius(estRange * multiplier); rangeCircleRef.current.setStyle({ color: t.hex, fillColor: t.hex });
        } else {
          rangeCircleRef.current = L.circle([userLat, userLng], { radius: estRange * multiplier, color: t.hex, fillColor: t.hex, fillOpacity: 0.05, weight: 1, dashArray: '4', interactive: false }).addTo(map);
        }
      } else if (rangeCircleRef.current) { rangeCircleRef.current.remove(); rangeCircleRef.current = null; }
    }

    const activeIds = riders.map((r) => r.id);
    Object.keys(otherMarkersRef.current).forEach((id) => {
      if (!showRiders || (!activeIds.includes(id) && id !== USER_ID)) { otherMarkersRef.current[id].remove(); delete otherMarkersRef.current[id]; }
    });

    if (showRiders) {
      riders.forEach((rider) => {
        if (rider.id === USER_ID || (rider.lat === 0 && rider.lng === 0)) return;
        const dist = calculateDistance(userLat, userLng, rider.lat, rider.lng, useMetric);
        if (dist > radarRadius) return; 
        
        let colorClass = "bg-sky-400"; let pingClass = "bg-sky-500/30";
        if (rider.pevType.includes("Bike")) { colorClass = "bg-emerald-400"; pingClass = "bg-emerald-500/30"; } 
        else if (rider.pevType.includes("EUC")) { colorClass = "bg-purple-400"; pingClass = "bg-purple-500/30"; }
        else if (rider.pevType.includes("Trike")) { colorClass = "bg-rose-400"; pingClass = "bg-rose-500/30"; }

        const isLive = (Date.now() - (rider.lastUpdated || Date.now())) < 60000 * 5; 
        const speedDisplay = useMetric ? `${(rider.speed * 1.60934).toFixed(0)} KM/H` : `${(rider.speed || 0).toFixed(0)} MPH`;

        const riderIcon = L.divIcon({
          className: "custom-rider-marker",
          html: `<div class="relative flex items-center justify-center transition-transform duration-500 ease-linear">${isLive ? `<span class="absolute inline-flex h-8 w-8 rounded-full ${pingClass} animate-pulse"></span>` : ''}<span class="relative inline-flex rounded-full h-4 w-4 ${colorClass} ${!isLive ? 'opacity-50' : ''} border-2 border-zinc-950 shadow-md"></span><div class="absolute -top-6 whitespace-nowrap bg-[#0d0e15]/90 text-[9px] font-bold ${isLive ? 'text-white' : 'text-zinc-500'} px-2 py-0.5 rounded border border-zinc-700 shadow">${rider.name}</div></div>`,
          iconSize: [30, 30], iconAnchor: [15, 15],
        });

        const popupContent = `<div class="text-zinc-900 p-1 font-sans"><h4 class="font-bold text-xs">${rider.name}</h4><p class="text-[10px] text-zinc-600 mt-0.5">${rider.pevType}</p><div class="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-zinc-100 font-mono text-[9px] text-zinc-500"><span>📡 ${rider.status}</span><span>•</span><span>💨 ${speedDisplay}</span></div><p class="text-[8px] text-zinc-400 mt-1">${getTimeAgo(rider.lastUpdated || Date.now())}</p></div>`;

        if (otherMarkersRef.current[rider.id]) { otherMarkersRef.current[rider.id].setLatLng([rider.lat, rider.lng]).setIcon(riderIcon).setPopupContent(popupContent);
        } else { otherMarkersRef.current[rider.id] = L.marker([rider.lat, rider.lng], { icon: riderIcon, zIndexOffset: 500 }).addTo(map).bindPopup(popupContent); }
      });
    }

    const activeMeetupIds = meetups.map(m => m.id);
    Object.keys(meetupMarkersRef.current).forEach((id) => {
      if (!showMeetups || !activeMeetupIds.includes(id)) { meetupMarkersRef.current[id].remove(); delete meetupMarkersRef.current[id]; }
    });

    if (showMeetups) {
       meetups.forEach((meetup) => {
         const dist = calculateDistance(userLat, userLng, meetup.lat, meetup.lng, useMetric);
         if (dist > radarRadius) return;
         const meetupIcon = L.divIcon({ className: "radar-meetup", html: `<div class="relative flex items-center justify-center"><span class="absolute inline-flex h-9 w-9 rounded-full bg-blue-500/40 animate-ping"></span><span class="relative inline-flex rounded-xl h-6.5 w-6.5 bg-blue-500 border-2 border-zinc-950 items-center justify-center shadow-lg shadow-blue-500/50">🚴</span></div>`, iconSize: [36, 36], iconAnchor: [18, 18], });
         const pop = `<div class="text-zinc-900 font-bold text-xs">Group Ride: ${meetup.description}</div>`;
         if (meetupMarkersRef.current[meetup.id]) { meetupMarkersRef.current[meetup.id].setLatLng([meetup.lat, meetup.lng]).setIcon(meetupIcon).setPopupContent(pop);
         } else { meetupMarkersRef.current[meetup.id] = L.marker([meetup.lat, meetup.lng], { icon: meetupIcon, zIndexOffset: 800 }).addTo(map).bindPopup(pop); }
       });
    }

    const activeHazardIds = hazards.map((h) => h.id);
    Object.keys(hazardMarkersRef.current).forEach((id) => {
      if (!showHazards || !activeHazardIds.includes(id)) { hazardMarkersRef.current[id].remove(); delete hazardMarkersRef.current[id]; }
    });

    if (showHazards) {
      hazards.forEach((hazard) => {
        const dist = calculateDistance(userLat, userLng, hazard.lat, hazard.lng, useMetric);
        if (dist > radarRadius) return;
        const emoji = hazard.type.split(" ")[0] || "⚠️";
        const hazIcon = L.divIcon({ className: "radar-hazard-marker", html: `<div class="relative flex items-center justify-center"><span class="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 border border-zinc-950 flex items-center justify-center text-[10px] shadow-lg">${emoji}</span></div>`, iconSize: [24, 24], iconAnchor: [12, 12], });
        const popup = `<div class="text-zinc-900 p-1 font-sans"><span class="text-[9px] font-bold text-yellow-600 uppercase flex items-center gap-1">⚠️ TRAIL HAZARD</span><p class="text-xs font-semibold text-zinc-800 mt-0.5">${hazard.type}</p><span class="text-[9px] text-zinc-400 block mt-1 pt-1 border-t border-zinc-100">Reported by: ${hazard.reporter} • ${getTimeAgo(hazard.timestamp)}</span></div>`;
        if (hazardMarkersRef.current[hazard.id]) { hazardMarkersRef.current[hazard.id].setIcon(hazIcon).setPopupContent(popup);
        } else { hazardMarkersRef.current[hazard.id] = L.marker([hazard.lat, hazard.lng], { icon: hazIcon, zIndexOffset: 700 }).addTo(map).bindPopup(popup); }
      });
    }

    const activeWaypointIds = waypoints.map(w => w.id);
    Object.keys(waypointMarkersRef.current).forEach((id) => {
      if (!showWaypoints || !activeWaypointIds.includes(id)) { waypointMarkersRef.current[id].remove(); delete waypointMarkersRef.current[id]; }
    });

    if (showWaypoints) {
      waypoints.forEach((wp) => {
        const dist = calculateDistance(userLat, userLng, wp.lat, wp.lng, useMetric);
        if (dist > radarRadius) return;
        const wpIcon = L.divIcon({ className: "radar-waypoint-marker", html: `<div class="relative flex items-center justify-center"><span class="absolute inline-flex h-7 w-7 rounded-full bg-cyan-500/30 animate-pulse"></span><span class="relative inline-flex rounded-xl h-6 w-6 bg-cyan-600 border-2 border-zinc-950 flex items-center justify-center text-[11px] shadow-lg">⚡</span></div>`, iconSize: [30, 30], iconAnchor: [15, 15], });
        const popup = `<div class="text-zinc-900 p-1 font-sans"><span class="text-[9px] font-bold text-cyan-600 uppercase flex items-center gap-1">${wp.category || "📌 Waypoint"}</span><p class="text-xs font-bold text-zinc-900 mt-0.5">${wp.title}</p><span class="text-[8px] text-zinc-500 block mt-1 pt-1 border-t border-zinc-200">Pinned by: ${wp.creator} • ${getTimeAgo(wp.timestamp)}</span></div>`;
        if (waypointMarkersRef.current[wp.id]) { waypointMarkersRef.current[wp.id].setIcon(wpIcon).setPopupContent(popup);
        } else { waypointMarkersRef.current[wp.id] = L.marker([wp.lat, wp.lng], { icon: wpIcon, zIndexOffset: 750 }).addTo(map).bindPopup(popup); }
      });
    }

    const activeSos = pings.filter(p => p.type === 'sos' && (Date.now() - (p.timestamp?.toMillis ? p.timestamp.toMillis() : Date.now())) < 60000 * 60); 
    const activeSosIds = activeSos.map(s => s.id);
    Object.keys(sosMarkersRef.current).forEach((id) => {
      if (!activeSosIds.includes(id)) { sosMarkersRef.current[id].remove(); delete sosMarkersRef.current[id]; }
    });

    activeSos.forEach((sos) => {
      if (sos.lat === 0 && sos.lng === 0) return;
      const sosIcon = L.divIcon({ className: "radar-sos-marker", html: `<div class="relative flex items-center justify-center"><span class="absolute inline-flex h-16 w-16 rounded-full bg-red-500/40 animate-ping"></span><span class="absolute inline-flex h-10 w-10 rounded-full bg-red-500/60 animate-pulse"></span><span class="relative inline-flex rounded-full h-6 w-6 bg-red-600 border-2 border-white flex items-center justify-center text-[10px] shadow-[0_0_15px_rgba(220,38,38,0.8)]">🚨</span></div>`, iconSize: [40, 40], iconAnchor: [20, 20], });
      const pop = `<div class="text-zinc-900 p-1 font-sans"><span class="text-[9px] font-bold text-red-600 uppercase flex items-center gap-1">🚨 SOS EMERGENCY</span><p class="text-xs font-semibold text-zinc-800 mt-0.5">Pilot: ${sos.sender}</p><p class="text-[10px] text-zinc-600 mt-0.5">${sos.message}</p><span class="text-[9px] text-zinc-400 block mt-1 pt-1 border-t border-zinc-100">${getTimeAgo(sos.timestamp)}</span></div>`;
      if (sosMarkersRef.current[sos.id]) { sosMarkersRef.current[sos.id].setLatLng([sos.lat, sos.lng]).setIcon(sosIcon).setPopupContent(pop);
      } else { sosMarkersRef.current[sos.id] = L.marker([sos.lat, sos.lng], { icon: sosIcon, zIndexOffset: 2000 }).addTo(map).bindPopup(pop); }
    });
  }, [userLat, userLng, riders, meetups, hazards, waypoints, pings, customPin, estRange, isGhostMode, showRiders, showMeetups, showHazards, showWaypoints, theme, timeTicker, useMetric, radarRadius, isSharingLocation, compassBearingToTarget]);

  const handleZoomTo = (lat: number, lng: number) => { if (mapRef.current) mapRef.current.setView([lat, lng], 15, { animate: true }); };

  const sortedRiders = [...riders].filter((r) => r.id !== USER_ID && r.lat !== 0)
    .map((rider) => ({ ...rider, distance: calculateDistance(userLat, userLng, rider.lat, rider.lng, useMetric) }))
    .filter(r => r.distance <= radarRadius)
    .filter(r => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      const riderSpeedMph = useMetric ? r.speed * 0.621371 : r.speed;
      if (speedFilter === "STATIONARY" && riderSpeedMph > 2) return false;
      if (speedFilter === "CRUISING" && (riderSpeedMph <= 2 || riderSpeedMph > 30)) return false;
      if (speedFilter === "HIGH_SPEED" && riderSpeedMph <= 30) return false;
      return true;
    })
    .sort((a, b) => a.distance - b.distance);

  const combinedFeed = [...pings, ...hazards, ...meetups, ...waypoints]
    .filter(item => calculateDistance(userLat, userLng, item.lat, item.lng, useMetric) <= radarRadius)
    .sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
      return timeA - timeB;
    });

  const walkieFeed = pings.filter((item: any) => item.audioData && (item.channel === activeChannel || !item.channel));

  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
    if (!initialLoadDone.current && combinedFeed.length > 0) {
      container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
      initialLoadDone.current = true;
      return;
    }
    if (isNearBottom) { setTimeout(() => { container.scrollTo({ top: container.scrollHeight, behavior: "smooth" }); }, 50); }
  }, [pings.length, hazards.length, meetups.length, waypoints.length]);

  if (!mounted) return <div className="h-screen bg-black text-lime-500 font-black flex items-center justify-center animate-pulse tracking-widest text-xs uppercase">Booting Radar Node...</div>;

  return (
    <div className={`space-y-6 pb-20 font-sans text-zinc-200 relative z-10 ${bgBase}`}>

      <AnimatePresence>
        {announcementModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`${bgPanel} border-2 border-amber-500 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.5)]`}>
              <div className="flex justify-between items-center">
                <h4 className="font-black text-amber-400 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Megaphone className="w-5 h-5 animate-bounce" /> Broadcast Fleet Announcement
                </h4>
                <button onClick={() => setAnnouncementModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4"/></button>
              </div>
              <p className="text-xs text-zinc-300">Send an urgent priority banner flash to all connected riders across the regional telemetry grid.</p>
              <textarea 
                value={announcementText} 
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Enter alert message (e.g., regroup at bridge in 5 mins)..."
                className={`w-full min-h-[80px] ${bgInput} rounded-xl p-3 text-xs outline-none focus:border-amber-500 font-bold resize-none`}
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (!announcementText.trim()) return;
                    setActiveAnnouncement(announcementText.trim());
                    setAnnouncementText("");
                    setAnnouncementModalOpen(false);
                  }}
                  className="flex-1 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  Broadcast Priority Flash
                </button>
                <button onClick={() => setAnnouncementModalOpen(false)} className={`min-h-[44px] px-4 ${bgList} border ${brd} ${txtMain} text-xs font-bold rounded-xl cursor-pointer`}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeAnnouncement && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500 text-black font-black text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-[0_0_25px_rgba(245,158,11,0.7)] z-50">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 animate-bounce shrink-0" />
            <span>⚡ FLEET FLASH ANNOUNCEMENT: {activeAnnouncement}</span>
          </div>
          <button onClick={() => setActiveAnnouncement(null)} className="bg-black text-white px-2.5 py-1 rounded-lg text-[9px] uppercase cursor-pointer">Dismiss</button>
        </motion.div>
      )}

      {!isDayMode && !isGlobalNightVision && (
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10 blur-[150px] pointer-events-none -z-10" style={{ backgroundColor: t.hex }}></div>
      )}
      
      {isNetworkOffline && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-950/45 border-2 border-amber-500/40 text-amber-200 text-xs rounded-xl p-3.5 flex gap-2.5 items-start shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md">
          <CloudLightning className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1"><span className="font-bold text-amber-400 block mb-0.5">Cellular Network Offline</span><p>Map routing and location pinging has fallen back to local cache.</p></div>
        </motion.div>
      )}

      {proximityWarning && proximityAlerts && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-cyan-950/80 border-2 border-cyan-500 text-cyan-200 text-xs rounded-xl p-3.5 flex gap-2.5 items-center shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md">
          <Radar className="w-5 h-5 text-cyan-400 shrink-0 animate-spin" />
          <div className="flex-1 font-mono font-bold">{proximityWarning}</div>
          <button onClick={() => setProximityWarning(null)} className="text-[10px] text-cyan-400 hover:text-white uppercase font-bold cursor-pointer">Acknowledge</button>
        </motion.div>
      )}

      {safetyWarning && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-950/45 border-2 border-red-500/40 text-red-200 text-xs rounded-xl p-3.5 flex gap-2.5 items-start shadow-[0_0_15px_rgba(239,68,68,0.2)] backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1"><span className="font-bold text-red-400 block mb-0.5">System Alert</span><p>{safetyWarning}</p></div>
          <button onClick={() => setSafetyWarning(null)} className="min-h-[44px] px-3 text-[10px] text-red-400 hover:text-white uppercase font-bold shrink-0 transition-colors active:scale-95 cursor-pointer">Dismiss</button>
        </motion.div>
      )}

      <div className={`${bgPanel} border ${brd} rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md`}>
        <div className="flex items-center gap-2">
          <Palette className={`w-4 h-4 ${t.text}`} />
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-300">Quick Theme:</span>
          <div className="flex gap-1.5 ml-1">
            <button onClick={() => setTheme('lime')} className={`w-5 h-5 rounded-full bg-[#39ff14] transition-transform active:scale-95 cursor-pointer ${theme === 'lime' ? 'ring-2 ring-white' : ''}`}></button>
            <button onClick={() => setTheme('cyan')} className={`w-5 h-5 rounded-full bg-cyan-500 transition-transform active:scale-95 cursor-pointer ${theme === 'cyan' ? 'ring-2 ring-white' : ''}`}></button>
            <button onClick={() => setTheme('emerald')} className={`w-5 h-5 rounded-full bg-emerald-500 transition-transform active:scale-95 cursor-pointer ${theme === 'emerald' ? 'ring-2 ring-white' : ''}`}></button>
            <button onClick={() => setTheme('amber')} className={`w-5 h-5 rounded-full bg-amber-500 transition-transform active:scale-95 cursor-pointer ${theme === 'amber' ? 'ring-2 ring-white' : ''}`}></button>
            <button onClick={() => setTheme('rose')} className={`w-5 h-5 rounded-full bg-rose-500 transition-transform active:scale-95 cursor-pointer ${theme === 'rose' ? 'ring-2 ring-white' : ''}`}></button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportTelemetryJson} className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
            <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
          </button>
          <button onClick={() => setAnnouncementModalOpen(true)} className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
            <Megaphone className="w-3.5 h-3.5" /> Fleet Flash
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-zinc-200 font-bold text-sm tracking-wide flex items-center gap-2.5">
            <Users className={`w-5 h-5 ${t.text}`} /> RURAL RIDER RADAR {isGhostMode && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase">Ghost Mode Active</span>}
          </h3>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Tactical telemetry, breadcrumb pathing, and targeting grid.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setNightVisionMode(!nightVisionMode)} 
            className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${nightVisionMode ? 'bg-amber-600 border-amber-400 text-black font-black shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'bg-zinc-900 border-zinc-700 text-zinc-300'}`}
          >
            <SunMoon className="w-3.5 h-3.5" /> Night Vision {nightVisionMode ? "ON" : "OFF"}
          </button>
          <div className="bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl text-amber-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <CloudSun className="w-3.5 h-3.5" /> {sunsetCountdown}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        
        {/* 🔥 MODULAR COMPONENT EXPORTS 🔥 */}
        <SetupIdentityPanel {...{ t, bgPanel, brd, txtMain, txtMuted, bgList, bgInput, meshLatency, gpsPrecision, isSharingLocation, toggleBroadcast, callsign, pevType, setPevType, estRange, setEstRange, useMetric, userStatus, setUserStatus, isGhostMode, handleGhostModeToggle, saveRadarConfig, profileSaved }} />

        <UniversalSettingsPanel {...{ t, bgPanel, brd, txtMain, txtMuted, bgList, bgCard, bgInput, bgBase, useMetric, setUseMetric, autoPlayAudio, setAutoPlayAudio, proximityAlerts, setProximityAlerts, radarRadius, setRadarRadius, geoFenceRadius, setGeoFenceRadius, elevationHistory, searchQuery, setSearchQuery, handleSearchLocation, isSearching, customPin, setCustomPin, compassBearingToTarget, calculateDistance, userLat, userLng, recenterMap }} />

        <NetworkOpsPanel {...{ handleSendPing, handleAssembleHere, isSettingMeetup, setIsSettingMeetup, meetupDesc, setMeetupDesc, handleProposeMeetup, customPin, isSettingHazard, setIsSettingHazard, hazardType, setHazardType, handleDropHazard, isSettingWaypoint, setIsSettingWaypoint, waypointTitle, setWaypointTitle, waypointCategory, setWaypointCategory, handleDropWaypoint, handleSendSOS, t, bgPanel, brd, txtMain, txtMuted, bgList, bgInput }} />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
        <div className={`lg:col-span-3 ${bgPanel} border ${brd} rounded-2xl p-4 space-y-3 shadow-2xl relative`}>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
               <Filter className={`w-4 h-4 ${t.text}`} />
               <span className={`text-[10px] font-black uppercase ${txtMuted} tracking-widest`}>Map Render Targets</span>
            </div>
            <div className="flex flex-wrap gap-2">
               <button onClick={() => setShowRiders(!showRiders)} className={`min-h-[36px] px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${showRiders ? t.dim : `${bgBase} ${txtMuted} border ${brd}`}`}>Riders</button>
               <button onClick={() => setShowMeetups(!showMeetups)} className={`min-h-[36px] px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${showMeetups ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : `${bgBase} ${txtMuted} border ${brd}`}`}>Group Rides</button>
               <button onClick={() => setShowHazards(!showHazards)} className={`min-h-[36px] px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${showHazards ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : `${bgBase} ${txtMuted} border ${brd}`}`}>Hazards</button>
               <button onClick={() => setShowWaypoints(!showWaypoints)} className={`min-h-[36px] px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${showWaypoints ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : `${bgBase} ${txtMuted} border ${brd}`}`}>Waypoints</button>
            </div>
          </div>

          <div className={`rounded-xl overflow-hidden border ${brd} relative bg-black h-[500px] shadow-inner`}>
            
            <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-xl pointer-events-none">
              <span className={`text-[9px] ${t.text} font-bold uppercase tracking-widest block mb-2 font-mono`}>Location Metrics</span>
              <div className="flex items-center gap-4 text-xs font-bold text-white">
                <div className="flex items-center gap-1.5"><MousePointerClick className="w-3.5 h-3.5 text-zinc-400" /> Tap map &amp; Lock Target</div>
              </div>
            </div>

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400]">
               <div className="relative flex items-center justify-center">
                  <Crosshair className={`w-8 h-8 ${t.text} drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] opacity-80`} />
                  <div className="absolute w-1 h-1 bg-rose-500 rounded-full"></div>
               </div>
            </div>

            <button 
              type="button"
              onClick={handleTargetCrosshair} 
              className={`absolute top-4 right-4 z-[400] ${t.bg} text-black font-black text-[10px] px-4 py-3 rounded-xl uppercase shadow-lg border-2 border-black flex items-center gap-2 transition-transform active:scale-95 cursor-pointer`}
            >
              <LocateFixed className="w-4 h-4" /> Lock Center
            </button>

            <div ref={mapContainerRef} className="w-full h-full z-10" />
            
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 bg-black/80 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-xl flex flex-wrap justify-center sm:justify-start gap-3 text-[10px] font-mono font-bold text-zinc-300 shadow-xl">
              <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${t.bg}`} /> You / Target</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> E-Bike</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Scooter</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Waypoint</div>
              <div className="flex items-center gap-1.5"><span className="text-sm leading-none">🚴</span> Group Ride</div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col">

          {/* 🔥 MODULAR COMPONENT EXPORTS 🔥 */}
          <LivePilotsPanel {...{ sortedRiders, speedFilter, setSpeedFilter, statusFilter, setStatusFilter, useMetric, handleZoomTo, t, bgPanel, brd, txtMuted, txtMain, bgList }} />

          <div className={`${bgPanel} border ${brd} rounded-2xl p-4 flex flex-col flex-1 min-h-[400px] shadow-2xl`}>
            <div className="flex justify-between items-center mb-3 shrink-0">
               <span className={`text-[10px] ${txtMuted} font-black uppercase tracking-widest flex items-center gap-1.5 font-mono`}>
                 <RadioReceiver className="w-4 h-4 text-cyan-400 animate-pulse" /> COMMS NETWORK
               </span>
               <button onClick={() => setAutoPlayAudio(!autoPlayAudio)} className={`p-1.5 rounded border transition-colors cursor-pointer active:scale-95 ${autoPlayAudio ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : `${bgBase} ${brd} ${txtMuted}`}`} title="Auto-Play Audio">
                 {autoPlayAudio ? <Volume2 className="w-3 h-3"/> : <VolumeX className="w-3 h-3"/>}
               </button>
            </div>
            
            <div ref={feedContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4 flex flex-col">
              {combinedFeed.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 m-auto">
                  <span className={`text-zinc-500 text-[10px] font-bold uppercase tracking-widest`}>Signal Empty in Radius</span>
                </div>
              ) : (
                <>
                  {combinedFeed.map((item: any) => {
                    if (item.description) {
                      return (
                        <div key={item.id} className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-900/40 shadow-inner">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] font-black text-blue-400 uppercase font-mono">🚴‍♂️ Group Ride: {item.setBy}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-blue-600">{getTimeAgo(item.timestamp)}</span>
                              <button onClick={() => handleGlobalDelete(item)} className="text-blue-600 hover:text-red-400 transition-colors cursor-pointer active:scale-95"><Trash2 className="w-3 h-3"/></button>
                            </div>
                          </div>
                          <p className={`text-xs ${txtMain} font-bold truncate`}>{item.description}</p>
                          <button onClick={() => handleZoomTo(item.lat, item.lng)} className="min-h-[36px] w-full text-[9px] text-blue-400 hover:text-blue-200 mt-2 uppercase font-black bg-blue-950/40 px-2 py-1 rounded-lg border border-blue-900/50 transition-all active:scale-95 cursor-pointer">Locate on Map</button>
                        </div>
                      )
                    }

                    if (item.category && item.title) {
                      return (
                        <div key={item.id} className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-900/40 shadow-inner">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] font-black text-cyan-400 uppercase font-mono">⚡ {item.category}: {item.creator}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-cyan-600">{getTimeAgo(item.timestamp)}</span>
                              <button onClick={() => handleGlobalDelete(item)} className="text-cyan-600 hover:text-red-400 transition-colors cursor-pointer active:scale-95"><Trash2 className="w-3 h-3"/></button>
                            </div>
                          </div>
                          <p className={`text-xs ${txtMain} font-bold truncate`}>{item.title}</p>
                          <button onClick={() => handleZoomTo(item.lat, item.lng)} className="min-h-[36px] w-full text-[9px] text-cyan-400 hover:text-cyan-200 mt-2 uppercase font-black bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-900/50 transition-all active:scale-95 cursor-pointer">Locate on Map</button>
                        </div>
                      );
                    }

                    if (item.type && (item.type.includes("🕳️") || item.type.includes("🚧") || item.type.includes("🐕") || item.type.includes("🚔"))) {
                      return (
                        <div key={item.id} className="p-2.5 rounded-xl bg-yellow-950/20 border border-yellow-900/40 flex flex-col shadow-inner">
                          <span className="text-[9px] font-black text-yellow-500 uppercase font-mono flex justify-between items-center">
                            <span>⚠️ Hazard: {item.reporter}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-yellow-600">{getTimeAgo(item.timestamp)}</span>
                              <button onClick={() => handleGlobalDelete(item)} className="text-yellow-600 hover:text-red-400 transition-colors cursor-pointer active:scale-95"><Trash2 className="w-3 h-3"/></button>
                            </div>
                          </span>
                          
                          {/* FEATURE 8: HAZARD CROWD-VERIFICATION UPVOTE BUTTON */}
                          <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl my-2 border border-yellow-500/30">
                            <span className="text-xs font-bold text-yellow-400">{item.type}</span>
                            <button 
                              onClick={() => handleUpvoteHazard(item.id)}
                              className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-300 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <ThumbsUp className="w-3 h-3" /> Confirm Trap ({item.upvotes || 1})
                            </button>
                          </div>
                          
                          <button onClick={() => handleZoomTo(item.lat, item.lng)} className="min-h-[36px] w-full text-[9px] text-yellow-500 hover:text-yellow-300 mt-2 uppercase font-black bg-yellow-950/40 px-2 py-1 rounded-lg border border-yellow-900/50 transition-all active:scale-95 cursor-pointer">Locate</button>
                        </div>
                      );
                    }

                    const isBike = item.pevType?.includes("Bike") || item.pevType?.includes("Moped");
                    const isEuc = item.pevType?.includes("EUC") || item.pevType?.includes("Unicycle");
                    const isScooter = item.pevType?.includes("Scooter") || item.pevType?.includes("Skateboard");

                    let colorClass = "bg-zinc-500"; 
                    if (isBike) colorClass = "bg-emerald-500"; 
                    else if (isScooter) colorClass = "bg-sky-500"; 
                    else if (isEuc) colorClass = "bg-purple-500"; 

                    return (
                      <div key={item.id} className={`p-3 rounded-xl border ${item.type === 'sos' ? 'bg-red-950/30 border-red-900/50' : `${bgList} ${brd}`} shadow-inner`}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1.5">
                            {item.type !== 'sos' && <span className={`w-2 h-2 rounded-full ${colorClass}`} />}
                            <span className={`text-[10px] font-black uppercase font-mono ${item.type === 'sos' ? 'text-red-400' : txtMuted}`}>
                              {item.type === 'sos' ? '🚨 SOS' : item.sender}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-mono ${item.type === 'sos' ? 'text-red-500' : 'text-zinc-600'}`}>{getTimeAgo(item.timestamp)}</span>
                            <button onClick={() => handleGlobalDelete(item)} className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer active:scale-95"><Trash2 className="w-3 h-3"/></button>
                          </div>
                        </div>
                        
                        {item.audioData ? (
                          <div className="mt-2 w-full">
                            <audio controls src={item.audioData} className="w-full h-8 outline-none rounded" controlsList="nodownload noplaybackrate" />
                          </div>
                        ) : (
                          <p className={`text-[13px] leading-relaxed font-bold break-words ${item.type === 'sos' ? 'text-red-300' : txtMain}`}>{item.message}</p>
                        )}
                        
                        {item.imageUrl && (
                          <div className="mt-2 w-full rounded-lg overflow-hidden border border-zinc-800 bg-black/60 shadow-inner">
                            <img src={item.imageUrl} alt="Ping Attachment" className="w-full h-auto object-cover max-h-[200px]" />
                          </div>
                        )}

                        {item.lat !== 0 && item.lng !== 0 && (
                          <button onClick={() => handleZoomTo(item.lat, item.lng)} className={`mt-2 text-[9px] ${txtMuted} hover:${txtMain} uppercase font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95`}>
                            <MapPin className="w-3 h-3"/> View Pin
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Text Message Input Form */}
            <div className={`flex flex-col gap-2 pt-3 border-t ${brd} shrink-0`}>
              
              {pingImage && (
                <div className="relative inline-block w-16 h-16 rounded-xl overflow-hidden border border-lime-500 shadow-md">
                  <img src={pingImage} alt="Attachment" className="w-full h-full object-cover" />
                  <button onClick={() => setPingImage(null)} className="absolute top-1 right-1 bg-black/80 rounded-full p-0.5 text-white hover:text-red-400 transition-colors cursor-pointer active:scale-95">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <button 
                  onClick={() => imageInputRef.current?.click()} 
                  disabled={isUploadingImg}
                  className={`min-h-[44px] min-w-[44px] ${bgList} hover:bg-white/10 border ${brd} ${txtMuted} hover:${txtMain} rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-inner`}
                  title="Attach Photo"
                >
                  {isUploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>

                <input 
                  type="text" 
                  value={pingMessage} 
                  onChange={(e) => setPingMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPing()}
                  placeholder="Message fleet globally..." 
                  className={`flex-1 min-h-[44px] min-w-0 ${bgInput} rounded-xl px-3 py-2 text-[13px] font-medium outline-none transition-colors shadow-inner`}
                />

                <button 
                  onClick={() => handleSendPing()} 
                  disabled={!pingMessage.trim() && !pingImage} 
                  className={`min-h-[44px] min-w-[50px] shrink-0 ${t.bg} disabled:opacity-30 text-black px-3 rounded-xl font-black uppercase flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>

          </div>

          <WalkieTalkieWidget {...{ activeChannel, setActiveChannel, squelchLevel, setSquelchLevel, micBoost, setMicBoost, autoPlayAudio, setAutoPlayAudio, walkieFeed, getTimeAgo, isRecording, startRecording, stopRecording, handleSendPing, t, bgPanel, brd, txtMain, txtMuted, bgInput, bgList, bgCard }} />

        </div>

      </div>
    </div>
  );
}