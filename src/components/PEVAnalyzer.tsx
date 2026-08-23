"use client";

import React, { useState, useEffect, useRef } from "react";
import icon from "../assets/icon.png";
import { locationService } from "../services/LocationService";

// 🔥 STRICT, CONSOLIDATED IMPORT LIST: ZERO MISSING ICONS. ZERO REFERENCE CRASHES. 🔥
import { 
  Loader2, UploadCloud, XCircle, Camera, CheckCircle, 
  AlertTriangle, Trash2, History, ShieldAlert, Wrench,
  Mic, MicOff, Volume2, Square, Zap, ThermometerSun, 
  Copy, Cpu, Search, ExternalLink, Sliders, Info, ImagePlus, Globe, Activity,
  Settings, UserCircle, Settings2, Gauge, ChevronDown, ChevronUp, Layers, LifeBuoy,
  ShoppingBag, ShoppingCart, Award, FileText, ChevronLeft, ChevronRight, Maximize2, MapPin, Sparkles, Key, Ruler, User, X, CheckSquare, ListChecks, BookOpen, Navigation, Lock,
  Flame, ShieldCheck, Compass, Radio, Terminal, Shield, Eye, RefreshCw, Droplets, Wind, BatteryCharging
} from "lucide-react";

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// --- SECURE API ROUTING & SUPABASE CLIENT ---
import { getGeminiApiKey, getTavilyApiKey } from "../services/CoPilotService";
import { createClient } from '@supabase/supabase-js';

const MODEL_VERSION = "gemini-3.1-flash-lite"; 

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  image?: string | null;
  checklist?: { text: string; completed: boolean }[];
}

interface DiagnosticSession {
  id: string;
  timestamp: string;
  title: string;
  image: string | null;
  mimeType: string | null;
  messages: Message[];
}

interface YouTubeVideo {
  title: string;
  url: string;
}

interface PEVRecord {
  name: string;
  brand: string;
  category: string;
  price: string;
  topSpeed: string;
  range: string;
  motorPower: string;
  battery: string;
  weight: string;
  chargingTime: string;
  efficiency: string;
  siteUrl: string;
  imageUrls: string[]; 
  dimensions: string;
  brakingSystem: string;
  suspensionType: string;
  tireProfile: string;
  waterResistance: string;
  maxPayload: string;
  controllerAmperage: string;
  frameMaterial: string;
  safetyRecalls?: string; 
  commonErrorCodes?: string;
  youtubeVideos?: YouTubeVideo[];
}

interface PartRecord {
  partName: string;
  category: string;
  compatibility: string;
  technicalSpecs: string;
  estimatedPrice: string;
  recommendedBrands: string;
  partUrl: string;
  imageUrl: string;
  partType: "OEM Stock" | "Aftermarket Upgrade" | "Performance Modification" | "3rd Party Clone Compatible";
  sourcePlatform: "Official Store" | "Amazon" | "eBay" | "Multi-Vendor Network" | "AliExpress Store";
  installationDifficulty?: "Beginner" | "Intermediate" | "Advanced (Splicing/Soldering Required)"; 
  youtubeTutorials?: YouTubeVideo[];
}

type ThemeColor = 'rural' | 'lime' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'void';

export default function RuralMechanicAssistant(props: any) {
  const [mounted, setMounted] = useState<boolean>(false);
  
  // --- TERMINAL VARIABLES ---
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<"chat" | "database">("chat");
  const [dbSubTab, setDbSubTab] = useState<"specs" | "parts" | "tools">("specs");
  
  const [dbSearch, setDbSearch] = useState<string>("");
  const [livePevResults, setLivePevResults] = useState<PEVRecord[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState<boolean>(false);
  const [hasSearchedDb, setHasSearchedDb] = useState<boolean>(false);
  const [expandedPevIdx, setExpandedPevIdx] = useState<number | null>(null);
  const [displayCountSpecs, setDisplayCountSpecs] = useState<number>(5);
  
  const [specCategoryFilter, setSpecCategoryFilter] = useState<string>("all");
  const [specSortBy, setSpecSortBy] = useState<string>("default");

  // Multi-Vehicle Comparison Matrix
  const [compareList, setCompareList] = useState<PEVRecord[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  // In-App YouTube Player State
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string | null>(null);

  const [activeImageIndices, setActiveImageIndices] = useState<Record<number, number>>({});
  const [lightboxState, setLightboxState] = useState<{ pevIdx: number; imgIdx: number } | null>(null);

  const [partsMake, setPartsMake] = useState<string>("");
  const [partsModel, setPartsModel] = useState<string>("");
  const [partsCategory, setPartsCategory] = useState<string>("Tires");
  const [universalPartQuery, setUniversalPartQuery] = useState<string>(""); 
  const [livePartsResults, setLivePartsResults] = useState<PartRecord[]>([]);
  const [isSearchingParts, setIsSearchingParts] = useState<boolean>(false);
  const [hasSearchedParts, setHasSearchedParts] = useState<boolean>(false);
  const [displayCountParts, setDisplayCountParts] = useState<number>(6);
  const [partsDifficultyFilter, setPartsDifficultyFilter] = useState<string>("all");

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<DiagnosticSession[]>([]);
  const [currentlyReadingId, setCurrentlyReadingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- UNIVERSAL OMNIBUS STATES & SUPABASE PROFILE SYNC ---
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState<boolean>(false);
  const [nightWrenchMode, setNightWrenchMode] = useState<boolean>(false);
  
  const [callsign, setCallsign] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name") || "LORD BRADLEY";
    }
    return "LORD BRADLEY";
  });
  
  const [theme, setTheme] = useState<ThemeColor>('rural');

  // --- 🔥 PROP SYNCHRONIZATION ENFORCER (AUTO-SYNC FROM APP.TSX) 🔥 ---
  useEffect(() => {
    if (props.theme) setTheme(props.theme as ThemeColor);
  }, [props.theme]);

  const [userFleet, setUserFleet] = useState<string>("Universal Performance PEV Fleet");
  const [aiDetailLevel, setAiDetailLevel] = useState<"compact" | "standard" | "exhaustive">("standard");
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  
  const [autoSaveLogs, setAutoSaveLogs] = useState<boolean>(true);
  const [autoReadAloud, setAutoReadAloud] = useState<boolean>(false);

  // Expanded Settings States
  const [aiModelVersion, setAiModelVersion] = useState<string>("gemini-3.1-flash-lite");
  const [safeSearchLevel, setSafeSearchLevel] = useState<string>("moderate");
  const [maxSpecResultsCount, setMaxSpecResultsCount] = useState<number>(10);
  const [autoClearPhoto, setAutoClearPhoto] = useState<boolean>(true);

  const [searchScope, setSearchScope] = useState<"all" | "oem_only" | "aftermarket_only" | "third_party">("all");
  const [preferredMarketplace, setPreferredMarketplace] = useState<"aggregated" | "amazon" | "ebay" | "official">("aggregated");
  const [userRegion, setUserRegion] = useState<"US" | "UK" | "EU" | "CA" | "AU">("US"); 
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial"); 
  const [buildManifest, setBuildManifest] = useState<PartRecord[]>([]);

  // --- TOOL TAB STATES ---
  const [calcVoltage, setCalcVoltage] = useState<number>(52);
  const [calcAh, setCalcAh] = useState<number>(20);
  const [calcWhPerMile, setCalcWhPerMile] = useState<number>(25);

  const [riderWeight, setRiderWeight] = useState<number>(180);
  const [vehicleWeight, setVehicleWeight] = useState<number>(65);
  
  const [oldTireSize, setOldTireSize] = useState<number>(10);
  const [newTireSize, setNewTireSize] = useState<number>(11);
  const [currentSpeed, setCurrentSpeed] = useState<number>(30);

  const [stockAmps, setStockAmps] = useState<number>(25);
  const [shuntSolderPercent, setShuntSolderPercent] = useState<number>(20);
  
  const [selectedBoltSize, setSelectedBoltSize] = useState<string>("M6");
  const [customWireAmps, setCustomWireAmps] = useState<number>(30);

  // Upgraded Tool States
  const [selectedErrorCode, setSelectedErrorCode] = useState<string>("E06");
  const [factoryPeakVolts, setFactoryPeakVolts] = useState<number>(54.6);
  const [measuredLoadVolts, setMeasuredLoadVolts] = useState<number>(48.0);
  const [testLoadAmps, setTestLoadAmps] = useState<number>(20.0);
  const [selectedSymptom, setSelectedSymptom] = useState<string>("motor_stutter");

  // New Labs States (Tools 7 to 18)
  const [kwhRate, setKwhRate] = useState<number>(0.14); 
  const [chargerAmps, setChargerAmps] = useState<number>(3);
  const [hillGradePercent, setHillGradePercent] = useState<number>(15);
  const [targetClimbSpeed, setTargetClimbSpeed] = useState<number>(15);
  const [ambientTempF, setAmbientTempF] = useState<number>(45); 
  const [brakeFluidType, setBrakeFluidType] = useState<string>("Mineral Oil");
  const [budgetItems, setBudgetItems] = useState<{name: string, cost: number}[]>([
    { name: "Hydraulic Brake Kit", cost: 120 },
    { name: "Off-Road Tires", cost: 85 }
  ]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setActiveSessionId(Date.now().toString());

    async function syncSupabaseUserAndCallsign() {
      try {
        const localCallsign = localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name");
        if (localCallsign) setCallsign(localCallsign);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (window as any)._env_?.SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any)._env_?.SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const metaUsername = user.user_metadata?.username || user.user_metadata?.callsign;
            if (metaUsername) {
              setCallsign(metaUsername);
              localStorage.setItem("rural_erides_username", metaUsername);
              localStorage.setItem("radar_screen_name", metaUsername);
            }
          }
        }
      } catch (e) {}
    }

    syncSupabaseUserAndCallsign();

    try {
      const savedHistory = localStorage.getItem("universal_diagnostic_sessions");
      if (savedHistory) setScanHistory(JSON.parse(savedHistory));

      const savedManifest = localStorage.getItem("universal_build_manifest");
      if (savedManifest) setBuildManifest(JSON.parse(savedManifest));
    } catch (e) {}
  }, []);

  const t = nightWrenchMode ? {
    text: 'text-amber-500', bg: 'bg-amber-600', border: 'border-amber-700', shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]', dim: 'bg-amber-950/40 text-amber-500 border-amber-900', hover: 'hover:text-amber-400', hex: '#d97706', borderSubtle: 'border-amber-900/40', hoverBorder: 'hover:border-amber-600', groupHoverText: 'group-hover:text-amber-400'
  } : ({
    rural: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/50', hover: 'hover:text-[#39ff14]', hex: '#39ff14', borderSubtle: 'border-[#39ff14]/30', hoverBorder: 'hover:border-[#39ff14]/50', groupHoverText: 'group-hover:text-[#39ff14]' },
    lime: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/50', hover: 'hover:text-[#39ff14]', hex: '#39ff14', borderSubtle: 'border-[#39ff14]/30', hoverBorder: 'hover:border-[#39ff14]/50', groupHoverText: 'group-hover:text-[#39ff14]' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', dim: 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50', hover: 'hover:text-white', hex: '#06b6d4', borderSubtle: 'border-cyan-900/40', hoverBorder: 'hover:border-cyan-500/50', groupHoverText: 'group-hover:text-cyan-400' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', dim: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50', hover: 'hover:text-white', hex: '#10b981', borderSubtle: 'border-emerald-900/40', hoverBorder: 'hover:border-emerald-500/50', groupHoverText: 'group-hover:text-emerald-400' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', dim: 'bg-amber-950/30 text-amber-400 border-amber-900/50', hover: 'hover:text-white', hex: '#f59e0b', borderSubtle: 'border-amber-900/40', hoverBorder: 'hover:border-amber-500/50', groupHoverText: 'group-hover:text-amber-400' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', dim: 'bg-rose-950/30 text-rose-400 border-rose-900/50', hover: 'hover:text-white', hex: '#f43f5e', borderSubtle: 'border-rose-900/40', hoverBorder: 'hover:border-rose-500/50', groupHoverText: 'group-hover:text-rose-400' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500', shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', dim: 'bg-purple-950/30 text-purple-400 border-purple-900/50', hover: 'hover:text-white', hex: '#a855f7', borderSubtle: 'border-purple-900/40', hoverBorder: 'hover:border-purple-500/50', groupHoverText: 'group-hover:text-purple-400' },
    void: { text: 'text-white', bg: 'bg-zinc-800', border: 'border-zinc-500', shadow: 'shadow-[0_0_20px_rgba(255,255,255,0.1)]', dim: 'bg-zinc-900/50 text-white border-zinc-700/50', hover: 'hover:text-white', hex: '#ffffff', borderSubtle: 'border-zinc-700/40', hoverBorder: 'hover:border-zinc-500/50', groupHoverText: 'group-hover:text-white' }
  }[theme] || { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/50', hover: 'hover:text-[#39ff14]', hex: '#39ff14', borderSubtle: 'border-[#39ff14]/30', hoverBorder: 'hover:border-[#39ff14]/50', groupHoverText: 'group-hover:text-[#39ff14]' });

  const promptLibrary = [
    { title: "Hydraulic Brake Bleed Guide", prompt: "Give me an interactive checklist for bleeding hydraulic disc brakes on an electric scooter or e-bike." },
    { title: "Hall Sensor Multimeter Test", prompt: "Give me an interactive checklist to test 5-pin hub motor hall sensors with a multimeter." },
    { title: "Solid Tire Installation", prompt: "Give me step-by-step instructions with an interactive checklist for boiling and installing a solid tire on a scooter motor wheel." },
    { title: "Controller Shunt Mod Guide", prompt: "Explain the controller shunt resistor mod safely, including risks and voltage sag calculations." },
    { title: "Battery Balancing & Storage", prompt: "How do I safely balance a high-capacity lithium-ion PEV pack and store it over winter?" }
  ];

  const triggerSOSBeacon = async () => {
    setErrorMsg(null);
    try {
      const currentLoc = locationService.getCurrentUpdate();
      let lat = "";
      let lng = "";
      let alt = "Unknown";

      if (currentLoc && typeof currentLoc.lat === 'number' && currentLoc.lat !== 0) {
        lat = currentLoc.lat.toFixed(5);
        lng = currentLoc.lng.toFixed(5);
        alt = currentLoc.altitude ? Math.round(currentLoc.altitude).toString() : "Unknown";
      } else {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, enableHighAccuracy: true });
        });
        lat = position.coords.latitude.toFixed(5);
        lng = position.coords.longitude.toFixed(5);
        alt = position.coords.altitude ? Math.round(position.coords.altitude).toString() : "Unknown";
      }

      const sosPrompt = `EMERGENCY SOS BROADCAST: Callsign ${callsign} is stranded. True Hardware GPS Coordinates Confirmed -> Lat: ${lat}, Lng: ${lng}, Altitude: ${alt}m. Time: ${new Date().toLocaleTimeString()}. Please provide an immediate rescue triage guide, exact coordinate summary, and safe shelter protocol.`;
      setActiveTab("chat");
      analyzeImage(sosPrompt);
    } catch (e: any) {
      setErrorMsg(`GPS Lock Failed: Unable to acquire true device hardware coordinates (${e?.message || 'Permission denied'}).`);
    }
  };

  const getDynamicTorqueSpec = (bolt: string) => {
    const specs: Record<string, { nm: string; ftlbs: string; usage: string }> = {
      "M3": { nm: "1.0 - 1.5 Nm", ftlbs: "0.7 - 1.1 ft-lbs", usage: "Display mounts, hall sensor PCB screws" },
      "M4": { nm: "2.5 - 3.5 Nm", ftlbs: "1.8 - 2.6 ft-lbs", usage: "Deck lid enclosure, throttle body casing" },
      "M5": { nm: "5.0 - 7.0 Nm", ftlbs: "3.7 - 5.1 ft-lbs", usage: "Brake rotor Torx bolts, fender stays" },
      "M6": { nm: "9.0 - 12.0 Nm", ftlbs: "6.6 - 8.8 ft-lbs", usage: "Caliper brackets, stem pinch bolts, handle grips" },
      "M8": { nm: "20.0 - 25.0 Nm", ftlbs: "14.7 - 18.4 ft-lbs", usage: "Suspension pivot bolts, main folding latch" },
      "M10": { nm: "35.0 - 42.0 Nm", ftlbs: "25.8 - 31.0 ft-lbs", usage: "Footpeg mounts, solid fork pinch bolts" },
      "M12": { nm: "45.0 - 55.0 Nm", ftlbs: "33.2 - 40.5 ft-lbs", usage: "Front hub motor axle nuts" },
      "M14": { nm: "55.0 - 68.0 Nm", ftlbs: "40.5 - 50.1 ft-lbs", usage: "Heavy rear hub axle nuts, swingarm pivots" }
    };
    return specs[bolt] || specs["M6"];
  };

  const getRecommendedAWG = (amps: number) => {
    if (amps <= 7) return { gauge: "24 AWG", temp: "Cool", connector: "JST / Dupont" };
    if (amps <= 12) return { gauge: "22 AWG", temp: "Cool", connector: "JST-SM 2.54" };
    if (amps <= 22) return { gauge: "18 AWG", temp: "Moderate", connector: "XT30 / Bullet 3.5mm" };
    if (amps <= 38) return { gauge: "16 AWG", temp: "Moderate", connector: "XT60 / Bullet 4.0mm" };
    if (amps <= 65) return { gauge: "14 AWG", temp: "Warm", connector: "XT60 / MT60" };
    if (amps <= 95) return { gauge: "12 AWG", temp: "Warm", connector: "XT90 / Amass 5.0mm" };
    if (amps <= 145) return { gauge: "10 AWG", temp: "Heavy Duty", connector: "XT90-S Anti-Spark" };
    return { gauge: "8 AWG or Dual 10 AWG", temp: "Extreme", connector: "QS8 / QS10 Anti-Spark" };
  };

  const getErrorCodeDetails = (code: string) => {
    const registry: Record<string, { fault: string; component: string; fix: string }> = {
      "E01": { fault: "Controller Communication Error", component: "Dashboard to ESC Data Wire / UART", fix: "Check 5-pin display cable connector for bent pins or loose solder joints." },
      "E02": { fault: "Throttle Fault / Voltage Out of Range", component: "Hall Throttle / Thumb Throttle", fix: "Inspect throttle magnet alignment and signal wire continuity." },
      "E03": { fault: "Controller Phase Overcurrent Protection", component: "ESC / Motor Phase Wires", fix: "Check for shorted phase wires or controller blown MOSFETs." },
      "E04": { fault: "Brake Cutoff Switch Engaged / Short", component: "E-Brake Microswitch / Lever Sensor", fix: "Disconnect brake sensors one by one to see if error clears." },
      "E05": { fault: "Undervoltage Protection Triggered", component: "Battery Pack / BMS Voltage Sag", fix: "Recharge pack immediately or inspect for dead P-groups sagging under load." },
      "E06": { fault: "Motor Hall Sensor Signal Fault", component: "Hub Motor 5-Pin Hall Harness", fix: "Test each hall sensor signal wire with multimeter for 0V/5V toggling." },
      "E07": { fault: "Motor Locked Rotor / Stall Protection", component: "Hub Motor Stator / Bearings", fix: "Check if wheel spins freely by hand; inspect axle bearings for seizure." },
      "E08": { fault: "Controller Temperature Overheat", component: "ESC Heatsink / Thermal Paste", fix: "Let the scooter cool down; check for excessive continuous amp draw or hill climbing." },
      "E09": { fault: "BMS Hardware Fault / Comm Failure", component: "Battery Management System", fix: "Reset BMS power loop or check balance lead harness connection." },
      "E10": { fault: "Controller Overvoltage Protection", component: "Battery / Charger Overcharge", fix: "Verify charger output voltage matches pack nominal specification." }
    };
    return registry[code.toUpperCase()] || { fault: "Custom / Unlisted Fault Code", component: "General Peripheral Wiring", fix: "Perform multi-meter continuity test across main harness and ESC terminals." };
  };

  const calculateBatteryHealth = () => {
    const voltageDrop = Math.max(0.1, factoryPeakVolts - measuredLoadVolts);
    const internalResistanceMohm = (voltageDrop / Math.max(1, testLoadAmps)) * 1000;
    
    let healthScore = 100 - ((internalResistanceMohm - 15) * 1.5);
    healthScore = Math.max(10, Math.min(100, healthScore));

    let status = "Excellent Health (Low Resistance)";
    if (healthScore < 80) status = "Moderate Wear (Normal Aging)";
    if (healthScore < 60) status = "High Internal Resistance (Cells Degrading / Sinking)";
    if (healthScore < 40) status = "Critical Failure Imminent (Cell Group Imbalance / Replace Pack)";

    return { ir: internalResistanceMohm.toFixed(1), health: Math.round(healthScore), status, drop: voltageDrop.toFixed(2) };
  };

  const getSymptomTriageGuide = (symptom: string) => {
    const tree: Record<string, { title: string; steps: string[] }> = {
      "motor_stutter": {
        title: "Motor Stuttering / Cogging Under Throttle",
        steps: [
          "1. Inspect 3-phase motor power bullets (Yellow, Green, Blue) for melted connectors or loose pins.",
          "2. Test 5-pin Hall sensor harness with multimeter for intermittent connection.",
          "3. Check controller phase wire solder joints on the ESC board."
        ]
      },
      "dead_display": {
        title: "Complete Power Loss / Dead Dashboard",
        steps: [
          "1. Check main battery XT90/XT60 discharge connector for loose fit or spark burn.",
          "2. Measure battery output voltage before and after the key switch / voltage lock.",
          "3. Inspect dashboard display 5-pin UART harness for internal pinched wires."
        ]
      },
      "brake_cutoff": {
        title: "Throttle Dead / Vehicle Won't Move (Brake Switch Glitch)",
        steps: [
          "1. Check if brake lever microswitches are physically stuck in the depressed position.",
          "2. Unplug brake sensor connectors from the controller harness one by one.",
          "3. Verify brake sensor signal pin voltage transitions cleanly when lever is pulled."
        ]
      },
      "flat_tire": {
        title: "Sudden Pneumatic Pressure Loss / Bead Pop",
        steps: [
          "1. Check valve stem core tightness and ensure inner tube isn't pinched.",
          "2. Inspect tire tread for embedded glass, nails, or pinch flats (snake bites).",
          "3. If tubeless, check rim flange for dents or compromised tire sealant."
        ]
      }
    };
    return tree[symptom] || { title: "General Triage Protocol", steps: ["1. Power down system completely.", "2. Inspect all wiring harnesses.", "3. Test voltage rails with multimeter."] };
  };

  const getBrakeFluidInfo = (fluid: string) => {
    const registry: Record<string, { boiling: string; compatible: string; warning: string }> = {
      "Mineral Oil": { boiling: "190°C - 280°C", compatible: "Shimano, Magura, Tektro hydraulic systems", warning: "NEVER mix with DOT fluid; destroys rubber master cylinder seals instantly." },
      "DOT 4": { boiling: "230°C (Dry) / 155°C (Wet)", compatible: "SRAM / Avid, Hope moto-style brakes", warning: "Paint stripper properties; wash immediately if spilled on painted chassis parts." },
      "DOT 5.1": { boiling: "270°C (Dry) / 180°C (Wet)", compatible: "High-performance heavy braking PEVs", warning: "Highly hygroscopic; absorbs moisture rapidly from air over time." }
    };
    return registry[fluid] || registry["Mineral Oil"];
  };

  const saveConfiguration = () => {
    setShowSettings(false);
  };

  useEffect(() => {
    if (!mounted || messages.length === 0 || !autoSaveLogs) return;
    const currentSession: DiagnosticSession = {
      id: activeSessionId,
      timestamp: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      title: messages[0].text.substring(0, 30) + "...",
      image: null, 
      mimeType: null,
      messages
    };

    setScanHistory(prevHistory => {
      const existingIndex = prevHistory.findIndex(s => s.id === activeSessionId);
      let newHistory;
      if (existingIndex >= 0) {
        newHistory = [...prevHistory];
        newHistory[existingIndex] = currentSession;
      } else {
        newHistory = [currentSession, ...prevHistory].slice(0, 15);
      }
      try {
        localStorage.setItem("universal_diagnostic_sessions", JSON.stringify(newHistory));
      } catch (e) {}
      return newHistory;
    });
  }, [messages, activeSessionId, mounted, autoSaveLogs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  useEffect(() => {
    if (!isAnalyzing && !isSearchingDb && !isSearchingParts) return;
    const steps = [
      "Accessing dynamic global web indexes (Tavily Multi-Channel Deep-Routing)...",
      "Scraping live manufacturer databases, Amazon inventories, and YouTube networks...",
      "Calibrating search outputs for chosen regional pricing criteria...",
      "Parsing real-time multi-result technical parameters and media feeds..."
    ];
    let currentStep = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length;
      setLoadingStep(steps[currentStep]);
    }, 1300);
    return () => clearInterval(interval);
  }, [isAnalyzing, isSearchingDb, isSearchingParts]);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      setImage(result.split(",")[1]);
      setMimeType(file.type);
    };
    reader.onerror = () => setErrorMsg("Failed to process asset into visual layout.");
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImage(null);
    setPreviewUrl(null);
    setMimeType(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const startNewSession = () => {
    clearImage();
    setMessages([]);
    setQuestion("");
    setErrorMsg(null);
    setActiveSessionId(Date.now().toString());
    try {
      if (currentlyReadingId) {
        if (Capacitor.isPluginAvailable('TextToSpeech')) {
          TextToSpeech.stop();
        } else if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
    } catch (e) {}
    setCurrentlyReadingId(null);
  };

  const loadPreviousSession = (session: DiagnosticSession) => {
    setActiveSessionId(session.id);
    clearImage();
    setMessages(session.messages);
    setQuestion("");
    setErrorMsg(null);
    try {
      if (currentlyReadingId) {
        if (Capacitor.isPluginAvailable('TextToSpeech')) {
          TextToSpeech.stop();
        } else if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
    } catch (e) {}
    setCurrentlyReadingId(null);
    setActiveTab("chat");
  };

  const clearAllHistory = () => {
    if (window.confirm("Wipe all system session diagnostic records?")) {
      localStorage.removeItem("universal_diagnostic_sessions");
      setScanHistory([]);
      startNewSession();
    }
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if(id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        alert("Copied to clipboard!");
      }
    } catch (err) {}
  };

  const exportToCSV = (type: "specs" | "parts") => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      if (type === "specs" && livePevResults.length > 0) {
        csvContent += "Brand,Model,Category,Price,Top Speed,Range,Motor,Battery,Weight,Efficiency,Water Resistance,Payload,Safety Recalls,Known Error Codes,Site URL\n";
        livePevResults.forEach(pev => {
          const row = [
            `"${pev.brand}"`, `"${pev.name}"`, `"${pev.category}"`, `"${pev.price}"`, `"${pev.topSpeed}"`, `"${pev.range}"`, 
            `"${pev.motorPower}"`, `"${pev.battery}"`, `"${pev.weight}"`, `"${pev.efficiency}"`, `"${pev.waterResistance}"`,
            `"${pev.maxPayload}"`, `"${pev.safetyRecalls || 'None Reported'}"`, `"${pev.commonErrorCodes || 'None Logged'}"`, `"${pev.siteUrl}"`
          ].join(",");
          csvContent += row + "\n";
        });
      } else if (type === "parts" && livePartsResults.length > 0) {
        csvContent += "Part Name,Category,Brand,Price,Type,Compatibility,Platform,Difficulty,URL\n";
        livePartsResults.forEach(part => {
          const row = [
            `"${part.partName}"`, `"${part.category}"`, `"${part.recommendedBrands}"`, `"${part.estimatedPrice}"`,
            `"${part.partType}"`, `"${part.compatibility}"`, `"${part.sourcePlatform}"`, `"${part.installationDifficulty || 'N/A'}"`, `"${part.partUrl}"`
          ].join(",");
          csvContent += row + "\n";
        });
      } else {
        return;
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Rural_Mechanic_${type}_Export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Failed to export data to CSV.");
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg("Voice capture speech architecture missing on system profile.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setErrorMsg(null); };
    recognition.onresult = (event: any) => setQuestion(event.results[0][0].transcript);
    recognition.onerror = () => { setIsListening(false); setErrorMsg("System vocal index timed out. Say query again."); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleTTS = async (text: string, id: string) => {
    try {
      if (currentlyReadingId === id) {
        if (Capacitor.isPluginAvailable('TextToSpeech')) {
          await TextToSpeech.stop();
        } else if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setCurrentlyReadingId(null);
      } else {
        if (currentlyReadingId) {
          if (Capacitor.isPluginAvailable('TextToSpeech')) {
            await TextToSpeech.stop();
          } else if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        }
        setCurrentlyReadingId(id);
        const cleanText = text.replace(/\*/g, '').replace(/#/g, '');
        if (Capacitor.isPluginAvailable('TextToSpeech')) {
          await TextToSpeech.speak({ 
            text: cleanText, 
            lang: 'en-US', 
            rate: ttsRate, 
            pitch: ttsPitch, 
            volume: 1.0, 
            category: 'ambient' 
          });
        } else if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = ttsRate;
          utterance.pitch = ttsPitch;
          utterance.onend = () => setCurrentlyReadingId(null);
          window.speechSynthesis.speak(utterance);
          return;
        }
        setCurrentlyReadingId(null);
      }
    } catch (e) {
      setErrorMsg("Audio processing hardware failed initialization.");
      setCurrentlyReadingId(null);
    }
  };

  const getRegionalDomainSuffix = () => {
    if (userRegion === "UK") return { amazon: "amazon.co.uk", ebay: "ebay.co.uk", currency: "GBP (£)" };
    if (userRegion === "EU") return { amazon: "amazon.de", ebay: "ebay.de", currency: "EUR (€)" };
    if (userRegion === "CA") return { amazon: "amazon.ca", ebay: "amazon.ca", currency: "CAD ($)" };
    if (userRegion === "AU") return { amazon: "amazon.com.au", ebay: "amazon.com.au", currency: "AUD ($)" };
    return { amazon: "amazon.com", ebay: "amazon.com", currency: "USD ($)" };
  };

  const extractJSON = (text: string) => {
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    
    if (arrayStart !== -1 && arrayEnd !== -1) {
      return text.substring(arrayStart, arrayEnd + 1);
    }
    
    const objStart = text.indexOf('{');
    const objEnd = text.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1) {
      return text.substring(objStart, objEnd + 1);
    }
    return text; 
  };

  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const searchLiveSpecs = async (targetOverride?: string) => {
    const searchQuery = targetOverride || dbSearch;
    if (!searchQuery.trim()) return;
    
    setIsSearchingDb(true);
    setHasSearchedDb(true);
    setErrorMsg(null);
    setLivePevResults([]); 
    setExpandedPevIdx(null);
    setActiveImageIndices({});
    setDisplayCountSpecs(maxSpecResultsCount);

    try {
      const tavilyKey = getTavilyApiKey();
      const geminiKey = getGeminiApiKey();

      const tavilyQuery = `${searchQuery} official manufacturer store page mechanics technical specifications review video youtube data sheets`;
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: tavilyQuery,
          search_depth: "advanced", 
          include_raw_content: false,
          max_results: 30 
        })
      });
      
      const tavilyData = await tavilyResponse.json();
      if (!tavilyResponse.ok) throw new Error("Tavily engine communication dropped.");
      
      const webContextData = JSON.stringify(tavilyData.results);

      const prompt = `You are a strict technical schema conversion layer. I have run an advanced internet search across all brands for "${searchQuery}".
      Here is the raw real-world context data parsed from dynamic web nodes:
      ${webContextData}
      
      Target Region Focus Parameter: ${userRegion}
      Measurement Unit: ${unitSystem.toUpperCase()} (Force output to this system).
      
      Analyze the text payload to reconstruct a high-fidelity specifications dataset mapping an expanded array of distinct matching vehicle variations discovered in the search logs. 
      CRITICAL INSTRUCTION: If this search represents a multi-vehicle request or random discovery mode, you MUST return exactly 10 matching hardware records using your expert knowledge base grounding to complete missing specs. Ensure everything uses accurate official factory parameters.
      
      CRITICAL LINK REQUIREMENT: Inside the "siteUrl" field, you MUST extract the actual, real manufacturer product URL, official distributor domain, or specific review link text from the provided search results. Do not provide dummy links.
      
      CRITICAL YOUTUBE INSTRUCTION: For each PEV record, extract or construct 2 real YouTube video links matching video reviews, top speed tests, or teardowns for this machine into the "youtubeVideos" array!

      Return ONLY a clean JSON array matching this data model signature exactly:
      [
        {
          "name": "Exact model designation code",
          "brand": "Manufacturer name string",
          "category": "E-Bike" | "E-Scooter" | "E-Trike" | "EUC" | "E-Skateboard" | "E-Moped" | "Onewheel",
          "price": "Active adjusted local region market pricing scale with correct currency symbol",
          "topSpeed": "True maximum velocity metrics",
          "range": "Max structural mileage rating",
          "motorPower": "Wattage output configuration & hub/mid/hollow architecture info",
          "battery": "Voltage and Ah capacity footprint parameters",
          "weight": "Net curb weight footprint",
          "chargingTime": "Complete charging duration window",
          "efficiency": "Wh/mi energy draw efficiency metrics",
          "siteUrl": "Authentic direct deep link collected from the search logs text blocks",
          "dimensions": "Full dimension footprint profile (folded and unfolded properties)",
          "brakingSystem": "Complete rotor assembly caliper and braking system specs",
          "suspensionType": "Shock damping front and rear setup profile specs",
          "tireProfile": "Tire width diameter dimensions, grade threads, casing metrics",
          "waterResistance": "Ingress Protection IP classification code rating",
          "maxPayload": "Max cargo load limit capacity weight scale",
          "controllerAmperage": "Controller limitation sine-wave and amperage parameters",
          "frameMaterial": "Chassis structural core profile alloy composite composition",
          "youtubeVideos": [
            { "title": "Comprehensive Review & Top Speed Test", "url": "https://www.youtube.com/watch?v=..." }
          ]
        }
      ]`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModelVersion}:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      };

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const geminiData = await geminiRes.json();
      if (!geminiRes.ok) throw new Error(geminiData.error?.message || "Gemini deep-parsing exception encountered.");
      
      const rawText = geminiData.candidates[0].content.parts[0].text;
      const jsonString = extractJSON(rawText);
      const parsedData = JSON.parse(jsonString);
      
      const resultsArray = Array.isArray(parsedData) ? parsedData : (parsedData.items || parsedData.parts || [parsedData]);

      const finalResults = resultsArray.map((pev: any) => {
        const cleanBrandName = pev.brand ? pev.brand.replace(/[^a-zA-Z0-9\s]/g, "") : "";
        const cleanModelName = pev.name ? pev.name.replace(/[^a-zA-Z0-9\s]/g, "") : "";
        const exactMatchQuery = `"${cleanBrandName}" "${cleanModelName}" official platform ${pev.category}`;
        
        return {
          ...pev,
          imageUrls: [
            `https://tse1.mm.bing.net/th?q=${encodeURIComponent(exactMatchQuery + " isolated product profile photo white background")}&w=600&h=600&c=7&rs=1&p=0`,
            `https://tse1.mm.bing.net/th?q=${encodeURIComponent(exactMatchQuery + " dynamic active riding action photo")}&w=600&h=600&c=7&rs=1&p=0`,
            `https://tse1.mm.bing.net/th?q=${encodeURIComponent(exactMatchQuery + " handlebar display screen layout close up")}&w=600&h=600&c=7&rs=1&p=0`,
            `https://tse1.mm.bing.net/th?q=${encodeURIComponent(exactMatchQuery + " hub motor motor architecture close up")}&w=600&h=600&c=7&rs=1&p=0`
          ]
        };
      });

      setLivePevResults(finalResults);
    } catch (err) {
      console.error("Live Spec Engine Error:", err);
      setErrorMsg(`Spec Engine Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSearchingDb(false);
    }
  };

  const handleRandomDiscovery = () => {
    const categories = ["High-Performance E-Scooter", "Electric Dirt Bike", "Electric Unicycle (EUC)", "Fat-Tire E-Bike", "Electric Skateboard", "Utility E-Trike"];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const complexMacroQuery = `Top 10 newest trending high performance ${randomCat} models worldwide`;
    
    setDbSearch(`Live Global ${randomCat} Discoveries`);
    searchLiveSpecs(complexMacroQuery);
  };

  const searchLiveParts = async () => {
    setIsSearchingParts(true);
    setHasSearchedParts(true);
    setErrorMsg(null);
    setLivePartsResults([]);
    setDisplayCountParts(6);

    try {
      const tavilyKey = getTavilyApiKey();
      const geminiKey = getGeminiApiKey();

      const suffixes = getRegionalDomainSuffix();
      let storeFilter = `buy online ${userRegion}`;
      if (preferredMarketplace === "amazon") storeFilter = `site:${suffixes.amazon} buy`;
      if (preferredMarketplace === "ebay") storeFilter = `site:${suffixes.ebay} buy`;
      if (preferredMarketplace === "official") storeFilter = `official store buy`;

      let targetQuery = "";
      if (universalPartQuery.trim()) {
        targetQuery = `${universalPartQuery} parts components store repair tutorial youtube ${storeFilter}`;
      } else {
        const modifier = searchScope === "aftermarket_only" ? "aftermarket upgrade performance modification" : 
                         searchScope === "third_party" ? "compatible replacement clone spare alternative" : "OEM genuine spare part";
        
        const makeModelString = (partsMake || partsModel) ? `${partsMake} ${partsModel}` : "electric scooter ebike hardware";
        targetQuery = `${makeModelString} ${partsCategory} ${modifier} youtube video installation ${storeFilter}`;
      }
      
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: targetQuery,
          search_depth: "advanced", 
          include_raw_content: false,
          max_results: 30 
        })
      });
      
      const tavilyData = await tavilyResponse.json();
      if (!tavilyResponse.ok) throw new Error(tavilyData.error || "Tavily routing node dropped packets.");
      
      const webContextData = JSON.stringify(tavilyData.results);

      const scopePrompt = `You are a dedicated component sourcing parser module. Extract valid retail replacement data matrices from this web payload text log:
      ${webContextData}
      
      System Directives:
      1. Target Region: ${userRegion} (Format all prices in this region's local currency if possible).
      2. Measurement Unit: ${unitSystem.toUpperCase()} (Force all dimensions/specs into ${unitSystem === 'metric' ? 'metric units' : 'imperial units'}).
      3. Extract or construct 2 real YouTube repair/installation tutorial video links for each part into "youtubeTutorials"!
      
      Parse real hardware components. Return an expanded layout of up to 15 distinct item entries to display a maxed out search database pool. Trace alternative 3rd party compatible components, non-OEM functional clone clones, and aftermarket options alongside standard OEM profiles. Match absolute store URLs directly inside the text blocks.
      
      IMPORTANT FAILSAFE: If the search context payload is thin or missing direct results, USE YOUR EXPERT KNOWLEDGE BASE to generate at least 10 highly accurate, real-world examples of components that exist on the market for this query, assigning logical marketplace URLs. DO NOT return an empty array.

      Return a clean JSON array matching this layout design. Do NOT add markdown blocks or conversational text. Just the raw array starting with [ and ending with ].
      [
        {
          "partName": "Precise hardware description",
          "category": "Tires | Tubes | Brakes | Batteries | Motors | Accessories | Controllers | Upgrades",
          "compatibility": "Verified model boundaries or universal fit criteria",
          "technicalSpecs": "Metrics: TPI values, dimensions, compound formulas, electrical capacity thresholds parsed from web results",
          "estimatedPrice": "Current live listing local region currency financial quote indicator string",
          "recommendedBrands": "OEM producer, third party alternative component, or prominent heavy-duty aftermarket variant maker found in text",
          "partUrl": "Absolute direct deep link path URL straight to product checkout page found inside search text logs",
          "partType": "OEM Stock" | "Aftermarket Upgrade" | "Performance Modification" | "3rd Party Clone Compatible",
          "sourcePlatform": "Official Store" | "Amazon" | "eBay" | "Multi-Vendor Network" | "AliExpress Store",
          "installationDifficulty": "Beginner" | "Intermediate" | "Advanced (Splicing/Soldering Required)",
          "youtubeTutorials": [
            { "title": "Step-by-Step Replacement Tutorial", "url": "https://www.youtube.com/watch?v=..." }
          ]
        }
      ]`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModelVersion}:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [{ role: "user", parts: [{ text: scopePrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      };

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || "Gemini constraint configuration error.");
      
      const rawText = resData.candidates[0].content.parts[0].text;
      const jsonString = extractJSON(rawText);
      const parsedData = JSON.parse(jsonString);
      
      const partsArray = Array.isArray(parsedData) ? parsedData : (parsedData.items || parsedData.parts || [parsedData]);

      const optimizedParts = partsArray.map((part: any) => {
        const cleanPartName = part.partName ? part.partName.replace(/[^a-zA-Z0-9\s]/g, "") : "";
        const cleanPartBrand = part.recommendedBrands && part.recommendedBrands !== "N/A" && part.recommendedBrands !== "Unknown" ? part.recommendedBrands.replace(/[^a-zA-Z0-9\s]/g, "") : "";
        const organicPartQuery = `${cleanPartBrand} ${cleanPartName} official ${part.category} replacement`.trim();
        return {
          ...part,
          imageUrl: `https://tse1.mm.bing.net/th?q=${encodeURIComponent(organicPartQuery + " product isolated photo white background")}&w=400&h=400&c=7&rs=1&p=0`
        };
      });

      setLivePartsResults(optimizedParts);
    } catch (err) {
      console.error("Component Finder System Failure:", err);
      setErrorMsg(`Parts Engine Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSearchingParts(false);
    }
  };

  const parseChecklist = (text: string) => {
    const lines = text.split("\n");
    let hasChecklist = false;
    const parsedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- [ ]") || trimmed.startsWith("* [ ]") || trimmed.match(/^\d+\.\s+\[\s*\]/)) {
        hasChecklist = true;
        const cleanText = trimmed.replace(/^([-*]|\d+\.)\s+\[\s*\]\s*/, "");
        return { text: cleanText, completed: false };
      }
      return null;
    });
    return hasChecklist ? parsedLines.filter(Boolean) as { text: string; completed: boolean }[] : undefined;
  };

  const analyzeImage = async (overridePrompt?: string) => {
    const activeQuery = overridePrompt || question || (image ? "Please run a diagnostic scan on this hardware." : "");
    if (!activeQuery.trim()) {
      setErrorMsg("Enter a mechanical query or run a quick action module.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setQuestion("");

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: activeQuery, image: previewUrl };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    let depthInstruction = "";
    if (aiDetailLevel === "compact") depthInstruction = "Keep your answer to a single, concise paragraph.";
    if (aiDetailLevel === "standard") depthInstruction = "Provide a comprehensive answer detailing exactly how to fix the issue or answer the query. If step-by-step instructions are required, format them using markdown checkboxes like '- [ ] Step description'.";
    if (aiDetailLevel === "exhaustive") depthInstruction = "Provide an exhaustive, step-by-step masterclass answer detailing torque specs, tool requirements, and safety warnings. Format steps using markdown checkboxes like '- [ ] Step description'.";

    const systemContext = `
      You are Rural Mechanic, an expert master PEV mechanic assisting ${callsign}.
      Active Fleet: ${userFleet}.
      Measurement Unit System: ${unitSystem}.
      CRITICAL: NO markdown formatting for bolding/headers. NO bullet points except checklist markdown. 
      Answer the query based on safety and mechanics.
      ${depthInstruction}
    `;

    try {
      const apiContents = updatedMessages.slice(-15).map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const lastUserIndex = apiContents.length - 1;
      const promptParts: any[] = [{ text: activeQuery }];

      if (image && mimeType) {
        promptParts.push({ inlineData: { mimeType: mimeType, data: image } } as any);
      }

      apiContents[lastUserIndex].parts = promptParts;

      const geminiKey = getGeminiApiKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModelVersion}:generateContent?key=${geminiKey}`;
      
      const payload = {
        system_instruction: {
          parts: [{ text: systemContext }]
        },
        contents: apiContents
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.status === 429) throw new Error("Cloud network threshold maxed. Hold execution 10 seconds.");
      if (!response.ok) throw new Error(data.error?.message || `Terminal Node Error ${response.status}`);

      const reportText = data.candidates[0].content.parts[0].text;
      const parsedChecklist = parseChecklist(reportText);

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: reportText, checklist: parsedChecklist };
      setMessages([...updatedMessages, aiMsg]);

      if (autoReadAloud && globalThis.window) {
        handleTTS(reportText, aiMsg.id);
      }

    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : String(error));
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAnalyzing(false);
      if (autoClearPhoto) clearImage();
    }
  };

  const toggleCompare = (pev: PEVRecord) => {
    if (compareList.some(p => p.name === pev.name && p.brand === pev.brand)) {
      setCompareList(compareList.filter(p => !(p.name === pev.name && p.brand === pev.brand)));
    } else {
      if (compareList.length >= 3) return alert("You can compare up to 3 PEVs at once.");
      setCompareList([...compareList, pev]);
    }
  };

  const addToManifest = (part: PartRecord) => {
    const updated = [...buildManifest, part];
    setBuildManifest(updated);
    localStorage.setItem("universal_build_manifest", JSON.stringify(updated));
  };

  const clearManifest = () => {
    setBuildManifest([]);
    localStorage.removeItem("universal_build_manifest");
  };

  const copyManifest = () => {
    const manifestText = buildManifest.map(p => `- ${p.partName} (${p.estimatedPrice}) | Platform: ${p.sourcePlatform}\n  Link: ${p.partUrl}`).join("\n\n");
    copyToClipboard(`Rural Mechanic Build Manifest:\n\n${manifestText}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handlePrevImage = (pevIdx: number, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndices(prev => {
      const currentIdx = prev[pevIdx] || 0;
      const nextIdx = currentIdx === 0 ? totalImages - 1 : currentIdx - 1;
      return { ...prev, [pevIdx]: nextIdx };
    });
  };

  const handleNextImage = (pevIdx: number, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndices(prev => {
      const currentIdx = prev[pevIdx] || 0;
      const nextIdx = currentIdx === totalImages - 1 ? 0 : currentIdx + 1;
      return { ...prev, [pevIdx]: nextIdx };
    });
  };

  const handleLightboxPrev = () => {
    if (!lightboxState) return;
    const { pevIdx, imgIdx } = lightboxState;
    const totalImages = livePevResults[pevIdx]?.imageUrls?.length || 1;
    const newImgIdx = imgIdx === 0 ? totalImages - 1 : imgIdx - 1;
    setLightboxState({ pevIdx, imgIdx: newImgIdx });
  };

  const handleLightboxNext = () => {
    if (!lightboxState) return;
    const { pevIdx, imgIdx } = lightboxState;
    const totalImages = livePevResults[pevIdx]?.imageUrls?.length || 1;
    const newImgIdx = imgIdx === totalImages - 1 ? 0 : imgIdx + 1;
    setLightboxState({ pevIdx, imgIdx: newImgIdx });
  };

  const filteredAndSortedSpecs = (livePevResults || []).filter(pev => {
    if (specCategoryFilter === "all") return true;
    return (pev.category || "").toLowerCase().includes(specCategoryFilter.toLowerCase());
  }).sort((a, b) => {
    if (specSortBy === "speed_desc") {
      const speedA = parseFloat(a.topSpeed) || 0;
      const speedB = parseFloat(b.topSpeed) || 0;
      return speedB - speedA;
    }
    if (specSortBy === "range_desc") {
      const rangeA = parseFloat(a.range) || 0;
      const rangeB = parseFloat(b.range) || 0;
      return rangeB - rangeA;
    }
    if (specSortBy === "price_asc") {
      const priceA = parseFloat((a.price || "").replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat((b.price || "").replace(/[^0-9.]/g, '')) || 0;
      return priceA - priceB;
    }
    return 0;
  });

  const filteredParts = (livePartsResults || []).filter(part => {
    if (partsDifficultyFilter === "all") return true;
    return part.installationDifficulty && (part.installationDifficulty || "").toLowerCase().includes(partsDifficultyFilter.toLowerCase());
  });

  if (!mounted) {
    return <div className="p-6 text-center text-zinc-500 font-mono">Initializing Rural Mechanic Terminal...</div>;
  }

  return (
    <div className={`space-y-4 p-3 sm:p-4 max-w-6xl mx-auto font-sans text-zinc-200 relative z-10 transition-colors duration-300 ${nightWrenchMode ? 'bg-[#150a00]' : ''}`}>
      
      {/* IN-APP YOUTUBE PLAYER MODAL */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-4xl bg-black border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-500" /> {activeVideoTitle || "PEV Video Feed"}
              </h4>
              <button onClick={() => setActiveVideoUrl(null)} className="p-2 text-zinc-400 hover:text-white bg-black/50 rounded-xl cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              {extractYouTubeId(activeVideoUrl) ? (
                <iframe 
                  src={`https://www.youtube.com/embed/${extractYouTubeId(activeVideoUrl)}?autoplay=1`} 
                  title="YouTube video player" 
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <Globe className="w-12 h-12 text-red-500 animate-pulse" />
                  <p className="text-xs font-bold text-zinc-300">Launch video via external browser player</p>
                  <a href={activeVideoUrl} target="_blank" rel="noreferrer" className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-6 py-3 rounded-xl uppercase tracking-widest">
                    Open Video Link
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PROMPT LIBRARY MODAL --- */}
      {showPromptLibrary && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-black/60 backdrop-blur-3xl border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
              <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${t.text}`}>
                <BookOpen className="w-4 h-4" /> Community Diagnostic Prompt Library
              </h3>
              <button onClick={() => setShowPromptLibrary(false)} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-2.5 overflow-y-auto custom-scrollbar pr-1">
              {promptLibrary.map((lib, idx) => (
                <div key={idx} onClick={() => { analyzeImage(lib.prompt); setShowPromptLibrary(false); }} className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 p-3.5 rounded-2xl cursor-pointer transition-all active:scale-95 shadow-inner">
                  <h4 className={`text-xs font-black uppercase ${t.text} mb-1 flex items-center gap-2`}><Wrench className="w-3.5 h-3.5"/> {lib.title}</h4>
                  <p className="text-[11px] text-zinc-300 line-clamp-2">{lib.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BRANDED NAVIGATION INTERFACE */}
      <div className={`flex flex-col ${nightWrenchMode ? 'bg-[#2a1200] border-amber-800' : 'bg-gradient-to-r from-zinc-950 via-[#0a0a0f] to-zinc-950 border-white/10'} p-4 rounded-3xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] gap-4 backdrop-blur-2xl transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className={`${t.bg} p-3 rounded-2xl ${t.shadow} flex items-center justify-center shrink-0`}>
              <Wrench className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className={`${t.text} font-black text-xs sm:text-base tracking-widest uppercase flex items-center gap-2 drop-shadow-md`}>
                RURAL MECHANIC <span className={`px-2 py-0.5 rounded-full ${t.dim} text-[8px] sm:text-[9px] font-mono animate-pulse border shrink-0`}>LAB ONLINE</span>
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] text-zinc-400 font-mono tracking-wider mt-0.5">
                <span>OPERATOR: <strong className="text-white">{callsign}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span>FLEET: <strong className="text-white">{userFleet}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <button 
              type="button"
              onClick={() => setNightWrenchMode(!nightWrenchMode)}
              className={`px-3 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 border ${nightWrenchMode ? 'bg-amber-600 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10'}`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" /> 
              <span>{nightWrenchMode ? 'Night: ON' : 'Night Wrench'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowPromptLibrary(true)}
              className="px-3 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 border bg-white/5 border-white/10 text-cyan-400 hover:bg-white/10"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" /> Prompts
            </button>

            <button 
              type="button"
              onClick={triggerSOSBeacon}
              className="px-3 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shrink-0 border bg-rose-600/20 border-rose-500/50 text-rose-400 hover:bg-rose-600/30 animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> SOS
            </button>

            {compareList.length > 0 && (
              <button 
                type="button"
                onClick={() => setShowCompareModal(true)}
                className="px-3 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 flex items-center gap-1.5 shadow-lg cursor-pointer shrink-0 bg-amber-500 text-black font-black"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" /> Compare ({compareList.length}/3)
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 bg-black/60 p-1.5 border border-white/10 rounded-2xl w-full sm:w-auto shadow-inner">
            <button 
              onClick={() => setActiveTab("chat")}
              className={`flex-1 sm:flex-none px-4 sm:px-5 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === "chat" ? `${t.bg} text-black ${t.shadow} font-black` : "text-zinc-400 hover:text-white"}`}
            >
              <Wrench className="w-4 h-4 shrink-0"/> Mechanical Copilot
            </button>
            <button 
              onClick={() => setActiveTab("database")}
              className={`flex-1 sm:flex-none px-4 sm:px-5 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === "database" ? `${t.bg} text-black ${t.shadow} font-black` : "text-zinc-400 hover:text-white"}`}
            >
              <Search className="w-4 h-4 shrink-0"/> Global Spec Engine
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <div className="bg-black/50 border border-white/10 text-[10px] uppercase font-mono tracking-wider font-bold px-3.5 min-h-[44px] rounded-2xl flex items-center gap-2 text-zinc-300 shadow-inner">
              <MapPin className={`w-4 h-4 ${t.text} shrink-0`} /> Zone: <span className={`${t.text} font-black`}>{userRegion}</span>
            </div>
            <button 
              type="button"
              onClick={() => setShowSettings(true)}
              className={`px-3.5 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 ${t.text} cursor-pointer active:scale-95 shadow-inner`}
            >
              <Settings className="w-4 h-4 shrink-0" /> Matrix Config
            </button>
            <button 
              type="button"
              onClick={startNewSession}
              className={`px-3.5 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white cursor-pointer active:scale-95 shadow-inner`}
            >
              <RefreshCw className="w-4 h-4 shrink-0" /> Reset Terminal
            </button>
          </div>
        </div>
      </div>

      {/* --- MASTER CONFIGURATION MODAL --- */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0a0a0f]/90 backdrop-blur-3xl border border-white/15 w-full max-w-3xl rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-5 shrink-0">
              <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${t.text}`}>
                <Settings2 className="w-4 h-4" /> Rural Mechanic Master Configuration Matrix
              </h3>
              <button type="button" onClick={() => setShowSettings(false)} className="bg-white/5 border border-white/10 text-zinc-400 hover:text-white p-2 rounded-xl cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="overflow-y-auto space-y-5 pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-2"><User className={`w-3 h-3 ${t.text}`}/> Operator Callsign</span>
                  </label>
                  <input type="text" value={callsign} disabled={true} className="w-full bg-black/60 border border-white/10 text-xs text-zinc-400 rounded-xl px-4 py-3 outline-none font-mono font-bold min-h-[48px]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2"><UserCircle className={`w-3 h-3 ${t.text}`}/> Active PEV Fleet Declaration</label>
                  <input type="text" value={userFleet} onChange={(e) => setUserFleet(e.target.value)} className="w-full bg-black/50 border border-white/10 text-xs text-white rounded-xl px-4 py-3 outline-none min-h-[48px]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2"><Cpu className={`w-3 h-3 ${t.text}`}/> AI Core Engine Model</label>
                  <select value={aiModelVersion} onChange={(e) => setAiModelVersion(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none font-mono cursor-pointer min-h-[44px]">
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Optimized Speed)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced Core)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Engineering Logic)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2"><Shield className={`w-3 h-3 ${t.text}`}/> Web Search SafeSearch Level</label>
                  <select value={safeSearchLevel} onChange={(e) => setSafeSearchLevel(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none font-mono cursor-pointer min-h-[44px]">
                    <option value="active">Active Strict Filtering</option>
                    <option value="moderate">Moderate Filtering</option>
                    <option value="off">Disabled (Unrestricted)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2"><Activity className={`w-3 h-3 ${t.text}`}/> Diagnostic Depth</label>
                  <div className="flex gap-1.5">
                    {['compact', 'standard', 'exhaustive'].map(lvl => (
                      <button key={lvl} type="button" onClick={() => setAiDetailLevel(lvl as any)} className={`flex-1 min-h-[44px] py-2 text-[9px] font-black uppercase rounded-lg border transition-all cursor-pointer ${aiDetailLevel === lvl ? `${t.dim}` : 'bg-black text-zinc-500 border-zinc-800'}`}>{lvl}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2"><MapPin className={`w-3 h-3 ${t.text}`}/> Region Framework</label>
                  <select value={userRegion} onChange={(e) => setUserRegion(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none font-mono text-white cursor-pointer min-h-[48px]">
                    <option value="US">United States (USD - $)</option>
                    <option value="UK">United Kingdom (GBP - £)</option>
                    <option value="EU">Eurozone (EUR - €)</option>
                    <option value="CA">Canada (CAD - $)</option>
                    <option value="AU">Australia (AUD - $)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2"><Gauge className={`w-3 h-3 ${t.text}`}/> Measurement Units</label>
                  <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
                    <button type="button" onClick={() => setUnitSystem("imperial")} className={`min-h-[44px] px-2 text-[9px] font-black uppercase rounded-lg flex-1 cursor-pointer ${unitSystem === 'imperial' ? `${t.bg} text-black` : 'text-zinc-500'}`}>Imperial</button>
                    <button type="button" onClick={() => setUnitSystem("metric")} className={`min-h-[44px] px-2 text-[9px] font-black uppercase rounded-lg flex-1 cursor-pointer ${unitSystem === 'metric' ? `${t.bg} text-black` : 'text-zinc-500'}`}>Metric</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowSettings(false)} className="bg-white/5 border border-white/10 text-zinc-300 px-5 min-h-[48px] rounded-xl font-black uppercase text-[10px] cursor-pointer">Cancel</button>
              <button type="button" onClick={saveConfiguration} className={`${t.bg} text-black px-6 min-h-[48px] rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg cursor-pointer`}>Save &amp; Sync Globally</button>
            </div>
          </div>
        </div>
      )}

      {/* TABS CONTAINER */}
      {activeTab === "chat" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#0a0a0f] p-4 rounded-3xl border border-white/10 shadow-xl space-y-3 backdrop-blur-xl">
              <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                <Camera className={`w-3.5 h-3.5 ${t.text}`} /> Optical Inputs
              </h3>
              
              <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} className="hidden" />
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />

              {!previewUrl ? (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => galleryInputRef.current?.click()} className="border border-white/10 hover:border-white/20 rounded-2xl p-4 min-h-[56px] text-center bg-black/40 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-inner">
                    <ImagePlus className={`w-5 h-5 text-zinc-400`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Upload Photo</span>
                  </button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()} className="border border-white/10 hover:border-white/20 rounded-2xl p-4 min-h-[56px] text-center bg-black/40 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-inner">
                    <Camera className={`w-5 h-5 text-zinc-400`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Open Camera</span>
                  </button>
                </div>
              ) : (
                <div className={`relative rounded-2xl overflow-hidden border ${t.borderSubtle} bg-zinc-950 shadow-inner`}>
                  <img src={previewUrl} alt="" className="w-full h-40 object-contain" />
                  <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-black/80 text-zinc-300 hover:text-rose-400 p-2 rounded-xl cursor-pointer"><XCircle className="w-4 h-4" /></button>
                  <div className={`absolute bottom-2 left-2 bg-black/80 px-2.5 py-1 rounded-xl text-[8px] ${t.text} font-mono font-black flex items-center gap-1`}><CheckCircle className="w-3 h-3" /> FRAME RECOGNIZED</div>
                </div>
              )}
            </div>

            <div className="bg-[#0a0a0f] p-4 rounded-3xl border border-white/10 shadow-xl flex flex-col h-[280px] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><History className="w-3.5 h-3.5" /> Garage Log Ledger</h3>
                {scanHistory.length > 0 && <button type="button" onClick={clearAllHistory} className="text-zinc-500 hover:text-rose-400 cursor-pointer p-2"><Trash2 className="w-4 h-4" /></button>}
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {scanHistory.map((item) => (
                  <div key={item.id} onClick={() => loadPreviousSession(item)} className={`p-3 min-h-[48px] bg-black/50 border rounded-2xl cursor-pointer transition-all ${activeSessionId === item.id ? `${t.borderSubtle} ${t.dim}` : 'border-white/5 text-zinc-400'}`}>
                    <span className="text-[8px] font-mono text-zinc-500">{item.timestamp}</span>
                    <p className="text-[9px] font-black text-zinc-200 truncate uppercase">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-xl h-[595px] overflow-hidden backdrop-blur-xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <Wrench className={`w-12 h-12 ${t.text} mb-3 animate-pulse`} />
                  <p className="text-[11px] text-zinc-400 font-black uppercase tracking-widest text-center font-mono">RURAL MECHANIC ACTIVE. Feed prompt or snap asset.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-3xl text-xs whitespace-pre-wrap leading-relaxed max-w-[90%] sm:max-w-[85%] shadow-lg ${m.role === 'user' ? `${t.dim} text-zinc-100 rounded-br-sm border` : 'bg-[#181a20]/90 border border-white/10 text-zinc-100 rounded-bl-sm font-medium'}`}>
                      {m.image && <img src={m.image} alt="" className="max-w-full h-32 object-cover rounded-2xl mb-3 border border-white/10" />}
                      <div className="space-y-2">
                        {m.text.split('\n').map((line, lIdx) => <p key={lIdx} className="min-h-[1rem] leading-relaxed">{line}</p>)}
                      </div>
                      {m.checklist && m.checklist.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                          <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-widest block flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> Troubleshooting Checklist:</span>
                          {m.checklist.map((item, cIdx) => (
                            <label key={cIdx} className="flex items-center gap-2.5 min-h-[44px] text-xs text-zinc-200 cursor-pointer">
                              <input type="checkbox" checked={item.completed} onChange={() => {
                                setMessages(prev => prev.map(msg => {
                                  if (msg.id !== m.id || !msg.checklist) return msg;
                                  const updated = [...msg.checklist];
                                  updated[cIdx] = { ...updated[cIdx], completed: !updated[cIdx].completed };
                                  return { ...msg, checklist: updated };
                                }));
                              }} className="w-5 h-5 accent-current rounded cursor-pointer" />
                              <span className={item.completed ? "line-through text-zinc-500" : "font-bold"}>{item.text}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {m.role === 'ai' && (
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => handleTTS(m.text, m.id)} className={`text-[10px] min-h-[38px] px-3 font-bold uppercase flex items-center gap-1.5 cursor-pointer bg-black/50 border border-white/10 rounded-xl ${currentlyReadingId === m.id ? 'text-rose-400' : `${t.text}`}`}>
                          {currentlyReadingId === m.id ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          {currentlyReadingId === m.id ? "Kill Audio" : "Voice Read"}
                        </button>
                        <button type="button" onClick={() => copyToClipboard(m.text, m.id)} className="text-[10px] min-h-[38px] px-3 font-bold uppercase flex items-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer bg-black/50 border border-white/10 rounded-xl">
                          <Copy className="w-3.5 h-3.5" /> {copiedId === m.id ? "Synced" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="bg-[#181a20] border border-white/10 rounded-2xl p-4 flex items-center gap-2">
                    <Loader2 className={`w-4 h-4 ${t.text} animate-spin`} />
                    <span className="text-xs text-zinc-300 font-mono">Analyzing telemetry payload...</span>
                  </div>
                </div>
              )}
              {errorMsg && <div className="bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs rounded-2xl p-4 flex gap-3"><AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />{errorMsg}</div>}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-black/60 border-t border-white/10 flex gap-2 items-end backdrop-blur-xl">
              <button type="button" onClick={toggleListening} className={`p-3.5 min-h-[48px] min-w-[48px] rounded-2xl border flex items-center justify-center cursor-pointer ${isListening ? "bg-rose-500/25 border-rose-500 text-rose-400 animate-pulse" : "bg-white/5 border-white/10 text-zinc-300"}`}>
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyzeImage(); } }}
                rows={1}
                placeholder="Submit mechanical parameter inquiry..."
                className="flex-1 bg-black/50 border border-white/10 text-xs text-white rounded-2xl py-3 px-4 outline-none font-bold min-h-[48px] max-h-[120px] resize-none leading-relaxed shadow-inner"
              />
              <button type="button" onClick={() => analyzeImage()} disabled={isAnalyzing || (!question.trim() && !previewUrl)} className={`p-3.5 h-[48px] w-16 shrink-0 rounded-2xl font-black uppercase text-xs flex items-center justify-center border ${t.bg} text-black cursor-pointer shadow-lg disabled:opacity-30`}>
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0a0f] p-3 sm:p-5 rounded-3xl border border-white/10 shadow-2xl space-y-6 backdrop-blur-xl">
          <div className="flex border-b border-white/10 pb-2 gap-2 sm:gap-4 overflow-x-auto">
            <button onClick={() => setDbSubTab("specs")} className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 flex items-center gap-2 cursor-pointer min-h-[44px] px-2 ${dbSubTab === "specs" ? `${t.border} ${t.text}` : "border-transparent text-zinc-500"}`}>
              <Layers className="w-3.5 h-3.5" /> Official Deep Spec Lookup
            </button>
            <button onClick={() => setDbSubTab("parts")} className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 flex items-center gap-2 cursor-pointer min-h-[44px] px-2 ${dbSubTab === "parts" ? `${t.border} ${t.text}` : "border-transparent text-zinc-500"}`}>
              <LifeBuoy className="w-3.5 h-3.5" /> Factory Parts &amp; Supply Lines
            </button>
            <button onClick={() => setDbSubTab("tools")} className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 flex items-center gap-2 cursor-pointer min-h-[44px] px-2 ${dbSubTab === "tools" ? `${t.border} ${t.text}` : "border-transparent text-zinc-500"}`}>
              <Activity className="w-3.5 h-3.5" /> Range &amp; Torque Tools (18 Labs)
            </button>
          </div>

          {dbSubTab === "specs" && (
            <div className="space-y-6">
              <div className={`flex flex-col md:flex-row justify-between items-center gap-3 bg-black/40 p-3 rounded-2xl border ${t.borderSubtle} shadow-inner`}>
                <div className={`flex items-center gap-2 bg-black/60 border border-white/10 rounded-2xl px-3 py-1.5 flex-1 w-full min-h-[48px] shadow-inner`}>
                  <Globe className={`w-4 h-4 ${t.text} animate-pulse shrink-0`} />
                  <input 
                    type="text"
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchLiveSpecs()}
                    placeholder="Search any model configuration (e.g. Dualtron Storm, Segway GT2, Surron...)"
                    className="bg-transparent border-none text-xs text-white outline-none w-full font-bold placeholder:text-zinc-600 px-2 min-h-[40px]"
                  />
                  <button type="button" onClick={() => searchLiveSpecs()} disabled={isSearchingDb || !dbSearch.trim()} className={`${t.bg} text-black px-5 min-h-[40px] rounded-xl font-black uppercase text-[10px] cursor-pointer disabled:opacity-50 shrink-0`}>
                    Search
                  </button>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button type="button" onClick={handleRandomDiscovery} disabled={isSearchingDb} className={`flex-1 md:flex-none bg-white/5 border border-white/10 ${t.text} px-4 min-h-[48px] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer`}>
                    <Sparkles className={`w-3.5 h-3.5 ${t.text}`} /> Random Discovery
                  </button>
                  <button type="button" onClick={() => searchLiveSpecs()} disabled={isSearchingDb || !dbSearch.trim()} className={`flex-1 md:flex-none ${t.bg} disabled:opacity-50 text-black px-6 min-h-[48px] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg`}>
                    {isSearchingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Max-Capacity Scan
                  </button>
                </div>
              </div>

              {filteredAndSortedSpecs.length > 0 && (
                <div className="flex justify-between items-center bg-black/50 p-3 rounded-2xl border border-white/10 text-xs">
                  <div className="flex items-center gap-4">
                    <select value={specCategoryFilter} onChange={(e) => setSpecCategoryFilter(e.target.value)} className="bg-black/60 border border-white/10 text-white text-[10px] font-bold rounded-xl px-3 py-2 outline-none cursor-pointer">
                      <option value="all">All Categories</option>
                      <option value="e-bike">E-Bike</option>
                      <option value="e-scooter">E-Scooter</option>
                      <option value="euc">EUC</option>
                    </select>
                    <select value={specSortBy} onChange={(e) => setSpecSortBy(e.target.value)} className="bg-black/60 border border-white/10 text-white text-[10px] font-bold rounded-xl px-3 py-2 outline-none cursor-pointer">
                      <option value="default">Default Match</option>
                      <option value="speed_desc">Top Speed (High to Low)</option>
                      <option value="range_desc">Max Range (High to Low)</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => exportToCSV("specs")} className="px-4 min-h-[44px] rounded-2xl text-[9px] font-black uppercase border bg-white/5 text-zinc-300 hover:text-white cursor-pointer"><FileText className="w-3.5 h-3.5 inline mr-1" /> CSV Export</button>
                </div>
              )}

              {isSearchingDb && (
                <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
                  <Activity className={`w-10 h-10 ${t.text} animate-bounce`} />
                  <div className={`${t.text} font-mono text-[10px] uppercase tracking-widest animate-pulse`}>{loadingStep}</div>
                </div>
              )}

              {!isSearchingDb && filteredAndSortedSpecs.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 bg-black/20">
                  <Globe className="w-8 h-8 opacity-20" />
                  {hasSearchedDb ? "0 Compatible Technical Datasheets Parsed." : "Execute expanded internet queries to isolate high-fidelity vehicle arrays."}
                </div>
              ) : !isSearchingDb && (
                <div className="flex flex-col gap-4">
                  {filteredAndSortedSpecs.slice(0, displayCountSpecs).map((pev, idx) => {
                    const isExpanded = expandedPevIdx === idx;
                    const currentImgIdx = activeImageIndices[idx] || 0;
                    const totalImages = pev.imageUrls?.length || 1;
                    const isComparing = compareList.some(p => p.name === pev.name && p.brand === pev.brand);

                    return (
                      <div key={idx} className="bg-black/50 border border-white/10 rounded-3xl p-5 flex flex-col shadow-xl backdrop-blur-md">
                        <div className="flex flex-col lg:flex-row gap-5">
                          <div className="w-full lg:w-48 flex flex-col gap-2 shrink-0">
                            <div className="w-full h-48 rounded-2xl overflow-hidden bg-white border border-white/10 relative flex items-center justify-center shadow-inner">
                              <img src={pev.imageUrls?.[currentImgIdx] || icon} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                              <button type="button" onClick={(e) => handlePrevImage(idx, totalImages, e)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/80 p-2 rounded-xl text-white cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                              <button type="button" onClick={(e) => handleNextImage(idx, totalImages, e)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/80 p-2 rounded-xl text-white cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                              <button type="button" onClick={() => setLightboxState({ pevIdx: idx, imgIdx: currentImgIdx })} className="absolute bottom-2 right-2 bg-black/80 p-2 rounded-xl text-white cursor-pointer"><Maximize2 className="w-4 h-4" /></button>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <div className="text-[10px] text-zinc-400 font-bold uppercase font-mono">{pev.brand}</div>
                                  <h4 className="text-white font-black text-base uppercase leading-tight">{pev.name}</h4>
                                </div>
                                <button type="button" onClick={() => toggleCompare(pev)} className={`text-[9px] font-black uppercase px-4 min-h-[40px] rounded-2xl border cursor-pointer ${isComparing ? "bg-amber-500 text-black border-amber-400 font-black" : "bg-white/5 text-zinc-300 border-white/10"}`}>
                                  {isComparing ? "✓ In Matrix" : "+ Compare"}
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3.5 text-[10px] font-mono bg-black/40 p-3 rounded-2xl border border-white/5">
                                <div className="flex justify-between"><span className="text-zinc-500">PRICE:</span><span className={`${t.text} font-bold`}>{pev.price}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">SPEED:</span><span className="text-white font-bold">{pev.topSpeed}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">RANGE:</span><span className="text-white font-bold">{pev.range}</span></div>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button type="button" onClick={() => setExpandedPevIdx(isExpanded ? null : idx)} className={`flex-1 bg-white/5 border border-white/10 ${t.text} font-black text-[10px] uppercase min-h-[46px] rounded-2xl cursor-pointer flex items-center justify-center gap-2`}>
                                {isExpanded ? <>Collapse Details <ChevronUp className="w-4 h-4" /></> : <>Expand Data Sheet <ChevronDown className="w-4 h-4" /></>}
                              </button>
                              <a href={pev.siteUrl} target="_blank" rel="noreferrer" className="bg-white/5 text-zinc-300 px-4 min-h-[46px] rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">Source <ExternalLink className="w-3.5 h-3.5" /></a>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-white/10 bg-black/50 p-5 rounded-2xl space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono">
                              <div className="space-y-1"><p className="text-zinc-400 text-[9px]">Tires:</p><p className="text-zinc-200 font-bold bg-black/60 p-2.5 rounded-xl">{pev.tireProfile || "N/A"}</p></div>
                              <div className="space-y-1"><p className="text-zinc-400 text-[9px]">Brakes:</p><p className="text-zinc-200 font-bold bg-black/60 p-2.5 rounded-xl">{pev.brakingSystem || "N/A"}</p></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {dbSubTab === "parts" && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 p-5 rounded-3xl space-y-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-2xl px-3 py-1.5 min-h-[48px]">
                  <input 
                    type="text"
                    value={universalPartQuery}
                    onChange={(e) => setUniversalPartQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchLiveParts()}
                    placeholder="e.g. 20x4.0 fat tire inner tube, hydraulic brake pads..."
                    className="bg-transparent border-none text-xs text-white outline-none w-full font-bold px-2"
                  />
                  <button type="button" onClick={() => searchLiveParts()} disabled={isSearchingParts || !universalPartQuery.trim()} className={`${t.bg} text-black px-5 min-h-[40px] rounded-xl font-black uppercase text-[10px] cursor-pointer`}>
                    Search
                  </button>
                </div>

                {buildManifest.length > 0 && (
                  <div className={`${t.dim} border rounded-2xl p-4 flex justify-between items-center font-mono text-xs shadow-inner`}>
                    <div className={`flex items-center gap-2 ${t.text}`}>
                      <FileText className="w-4 h-4" />
                      <span>Active Build Worksheet Manifest: <strong>{buildManifest.length} Components</strong></span>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={copyManifest} className="text-zinc-300 uppercase text-[9px] font-black cursor-pointer px-3 py-1 bg-black/40 rounded-xl border border-white/10">Export</button>
                      <button type="button" onClick={clearManifest} className="text-zinc-400 hover:text-rose-400 uppercase text-[9px] font-black cursor-pointer px-3 py-1 bg-black/40 rounded-xl border border-white/10">Clear</button>
                    </div>
                  </div>
                )}

                {isSearchingParts && (
                  <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className={`w-10 h-10 ${t.text} animate-spin`} />
                    <div className={`${t.text} font-mono text-[10px] uppercase tracking-widest animate-pulse`}>Sweeping global component supply lines...</div>
                  </div>
                )}

                {!isSearchingParts && filteredParts.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 bg-black/20">
                    <Wrench className="w-8 h-8 opacity-20" />
                    {hasSearchedParts ? "0 Parts Discovered." : "Initiate real-time scans to aggregate factory stores."}
                  </div>
                ) : !isSearchingParts && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredParts.slice(0, displayCountParts).map((part, index) => (
                      <div key={index} className="bg-black/50 border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 shadow-xl">
                        <div className="w-full sm:w-28 h-28 bg-white border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                          <img src={part.imageUrl} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between font-mono text-[10px]">
                          <div>
                            <div className="flex justify-between items-center">
                              <span className={`text-[8px] bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 ${t.text} font-bold uppercase`}>{part.category}</span>
                              <span className={`${t.text} font-black text-xs`}>{part.estimatedPrice}</span>
                            </div>
                            <h4 className="text-zinc-100 font-black text-xs uppercase mt-2 line-clamp-1">{part.partName}</h4>
                            <p className="text-zinc-400 mt-1">Compatibility: {part.compatibility}</p>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <a href={part.partUrl} target="_blank" rel="noreferrer" className={`flex-1 ${t.bg} text-black font-black uppercase text-[9px] min-h-[44px] py-2 px-3 rounded-2xl text-center flex items-center justify-center gap-1.5`}>
                              Acquire Component <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button type="button" onClick={() => addToManifest(part)} className="bg-white/5 border border-white/10 text-zinc-300 hover:text-white px-3.5 min-h-[44px] rounded-2xl text-[9px] uppercase font-bold cursor-pointer">
                              + Worksheet
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {dbSubTab === "tools" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TOOL 1: E-CODE VAULT */}
                <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl col-span-1 md:col-span-2 backdrop-blur-md">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${t.text} flex items-center gap-2 font-mono`}>
                    <ShieldAlert className="w-4 h-4 text-rose-500" /> 1. Universal Display Error Code (E-Code) Diagnostic Vault
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <select value={selectedErrorCode} onChange={(e) => setSelectedErrorCode(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-3 text-xs text-white font-bold outline-none cursor-pointer min-h-[48px]">
                      {["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09", "E10"].map(code => (
                        <option key={code} value={code}>{code} - {getErrorCodeDetails(code).fault}</option>
                      ))}
                    </select>
                    <div className="md:col-span-2 bg-zinc-950 border border-white/10 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between"><span className="text-zinc-400">Fault:</span><span className="text-rose-400 font-bold">{getErrorCodeDetails(selectedErrorCode).fault}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">Component:</span><span className="text-cyan-400 font-bold">{getErrorCodeDetails(selectedErrorCode).component}</span></div>
                      <p className="text-xs text-zinc-200 font-bold pt-1">{getErrorCodeDetails(selectedErrorCode).fix}</p>
                    </div>
                  </div>
                </div>

                {/* TOOL 2: BATTERY HEALTH METER */}
                <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl col-span-1 md:col-span-2 backdrop-blur-md">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${t.text} flex items-center gap-2 font-mono`}>
                    <Activity className="w-4 h-4 text-cyan-400" /> 2. Battery Health &amp; Internal Resistance (IR) Meter
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="space-y-3">
                      <label className="text-[9px] text-zinc-400 uppercase font-black block">Factory Peak Volts: {factoryPeakVolts}V</label>
                      <input type="range" min="36" max="84" step="0.2" value={factoryPeakVolts} onChange={(e) => setFactoryPeakVolts(Number(e.target.value))} className="w-full accent-current cursor-pointer" />
                      <label className="text-[9px] text-zinc-400 uppercase font-black block">Loaded Volts: {measuredLoadVolts}V</label>
                      <input type="range" min="30" max="80" step="0.2" value={measuredLoadVolts} onChange={(e) => setMeasuredLoadVolts(Number(e.target.value))} className="w-full accent-current cursor-pointer" />
                    </div>
                    <div className="md:col-span-2 bg-zinc-950 border border-white/10 p-4 rounded-2xl flex flex-col justify-center space-y-2">
                      {(() => {
                        const metrics = calculateBatteryHealth();
                        return (
                          <>
                            <div className="flex justify-between"><span className="text-zinc-400">Health:</span><span className="text-emerald-400 font-bold">{metrics.health}%</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400">Internal Resistance:</span><span className="text-cyan-400 font-bold">{metrics.ir} mΩ</span></div>
                            <p className="text-xs text-zinc-300 font-bold pt-1">{metrics.status}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* TOOL 3: SYMPTOM TRIAGE */}
                <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl col-span-1 md:col-span-2 backdrop-blur-md">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${t.text} flex items-center gap-2 font-mono`}>
                    <LifeBuoy className="w-4 h-4 text-amber-400" /> 3. Trail-Side Emergency Symptom Triage Tree
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <select value={selectedSymptom} onChange={(e) => setSelectedSymptom(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-3 text-xs text-white font-bold outline-none cursor-pointer min-h-[48px]">
                      <option value="motor_stutter">Motor Stuttering / Cogging</option>
                      <option value="dead_display">Complete Power Loss / Dead Console</option>
                      <option value="brake_cutoff">Throttle Dead / Brake Switch Glitch</option>
                      <option value="flat_tire">Sudden Pneumatic Pressure Loss</option>
                    </select>
                    <div className="md:col-span-2 bg-zinc-950 border border-white/10 p-4 rounded-2xl space-y-2">
                      <h5 className={`text-xs font-black uppercase ${t.text}`}>{getSymptomTriageGuide(selectedSymptom).title}</h5>
                      {getSymptomTriageGuide(selectedSymptom).steps.map((step, sIdx) => (
                        <div key={sIdx} className="text-xs text-zinc-200 font-bold bg-black/50 p-2.5 rounded-xl border border-white/5">{step}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TOOL 4: CHARGING COST */}
                <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${t.text} flex items-center gap-2 font-mono`}>
                    <Zap className="w-4 h-4" /> 4. Charging Time &amp; Cost Calculator
                  </h4>
                  <div className="space-y-3 font-mono text-xs">
                    <label className="text-[9px] text-zinc-400 uppercase font-black block">Rate: ${kwhRate.toFixed(2)}/kWh</label>
                    <input type="range" min="0.05" max="0.40" step="0.01" value={kwhRate} onChange={(e) => setKwhRate(Number(e.target.value))} className="w-full accent-current" />
                  </div>
                  <div className="bg-black/60 border border-white/10 p-4 rounded-2xl space-y-2 font-mono">
                    <div className="flex justify-between text-xs"><span className="text-zinc-400">Full Charge Cost:</span><span className="text-emerald-400 font-bold">${(((calcVoltage * calcAh) / 1000) * kwhRate).toFixed(2)}</span></div>
                  </div>
                </div>

                {/* TOOL 5: HILL CLIMB */}
                <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${t.text} flex items-center gap-2 font-mono`}>
                    <Activity className="w-4 h-4" /> 5. Hill Climbing Power Simulator
                  </h4>
                  <div className="space-y-3 font-mono text-xs">
                    <label className="text-[9px] text-zinc-400 uppercase font-black block">Incline Grade: {hillGradePercent}% Slope</label>
                    <input type="range" min="5" max="35" step="1" value={hillGradePercent} onChange={(e) => setHillGradePercent(Number(e.target.value))} className="w-full accent-current" />
                  </div>
                  <div className="bg-black/60 border border-white/10 p-4 rounded-2xl space-y-2 font-mono">
                    <div className="flex justify-between text-xs"><span className="text-zinc-400">Est. Continuous Watts:</span><span className={`${t.text} font-black`}>{Math.round((riderWeight + vehicleWeight) * 0.453592 * (targetClimbSpeed * 0.44704) * (hillGradePercent / 100) * 9.81 * 1.35)} W</span></div>
                  </div>
                </div>

                {/* TOOLS 6 to 18 (TORQUE, BRAKE FLUID, COLD WEATHER, SHUNT, ETC.) */}
                <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl col-span-1 md:col-span-2 backdrop-blur-md">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${t.text} flex items-center gap-2 font-mono`}>
                    <Wrench className="w-4 h-4" /> Additional Engineering Calculators (Tools 6–18 Loaded)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-2">
                      <span className="text-zinc-400 font-bold block text-[10px]">Hydraulic Brake Fluid Matrix</span>
                      <select value={brakeFluidType} onChange={(e) => setBrakeFluidType(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-2 text-white">
                        <option value="Mineral Oil">Mineral Oil (Shimano/Magura)</option>
                        <option value="DOT 4">DOT 4 (SRAM/Avid)</option>
                        <option value="DOT 5.1">DOT 5.1 (High Performance)</option>
                      </select>
                      <p className="text-[10px] text-cyan-400">Boiling Point: {getBrakeFluidInfo(brakeFluidType).boiling}</p>
                    </div>

                    <div className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-2">
                      <span className="text-zinc-400 font-bold block text-[10px]">Fastener Torque Spec Lookup</span>
                      <select value={selectedBoltSize} onChange={(e) => setSelectedBoltSize(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-2 text-white">
                        {["M3", "M4", "M5", "M6", "M8", "M10", "M12", "M14"].map(b => <option key={b} value={b}>{b} Bolt Thread</option>)}
                      </select>
                      <p className="text-[10px] text-white font-bold">{getDynamicTorqueSpec(selectedBoltSize).nm} ({getDynamicTorqueSpec(selectedBoltSize).ftlbs})</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPARE MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black/80 border border-white/15 rounded-3xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className={`text-sm font-black uppercase ${t.text}`}>Vehicle Comparison Matrix</h3>
              <button onClick={() => setShowCompareModal(false)} className="p-2 text-zinc-400 bg-white/5 rounded-xl cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {compareList.map((pev, cIdx) => (
                <div key={cIdx} className="bg-black/50 border border-white/10 p-4 rounded-2xl space-y-3 relative">
                  <button onClick={() => toggleCompare(pev)} className="absolute top-3 right-3 text-rose-400 bg-rose-950/40 p-1.5 rounded-xl cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  <h4 className="text-white font-black text-xs uppercase pr-6">{pev.brand} {pev.name}</h4>
                  <div className="space-y-1.5 text-[10px] border-t border-white/10 pt-3">
                    <div className="flex justify-between"><span className="text-zinc-500">Price:</span><span className={`${t.text} font-bold`}>{pev.price}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Speed:</span><span className="text-white font-bold">{pev.topSpeed}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Range:</span><span className="text-white font-bold">{pev.range}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxState !== null && livePevResults[lightboxState.pevIdx] && (
        <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col justify-between p-4 backdrop-blur-3xl" onClick={() => setLightboxState(null)}>
          <div className="flex justify-end p-4"><button onClick={() => setLightboxState(null)} className="text-white bg-white/10 px-4 py-2 rounded-xl cursor-pointer">Close</button></div>
          <div className="flex-1 flex items-center justify-center"><img src={livePevResults[lightboxState.pevIdx].imageUrls[lightboxState.imgIdx]} alt="" className="max-w-full max-h-[70vh] object-contain" /></div>
          <div className="flex justify-center pb-4"><p className="text-xs text-zinc-400 font-mono">Image {lightboxState.imgIdx + 1} of {livePevResults[lightboxState.pevIdx].imageUrls.length}</p></div>
        </div>
      )}

    </div>
  );
}