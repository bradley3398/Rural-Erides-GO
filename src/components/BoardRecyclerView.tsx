"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchWithRetry } from "../services/CoPilotService";
import { locationService } from "../services/LocationService";
import { LocalNotifications } from '@capacitor/local-notifications';

// --- FIREBASE IMPORTS ---
import { 
  collection, query, onSnapshot, doc, updateDoc, increment, 
  serverTimestamp, deleteDoc, addDoc, setDoc 
} from "firebase/firestore";
import { db } from "../services/firebase"; 

// --- MODULAR WIDGETS ---
import FeedPost from "./BoardWidgets/FeedPost";
import SectorStandings from "./BoardWidgets/SectorStandings";
import UserProfileModal from "./BoardWidgets/UserProfileModal";
import DirectMessagesModal from "./BoardWidgets/DirectMessagesModal";
import PostComposer from "./BoardWidgets/PostComposer";
import BoardSettingsModal from "./BoardWidgets/BoardSettingsModal";

// --- ICONS & ANIMATIONS ---
import { 
  Globe, Bell, Mail, Search, Users, Zap, Bookmark, AlertTriangle, 
  ShoppingBag, Flame, Settings, X, WifiOff, CheckCheck, Send 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- CAPACITOR NATIVE HARDWARE PLUGINS ---
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Network as CapNetwork } from '@capacitor/network';
import { Haptics } from '@capacitor/haptics';

const CATEGORIES = ["Universal Feed", "Hardware Diagnostics", "Custom Builds", "Trail Reports", "Marketplace", "Video Requests", "Trail Rescue Bounty", "🚨 STOLEN PEV ALERT"];
const PEV_TYPES = ["Class 1 E-Bike", "Class 2 E-Bike", "Class 3 E-Bike", "Electric Scooter", "Electric Moped", "Electric Unicycle", "Electric Trike", "Onewheel"];
const CONDITION_TYPES = ["Brand New", "Like New", "Used - Good", "For Parts / Repair"];

const PEV_TEMPLATES = [
  { id: "none", name: "Standard Matrix", bgUrl: null, css: "bg-black/80 border-white/10 shadow-xl", icon: "⬛ CORE MATRIX", badgeBg: "bg-white/10 text-zinc-300 border-white/10" },
  { id: "rural", name: "🌾 Rural Vibe", bgUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop", css: "border-lime-500/40 shadow-lg", icon: "🌾 RURAL VIBE", badgeBg: "bg-lime-500/20 text-lime-300 border-lime-500/40" },
  { id: "trail", name: "🌲 Forest Singletrack", bgUrl: "https://images.unsplash.com/photo-1511497584788-876761142197?q=80&w=1000&auto=format&fit=crop", css: "border-amber-500/40 shadow-lg", icon: "🌲 MUD & GRAVEL", badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { id: "speed", name: "⚡ Full Throttle Red", bgUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop", css: "border-red-500/40 shadow-lg", icon: "⚡ MAX VELOCITY", badgeBg: "bg-red-500/20 text-red-300 border-red-500/40" },
  { id: "garage", name: "🔧 Carbon Workshop", bgUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1000&auto=format&fit=crop", css: "border-zinc-500/40 shadow-lg", icon: "🔧 BUILD LOG", badgeBg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" },
  { id: "night", name: "🌙 Night Asphalt", bgUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop", css: "border-purple-500/40 shadow-lg", icon: "🌙 NIGHT OPS", badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  { id: "sunset", name: "🌅 Sunset Cruise", bgUrl: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=1000&auto=format&fit=crop", css: "border-orange-500/40 shadow-lg", icon: "🌅 GOLDEN HOUR", badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  { id: "request", name: "🎥 Channel Request", bgUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop", css: "border-blue-500/40 shadow-lg", icon: "🎥 CHANNEL REQUEST", badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  { id: "market", name: "🏷️ PEV Marketplace", bgUrl: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1000&auto=format&fit=crop", css: "border-emerald-500/40 shadow-lg", icon: "🏷️ PEV MARKETPLACE", badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { id: "cyber", name: "🌆 Cyberpunk Grid", bgUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop", css: "border-cyan-500/40 shadow-lg", icon: "🌆 NEON CITY", badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
  { id: "mountain", name: "⛰️ Alpine Peak", bgUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop", css: "border-blue-500/40 shadow-lg", icon: "⛰️ HIGH ALTITUDE", badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  { id: "snow", name: "❄️ Winter Frost", bgUrl: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=1000&auto=format&fit=crop", css: "border-sky-500/40 shadow-lg", icon: "❄️ SUB-ZERO", badgeBg: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  { id: "desert", name: "🏜️ Mojave Dunes", bgUrl: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=1000&auto=format&fit=crop", css: "border-orange-500/40 shadow-lg", icon: "🏜️ DESERT HEAT", badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  { id: "ocean", name: "🌊 Coastal Highway", bgUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=1000&auto=format&fit=crop", css: "border-teal-500/40 shadow-lg", icon: "🌊 COASTAL RUN", badgeBg: "bg-teal-500/20 text-teal-300 border-teal-500/40" },
  { id: "industrial", name: "🏗️ Factory Zone", bgUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1000&auto=format&fit=crop", css: "border-zinc-500/40 shadow-lg", icon: "🏗️ INDUSTRIAL", badgeBg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" },
  { id: "neon", name: "🕹️ Neon Synthwave", bgUrl: "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=1000&auto=format&fit=crop", css: "border-fuchsia-500/40 shadow-lg", icon: "🕹️ SYNTHWAVE", badgeBg: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40" },
  { id: "mud", name: "🚵 Muddy Trail", bgUrl: "https://images.unsplash.com/photo-1519065960925-fb35f52f829f?q=80&w=1000&auto=format&fit=crop", css: "border-amber-700/40 shadow-lg", icon: "🚵 DIRT RUN", badgeBg: "bg-amber-700/20 text-amber-500 border-amber-700/40" },
  { id: "urban", name: "🏢 Urban Concrete", bgUrl: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1000&auto=format&fit=crop", css: "border-stone-500/40 shadow-lg", icon: "🏢 CITY STREETS", badgeBg: "bg-stone-500/20 text-stone-300 border-stone-500/40" },
  { id: "rain", name: "🌧️ Rainy Night", bgUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000&auto=format&fit=crop", css: "border-indigo-500/40 shadow-lg", icon: "🌧️ RAIN DELAY", badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
  { id: "canyon", name: "🏜️ Canyon Run", bgUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop", css: "border-red-600/40 shadow-lg", icon: "🏜️ RED ROCKS", badgeBg: "bg-red-600/20 text-red-400 border-red-600/40" },
  { id: "bridge", name: "🌉 Bridge Crossing", bgUrl: "https://images.unsplash.com/photo-1513352763321-df13b28b577a?q=80&w=1000&auto=format&fit=crop", css: "border-yellow-500/40 shadow-lg", icon: "🌉 SUSPENSION", badgeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  { id: "track", name: "🏁 Race Track", bgUrl: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?q=80&w=1000&auto=format&fit=crop", css: "border-zinc-300/40 shadow-lg", icon: "🏁 CIRCUIT", badgeBg: "bg-zinc-300/20 text-zinc-100 border-zinc-300/40" },
  { id: "deepforest", name: "🌳 Deep Forest", bgUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop", css: "border-green-600/40 shadow-lg", icon: "🌳 TIMBERLAND", badgeBg: "bg-green-600/20 text-green-400 border-green-600/40" },
  { id: "storm", name: "⛈️ Stormy Skies", bgUrl: "https://images.unsplash.com/photo-1475116127127-e3ce09ce0496?q=80&w=1000&auto=format&fit=crop", css: "border-slate-500/40 shadow-lg", icon: "⛈️ THUNDERCELL", badgeBg: "bg-slate-500/20 text-slate-300 border-slate-500/40" }
];

const getYoutubeId = (url: string) => {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getTimeMs = (ts: any) => {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number, useMetric: boolean): number {
  const R = useMetric ? 6371.0 : 3958.8; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DISALLOWED_KEYWORDS = ["abuse", "idiot", "jerk", "asshole", "bitch", "crap", "damn", "fuck", "shit", "bastard", "trash", "hate", "kill", "stupid", "moron", "spam", "scam"];
function checkContentSafety(text: string): { safe: boolean; blockedWord?: string } {
  const normalized = text.toLowerCase();
  for (const word of DISALLOWED_KEYWORDS) {
    if (normalized.includes(word)) return { safe: false, blockedWord: word };
  }
  return { safe: true };
}

interface BoardProps {
  theme?: string;
  useMetric?: boolean;
  ghostMode?: boolean;
  satelliteMap?: boolean;
  locale?: string;
  timeFormat?: string;
  performanceMode?: boolean;
  uiScale?: string;
  globalVolume?: number;
  callsign?: string;
  prefilledPost?: { text: string; userBadge: string } | null;
  onClearPrefilled?: () => void;
}

export default function UnifiedCommunityBoard(props: BoardProps) {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [username, setUsername] = useState<string>(() => {
    if (props.callsign) return props.callsign;
    if (typeof window !== 'undefined') return localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name") || "Lord Bradley Callison";
    return "Lord Bradley Callison";
  });

  useEffect(() => {
    if (props.callsign) setUsername(props.callsign);
  }, [props.callsign]);

  const [pfpUrl, setPfpUrl] = useState<string>("");
  const [userFleet, setUserFleet] = useState<string>("");
  const [userBio, setUserBio] = useState<string>("");
  const [useMetric, setUseMetric] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const [dataSaverMode, setDataSaverMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("rural_data_saver") === "true";
    return false;
  });
  
  const [defaultPostCategory, setDefaultPostCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("rural_default_category") || "Universal Feed";
    return "Universal Feed";
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeProfileUser, setActiveProfileUser] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  
  const [friends, setFriends] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined') return JSON.parse(localStorage.getItem("rural_friends") || "[]");
    } catch(e) {}
    return [];
  });

  const [isAppOnline, setIsAppOnline] = useState<boolean>(true);
  const [deviceNetworkType, setDeviceNetworkType] = useState("Online");
  const [deviceBattLevel, setDeviceBattLevel] = useState<number | null>(null);
  const [isDictating, setIsDictating] = useState(false);

  const getTheme = () => {
    const baseTheme = props.theme || 'lime';
    const perf = props.performanceMode;
    const themes: Record<string, any> = {
      lime: { id: 'lime', name: 'Neon Protocol', primary: 'bg-[#39ff14]', bg: 'bg-[#39ff14]', hover: 'hover:bg-[#32e011]', text: 'text-[#39ff14]', border: 'border-[#39ff14]', glow: perf ? '' : 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', bgSubtle: 'bg-[#39ff14]/10', borderSubtle: 'border-[#39ff14]/30', blur: perf ? 'bg-black/95' : 'bg-black/40 backdrop-blur-2xl' },
      cyan: { id: 'cyan', name: 'Cyber Cyan', primary: 'bg-cyan-500', bg: 'bg-cyan-500', hover: 'hover:bg-cyan-400', text: 'text-cyan-400', border: 'border-cyan-500', glow: perf ? '' : 'shadow-[0_0_20px_rgba(6,182,212,0.3)]', bgSubtle: 'bg-cyan-950/30', borderSubtle: 'border-cyan-900/50', blur: perf ? 'bg-black/95' : 'bg-black/40 backdrop-blur-2xl' },
      emerald: { id: 'emerald', name: 'Emerald City', primary: 'bg-emerald-500', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500', glow: perf ? '' : 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', bgSubtle: 'bg-emerald-950/30', borderSubtle: 'border-emerald-900/50', blur: perf ? 'bg-black/95' : 'bg-black/40 backdrop-blur-2xl' },
      amber: { id: 'amber', name: 'Warning Amber', primary: 'bg-amber-400', bg: 'bg-amber-400', hover: 'hover:bg-amber-300', text: 'text-amber-400', border: 'border-amber-400', glow: perf ? '' : 'shadow-[0_0_20px_rgba(251,191,36,0.3)]', bgSubtle: 'bg-amber-950/30', borderSubtle: 'border-amber-900/50', blur: perf ? 'bg-black/95' : 'bg-black/40 backdrop-blur-2xl' },
      rose: { id: 'rose', name: 'Danger Rose', primary: 'bg-rose-500', bg: 'bg-rose-500', hover: 'hover:bg-rose-400', text: 'text-rose-400', border: 'border-rose-500', glow: perf ? '' : 'shadow-[0_0_20px_rgba(244,63,94,0.3)]', bgSubtle: 'bg-rose-950/30', borderSubtle: 'border-rose-900/50', blur: perf ? 'bg-black/95' : 'bg-black/40 backdrop-blur-2xl' },
      purple: { id: 'purple', name: 'Synth Purple', primary: 'bg-purple-500', bg: 'bg-purple-500', hover: 'hover:bg-purple-400', text: 'text-purple-400', border: 'border-purple-500', glow: perf ? '' : 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', bgSubtle: 'bg-purple-950/30', borderSubtle: 'border-purple-900/50', blur: perf ? 'bg-black/95' : 'bg-black/40 backdrop-blur-2xl' },
      void: { id: 'void', name: 'Void Black', primary: 'bg-zinc-100', bg: 'bg-zinc-800', hover: 'hover:bg-zinc-700', text: 'text-white', border: 'border-zinc-500', glow: perf ? '' : 'shadow-[0_0_20px_rgba(255,255,255,0.1)]', bgSubtle: 'bg-zinc-900/50', borderSubtle: 'border-zinc-700/50', blur: perf ? 'bg-black/95' : 'bg-black/90 backdrop-blur-3xl' }
    };
    return themes[baseTheme] || themes.lime;
  };
  const t = getTheme();

  const fontScaleMap = { compact: "text-[13px]", normal: "text-[15px]", large: "text-[17px]" };
  const scaleClass = fontScaleMap[props.uiScale as keyof typeof fontScaleMap] || "text-[15px]";

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [postCategory, setPostCategory] = useState(defaultPostCategory);
  const [pevType, setPevType] = useState("Electric Scooter");
  const [postTemplate, setPostTemplate] = useState("none");
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [isHelpNeeded, setIsHelpNeeded] = useState(false);

  const [itemPrice, setItemPrice] = useState("");
  const [itemCondition, setItemCondition] = useState("Like New");
  const [modTags, setModTags] = useState("");

  const [feedView, setFeedView] = useState<"universal" | "saved" | "class" | "help" | "Marketplace" | "Video Requests" | "crew">("universal");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "trending">("newest");
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [topSpeed, setTopSpeed] = useState("");
  const [motorTemp, setMotorTemp] = useState("");

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<{id: number, text: string, votes: number}[]>([{ id: 1, text: "", votes: 0 }, { id: 2, text: "", votes: 0 }]);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pfpInputRef = useRef<HTMLInputElement>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiRunningId, setAiRunningId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifiedIds = useRef<Set<string>>(new Set());

  const [dms, setDms] = useState<any[]>([]);
  const [unreadDms, setUnreadDms] = useState(0);
  const [showInbox, setShowInbox] = useState(false);
  const [activeDMUser, setActiveDMUser] = useState<string | null>(null);
  const [newChatTarget, setNewChatTarget] = useState("");
  const [inboxSearch, setInboxSearch] = useState<string>("");

  const triggerHaptic = async (style: any = "LIGHT") => {
    try {
      if (Capacitor.isPluginAvailable('Haptics')) await Haptics.impact({ style });
      else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(style === "HEAVY" ? 50 : 15);
    } catch (e) {}
  };

  const triggerPush = async (title: string, body: string) => {
    try {
      if (Capacitor.isPluginAvailable('LocalNotifications')) {
        await LocalNotifications.schedule({
          notifications: [{ title, body, id: Math.floor(Math.random() * 100000), schedule: { at: new Date(Date.now() + 100) } }]
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch (e) {}
  };

  const toggleVoiceDictation = () => {
    triggerHaptic("LIGHT");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice recognition core not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsDictating(true);
    recognition.onresult = (event: any) => {
      const transcribed = event.results[0][0].transcript;
      setPostText(prev => prev ? `${prev} ${transcribed}` : transcribed);
      triggerHaptic("HEAVY");
    };
    recognition.onerror = () => setIsDictating(false);
    recognition.onend = () => setIsDictating(false);
    recognition.start();
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setIsAppOnline(navigator.onLine);
      const handleOnline = () => setIsAppOnline(true);
      const handleOffline = () => setIsAppOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); }
    }
  }, []);

  useEffect(() => {
    if (!props.callsign) {
      setUsername(localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name") || "Lord Bradley Callison");
    }
    setPfpUrl(localStorage.getItem("rural_erides_pfp") || "");
    setUserFleet(localStorage.getItem("rural_erides_fleet") || "");
    setUserBio(localStorage.getItem("rural_erides_bio") || "");
    setUseMetric(localStorage.getItem("rt_use_metric") === "true");
    setPrivacyMode(localStorage.getItem("rt_privacy_mode") === "true");
    setPostText(localStorage.getItem("rural_post_draft") || "");
    
    try {
      const saved = localStorage.getItem("rural_post_bookmarks");
      if (saved) { const parsed = JSON.parse(saved); if(Array.isArray(parsed)) setSavedPosts(parsed); }
      const flagged = localStorage.getItem("rural_post_flags");
      if (flagged) { const parsed = JSON.parse(flagged); if(Array.isArray(parsed)) setFlaggedIds(parsed); }
    } catch(e) {}

    const initDeviceHardware = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const batt = await Device.getBatteryInfo();
          if (batt.batteryLevel !== undefined) setDeviceBattLevel(Math.round(batt.batteryLevel * 100));
          const net = await CapNetwork.getStatus();
          setDeviceNetworkType(net.connectionType || "Mobile");
        }
      } catch (e) {}
    };
    initDeviceHardware();

    try {
      const q = query(collection(db, "board_posts"));
      const unsubPosts = onSnapshot(q, (snapshot) => {
        const loadedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadedPosts.sort((a: any, b: any) => getTimeMs(b.timestamp_epoch) - getTimeMs(a.timestamp_epoch));
        setPosts(loadedPosts);
      });
      return () => { unsubPosts(); };
    } catch (e) {}
  }, [props.callsign]);

  useEffect(() => {
    if (!username) return;
    try {
      setDoc(doc(db, "user_profiles", username), { pfpUrl, userFleet, userBio, lastActive: serverTimestamp() }, { merge: true });
    } catch (e) {}
  }, [username, pfpUrl, userFleet, userBio]);

  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "user_profiles"), (snap) => {
        const profs: Record<string, any> = {};
        snap.forEach(d => { profs[d.id] = d.data(); });
        setUserProfiles(profs);
      });
      return unsub;
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!username) return;
    try {
      const q = query(collection(db, "user_notifications"));
      const unsub = onSnapshot(q, (snap) => {
        const notifs = snap.docs.map(d => ({id: d.id, ...d.data()})).filter((n: any) => n.recipient === username);
        notifs.sort((a: any, b: any) => getTimeMs(b.timestamp) - getTimeMs(a.timestamp));
        setNotifications(notifs);
        
        let unreadCount = 0;
        notifs.forEach(n => {
          if (!n.read) {
            unreadCount++;
            if (!notifiedIds.current.has(n.id) && n.sender !== username) {
              notifiedIds.current.add(n.id);
              triggerPush("Rural Network Ping", `${n.sender} ${n.content}`);
            }
          }
        });
        setUnreadNotifs(unreadCount);
      });
      return unsub;
    } catch (e) {}
  }, [username]);

  useEffect(() => {
    if (!username) return;
    try {
      const q = query(collection(db, "direct_messages"));
      const unsub = onSnapshot(q, (snap) => {
        const allDms = snap.docs.map(d => ({id: d.id, ...d.data()})).filter((m: any) => m.participants && m.participants.includes(username));
        allDms.sort((a: any, b: any) => getTimeMs(a.timestamp) - getTimeMs(b.timestamp));
        setDms(allDms);
        
        let unreadCount = 0;
        allDms.forEach(m => {
          if (m.sender !== username && (!m.readBy || !m.readBy.includes(username))) {
            unreadCount++;
            if (!notifiedIds.current.has(m.id)) {
              notifiedIds.current.add(m.id);
              triggerPush(`Secure Comms: ${m.sender}`, m.text);
            }
          }
        });
        setUnreadDms(unreadCount);
      });
      return unsub;
    } catch (e) {}
  }, [username]);

  const handleMediaPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerHaptic("LIGHT");
      setVideoFile(null); setVideoPreview(null);
      setMediaFile(e.target.files[0]);
      setMediaPreview(URL.createObjectURL(e.target.files[0]));
      setIsComposerOpen(true);
    }
  };

  const handleCameraSnap = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerHaptic("LIGHT");
      setVideoFile(null); setVideoPreview(null);
      setMediaFile(e.target.files[0]);
      setMediaPreview(URL.createObjectURL(e.target.files[0]));
      setIsComposerOpen(true);
    }
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerHaptic("LIGHT");
      setMediaFile(null); setMediaPreview(null);
      setVideoFile(e.target.files[0]);
      setVideoPreview(URL.createObjectURL(e.target.files[0]));
      setIsComposerOpen(true);
    }
  };

  const handlePfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("image", file);
      const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY as string;
      try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          setPfpUrl(data.data.url);
          localStorage.setItem("rural_erides_pfp", data.data.url);
          triggerHaptic("HEAVY");
        }
      } catch (err) { alert("Avatar gateway fault."); }
    }
  };

  const toggleBookmark = (postId: string) => {
    triggerHaptic("LIGHT");
    setSavedPosts(prev => {
      const isSaved = prev.includes(postId);
      const newSaved = isSaved ? prev.filter(id => id !== postId) : [...prev, postId];
      localStorage.setItem("rural_post_bookmarks", JSON.stringify(newSaved));
      return newSaved;
    });
  };

  const handleFlagPost = (postId: string) => {
    setFlaggedIds(prev => {
      const newFlags = [...prev, postId];
      localStorage.setItem("rural_post_flags", JSON.stringify(newFlags));
      return newFlags;
    });
  };

  const enhanceWithAI = () => {
    if (!postText.trim()) return;
    triggerHaptic("LIGHT");
    setIsEnhancing(true);
    setTimeout(() => {
      setPostText(prev => prev.trim() + "\n\n⚡ Ride safe and keep carving! What is everyone else riding today?");
      setIsEnhancing(false);
      triggerHaptic("HEAVY");
    }, 1000);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !postText.trim()) return;

    const nameSafety = checkContentSafety(username);
    if (!nameSafety.safe) return setSafetyWarning("Rider Callsign contains an inappropriate term.");
    const messageSafety = checkContentSafety(postText);
    if (!messageSafety.safe) return setSafetyWarning(`Transmission contains restricted term ("${messageSafety.blockedWord}").`);
    
    setSafetyWarning(null);
    setIsPublishing(true);
    triggerHaptic("HEAVY");
    
    try {
      let imageUrl = null;
      let finalVideoUrl = null;
      let ytbId = youtubeUrl ? getYoutubeId(youtubeUrl) : null;

      if (mediaFile) {
        const formData = new FormData();
        formData.append("image", mediaFile);
        const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY as string; 
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) imageUrl = data.data.url; 
        else throw new Error("Image server rejected file.");
      }

      if (videoFile) finalVideoUrl = videoPreview;

      let pollData = null;
      if (showPollBuilder && pollQuestion.trim()) {
        const validOptions = pollOptions.filter(o => o.text.trim());
        if (validOptions.length >= 2) pollData = { question: pollQuestion.trim(), options: validOptions, votedUsers: [] };
      }

      let marketData = null;
      if (postCategory === "Marketplace" || postTemplate === "market") {
        marketData = { price: itemPrice.trim() || "Trade / Offer", condition: itemCondition };
      }

      const locUpdate = locationService.getCurrentUpdate();

      await addDoc(collection(db, "board_posts"), {
        username: username.trim(),
        pfpUrl: pfpUrl || null,
        fleetSignature: userFleet || null,
        content: postText.trim(),
        category: postCategory,
        pevType: pevType,
        template: postTemplate,
        imageUrl: imageUrl,
        videoUrl: finalVideoUrl,
        isHelpNeeded: isHelpNeeded,
        youtubeId: ytbId,
        poll: pollData,
        marketplace: marketData,
        modTags: modTags ? modTags.split(',').map(t => t.trim()).filter(Boolean) : [],
        location: locUpdate ? { lat: locUpdate.lat, lng: locUpdate.lng } : null,
        telemetry: privacyMode ? null : { speed: topSpeed ? `${topSpeed} ${useMetric ? 'km/h' : 'mph'}` : null, temp: motorTemp ? `${motorTemp} °C` : null },
        volts: 0,
        reactions: { fire: 0, zap: 0, skull: 0, battery: 0 },
        comments: [],
        timestamp: new Date().toLocaleString(props.locale || "en"),
        timestamp_epoch: serverTimestamp(),
        isEdited: false
      });

      setPostText(""); localStorage.removeItem("rural_post_draft");
      setMediaFile(null); setMediaPreview(null);
      setVideoFile(null); setVideoPreview(null); setIsHelpNeeded(false);
      setItemPrice(""); setItemCondition("Like New"); setModTags("");
      setYoutubeUrl(""); setTopSpeed(""); setMotorTemp(""); 
      setShowAdvanced(false); setShowPollBuilder(false); setShowCustomizer(false);
      setPostTemplate("none"); setIsComposerOpen(false);
      setPollQuestion(""); setPollOptions([{ id: 1, text: "", votes: 0 }, { id: 2, text: "", votes: 0 }]);
    } catch (error: any) {
      setSafetyWarning("Broadcast failed: " + error.message);
    } finally { 
      setIsPublishing(false); 
    }
  };

  const handleTriggerAISolver = async (postId: string) => {
    setAiRunningId(postId);
    triggerHaptic("LIGHT");
    try {
      const res = await fetchWithRetry("/api/forum/ai-troubleshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        const data = await res.json();
        await updateDoc(doc(db, "board_posts", postId), {
          comments: arrayUnion({
            id: Date.now().toString(),
            author: "AI CO-PILOT",
            text: data.reply.message,
            time: new Date().toLocaleTimeString(props.locale || "en", {hour: '2-digit', minute:'2-digit'}),
            isAI: true
          })
        });
        triggerHaptic("HEAVY");
      }
    } catch (err) { alert("AI Co-Pilot offline."); } finally { setAiRunningId(null); }
  };

  const handleVolt = async (postId: string, postUsername: string) => {
    triggerHaptic("MEDIUM");
    await updateDoc(doc(db, "board_posts", postId), { volts: increment(1) });
    if (postUsername !== username) {
      await addDoc(collection(db, "user_notifications"), {
        recipient: postUsername, sender: username, type: 'VOLT',
        content: `injected 1 Volt into your transmission`, postId: postId, read: false, timestamp: serverTimestamp()
      });
    }
  };

  const handleDeletePost = async (postId: string, postUsername: string) => {
    const currentClean = String(username || "").trim().toLowerCase();
    const postClean = String(postUsername || "").trim().toLowerCase();
    const isFounderUser = currentClean.includes("bradley") || currentClean === "ruraleride" || currentClean === "lord bradley callison";
    const isOwner = currentClean === postClean || isFounderUser || postClean === "pilot" || currentClean === "";

    if (isOwner || window.confirm("Delete this broadcast?")) {
      try {
        await deleteDoc(doc(db, "board_posts", postId));
        triggerHaptic("HEAVY");
      } catch (err) { alert("Failed to delete post."); }
    }
  };

  const handleNotifClick = async (n: any) => {
    triggerHaptic("LIGHT");
    await updateDoc(doc(db, "user_notifications", n.id), { read: true });
    setShowNotifs(false);
    if (n.type === 'DM') { setActiveDMUser(n.sender); setShowInbox(true); }
    else if (n.type === 'FRIEND_ADD') { setActiveProfileUser(n.sender); }
    else if (n.postId) {
      const el = document.getElementById(`post-${n.postId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleFriend = async (targetUser: string) => {
    triggerHaptic("MEDIUM");
    setFriends(prev => {
      const isFriend = prev.includes(targetUser);
      const newFriends = isFriend ? prev.filter(f => f !== targetUser) : [...prev, targetUser];
      localStorage.setItem("rural_friends", JSON.stringify(newFriends));
      return newFriends;
    });
    if (!friends.includes(targetUser)) {
      await addDoc(collection(db, "user_notifications"), {
        recipient: targetUser, sender: username, type: 'FRIEND_ADD',
        content: `added you to their riding crew!`, read: false, timestamp: serverTimestamp()
      });
    }
  };

  const displayedPosts = posts.filter(post => {
    if (flaggedIds.includes(post.id)) return false;
    if (feedView === "saved") return savedPosts.includes(post.id);
    if (feedView === "help") return post.isHelpNeeded || post.category === "Hardware Diagnostics";
    if (feedView === "Marketplace") return post.category === "Marketplace" || post.template === "market";
    if (feedView === "Video Requests") return post.category === "Video Requests";
    if (feedView === "crew") return friends.includes(post.username);
    if (feedView === "class" && pevType) return post.pevType === pevType;

    const safeContent = post.content ? String(post.content).toLowerCase() : "";
    const safeUser = post.username ? String(post.username).toLowerCase() : "";
    const query = String(searchQuery || "").toLowerCase();
    return (safeContent.includes(query) || safeUser.includes(query)) && (feedView === "universal" || post.category === feedView);
  }).sort((a, b) => {
    if (sortBy === "trending") return (b.volts || 0) - (a.volts || 0);
    return 0; 
  });

  const groupedChats = dms.reduce((acc: any, msg: any) => {
    if (!msg.participants || !Array.isArray(msg.participants)) return acc;
    const otherUser = msg.participants.find((p: string) => p !== username);
    if (!otherUser) return acc;
    if (!acc[otherUser] || getTimeMs(acc[otherUser].timestamp) < getTimeMs(msg.timestamp)) {
      acc[otherUser] = msg;
    }
    return acc;
  }, {});

  const chatList = Object.keys(groupedChats)
    .filter(user => String(user).toLowerCase().includes(String(inboxSearch || "").toLowerCase()))
    .map(key => ({ user: key, lastMessage: groupedChats[key] }))
    .sort((a, b) => getTimeMs(b.lastMessage.timestamp) - getTimeMs(a.lastMessage.timestamp));

  const allUniqueRiders = Array.from(new Set(posts.map(p => p.username).filter(Boolean))) as string[];
  const matchingRiders = (searchQuery || "").trim() ? allUniqueRiders.filter(r => String(r).toLowerCase().includes(String(searchQuery).toLowerCase()) && String(r).toLowerCase() !== String(username || "").toLowerCase()) : [];

  const shareProfile = (targetUser: string) => {
    triggerHaptic("LIGHT");
    const link = `Check out ${targetUser}'s riding profile on Rural Post!`;
    if (navigator.share) navigator.share({ title: `${targetUser} - Profile`, text: link });
    else { navigator.clipboard.writeText(link); alert("Profile link copied!"); }
  };

  const calculateUserLevel = (user: string) => {
    const userPosts = posts.filter(p => p.username === user);
    const postCount = userPosts.length;
    const totalVolts = userPosts.reduce((acc, p) => acc + (p.volts || 0), 0);
    const exp = (postCount * 10) + (totalVolts * 5);
    const level = Math.floor(exp / 100) + 1;
    const progress = exp % 100;
    return { level, exp, progress };
  };

  const getTopSpeed = (user: string) => {
    const userPosts = posts.filter(p => p.username === user && p.telemetry && p.telemetry.speed);
    if (userPosts.length === 0) return "N/A";
    const speeds = userPosts.map(p => parseFloat(String(p.telemetry.speed).split(" ")[0])).filter(s => !isNaN(s));
    if (speeds.length === 0) return "N/A";
    return `${Math.max(...speeds)} ${useMetric ? 'km/h' : 'mph'}`;
  };

  const currentLoc = locationService.getCurrentUpdate();
  const isGpsLocked = currentLoc && typeof currentLoc.lat === 'number' && currentLoc.lat !== 0;

  const nearbyPosts = posts.filter(p => {
    if (!isGpsLocked || !p.location || typeof p.location.lat !== 'number') return true; 
    return calculateDistance(currentLoc.lat, currentLoc.lng, p.location.lat, p.location.lng, useMetric) <= 50; 
  });

  let topSpeedRecord = { user: "Awaiting Data", speed: 0, vehicle: "N/A" };
  nearbyPosts.forEach(p => {
    if (p.telemetry?.speed) {
      const speedVal = parseFloat(String(p.telemetry.speed).split(" ")[0]);
      if (!isNaN(speedVal) && speedVal > topSpeedRecord.speed) {
        topSpeedRecord = { user: p.username || "Unknown", speed: speedVal, vehicle: p.fleetSignature || p.pevType || "PEV" };
      }
    }
  });

  const userVolts: Record<string, number> = {};
  nearbyPosts.forEach(p => { if (p.volts && p.username) userVolts[p.username] = (userVolts[p.username] || 0) + p.volts; });
  const mvpUser = Object.keys(userVolts).sort((a, b) => userVolts[b] - userVolts[a])[0] || "Awaiting Data";
  const mvpVolts = mvpUser !== "Awaiting Data" ? userVolts[mvpUser] : 0;

  const userScoutCount: Record<string, number> = {};
  nearbyPosts.forEach(p => { if (p.category === "Trail Reports" && p.username) userScoutCount[p.username] = (userScoutCount[p.username] || 0) + 1; });
  const topScout = Object.keys(userScoutCount).sort((a, b) => userScoutCount[b] - userScoutCount[a])[0] || "Awaiting Data";
  const scoutCount = topScout !== "Awaiting Data" ? userScoutCount[topScout] : 0;

  const onlinePilots = Object.keys(userProfiles).filter(uname => {
    const profile = userProfiles[uname];
    return profile && profile.lastActive && (Date.now() - getTimeMs(profile.lastActive)) < 900000;
  });

  if (!mounted) {
    return <div className="h-screen w-full bg-[#030303] flex items-center justify-center text-zinc-500 font-black tracking-widest uppercase text-xs animate-pulse">Initializing Universal Network...</div>;
  }

  return (
    <div className={`min-h-screen bg-transparent text-zinc-200 font-sans pb-24 selection:bg-white/20 relative z-10 ${scaleClass}`}>
      
      <div className="absolute top-[5%] right-[10%] w-[600px] h-[600px] rounded-full opacity-10 blur-[150px] pointer-events-none -z-10" style={{ backgroundColor: t.hex }}></div>

      {/* NOTIFICATIONS MODAL */}
      <AnimatePresence>
        {showNotifs && (
          <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-black/90 border border-white/10 rounded-3xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
              <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
                <h3 className={`text-sm font-black uppercase tracking-widest ${t.text} flex items-center gap-2`}><Bell className="w-4 h-4"/> System Alerts</h3>
                <button type="button" onClick={() => setShowNotifs(false)} className="text-zinc-500 hover:text-white p-2 bg-black/50 rounded-full border border-white/10 cursor-pointer"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-[10px] uppercase font-bold tracking-widest">No notifications.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} onClick={() => handleNotifClick(n)} className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.read ? 'bg-black/40 border-white/5' : `${t.bgSubtle} ${t.borderSubtle}`}`}>
                      <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black uppercase text-zinc-300">{n.sender}</span></div>
                      <p className="text-xs text-zinc-200 font-medium">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODULAR DIRECT MESSAGES MODAL */}
      <DirectMessagesModal 
        showInbox={showInbox} setShowInbox={setShowInbox} activeDMUser={activeDMUser}
        setActiveDMUser={setActiveDMUser} username={username} newChatTarget={newChatTarget}
        setNewChatTarget={setNewChatTarget} inboxSearch={inboxSearch} setInboxSearch={setInboxSearch}
        chatList={chatList} dms={dms} themeColors={t} getTimeMs={getTimeMs}
      />

      {/* MODULAR USER PROFILE MODAL */}
      <UserProfileModal 
        activeProfileUser={activeProfileUser} setActiveProfileUser={setActiveProfileUser}
        userProfiles={userProfiles} posts={posts} username={username} friends={friends}
        toggleFriend={toggleFriend} setActiveDMUser={setActiveDMUser} setShowInbox={setShowInbox}
        setIsSettingsOpen={setIsSettingsOpen} shareProfile={shareProfile}
        calculateUserLevel={calculateUserLevel} getTopSpeed={getTopSpeed} themeColors={t}
      />

      {/* MODULAR IDENTITY & CONFIG SETTINGS MODAL */}
      <BoardSettingsModal
        isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
        username={username} pfpUrl={pfpUrl} userFleet={userFleet} setUserFleet={setUserFleet}
        userBio={userBio} setUserBio={setUserBio} defaultPostCategory={defaultPostCategory}
        setDefaultPostCategory={setDefaultPostCategory} dataSaverMode={dataSaverMode}
        setDataSaverMode={setDataSaverMode} privacyMode={privacyMode} setPrivacyMode={setPrivacyMode}
        pfpInputRef={pfpInputRef} handlePfpUpload={handlePfpUpload} triggerHaptic={triggerHaptic}
        themeColors={t} CATEGORIES={CATEGORIES}
      />

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 p-4 pb-2">
        <nav className={`w-full ${t.blur} border border-white/10 rounded-3xl flex flex-col px-5 py-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]`}>
          <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className={`${t.bg} p-2 rounded-xl ${t.glow} relative`}>
                <Globe className="w-5 h-5 text-black relative z-10" />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-widest text-white drop-shadow-md">Rural Post</h1>
                 <div className="flex items-center gap-2 mt-0.5">
                   <p className={`text-[9px] ${t.text} font-bold uppercase tracking-wider flex items-center gap-1`}>
                     Universal Network
                     {!isAppOnline && <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[7px] animate-pulse ml-1"><WifiOff className="w-2 h-2 inline"/> OFFLINE</span>}
                   </p>
                   <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-black/50 border border-white/10 rounded-md text-[7px] font-mono text-zinc-400">
                      <span>{deviceNetworkType}</span>
                      {deviceBattLevel !== null && <span>{deviceBattLevel}%</span>}
                   </div>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setShowNotifs(true)} className="relative p-2.5 bg-black/50 border border-white/10 rounded-xl cursor-pointer">
                <Bell className="w-4 h-4 text-zinc-300" />
                {unreadNotifs > 0 && <span className={`absolute -top-1 -right-1 rounded-full h-4 w-4 ${t.bg} text-black text-[8px] font-black flex items-center justify-center`}>{unreadNotifs}</span>}
              </button>

              <button onClick={() => setShowInbox(true)} className="relative p-2.5 bg-black/50 border border-white/10 rounded-xl cursor-pointer">
                <Mail className="w-4 h-4 text-zinc-300" />
                {unreadDms > 0 && <span className={`absolute -top-1 -right-1 rounded-full h-4 w-4 ${t.bg} text-black text-[8px] font-black flex items-center justify-center`}>{unreadDms}</span>}
              </button>

              <button type="button" onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl cursor-pointer">
                <span className="text-[10px] font-black uppercase text-zinc-100 hidden sm:block">{username}</span>
                <div className={`w-6 h-6 rounded-full bg-black border ${t.border} flex items-center justify-center font-black ${t.text} text-xs`}>
                  {username ? username.charAt(0).toUpperCase() : <Settings className="w-3 h-3"/>}
                </div>
              </button>
            </div>
          </div>
          
          <div className="relative flex flex-col gap-2 max-w-4xl mx-auto w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input type="text" placeholder="Search riders, fleets, or posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white outline-none shadow-inner" />
            </div>

            {matchingRiders.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1">
                <span className="text-[9px] font-mono font-black text-zinc-500 uppercase shrink-0">Matching Riders:</span>
                {matchingRiders.map((riderName: string) => (
                  <button key={riderName} type="button" onClick={() => setActiveProfileUser(riderName)} className={`px-3 py-1 bg-black/60 border ${t.borderSubtle} ${t.text} rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 cursor-pointer`}>
                    {riderName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="p-4 space-y-6 max-w-3xl mx-auto mt-2">
        
        {/* MODULAR POST COMPOSER */}
        <PostComposer 
          isComposerOpen={isComposerOpen} setIsComposerOpen={setIsComposerOpen}
          postText={postText} setPostText={setPostText} postCategory={postCategory}
          setPostCategory={setPostCategory} pevType={pevType} setPevType={setPevType}
          postTemplate={postTemplate} setPostTemplate={setPostTemplate} isHelpNeeded={isHelpNeeded}
          setIsHelpNeeded={setIsHelpNeeded} itemPrice={itemPrice} setItemPrice={setItemPrice}
          itemCondition={itemCondition} setItemCondition={setItemCondition} modTags={modTags}
          setModTags={setModTags} username={username} pfpUrl={pfpUrl} useMetric={useMetric}
          handlePublish={handlePublish} isPublishing={isPublishing} safetyWarning={safetyWarning}
          setSafetyWarning={setSafetyWarning} mediaPreview={mediaPreview} setMediaFile={setMediaFile}
          setMediaPreview={setMediaPreview} videoPreview={videoPreview} setVideoFile={setVideoFile}
          setVideoPreview={setVideoPreview} fileInputRef={fileInputRef} cameraInputRef={cameraInputRef}
          videoInputRef={videoInputRef} handleMediaPick={handleMediaPick} handleCameraSnap={handleCameraSnap}
          handleVideoPick={handleVideoPick} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced}
          showPollBuilder={showPollBuilder} setShowPollBuilder={setShowPollBuilder} showCustomizer={showCustomizer}
          setShowCustomizer={setShowCustomizer} youtubeUrl={youtubeUrl} setYoutubeUrl={setYoutubeUrl}
          topSpeed={topSpeed} setTopSpeed={setTopSpeed} motorTemp={motorTemp} setMotorTemp={setMotorTemp}
          pollQuestion={pollQuestion} setPollQuestion={setPollQuestion} pollOptions={pollOptions}
          setPollOptions={setPollOptions} isDictating={isDictating} toggleVoiceDictation={toggleVoiceDictation}
          enhanceWithAI={enhanceWithAI} isEnhancing={isEnhancing} triggerHaptic={triggerHaptic}
          themeColors={t} PEV_TEMPLATES={PEV_TEMPLATES} CATEGORIES={CATEGORIES} PEV_TYPES={PEV_TYPES}
          CONDITION_TYPES={CONDITION_TYPES}
        />

        {/* FEED FILTER PILLS */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-2 custom-scrollbar items-center whitespace-nowrap">
          <button type="button" onClick={() => setFeedView("universal")} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer ${feedView === "universal" ? `${t.bg} text-black ${t.border}` : "bg-black/40 text-zinc-400 border-white/10"}`}>Universal Feed</button>
          <button type="button" onClick={() => setFeedView("crew")} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer ${feedView === "crew" ? `${t.bg} text-black ${t.border}` : "bg-black/40 text-zinc-400 border-white/10"}`}>My Crew</button>
          <button type="button" onClick={() => setFeedView("Marketplace")} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer ${feedView === "Marketplace" ? "bg-emerald-500 text-black border-emerald-400" : "bg-black/40 text-emerald-400 border-white/10"}`}>Marketplace</button>
          <button type="button" onClick={() => setFeedView("saved")} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer ${feedView === "saved" ? `${t.bgSubtle} ${t.text}` : "bg-black/40 text-zinc-400 border-white/10"}`}>Saved Vault</button>
          <button type="button" onClick={() => setFeedView("help")} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer ${feedView === "help" ? "bg-red-500 text-white" : "bg-black/40 text-red-400 border-white/10"}`}>SOS Board</button>
        </div>

        {/* MODULAR SECTOR STANDINGS */}
        {feedView === "universal" && (
          <SectorStandings 
            topSpeedRecord={topSpeedRecord} topScout={topScout} scoutCount={scoutCount}
            mvpUser={mvpUser} mvpVolts={mvpVolts} isGpsLocked={isGpsLocked} useMetric={useMetric}
            themeColors={t} onOpenProfile={(user: string) => setActiveProfileUser(user)}
          />
        )}

        {/* FEED */}
        <div className="space-y-6 pt-2">
          <AnimatePresence>
            {displayedPosts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-16 text-center shadow-xl">
                <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-zinc-400 font-black uppercase tracking-widest text-sm mb-2">No Transmissions Found</h3>
                <p className="text-xs text-zinc-600 font-medium">Try adjusting your filters or be the first to broadcast.</p>
              </motion.div>
            ) : (
              displayedPosts.map((post) => (
                <FeedPost 
                  key={post.id} 
                  post={post} 
                  currentUser={username} 
                  userProfiles={userProfiles}
                  dataSaverMode={dataSaverMode}
                  onVolt={() => handleVolt(post.id, post.username)} 
                  onDelete={() => handleDeletePost(post.id, post.username)}
                  onAiTrigger={() => handleTriggerAISolver(post.id)}
                  aiRunning={aiRunningId === post.id}
                  themeColors={t}
                  isSaved={savedPosts.includes(post.id)}
                  onToggleSave={() => toggleBookmark(post.id)}
                  onFlag={() => { if (window.confirm("Report post?")) handleFlagPost(post.id); }}
                  onOpenProfile={(targetUser: string) => setActiveProfileUser(targetUser)}
                  onOpenDM={(targetUser: string) => { setActiveDMUser(targetUser); setShowInbox(true); }}
                  useMetric={useMetric}
                  PEV_TEMPLATES={PEV_TEMPLATES}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}