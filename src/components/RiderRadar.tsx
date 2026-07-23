"use client";

import React, { useState, useEffect, useRef } from "react";
import { PEVType, ActiveRider } from "../types";
import { 
  Users, MapPin, Navigation, Eye, RefreshCw, Send, Radio, Flag, CheckCircle, 
  Bell, Settings, EyeOff, Shield, AlertTriangle, AlertOctagon, Search, Map as MapIcon, 
  Layers, Crosshair, X, MapPinOff, Filter, BatteryMedium, Timer, Activity,
  CloudLightning, Wind, MessageSquare, Palette, MousePointerClick, LocateFixed,
  Camera, ImagePlus, Loader2, Trash2, ShieldAlert, Globe, SlidersHorizontal,
  Mic, RadioReceiver, Volume2, VolumeX, Radar, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import { locationService } from "../services/LocationService";

// =====================================================================
// 🔥 PURE FIRESTORE INTEGRATION WITH OFFLINE CAPABILITY 🔥
// =====================================================================
import { db } from "../services/firebase";
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDocs, where, serverTimestamp } from "firebase/firestore";

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

type ThemeColor = 'lime' | 'cyan' | 'emerald' | 'amber' | 'rose';

export default function RiderRadar(props: any) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  // SMART SCROLL REFS
  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  const initialLoadDone = useRef(false);
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Marker Refs
  const userMarkerRef = useRef<L.Marker | null>(null);
  const rangeCircleRef = useRef<L.Circle | null>(null);
  const customPinMarkerRef = useRef<L.Marker | null>(null);
  const otherMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const meetupMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const hazardMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const sosMarkersRef = useRef<{ [key: string]: L.Marker }>({}); 

  const [mounted, setMounted] = useState(false);

  // --- 🔥 GLOBAL IDENTITY SYNC 🔥 ---
  const callsign = props.callsign || "";

  // Theme & App State
  const [theme, setTheme] = useState<ThemeColor>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem("rural_theme") as ThemeColor) || 'lime';
    return 'lime';
  });

  const [pevType, setPevType] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem("radar_pev_type") || "Electric Scooter" : "Electric Scooter");
  const [userStatus, setUserStatus] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem("radar_user_status") || "Cruising" : "Cruising");
  const [estRange, setEstRange] = useState<number>(() => typeof window !== 'undefined' ? parseInt(localStorage.getItem("radar_est_range") || "20") : 20);
  
  const [useMetric, setUseMetric] = useState<boolean>(() => typeof window !== 'undefined' ? localStorage.getItem("rt_use_metric") === "true" || localStorage.getItem("radar_use_metric") === "true" : false);
  const [telemetryInterval, setTelemetryInterval] = useState<number>(() => typeof window !== 'undefined' ? parseInt(localStorage.getItem("radar_telemetry_interval") || "1000") : 1000);
  const [radarRadius, setRadarRadius] = useState<number>(() => typeof window !== 'undefined' ? parseInt(localStorage.getItem("radar_scan_radius") || "50") : 50);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(() => typeof window !== 'undefined' ? localStorage.getItem("radar_autoplay_audio") === "true" : false);

  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(false);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(() => typeof window !== 'undefined' ? localStorage.getItem("radar_ghost_mode") === "true" || localStorage.getItem("rt_privacy_mode") === "true" : false);
  
  const [userLat, setUserLat] = useState<number>(() => locationService.getCurrentUpdate()?.lat || 0);
  const [userLng, setUserLng] = useState<number>(() => locationService.getCurrentUpdate()?.lng || 0);
  const [speed, setSpeed] = useState<number>(0);

  // Map, Search, & Filter States
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_LAYERS>("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [customPin, setCustomPin] = useState<{lat: number, lng: number, name: string} | null>(null);
  
  const [showRiders, setShowRiders] = useState(true);
  const [showMeetups, setShowMeetups] = useState(true);
  const [showHazards, setShowHazards] = useState(true);

  // FIRESTORE STATES (WITH OFFLINE CACHING)
  const [riders, setRiders] = useState<ActiveRider[]>([]);
  const [meetups, setMeetups] = useState<any[]>([]);
  const [pings, setPings] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [isNetworkOffline, setIsNetworkOffline] = useState<boolean>(false);

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
  const [profileSaved, setProfileSaved] = useState<boolean>(false);

  const hasCenteredRef = useRef<boolean>(false);
  const [timeTicker, setTimeTicker] = useState(Date.now()); 

  const t = {
    lime: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/50', hover: 'hover:text-[#39ff14]', hex: '#39ff14' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', dim: 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50', hover: 'hover:text-cyan-400', hex: '#06b6d4' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', dim: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50', hover: 'hover:text-emerald-400', hex: '#10b981' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', dim: 'bg-amber-950/30 text-amber-400 border-amber-900/50', hover: 'hover:text-amber-400', hex: '#f59e0b' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', dim: 'bg-rose-950/30 text-rose-400 border-rose-900/50', hover: 'hover:text-rose-400', hex: '#f43f5e' }
  }[theme] || { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/50', hover: 'hover:text-[#39ff14]', hex: '#39ff14' };

  useEffect(() => { 
    setMounted(true); 
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  
  useEffect(() => { 
    localStorage.setItem("rural_theme", theme); 
    localStorage.setItem("rt_theme", theme);
    localStorage.setItem("copilot_theme", theme);
    localStorage.setItem("universal_brand_theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setTimeTicker(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 🔥 FIRESTORE STREAMS WITH OFFLINE CACHE FALLBACK 🔥 ---
  useEffect(() => {
    if (!mounted) return;

    // PRE-LOAD LOCAL CACHE TO PREVENT BLANK SCREEN IF OFFLINE
    try {
      const cRiders = localStorage.getItem("radar_cache_riders"); if (cRiders) setRiders(JSON.parse(cRiders));
      const cMeetups = localStorage.getItem("radar_cache_meetups"); if (cMeetups) setMeetups(JSON.parse(cMeetups));
      const cHazards = localStorage.getItem("radar_cache_hazards"); if (cHazards) setHazards(JSON.parse(cHazards));
      const cPings = localStorage.getItem("radar_cache_pings"); if (cPings) setPings(JSON.parse(cPings));
    } catch(e) {}

    // Riders Stream
    const unsubRiders = onSnapshot(collection(db, "radar_riders"), (snapshot) => {
      setIsNetworkOffline(false);
      const activeData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(r => (Date.now() - (r.lastUpdated || 0)) < 1000 * 60 * 30); 
      setRiders(activeData);
      localStorage.setItem("radar_cache_riders", JSON.stringify(activeData));
    }, (error) => {
      setIsNetworkOffline(true);
      console.warn("Riders stream offline. Falling back to local cache.", error);
    });

    // Meetups Stream
    const unsubMeetups = onSnapshot(collection(db, "radar_meetups"), (snapshot) => {
      setIsNetworkOffline(false);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeetups(data);
      localStorage.setItem("radar_cache_meetups", JSON.stringify(data));
    }, (error) => setIsNetworkOffline(true));

    // Hazards Stream
    const unsubHazards = onSnapshot(collection(db, "radar_hazards"), (snapshot) => {
      setIsNetworkOffline(false);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHazards(data);
      localStorage.setItem("radar_cache_hazards", JSON.stringify(data));
    }, (error) => setIsNetworkOffline(true));

    // Pings Stream
    const qPings = query(collection(db, "radar_pings"), orderBy("timestamp", "desc"));
    const unsubPings = onSnapshot(qPings, (snapshot) => {
      setIsNetworkOffline(false);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPings(data);
      localStorage.setItem("radar_cache_pings", JSON.stringify(data));
    }, (error) => setIsNetworkOffline(true));

    return () => {
      unsubRiders();
      unsubMeetups();
      unsubHazards();
      unsubPings();
    };
  }, [mounted]);

  useEffect(() => {
    if (pings.length > 0 && autoPlayAudio) {
      const latest = pings[0];
      if (latest.id !== prevPingId) {
        setPrevPingId(latest.id);
        if (latest.audioData && latest.sender !== callsign) {
          const audio = new Audio(latest.audioData);
          audio.play().catch(e => console.warn("Browser blocked auto-play:", e));
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
        setUserLat(update.lat);
        setUserLng(update.lng);
        setSpeed(update.speed);

        const now = Date.now();
        if (!isGhostMode && (now - lastPostTime >= telemetryInterval)) {
          sendTelemetryUpdate(update.lat, update.lng, update.speed);
          lastPostTime = now;
        }
      };

      locationService.addListener(handleUpdate);
      unsubscribe = () => locationService.removeListener(handleUpdate);
    } else {
      if (locationService.isTracking) locationService.stop();
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [isSharingLocation, callsign, pevType, userStatus, isGhostMode, telemetryInterval]);

  const sendTelemetryUpdate = (lat: number, lng: number, currentSpeed: number, overrideGhost?: boolean, overrideSharing?: boolean) => {
    const ghost = overrideGhost !== undefined ? overrideGhost : isGhostMode;
    const sharing = overrideSharing !== undefined ? overrideSharing : isSharingLocation;
    
    if (ghost || !sharing) return;
    
    setDoc(doc(db, "radar_riders", USER_ID), {
      name: callsign || "Unknown Pilot", lat, lng, speed: currentSpeed, pevType, status: userStatus, lastUpdated: Date.now()
    }).catch(err => {
       setIsNetworkOffline(true);
    });
  };

  const removeSelfFromRadar = () => {
    deleteDoc(doc(db, "radar_riders", USER_ID)).catch(() => {});
  };

  const toggleBroadcast = () => {
    const newState = !isSharingLocation;
    setIsSharingLocation(newState);
    
    if (!newState) {
      if (locationService.isTracking) locationService.stop();
      removeSelfFromRadar(); 
    } else {
      if (!locationService.isTracking) locationService.start(pevType as PEVType);
      if (userLat !== 0 && !isGhostMode) {
        sendTelemetryUpdate(userLat, userLng, speed, isGhostMode, newState);
      }
    }
  };

  const handleGhostModeToggle = (val: boolean) => {
    setIsGhostMode(val);
    localStorage.setItem("radar_ghost_mode", val ? "true" : "false");
    localStorage.setItem("rt_privacy_mode", val ? "true" : "false");
    
    if (val) {
      removeSelfFromRadar();
    } else if (isSharingLocation && userLat !== 0) {
      sendTelemetryUpdate(userLat, userLng, speed, val, isSharingLocation);
    }
  };

  const saveRadarConfig = () => {
    localStorage.setItem("radar_pev_type", pevType);
    localStorage.setItem("radar_user_status", userStatus);
    localStorage.setItem("radar_est_range", estRange.toString());
    localStorage.setItem("radar_use_metric", useMetric ? "true" : "false");
    localStorage.setItem("rt_use_metric", useMetric ? "true" : "false");
    localStorage.setItem("radar_telemetry_interval", telemetryInterval.toString());
    localStorage.setItem("radar_scan_radius", radarRadius.toString());
    localStorage.setItem("radar_autoplay_audio", autoPlayAudio ? "true" : "false");
    
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);

    if (isSharingLocation) {
      if (isGhostMode) removeSelfFromRadar();
      else sendTelemetryUpdate(userLat, userLng, speed);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingImg(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("image", file);
      
      const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY; 
      
      try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          setPingImage(data.data.url);
        }
      } catch (err) {
        alert("Image upload failed. Try again.");
      } finally {
        setIsUploadingImg(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 16000 } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleSendPing("🎙️ Voice Transmission", base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied. Check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCustomPin({ lat, lng, name: data[0].display_name.split(',')[0] });
        mapRef.current?.setView([lat, lng], 15, { animate: true });
        setSearchQuery("");
      } else { alert("Satellite could not lock onto that location."); }
    } catch (err) { alert("Error querying routing satellite."); } 
    finally { setIsSearching(false); }
  };

  const handleTargetCrosshair = async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    setCustomPin({ lat: center.lat, lng: center.lng, name: "Resolving Target..." });
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}`);
        const data = await res.json();
        setCustomPin({ lat: center.lat, lng: center.lng, name: data.display_name?.split(',')[0] || "Custom Target" });
    } catch {
        setCustomPin({ lat: center.lat, lng: center.lng, name: `Target (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})` });
    }
  };

  // 🔥 OFFLINE-SAFE FIRESTORE ACTIONS 🔥
  const handleProposeMeetup = () => {
    const targetLat = customPin ? customPin.lat : userLat;
    const targetLng = customPin ? customPin.lng : userLng;
    if (!meetupDesc.trim() || targetLat === 0) return;

    const descSafety = checkContentSafety(meetupDesc);
    if (!descSafety.safe) { setSafetyWarning("Meetup description flagged for restricted terms."); return; }
    
    const description = meetupDesc;
    setMeetupDesc(""); setIsSettingMeetup(false); setCustomPin(null); setSafetyWarning(null);

    addDoc(collection(db, "radar_meetups"), { lat: targetLat, lng: targetLng, description, setBy: callsign || "Pilot", timestamp: serverTimestamp() })
      .catch(err => setSafetyWarning("Offline Protocol: Meetup will broadcast when connection is restored."));
  };

  const handleDropHazard = () => {
    const targetLat = customPin ? customPin.lat : userLat;
    const targetLng = customPin ? customPin.lng : userLng;
    if (targetLat === 0) return;

    const type = hazardType;
    setIsSettingHazard(false); setCustomPin(null); setSafetyWarning(null);

    addDoc(collection(db, "radar_hazards"), { reporter: callsign || "Pilot", type, lat: targetLat, lng: targetLng, timestamp: serverTimestamp() })
      .catch(err => setSafetyWarning("Offline Protocol: Hazard will broadcast when connection is restored."));
  };

  const handleSendPing = (overrideMessage?: string, audioBase64?: string) => {
    const msgToSent = overrideMessage || pingMessage;
    if (!msgToSent.trim() && !pingImage && !audioBase64) return;

    const pingSafety = checkContentSafety(msgToSent);
    if (!pingSafety.safe) { alert("Message blocked: Contains restricted words."); return; }

    const safeLat = userLat !== 0 ? userLat : 35.2757; 
    const safeLng = userLng !== 0 ? userLng : -95.1244;
    
    const imgCache = pingImage;

    setPingMessage("");
    setPingImage(null);
    setSafetyWarning(null);

    addDoc(collection(db, "radar_pings"), { 
      sender: callsign || "Pilot", 
      pevType: pevType, 
      message: msgToSent, 
      imageUrl: imgCache || null,
      audioData: audioBase64 || null,
      lat: safeLat, 
      lng: safeLng, 
      type: "standard", 
      timestamp: serverTimestamp() 
    }).catch(error => setSafetyWarning("Offline Protocol: Message will transmit when cellular connection is restored."));
  };

  const handleSendSOS = () => {
    if (window.confirm("Broadcast SOS emergency beacon to all nearby riders?")) {
      const safeLat = userLat !== 0 ? userLat : 35.2757; 
      const safeLng = userLng !== 0 ? userLng : -95.1244;
      setSafetyWarning(null);
      
      addDoc(collection(db, "radar_pings"), { 
        sender: callsign || "Pilot", 
        message: "🚨 S.O.S. EMERGENCY! ASSISTANCE REQUIRED!", 
        lat: safeLat, 
        lng: safeLng, 
        type: "sos", 
        timestamp: serverTimestamp() 
      }).catch(err => setSafetyWarning("Offline Protocol: SOS queued. Awaiting connection."));
    }
  };

  const handleGlobalDelete = (item: any) => {
    if (!window.confirm("Delete this from the global network for everyone?")) return;
    try {
      if (item.description) { deleteDoc(doc(db, "radar_meetups", item.id)); } 
      else if (item.reporter) { deleteDoc(doc(db, "radar_hazards", item.id)); } 
      else { deleteDoc(doc(db, "radar_pings", item.id)); }
    } catch (error: any) {
      setSafetyWarning("Cannot delete while operating offline.");
    }
  };

  // --- Map Engine Initialization ---
  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLat !== 0 ? userLat : 35.2757, userLng !== 0 ? userLng : -95.1244],
      zoom: 13, zoomControl: false, attributionControl: false,
    });

    const layer = L.tileLayer(MAP_LAYERS[mapStyle], { maxZoom: 20 }).addTo(map);
    tileLayerRef.current = layer;

    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setCustomPin({ lat, lng, name: "Scanning Grid..." });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const locationName = data.display_name?.split(',')[0] || `Grid (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setCustomPin({ lat, lng, name: locationName });
      } catch {
        setCustomPin({ lat, lng, name: `Target (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      }
    });

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [mounted]);

  useEffect(() => {
    if (tileLayerRef.current) tileLayerRef.current.setUrl(MAP_LAYERS[mapStyle]);
  }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (userLat !== 0 && userLng !== 0 && !hasCenteredRef.current) {
      mapRef.current.setView([userLat, userLng], 14);
      hasCenteredRef.current = true;
    }
  }, [userLat, userLng]);

  const recenterMap = () => {
    if (userLat !== 0 && userLng !== 0 && mapRef.current) {
      mapRef.current.setView([userLat, userLng], 15, { animate: true });
    }
  };

  // --- Rendering Live Network Map Elements ---
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (customPin) {
      const targetIcon = L.divIcon({
        className: "radar-target-marker",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-14 w-14 rounded-full border border-white/50 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-5 w-5 bg-white border-2 border-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.8)]"></span>
            <div class="absolute -top-7 whitespace-nowrap bg-zinc-900/95 text-[9px] font-bold text-white px-2 py-1 rounded border border-zinc-700 shadow-xl">
              🎯 ${customPin.name}
            </div>
          </div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      });

      if (customPinMarkerRef.current) {
        customPinMarkerRef.current.setLatLng([customPin.lat, customPin.lng]).setIcon(targetIcon);
      } else {
        customPinMarkerRef.current = L.marker([customPin.lat, customPin.lng], { icon: targetIcon, zIndexOffset: 1000 }).addTo(map);
      }
    } else if (customPinMarkerRef.current) {
      customPinMarkerRef.current.remove(); customPinMarkerRef.current = null;
    }

    if (userLat !== 0 && userLng !== 0) {
      const isOffline = !isSharingLocation || isGhostMode;
      const userIcon = L.divIcon({
        className: "radar-user-marker",
        html: `
          <div class="relative flex items-center justify-center">
            ${!isOffline ? `<span class="absolute inline-flex h-8 w-8 rounded-full ${t.bg} opacity-30 animate-ping"></span>` : ''}
            <span class="relative inline-flex rounded-full h-4.5 w-4.5 ${isOffline ? 'bg-zinc-500 border-zinc-700' : `${t.bg} border-zinc-950`} flex items-center justify-center shadow-lg"></span>
            ${isOffline ? `<div class="absolute -top-6 whitespace-nowrap bg-zinc-900/90 text-[9px] font-bold text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 shadow">OFFLINE / GHOST</div>` : ''}
          </div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      });
      
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]).setIcon(userIcon);
      } else {
        userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 900 }).addTo(map).bindPopup(`<strong class="text-zinc-900">You (${callsign || "Pilot"})</strong>`);
      }

      const multiplier = useMetric ? 1000 : 1609.34;
      if (estRange > 0 && !isGhostMode) {
        if (rangeCircleRef.current) {
          rangeCircleRef.current.setLatLng([userLat, userLng]);
          rangeCircleRef.current.setRadius(estRange * multiplier);
          rangeCircleRef.current.setStyle({ color: t.hex, fillColor: t.hex });
        } else {
          rangeCircleRef.current = L.circle([userLat, userLng], {
            radius: estRange * multiplier,
            color: t.hex,
            fillColor: t.hex,
            fillOpacity: 0.05,
            weight: 1,
            dashArray: '4'
          }).addTo(map);
        }
      } else if (rangeCircleRef.current) {
        rangeCircleRef.current.remove();
        rangeCircleRef.current = null;
      }
    }

    const activeIds = riders.map((r) => r.id);
    Object.keys(otherMarkersRef.current).forEach((id) => {
      if (!showRiders || (!activeIds.includes(id) && id !== USER_ID)) {
        otherMarkersRef.current[id].remove(); delete otherMarkersRef.current[id];
      }
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
          html: `
            <div class="relative flex items-center justify-center transition-transform duration-500 ease-linear">
              ${isLive ? `<span class="absolute inline-flex h-8 w-8 rounded-full ${pingClass} animate-pulse"></span>` : ''}
              <span class="relative inline-flex rounded-full h-4 w-4 ${colorClass} ${!isLive ? 'opacity-50' : ''} border-2 border-zinc-950 shadow-md"></span>
              <div class="absolute -top-6 whitespace-nowrap bg-[#0d0e15]/90 text-[9px] font-bold ${isLive ? 'text-white' : 'text-zinc-500'} px-2 py-0.5 rounded border border-zinc-700 shadow">
                ${rider.name}
              </div>
            </div>`,
          iconSize: [30, 30], iconAnchor: [15, 15],
        });

        const popupContent = `
          <div class="text-zinc-900 p-1 font-sans">
            <h4 class="font-bold text-xs">${rider.name}</h4>
            <p class="text-[10px] text-zinc-600 mt-0.5">${rider.pevType}</p>
            <div class="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-zinc-100 font-mono text-[9px] text-zinc-500">
              <span>📡 ${rider.status}</span><span>•</span><span>💨 ${speedDisplay}</span>
            </div>
            <p class="text-[8px] text-zinc-400 mt-1">${getTimeAgo(rider.lastUpdated || Date.now())}</p>
          </div>`;

        if (otherMarkersRef.current[rider.id]) {
          otherMarkersRef.current[rider.id].setLatLng([rider.lat, rider.lng]).setIcon(riderIcon).setPopupContent(popupContent);
        } else {
          otherMarkersRef.current[rider.id] = L.marker([rider.lat, rider.lng], { icon: riderIcon, zIndexOffset: 500 }).addTo(map).bindPopup(popupContent);
        }
      });
    }

    const activeMeetupIds = meetups.map(m => m.id);
    Object.keys(meetupMarkersRef.current).forEach((id) => {
      if (!showMeetups || !activeMeetupIds.includes(id)) {
        meetupMarkersRef.current[id].remove(); delete meetupMarkersRef.current[id];
      }
    });

    if (showMeetups) {
       meetups.forEach((meetup) => {
         const dist = calculateDistance(userLat, userLng, meetup.lat, meetup.lng, useMetric);
         if (dist > radarRadius) return;

         const meetupIcon = L.divIcon({
          className: "radar-meetup", html: `<div class="relative flex items-center justify-center"><span class="absolute inline-flex h-9 w-9 rounded-full bg-amber-500/40 animate-ping"></span><span class="relative inline-flex rounded-xl h-6.5 w-6.5 bg-amber-400 border-2 border-zinc-950 items-center justify-center shadow-lg shadow-amber-500/50">🚩</span></div>`, iconSize: [36, 36], iconAnchor: [18, 18],
         });
         const pop = `<div class="text-zinc-900 font-bold text-xs">Meetup: ${meetup.description}</div>`;
         if (meetupMarkersRef.current[meetup.id]) {
            meetupMarkersRef.current[meetup.id].setLatLng([meetup.lat, meetup.lng]).setIcon(meetupIcon).setPopupContent(pop);
         } else {
            meetupMarkersRef.current[meetup.id] = L.marker([meetup.lat, meetup.lng], { icon: meetupIcon, zIndexOffset: 800 }).addTo(map).bindPopup(pop);
         }
       });
    }

    const activeHazardIds = hazards.map((h) => h.id);
    Object.keys(hazardMarkersRef.current).forEach((id) => {
      if (!showHazards || !activeHazardIds.includes(id)) {
        hazardMarkersRef.current[id].remove(); delete hazardMarkersRef.current[id];
      }
    });

    if (showHazards) {
      hazards.forEach((hazard) => {
        const dist = calculateDistance(userLat, userLng, hazard.lat, hazard.lng, useMetric);
        if (dist > radarRadius) return;

        const emoji = hazard.type.split(" ")[0] || "⚠️";
        const hazIcon = L.divIcon({
          className: "radar-hazard-marker",
          html: `<div class="relative flex items-center justify-center"><span class="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 border border-zinc-950 flex items-center justify-center text-[10px] shadow-lg">${emoji}</span></div>`,
          iconSize: [24, 24], iconAnchor: [12, 12],
        });
        const popup = `<div class="text-zinc-900 p-1 font-sans"><span class="text-[9px] font-bold text-yellow-600 uppercase flex items-center gap-1">⚠️ TRAIL HAZARD</span><p class="text-xs font-semibold text-zinc-800 mt-0.5">${hazard.type}</p><span class="text-[9px] text-zinc-400 block mt-1 pt-1 border-t border-zinc-100">Reported by: ${hazard.reporter} • ${getTimeAgo(hazard.timestamp)}</span></div>`;
        if (hazardMarkersRef.current[hazard.id]) {
           hazardMarkersRef.current[hazard.id].setIcon(hazIcon).setPopupContent(popup);
        } else {
           hazardMarkersRef.current[hazard.id] = L.marker([hazard.lat, hazard.lng], { icon: hazIcon, zIndexOffset: 700 }).addTo(map).bindPopup(popup);
        }
      });
    }

    const activeSos = pings.filter(p => p.type === 'sos' && (Date.now() - (p.timestamp?.toMillis ? p.timestamp.toMillis() : Date.now())) < 60000 * 60); 
    const activeSosIds = activeSos.map(s => s.id);
    
    Object.keys(sosMarkersRef.current).forEach((id) => {
      if (!activeSosIds.includes(id)) {
        sosMarkersRef.current[id].remove(); 
        delete sosMarkersRef.current[id];
      }
    });

    activeSos.forEach((sos) => {
      if (sos.lat === 0 && sos.lng === 0) return;
      const sosIcon = L.divIcon({
        className: "radar-sos-marker",
        html: `<div class="relative flex items-center justify-center">
                 <span class="absolute inline-flex h-16 w-16 rounded-full bg-red-500/40 animate-ping"></span>
                 <span class="absolute inline-flex h-10 w-10 rounded-full bg-red-500/60 animate-pulse"></span>
                 <span class="relative inline-flex rounded-full h-6 w-6 bg-red-600 border-2 border-white flex items-center justify-center text-[10px] shadow-[0_0_15px_rgba(220,38,38,0.8)]">🚨</span>
               </div>`,
        iconSize: [40, 40], 
        iconAnchor: [20, 20],
      });
      const pop = `<div class="text-zinc-900 p-1 font-sans">
                     <span class="text-[9px] font-bold text-red-600 uppercase flex items-center gap-1">🚨 SOS EMERGENCY</span>
                     <p class="text-xs font-semibold text-zinc-800 mt-0.5">Pilot: ${sos.sender}</p>
                     <p class="text-[10px] text-zinc-600 mt-0.5">${sos.message}</p>
                     <span class="text-[9px] text-zinc-400 block mt-1 pt-1 border-t border-zinc-100">${getTimeAgo(sos.timestamp)}</span>
                   </div>`;
                   
      if (sosMarkersRef.current[sos.id]) {
         sosMarkersRef.current[sos.id].setLatLng([sos.lat, sos.lng]).setIcon(sosIcon).setPopupContent(pop);
      } else {
         sosMarkersRef.current[sos.id] = L.marker([sos.lat, sos.lng], { icon: sosIcon, zIndexOffset: 2000 }).addTo(map).bindPopup(pop);
      }
    });

  }, [userLat, userLng, riders, meetups, hazards, pings, customPin, estRange, isGhostMode, showRiders, showMeetups, showHazards, theme, timeTicker, useMetric, radarRadius, isSharingLocation]);

  const handleZoomTo = (lat: number, lng: number) => { if (mapRef.current) mapRef.current.setView([lat, lng], 15, { animate: true }); };

  const sortedRiders = [...riders].filter((r) => r.id !== USER_ID && r.lat !== 0)
    .map((rider) => ({ ...rider, distance: calculateDistance(userLat, userLng, rider.lat, rider.lng, useMetric) }))
    .filter(r => r.distance <= radarRadius)
    .sort((a, b) => a.distance - b.distance);

  const combinedFeed = [...pings, ...hazards, ...meetups]
    .filter(item => calculateDistance(userLat, userLng, item.lat, item.lng, useMetric) <= radarRadius)
    .sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
      return timeA - timeB;
    });

  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;
    
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
    
    if (!initialLoadDone.current && combinedFeed.length > 0) {
      container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
      initialLoadDone.current = true;
      return;
    }

    if (isNearBottom) {
      setTimeout(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }, 50);
    }
  }, [pings.length, hazards.length, meetups.length]);

  if (!mounted) return <div className="h-screen bg-black text-lime-500 font-black flex items-center justify-center animate-pulse tracking-widest text-xs uppercase">Booting Radar Node...</div>;

  return (
    <div className="space-y-6 pb-20 font-sans text-zinc-200">
      
      {isNetworkOffline && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-950/45 border-2 border-amber-500/40 text-amber-200 text-xs rounded-xl p-3.5 flex gap-2.5 items-start shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <CloudLightning className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1"><span className="font-bold text-amber-400 block mb-0.5">Cellular Network Offline</span><p>Map routing and location pinging has fallen back to local cache. Transmissions will queue.</p></div>
        </motion.div>
      )}

      {safetyWarning && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-950/45 border-2 border-red-500/40 text-red-200 text-xs rounded-xl p-3.5 flex gap-2.5 items-start shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1"><span className="font-bold text-red-400 block mb-0.5">System Alert</span><p>{safetyWarning}</p></div>
          <button onClick={() => setSafetyWarning(null)} className="min-h-[44px] px-3 text-[10px] text-red-400 hover:text-white uppercase font-bold shrink-0">Dismiss</button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-[#0d0e15] border border-zinc-800 rounded-2xl p-5 shadow-[0_0_20px_rgba(163,230,53,0.05)] relative overflow-hidden flex flex-col justify-between">
          <div className={`absolute top-0 left-0 w-full h-1 ${t.bg}`}></div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-black text-sm tracking-widest flex items-center gap-2 uppercase">
                <Settings className={`w-4 h-4 ${t.text}`} /> SETUP & IDENTITY
              </h3>
            </div>

            <div className="mb-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest flex items-center gap-2">
                {isSharingLocation ? <Navigation className={`w-4 h-4 ${t.text} animate-pulse`} /> : <Navigation className="w-4 h-4 text-zinc-600" />}
                Map Visibility Broadcast
              </span>
              <button 
                onClick={toggleBroadcast} 
                className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors shadow-inner ${isSharingLocation ? t.bg : "bg-zinc-800"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${isSharingLocation ? "translate-x-6" : "translate-x-1"}`}/>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-black border border-zinc-800 p-2 rounded-xl">
                 <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5"><Palette className={`w-3.5 h-3.5 ${t.text}`}/> Theme Sync</span>
                 <div className="flex gap-1.5">
                   <button onClick={() => setTheme('lime')} className={`w-6 h-6 rounded-full bg-[#39ff14] ${theme === 'lime' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                   <button onClick={() => setTheme('cyan')} className={`w-6 h-6 rounded-full bg-cyan-500 ${theme === 'cyan' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                   <button onClick={() => setTheme('emerald')} className={`w-6 h-6 rounded-full bg-emerald-500 ${theme === 'emerald' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                   <button onClick={() => setTheme('amber')} className={`w-6 h-6 rounded-full bg-amber-500 ${theme === 'amber' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                   <button onClick={() => setTheme('rose')} className={`w-6 h-6 rounded-full bg-rose-500 ${theme === 'rose' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                 </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1 font-bold flex justify-between">
                  <span>Callsign</span>
                  <span className="text-rose-500 text-[8px] font-mono flex items-center gap-0.5">
                    <ShieldAlert className="w-2.5 h-2.5"/> MASTER SYNC LOCKED
                  </span>
                </label>
                <input 
                  type="text" 
                  value={callsign} 
                  disabled={true}
                  className={`w-full min-h-[44px] bg-black/20 border text-sm rounded-xl px-3 py-2 outline-none font-bold transition-colors border-zinc-900 text-zinc-500 cursor-not-allowed`} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1 font-bold">Active PEV</label>
                  <select value={pevType} onChange={(e) => setPevType(e.target.value)} className={`w-full min-h-[44px] bg-black border border-zinc-800 text-xs ${t.text} rounded-xl px-2 py-2 outline-none focus:${t.border} font-bold cursor-pointer`}>
                    <option value="Electric Scooter">Scooter</option>
                    <option value="Electric Bike">E-Bike</option>
                    <option value="Electric Trike">Trike</option>
                    <option value="Electric Moped">Moped</option>
                    <option value="EUC / Unicycle">EUC</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1 font-bold">Est. Range ({useMetric ? 'km' : 'mi'})</label>
                  <input type="number" min="0" max="200" value={estRange} onChange={(e) => setEstRange(parseInt(e.target.value) || 0)} className={`w-full min-h-[44px] bg-black border border-zinc-800 text-xs ${t.text} rounded-xl px-3 py-2 outline-none focus:${t.border} font-bold`} />
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-black border border-zinc-800 px-2 py-2 rounded-xl min-h-[44px]">
                <Activity className="w-4 h-4 text-zinc-500 shrink-0" />
                <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)} className="w-full bg-transparent text-[11px] font-mono font-black text-white outline-none cursor-pointer">
                  <option value="Cruising">🟢 Cruising</option>
                  <option value="Off-Roading">🟣 Off-Roading</option>
                  <option value="Group Ride">🚴‍♂️ Group Ride</option>
                  <option value="Taking a Break">☕ Taking a Break</option>
                  <option value="Charging">⚡ Charging</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-300 font-bold flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-rose-500"/> Ghost Mode (Hide Tracking)</span>
                <button onClick={() => handleGhostModeToggle(!isGhostMode)} className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors ${isGhostMode ? "bg-rose-500" : "bg-zinc-800"}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${isGhostMode ? "translate-x-6" : "translate-x-1"}`}/></button>
              </div>
            </div>
          </div>
          <button onClick={saveRadarConfig} className={`mt-4 w-full min-h-[44px] py-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-black uppercase rounded-xl transition-all hover:${t.border}`}>
            {profileSaved ? <span className={t.text}>Radar Config Saved</span> : "Save Telemetry Config"}
          </button>
        </div>

        <div className="bg-[#0d0e15] border border-zinc-800 rounded-2xl p-5 shadow-[0_0_20px_rgba(163,230,53,0.05)] relative overflow-hidden flex flex-col justify-between">
          <div className={`absolute top-0 left-0 w-full h-1 ${t.bg}`}></div>
          <div className="space-y-4">
            <h3 className="text-white font-black text-sm tracking-widest flex items-center gap-2 uppercase">
              <SlidersHorizontal className={`w-4 h-4 ${t.text}`} /> UNIVERSAL SETTINGS
            </h3>

            <div className="flex items-center justify-between bg-black border border-zinc-800 p-2 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Globe className={`w-3.5 h-3.5 ${t.text}`}/> Measurement Units</span>
              <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                <button onClick={() => setUseMetric(false)} className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md transition-colors ${!useMetric ? `${t.bg} text-black font-black` : 'text-zinc-500'}`}>Imperial</button>
                <button onClick={() => setUseMetric(true)} className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md transition-colors ${useMetric ? `${t.bg} text-black font-black` : 'text-zinc-500'}`}>Metric</button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-black border border-zinc-800 p-2 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1.5"><Volume2 className={`w-3.5 h-3.5 ${t.text}`}/> Walkie Auto-Play</span>
              <button onClick={() => setAutoPlayAudio(!autoPlayAudio)} className={`relative inline-flex min-h-[24px] min-w-[42px] items-center rounded-full transition-colors shadow-inner ${autoPlayAudio ? t.bg : "bg-zinc-800"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${autoPlayAudio ? "translate-x-5" : "translate-x-1"}`}/>
              </button>
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono font-black">Satellite Refresh Duty Cycle</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "Ultra (0.5s)", val: 500 },
                  { label: "High (1s)", val: 1000 },
                  { label: "Med (3s)", val: 3000 },
                  { label: "Low (10s)", val: 10000 }
                ].map((cycle) => (
                  <button key={cycle.val} onClick={() => setTelemetryInterval(cycle.val)} className={`py-1.5 text-[8.5px] border rounded-lg uppercase tracking-wide font-black transition-colors ${telemetryInterval === cycle.val ? `${t.bg} text-black border-transparent shadow-md` : 'bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                    {cycle.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono font-black">Comms & Radar Sweep Radius</label>
                 <span className={`text-[10px] font-black ${t.text}`}>{radarRadius} {useMetric ? 'km' : 'mi'}</span>
              </div>
              <input type="range" min="1" max="250" step="1" value={radarRadius} onChange={(e) => setRadarRadius(parseInt(e.target.value))} className={`w-full h-1.5 bg-zinc-800 rounded-lg outline-none accent-current ${t.text}`} />
            </div>

            <div className="pt-2 border-t border-zinc-800/80">
              <form onSubmit={handleSearchLocation} className="relative mt-2">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Target City or Town..." className={`w-full min-h-[44px] bg-black border border-zinc-800 text-xs text-white rounded-xl pl-3 pr-12 py-2.5 outline-none focus:${t.border} transition-colors font-bold`} />
                <button type="submit" disabled={isSearching || !searchQuery} className={`absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center ${t.text} hover:text-white disabled:opacity-50`}>
                  {isSearching ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />}
                </button>
              </form>
            </div>

            {customPin && (
              <div className={`${t.dim} rounded-xl p-3 mb-4 flex flex-col gap-2`}>
                <div className="flex justify-between items-center">
                  <div className="truncate pr-2">
                    <span className="text-xs text-white truncate block mt-0.5 font-bold">🎯 {customPin.name}</span>
                  </div>
                  <button type="button" onClick={() => setCustomPin(null)} className="min-h-[36px] min-w-[36px] flex items-center justify-center bg-black rounded-lg text-zinc-500 hover:text-red-400 shrink-0"><X className="w-4 h-4"/></button>
                </div>
              </div>
            )}

          </div>
          
          <button onClick={recenterMap} className={`mt-4 w-full min-h-[44px] py-2.5 rounded-xl font-black uppercase tracking-widest text-xs bg-zinc-900 text-white border border-zinc-700 transition-all hover:${t.border} flex justify-center items-center gap-2 shadow-inner`}>
             <Crosshair className="w-4 h-4"/> Snap Map to Hardware Location
          </button>
        </div>

        <div className="bg-[#0d0e15] border border-zinc-800 rounded-2xl p-5 shadow-[0_0_20px_rgba(163,230,53,0.05)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-rose-500"></div>
          <div>
            <h3 className="text-white font-black text-sm tracking-widest flex items-center gap-2 mb-4 uppercase">
              <Radar className="w-4 h-4 text-amber-400 animate-pulse" /> NETWORK OPS
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={() => handleSendPing("⚡ Need a Charge Station")} className={`min-h-[44px] py-1.5 bg-black border border-zinc-800 hover:${t.border} text-zinc-300 ${t.hover} text-[9px] font-black rounded-xl uppercase transition-colors`}>
                  ⚡ Need Charge
                </button>
                <button onClick={() => handleSendPing("☕ Taking a Pit Stop")} className={`min-h-[44px] py-1.5 bg-black border border-zinc-800 hover:${t.border} text-zinc-300 ${t.hover} text-[9px] font-black rounded-xl uppercase transition-colors`}>
                  ☕ Pit Stop
                </button>
                <button onClick={() => handleSendPing("🌲 Trail is Clear")} className={`min-h-[44px] py-1.5 bg-black border border-zinc-800 hover:${t.border} text-zinc-300 ${t.hover} text-[9px] font-black rounded-xl uppercase transition-colors`}>
                  🌲 Clear Trail
                </button>
                <button onClick={() => handleSendPing("🛑 Hazard Up Ahead")} className="min-h-[44px] py-1.5 bg-black border border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 text-[9px] font-black rounded-xl uppercase transition-colors">
                  🛑 Hazard Ahead
                </button>
              </div>

              {isSettingMeetup ? (
                <div className="flex gap-2">
                  <input type="text" value={meetupDesc} onChange={(e) => setMeetupDesc(e.target.value)} placeholder="Meetup Tag..." className={`flex-1 min-h-[44px] bg-black border border-zinc-800 text-xs text-white rounded-xl px-3 outline-none focus:border-amber-500 font-bold`} />
                  <button onClick={handleProposeMeetup} className="min-w-[50px] min-h-[44px] bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black rounded-xl transition-colors">SET</button>
                  <button onClick={() => setIsSettingMeetup(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-zinc-800 text-white rounded-xl"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <button onClick={() => setIsSettingMeetup(true)} disabled={!customPin} className="w-full min-h-[44px] py-2 bg-black border border-zinc-800 hover:border-amber-500/50 text-amber-400 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-2 disabled:opacity-40 transition-colors">
                  <Flag className="w-4 h-4" /> Deploy Meetup at Target Pin
                </button>
              )}

              {isSettingHazard ? (
                <div className="flex gap-2">
                  <select value={hazardType} onChange={(e) => setHazardType(e.target.value)} className="flex-1 min-h-[44px] bg-black border border-zinc-800 text-xs text-yellow-500 rounded-xl px-2 outline-none font-bold cursor-pointer">
                    <option value="🕳️ Pothole / Washout">Pothole/Washout</option>
                    <option value="🐕 Loose Animal">Loose Animal</option>
                    <option value="🚧 Roadwork">Roadwork</option>
                    <option value="🚔 Speed Trap">Speed Trap</option>
                  </select>
                  <button onClick={handleDropHazard} className="min-w-[50px] min-h-[44px] bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black rounded-xl transition-colors">SET</button>
                  <button onClick={() => setIsSettingHazard(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-zinc-800 text-white rounded-xl"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <button onClick={() => setIsSettingHazard(true)} disabled={!customPin} className="w-full min-h-[44px] py-2 bg-black border border-zinc-800 hover:border-yellow-500/50 text-yellow-500 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-2 disabled:opacity-40 transition-colors">
                  <AlertTriangle className="w-4 h-4" /> Mark Hazard at Target Pin
                </button>
              )}

              <button onClick={handleSendSOS} className="w-full min-h-[44px] py-2 bg-red-950/30 border border-red-900 hover:bg-red-900/50 text-red-500 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-2 transition-colors">
                <AlertOctagon className="w-4 h-4 animate-pulse" /> Broadcast S.O.S
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-[#0d0e15] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-2xl relative">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
               <Filter className={`w-4 h-4 ${t.text}`} />
               <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Map Render Targets</span>
            </div>
            <div className="flex flex-wrap gap-2">
               <button onClick={() => setShowRiders(!showRiders)} className={`min-h-[36px] px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${showRiders ? t.dim : 'bg-black text-zinc-500 border border-zinc-800'}`}>Riders</button>
               <button onClick={() => setShowMeetups(!showMeetups)} className={`min-h-[36px] px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${showMeetups ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-black text-zinc-500 border border-zinc-800'}`}>Meetups</button>
               <button onClick={() => setShowHazards(!showHazards)} className={`min-h-[36px] px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${showHazards ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-black text-zinc-500 border border-zinc-800'}`}>Hazards</button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-zinc-800 relative bg-black h-[500px]">
            
            <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-xl pointer-events-none">
              <span className={`text-[9px] ${t.text} font-bold uppercase tracking-widest block mb-2 font-mono`}>Location Metrics</span>
              <div className="flex items-center gap-4 text-xs font-bold text-white">
                <div className="flex items-center gap-1.5"><MousePointerClick className="w-3.5 h-3.5 text-zinc-400" /> Tap map & Lock Target</div>
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
              className={`absolute top-4 right-4 z-[400] ${t.bg} text-black font-black text-[10px] px-4 py-3 rounded-xl uppercase shadow-lg border-2 border-black flex items-center gap-2 transition-transform active:scale-95`}
            >
              <LocateFixed className="w-4 h-4" /> Lock Center
            </button>

            <div ref={mapContainerRef} className="w-full h-full z-10" />
            
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 bg-black/80 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-xl flex flex-wrap justify-center sm:justify-start gap-3 text-[10px] font-mono font-bold text-zinc-300 shadow-xl">
              <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${t.bg}`} /> You / Target</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> E-Bike</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Scooter</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> EUC</div>
              <div className="flex items-center gap-1.5"><span className="text-sm leading-none">🚩</span> Meetup</div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="bg-[#0d0e15] border border-zinc-800 rounded-2xl p-4 flex flex-col h-[260px] shadow-2xl">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
              <Users className={`w-4 h-4 ${t.text} animate-pulse`} /> LIVE PILOTS ({sortedRiders.length})
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {sortedRiders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">No Active Pilots in Radius</span>
                </div>
              ) : (
                sortedRiders.map((rider) => {
                  const isLive = (Date.now() - (rider.lastUpdated || Date.now())) < 60000 * 5; 
                  return (
                    <div key={rider.id} className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate mb-0.5">{rider.name}</div>
                        <span className="text-[9px] text-zinc-400 font-mono font-bold truncate flex items-center gap-1.5">
                          {isLive ? <span className={`w-1.5 h-1.5 rounded-full ${t.bg} animate-pulse`} /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
                          💨 {useMetric ? `${(rider.speed * 1.60934).toFixed(1)} KM/H` : `${(rider.speed || 0).toFixed(1)} MPH`}
                        </span>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-black font-mono ${t.text}`}>{rider.distance < 0.1 ? "HERE" : `${rider.distance.toFixed(1)}${useMetric ? 'km' : 'mi'}`}</span>
                        <button onClick={() => handleZoomTo(rider.lat, rider.lng)} className={`min-h-[28px] px-2 flex items-center justify-center gap-1 text-[9px] font-black ${t.text} hover:text-white uppercase rounded-md ${t.dim} transition-colors`}><MapPin className="w-3 h-3"/> Locate</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#0d0e15] border border-zinc-800 rounded-2xl p-4 flex flex-col flex-1 min-h-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-3 shrink-0">
               <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5 font-mono">
                 <RadioReceiver className="w-4 h-4 text-cyan-400 animate-pulse" /> COMMS NETWORK
               </span>
               <button onClick={() => setAutoPlayAudio(!autoPlayAudio)} className={`p-1.5 rounded border transition-colors ${autoPlayAudio ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`} title="Auto-Play Audio">
                 {autoPlayAudio ? <Volume2 className="w-3 h-3"/> : <VolumeX className="w-3 h-3"/>}
               </button>
            </div>
            
            <div ref={feedContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4 flex flex-col">
              {combinedFeed.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 m-auto">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Signal Empty in Radius</span>
                </div>
              ) : (
                <>
                  {combinedFeed.map((item: any) => {
                    if (item.description) {
                      return (
                        <div key={item.id} className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] font-black text-amber-400 uppercase font-mono">🚩 Meetup: {item.setBy}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-amber-600">{getTimeAgo(item.timestamp)}</span>
                              <button onClick={() => handleGlobalDelete(item)} className="text-amber-600 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3"/></button>
                            </div>
                          </div>
                          <p className="text-xs text-white font-bold truncate">{item.description}</p>
                          <button onClick={() => handleZoomTo(item.lat, item.lng)} className="min-h-[36px] w-full text-[9px] text-amber-500 hover:text-amber-300 mt-2 uppercase font-black bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-900/50 transition-colors">Locate on Map</button>
                        </div>
                      )
                    }

                    if (item.type && (item.type.includes("🕳️") || item.type.includes("🚧") || item.type.includes("🐕") || item.type.includes("🚔"))) {
                      return (
                        <div key={item.id} className="p-2.5 rounded-xl bg-yellow-950/20 border border-yellow-900/40 flex flex-col">
                          <span className="text-[9px] font-black text-yellow-500 uppercase font-mono flex justify-between items-center">
                            <span>⚠️ Hazard: {item.reporter}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-yellow-600">{getTimeAgo(item.timestamp)}</span>
                              <button onClick={() => handleGlobalDelete(item)} className="text-yellow-600 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3"/></button>
                            </div>
                          </span>
                          <p className="text-xs text-white mt-0.5 font-bold truncate">{item.type}</p>
                          <button onClick={() => handleZoomTo(item.lat, item.lng)} className="min-h-[36px] w-full text-[9px] text-yellow-500 hover:text-yellow-300 mt-2 uppercase font-black bg-yellow-950/40 px-2 py-1 rounded-lg border border-yellow-900/50 transition-colors">Locate</button>
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
                      <div key={item.id} className={`p-3 rounded-xl border ${item.type === 'sos' ? 'bg-red-950/30 border-red-900/50' : 'bg-black border-zinc-800'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1.5">
                            {item.type !== 'sos' && <span className={`w-2 h-2 rounded-full ${colorClass}`} />}
                            <span className={`text-[10px] font-black uppercase font-mono ${item.type === 'sos' ? 'text-red-400' : 'text-zinc-400'}`}>
                              {item.type === 'sos' ? '🚨 SOS' : item.sender}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-mono ${item.type === 'sos' ? 'text-red-500' : 'text-zinc-600'}`}>{getTimeAgo(item.timestamp)}</span>
                            <button onClick={() => handleGlobalDelete(item)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3"/></button>
                          </div>
                        </div>
                        
                        {item.audioData ? (
                          <div className="mt-2 w-full">
                            <audio controls src={item.audioData} className="w-full h-8 outline-none rounded" controlsList="nodownload noplaybackrate" />
                          </div>
                        ) : (
                          <p className={`text-[13px] leading-relaxed font-bold break-words ${item.type === 'sos' ? 'text-red-300' : 'text-white'}`}>{item.message}</p>
                        )}
                        
                        {item.imageUrl && (
                          <div className="mt-2 w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                            <img src={item.imageUrl} alt="Ping Attachment" className="w-full h-auto object-cover max-h-[200px]" />
                          </div>
                        )}

                        {item.lat !== 0 && item.lng !== 0 && (
                          <button onClick={() => handleZoomTo(item.lat, item.lng)} className="mt-2 text-[9px] text-zinc-500 hover:text-white uppercase font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3"/> View Pin
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={feedEndRef} />
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-zinc-800/80 shrink-0">
              
              {pingImage && (
                <div className="relative inline-block w-16 h-16 rounded-xl overflow-hidden border border-lime-500 shadow-md">
                  <img src={pingImage} alt="Attachment" className="w-full h-full object-cover" />
                  <button onClick={() => setPingImage(null)} className="absolute top-1 right-1 bg-black/80 rounded-full p-0.5 text-white hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <button 
                  onClick={() => imageInputRef.current?.click()} 
                  disabled={isUploadingImg}
                  className={`min-h-[44px] min-w-[44px] bg-[#121318] hover:bg-zinc-800 border border-zinc-800 text-zinc-500 ${t.hover} rounded-xl flex items-center justify-center transition-colors disabled:opacity-50`}
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
                  className={`flex-1 min-h-[44px] min-w-0 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-[13px] font-medium text-white outline-none focus:${t.border} transition-colors`}
                />
                
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`min-h-[44px] min-w-[50px] shrink-0 border border-zinc-800 rounded-xl font-black flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 text-black border-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50'}`}
                  title="Hold to Transmit Voice"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => handleSendPing()} 
                  disabled={!pingMessage.trim() && !pingImage} 
                  className={`min-h-[44px] min-w-[50px] shrink-0 ${t.bg} disabled:opacity-30 text-black px-3 rounded-xl font-black uppercase flex items-center justify-center transition-all ${t.shadow}`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}