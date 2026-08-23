"use client";

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import React, { useState, useEffect, useRef } from "react";
import icon from "./assets/icon.png";
import { PEVType, ForumPost, SavedRide } from "./types";
import Dashboard from "./components/Dashboard";
import PEVAnalyzer from "./components/PEVAnalyzer";
import GroundedAssistant from "./components/GroundedAssistant";
import YouTubeFeed from "./components/YouTubeFeed";
import BoardRecyclerView from "./components/BoardRecyclerView";
import RiderRadar from "./components/RiderRadar";
import { locationService } from "./services/LocationService";

// 🔥 MODULAR IMPORTS
import LegalOnboarding from "./components/Modals/LegalOnboarding";
import ChangelogModal from "./components/Modals/ChangelogModal";
import AppInfoTab from "./components/AppInfoTab";
import AuthScreen from "./components/Auth/AuthScreen";
import CallsignPrompt from "./components/Auth/CallsignPrompt";
import SettingsModal from "./components/Modals/SettingsModal";

// 🔥 Icons
import { 
  Compass, Cpu, Sparkles, Youtube, MessageSquare, Shield, 
  Users, Settings, Info, Download, WifiOff, Satellite, Globe, Fingerprint, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- NATIVE CAPACITOR PLUGINS FOR APK STORAGE & KEYBOARD ---
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App as CapApp } from '@capacitor/app';

// --- SUPABASE FOR AUTHENTICATION & LOGIN ---
import { createClient } from '@supabase/supabase-js';

// --- FIREBASE FOR CLOUD BACKUPS ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set as fbSet, get, child } from 'firebase/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Reverted to secure PKCE flow since we are using the external system browser
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForRuralERidesGo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rural-erides-go.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL || "https://rural-erides-go-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rural-erides-go",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rural-erides-go.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

let db: any = null;
try {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getDatabase(app);
} catch (error) {
  console.error("Firebase Boot Bypassed", error);
}

const INITIAL_RIDES: SavedRide[] = [];
const INITIAL_POSTS: ForumPost[] = [];

type TabId = "DASH" | "RADAR" | "DIAGNOSTICS" | "ASSISTANT" | "CHANNEL" | "FORUM" | "INFO";
type ThemePreset = "lime" | "cyan" | "emerald" | "amber" | "rose" | "purple" | "void";
type UIScale = "compact" | "normal" | "large";
type SettingsTab = "profile" | "preferences" | "app_settings" | "appearance";

const isNewerVersion = (remoteTag: string | null, currentVer: string): boolean => {
  if (!remoteTag) return false;
  const cleanRemote = remoteTag.replace(/^v/i, '').trim();
  const cleanCurrent = currentVer.replace(/^v/i, '').trim();
  if (cleanRemote === cleanCurrent) return false;
  const remoteParts = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
  const currentParts = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(remoteParts.length, currentParts.length); i++) {
    const r = remoteParts[i] || 0;
    const c = currentParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
};

// 🔥 100% OFFLINE VECTOR SVG PATTERN ENGINE FOR RURAL & ROAD BACKGROUNDS 🔥
const getBgTextureStyle = (texture: string): React.CSSProperties => {
  switch (texture) {
    case "grid": return { backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" };
    case "topo": return { backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" };
    case "hex": return { backgroundImage: "url('https://www.transparenttextures.com/patterns/hexellence.png')" };
    case "asphalt": return { backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><circle cx='5' cy='5' r='1' fill='%23ffffff' opacity='0.15'/><circle cx='23' cy='12' r='1.5' fill='%23ffffff' opacity='0.12'/><circle cx='34' cy='28' r='1' fill='%23ffffff' opacity='0.18'/><circle cx='12' cy='32' r='1.2' fill='%23ffffff' opacity='0.14'/><circle cx='18' cy='22' r='0.8' fill='%23ffffff' opacity='0.16'/><circle cx='30' cy='8' r='1.2' fill='%23ffffff' opacity='0.12'/></svg>")`, backgroundRepeat: "repeat" };
    case "gravel": return { backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><polygon points='10,8 14,5 16,10 12,12' fill='%23ffffff' opacity='0.18'/><polygon points='35,22 40,20 42,25 37,27' fill='%23ffffff' opacity='0.14'/><polygon points='20,45 25,43 28,48 22,50' fill='%23ffffff' opacity='0.20'/><polygon points='50,10 53,8 55,12 51,14' fill='%23ffffff' opacity='0.15'/><polygon points='5,35 8,32 11,36 7,38' fill='%23ffffff' opacity='0.16'/><polygon points='45,48 48,45 52,50 47,52' fill='%23ffffff' opacity='0.18'/></svg>")`, backgroundRepeat: "repeat" };
    case "contour": return { backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><path d='M0,25 Q30,5 60,25 T120,25 M0,55 Q35,75 70,50 T120,60 M0,90 Q45,110 80,85 T120,95' fill='none' stroke='%23ffffff' stroke-width='1.2' opacity='0.18'/></svg>")`, backgroundRepeat: "repeat" };
    case "county_grid": return { backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><line x1='0' y1='20' x2='80' y2='20' stroke='%23ffffff' stroke-width='2' opacity='0.18'/><line x1='0' y1='23' x2='80' y2='23' stroke='%23ffffff' stroke-width='1' stroke-dasharray='4,4' opacity='0.22'/><line x1='40' y1='0' x2='40' y2='80' stroke='%23ffffff' stroke-width='2' opacity='0.18'/><line x1='43' y1='0' x2='43' y2='80' stroke='%23ffffff' stroke-width='1' stroke-dasharray='4,4' opacity='0.22'/></svg>")`, backgroundRepeat: "repeat" };
    case "forest": return { backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><polygon points='15,5 25,22 5,22' fill='%23ffffff' opacity='0.16'/><polygon points='15,12 28,30 2,30' fill='%23ffffff' opacity='0.12'/><polygon points='45,25 55,42 35,42' fill='%23ffffff' opacity='0.16'/><polygon points='45,32 58,50 32,50' fill='%23ffffff' opacity='0.12'/></svg>")`, backgroundRepeat: "repeat" };
    case "farmland": return { backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><line x1='-10' y1='10' x2='70' y2='90' stroke='%23ffffff' stroke-width='2.5' opacity='0.15'/><line x1='-10' y1='30' x2='70' y2='110' stroke='%23ffffff' stroke-width='2.5' opacity='0.15'/><line x1='-10' y1='50' x2='70' y2='130' stroke='%23ffffff' stroke-width='2.5' opacity='0.15'/></svg>")`, backgroundRepeat: "repeat" };
    case "mountain": return { backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='90' viewBox='0 0 140 90'><path d='M0,90 L35,35 L60,60 L95,18 L140,90 Z' fill='none' stroke='%23ffffff' stroke-width='1.5' opacity='0.18'/><path d='M25,90 L55,50 L75,70 L110,40 L140,75' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.12'/></svg>")`, backgroundRepeat: "repeat" };
    case "trail_dust": return { backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><circle cx='15' cy='15' r='2.5' fill='%23ffffff' opacity='0.18'/><circle cx='45' cy='35' r='3.5' fill='%23ffffff' opacity='0.14'/><circle cx='70' cy='20' r='2' fill='%23ffffff' opacity='0.20'/><circle cx='30' cy='65' r='3' fill='%23ffffff' opacity='0.15'/><circle cx='60' cy='70' r='2.2' fill='%23ffffff' opacity='0.18'/><path d='M10,40 Q25,35 40,40 T70,38' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.12'/></svg>")`, backgroundRepeat: "repeat" };
    default: return {};
  }
};

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Authentication & Identity
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP" | "FORGOT_PASSWORD" | "VERIFY_RECOVERY">(() => {
    if (typeof window !== 'undefined') {
      const completedOnboarding = localStorage.getItem("rural_onboarding") === "completed";
      return completedOnboarding ? "LOGIN" : "SIGNUP";
    }
    return "LOGIN";
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [callsign, setCallsign] = useState("");
  const [globalCallsign, setGlobalCallsign] = useState("");
  const [needsCallsignPrompt, setNeedsCallsignPrompt] = useState(false);
  const [missingCallsignInput, setMissingCallsignInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);

  // GitHub & Core States
  const [latestRelease, setLatestRelease] = useState<any>(null);
  const CURRENT_VERSION = "v7.7.0";
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(() => { if (typeof window !== 'undefined') return (localStorage.getItem("rural_default_tab") as TabId) || "DASH"; return "DASH"; });
  const [savedRides, setSavedRides] = useState<SavedRide[]>([]);
  const [prefilledPost, setPrefilledPost] = useState<{ text: string; userBadge: string } | null>(null);

  // Onboarding
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_onboarding") === "completed"; return false; });
  
  // Settings UI
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");
  
  // Base Visual Prefs
  const [brandTheme, setBrandTheme] = useState<ThemePreset>(() => { if (typeof window !== 'undefined') return (localStorage.getItem("rural_theme") as ThemePreset) || "lime"; return "lime"; });
  const [units, setUnits] = useState<"imperial" | "metric">(() => { if (typeof window !== 'undefined') return (localStorage.getItem("rural_units") as any) || "imperial"; return "imperial"; });
  const [ghostMode, setGhostMode] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("radar_ghost_mode") === "true"; return false; });
  const [satelliteMap, setSatelliteMap] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_satmap") === "true"; return false; });
  const [locale, setLocale] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_locale") || localStorage.getItem("rt_locale") || "en"; return "en"; });
  const [timeFormat, setTimeFormat] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_time_format") || "12h"; return "12h"; });
  const [performanceMode, setPerformanceMode] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_perf_mode") === "true"; return false; });
  const [uiScale, setUiScale] = useState<UIScale>(() => { if (typeof window !== 'undefined') return (localStorage.getItem("rural_ui_scale") as UIScale) || "normal"; return "normal"; });
  const [defaultBootTab, setDefaultBootTab] = useState<TabId>(() => { if (typeof window !== 'undefined') return (localStorage.getItem("rural_default_tab") as TabId) || "DASH"; return "DASH"; });
  const [globalVolume, setGlobalVolume] = useState(() => { if (typeof window !== 'undefined') return Number(localStorage.getItem("rural_global_vol")) || 100; return 100; });
  const [hapticFeedback, setHapticFeedback] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_haptic") !== "false"; return true; });
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_push_notif") !== "false"; return true; });
  const [fullscreenMode, setFullscreenMode] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_fullscreen") === "true"; return false; });
  const [oledPureBlack, setOledPureBlack] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_oled_black") === "true"; return false; });
  
  const wakeLockRef = useRef<any>(null); 

  // --- 🔥 MASSIVE APP SETTINGS STATE ALL EXPLICITLY DECLARED 🔥 ---
  const [hudOrientation, setHudOrientation] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_hud_orient") || "auto"; return "auto"; });
  const [maxFps, setMaxFps] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_max_fps") || "60"; return "60"; });
  const [showFpsCounter, setShowFpsCounter] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_fps_counter") === "true"; return false; });
  const [highContrast, setHighContrast] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_high_contrast") === "true"; return false; });
  const [distanceUnitOverride, setDistanceUnitOverride] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_dist_unit") || "auto"; return "auto"; });
  const [tempUnitOverride, setTempUnitOverride] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_temp_unit") || "auto"; return "auto"; });
  const [decimalPrecision, setDecimalPrecision] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_dec_prec") || "1"; return "1"; });
  const [themeAnimSpeed, setThemeAnimSpeed] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_theme_speed") || "smooth"; return "smooth"; });
  const [autoScreenBrightness, setAutoScreenBrightness] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_brightness") === "true"; return false; }); 
  const [fontFamily, setFontFamily] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_font_family") || "font-sans"; return "font-sans"; });
  const [reducedMotion, setReducedMotion] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_reduced_motion") === "true"; return false; });
  const [navPosition, setNavPosition] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_nav_position") || "bottom"; return "bottom"; });
  const [cornerStyle, setCornerStyle] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_corner_style") || "rounded-3xl"; return "rounded-3xl"; });
  const [bgTexture, setBgTexture] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_bg_texture") || "none"; return "none"; });
  const [autoHideHud, setAutoHideHud] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_autohide_hud") === "true"; return false; });
  const [soundPack, setSoundPack] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_sound_pack") || "tactical"; return "tactical"; });

  const [telemetryRate, setTelemetryRate] = useState(() => { if (typeof window !== 'undefined') return Number(localStorage.getItem("rt_telemetry_rate")) || 1000; return 1000; });
  const [gpsAccuracyLimit, setGpsAccuracyLimit] = useState(() => { if (typeof window !== 'undefined') return Number(localStorage.getItem("rt_gps_acc_limit")) || 20; return 20; });
  const [gpsDriftTol, setGpsDriftTol] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_gps_drift") || "5"; return "5"; });
  const [autoStartTracking, setAutoStartTracking] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_start_track") === "true"; return false; });
  const [autoRecordMovement, setAutoRecordMovement] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_record") === "true"; return false; });
  const [mapMarker, setMapMarker] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_map_marker") || "scooter"; return "scooter"; });
  const [offlineRouting, setOfflineRouting] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_offline_routing") === "true"; return false; }); 
  const [strictHardwareGps, setStrictHardwareGps] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_strict_hardware_gps") === "true"; return true; }); 
  const [shareLeaderboard, setShareLeaderboard] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_share_leaderboard") === "true"; return false; });

  const [cloudSyncInterval, setCloudSyncInterval] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_cloud_sync") || "instant"; return "instant"; });
  const [cloudRetry, setCloudRetry] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_cloud_retry") || "3"; return "3"; });
  const [bgNetThrottle, setBgNetThrottle] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_bg_throttle") === "true"; return false; });
  const [radarPingFreq, setRadarPingFreq] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_radar_ping") || "3000"; return "3000"; });
  const [backgroundGps, setBackgroundGps] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_bg_gps") !== "false"; return true; });
  const [offlinePrefetch, setOfflinePrefetch] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_offline_prefetch") === "true"; return false; });
  const [exportDestination, setExportDestination] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_export_dest") || "local"; return "local"; });

  const [sosContactNumber, setSosContactNumber] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_sos_number") || "911"; return "911"; });
  const [sosCancelWindow, setSosCancelWindow] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_sos_window") || "15"; return "15"; });
  const [crashSensitivity, setCrashSensitivity] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_crash_sens") || "normal"; return "normal"; });
  const [voiceHotwordActive, setVoiceHotwordActive] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_voice_hotword") === "true"; return false; });
  const [wakeWordSens, setWakeWordSens] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_wake_sens") || "medium"; return "medium"; });
  const [radarGeofenceAlerts, setRadarGeofenceAlerts] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_geofence_alerts") === "true"; return false; }); 
  const [stealthMode, setStealthMode] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_stealth_mode") === "true"; return false; }); 
  const [biometricAppLock, setBiometricAppLock] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_biometric_lock") === "true"; return false; });

  const [dataLogFrequency, setDataLogFrequency] = useState(() => { if (typeof window !== 'undefined') return Number(localStorage.getItem("rt_data_log_freq")) || 5000; return 5000; });
  const [autoExportRides, setAutoExportRides] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_auto_export") === "true"; return false; });
  const [exportFileFormat, setExportFileFormat] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_export_format") || "gpx"; return "gpx"; });
  const [offlineMapRadius, setOfflineMapRadius] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_map_rad") || "10"; return "10"; });
  const [offlineCompression, setOfflineCompression] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_compression") || "balanced"; return "balanced"; });
  const [mapCacheClear, setMapCacheClear] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_map_cache_clear") || "30"; return "30"; });
  const [autoClearLogs, setAutoClearLogs] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_clear_logs") || "never"; return "never"; });

  const [wakeLockEnabled, setWakeLockEnabled] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_wakelock") === "true"; return false; });
  const [autoSleep, setAutoSleep] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_autosleep") !== "false"; return true; });
  const [hardwareAcceleration, setHardwareAcceleration] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_hw_accel") !== "false"; return true; });
  const [autoUpdateChecks, setAutoUpdateChecks] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_update") !== "false"; return true; });
  const [debugMode, setDebugMode] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_debug_mode") === "true"; return false; });
  const [gForceSmooth, setGForceSmooth] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_gforce_smooth") || "light"; return "light"; });
  const [batteryOptimization, setBatteryOptimization] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_batt_opt") || "balanced"; return "balanced"; }); 
  const [diagnosticAutoScan, setDiagnosticAutoScan] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_diag_autoscan") === "true"; return true; }); 

  const [hapticIntensity, setHapticIntensity] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_haptic_intensity") || "medium"; return "medium"; });
  const [liveTrafficSync, setLiveTrafficSync] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_live_traffic") !== "false"; return true; });
  const [batteryDegradation, setBatteryDegradation] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_batt_degrade") !== "false"; return true; });
  const [uiAnimationFluidity, setUiAnimationFluidity] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_ui_fluidity") || "high"; return "high"; });
  const [glassmorphism, setGlassmorphism] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_glassmorphism") || "high"; return "high"; });
  const [dashLayout, setDashLayout] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_dash_layout") || "modular"; return "modular"; });
  const [colorBlindMode, setColorBlindMode] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_colorblind") || "none"; return "none"; });
  const [dataVizStyle, setDataVizStyle] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_data_viz") || "gauges"; return "gauges"; });
  const [autoWeatherSync, setAutoWeatherSync] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_weather") !== "false"; return true; });
  const [routeSnapping, setRouteSnapping] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_route_snapping") === "true"; return false; });
  const [privacyZone, setPrivacyZone] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_privacy_zone") || "0.5"; return "0.5"; });
  const [maxCacheLimit, setMaxCacheLimit] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_max_cache") || "100"; return "100"; });
  const [powerSaveThreshold, setPowerSaveThreshold] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_power_threshold") === "true"; return false; });
  const [voiceNavLevel, setVoiceNavLevel] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_voice_nav_level") || "detailed"; return "detailed"; });
  const [nightModeSchedule, setNightModeSchedule] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_night_mode_schedule") || "system"; return "system"; });
  const [mapDefaultZoom, setMapDefaultZoom] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_map_default_zoom") || "14"; return "14"; });
  const [emergencyContactName, setEmergencyContactName] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_sos_name") || "Emergency Services"; return "Emergency Services"; });
  const [autoMuteOnVideo, setAutoMuteOnVideo] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_mute_video") === "true"; return false; });
  const [weatherUpdateFrequency, setWeatherUpdateFrequency] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_weather_freq") || "30m"; return "30m"; });
  const [dashDataDensity, setDashDataDensity] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_dash_density") || "spacious"; return "spacious"; });
  const [offlineSyncTimeout, setOfflineSyncTimeout] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_offline_timeout") || "30s"; return "30s"; });
  const [batteryProfile, setBatteryProfile] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_batt_profile") || "Li-Ion"; return "Li-Ion"; });

  const [dynamicIsland, setDynamicIsland] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_dyn_island") !== "false"; return true; });
  const [swipeNav, setSwipeNav] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_swipe_nav") === "true"; return false; });
  const [hapticDuration, setHapticDuration] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_haptic_dur") || "medium"; return "medium"; });
  const [autoHideHeader, setAutoHideHeader] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_hide_header") === "true"; return false; });
  const [dataFontWeight, setDataFontWeight] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_data_font_wt") || "black"; return "black"; });

  const [autoErrorScrape, setAutoErrorScrape] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_err_scrape") === "true"; return false; });
  const [imuPollingRate, setImuPollingRate] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_imu_poll") || "50hz"; return "50hz"; });
  const [offlineTileProvider, setOfflineTileProvider] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_off_tile") || "carto_dark"; return "carto_dark"; });
  const [smartBatteryAi, setSmartBatteryAi] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_smart_batt_ai") === "true"; return false; });
  const [localEncryption, setLocalEncryption] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_local_encrypt") === "true"; return false; });

  const [glowRadius, setGlowRadius] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_glow_rad") || "medium"; return "medium"; });
  const [mapLineColor, setMapLineColor] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_map_line") || "theme"; return "theme"; });
  const [buttonStyling, setButtonStyling] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_btn_style") || "flat"; return "flat"; });

  const [dataRetentionPolicy, setDataRetentionPolicy] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_data_retention") || "forever"; return "forever"; });
  const [highPrecisionBgGps, setHighPrecisionBgGps] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_high_prec_gps") === "true"; return false; });
  const [autoErrorLogging, setAutoErrorLogging] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_error_log") !== "false"; return true; });
  const [tabIconAnimation, setTabIconAnimation] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_tab_anim") !== "false"; return true; });
  const [cardOpacityLevel, setCardOpacityLevel] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_card_opacity") || "80"; return "80"; });
  const [minimalBanners, setMinimalBanners] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_minimal_banners") === "true"; return false; });
  const [autoCloudSyncOnFinish, setAutoCloudSyncOnFinish] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_auto_cloud_sync") === "true"; return false; });
  const [pilotRankBadge, setPilotRankBadge] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_pilot_rank") || "Elite Scout"; return "Elite Scout"; });

  const [panelBorderWidth, setPanelBorderWidth] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_panel_border_width") || "normal"; return "normal"; });
  const [cardElevation, setCardElevation] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_card_elevation") || "floating"; return "floating"; });
  const [transitionSpeedProfile, setTransitionSpeedProfile] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_transition_speed") || "smooth"; return "smooth"; });
  const [headerStyleVariant, setHeaderStyleVariant] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_header_style") || "translucent"; return "translucent"; });
  const [borderGlowIntensity, setBorderGlowIntensity] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rt_border_glow") || "subtle"; return "subtle"; });

  const [satelliteCount, setSatelliteCount] = useState<number>(12);
  const [liveGpsAccuracy, setLiveGpsAccuracy] = useState<number | null>(null);
  const [liveGpsHeading, setLiveGpsHeading] = useState<number | null>(null);
  const [liveSpeed, setLiveSpeed] = useState<number>(0);
  const [liveAltitude, setLiveAltitude] = useState<number | null>(null);
  const [universalPevClass] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem("rural_universal_pev") || "High-Performance Electric Scooter"; return "High-Performance Electric Scooter"; });

  const triggerHaptic = () => {
    if (!hapticFeedback || stealthMode) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (hapticIntensity === "light") navigator.vibrate(10);
        else if (hapticIntensity === "heavy") navigator.vibrate(30);
        else if (hapticIntensity === "extreme") navigator.vibrate([30, 50, 30]);
        else navigator.vibrate(15);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '26691451348-7dh351r4v2k9e5efevooik5k9dee5en4.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', () => { setIsKeyboardOpen(true); });
      Keyboard.addListener('keyboardWillHide', () => { setIsKeyboardOpen(false); });
    }
    return () => { if (Capacitor.isNativePlatform()) { Keyboard.removeAllListeners(); } };
  }, []);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.requestPermissions();
        } else if ('Notification' in window) {
          await Notification.requestPermission();
        }
      } catch (e) {}
    };
    initNotifications();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let sub: any;
    const initDeepLink = async () => {
      sub = await CapApp.addListener('appUrlOpen', async ({ url }) => {
        if (url.includes('login-callback')) {
          try {
            const cleanUrl = url.replace('#', '?');
            const parsed = new URL(cleanUrl);
            
            const errDesc = parsed.searchParams.get('error_description') || parsed.searchParams.get('error');
            if (errDesc) throw new Error(decodeURIComponent(errDesc.replace(/\+/g, ' ')));

            const code = parsed.searchParams.get('code');
            if (code) {
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) throw error;
              if (data?.session?.user) processUserSession(data.session.user);
            }
          } catch (err: any) {
            setAuthError(`Google Error: ${err.message}`);
          } finally {
            setIsProcessingAuth(false);
          }
        }
      });
    };

    initDeepLink();
    return () => { if (sub && sub.remove) sub.remove(); };
  }, []);

  useEffect(() => {
    const checkForGithubUpdate = async () => {
      if (!autoUpdateChecks) return;
      try {
        const res = await fetch('https://api.github.com/repos/bradley3398/Rural-Erides-GO/releases/latest');
        if (res.ok) {
          const data = await res.json();
          if (data && data.tag_name && isNewerVersion(data.tag_name, CURRENT_VERSION)) {
            setLatestRelease(data);
          } else {
            setLatestRelease(null);
          }
        }
      } catch (err) {}
    };
    checkForGithubUpdate();
  }, [autoUpdateChecks]);

  useEffect(() => {
    if (hasCompletedOnboarding && backgroundGps && !isOfflineMode) {
      locationService.start(universalPevClass as PEVType);
      const handleGpsStats = (update: any) => {
        if (update) {
          if (strictHardwareGps && update.accuracy && update.accuracy > gpsAccuracyLimit) return;
          if (update.accuracy !== undefined) setLiveGpsAccuracy(update.accuracy);
          if (update.heading !== undefined) setLiveGpsHeading(update.heading);
          if (update.speed !== undefined) setLiveSpeed(update.speed);
          if (update.altitude !== undefined) setLiveAltitude(update.altitude);
        }
      };
      locationService.addListener(handleGpsStats);
      return () => locationService.removeListener(handleGpsStats);
    } else if (!backgroundGps) {
      locationService.stop();
    }
  }, [hasCompletedOnboarding, backgroundGps, isOfflineMode, universalPevClass, strictHardwareGps, gpsAccuracyLimit]);

  useEffect(() => {
    if (!db) return;
    const satRef = ref(db, 'telemetry/constellation/activeSatellites');
    const unsubscribe = onValue(satRef, (snapshot) => {
      const data = snapshot.val();
      if (typeof data === 'number') setSatelliteCount(data);
      else { fbSet(satRef, 14); setSatelliteCount(14); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (hasCompletedOnboarding && user) {
      if (pushNotificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      const hasSeenLogs = localStorage.getItem("rural_changelog_v7.7.0");
      if (!hasSeenLogs) setShowChangelogModal(true);
    }
  }, [hasCompletedOnboarding, user, pushNotificationsEnabled]);

  const dismissChangelogModal = () => {
    triggerHaptic();
    localStorage.setItem("rural_changelog_v7.7.0", "seen");
    setShowChangelogModal(false);
  };

  const syncUniversalIdentity = (username: string) => {
    if (!username || !username.trim()) return;
    const cleanName = username.trim();
    setGlobalCallsign(cleanName);
    localStorage.setItem("rural_erides_username", cleanName);
    localStorage.setItem("radar_screen_name", cleanName);
    localStorage.setItem("copilot_pilot_name", cleanName);
    localStorage.setItem("radar_callsign_locked", "true");
    window.dispatchEvent(new Event('settings-sync'));
  };

  const processUserSession = (activeUser: any) => {
    setUser(activeUser);
    localStorage.setItem("rural_erides_offline_user", JSON.stringify(activeUser));
    
    const officialCallsign = activeUser?.user_metadata?.username;
    const legacyLocalCallsign = localStorage.getItem("radar_callsign_locked") === "true" ? localStorage.getItem("rural_erides_username") : null;
    const existingCallsign = officialCallsign || legacyLocalCallsign;

    if (existingCallsign && existingCallsign.trim()) {
      syncUniversalIdentity(existingCallsign);
      setNeedsCallsignPrompt(false);
    } else {
      const suggestedName = activeUser?.user_metadata?.full_name || activeUser?.user_metadata?.name || activeUser?.email?.split('@')[0] || "";
      setMissingCallsignInput(suggestedName);
      setNeedsCallsignPrompt(true);
    }
  };

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
        if (session?.user) processUserSession(session.user);
        else setUser(null);
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
        if (session?.user) processUserSession(session.user);
        else {
          setUser(null);
          setGlobalCallsign("");
          setNeedsCallsignPrompt(false);
        }
      });
      return () => subscription.unsubscribe();
    } catch (e) {}
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    localStorage.setItem("rural_theme", brandTheme);
    localStorage.setItem("rt_theme", brandTheme);
    localStorage.setItem("rural_units", units);
    localStorage.setItem("radar_ghost_mode", ghostMode.toString());
    localStorage.setItem("rural_satmap", satelliteMap.toString());
    localStorage.setItem("rural_locale", locale);
    localStorage.setItem("rural_time_format", timeFormat);
    localStorage.setItem("rural_perf_mode", performanceMode.toString());
    localStorage.setItem("rural_ui_scale", uiScale);
    localStorage.setItem("rural_default_tab", defaultBootTab);
    localStorage.setItem("rural_global_vol", globalVolume.toString());
    localStorage.setItem("rural_haptic", hapticFeedback.toString());
    localStorage.setItem("rural_push_notif", pushNotificationsEnabled.toString());
    localStorage.setItem("rural_fullscreen", fullscreenMode.toString());
    localStorage.setItem("rural_oled_black", oledPureBlack.toString());
    localStorage.setItem("rural_wakelock", wakeLockEnabled.toString());
    localStorage.setItem("rural_autosleep", autoSleep.toString());
    localStorage.setItem("rt_telemetry_rate", telemetryRate.toString());
    localStorage.setItem("rt_data_log_freq", dataLogFrequency.toString());
    localStorage.setItem("rural_hud_orient", hudOrientation);
    localStorage.setItem("rural_export_format", exportFileFormat);
    localStorage.setItem("rural_compression", offlineCompression);
    localStorage.setItem("rural_cloud_sync", cloudSyncInterval);
    localStorage.setItem("rural_auto_export", autoExportRides.toString());
    localStorage.setItem("rural_voice_hotword", voiceHotwordActive.toString());
    localStorage.setItem("rural_sos_number", sosContactNumber);
    localStorage.setItem("rural_bg_gps", backgroundGps.toString());
    localStorage.setItem("rt_auto_start_track", autoStartTracking.toString());
    localStorage.setItem("rt_max_fps", maxFps);
    localStorage.setItem("rt_hw_accel", hardwareAcceleration.toString());
    localStorage.setItem("rt_fps_counter", showFpsCounter.toString());
    localStorage.setItem("rt_map_rad", offlineMapRadius);
    localStorage.setItem("rt_clear_logs", autoClearLogs);
    localStorage.setItem("rt_gps_acc_limit", gpsAccuracyLimit.toString());
    localStorage.setItem("rt_gps_drift", gpsDriftTol);
    localStorage.setItem("rt_crash_sens", crashSensitivity);
    localStorage.setItem("rt_auto_record", autoRecordMovement.toString());
    localStorage.setItem("rt_high_contrast", highContrast.toString());
    localStorage.setItem("rt_cloud_retry", cloudRetry);
    localStorage.setItem("rt_debug_mode", debugMode.toString());
    localStorage.setItem("rt_auto_update", autoUpdateChecks.toString());
    localStorage.setItem("rt_bg_throttle", bgNetThrottle.toString());
    localStorage.setItem("rt_dist_unit", distanceUnitOverride);
    localStorage.setItem("rt_temp_unit", tempUnitOverride);
    localStorage.setItem("rt_map_cache_clear", mapCacheClear);
    localStorage.setItem("rt_dec_prec", decimalPrecision);
    localStorage.setItem("rt_map_marker", mapMarker);
    localStorage.setItem("rt_radar_ping", radarPingFreq);
    localStorage.setItem("rt_sos_window", sosCancelWindow);
    localStorage.setItem("rt_gforce_smooth", gForceSmooth);
    localStorage.setItem("rt_auto_brightness", autoScreenBrightness.toString());
    localStorage.setItem("rt_geofence_alerts", radarGeofenceAlerts.toString());
    localStorage.setItem("rt_batt_opt", batteryOptimization);
    localStorage.setItem("rt_offline_routing", offlineRouting.toString());
    localStorage.setItem("rt_diag_autoscan", diagnosticAutoScan.toString());
    localStorage.setItem("rt_stealth_mode", stealthMode.toString());
    localStorage.setItem("rt_strict_hardware_gps", strictHardwareGps.toString());
    localStorage.setItem("rt_biometric_lock", biometricAppLock.toString());
    localStorage.setItem("rt_font_family", fontFamily);
    localStorage.setItem("rt_reduced_motion", reducedMotion.toString());
    localStorage.setItem("rt_nav_position", navPosition);
    localStorage.setItem("rt_sound_pack", soundPack);
    localStorage.setItem("rt_autohide_hud", autoHideHud.toString());
    localStorage.setItem("rt_offline_prefetch", offlinePrefetch.toString());
    localStorage.setItem("rt_export_dest", exportDestination);
    localStorage.setItem("rt_share_leaderboard", shareLeaderboard.toString());
    localStorage.setItem("rt_haptic_intensity", hapticIntensity);
    localStorage.setItem("rt_corner_style", cornerStyle);
    localStorage.setItem("rt_bg_texture", bgTexture);
    localStorage.setItem("rt_glassmorphism", glassmorphism);
    localStorage.setItem("rt_dash_layout", dashLayout);
    localStorage.setItem("rt_colorblind", colorBlindMode);
    localStorage.setItem("rt_data_viz", dataVizStyle);
    localStorage.setItem("rt_auto_weather", autoWeatherSync.toString());
    localStorage.setItem("rt_route_snapping", routeSnapping.toString());
    localStorage.setItem("rt_privacy_zone", privacyZone);
    localStorage.setItem("rt_max_cache", maxCacheLimit);
    localStorage.setItem("rt_power_threshold", powerSaveThreshold.toString());
    localStorage.setItem("rt_voice_nav_level", voiceNavLevel);
    localStorage.setItem("rt_night_mode_schedule", nightModeSchedule);
    localStorage.setItem("rt_map_default_zoom", mapDefaultZoom);
    localStorage.setItem("rt_sos_name", emergencyContactName);
    localStorage.setItem("rt_auto_mute_video", autoMuteOnVideo.toString());
    localStorage.setItem("rt_weather_freq", weatherUpdateFrequency);
    localStorage.setItem("rt_dash_density", dashDataDensity);
    localStorage.setItem("rt_offline_timeout", offlineSyncTimeout);
    localStorage.setItem("rt_batt_profile", batteryProfile);

    localStorage.setItem("rt_dyn_island", dynamicIsland.toString());
    localStorage.setItem("rt_swipe_nav", swipeNav.toString());
    localStorage.setItem("rt_haptic_dur", hapticDuration);
    localStorage.setItem("rt_auto_hide_header", autoHideHeader.toString());
    localStorage.setItem("rt_data_font_wt", dataFontWeight);
    localStorage.setItem("rt_auto_err_scrape", autoErrorScrape.toString());
    localStorage.setItem("rt_imu_poll", imuPollingRate);
    localStorage.setItem("rt_off_tile", offlineTileProvider);
    localStorage.setItem("rt_smart_batt_ai", smartBatteryAi.toString());
    localStorage.setItem("rt_local_encrypt", localEncryption.toString());
    localStorage.setItem("rt_glow_rad", glowRadius);
    localStorage.setItem("rt_map_line", mapLineColor);
    localStorage.setItem("rt_btn_style", buttonStyling);
    localStorage.setItem("rt_data_retention", dataRetentionPolicy);
    localStorage.setItem("rt_high_prec_gps", highPrecisionBgGps.toString());
    localStorage.setItem("rt_auto_error_log", autoErrorLogging.toString());
    localStorage.setItem("rt_tab_anim", tabIconAnimation.toString());
    localStorage.setItem("rt_card_opacity", cardOpacityLevel);
    localStorage.setItem("rt_minimal_banners", minimalBanners.toString());
    localStorage.setItem("rt_auto_cloud_sync", autoCloudSyncOnFinish.toString());
    localStorage.setItem("rt_pilot_rank", pilotRankBadge);

    localStorage.setItem("rt_panel_border_width", panelBorderWidth);
    localStorage.setItem("rt_card_elevation", cardElevation);
    localStorage.setItem("rt_transition_speed", transitionSpeedProfile);
    localStorage.setItem("rt_header_style", headerStyleVariant);
    localStorage.setItem("rt_border_glow", borderGlowIntensity);

  }, [mounted, brandTheme, units, ghostMode, satelliteMap, locale, timeFormat, performanceMode, uiScale, defaultBootTab, globalVolume, hapticFeedback, pushNotificationsEnabled, fullscreenMode, oledPureBlack, wakeLockEnabled, autoSleep, telemetryRate, dataLogFrequency, hudOrientation, exportFileFormat, offlineCompression, cloudSyncInterval, autoStartTracking, maxFps, hardwareAcceleration, showFpsCounter, offlineMapRadius, autoClearLogs, gpsAccuracyLimit, gpsDriftTol, crashSensitivity, autoRecordMovement, highContrast, autoExportRides, voiceHotwordActive, sosContactNumber, cloudRetry, debugMode, autoUpdateChecks, bgNetThrottle, backgroundGps, distanceUnitOverride, tempUnitOverride, mapCacheClear, decimalPrecision, mapMarker, radarPingFreq, sosCancelWindow, gForceSmooth, autoScreenBrightness, radarGeofenceAlerts, batteryOptimization, offlineRouting, diagnosticAutoScan, stealthMode, strictHardwareGps, biometricAppLock, fontFamily, reducedMotion, navPosition, soundPack, autoHideHud, offlinePrefetch, exportDestination, shareLeaderboard, hapticIntensity, cornerStyle, bgTexture, glassmorphism, dashLayout, colorBlindMode, dataVizStyle, autoWeatherSync, routeSnapping, privacyZone, maxCacheLimit, powerSaveThreshold, voiceNavLevel, nightModeSchedule, mapDefaultZoom, emergencyContactName, autoMuteOnVideo, weatherUpdateFrequency, dashDataDensity, offlineSyncTimeout, batteryProfile, dynamicIsland, swipeNav, hapticDuration, autoHideHeader, dataFontWeight, autoErrorScrape, imuPollingRate, offlineTileProvider, smartBatteryAi, localEncryption, glowRadius, mapLineColor, buttonStyling, dataRetentionPolicy, highPrecisionBgGps, autoErrorLogging, tabIconAnimation, cardOpacityLevel, minimalBanners, autoCloudSyncOnFinish, pilotRankBadge, panelBorderWidth, cardElevation, transitionSpeedProfile, headerStyleVariant, borderGlowIntensity]);

  const handleCloudBackup = async () => {
    triggerHaptic();
    if (!user && !globalCallsign) return alert("You must be logged in or have a callsign to perform a cloud backup.");
    if (!window.confirm("CONFIRMATION: Initiate permanent Firebase Cloud Matrix backup?")) return;
    
    setIsProcessingAuth(true);
    setCloudSyncStatus("Backing up to Firebase Cloud Matrix...");
    try {
      const masterData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('sb-')) { masterData[key] = localStorage.getItem(key) || ""; }
      }
      
      const rawId = user?.email || globalCallsign || "anonymous_pilot";
      const backupId = rawId.replace(/[.$#[\]/]/g, "_");
      const nodeCount = Object.keys(masterData).length;

      const payload = {
        masterDataPayload: JSON.stringify(masterData),
        updatedAt: new Date().toISOString(),
        version: CURRENT_VERSION,
        nodeCount: nodeCount,
        pilot: globalCallsign || user?.email || "Unknown Pilot"
      };

      let success = false;
      let errorMsg = "";

      if (db) {
        try {
          const backupRef = ref(db, `user_backups/${backupId}`);
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase SDK Connection Timeout")), 5000));
          await Promise.race([fbSet(backupRef, payload), timeout]);
          success = true;
        } catch (e: any) { errorMsg = e.message; }
      }

      if (!success) {
        const dbUrl = firebaseConfig.databaseURL?.replace(/\/$/, '');
        if (!dbUrl) throw new Error("Database URL missing.");
        const restUrl = `${dbUrl}/user_backups/${backupId}.json`;
        const res = await fetch(restUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(errorMsg || `REST Backup Failed: ${res.statusText}`);
      }

      alert(`FIREBASE SUCCESS: Backup received by Firebase Cloud! Saved ${nodeCount} data nodes.`);
    } catch (err: any) {
      alert(`FIREBASE ERROR: Backup rejected.\nReason: ${err.message}`);
    } finally {
      setCloudSyncStatus(null);
      setIsProcessingAuth(false);
    }
  };

  const handleCloudRestore = async () => {
    triggerHaptic();
    if (!user && !globalCallsign) return alert("You must be logged in or have a callsign to restore from the cloud.");
    if (!window.confirm("WARNING: Restoring from Firebase Cloud backup will overwrite your local telemetry and settings. Proceed?")) return;
    
    setIsProcessingAuth(true);
    setCloudSyncStatus("Restoring from Firebase Cloud Matrix...");
    try {
      const rawId = user?.email || globalCallsign || "anonymous_pilot";
      const backupId = rawId.replace(/[.$#[\]/]/g, "_");
      let parsedData = null;

      if (db) {
        try {
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("SDK Timeout")), 5000));
          const snapshotRef = get(child(ref(db), `user_backups/${backupId}`));
          const snapshot = await Promise.race([snapshotRef, timeout]) as any;
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && data.masterDataPayload) parsedData = JSON.parse(data.masterDataPayload);
            else if (data && data.masterData) parsedData = data.masterData;
          }
        } catch(e) {}
      } 
      
      if (!parsedData && firebaseConfig.databaseURL) {
        const dbUrl = firebaseConfig.databaseURL.replace(/\/$/, '');
        const restUrl = `${dbUrl}/user_backups/${backupId}.json`;
        const res = await fetch(restUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.masterDataPayload) parsedData = JSON.parse(data.masterDataPayload);
        }
      }

      if (parsedData) {
        let keysRestored = 0;
        Object.keys(parsedData).forEach(key => { localStorage.setItem(key, parsedData[key]); keysRestored++; });
        alert(`FIREBASE RESTORE SUCCESS: ${keysRestored} data nodes recovered! Avionics rebooting.`);
        window.location.reload();
      } else { throw new Error("No cloud record found for this profile in Firebase."); }
    } catch (err: any) { alert(`Cloud restore failed: ${err.message}`); } finally {
      setCloudSyncStatus(null);
      setIsProcessingAuth(false);
    }
  };

  const handleSetMissingCallsign = async (e: React.FormEvent) => {
    e.preventDefault(); triggerHaptic(); setAuthError("");
    const cleanName = missingCallsignInput.trim();
    if (cleanName.length < 3) return setAuthError("Callsign must be at least 3 characters long.");
    setIsProcessingAuth(true);
    try {
      if (navigator.onLine && !isOfflineMode) {
        const { data, error } = await supabase.auth.updateUser({ data: { username: cleanName } });
        if (error) throw error;
        if (data.user) processUserSession(data.user);
      } else {
        syncUniversalIdentity(cleanName);
        setNeedsCallsignPrompt(false);
      }
    } catch (err: any) { setAuthError(err.message || "Failed to register callsign with Supabase."); } finally { setIsProcessingAuth(false); }
  };

  const handleGoogleSignIn = async () => {
    triggerHaptic();
    setAuthError("");
    setIsProcessingAuth(true);
    
    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error("Google Sign-In is currently only supported on the native Android app.");
      }
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      if (!idToken) throw new Error("No ID Token received from Google Play Services.");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
      if (data?.session?.user) {
        processUserSession(data.session.user);
      }
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setAuthError(`Auth Failed: ${err.message}`);
    } finally {
      setIsProcessingAuth(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); triggerHaptic(); setAuthError(""); setAuthSuccess(""); setIsProcessingAuth(true);
    if (!navigator.onLine || isOfflineMode) {
      const cachedUser = localStorage.getItem("rural_erides_offline_user");
      if (cachedUser && authMode === "LOGIN") {
        processUserSession(JSON.parse(cachedUser)); setIsOfflineMode(true); setIsProcessingAuth(false); return;
      } else {
        setAuthError("HARDWARE OFFLINE: Cannot establish new connection or reset passwords without network."); setIsProcessingAuth(false); return;
      }
    }
    try {
      if (authMode === "FORGOT_PASSWORD") {
        if (!email) throw new Error("Email is required for password recovery.");
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        setAuthSuccess("Recovery sequence initiated! Check your email for the 6-digit access code."); setAuthMode("VERIFY_RECOVERY");
      } else if (authMode === "VERIFY_RECOVERY") {
        if (!recoveryCode.trim()) throw new Error("Recovery code is required.");
        if (password !== confirmPassword) throw new Error("New passwords do not match.");
        if (password.length < 6) throw new Error("Access code must be at least 6 characters.");
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: recoveryCode.trim(), type: 'recovery' });
        if (verifyError) throw verifyError;
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setAuthSuccess("Access code successfully updated! You can now log in."); setAuthMode("LOGIN"); setPassword(""); setConfirmPassword(""); setRecoveryCode("");
      } else if (authMode === "SIGNUP") {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        if (!callsign.trim()) throw new Error("Rider Callsign is required.");
        if (callsign.trim().length < 3) throw new Error("Callsign must be at least 3 characters.");
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: callsign.trim() } } });
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error("Security Alert: Account already exists. Please log in or use password recovery.");
        if (data.user) { setAuthSuccess("Clearance granted! Account registered securely."); processUserSession(data.user); }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (data.user) processUserSession(data.user);
      }
    } catch (error: any) {
      let errorText = "Authentication request failed.";
      const rawMessage = error?.message || error?.error_description || (typeof error === 'string' ? error : "");
      if (rawMessage === "{}" || rawMessage.trim() === "") errorText = "Network request blocked. Check if email exists or rate limit was reached."; else errorText = rawMessage;
      setAuthError(errorText);
    } finally { setIsProcessingAuth(false); }
  };

  const handleSignOut = async () => {
    triggerHaptic();
    try {
      if (navigator.onLine && !isOfflineMode) await supabase.auth.signOut();
      setUser(null); setGlobalCallsign(""); setNeedsCallsignPrompt(false); setIsSettingsOpen(false); setHasCompletedOnboarding(false); 
      localStorage.removeItem("rural_onboarding"); localStorage.removeItem("rural_erides_offline_user"); locationService.stop();
    } catch (error) {}
  };

  const togglePerformanceMode = () => { triggerHaptic(); setPerformanceMode(!performanceMode); };
  const toggleHapticFeedback = () => { triggerHaptic(); setHapticFeedback(!hapticFeedback); };
  const togglePushNotifications = async () => { triggerHaptic(); setPushNotificationsEnabled(!pushNotificationsEnabled); if (!pushNotificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) { if (Notification.permission !== 'granted') await Notification.requestPermission(); } };
  const toggleFullscreenMode = async () => { triggerHaptic(); const newVal = !fullscreenMode; setFullscreenMode(newVal); if (Capacitor.isNativePlatform()) { try { const statusModule = await import('@capacitor/status-bar'); if (statusModule && statusModule.StatusBar) { if (newVal) await statusModule.StatusBar.hide(); else await statusModule.StatusBar.show(); } } catch (e) {} } else { try { if (newVal) { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } else { if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen(); } } catch (e) {} } };
  const toggleOledPureBlack = () => { triggerHaptic(); setOledPureBlack(!oledPureBlack); };
  const toggleWakeLock = async () => { triggerHaptic(); const newVal = !wakeLockEnabled; setWakeLockEnabled(newVal); if (newVal) { try { if ('wakeLock' in navigator) wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) {} } else { if (wakeLockRef.current) wakeLockRef.current.release().then(() => wakeLockRef.current = null); } };
  const toggleAutoSleep = () => { triggerHaptic(); setAutoSleep(!autoSleep); };
  const changeTheme = (theme: ThemePreset) => { triggerHaptic(); setBrandTheme(theme); };
  const updateUiScale = (scale: UIScale) => { triggerHaptic(); setUiScale(scale); };
  const changeLanguage = (langCode: string) => { triggerHaptic(); setLocale(langCode); };
  const updateDefaultBootTab = (tab: TabId) => { triggerHaptic(); setDefaultBootTab(tab); };
  const updateGlobalVolume = (vol: number) => { setGlobalVolume(vol); };
  const handleOrientationChange = (val: string) => { triggerHaptic(); setHudOrientation(val); if (Capacitor.isNativePlatform() && window.screen && window.screen.orientation) { if (val === "portrait") window.screen.orientation.lock("portrait").catch(()=>{}); else if (val === "landscape") window.screen.orientation.lock("landscape").catch(()=>{}); else window.screen.orientation.unlock(); } };

  const wipeLocalData = () => { triggerHaptic(); if (window.confirm("CRITICAL WARNING: This will permanently purge all telemetry, local component logs, and device configurations. Proceed?")) { localStorage.clear(); setSavedRides([]); setHasCompletedOnboarding(false); alert("Local memory wiped. Avionics restarting."); window.location.reload(); } };

  const themeMap = {
    lime: { hex: "#39ff14", text: "text-[#39ff14]", bg: "bg-[#39ff14]", border: "border-[#39ff14]", gradient: "from-[#39ff14] to-emerald-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(57,255,20,0.3)]", blur: performanceMode ? 'bg-[#06060a]' : 'bg-[#0a0a0f]/60 backdrop-blur-2xl' },
    cyan: { hex: "#06b6d4", text: "text-cyan-400", bg: "bg-cyan-500", border: "border-cyan-500", gradient: "from-cyan-400 to-blue-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(6,182,212,0.3)]", blur: performanceMode ? 'bg-[#06060a]' : 'bg-[#0a0a0f]/60 backdrop-blur-2xl' },
    emerald: { hex: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500", gradient: "from-emerald-400 to-teal-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(16,185,129,0.3)]", blur: performanceMode ? 'bg-[#06060a]' : 'bg-[#0a0a0f]/60 backdrop-blur-2xl' },
    amber: { hex: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500", gradient: "from-amber-400 to-orange-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(245,158,11,0.3)]", blur: performanceMode ? 'bg-[#06060a]' : 'bg-[#0a0a0f]/60 backdrop-blur-2xl' },
    rose: { hex: "#f43f5e", text: "text-rose-400", bg: "bg-rose-500", border: "border-rose-500", gradient: "from-rose-400 to-red-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(244,63,94,0.3)]", blur: performanceMode ? 'bg-[#06060a]' : 'bg-[#0a0a0f]/60 backdrop-blur-2xl' },
    purple: { hex: "#a855f7", text: "text-purple-400", bg: "bg-purple-500", border: "border-purple-500", gradient: "from-purple-400 to-fuchsia-500", shadow: performanceMode ? '' : "shadow-[0_0_20px_rgba(168,85,247,0.3)]", blur: performanceMode ? 'bg-[#06060a]' : 'bg-[#0a0a0f]/60 backdrop-blur-2xl' },
    void: { hex: "#ffffff", text: "text-white", bg: "bg-zinc-800", border: "border-zinc-500", gradient: "from-zinc-400 to-zinc-600", shadow: performanceMode ? '' : "shadow-[0_0_20px_rgba(255,255,255,0.1)]", blur: performanceMode ? 'bg-black' : 'bg-black/90 backdrop-blur-3xl' }
  };
  const activeTheme = themeMap[brandTheme as keyof typeof themeMap] || themeMap.lime;
  
  const fontScaleMap: Record<string, string> = { compact: "text-[12px]", normal: "text-[14px]", large: "text-[16px]" };
  
  const typographyClass = fontFamily === "font-mono" ? "font-mono" : fontFamily === "font-serif" ? "font-serif" : "font-sans";
  const glassBlurClass = glassmorphism === "high" ? "backdrop-blur-3xl" : glassmorphism === "medium" ? "backdrop-blur-md" : glassmorphism === "low" ? "backdrop-blur-sm" : "bg-black";

  const handleAddRide = (newRide: SavedRide) => { const updatedRides = [newRide, ...savedRides]; setSavedRides(updatedRides); localStorage.setItem("rural_erides_rides", JSON.stringify(updatedRides)); };
  const handleShareRideLog = (data: { text: string; pevType: string }) => { setPrefilledPost({ text: data.text, userBadge: data.pevType }); setActiveTab("FORUM"); };

  const renderTabContent = () => {
    const globalProps = { theme: brandTheme, useMetric: units === "metric", ghostMode, satelliteMap, locale, timeFormat, performanceMode, uiScale, globalVolume, callsign: globalCallsign };
    switch (activeTab) {
      case "RADAR": return <RiderRadar {...globalProps} />;
      case "DIAGNOSTICS": return <PEVAnalyzer {...globalProps} />;
      case "ASSISTANT": return <GroundedAssistant {...globalProps} />;
      case "CHANNEL": return <YouTubeFeed {...globalProps} />;
      case "FORUM": return <BoardRecyclerView {...globalProps} prefilledPost={prefilledPost} onClearPrefilled={() => setPrefilledPost(null)} />;
      case "INFO": return <AppInfoTab icon={icon} activeTheme={activeTheme} cornerStyle={cornerStyle} reducedMotion={reducedMotion} typographyClass={typographyClass} setActiveTab={setActiveTab} triggerHaptic={triggerHaptic} currentVersion={CURRENT_VERSION} />;
      case "DASH": default: return <Dashboard {...globalProps} onAddRide={handleAddRide} savedRides={savedRides} onShareRideLog={handleShareRideLog} />;
    }
  };

  const navigationItems = [
    { id: "DASH" as TabId, label: "COCKPIT", icon: Compass },
    { id: "RADAR" as TabId, label: "RADAR", icon: Users },
    { id: "DIAGNOSTICS" as TabId, label: "DIAGNOSTICS", icon: Cpu },
    { id: "ASSISTANT" as TabId, label: "CO-PILOT", icon: Sparkles },
    { id: "CHANNEL" as TabId, label: "CHANNEL", icon: Youtube },
    { id: "FORUM" as TabId, label: "BOARD", icon: MessageSquare },
    { id: "INFO" as TabId, label: "APP INFO", icon: Info },
  ];

  if (authLoading) {
    return (
      <div className={`min-h-screen bg-[#030305] flex flex-col items-center justify-center p-6 ${activeTheme.text}`}>
        <div className="relative w-24 h-24 mb-6">
          <div className={`absolute inset-0 border-4 border-current opacity-20 rounded-full`}></div>
          <div className={`absolute inset-0 border-4 border-current border-t-transparent rounded-full ${reducedMotion ? '' : 'animate-spin'}`}></div>
          <Fingerprint className={`absolute inset-0 m-auto w-10 h-10 text-current ${reducedMotion ? '' : 'animate-pulse'}`} />
        </div>
        <h1 className={`text-xl font-black uppercase tracking-widest ${reducedMotion ? '' : 'animate-pulse'} font-mono text-current`}>Authenticating...</h1>
      </div>
    );
  }

  if (!user || authMode === "VERIFY_RECOVERY") {
    return <AuthScreen {...{ authMode, setAuthMode, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, recoveryCode, setRecoveryCode, callsign, setCallsign, authError, setAuthError, authSuccess, setAuthSuccess, isProcessingAuth, handleAuthSubmit, handleGoogleSignIn, activeTheme, cornerStyle, performanceMode, reducedMotion, typographyClass, icon, triggerHaptic }} />;
  }

  if (needsCallsignPrompt) {
    return <CallsignPrompt {...{ missingCallsignInput, setMissingCallsignInput, authError, isProcessingAuth, handleSetMissingCallsign, activeTheme, cornerStyle, reducedMotion, typographyClass }} />;
  }
          
  if (!hasCompletedOnboarding) {
    return <LegalOnboarding activeTheme={activeTheme} cornerStyle={cornerStyle} performanceMode={performanceMode} reducedMotion={reducedMotion} typographyClass={typographyClass} triggerHaptic={triggerHaptic} onComplete={() => { setHasCompletedOnboarding(true); localStorage.setItem("rural_onboarding", "completed"); }} />;
  }

  return (
    <div style={{ paddingBottom: isKeyboardOpen ? 'var(--keyboard-height)' : '0px', ...getBgTextureStyle(bgTexture) }} className={`min-h-[100dvh] ${oledPureBlack ? 'bg-black' : 'bg-[#030305]'} text-white flex flex-col ${typographyClass} select-none antialiased relative overflow-x-hidden ${reducedMotion ? '' : 'transition-all duration-200'} ${fontScaleMap[uiScale]}`}>
      {!performanceMode && !oledPureBlack && (<div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] pointer-events-none ${reducedMotion ? '' : 'transition-all duration-700'}`} style={{ backgroundColor: activeTheme.hex }}></div>)}

      <ChangelogModal showChangelogModal={showChangelogModal} dismissChangelogModal={dismissChangelogModal} activeTheme={activeTheme} cornerStyle={cornerStyle} reducedMotion={reducedMotion} currentVersion={CURRENT_VERSION} />

      <SettingsModal {...{
        isSettingsOpen, setIsSettingsOpen, settingsTab, setSettingsTab, user, isOfflineMode, cloudSyncStatus, handleCloudBackup, handleCloudRestore, isProcessingAuth, handleSignOut, wipeLocalData, pilotRankBadge, setPilotRankBadge, autoCloudSyncOnFinish, setAutoCloudSyncOnFinish, locale, changeLanguage, uiScale, updateUiScale, fontFamily, setFontFamily, reducedMotion, setReducedMotion, dynamicIsland, setDynamicIsland, swipeNav, setSwipeNav, autoHideHeader, setAutoHideHeader, hapticDuration, setHapticDuration, dataFontWeight, setDataFontWeight, tabIconAnimation, setTabIconAnimation, cardOpacityLevel, setCardOpacityLevel, minimalBanners, setMinimalBanners, dashLayout, setDashLayout, dataVizStyle, setDataVizStyle, dashDataDensity, setDashDataDensity, mapDefaultZoom, setMapDefaultZoom, hapticFeedback, toggleHapticFeedback, hapticIntensity, setHapticIntensity, globalVolume, updateGlobalVolume, soundPack, setSoundPack, autoMuteOnVideo, setAutoMuteOnVideo, dataRetentionPolicy, setDataRetentionPolicy, highPrecisionBgGps, setHighPrecisionBgGps, autoErrorLogging, setAutoErrorLogging, maxFps, setMaxFps, distanceUnitOverride, setDistanceUnitOverride, tempUnitOverride, setTempUnitOverride, decimalPrecision, setDecimalPrecision, privacyZone, setPrivacyZone, routeSnapping, setRouteSnapping, autoWeatherSync, setAutoWeatherSync, weatherUpdateFrequency, setWeatherUpdateFrequency, strictHardwareGps, setStrictHardwareGps, telemetryRate, setTelemetryRate, gpsAccuracyLimit, setGpsAccuracyLimit, gpsDriftTol, setGpsDriftTol, autoStartTracking, setAutoStartTracking, shareLeaderboard, setShareLeaderboard, cloudSyncInterval, setCloudSyncInterval, offlineSyncTimeout, setOfflineSyncTimeout, bgNetThrottle, setBgNetThrottle, backgroundGps, setBackgroundGps, powerSaveThreshold, setPowerSaveThreshold, maxCacheLimit, setMaxCacheLimit, offlinePrefetch, setOfflinePrefetch, biometricAppLock, setBiometricAppLock, emergencyContactName, setEmergencyContactName, sosContactNumber, setSosContactNumber, sosCancelWindow, setSosCancelWindow, crashSensitivity, setCrashSensitivity, batteryProfile, setBatteryProfile, voiceHotwordActive, setVoiceHotwordActive, smartBatteryAi, setSmartBatteryAi, autoErrorScrape, setAutoErrorScrape, localEncryption, setLocalEncryption, imuPollingRate, setImuPollingRate, offlineTileProvider, setOfflineTileProvider, wakeLockEnabled, toggleWakeLock, autoSleep, toggleAutoSleep, hardwareAcceleration, setHardwareAcceleration, diagnosticAutoScan, setDiagnosticAutoScan, autoUpdateChecks, setAutoUpdateChecks, debugMode, setDebugMode, brandTheme, changeTheme, nightModeSchedule, setNightModeSchedule, cornerStyle, setCornerStyle, panelBorderWidth, setPanelBorderWidth, cardElevation, setCardElevation, transitionSpeedProfile, setTransitionSpeedProfile, headerStyleVariant, setHeaderStyleVariant, borderGlowIntensity, setBorderGlowIntensity, bgTexture, setBgTexture, glowRadius, setGlowRadius, mapLineColor, setMapLineColor, buttonStyling, setButtonStyling, glassmorphism, setGlassmorphism, activeTheme, glassBlurClass, triggerHaptic
      }} />

      <header className={`sticky top-0 z-40 bg-[#06060a]/70 backdrop-blur-2xl border-b border-white/10 px-4 py-3 md:px-6 shadow-[0_4px_30px_rgba(0,0,0,0.8)] border-t-[3px]`} style={{ borderTopColor: activeTheme.hex }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={icon} alt="Logo" className={`w-9 h-9 ${cornerStyle} object-cover border border-white/20`} />
            <div>
              <h1 className={`text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.gradient} uppercase font-mono`}>
                RURAL ERIDES GO
              </h1>
              <span className="text-[9px] text-zinc-300 font-mono uppercase tracking-widest block font-bold">
                Pilot: <strong className="text-white">{globalCallsign || "Unbound"}</strong>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
            
            {latestRelease && isNewerVersion(latestRelease.tag_name, CURRENT_VERSION) && (
              <a 
                href={latestRelease.assets?.[0]?.browser_download_url || latestRelease.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={triggerHaptic}
                className={`${reducedMotion ? '' : 'animate-bounce'} flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase shadow-[0_0_15px_rgba(244,63,94,0.5)] cursor-pointer ${reducedMotion ? '' : 'active:scale-95'}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Update Available ({latestRelease.tag_name})</span>
                <span className="xs:hidden">Update</span>
              </a>
            )}

            <button type="button" onClick={() => { triggerHaptic(); setActiveTab("INFO"); }} className={`flex items-center gap-1.5 bg-white/5 border ${activeTab === 'INFO' ? activeTheme.border : 'border-white/10'} px-3 py-1.5 rounded-xl text-[10px] ${activeTab === 'INFO' ? activeTheme.text : 'text-zinc-300'} font-mono font-bold shadow-inner hover:border-white/20 transition-colors cursor-pointer ${reducedMotion ? '' : 'active:scale-95'}`} title="View App Info & Creator Details">
              <Info className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">App Info</span>
            </button>

            <div className="hidden xs:flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] text-zinc-300 font-mono font-bold shadow-inner" title="Firebase Live Satellite Feed">
              <Satellite className={`w-3.5 h-3.5 ${activeTheme.text} ${reducedMotion ? '' : 'animate-pulse'}`} />
              <span>{satelliteCount} Sats (Live)</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-[#020813] border border-cyan-500/50 px-3 py-1.5 rounded-xl text-[10px] text-cyan-300 font-mono font-bold shadow-inner">
              {isOfflineMode ? (
                <>
                   <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                   <span className="text-amber-400">OFFLINE MODE</span>
                </>
              ) : (
                <>
                   <Shield className={`w-3.5 h-3.5 text-emerald-400 ${reducedMotion ? '' : 'animate-pulse'}`} />
                   <span className="text-emerald-50">SATELLITE ONLINE</span>
                </>
              )}
            </div>
            
            <button type="button" onClick={() => { triggerHaptic(); setIsSettingsOpen(true); }} className={`p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors shadow-inner group cursor-pointer ${reducedMotion ? '' : 'active:scale-95'}`}>
              <Settings className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-300 group-hover:${activeTheme.text} transition-colors`} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6 pb-24 lg:pb-6 relative z-10">
        <aside className="hidden lg:flex flex-col gap-2 w-64 shrink-0 bg-white/5 border border-white/10 backdrop-blur-xl p-4 rounded-3xl h-fit shadow-2xl">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest pl-2 mb-3 block">Navigation Console</span>
          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} type="button" onClick={() => { triggerHaptic(); setActiveTab(item.id); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${reducedMotion ? '' : 'active:scale-95'} ${isActive ? `bg-gradient-to-r ${activeTheme.gradient} text-black font-black` : "text-zinc-400 hover:text-white"}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        
        <main className="flex-1 min-w-0 relative">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }} transition={{ duration: 0.15 }}>
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#0a0a0f]/80 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center px-1 z-40 overflow-x-auto custom-scrollbar transition-transform duration-300 ${isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} type="button" onClick={() => { triggerHaptic(); setActiveTab(item.id); }} className={`flex flex-col items-center justify-center min-w-[56px] px-1 h-full text-[8px] font-black uppercase tracking-widest cursor-pointer shrink-0 transition-all ${reducedMotion ? '' : 'active:scale-90'} ${isActive ? activeTheme.text : "text-zinc-400 hover:text-white"}`}>
              <Icon className="w-4 h-4 mb-1" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <footer className={`pt-6 ${isKeyboardOpen ? 'pb-6' : 'pb-[85px] lg:pb-6'} text-center border-t border-white/5 bg-black/40 flex flex-col items-center gap-3 relative z-10 transition-all duration-300`}>
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest px-4">
          Rural ERides Go v{CURRENT_VERSION} • Universal PEV Network • Creator: Lord Bradley Callison • KEEP IT RURAL YALL
        </span>
        <a href="https://github.com/bradley3398/Rural-Erides-GO" target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 ${cornerStyle} text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest transition-all cursor-pointer shadow-lg mx-4 ${reducedMotion ? '' : 'active:scale-95'}`}>
          <Globe className="w-4 h-4 shrink-0" /> bradley3398/Rural-Erides-GO: GitHub Source Repository
        </a>
      </footer>
    </div>
  );
}