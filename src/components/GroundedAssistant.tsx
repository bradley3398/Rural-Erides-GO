"use client";

import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import { 
  Sparkles, Send, Mic, MicOff, Volume2, Square, AlertTriangle, 
  Wind, CloudRain, ThermometerSun, Snowflake, Gauge, Disc, 
  Activity, Wrench, AlertOctagon, Users, Moon, Stethoscope, Scale, Map as MapIcon, ChevronDown, 
  ChevronUp, ImagePlus, Trash2, X, Zap, Camera, Cpu, Settings2, Download, FileText, Plus, Palette, BrainCircuit, LocateFixed, MapPinOff, MapPin, Loader2, Type, LayoutDashboard, MessageSquare, Radio, Image as ImageIcon, Compass, Navigation, Maximize2, Sliders, Youtube, Video, Play, UserCircle, Copy, Check, ExternalLink, Globe, ChevronRight, Battery, WifiOff, Wifi
} from "lucide-react";
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { fetchWithRetry, getGeminiApiKey } from '../services/CoPilotService';
import { locationService } from '../services/LocationService';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from "framer-motion";

// --- SELF-CONTAINED SAFE KEY GETTERS ---
const getBraveApiKey = () => { try { return localStorage.getItem("brave_api_key") || import.meta.env.VITE_BRAVE_API_KEY || ""; } catch(e) { return ""; } };
const getImgbbApiKey = () => { try { return localStorage.getItem("imgbb_api_key") || import.meta.env.VITE_IMGBB_API_KEY || ""; } catch(e) { return ""; } };
const getTavilyApiKey = () => { try { return localStorage.getItem("tavily_api_key") || import.meta.env.VITE_TAVILY_API_KEY || ""; } catch(e) { return ""; } };

// --- ERROR BOUNDARY SAFETY NET ---
class AssistantErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("GroundedAssistant Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-black border-2 border-rose-500 rounded-3xl p-6 text-rose-400 font-mono text-xs space-y-4 shadow-2xl m-4">
          <h3 className="font-black uppercase tracking-widest text-sm text-rose-500 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" /> CRITICAL CO-PILOT SUBSYSTEM FAULT
          </h3>
          <p className="text-zinc-300">An exception occurred in the AI Assistant:</p>
          <pre className="bg-zinc-950 p-4 rounded-xl border border-rose-900 overflow-auto text-[11px] text-rose-300 max-h-48">
            {this.state.error?.toString()}
          </pre>
          <button 
            type="button"
            onClick={() => { try { localStorage.removeItem("rural_copilot_sessions"); } catch(e){} window.location.reload(); }}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer shadow-lg"
          >
            Purge State &amp; Restart Matrix
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface YouTubeResult {
  title: string;
  url: string;
  videoId?: string;
  snippet?: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  image?: string | null; 
  webImages?: string[]; 
  youtubeVideos?: YouTubeResult[]; 
  timestamp?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

type ThemeColor = 'lime' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'void';
type AIPersona = 'copilot' | 'scout' | 'legal' | 'medic' | 'guide' | 'meteorologist' | 'vlogger';
type Verbosity = 'brief' | 'detailed';
type HUDOpacity = 'bg-black/20' | 'bg-black/40' | 'bg-black/60' | 'bg-black/80';

interface GroundedAssistantProps {
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
  geminiApiKey?: string;
}

export default function GroundedAssistant(props: GroundedAssistantProps) {
  return (
    <AssistantErrorBoundary>
      <GroundedAssistantCore {...props} />
    </AssistantErrorBoundary>
  );
}

function GroundedAssistantCore({
  theme = "lime",
  useMetric = false,
  ghostMode = false,
  satelliteMap = false,
  locale = "en",
  timeFormat = "12h",
  performanceMode = false,
  uiScale = "normal",
  globalVolume = 100,
  callsign = "",
  geminiApiKey = ""
}: GroundedAssistantProps) {
  
  const [mounted, setMounted] = useState(false);
  const [localTheme, setLocalTheme] = useState<ThemeColor>((theme as ThemeColor) || 'lime');
  const [localMetric, setLocalMetric] = useState<boolean>(useMetric);

  useEffect(() => { if (theme) setLocalTheme(theme as ThemeColor); }, [theme]);
  useEffect(() => { if (useMetric !== undefined) setLocalMetric(useMetric); }, [useMetric]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [input, setInput] = useState("");
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<{mimeType: string, data: string} | null>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [enableImageSearch, setEnableImageSearch] = useState(true); 
  const [enableYouTubeSearch, setEnableYouTubeSearch] = useState(true); 
  
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [currentlyReadingIndex, setCurrentlyReadingIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);
  const [isAppOnline, setIsAppOnline] = useState<boolean>(true);
  
  const [showTactical, setShowTactical] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [deepReasoningMode, setDeepReasoningMode] = useState(false);
  const [legalComplianceMode, setLegalComplianceMode] = useState(true);
  
  const getSafeStorage = (key: string, fallback: any) => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch(e) {}
    return fallback;
  };

  const [privacyMode, setPrivacyMode] = useState<boolean>(() => getSafeStorage("copilot_privacy_mode", "false") === "true");
  const [autoClearImages, setAutoClearImages] = useState<boolean>(() => getSafeStorage("copilot_autoclear_img", "true") !== "false");
  const [hudOpacity, setHudOpacity] = useState<HUDOpacity>(() => getSafeStorage("copilot_hud_opacity", "bg-black/40") as HUDOpacity);
  const [maxImageCount, setMaxImageCount] = useState<number>(() => Number(getSafeStorage("copilot_max_images", "20")) || 20);
  const [useGoogleEngine, setUseGoogleEngine] = useState<boolean>(() => getSafeStorage("copilot_use_google", "true") !== "false");
  const [useBraveEngine, setUseBraveEngine] = useState<boolean>(() => getSafeStorage("copilot_use_brave", "true") !== "false");
  const [useTavilyEngine, setUseTavilyEngine] = useState<boolean>(() => getSafeStorage("copilot_use_tavily", "true") !== "false");
  const [safeSearchLevel, setSafeSearchLevel] = useState<string>(() => getSafeStorage("copilot_safesearch", "active"));
  const [googleCseId, setGoogleCsetId] = useState<string>(() => getSafeStorage("google_cse_id", ""));
  const [isLocationLocked, setIsLocationLocked] = useState<boolean>(() => getSafeStorage("copilot_location_lock", "false") === "true");
  
  const [lockedCoords, setLockedCoords] = useState<{lat: number; lng: number} | null>(() => {
    try {
      const saved = localStorage.getItem("copilot_locked_coords");
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return null;
  });

  const [baseZone, setBaseZone] = useState<string>(() => getSafeStorage("copilot_base_zone", ""));
  const [verbosity, setVerbosity] = useState<Verbosity>(() => getSafeStorage("copilot_verbosity", "detailed") as Verbosity);
  const [autoTTS, setAutoTTS] = useState<boolean>(() => getSafeStorage("copilot_auto_tts", "false") === "true");
  const [customDirective, setCustomDirective] = useState<string>(() => getSafeStorage("copilot_custom_directive", ""));
  const [showTelemetryHUD, setShowTelemetryHUD] = useState<boolean>(() => getSafeStorage("copilot_show_hud", "true") !== "false");
  const [persona, setPersona] = useState<AIPersona>(() => getSafeStorage("copilot_persona", "copilot") as AIPersona);
  
  const [liveStats, setLiveStats] = useState<any>({});
  const [weatherStats, setWeatherStats] = useState<string>("Awaiting telemetry sync...");
  const [currentCity, setCurrentCity] = useState<string>("Resolving Zone...");
  const [latestRideSummary, setLatestRideSummary] = useState<any | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const themeMap = {
    lime: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-white/5 text-[#39ff14] border-white/10', hover: 'hover:text-white', hex: '#39ff14', subtle: 'border-[#39ff14]/30' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', dim: 'bg-white/5 text-cyan-400 border-white/10', hover: 'hover:text-white', hex: '#06b6d4', subtle: 'border-cyan-900/40' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', dim: 'bg-white/5 text-emerald-400 border-white/10', hover: 'hover:text-white', hex: '#10b981', subtle: 'border-emerald-900/40' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', dim: 'bg-white/5 text-amber-400 border-white/10', hover: 'hover:text-white', hex: '#f59e0b', subtle: 'border-amber-900/40' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', dim: 'bg-white/5 text-rose-400 border-white/10', hover: 'hover:text-white', hex: '#f43f5e', subtle: 'border-rose-900/40' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500', shadow: performanceMode ? '' : 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', dim: 'bg-white/5 text-purple-400 border-white/10', hover: 'hover:text-white', hex: '#a855f7', subtle: 'border-purple-900/40' },
    void: { text: 'text-white', bg: 'bg-zinc-800', border: 'border-zinc-500', shadow: performanceMode ? '' : 'shadow-[0_0_20px_rgba(255,255,255,0.1)]', dim: 'bg-white/5 text-white border-white/10', hover: 'hover:text-white', hex: '#ffffff', subtle: 'border-zinc-700/50' }
  };
  const t = themeMap[localTheme as keyof typeof themeMap] || themeMap.lime;

  const fontScaleMap = { compact: "text-[13px]", normal: "text-[15px]", large: "text-[18px]" };
  const fontSizeClass = fontScaleMap[uiScale as keyof typeof fontScaleMap] || "text-[15px]";

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsAppOnline(navigator.onLine);
      const handleOnline = () => setIsAppOnline(true);
      const handleOffline = () => setIsAppOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      try {
        const savedRides = localStorage.getItem("universal_erides_rides");
        if (savedRides) {
          const parsed = JSON.parse(savedRides);
          if (Array.isArray(parsed) && parsed.length > 0) setLatestRideSummary(parsed[0]);
        }
      } catch (e) {}

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("copilot_persona", persona);
      localStorage.setItem("copilot_location_lock", isLocationLocked ? "true" : "false");
      if (lockedCoords) localStorage.setItem("copilot_locked_coords", JSON.stringify(lockedCoords));
      else localStorage.removeItem("copilot_locked_coords");
      localStorage.setItem("copilot_base_zone", baseZone);
      localStorage.setItem("copilot_verbosity", verbosity);
      localStorage.setItem("copilot_auto_tts", autoTTS ? "true" : "false");
      localStorage.setItem("copilot_custom_directive", customDirective);
      localStorage.setItem("copilot_show_hud", showTelemetryHUD ? "true" : "false");
      localStorage.setItem("google_cse_id", googleCseId);
      localStorage.setItem("copilot_max_images", maxImageCount.toString());
      localStorage.setItem("copilot_use_google", useGoogleEngine ? "true" : "false");
      localStorage.setItem("copilot_use_brave", useBraveEngine ? "true" : "false");
      localStorage.setItem("copilot_use_tavily", useTavilyEngine ? "true" : "false");
      localStorage.setItem("copilot_safesearch", safeSearchLevel);
      localStorage.setItem("copilot_youtube_search", enableYouTubeSearch ? "true" : "false");
      localStorage.setItem("copilot_privacy_mode", privacyMode ? "true" : "false");
      localStorage.setItem("copilot_autoclear_img", autoClearImages ? "true" : "false");
      localStorage.setItem("copilot_hud_opacity", hudOpacity);
    } catch(e) {}
  }, [persona, isLocationLocked, lockedCoords, baseZone, verbosity, autoTTS, customDirective, showTelemetryHUD, googleCseId, maxImageCount, useGoogleEngine, useBraveEngine, useTavilyEngine, safeSearchLevel, enableYouTubeSearch, privacyMode, autoClearImages, hudOpacity]);

  useEffect(() => {
    if (!mounted) return;
    try {
      const savedSessions = localStorage.getItem("rural_copilot_sessions");
      if (savedSessions && !privacyMode) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch(e) {}
    
    const initialId = Date.now().toString();
    const defaultSession: ChatSession = { id: initialId, title: "LOG TERMINAL 1", messages: [] };
    setSessions([defaultSession]);
    setActiveSessionId(initialId);
  }, [mounted, privacyMode]);

  useEffect(() => {
    if (sessions.length > 0 && !privacyMode && mounted) {
      try { localStorage.setItem("rural_copilot_sessions", JSON.stringify(sessions)); } catch(e) {}
    }
  }, [sessions, privacyMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const currentUpdate = locationService.getCurrentUpdate();
    if (currentUpdate) setLiveStats(currentUpdate);
    const handleLocationUpdate = (update: any) => { if (update) setLiveStats(update); };
    locationService.addListener(handleLocationUpdate);
    return () => locationService.removeListener(handleLocationUpdate);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    let activeLat = isLocationLocked && lockedCoords ? lockedCoords.lat : liveStats?.lat;
    let activeLng = isLocationLocked && lockedCoords ? lockedCoords.lng : liveStats?.lng;

    if (activeLat && activeLng) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${activeLat}&lon=${activeLng}`)
        .then(res => res.json())
        .then(data => {
           const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state || "Unknown Zone";
           const state = data.address?.state_code || data.address?.state || "";
           setCurrentCity(state ? `${city}, ${state}` : city);
        })
        .catch(() => setCurrentCity(baseZone ? `${baseZone}` : "Coordinates Synced"));
    } else if (baseZone) {
      setCurrentCity(`${baseZone} (Fallback)`);
    } else {
      setCurrentCity("Awaiting Target Lock...");
    }
  }, [liveStats?.lat, liveStats?.lng, isLocationLocked, lockedCoords, baseZone, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const fetchLiveWeather = async () => {
      let targetLat = isLocationLocked && lockedCoords ? lockedCoords.lat : liveStats?.lat;
      let targetLng = isLocationLocked && lockedCoords ? lockedCoords.lng : liveStats?.lng;

      if (!targetLat || !targetLng) { setWeatherStats("Satellite connection pending..."); return; }
      try {
        const tUnit = localMetric ? "celsius" : "fahrenheit";
        const wUnit = localMetric ? "kmh" : "mph";
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=${tUnit}&wind_speed_unit=${wUnit}`);
        const data = await response.json();
        if (data?.current) {
          setWeatherStats(`Temp: ${Math.round(data.current.temperature_2m)}°${localMetric ? 'C' : 'F'}, Hum: ${data.current.relative_humidity_2m}%, Wind: ${Math.round(data.current.wind_speed_10m)} ${localMetric ? 'KMH' : 'MPH'}`);
        }
      } catch (err) { setWeatherStats("Atmospheric core data offline"); }
    };
    fetchLiveWeather();
    const interval = setInterval(fetchLiveWeather, 600000); 
    return () => clearInterval(interval);
  }, [mounted, liveStats?.lat, liveStats?.lng, isLocationLocked, lockedCoords, localMetric]);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const activeMessages = currentSession ? currentSession.messages : [];

  const handleNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title: `LOG TERMINAL ${sessions.length + 1}`, messages: [] };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const toggleLocationLock = () => {
    if (!isLocationLocked) {
      if (liveStats?.lat && liveStats?.lng) {
        setLockedCoords({ lat: liveStats.lat, lng: liveStats.lng });
        setIsLocationLocked(true);
      } else { alert("Acquire a GPS signal first, or type a custom Base Zone in settings before locking target."); }
    } else { setIsLocationLocked(false); setLockedCoords(null); }
  };

  const deleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) return alert("Cannot truncate primary terminal.");
    if (window.confirm("Purge this conversation record node permanently?")) {
      const remaining = sessions.filter(s => s.id !== idToDelete);
      setSessions(remaining);
      if (activeSessionId === idToDelete) setActiveSessionId(remaining[0].id);
    }
  };

  const clearMemory = () => {
    if (window.confirm("Reset active logs?")) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [] } : s));
      if (currentlyReadingIndex !== null && Capacitor.isPluginAvailable('TextToSpeech')) {
        try { TextToSpeech.stop(); } catch(e) {}
      }
      setCurrentlyReadingIndex(null);
      setShowSettings(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {}
  };

  const exportChatHistory = async () => {
    if (activeMessages.length === 0) return;
    const textContent = activeMessages.map(m => `[${m.timestamp || "Log"}] ${m.role.toUpperCase()}:\n${m.text}\n`).join("\n------------------------\n\n");
    if (navigator.share) {
      try { await navigator.share({ title: `Universal Pilot - Copilot Log ${activeSessionId}`, text: textContent }); } catch (err) {}
    } else {
      try { await navigator.clipboard.writeText(textContent); alert("Log successfully copied to clipboard!"); } catch (e) { alert("Unable to copy log to clipboard."); }
    }
  };

  const handleTTS = async (text: string, index: number) => {
    try {
      if (currentlyReadingIndex === index) {
        await TextToSpeech.stop();
        setCurrentlyReadingIndex(null);
      } else {
        if (currentlyReadingIndex !== null) await TextToSpeech.stop();
        const cleanText = text.replace(/\*/g, '').replace(/#/g, '');
        setCurrentlyReadingIndex(index);
        await TextToSpeech.speak({ text: cleanText, lang: 'en-US', rate: 1.0, pitch: 1.0, volume: globalVolume / 100, category: 'ambient' });
        setCurrentlyReadingIndex(null);
      }
    } catch (e) {
      setHardwareError("Voice synthesis engine error.");
      setCurrentlyReadingIndex(null);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return setHardwareError("Vocal recognition core not supported on this platform.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setHardwareError(null); };
    recognition.onresult = (event: any) => handleSearch(event.results[0][0].transcript);
    recognition.onerror = () => { setIsListening(false); setHardwareError("Vocal recognition timeout."); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImg(true);
    const imgApiKey = getImgbbApiKey();
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      const mimeType = result.split(';')[0].split(':')[1];
      const baseData = result.split(',')[1];
      setBase64Image({ mimeType, data: baseData });
      setSelectedImage(result); 

      if (imgApiKey) {
        const formData = new FormData();
        formData.append("image", file);
        try {
          const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgApiKey}`, { method: "POST", body: formData });
          const data = await res.json();
          if (data?.data?.url) setSelectedImage(data.data.url);
        } catch (err) {} finally { setIsUploadingImg(false); }
      } else { setIsUploadingImg(false); }
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => { setSelectedImage(null); setBase64Image(null); };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessions, activeSessionId, isSearching]);

  const STOCK_DOMAINS = ['shutterstock', 'gettyimages', 'istockphoto', 'stock', 'pexels', 'unsplash', 'adobe', 'alamy', 'freepik', 'vector', 'placeholder', 'wikimedia', 'pixabay', 'dreamstime', '123rf', 'depositphotos', 'canva', 'vecteezy', 'pngegg', 'pngtree', 'clipart', 'stockphoto', 'istock', 'fotolia', 'pond5', 'shutter', 'vectorstock', 'envato', 'elements.envato', 'stock.adobe', 'cloudfront', 'facebook.com', 'fb.com', 'instagram.com', 'google.com/maps', 'maps.google.com', 'twitter.com', 'x.com', 'pinterest.com', 'tiktok.com', 'reddit.com'];

  const isValidRealWorldImage = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    const isExcluded = STOCK_DOMAINS.some(domain => lower.includes(domain)) || lower.includes('icon') || lower.includes('logo') || lower.includes('avatar') || lower.includes('banner') || lower.includes('svg') || lower.includes('clipart') || lower.includes('vector') || lower.includes('watermark') || lower.includes('preview') || lower.includes('sample') || lower.includes('.html') || lower.includes('.php') || lower.includes('.aspx') || lower.includes('/map');
    if (isExcluded) return false;
    const hasValidExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some(ext => lower.includes(ext));
    const isKnownImageHost = lower.includes('images') || lower.includes('img') || lower.includes('photos') || lower.includes('media') || lower.includes('usercontent');
    return hasValidExtension || isKnownImageHost;
  };

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const executeGoogleImageSearch = async (query: string, targetZone: string) => {
    const googleApiKey = geminiApiKey || getGeminiApiKey();
    if (!googleApiKey || !googleCseId || !enableImageSearch || !useGoogleEngine) return [];
    try {
      const cleanZone = targetZone.includes(",") ? targetZone.split(",")[0] : targetZone;
      const imgQuery = `${query} ${cleanZone} street view trail path real photo`;
      const fetchPage = async (startIdx: number) => {
        const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(imgQuery)}&searchType=image&num=10&start=${startIdx}&safe=${safeSearchLevel}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return data.items && Array.isArray(data.items) ? data.items.map((item: any) => item.link) : [];
      };
      const [page1, page2] = await Promise.all([fetchPage(1), fetchPage(11)]);
      return [...page1, ...page2].filter((u: string) => isValidRealWorldImage(u));
    } catch (e) { return []; }
  };

  const executeBraveImageSearch = async (query: string, targetZone: string) => {
    const braveKey = getBraveApiKey();
    if (!braveKey || !enableImageSearch || !useBraveEngine) return [];
    try {
      const cleanZone = targetZone.includes(",") ? targetZone.split(",")[0] : targetZone;
      const imgQuery = `${query} ${cleanZone} street view trail path real photo`;
      const res = await fetch(`https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(imgQuery)}&count=20&safesearch=${safeSearchLevel}`, {
        headers: { "Accept": "application/json", "X-Subscription-Token": braveKey }
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        return data.results.map((r: any) => r.properties?.url || r.url).filter((u: string) => isValidRealWorldImage(u));
      }
      return [];
    } catch (e) { return []; }
  };

  const executeTavilyDeepSearch = async (query: string, targetZone: string) => {
    const tavilyKey = getTavilyApiKey();
    if (!tavilyKey || !enableImageSearch || !useTavilyEngine) return { textContext: "", imageLinks: [] };
    try {
      const cleanZone = targetZone.includes(",") ? targetZone.split(",")[0] : targetZone;
      const searchQuery = `${query} ${cleanZone} real local trails street view map photos`;
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: tavilyKey, query: searchQuery, search_depth: "advanced", include_images: true, max_results: 20 })
      });
      if (!response.ok) return { textContext: "", imageLinks: [] };
      const data = await response.json();
      let textContext = "";
      if (data.results && data.results.length > 0) {
        textContext = "\nLIVE TAVILY REAL-TIME WEB DATA:\n" + data.results.map((r: any) => `- ${r.title}: ${r.content} (${r.url})`).join("\n");
      }
      const imageLinks = data.images && Array.isArray(data.images) ? data.images.filter((img: string) => isValidRealWorldImage(img)) : [];
      return { textContext, imageLinks };
    } catch (e) { return { textContext: "", imageLinks: [] }; }
  };

  const executeYouTubeSearch = async (query: string, targetZone: string): Promise<YouTubeResult[]> => {
    const braveKey = getBraveApiKey();
    const tavilyKey = getTavilyApiKey();
    let results: YouTubeResult[] = [];
    if (!enableYouTubeSearch) return [];

    if (tavilyKey) {
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query: `${query} site:youtube.com/watch`, search_depth: "advanced", max_results: 6 })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.results) {
            for (const r of data.results) {
              const videoId = extractYouTubeId(r.url);
              if (videoId && !results.some(v => v.videoId === videoId)) results.push({ title: r.title, url: r.url, videoId, snippet: r.content });
            }
          }
        }
      } catch (e) {}
    }

    if (results.length < 4 && braveKey) {
      try {
        const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + " site:youtube.com/watch")}&count=8`, {
          headers: { "Accept": "application/json", "X-Subscription-Token": braveKey }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.web?.results) {
            for (const r of data.web.results) {
              const videoId = extractYouTubeId(r.url);
              if (videoId && !results.some(v => v.videoId === videoId)) results.push({ title: r.title, url: r.url, videoId, snippet: r.description });
            }
          }
        }
      } catch (e) {}
    }
    return results.slice(0, 4);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() && !selectedImage) return;
    if (!activeSessionId) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === "12h" });
    const userMessage: Message = { role: 'user', text: searchQuery, image: selectedImage, timestamp };
    const imageToProcess = base64Image; 
    
    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
      ...s,
      title: s.messages.length === 0 ? (searchQuery.substring(0, 16) + "...") : s.title,
      messages: [...s.messages, userMessage]
    } : s));
    
    setInput("");
    if (autoClearImages) clearSelectedImage();
    
    setIsSearching(true);
    setHardwareError(null);
    setShowTactical(false); 

    if (currentlyReadingIndex !== null) {
      await TextToSpeech.stop();
      setCurrentlyReadingIndex(null);
    }

    const geminiKey = geminiApiKey || getGeminiApiKey();
    if (!geminiKey) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        messages: [...s.messages, { role: 'ai', text: "API Key offline. Please configure your Gemini API Key in the Universal Settings menu to enable AI processing.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === "12h" }) }]
      } : s));
      setIsSearching(false);
      return;
    }

    let webContext = "";
    if (latestRideSummary) {
      webContext += `\nLATEST SAVED MISSION RUN STATS:\n- Distance: ${latestRideSummary.distance} mi\n- Top Speed: ${latestRideSummary.maxSpeed} mph\n- Vehicle: ${latestRideSummary.vehicleModel}\n- Battery Start/End: ${latestRideSummary.startingBattery}% -> ${latestRideSummary.endingBattery}%\n- Efficiency: ${latestRideSummary.efficiencyWhPerMile} Wh/mi\n`;
    }

    try {
      const braveKey = getBraveApiKey();
      if (searchQuery.trim() && !deepReasoningMode && braveKey) { 
         try {
           const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery + " micro mobility road classification regulations PEV e-bike")}&count=3`;
           const braveRes = await fetch(braveUrl, { headers: { "Accept": "application/json", "X-Subscription-Token": braveKey } });
           if (braveRes.ok) {
             const braveData = await braveRes.json();
             if (braveData.web?.results?.length > 0) {
               const topResults = braveData.web.results.map((r: any) => `- ${r.title}: ${r.description}`).join("\n");
               webContext += `\nREGULATORY COMPLIANCE SYSTEM LOOKUP METRICS:\n${topResults}`;
             }
           }
         } catch (searchError) {}
      }

      const activeLat = isLocationLocked && lockedCoords ? lockedCoords.lat : liveStats?.lat;
      const activeLng = isLocationLocked && lockedCoords ? lockedCoords.lng : liveStats?.lng;
      const zoneName = currentCity !== "Resolving Zone..." && currentCity !== "Resolving..." ? currentCity : (baseZone || "Global Location");

      const [googleImages, tavilyRes, braveImages, youtubeVideos] = await Promise.all([
        executeGoogleImageSearch(searchQuery, zoneName),
        executeTavilyDeepSearch(searchQuery, zoneName),
        executeBraveImageSearch(searchQuery, zoneName),
        executeYouTubeSearch(searchQuery, zoneName)
      ]);

      const combinedImages = Array.from(new Set([...googleImages, ...braveImages, ...tavilyRes.imageLinks]))
        .filter((url: string) => isValidRealWorldImage(url))
        .slice(0, maxImageCount);

      let personaDirective = "You are the RURAL PILOT. You are an advanced, completely universal micro-mobility, PEV, trail scout, and technical analysis agent.";
      if (persona === 'legal') personaDirective = "You are a PEV Legal Analyst. Focus on speed limits, helmet rules, Class 1-3 regulations, and road ordinances.";
      if (persona === 'scout') personaDirective = "You are a PEV Trail & Route Scout. Focus on local riding trails, path terrain, elevation profiles, weather hazards, and town/path pictures.";
      if (persona === 'medic') personaDirective = "You are a PEV First Responder / Medic. Focus on crash injury triage, high-speed road rash treatment, helmet safety ratings, and riding bio-mechanics.";
      if (persona === 'guide') personaDirective = "You are a PEV Tour Guide. Focus on scenic viewpoints, group ride formations, pacing, local cafe stops, and maximizing battery efficiency on long cruises.";
      if (persona === 'meteorologist') personaDirective = "You are a Route Meteorologist. Focus strictly on how temperature, crosswinds, and moisture affect riding traction and lithium-ion battery drain.";
      if (persona === 'vlogger') personaDirective = "You are a Content Creator / Ride Vlogger assistant. Focus on filming angles, camera mounts, scenic backdrops, and storytelling on the trail.";

      const antiDisclaimerDirective = "CRITICAL DIRECTIVE: Never state that you cannot generate or transmit photographic image files or visual cards. Visual telemetry cards, integrated YouTube video players, and real-world town/trail photos are handled natively by the app HUD pipeline. Provide direct, high-fidelity scouting and technical analysis without meta-commentary about your media capabilities.";
      const verbosityDirective = verbosity === 'brief' ? "OUTPUT PROTOCOL: Keep responses tactical, direct, and under 4 sentences." : "OUTPUT PROTOCOL: Provide thorough, detailed, and structured guidance.";
      const customDirectiveContext = customDirective.trim() ? `\n\nCRITICAL PILOT SPEC DIRECTIVE: "${customDirective}". Tailor all physical calculations and advice to this setup.\n` : "";

      const speedVal = localMetric ? (liveStats?.speed * 1.60934).toFixed(1) : liveStats?.speed?.toFixed(1) || 0;
      const speedUnit = localMetric ? 'KM/H' : 'MPH';

      const dynamicSystemContext = `
        ${personaDirective}
        ${antiDisclaimerDirective}
        AUDIO ENGINE FORMAT COMPLIANCE: Avoid markdown, asterisks, bullet lists, or headers. Provide smooth paragraphs that parse cleanly to speech.
        ${verbosityDirective}
        ${customDirectiveContext}

        ${deepReasoningMode ? "DEEP LOGIC ACTIVE: Perform multi-step calculations on power draw, terrain friction, thermal bounds, and range specs." : ""}
        ${legalComplianceMode ? "LEGAL OVERLAY ENGAGED: Cross-reference regional micro-mobility laws, sidewalk rules, and path speed limits." : ""}

        LIVE TELEMETRY STREAM FEED:
        - Geographic Pin: Lat ${activeLat ? activeLat.toFixed(5) : 'Unknown'}, Lng ${activeLng ? activeLng.toFixed(5) : 'Unknown'}
        - Target Operating Zone: ${zoneName}
        - Current Velocity: ${speedVal} ${speedUnit}
        - Elevation: ${liveStats?.altitude ? liveStats.altitude.toFixed(0) : 0} FT
        - Atmospheric Status: ${weatherStats}
        ${webContext}
        ${tavilyRes.textContext}
      `;

      const historicalFeed = activeMessages.slice(-15).map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const newPromptParts: any[] = [{ text: searchQuery }];
      if (imageToProcess) newPromptParts.push({ inlineData: { mimeType: imageToProcess.mimeType, data: imageToProcess.data } });

      historicalFeed.push({ role: 'user', parts: newPromptParts });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`;
      
      const payload = {
        system_instruction: {
          parts: [{ text: dynamicSystemContext }]
        },
        contents: historicalFeed,
        generationConfig: deepReasoningMode ? { temperature: 0.15, topK: 5 } : { temperature: 0.65 }
      };

      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, { maxRetries: 3, timeoutMs: 25000, useCache: true }); 

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API payload rejected.");
      
      let aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Signal dropped awaiting response.";
      aiResponseText = aiResponseText.replace(/i am an ai(?:\'s)?(?:\s+model)?\s+(?:and )?(?:cannot|do not have the ability to)\s+generate\s+or\s+transmit\s+direct\s+photographic\s+image\s+files/gi, '').replace(/i cannot generate or transmit direct photographic image files/gi, '').trim();

      const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === "12h" });
      
      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        messages: [...s.messages, { role: 'ai', text: aiResponseText, webImages: combinedImages.length > 0 ? combinedImages : undefined, youtubeVideos: youtubeVideos.length > 0 ? youtubeVideos : undefined, timestamp: aiTimestamp }]
      } : s));

      if (autoTTS && globalVolume > 0) {
        try {
          const cleanText = aiResponseText.replace(/\*/g, '').replace(/#/g, '');
          await TextToSpeech.speak({ text: cleanText, lang: 'en-US', rate: 1.0, pitch: 1.0, volume: globalVolume / 100, category: 'ambient' });
        } catch(e) {}
      }
      
    } catch (error: any) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        messages: [...s.messages, { role: 'ai', text: `Signal lost: ${error.message}. Please retry.` }]
      } : s));
    } finally { setIsSearching(false); }
  };

  const tacticalFeatures = [
    { id: 'debrief_last_ride', icon: Activity, label: 'Debrief Last Ride', prompt: 'Analyze my last saved mission run telemetry. Give me a performance debrief on my top speed, efficiency, and battery sag.' },
    { id: 'scout_trail', icon: Navigation, label: 'Trail & Path Scout', prompt: 'Scout the best riding trails, paved paths, and off-road PEV routes in my current zone. Include terrain details.' },
    { id: 'photos', icon: ImageIcon, label: 'Town/Terrain Photos', prompt: 'Show me images and detail descriptions of the riding terrain, trailheads, or town streets in my active area.' },
    { id: 'legal_class', icon: Scale, label: 'Legal Classes', prompt: 'Give me a brief breakdown of 3-class system rules for legal e-bike use on roadways and bike paths.' },
    { id: 'ordinance', icon: FileText, label: 'Path Legality', prompt: 'What are the general rules regarding stand-up electric scooter use on public sidewalks versus municipal roadways?' },
    { id: 'charging', icon: Zap, label: 'Charging Hubs', prompt: 'Where can I charge my PEV or find public power outlets near my location?' },
    { id: 'history', icon: Compass, label: 'Local History Scan', prompt: 'Act as a local historian. What are some interesting historical landmarks or maritime connections in this exact zone that I can ride to?' },
    { id: 'wind', icon: Wind, label: 'Wind Physics', prompt: 'Factor in my current speed profile. Give me 2 quick tips on handling strong crosswinds safely.' },
    { id: 'wet', icon: CloudRain, label: 'Wet Asphalt', prompt: 'Explain safe cornering limits and weight distribution on wet city streets or slick gravel trails.' },
    { id: 'stop', icon: AlertOctagon, label: 'Panic Stop', prompt: 'What are the correct bio-mechanics to stop a high-speed PEV safely without going over the handlebars?' },
    { id: 'group_ride', icon: Users, label: 'Group Ride Tactics', prompt: 'What are the best formations and hand signals for a group of 3-5 riders on a mixed path?' },
    { id: 'range', icon: MapIcon, label: 'Range Anxiety', prompt: 'I am getting range anxiety. Based on current speed and elevation shifts, explain how to maximize my remaining battery % to get home.' },
    { id: 'wildlife', icon: AlertTriangle, label: 'Wildlife Defense', prompt: 'What is the safest protocol if I encounter an aggressive off-leash dog or local wildlife while riding a PEV on a rural trail?' },
    { id: 'posture', icon: Activity, label: 'Riding Ergonomics', prompt: 'Give me 3 quick bio-mechanic tips to prevent lower back and wrist fatigue during a long multi-hour ride.' },
    { id: 'pitstop', icon: LocateFixed, label: 'Cafe / Pitstop Locator', prompt: 'Find the best local coffee shops, diners, or rest stops near my current GPS zone to take a riding break.' },
    { id: 'music', icon: Volume2, label: 'Ride Playlist', prompt: 'Based on my current speed and the local weather, curate a high-energy 5-song playlist for this ride.' },
    { id: 'translation', icon: Globe, label: 'Tourist Translator', prompt: 'I am riding in an unfamiliar zone. Teach me 3 essential local phrases for "excuse me," "on your left," and "where is the trail?"' },
    { id: 'night_trail', icon: Moon, label: 'Night Lighting', prompt: 'What lumen output and beam pattern specifications are optimal for high-speed night trail riding on e-scooters?' },
    { id: 'vlog_spot', icon: Video, label: 'Vlog Backdrops', prompt: 'Scout scenic local backdrop locations and cinematic angles suitable for filming outdoor PEV ride vlogs.' },
    { id: 'sos_distress', icon: LocateFixed, label: 'SOS Distress Signal', prompt: 'EMERGENCY OVERRIDE: Generate a highly visible distress summary containing my exact GPS coordinates, town/zone, altitude, and current time. Keep it brief and formatted for emergency dispatch.' }
  ];

  const hudOpacityOptions = [
    { val: "bg-black/20", label: "20% Black (High Transparency)" },
    { val: "bg-black/40", label: "40% Black (Balanced Glass)" },
    { val: "bg-black/60", label: "60% Black (Dimmed Base)" },
    { val: "bg-black/80", label: "80% Black (Solid Shadow)" },
  ];

  const personaOptions = [
    { id: 'copilot', label: 'Base Pilot AI (Universal Micro-Mobility)' },
    { id: 'scout', label: 'Route & Trail Scout (Navigation)' },
    { id: 'legal', label: 'Legal & Ordinance Analyst (Class Laws)' },
    { id: 'medic', label: 'First Responder / Medic (Injury & Triage)' },
    { id: 'guide', label: 'Tour Guide (Pacing & Scenic Stops)' },
    { id: 'meteorologist', label: 'Route Meteorologist (Atmospheric Hazards)' },
    { id: 'vlogger', label: 'Ride Vlogger (Content & Filming)' },
  ];

  const maxImageOptions = [8, 12, 16, 20];

  if (!mounted) return <div className="bg-[#0a0a0f] h-[650px] rounded-3xl flex items-center justify-center text-lime-400 font-black tracking-widest text-xs uppercase animate-pulse">Initializing Branded Core Matrix...</div>;

  return (
    <div style={{ backgroundColor: `rgba(0,0,0,0.6)` }} className="backdrop-blur-2xl border border-white/10 rounded-3xl p-4 h-[650px] flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden font-sans select-none transition-colors duration-500">
      
      {!performanceMode && (
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none -z-10" style={{ backgroundColor: t.hex }}></div>
      )}

      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} className="fixed inset-0 z-[9999999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-3xl">
          <button onClick={() => setLightboxImg(null)} className="absolute top-6 right-6 bg-white/10 border border-white/20 text-white p-3 rounded-full hover:bg-white/20 transition-all shadow-2xl cursor-pointer active:scale-95">
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxImg} alt="Expanded Full View" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]" />
        </div>
      )}

      <header className="flex justify-between items-center border-b border-white/10 pb-3 mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`${t.bg} p-2 rounded-xl shadow-lg`}>
            <Compass className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className={`${t.text} font-black uppercase tracking-widest text-xs sm:text-sm drop-shadow-md`}>
              RURAL PILOT
            </h2>
            <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wide">
              UNIVERSAL CO-PILOT MATRIX {!isAppOnline && <span className="text-rose-500 font-bold ml-1"><WifiOff className="w-2.5 h-2.5 inline"/> OFFLINE MODE</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => setDeepReasoningMode(!deepReasoningMode)}
            className={`min-h-[44px] px-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all duration-300 active:scale-95 shadow-md cursor-pointer ${
              deepReasoningMode 
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105' 
                : `bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10`
            }`}
          >
            <Sparkles className="w-3 h-3" /> Deep Logic
          </button>

          <button 
            type="button"
            onClick={() => setShowSettings(true)} 
            className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border-white/10`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {showTelemetryHUD && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-2 mb-2 grid grid-cols-4 gap-2 text-center text-zinc-300 shrink-0 font-mono text-[9px] font-bold shadow-inner backdrop-blur-md">
          <div className="bg-black/40 p-1.5 rounded border border-white/10 col-span-2 overflow-hidden flex items-center justify-between px-2 shadow-inner">
            <div className="text-left truncate">
              <span className="text-zinc-500 block text-[7px] uppercase font-black">TARGET ZONE</span>
              <span className={`text-white text-xs truncate block ${isLocationLocked ? "text-amber-400" : ""}`}>
                {currentCity}
              </span>
            </div>
            <button 
              type="button"
              onClick={toggleLocationLock}
              title={isLocationLocked ? "Unlock Location" : "Lock Location Target"}
              className={`p-1.5 rounded-lg border transition-all duration-300 active:scale-95 cursor-pointer ${isLocationLocked ? "bg-amber-500 text-black border-amber-400 shadow-md" : "bg-white/10 text-zinc-300 border-white/20 hover:text-white"}`}
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-black/40 p-1.5 rounded border border-white/10 shadow-inner">
            <span className="text-zinc-500 block text-[7px] uppercase font-black">VELOCITY</span>
            <span className={`${t.text} text-xs`}>{localMetric ? ((liveStats?.speed || 0) * 1.60934).toFixed(0) : (liveStats?.speed ? Math.round(liveStats.speed) : 0)} {localMetric ? 'KMH' : 'MPH'}</span>
          </div>
          <div className="bg-black/40 p-1.5 rounded border border-white/10 shadow-inner">
            <span className="text-zinc-500 block text-[7px] uppercase font-black">ALTITUDE</span>
            <span className="text-cyan-400 text-xs">{liveStats?.altitude ? Math.round(liveStats.altitude) : 0} FT</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-2 shrink-0 border-b border-white/10">
        <button 
          type="button"
          onClick={handleNewSession}
          className={`min-h-[44px] px-4 shrink-0 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-white/10 transition-all duration-300 active:scale-95 cursor-pointer text-white shadow-inner`}
        >
          <Plus className="w-4 h-4"/> New Log
        </button>
        
        {sessions.map(s => (
          <div 
            key={s.id}
            onClick={() => setActiveSessionId(s.id)}
            className={`min-h-[44px] px-3 shrink-0 flex items-center gap-2 rounded-xl border cursor-pointer transition-all duration-300 active:scale-95 ${
              s.id === activeSessionId 
                ? `${t.bg} text-black border-transparent shadow-lg` 
                : `bg-black/40 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white shadow-inner`
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider max-w-[120px] truncate">{s.title}</span>
            <button 
              type="button"
              onClick={(e) => deleteSession(e, s.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${s.id === activeSessionId ? 'hover:bg-black/20 text-black/70 hover:text-black' : 'hover:bg-rose-950/50 hover:text-rose-400 text-zinc-500'}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-black/60 backdrop-blur-3xl border border-white/10 w-full max-w-3xl rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col max-h-[85vh] overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${t.text}`}>
                <Settings2 className="w-4 h-4" /> Universal Matrix Settings &amp; Advanced Engines
              </h3>
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                className="bg-white/5 border border-white/10 text-zinc-400 p-2 rounded-xl cursor-pointer hover:bg-white/10 hover:text-white transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-4 pr-1 custom-scrollbar">
              
              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner">
                <label className="text-[10px] text-zinc-400 font-black uppercase block mb-2 tracking-widest">Google Custom Search Engine (CSE) ID</label>
                <input 
                  type="text" 
                  value={googleCseId} 
                  onChange={(e) => setGoogleCsetId(e.target.value)} 
                  placeholder="e.g. 0123456789abcdef0:xyz123"
                  className="w-full min-h-[40px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-bold text-white outline-none focus:border-white/30 transition-colors shadow-inner"
                />
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex flex-col gap-3">
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5"/> Override Primary Copilot Persona</span>
                <select 
                  value={persona} 
                  onChange={(e) => setPersona(e.target.value as AIPersona)}
                  className="bg-black/50 border border-white/10 text-white text-[10px] font-bold rounded-lg px-3 py-2 outline-none cursor-pointer shadow-inner w-full uppercase tracking-wider"
                >
                  {personaOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex flex-col gap-3">
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Image &amp; Research Engine Configuration</span>
                
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Max Image Results (Up to 20):</span>
                  <select 
                    value={maxImageCount} 
                    onChange={(e) => setMaxImageCount(Number(e.target.value))}
                    className={`bg-black/50 ${t.text} border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none cursor-pointer shadow-inner`}
                  >
                    {maxImageOptions.map(m => <option key={m} value={m}>{m} Results</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2 border-t border-white/5 flex-wrap">
                  <label className="text-[9px] text-zinc-300 flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider">
                    <input type="checkbox" checked={useGoogleEngine} onChange={(e) => setUseGoogleEngine(e.target.checked)} className="accent-current" /> Google CSE
                  </label>
                  <label className="text-[9px] text-zinc-300 flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider">
                    <input type="checkbox" checked={useBraveEngine} onChange={(e) => setUseBraveEngine(e.target.checked)} className="accent-current" /> Brave Images
                  </label>
                  <label className="text-[9px] text-zinc-300 flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider">
                    <input type="checkbox" checked={useTavilyEngine} onChange={(e) => setUseTavilyEngine(e.target.checked)} className="accent-current" /> Tavily Deep
                  </label>
                  <label className="text-[9px] text-cyan-400 flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider drop-shadow-sm">
                    <input type="checkbox" checked={enableYouTubeSearch} onChange={(e) => setEnableYouTubeSearch(e.target.checked)} className="accent-cyan-400" /> YouTube Research
                  </label>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner">
                <label className="text-[10px] text-zinc-400 font-black uppercase block mb-2 tracking-widest">Hardware &amp; Weight Specs (AI Context)</label>
                <textarea 
                  value={customDirective} 
                  onChange={(e) => setCustomDirective(e.target.value)} 
                  placeholder="Enter custom hardware parameters..."
                  className="w-full min-h-[70px] bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-white/30 resize-none transition-colors shadow-inner"
                />
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block">Location Target Lock</span>
                    <span className="text-[8px] text-zinc-500 uppercase font-bold">Lock current GPS or custom zone universally</span>
                  </div>
                  <button 
                    type="button"
                    onClick={toggleLocationLock}
                    className={`min-h-[36px] px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300 active:scale-95 cursor-pointer ${isLocationLocked ? `bg-white/10 border-white/20 ${t.text}` : 'bg-black/50 border-white/10 text-zinc-500 hover:text-white shadow-inner'}`}
                  >
                    {isLocationLocked ? "LOCKED" : "GPS AUTO"}
                  </button>
                </div>
                
                <div className="pt-2 border-t border-white/5">
                  <label className="text-[9px] text-zinc-400 font-black uppercase tracking-widest block mb-2">Custom Base Zone / City (Universal Fallback)</label>
                  <input 
                    type="text" 
                    value={baseZone} 
                    onChange={(e) => setBaseZone(e.target.value)} 
                    placeholder="e.g. Denver, CO or London, UK"
                    className="w-full min-h-[44px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-bold text-white outline-none focus:border-white/30 transition-colors shadow-inner"
                  />
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest block">Incognito Privacy Mode</span>
                  <span className="text-[8px] text-zinc-500 uppercase font-bold">Disables local storage conversation logging</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setPrivacyMode(!privacyMode)} 
                  className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors cursor-pointer shadow-inner border border-white/10 ${privacyMode ? 'bg-rose-500' : 'bg-zinc-800'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${privacyMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block">Auto-Clear Optical Feed</span>
                  <span className="text-[8px] text-zinc-500 uppercase font-bold">Clears uploaded image after every prompt</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setAutoClearImages(!autoClearImages)} 
                  className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors cursor-pointer shadow-inner border border-white/10 ${autoClearImages ? t.bg : 'bg-zinc-800'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${autoClearImages ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Fetch Town / Trail Pictures</span>
                <button 
                  type="button"
                  onClick={() => setEnableImageSearch(!enableImageSearch)} 
                  className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors cursor-pointer shadow-inner border border-white/10 ${enableImageSearch ? t.bg : 'bg-zinc-800'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${enableImageSearch ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Active Log Maintenance</span>
                <div className="flex gap-2">
                  <button type="button" onClick={exportChatHistory} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-sm">Export Log</button>
                  <button type="button" onClick={clearMemory} className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-sm">Clear Log</button>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] border border-white/10 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      <button 
        type="button"
        onClick={() => setShowTactical(!showTactical)}
        className={`w-full min-h-[44px] flex items-center justify-between bg-white/5 border border-white/10 px-4 rounded-xl mb-2 text-zinc-300 hover:text-white transition-all duration-300 active:scale-95 shadow-md shrink-0 cursor-pointer backdrop-blur-md`}
      >
        <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
          <Globe className={`w-3.5 h-3.5 ${t.text}`} /> Tactical Quick Actions &amp; Scout Filters (20 Modes)
        </span>
        {showTactical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showTactical && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mb-2 shrink-0 overflow-y-auto max-h-[160px] custom-scrollbar p-0.5">
          {tacticalFeatures.map((feature) => (
            <button 
              key={feature.id}
              type="button"
              onClick={() => handleSearch(feature.prompt)} 
              className={`min-h-[44px] flex items-center gap-2 bg-black/40 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white text-[9px] uppercase font-black px-3 py-2 rounded-xl transition-all duration-300 active:scale-95 text-left cursor-pointer shadow-inner backdrop-blur-md`}
            >
              <feature.icon className={`w-3.5 h-3.5 shrink-0 ${t.text}`} />
              <span className="truncate tracking-wide">{feature.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 pb-2">
        {activeMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-4">
            <Compass className={`w-10 h-10 opacity-20 ${t.text}`} />
            
            <div className="text-center space-y-1">
              <p className="font-black text-[10px] uppercase tracking-widest leading-relaxed font-mono text-zinc-500">
                UNIVERSAL CO-PILOT TERMINAL READY
              </p>
              
              <p className={`font-black text-[9px] uppercase tracking-widest font-mono flex items-center justify-center gap-1 ${t.text} drop-shadow-md`}>
                <LocateFixed className="w-3 h-3 animate-pulse" /> TARGET: {currentCity.toUpperCase()}
              </p>
              
              <p className="font-black text-[9px] uppercase tracking-widest font-mono text-zinc-500">
                AWAITING ROUTE OR LOGISTICS PROMPT
              </p>
            </div>
          </div>
        )}
        
        {activeMessages.map((m, i) => (
          <div key={i} className={`flex flex-col w-full ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            <div className={`flex items-center gap-1.5 mb-1.5 ${m.role === 'user' ? 'flex-row-reverse mr-1' : 'ml-1'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.role === 'user' ? `${t.border} bg-white/5` : `${t.bg} border-transparent shadow-lg`}`}>
                {m.role === 'user' ? <UserCircle className={`w-3 h-3 ${t.text}`} /> : <BrainCircuit className="w-3 h-3 text-black" />}
              </div>
              <span className="text-[8px] font-mono font-black text-zinc-500 tracking-widest uppercase">
                [{m.timestamp || "Log"} // {m.role === 'user' ? (callsign ? callsign : 'PILOT') : `SYSTEM.${persona?.toUpperCase() || 'AI'}`}]
              </span>
            </div>

            <div className={`p-4 rounded-2xl ${fontSizeClass} whitespace-pre-wrap leading-relaxed max-w-[90%] font-sans relative overflow-hidden ${
              m.role === 'user' 
                ? `${t.bg} text-black font-bold rounded-tr-sm shadow-xl` 
                : `bg-black/60 backdrop-blur-2xl border ${t.subtle} text-zinc-100 rounded-tl-sm font-medium shadow-[0_4px_30px_rgba(0,0,0,0.5)]`
            }`}>
              
              {m.role === 'ai' && !performanceMode && (
                <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
              )}

              <div className="relative z-10 space-y-2">
                {((m.text || '').split('\n')).map((line: string, lineIdx: number) => {
                  const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                  const cleanLine = line.replace(/^[\*\-]\s/, '');
                  
                  const formattedLine = cleanLine.split(/(\*\*.*?\*\*)/g).map((part: string, pIdx: number) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={pIdx} className="font-black text-white tracking-wide">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={pIdx}>{part}</span>;
                  });

                  if (isBullet) {
                    return (
                      <div key={lineIdx} className="flex items-start gap-2.5 pl-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-lg ${m.role === 'user' ? 'bg-black/50' : `${t.bg} shadow-[0_0_8px_currentColor]`}`} />
                        <div className="flex-1 leading-relaxed">{formattedLine}</div>
                      </div>
                    );
                  }
                  return <p key={lineIdx} className="min-h-[1rem] leading-relaxed">{formattedLine}</p>;
                })}
              </div>

              {m.youtubeVideos && m.youtubeVideos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
                  <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                    <Youtube className="w-3.5 h-3.5 text-rose-500" /> Integrated Research &amp; Media Feed:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {m.youtubeVideos.map((yt, ytIdx) => (
                      <div key={ytIdx} className="rounded-xl border border-white/10 bg-black/60 overflow-hidden flex flex-col shadow-inner">
                        <div className="relative w-full aspect-video bg-zinc-950">
                          {yt.videoId ? (
                            <iframe 
                              src={`https://www.youtube.com/embed/${yt.videoId}`} 
                              title={yt.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px] uppercase font-mono">Video Unavailable</div>
                          )}
                        </div>
                        <div className="p-2.5 flex flex-col justify-between flex-1">
                          <span className="text-[10px] font-bold text-zinc-200 line-clamp-2">{yt.title}</span>
                          <a href={yt.url} target="_blank" rel="noopener noreferrer" className="text-[8px] font-mono text-zinc-400 hover:text-rose-400 truncate mt-1 block transition-colors">Open on YouTube ↗</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {m.webImages && m.webImages.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
                  <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-cyan-400" /> Discovered Route &amp; Terrain Photos (Up to {maxImageCount} Results):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {m.webImages.map((imgUrl, imgIdx) => (
                      <div 
                        key={imgIdx} 
                        onClick={() => setLightboxImg(imgUrl)}
                        className="block relative group overflow-hidden rounded-xl border border-white/10 bg-black/50 cursor-pointer aspect-square shadow-sm"
                      >
                        <img src={imgUrl} alt={`Web image ${imgIdx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 mix-blend-lighten" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className={`flex gap-3 mt-1.5 px-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'} w-full items-center`}>
               {m.role === 'ai' && (
                 <>
                    <button 
                      type="button"
                      onClick={() => handleTTS(m.text || '', i)} 
                      className={`min-h-[36px] px-2 text-[9px] font-black uppercase flex items-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer border border-white/5 rounded-lg bg-black/35 backdrop-blur-md shadow-inner ${currentlyReadingIndex === i ? 'text-amber-400 animate-pulse' : `${t.text} hover:text-white`}`}
                    >
                      {currentlyReadingIndex === i ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {currentlyReadingIndex === i ? "Halt Feed" : "Read Aloud"}
                    </button>

                    <button 
                      type="button"
                      onClick={() => copyToClipboard(m.text || '', i)} 
                      className="min-h-[36px] px-2 text-[9px] font-black uppercase flex items-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer border border-white/5 rounded-lg bg-black/35 backdrop-blur-md shadow-inner text-zinc-400 hover:text-white"
                    >
                      {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedIndex === i ? "Synced" : "Copy Log"}
                    </button>

                    <span className="text-[8px] font-mono font-black text-zinc-600 tracking-widest uppercase ml-auto">
                      TOKENS: {(m.text || '').split(/\s+/).length}
                    </span>
                 </>
               )}
            </div>
          </div>
        ))}
        
        {isSearching && (
          <div className={`flex flex-col gap-1.5 p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl w-fit shadow-xl ${deepReasoningMode ? 'border-amber-500/30' : ''}`}>
            <div className={`text-[10px] font-black font-mono uppercase tracking-widest flex items-center gap-2 ${deepReasoningMode ? 'text-amber-500' : t.text}`}>
              <Loader2 className={`w-4 h-4 animate-spin ${deepReasoningMode ? 'text-amber-500' : t.text}`} /> 
              {deepReasoningMode ? "DEEP LOGIC MATRIX ENGAGED" : "UPLINKING TO SATELLITE..."}
            </div>
            <div className="text-[8px] font-mono text-zinc-400 tracking-widest uppercase pl-6 animate-pulse">
              {deepReasoningMode ? "Running multi-step telemetry calculations..." : `Aggregating up to ${maxImageCount} web images & media...`}
            </div>
          </div>
        )}
        
        {hardwareError && (
          <div className="bg-rose-950/40 backdrop-blur-md border border-rose-900/50 p-3 rounded-xl flex items-start gap-2 mt-2 shadow-lg">
            <AlertTriangle className="text-rose-400 w-4 h-4 shrink-0" />
            <p className="text-rose-400 text-[9px] font-black uppercase tracking-wider leading-relaxed">{hardwareError}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-2 flex flex-col gap-2 shrink-0 relative z-10 border-t border-white/10 pt-3">
        
        <div className="flex gap-2 items-center justify-between">
          {selectedImage ? (
            <div className="relative inline-block w-fit">
              <img src={selectedImage} alt="Preview" className={`h-10 w-10 object-cover rounded-lg border ${t.border} shadow-lg`} />
              <button 
                type="button"
                onClick={clearSelectedImage}
                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-lg flex items-center justify-center cursor-pointer transition-transform active:scale-95"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploadingImg}
                title="Upload Photo"
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/5 border border-white/10 text-zinc-300 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shrink-0`}
              >
                {isUploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4.5 h-4.5" />}
              </button>

              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" />
              <button 
                type="button"
                onClick={() => cameraInputRef.current?.click()} 
                disabled={isUploadingImg}
                title="Camera Snap"
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/5 border border-white/10 text-zinc-300 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shrink-0`}
              >
                {isUploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4.5 h-4.5" />}
              </button>

              <button 
                type="button"
                onClick={toggleListening}
                title="Voice Input"
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all duration-300 active:scale-95 border cursor-pointer shadow-md shrink-0 ${
                  isListening ? "bg-rose-900/60 border-rose-500/50 text-rose-400 animate-pulse" : `bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10`
                }`}
              >
                {isListening ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => setEnableImageSearch(!enableImageSearch)}
              title={enableImageSearch ? "Image Search Enabled" : "Image Search Disabled"}
              className={`min-h-[44px] px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer shadow-sm ${enableImageSearch ? `${t.dim}` : 'bg-black/40 border-white/10 text-zinc-500 hover:bg-white/5'}`}
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" /> <span className="hidden xs:inline">{enableImageSearch ? "Pics ON" : "Pics OFF"}</span>
            </button>
            <button
              type="button"
              onClick={() => setEnableYouTubeSearch(!enableYouTubeSearch)}
              title={enableYouTubeSearch ? "YouTube Research Enabled" : "YouTube Research Disabled"}
              className={`min-h-[44px] px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer shadow-sm ${enableYouTubeSearch ? 'bg-rose-950/40 text-rose-400 border-rose-900/50' : 'bg-black/40 border-white/10 text-zinc-500 hover:bg-white/5'}`}
            >
              <Youtube className="w-3.5 h-3.5 shrink-0" /> <span className="hidden xs:inline">{enableYouTubeSearch ? "YT ON" : "YT OFF"}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSearch(input);
              }
            }}
            rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
            className={`flex-1 min-w-0 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl py-3 px-4 text-white ${fontSizeClass} font-bold outline-none focus:border-white/30 transition-colors placeholder:text-zinc-500 min-h-[44px] max-h-[120px] custom-scrollbar shadow-inner resize-none leading-relaxed`}
            placeholder={`Ask System.${persona.toUpperCase()} or input trail logs...`}
          />
          
          <button 
            type="button"
            onClick={() => handleSearch(input)}
            disabled={(!input.trim() && !selectedImage) || isSearching || isUploadingImg}
            className={`min-h-[44px] h-[44px] w-16 shrink-0 rounded-xl disabled:opacity-20 transition-all duration-300 active:scale-95 flex items-center justify-center cursor-pointer ${deepReasoningMode ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : `${t.bg} text-black shadow-lg`}`}
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}