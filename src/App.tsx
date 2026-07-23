"use client";

import React, { useState, useEffect, useRef } from "react";
import icon from "./assets/icon.png";
import { PEVType, ForumPost, SavedRide } from "./types";
import Dashboard from "./components/Dashboard";
import PEVAnalyzer from "./components/PEVAnalyzer";
import GroundedAssistant from "./components/GroundedAssistant";
import YouTubeFeed from "./components/YouTubeFeed";
import BoardRecyclerView from "./components/BoardRecyclerView";
import RiderRadar from "./components/RiderRadar";
import { 
  Compass, Cpu, Sparkles, Youtube, MessageSquare, Shield, 
  Users, Settings, AlertTriangle, CheckSquare,
  Trash2, Palette, User, EyeOff, Ruler, X,
  Map, PlayCircle, FileText, Lock, Key, Download, WifiOff,
  Mail, LogOut, Loader2, Fingerprint, Activity, 
  Battery, FileSignature, Eye, Info, Zap, Wrench,
  UploadCloud, HardDrive, Globe, Clock, RefreshCw,
  ZapOff, Type, Volume2, ShieldAlert, Languages
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- NATIVE CAPACITOR PLUGINS FOR APK STORAGE ---
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// --- NON-GOOGLE AUTHENTICATION (SUPABASE) ---
import { createClient } from '@supabase/supabase-js';

// 🔥 SECURED: Keys are hidden inside your .env.local file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const INITIAL_RIDES: SavedRide[] = [];
const INITIAL_POSTS: ForumPost[] = [];

type TabId = "DASH" | "RADAR" | "DIAGNOSTICS" | "ASSISTANT" | "CHANNEL" | "FORUM";
type ThemePreset = "lime" | "cyan" | "emerald" | "amber" | "rose";
type UIScale = "compact" | "normal" | "large";

export default function App() {
  // --- SUPABASE AUTHENTICATION & IDENTITY STATE ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP" | "FORGOT_PASSWORD">("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [callsign, setCallsign] = useState("");
  const [globalCallsign, setGlobalCallsign] = useState("");
  const [needsCallsignPrompt, setNeedsCallsignPrompt] = useState(false);
  const [missingCallsignInput, setMissingCallsignInput] = useState("");

  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [showFounderBio, setShowFounderBio] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // --- APP NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem("rural_default_tab") as TabId) || "DASH";
    return "DASH";
  });
  const [savedRides, setSavedRides] = useState<SavedRide[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [prefilledPost, setPrefilledPost] = useState<{ text: string; userBadge: string } | null>(null);

  // --- ONBOARDING & GATEWAY STATE ---
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("rural_onboarding") === "completed";
    return false;
  });
  const [agreedTos, setAgreedTos] = useState(false);
  const [agreedSafety, setAgreedSafety] = useState(false);
  const [agreedBattery, setAgreedBattery] = useState(false);
  
  // --- SETTINGS & PREFERENCES STATE ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "preferences" | "appearance">("profile");
  
  // --- GLOBAL REAL SETTINGS ENGINE (OMNIBUS) ---
  const [brandTheme, setBrandTheme] = useState<ThemePreset>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem("rural_theme") as ThemePreset) || "lime";
    return "lime";
  });
  const [units, setUnits] = useState<"imperial" | "metric">(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem("rural_units") as any) || "imperial";
    return "imperial";
  });
  const [ghostMode, setGhostMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("radar_ghost_mode") === "true";
    return false;
  });
  const [satelliteMap, setSatelliteMap] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("rural_satmap") === "true";
    return false;
  });
  const [locale, setLocale] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("rural_locale") || "en";
    return "en";
  });
  const [timeFormat, setTimeFormat] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("rural_time_format") || "12h";
    return "12h";
  });

  const [performanceMode, setPerformanceMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("rural_perf_mode") === "true";
    return false;
  });
  const [uiScale, setUiScale] = useState<UIScale>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem("rural_ui_scale") as UIScale) || "normal";
    return "normal";
  });
  const [defaultBootTab, setDefaultBootTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem("rural_default_tab") as TabId) || "DASH";
    return "DASH";
  });
  const [globalVolume, setGlobalVolume] = useState(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem("rural_global_vol")) || 100;
    return 100;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 🔥 UNIVERSAL IDENTITY SYNC 🔥 ---
  const syncUniversalIdentity = (username: string) => {
    if (!username || !username.trim()) return;
    const cleanName = username.trim();
    setGlobalCallsign(cleanName);
    localStorage.setItem("rural_erides_username", cleanName);
    localStorage.setItem("radar_screen_name", cleanName);
    localStorage.setItem("copilot_pilot_name", cleanName);
    localStorage.setItem("radar_callsign_locked", "true");
  };

  const processUserSession = (activeUser: any) => {
    setUser(activeUser);
    localStorage.setItem("rural_erides_offline_user", JSON.stringify(activeUser));
    
    // Check Supabase Cloud metadata first
    const existingCallsign = activeUser?.user_metadata?.username;
    if (existingCallsign && existingCallsign.trim()) {
      syncUniversalIdentity(existingCallsign);
      setNeedsCallsignPrompt(false);
    } else {
      setNeedsCallsignPrompt(true);
    }
  };

  // --- INITIALIZATION & STABILIZED OFFLINE SURVIVAL ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setIsOfflineMode(true);
          const cachedUser = localStorage.getItem("rural_erides_offline_user");
          if (cachedUser) processUserSession(JSON.parse(cachedUser));
          setAuthLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          processUserSession(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setIsOfflineMode(true);
        const cachedUser = localStorage.getItem("rural_erides_offline_user");
        if (cachedUser) processUserSession(JSON.parse(cachedUser));
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          processUserSession(session.user);
        } else {
          setUser(null);
          setGlobalCallsign("");
          setNeedsCallsignPrompt(false);
        }
      });
      return () => subscription.unsubscribe();
    } catch (e) {
      console.error("Auth listener bind failed safely.");
    }
  }, []);

  useEffect(() => {
    try {
      const cachedRides = localStorage.getItem("rural_erides_rides");
      const cachedPosts = localStorage.getItem("rural_erides_posts");

      if (cachedRides) setSavedRides(JSON.parse(cachedRides));
      else { setSavedRides(INITIAL_RIDES); localStorage.setItem("rural_erides_rides", JSON.stringify(INITIAL_RIDES)); }

      if (cachedPosts) setPosts(JSON.parse(cachedPosts));
      else { setPosts(INITIAL_POSTS); localStorage.setItem("rural_erides_posts", JSON.stringify(INITIAL_POSTS)); }
    } catch (e) {
      console.error("Component cache init failed.");
    }
  }, []);

  // --- HANDLER FOR EXISTING USERS WITHOUT A CALLSIGN ---
  const handleSetMissingCallsign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const cleanName = missingCallsignInput.trim();
    
    if (cleanName.length < 3) {
      setAuthError("Callsign must be at least 3 characters long.");
      return;
    }

    setIsProcessingAuth(true);
    try {
      if (navigator.onLine && !isOfflineMode) {
        const { data, error } = await supabase.auth.updateUser({
          data: { username: cleanName }
        });
        if (error) throw error;
        if (data.user) {
          processUserSession(data.user);
        }
      } else {
        syncUniversalIdentity(cleanName);
        setNeedsCallsignPrompt(false);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to register callsign with Supabase.");
    } finally {
      setIsProcessingAuth(false);
    }
  };

  // --- SUPABASE AUTHENTICATION HANDLERS ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsProcessingAuth(true);

    if (!navigator.onLine || isOfflineMode) {
      const cachedUser = localStorage.getItem("rural_erides_offline_user");
      if (cachedUser && authMode === "LOGIN") {
        processUserSession(JSON.parse(cachedUser));
        setIsOfflineMode(true);
        setIsProcessingAuth(false);
        return;
      } else {
        setAuthError("HARDWARE OFFLINE: Cannot establish new connection or reset passwords without network.");
        setIsProcessingAuth(false);
        return;
      }
    }

    try {
      if (authMode === "FORGOT_PASSWORD") {
        if (!email) throw new Error("Email is required for password recovery.");
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setAuthSuccess("Recovery sequence initiated. Check your secure email for a reset link.");
      } else if (authMode === "SIGNUP") {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        if (!callsignInput.trim()) throw new Error("Rider Callsign is required.");
        if (callsignInput.trim().length < 3) throw new Error("Callsign must be at least 3 characters.");

        const { data, error } = await supabase.auth.signUp({ 
          email, password, options: { data: { username: callsignInput.trim() } }
        });
        if (error) throw error;
        
        if (data.user) {
          processUserSession(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          processUserSession(data.user);
        }
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsProcessingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (navigator.onLine && !isOfflineMode) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setGlobalCallsign("");
      setNeedsCallsignPrompt(false);
      setIsSettingsOpen(false);
      setHasCompletedOnboarding(false); 
      localStorage.removeItem("rural_onboarding");
      localStorage.removeItem("rural_erides_offline_user");
    } catch (error) {
      console.error("Error signing out:", error);
      setUser(null);
    }
  };

  // --- OMNIBUS SYNC ENGINE: UNIVERSAL CONTROLS ---
  const changeTheme = (theme: ThemePreset) => { 
    setBrandTheme(theme); 
    localStorage.setItem("rural_theme", theme);
    localStorage.setItem("rt_theme", theme); 
    localStorage.setItem("rural_erides_brand_theme", theme); 
    localStorage.setItem("copilot_theme", theme); 
    localStorage.setItem("universal_brand_theme", theme);
    window.dispatchEvent(new Event('theme-sync'));
  };

  const toggleUnits = () => {
    const newVal = units === "imperial" ? "metric" : "imperial"; 
    const isMetric = newVal === "metric" ? "true" : "false";
    setUnits(newVal); 
    localStorage.setItem("rural_units", newVal);
    localStorage.setItem("rt_use_metric", isMetric); 
    localStorage.setItem("radar_use_metric", isMetric); 
    localStorage.setItem("yt_ai_units", newVal); 
    localStorage.setItem("universal_user_units", newVal);
    window.dispatchEvent(new Event('storage'));
  };

  const toggleGhostMode = () => {
    const newVal = !ghostMode; 
    setGhostMode(newVal); 
    localStorage.setItem("radar_ghost_mode", newVal ? "true" : "false"); 
    localStorage.setItem("rt_privacy_mode", newVal ? "true" : "false"); 
  };

  const changeLocale = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; 
    setLocale(val); 
    localStorage.setItem("rural_locale", val);
  };
  
  const toggleTimeFormat = () => {
    const newVal = timeFormat === "12h" ? "24h" : "12h"; 
    setTimeFormat(newVal); 
    localStorage.setItem("rural_time_format", newVal);
  };

  const toggleSatelliteMap = () => {
    const newVal = !satelliteMap;
    setSatelliteMap(newVal);
    localStorage.setItem("rural_satmap", newVal.toString());
  };

  const togglePerformanceMode = () => {
    const newVal = !performanceMode;
    setPerformanceMode(newVal);
    localStorage.setItem("rural_perf_mode", newVal.toString());
  };

  const updateUiScale = (scale: UIScale) => {
    setUiScale(scale);
    localStorage.setItem("rural_ui_scale", scale);
    localStorage.setItem("copilot_font_size", scale === "large" ? "lg" : scale === "compact" ? "sm" : "md"); 
  };

  const updateDefaultBootTab = (tab: TabId) => {
    setDefaultBootTab(tab);
    localStorage.setItem("rural_default_tab", tab);
  };

  const updateGlobalVolume = (vol: number) => {
    setGlobalVolume(vol);
    localStorage.setItem("rural_global_vol", vol.toString());
  };

  // --- NATIVE STORAGE PERMISSION HANDLER ---
  const ensureStoragePermissions = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const check = await Filesystem.checkPermissions();
        if (check.publicStorage !== 'granted') {
          const req = await Filesystem.requestPermissions();
          if (req.publicStorage !== 'granted') {
            alert("CRITICAL: Storage permission is required to export or restore data on mobile devices.");
            return false;
          }
        }
        return true;
      } catch (e) {
        return true; 
      }
    }
    return true; 
  };

  // --- 🔥 EXHAUSTIVE OMNIBUS APP BACKUP: ZIP EXPORT 🔥 ---
  const exportZipBackup = async () => {
    const hasPerm = await ensureStoragePermissions();
    if (!hasPerm) return;

    try {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.onload = () => {
        const zip = new (window as any).JSZip();
        
        const masterData: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !key.startsWith('sb-')) { 
            masterData[key] = localStorage.getItem(key) || "";
          }
        }
        zip.file("rural_erides_master_backup.json", JSON.stringify(masterData, null, 2));

        const settings = {
          theme: localStorage.getItem("rural_theme"),
          units: localStorage.getItem("rural_units"),
          ghostMode: localStorage.getItem("radar_ghost_mode"),
          satMap: localStorage.getItem("rural_satmap"),
          locale: localStorage.getItem("rural_locale"),
          timeFormat: localStorage.getItem("rural_time_format"),
          username: localStorage.getItem("rural_erides_username"),
          perfMode: localStorage.getItem("rural_perf_mode"),
          uiScale: localStorage.getItem("rural_ui_scale"),
          defaultTab: localStorage.getItem("rural_default_tab")
        };
        zip.file("rural_erides_settings.json", JSON.stringify(settings, null, 2));

        const isNative = Capacitor.isNativePlatform();
        const format = isNative ? "base64" : "blob";

        zip.generateAsync({type: format}).then(async (content: any) => {
          if (isNative) {
            try {
              const fileName = `Rural_ERides_Global_Backup_${new Date().toISOString().split('T')[0]}.zip`;
              await Filesystem.writeFile({
                path: fileName,
                data: content,
                directory: Directory.Documents,
              });
              alert(`Native Backup successful! Saved to your device Documents folder as ${fileName}`);
            } catch (err: any) {
              alert(`Native File System Error: ${err.message}`);
            }
          } else {
            if ('showSaveFilePicker' in window) {
              try {
                const handle = await (window as any).showSaveFilePicker({
                  suggestedName: `Rural_ERides_Global_Backup_${new Date().toISOString().split('T')[0]}.zip`,
                  types: [{ description: 'ZIP Archive', accept: {'application/zip': ['.zip']} }],
                });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
                alert("Telemetry & Component matrix successfully backed up to your selected directory.");
                return;
              } catch (err: any) {
                if (err.name !== 'AbortError') console.error("FilePicker Error:", err);
                return; 
              }
            }
            
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Rural_ERides_Global_Backup_${new Date().toISOString().split('T')[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            alert("ZIP Backup downloaded successfully.");
          }
        });
      };
      document.body.appendChild(script);
    } catch (err) {
      console.error("ZIP Backup failed:", err);
      alert("CRITICAL ERROR: Failed to generate ZIP backup.");
    }
  };

  // --- 🔥 EXHAUSTIVE OMNIBUS APP RESTORE: ZIP IMPORT 🔥 ---
  const handleZipRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const hasPerm = await ensureStoragePermissions();
    if (!hasPerm) return;

    if (window.confirm("WARNING: Restoring this backup will permanently overwrite your current local telemetry, all component chat logs, and app preferences. Proceed?")) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.onload = () => {
        const zip = new (window as any).JSZip();
        zip.loadAsync(file).then(async (contents: any) => {
          if (contents.files["rural_erides_master_backup.json"]) {
             const masterText = await contents.files["rural_erides_master_backup.json"].async("string");
             try {
               const allData = JSON.parse(masterText);
               Object.keys(allData).forEach(key => localStorage.setItem(key, allData[key]));
               
               alert("System Restoration Complete. Avionics rebooting to inject new parameters.");
               window.location.reload(); 
             } catch (e) {
               alert("Failed to parse master backup JSON payload.");
             }
          } else {
             alert("Invalid backup archive format detected.");
          }
        }).catch(() => {
          alert("CRITICAL ERROR: Failed to read ZIP archive. Payload may be corrupted.");
        });
      };
      document.body.appendChild(script);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const wipeLocalData = () => {
    if (window.confirm("CRITICAL WARNING: This will permanently purge all telemetry, local component logs, and device configurations. Proceed?")) {
      localStorage.clear(); 
      setSavedRides([]);
      setHasCompletedOnboarding(false);
      alert("Local memory wiped. Avionics restarting.");
      window.location.reload();
    }
  };

  const finishOnboarding = () => {
    if (agreedTos && agreedSafety && agreedBattery) {
      setHasCompletedOnboarding(true);
      localStorage.setItem("rural_onboarding", "completed");
    } else {
      alert("CRITICAL ERROR: All legal security and safety protocols must be actively acknowledged to unlock the avionics suite.");
    }
  };

  const themeMap = {
    lime: { hex: "#39ff14", text: "text-[#39ff14]", bg: "bg-[#39ff14]", border: "border-[#39ff14]", gradient: "from-[#39ff14] to-emerald-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(57,255,20,0.3)]", blur: performanceMode ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm' },
    cyan: { hex: "#06b6d4", text: "text-cyan-400", bg: "bg-cyan-500", border: "border-cyan-500", gradient: "from-cyan-400 to-blue-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(6,182,212,0.3)]", blur: performanceMode ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm' },
    emerald: { hex: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500", gradient: "from-emerald-400 to-teal-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(16,185,129,0.3)]", blur: performanceMode ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm' },
    amber: { hex: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500", gradient: "from-amber-400 to-orange-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(245,158,11,0.3)]", blur: performanceMode ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm' },
    rose: { hex: "#f43f5e", text: "text-rose-400", bg: "bg-rose-500", border: "border-rose-500", gradient: "from-rose-400 to-red-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(244,63,94,0.3)]", blur: performanceMode ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm' }
  };
  const activeTheme = themeMap[brandTheme as keyof typeof themeMap] || themeMap.lime;

  const fontScaleMap = {
    compact: "text-[12px]",
    normal: "text-[14px]",
    large: "text-[16px]"
  };

  const handleAddRide = (newRide: SavedRide) => { const updatedRides = [newRide, ...savedRides]; setSavedRides(updatedRides); localStorage.setItem("rural_erides_rides", JSON.stringify(updatedRides)); };
  const handleShareRideLog = (data: { text: string; pevType: string }) => { setPrefilledPost({ text: data.text, userBadge: data.pevType }); setActiveTab("FORUM"); };

  // --- PASSING GLOBAL OMNIBUS STATE TO SUBSYSTEMS ---
  const renderTabContent = () => {
    const globalProps = {
      theme: brandTheme,
      useMetric: units === "metric",
      ghostMode,
      satelliteMap,
      locale,
      timeFormat,
      performanceMode,
      uiScale,
      globalVolume,
      callsign: globalCallsign
    };

    switch (activeTab) {
      case "RADAR": return <RiderRadar {...globalProps} />;
      case "DIAGNOSTICS": return <PEVAnalyzer {...globalProps} />;
      case "ASSISTANT": return <GroundedAssistant {...globalProps} />;
      case "CHANNEL": return <YouTubeFeed {...globalProps} />;
      case "FORUM": return <BoardRecyclerView {...globalProps} prefilledPost={prefilledPost} onClearPrefilled={() => setPrefilledPost(null)} />;
      case "DASH": default: return <Dashboard {...globalProps} onAddRide={handleAddRide} savedRides={savedRides} onShareRideLog={handleShareRideLog} />;
    }
  };

  const navigationItems = [
    { id: "DASH" as TabId, label: "COCKPIT", icon: Compass },
    { id: "RADAR" as TabId, label: "FIND FRIENDS", icon: Users },
    { id: "DIAGNOSTICS" as TabId, label: "DIAGNOSTICS", icon: Cpu },
    { id: "ASSISTANT" as TabId, label: "CO-PILOT", icon: Sparkles },
    { id: "CHANNEL" as TabId, label: "CHANNEL", icon: Youtube },
    { id: "FORUM" as TabId, label: "RIDER BOARD", icon: MessageSquare },
  ];

  // --- 0. AUTH LOADING SCREEN ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#06060a] flex flex-col items-center justify-center p-6 text-[#39ff14]">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[#39ff14]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#39ff14] border-t-transparent rounded-full animate-spin"></div>
          <Fingerprint className="absolute inset-0 m-auto w-10 h-10 text-[#39ff14] animate-pulse" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-widest animate-pulse font-mono text-[#39ff14]">Authenticating...</h1>
      </div>
    );
  }

  // --- 1. WELCOMING ANIMATED LOGIN / GATEWAY SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center p-4 sm:p-6 text-zinc-100 font-sans relative overflow-hidden">
        {!performanceMode && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#39ff14]/5 rounded-full blur-[150px] pointer-events-none"></div>}
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`bg-[#0d0e15]/90 ${activeTheme.blur} border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative z-10 flex flex-col my-8`}
        >
          {/* Welcoming Header */}
          <div className="flex flex-col items-center justify-center mb-6 shrink-0">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative mb-5 group"
            >
              {!performanceMode && <div className="absolute inset-0 bg-[#39ff14]/20 blur-xl rounded-full group-hover:bg-[#39ff14]/30 transition-all"></div>}
              <img src={icon} alt="Logo" className={`w-24 h-24 rounded-2xl border-2 border-[#39ff14]/50 ${performanceMode ? '' : 'shadow-[0_0_30px_rgba(57,255,20,0.3)]'} object-cover relative z-10`} />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#39ff14] to-emerald-400 text-center leading-tight drop-shadow-sm"
            >
              RURAL ERIDES GO
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-zinc-300 font-medium text-center mt-3 max-w-sm"
            >
              Welcome to the premier universal network for PEV riders. Track telemetry, share your garage, and connect with riders globally.
            </motion.p>
          </div>

          <AnimatePresence>
            {showFounderBio && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }} 
                transition={{ duration: 0.3 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-black/60 border border-zinc-700 p-5 rounded-2xl shadow-inner relative">
                  <button onClick={() => setShowFounderBio(false)} className="absolute top-3 right-3 text-zinc-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#39ff14] flex items-center justify-center text-black font-black shadow-[0_0_15px_rgba(57,255,20,0.4)]">BC</div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Bradley Callison</h3>
                      <p className="text-[9px] text-[#39ff14] font-mono uppercase tracking-widest">Network Founder & Creator</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-medium mb-3">
                    Based in Stigler, Oklahoma, I built Rural ERides Go to unite the global PEV community. As the host of the <strong className="text-white">@bradleycallison</strong> YouTube channel, I rigorously test personal electric vehicles in demanding rural environments—balancing this passion with over a decade of dedicated early-morning shifts in the fast-food industry.
                  </p>
                  <div className="bg-[#121318] p-3 rounded-xl border border-zinc-800 shadow-inner">
                    <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest block mb-2"><Wrench className="w-3 h-3 inline mr-1"/> Active Garage Assembly:</span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-zinc-100">
                      <span className="bg-black px-2 py-1 rounded border border-zinc-800">Aostirmotor A20 E-Bike</span>
                      <span className="bg-black px-2 py-1 rounded border border-zinc-800">Geemax E-Trike</span>
                      <span className="bg-black px-2 py-1 rounded border border-zinc-800">Engwe Y600 Scooter</span>
                      <span className="bg-black px-2 py-1 rounded border border-[#39ff14]/30 text-[#39ff14]">iSinwheel H7 Pro (IP54)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showFounderBio && (
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setShowFounderBio(true)} 
              className="mb-6 mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-[#39ff14] transition-colors border border-zinc-800 hover:border-[#39ff14]/50 bg-black/50 px-4 py-2 rounded-full shadow-inner"
            >
              <Info className="w-3.5 h-3.5" /> Read Founder's Message
            </motion.button>
          )}

          <AnimatePresence>
            {authError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-950/40 border border-red-900/50 text-red-300 text-xs rounded-xl p-4 mb-6 flex items-start gap-3 shadow-inner">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-bold leading-relaxed">{authError}</p>
              </motion.div>
            )}
            {authSuccess && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs rounded-xl p-4 mb-6 flex items-start gap-3 shadow-inner">
                <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-bold leading-relaxed">{authSuccess}</p>
              </motion.div>
            )}
            {(!navigator.onLine || isOfflineMode) && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-amber-950/40 border border-amber-900/50 text-amber-300 text-xs rounded-xl p-4 mb-6 flex items-start gap-3 shadow-inner">
                 <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
                 <p className="font-bold leading-relaxed">HARDWARE OFFLINE: Cellular connection lost. System running on cached offline telemetry. Local authentication sequence available.</p>
               </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            <AnimatePresence>
              {authMode === "SIGNUP" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="pb-4">
                    <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">Rider Callsign (Username)</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input 
                        type="text" 
                        required={authMode === "SIGNUP"}
                        value={callsignInput}
                        onChange={(e) => setCallsignInput(e.target.value)}
                        placeholder="e.g. BradleyRider" 
                        className="w-full bg-black/80 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-[#39ff14] transition-all shadow-inner placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">Secure Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pilot@network.com" 
                  className="w-full bg-black/80 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-[#39ff14] transition-all shadow-inner placeholder:text-zinc-600"
                />
              </div>
            </div>

            <AnimatePresence>
              {(authMode === "LOGIN" || authMode === "SIGNUP") && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="pt-1">
                    <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">Access Code</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input 
                        type="password" 
                        required={authMode !== "FORGOT_PASSWORD"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-black/80 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-[#39ff14] transition-all shadow-inner placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {authMode === "SIGNUP" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="pt-1">
                    <label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">Confirm Access Code</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input 
                        type="password" 
                        required={authMode === "SIGNUP"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-black/80 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-[#39ff14] transition-all shadow-inner placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {authMode === "LOGIN" && (
              <div className="flex justify-end mt-2">
                <button type="button" onClick={() => { setAuthMode("FORGOT_PASSWORD"); setAuthError(""); setAuthSuccess(""); }} className="text-[10px] text-zinc-400 hover:text-[#39ff14] transition-colors font-bold tracking-wider uppercase">
                  Forgot Password?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isProcessingAuth}
              className={`w-full bg-[#39ff14] hover:bg-[#32e011] text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${performanceMode ? '' : 'shadow-[0_0_20px_rgba(57,255,20,0.3)]'} mt-4 disabled:opacity-50 font-mono`}
            >
              {isProcessingAuth ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
              {authMode === "LOGIN" ? "Establish Connection" : authMode === "SIGNUP" ? "Register Pilot & Boot" : "Send Recovery Sequence"}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-zinc-800/80 text-center flex flex-col gap-3">
            {authMode !== "LOGIN" && (
              <button 
                type="button"
                onClick={() => { setAuthMode("LOGIN"); setAuthError(""); setAuthSuccess(""); }}
                className="text-xs font-bold text-zinc-400 hover:text-[#39ff14] transition-colors tracking-wide"
              >
                Return to Connection Portal
              </button>
            )}
            {authMode === "LOGIN" && (
              <button 
                type="button"
                onClick={() => { setAuthMode("SIGNUP"); setAuthError(""); setAuthSuccess(""); setPassword(""); setConfirmPassword(""); }}
                className="text-xs font-bold text-zinc-400 hover:text-[#39ff14] transition-colors tracking-wide"
              >
                New Rider? Request Clearance Here
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // --- MISSING CALLSIGN GATEWAY OVERLAY FOR EXISTING USERS ---
  if (needsCallsignPrompt) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center p-4 text-zinc-100 font-sans">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0d0e15] border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h2 className="text-sm font-black uppercase text-white tracking-widest">Callsign Required</h2>
              <p className="text-[10px] text-zinc-400 font-mono">Supabase Account Identity Incomplete</p>
            </div>
          </div>

          <p className="text-xs text-zinc-200 leading-relaxed mb-4 font-bold">
            Your account is authenticated, but you do not have a designated Rider Callsign. Please enter a callsign to bind to your Supabase profile.
          </p>

          {authError && <p className="text-xs font-bold text-red-400 mb-3">{authError}</p>}

          <form onSubmit={handleSetMissingCallsign} className="space-y-4">
            <input 
              type="text" 
              required 
              value={missingCallsignInput} 
              onChange={(e) => setMissingCallsignInput(e.target.value)} 
              placeholder="e.g. LordBradley" 
              className="w-full bg-black border border-zinc-800 text-xs font-bold text-white rounded-xl p-3 outline-none focus:border-amber-500" 
            />
            <button type="submit" disabled={isProcessingAuth} className="w-full bg-amber-500 text-black font-black uppercase tracking-widest py-3 rounded-xl text-xs shadow-lg">
              {isProcessingAuth ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Bind Callsign & Proceed"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- 2. DEEP ONBOARDING / EXHAUSTIVE TOS SCREEN ---
  if (!hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center p-4 sm:p-6 text-zinc-100 font-sans relative overflow-hidden">
        {!performanceMode && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#39ff14]/5 rounded-full blur-[150px] pointer-events-none"></div>}
        
        <div className={`bg-[#0d0e15]/95 ${activeTheme.blur} border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative z-10 flex flex-col h-[90vh]`}>
          <div className="flex flex-col items-center justify-center mb-6 shrink-0">
            <FileSignature className={`w-12 h-12 text-[#39ff14] mb-4 ${performanceMode ? '' : 'drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]'}`} />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white text-center leading-tight">MANDATORY PILOT BRIEFING</h1>
            <p className="text-[10px] text-zinc-300 font-mono mt-2 uppercase tracking-widest text-center">Read & Legally Acknowledge All Risk Protocols</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 sm:pr-3 custom-scrollbar space-y-4 pb-4">
            
            {/* 1. Legal Terms & Liability Waiver */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-colors duration-300 shadow-inner ${agreedTos ? 'bg-[#39ff14]/10 border-[#39ff14]/50' : 'bg-black/50 border-zinc-800 hover:border-zinc-700'}`}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <FileText className={`w-8 h-8 shrink-0 hidden sm:block ${agreedTos ? 'text-[#39ff14]' : 'text-zinc-500'}`} />
                <div className="flex-1 w-full">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2 flex items-center gap-2"><FileText className="w-4 h-4 sm:hidden"/> 1. Comprehensive Release of Liability & Binding Arbitration</h3>
                  <div className="text-[11px] text-zinc-300 space-y-3 mb-5 leading-relaxed font-bold">
                    <p><strong>Assumption of Severe Risk:</strong> By accessing Rural ERides Go, you (the 'Rider') enter into a legally binding agreement in perpetuity. You expressly assume all risks associated with modifying and operating Personal Electric Vehicles (PEVs). These extreme risks include, but are not limited to, catastrophic hardware failure, high-speed collisions, property damage, severe bodily injury, dismemberment, or death.</p>
                    <p><strong>Absolute Indemnification:</strong> The application developers, Bradley Callison, and all associated network entities or affiliates are providing this telemetry software strictly "AS IS". Under no circumstances—whether arising in contract, tort, or strict liability—will the creators be held liable for physical harm, medical bills, litigation, hardware malfunction, or legal infractions occurring while using this software or applying technical advice sourced from the Global Board Matrix. You agree to waive all rights to class-action lawsuits.</p>
                  </div>
                  <button onClick={() => setAgreedTos(!agreedTos)} className="flex items-center gap-3 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white bg-zinc-900/50 p-3 sm:p-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors w-full text-left shadow-inner">
                    <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors ${agreedTos ? 'bg-[#39ff14] border-[#39ff14] text-black shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'bg-zinc-950 border-zinc-600 text-transparent'}`}>
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                    I Accept the Comprehensive Liability Waiver
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Hardware & Battery Safety */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-colors duration-300 shadow-inner ${agreedBattery ? 'bg-[#39ff14]/10 border-[#39ff14]/50' : 'bg-black/50 border-zinc-800 hover:border-zinc-700'}`}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Battery className={`w-8 h-8 shrink-0 hidden sm:block ${agreedBattery ? 'text-[#39ff14]' : 'text-amber-500'}`} />
                <div className="flex-1 w-full">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2 flex items-center gap-2"><Battery className="w-4 h-4 sm:hidden text-amber-500"/> 2. Class D Lithium-Ion Thermal Runaway Risks</h3>
                  <div className="text-[11px] text-zinc-300 space-y-3 mb-5 leading-relaxed font-bold">
                    <p className="font-black text-amber-400 uppercase tracking-wide">FIRE, TOXIC GAS, & CATASTROPHIC HARDWARE RISK.</p>
                    <p>Lithium-Ion (Li-ion) and Lithium Iron Phosphate (LiFePO4) battery packs require active Battery Management Systems (BMS) for safe cell balancing. Bypassing discharge limits, operating with damaged phase wires, modifying controllers, or exposing cells to extreme kinetic impacts can cause spontaneous thermal runaway propagation.</p>
                    <p>You agree to NEVER charge a PEV unattended, NEVER charge while ambient core temperatures are below freezing (32°F / 0°C), NEVER plug in a charger immediately after a high-drain ride, and to safely dispose of bloated or oxidized cells according to HAZMAT regulations.</p>
                  </div>
                  <button onClick={() => setAgreedBattery(!agreedBattery)} className="flex items-center gap-3 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white bg-zinc-900/50 p-3 sm:p-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors w-full text-left shadow-inner">
                    <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors ${agreedBattery ? 'bg-[#39ff14] border-[#39ff14] text-black shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'bg-zinc-950 border-zinc-600 text-transparent'}`}>
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                    I Acknowledge Hardware & Battery Fire Risks
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Operational Safety */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-colors duration-300 shadow-inner ${agreedSafety ? 'bg-[#39ff14]/10 border-[#39ff14]/50' : 'bg-red-950/10 border-red-900/40 hover:border-red-800/60'}`}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <AlertTriangle className={`w-8 h-8 shrink-0 hidden sm:block ${agreedSafety ? 'text-[#39ff14]' : 'text-red-500 animate-pulse'}`} />
                <div className="flex-1 w-full">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 sm:hidden text-red-500"/> 3. Distracted Operation & Local Legal Adherence</h3>
                  <div className="text-[11px] text-zinc-300 space-y-3 mb-5 leading-relaxed font-bold">
                    <p className="font-black text-red-400 uppercase tracking-wide">DO NOT OPERATE AVIONICS OR TELEMETRY PANELS WHILE IN MOTION.</p>
                    <p>Screen distraction at high speeds can be instantly fatal. DOT-certified full-face helmets are strongly advised for any PEV capable of exceeding 20mph.</p>
                    <p>You are legally required to properly classify your PEV. Class 1 (pedal-assist up to 20mph), Class 2 (throttle up to 20mph), and Class 3 (assist up to 28mph) possess distinct roadway rights. Unclassified high-wattage scooters and EUCs may be strictly prohibited on municipal bike paths. You accept full liability for all municipal citations, vehicle impoundment, or traffic violations.</p>
                  </div>
                  <button onClick={() => setAgreedSafety(!agreedSafety)} className="flex items-center gap-3 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white bg-zinc-900/50 p-3 sm:p-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors w-full text-left shadow-inner">
                    <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors ${agreedSafety ? 'bg-[#39ff14] border-[#39ff14] text-black shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'bg-zinc-950 border-zinc-600 text-transparent'}`}>
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                    I Will Obey Laws and Never Ride Distracted
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-800 shrink-0">
            <button 
              onClick={finishOnboarding}
              disabled={!agreedTos || !agreedSafety || !agreedBattery}
              className={`w-full font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
                agreedTos && agreedSafety && agreedBattery
                  ? 'bg-[#39ff14] hover:bg-[#32e011] text-black shadow-[0_0_30px_rgba(57,255,20,0.4)]' 
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
              }`}
            >
              <Sparkles className="w-5 h-5" /> Initialize Avionics Sequence
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. MAIN APPLICATION INTERFACE WITH OMNIBUS SYNC CONTROLS ---
  return (
    <div className={`min-h-screen bg-[#06060a] text-white flex flex-col font-sans select-none antialiased relative ${fontScaleMap[uiScale]}`}>
      
      {/* Global Application Settings Modal Overlay */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className={`absolute inset-0 bg-black/80 ${activeTheme.blur}`}></motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#0d0e15] border border-zinc-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
              
              {/* Settings Header */}
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4 shrink-0">
                <h2 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2`}><Settings className={`w-5 h-5 ${activeTheme.text}`} /> System Config</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>

              {/* Settings Tabs */}
              <div className="flex flex-wrap border-b border-zinc-800/50 bg-black/40 shrink-0 mb-4 rounded-xl shadow-inner">
                <button onClick={() => setSettingsTab("profile")} className={`flex-1 min-w-[25%] py-3 px-2 text-[10px] font-black uppercase tracking-widest transition-colors text-center ${settingsTab === "profile" ? `${activeTheme.text} bg-zinc-900/50` : "text-zinc-400 hover:text-white"}`}>Account</button>
                <button onClick={() => setSettingsTab("preferences")} className={`flex-1 min-w-[25%] py-3 px-2 text-[10px] font-black uppercase tracking-widest transition-colors text-center ${settingsTab === "preferences" ? `${activeTheme.text} bg-zinc-900/50` : "text-zinc-400 hover:text-white"}`}>Prefs</button>
                <button onClick={() => setSettingsTab("appearance")} className={`flex-1 min-w-[25%] py-3 px-2 text-[10px] font-black uppercase tracking-widest transition-colors text-center ${settingsTab === "appearance" ? `${activeTheme.text} bg-zinc-900/50` : "text-zinc-400 hover:text-white"}`}>Appearance</button>
              </div>

              <div className="overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                
                {/* TAB: PROFILE & ACCOUNT */}
                {settingsTab === "profile" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="space-y-3">
                      <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Network Identity</h3>
                      <div className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-inner gap-4">
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-12 h-12 shrink-0 rounded-full ${activeTheme.bg} flex items-center justify-center text-black font-black text-lg shadow-lg`}>
                            {user?.email?.charAt(0).toUpperCase() || "P"}
                          </div>
                          <div className="truncate w-full">
                            <div className="text-xs font-bold text-white mb-0.5 truncate">{user?.email || "Unknown Pilot"}</div>
                            <div className={`text-[9px] ${isOfflineMode ? 'text-amber-500' : activeTheme.text} font-mono uppercase tracking-widest flex items-center gap-1`}>
                              <Shield className="w-3 h-3" /> {isOfflineMode ? 'Offline Cache Active' : 'Secure Token Active'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5"/> Data Archival & Restoration</h3>
                      <div className="flex flex-col gap-2">
                        
                        {/* Custom Path Backup */}
                        <button onClick={exportZipBackup} className={`w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 ${activeTheme.text} p-4 rounded-xl text-left transition-colors flex items-center justify-between group shadow-inner`}>
                          <div>
                            <div className="text-xs font-bold mb-0.5 flex items-center gap-2">Export Data (Select Folder) <Download className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" /></div>
                            <div className={`text-[9px] ${activeTheme.text} opacity-70 font-mono`}>Compile ride telemetry and settings into a custom local folder.</div>
                          </div>
                        </button>

                        {/* ZIP Restore Tool */}
                        <label className="w-full cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 hover:text-cyan-300 p-4 rounded-xl text-left transition-colors flex items-center justify-between group shadow-inner">
                          <div>
                            <div className="text-xs font-bold mb-0.5 flex items-center gap-2">Restore Backup (ZIP) <UploadCloud className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" /></div>
                            <div className="text-[9px] text-cyan-500/70 font-mono">Overwrite current profile with a previously saved archive.</div>
                          </div>
                          <input 
                            type="file" 
                            accept=".zip" 
                            className="hidden" 
                            onChange={handleZipRestore} 
                            ref={fileInputRef}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Access Control</h3>
                      <div className="flex flex-col gap-2">
                        <button onClick={handleSignOut} className="w-full bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 text-rose-400 hover:text-rose-300 p-4 rounded-xl text-left transition-colors flex items-center justify-between group shadow-inner">
                          <div>
                            <div className="text-xs font-bold mb-0.5 flex items-center gap-2">Disconnect Pilot Link <LogOut className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" /></div>
                            <div className="text-[9px] text-rose-500/70 font-mono">Sign out of your network account securely.</div>
                          </div>
                        </button>
                        
                        <button onClick={wipeLocalData} className="w-full bg-black hover:bg-rose-950/20 border border-zinc-800 hover:border-rose-900/50 text-zinc-400 hover:text-rose-500 p-4 rounded-xl text-left transition-colors flex items-center justify-between group shadow-inner">
                          <div>
                            <div className="text-xs font-bold mb-0.5 flex items-center gap-2">Purge Local Cache & Reset <Trash2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                            <div className="text-[9px] text-zinc-500 font-mono">Deletes saved rides, local settings, and resets all legal TOS agreements.</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: SYSTEM PREFERENCES (OMNIBUS CONTROLLER) */}
                {settingsTab === "preferences" && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* UI & Performance Tuning */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><ZapOff className="w-3.5 h-3.5"/> Interface Optimization</h3>
                      <div className="bg-black border border-zinc-800 rounded-xl shadow-inner divide-y divide-zinc-800/80">
                        
                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Activity className="w-4 h-4 text-zinc-300 shrink-0"/> Performance Mode</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Disables blurs and heavy shadows to save battery/FPS.</div>
                          </div>
                          <button onClick={togglePerformanceMode} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${performanceMode ? activeTheme.bg : "bg-zinc-800"}`}>
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${performanceMode ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Type className="w-4 h-4 text-zinc-300 shrink-0"/> Global UI Scale</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Adjusts master text rendering size.</div>
                          </div>
                          <div className="flex bg-[#121318] border border-zinc-800 rounded-lg p-1 shrink-0">
                            <button onClick={() => updateUiScale("compact")} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all ${uiScale === "compact" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>SM</button>
                            <button onClick={() => updateUiScale("normal")} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all ${uiScale === "normal" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>MD</button>
                            <button onClick={() => updateUiScale("large")} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all ${uiScale === "large" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>LG</button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Volume2 className="w-4 h-4 text-zinc-300 shrink-0"/> Global AI Audio Gain</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Set {globalVolume}% volume cap.</div>
                          </div>
                          <div className="w-32 shrink-0">
                             <input type="range" min="0" max="100" step="10" value={globalVolume} onChange={(e) => updateGlobalVolume(Number(e.target.value))} className="w-full accent-current" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><PlayCircle className="w-4 h-4 text-zinc-300 shrink-0"/> Default Boot Protocol</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Select which interface opens on app launch.</div>
                          </div>
                          <select 
                            value={defaultBootTab} 
                            onChange={(e) => updateDefaultBootTab(e.target.value as TabId)}
                            className="bg-[#121318] border border-zinc-700 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors"
                          >
                            <option value="DASH">Cockpit</option>
                            <option value="RADAR">Rider Radar</option>
                            <option value="DIAGNOSTICS">Diagnostics</option>
                            <option value="ASSISTANT">Co-Pilot</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Global Real Settings */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> Global Data Formatting</h3>
                      <div className="bg-black border border-zinc-800 rounded-xl shadow-inner divide-y divide-zinc-800/80">
                        
                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Languages className="w-4 h-4 text-zinc-300 shrink-0"/> Global UI Locale</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Change language across all components.</div>
                          </div>
                          <select 
                            value={locale} 
                            onChange={changeLocale}
                            className="bg-[#121318] border border-zinc-700 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors"
                          >
                            <option value="en">English (US)</option>
                            <option value="es">Español (ES)</option>
                            <option value="fr">Français (FR)</option>
                            <option value="de">Deutsch (DE)</option>
                            <option value="zh">中文 (CN)</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Clock className="w-4 h-4 text-zinc-300 shrink-0"/> Time Matrix</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Select timestamp formatting standards.</div>
                          </div>
                          <div className="flex bg-[#121318] border border-zinc-800 rounded-lg p-1 shrink-0">
                            <button onClick={toggleTimeFormat} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all ${timeFormat === "12h" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>12H</button>
                            <button onClick={toggleTimeFormat} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all ${timeFormat === "24h" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>24H</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Telemetry Settings */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Shield className="w-3.5 h-3.5"/> Telemetry & Navigation</h3>
                      <div className="bg-black border border-zinc-800 rounded-xl shadow-inner divide-y divide-zinc-800/80">
                        
                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><EyeOff className="w-4 h-4 text-zinc-300 shrink-0"/> Global Ghost Mode</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Hides your live GPS telemetry from the Radar map.</div>
                          </div>
                          <button onClick={toggleGhostMode} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ghostMode ? activeTheme.bg : "bg-zinc-800"}`}>
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ghostMode ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Map className="w-4 h-4 text-green-400 shrink-0"/> Satellite Map View</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Use high-res satellite imagery on the Radar.</div>
                          </div>
                          <button onClick={toggleSatelliteMap} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${satelliteMap ? "bg-green-500" : "bg-zinc-800"}`}>
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${satelliteMap ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 gap-4">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Ruler className="w-4 h-4 text-zinc-300 shrink-0"/> Measurement Units</div>
                            <div className="text-[9px] text-zinc-400 font-mono">Toggle between Imperial and Metric units.</div>
                          </div>
                          <div className="flex bg-[#121318] border border-zinc-800 rounded-lg p-1 shrink-0">
                            <button onClick={toggleUnits} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all ${units === "imperial" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>MPH</button>
                            <button onClick={toggleUnits} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all ${units === "metric" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>KM/H</button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                )}

                {/* TAB: APPEARANCE */}
                {settingsTab === "appearance" && (
                  <div className="space-y-6 animate-fade-in">
                     {/* Brand Customization */}
                     <div className="space-y-3">
                      <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Palette className="w-3.5 h-3.5"/> Universal Avionics HUD Identity</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { id: "lime", label: "Neon Lime", color: "bg-[#39ff14]" },
                          { id: "cyan", label: "Cyber Cyan", color: "bg-cyan-500" },
                          { id: "emerald", label: "Emerald City", color: "bg-emerald-500" },
                          { id: "amber", label: "Warning Amber", color: "bg-amber-500" },
                          { id: "rose", label: "Danger Rose", color: "bg-rose-500" }
                        ].map(theme => (
                          <button key={theme.id} onClick={() => changeTheme(theme.id as ThemePreset)} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all shadow-inner ${brandTheme === theme.id ? `bg-zinc-900 border-zinc-600` : `bg-black border-zinc-800 hover:border-zinc-700`}`}>
                            <div className={`w-4 h-4 shrink-0 rounded-full ${theme.color} ${brandTheme === theme.id ? `shadow-[0_0_10px_currentColor]` : ''}`}></div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${brandTheme === theme.id ? 'text-white' : 'text-zinc-400'}`}>{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800 text-center shrink-0">
                <p className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-widest">Rural ERides Go v4.9.0 • Universal Omnibus Engine</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Header Navigation */}
      <header 
        className={`sticky top-0 z-40 bg-[#06060a]/95 ${activeTheme.blur} border-b border-zinc-800/90 px-4 py-3 md:px-6 ${performanceMode ? '' : 'shadow-[0_4px_30px_rgba(0,0,0,0.8)]'} border-t-[3px]`}
        style={{ borderTopColor: activeTheme.hex }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={icon} alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-zinc-800" />
            <div>
              <h1 className={`text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.gradient} uppercase font-mono`}>
                RURAL ERIDES GO
              </h1>
              <span className="text-[9px] text-zinc-300 font-mono uppercase tracking-widest block font-bold">
                Pilot: <strong className="text-white">{globalCallsign || "Unbound"}</strong>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <div className="hidden sm:flex items-center gap-2 bg-[#020813] border border-cyan-500/50 px-3 py-1.5 rounded-xl text-[10px] text-cyan-300 font-mono font-bold shadow-inner">
              {isOfflineMode ? (
                <>
                   <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                   <span className="text-amber-400">OFFLINE MODE</span>
                </>
              ) : (
                <>
                   <Shield className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                   <span className="text-emerald-50">SATELLITE ONLINE</span>
                </>
              )}
            </div>
            
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 sm:p-3 bg-black border border-zinc-700 rounded-xl hover:border-zinc-500 transition-colors shadow-inner group">
              <Settings className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-300 group-hover:${activeTheme.text} transition-colors`} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6 pb-24 lg:pb-6">
        <aside className="hidden lg:flex flex-col gap-2 w-64 shrink-0 bg-[#0d0e15] border border-zinc-800 p-4 rounded-3xl h-fit shadow-2xl">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest pl-2 mb-3 block">Navigation Console</span>
          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isActive ? `bg-gradient-to-r ${activeTheme.gradient} text-black font-black` : "text-zinc-400 hover:text-white"}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#0d0e15]/95 border-t border-zinc-800 flex justify-around items-center px-1 z-40">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center flex-1 h-full text-[8px] font-black uppercase tracking-widest ${isActive ? activeTheme.text : "text-zinc-400 hover:text-white"}`}>
              <Icon className="w-4 h-4 mb-1" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}