"use client";

import React, { useState, useEffect, useRef } from "react";
import { PEVType, SavedRide } from "../types";
import { 
  Award, Trash2, Gauge, Timer, Activity, AlertTriangle, CheckSquare, 
  Compass, Mountain, Crosshair, MapPin, Sun, Cloud, CloudRain, 
  Snowflake, Zap, Thermometer, Wind, Droplets, PenTool, ShieldCheck, Fuel,
  Settings2, DollarSign, Leaf, Search, Battery, Truck,
  Sunrise, Sunset, Map as MapIcon, PhoneCall, ZapOff, Clock, Newspaper, ChevronRight,
  AlertOctagon, Loader2, CalendarDays, Filter, BarChart3, Youtube, TrendingUp, TrendingDown, PlayCircle, Square, Eye, EyeOff, Palette, Globe,
  Play, Pause, Volume2, Music, Radio, Shuffle, Repeat, Repeat1, X, ListMusic, ListPlus, Sliders, RefreshCw, Weight, Tv, Disc, ChevronDown, ChevronUp, PieChart, FastForward, Sparkles, Car, CloudFog, Volume1, BookOpen, Save, Wrench, ShieldAlert, Waves,
  User, Radar, BrainCircuit, CircleGauge, Navigation, ShieldAlert as ShieldAlertIcon
} from "lucide-react";
import { locationService } from "../services/LocationService";
import RiderMap from "./RiderMap";
import { motion, AnimatePresence } from "framer-motion";
import { getNewsApiKey, getYouTubeApiKey } from "../services/CoPilotService";

// --- UNIVERSAL HARDWARE PRESETS ---
const VOLTAGE_PRESETS = [36, 48, 52, 60, 72, 84];
const CAPACITY_PRESETS = [10, 14, 18, 20, 25, 30, 40, 50];
const WATTAGE_PRESETS = [250, 500, 750, 1000, 1200, 1500, 3000, 5000];
const AMP_PRESETS = [15, 20, 25, 30, 35, 45, 50, 60];
const NEWS_CATEGORIES = ["Micro-Mobility", "E-Bikes", "Electric Scooters", "Battery Technology", "PEV Legislation", "Tech & Gadgets"];

// 🔥 EXPANDED RIDE MIX PRESETS (30 TARGET CHANNELS) 🔥
const YT_GENRES = [
  { label: "🎹 Classical Piano", query: "Classical Piano Solo Performance" },
  { label: "🫁 Theatre Organ", query: "Traditional Theatre Organ Music Console" },
  { label: "🪗 Polka Mix", query: "Traditional Polka Accordion Mix" },
  { label: "🛳️ Maritime History", query: "Historic Ocean Liners Documentary" },
  { label: "🎣 Bass Fishing", query: "Catch and Release Lake Fishing Real Worms" },
  { label: "💻 Classical Music", query: "Classical Music" },
  { label: "😂 Movie Soundtracks", query: "Movie soundtracks" },
  { label: "🚀 Johann Strauss Walzers", query: "Johann Strauss" },
  { label: "🎬 Accordion Music", query: "Accordion music" },
  { label: "🥩 Philharmonics", query: "Philharmonics" },
  { label: "🎬 Epic Soundtracks", query: "Epic Movie Soundtracks Cinematic Orchestra" },
  { label: "🤠 Classic Country", query: "Classic Country Music" },
  { label: "🔥 Heavy Metal", query: "Heavy Metal" },
  { label: "📻 90s Hip Hop", query: "90s Hip Hop Instrumentals Bass Boosted" },
  { label: "🎸 Acoustic Fingerstyle", query: "Acoustic Guitar Fingerstyle Instrumental" },
  { label: "🔊 Phonk Ride", query: "Phonk Riding Drift Music" },
  { label: "🌆 Synthwave", query: "Retro Synthwave Outrun Cyberpunk" },
  { label: "☕ Lo-Fi Beats", query: "Lo-Fi Beats Chill Study Ride" },
  { label: "🤖 Cyberpunk 2077", query: "Cyberpunk 2077 Radio Soundtrack Mix" },
  { label: "⚡ 80s Synthpop", query: "80s Synthpop Electronic Highway Hits" },
  { label: "🎧 Bass Boosted EDM", query: "EDM Festival Bass Boosted Car Riding Mix" },
  { label: "🧠 Deep Focus", query: "Ambient Electronic Brain Focus Flow" },
  { label: "🎸 Rock Classics", query: "70s 80s Classic Hard Rock Riding Anthems" },
  { label: "🎙️ Tech Podcasts", query: "Technology Gadgets Podcast Full Episode" },
  { label: "👾 Epic Gaming OST", query: "Video Game Epic Boss Battle Music" },
  { label: "🌴 Vaporwave", query: "Vaporwave Aesthetic Chill Mix" },
];

type ThemeColor = 'rural' | 'cyan' | 'emerald' | 'amber' | 'rose';

const I18N: Record<string, Record<string, string>> = {
  en: {
    start_run: "START LIVE GPS RUN", end_run: "END RECORDING", speed: "SPEED", time: "TIME",
    alt: "ALTITUDE", heading: "HEADING", draw: "LIVE POWER DRAW", preflight: "Hardware Pre-Flight Sequencing",
    logs: "Consolidated Mission Logs", weather: "Atmospherics & Forecast", audio: "YouTube Audio Grid",
    news: "Global News Matrix", impact: "Rider Impact Data", maintenance: "Predictive Maintenance",
    battery: "Pack Charge", range: "Calculated Range", flight_time: "Est. Flight Time", peak: "Peak Output",
    eff: "Efficiency", dist: "Distance", duration: "Duration", save: "Cost Savings", config: "Telemetry Matrix Configuration",
    search: "Search mix, video, or track...", play: "Play Now", queue: "Queue", clear: "Wipe Queue",
    avg_speed: "AVG SPEED"
  }
};

// =====================================================================
// 🔥 SURGICAL CIRCUIT BREAKERS & CARDINAL CONVERTER 🔥
// =====================================================================
const safeNum = (val: any, fallback = 0) => {
  const parsed = Number(val);
  return (isNaN(parsed) || !isFinite(parsed)) ? fallback : parsed;
};

const safePct = (val: any) => {
  const num = safeNum(val);
  return Math.max(0, Math.min(100, num));
};

const getCardinalDirection = (angle: number | null | undefined) => {
  if (angle === null || angle === undefined || isNaN(angle)) return "N/A";
  const val = Math.floor((angle / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
};

const getLocalSpeedLimit = (lat: number, lng: number, useMetric: boolean): number => {
  if (Math.abs(lat - 35.275) < 0.1 && Math.abs(lng - -95.124) < 0.1) {
    return useMetric ? 56 : 35; // Stigler, OK Sector Limit
  }
  return useMetric ? 40 : 25; // Municipal Default Limit
};

export default function UniversalTelemetry(props: any) {
  const [mounted, setMounted] = useState(false);

  const localeCode = props.locale || "en";
  const tx = (key: string, fallback?: string) => I18N[localeCode]?.[key] || I18N['en']?.[key] || fallback || key;

  // --- CORE TRACKING STATE (UNIVERSAL ONLY) ---
  const [pevType, setPevType] = useState<PEVType>(PEVType.SCOOTER);
  const [vehicleModel, setVehicleModel] = useState("Universal E-Scooter");
  const [customVehicleName, setCustomVehicleName] = useState("");
  const [terrain, setTerrain] = useState("Road");
  const [powerMode, setPowerMode] = useState("Standard");
  const [checkedSafety, setCheckedSafety] = useState(false);
  const [towingTrailer, setTowingTrailer] = useState(false);
  const [hudStyle, setHudStyle] = useState<"digital" | "analog">("digital");
  
  // --- TELEMETRY STATE ---
  const [activeUpdate, setActiveUpdate] = useState<any>({});
  const [isTracking, setIsTracking] = useState(false);
  const [savedRides, setSavedRides] = useState<any[]>([]);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [movingSeconds, setMovingSeconds] = useState(0); // 🔥 Idle / Slowdown filter tracking
  const [currentAmps, setCurrentAmps] = useState(0);
  const [logFilter, setLogFilter] = useState("ALL");
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);

  // --- ADVANCED PHYSICS TRACKING & GPS SMOOTHING ---
  const [isClimbing, setIsClimbing] = useState(false);
  const [isDescending, setIsDescending] = useState(false);
  const [brakeForceG, setBrakeForceG] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [localSpeedLimit, setLocalSpeedLimit] = useState(25);
  
  const lastAltRef = useRef<number>(0);
  const lastSpeedRef = useRef<number>(0);
  const smoothedSpeedRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const elevationGainRef = useRef<number>(0);
  const peakWattsRef = useRef<number>(0);
  const peakAmpsRef = useRef<number>(0);
  const rideStartBatteryRef = useRef<number>(100);

  // --- OMNIBUS MASTER SETTINGS & CONFIGURATION STATE ---
  const [showSettings, setShowSettings] = useState(false);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [isDayMode, setIsDayMode] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeColor>('rural');
  const [useMetric, setUseMetric] = useState<boolean>(false);
  
  // 🔥 UNIVERSAL IDENTITY & CROSS-COMPONENT CONTROL STATES 🔥
  const [callsign, setCallsign] = useState<string>("");
  const [radarRadius, setRadarRadius] = useState<number>(50);
  const [ghostMode, setGhostMode] = useState<boolean>(false);
  const [aiPersona, setAiPersona] = useState<string>("copilot");

  const [baseZone, setBaseZone] = useState<string>("");
  const [fallbackInput, setFallbackInput] = useState("");
  const [riderWeight, setRiderWeight] = useState<number>(200);
  const [regenEfficiency, setRegenEfficiency] = useState<number>(15);
  const [brakeSensitivity, setBrakeSensitivity] = useState<number>(3.5);
  const [speedGovernor, setSpeedGovernor] = useState<number>(30);
  const [enableGovernor, setEnableGovernor] = useState<boolean>(false);
  const [tireFriction, setTireFriction] = useState<string>("Street");
  const [telemetryRate, setTelemetryRate] = useState<number>(1000);

  const [tireOdoOffset, setTireOdoOffset] = useState<number>(0);
  const [brakeOdoOffset, setBrakeOdoOffset] = useState<number>(0);
  const [chainOdoOffset, setChainOdoOffset] = useState<number>(0);

  // --- BATTERY & RANGE ESTIMATOR ---
  const [batteryPercent, setBatteryPercent] = useState<number>(100);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(48);
  const [peakVoltage, setPeakVoltage] = useState<number | null>(null);
  const [batteryCapacity, setBatteryCapacity] = useState<number>(15);
  const [tirePsi, setTirePsi] = useState<number>(35);
  const [motorWattage, setMotorWattage] = useState<number>(1000);
  const [controllerAmps, setControllerAmps] = useState<number>(25);
  const [estimatedRange, setEstimatedRange] = useState<number>(0);
  const [estimatedTimeRemain, setEstimatedTimeRemain] = useState<number>(0);

  // --- WEATHER STATE ---
  const [weatherInput, setWeatherInput] = useState("");
  const [savedLocationName, setSavedLocationName] = useState("Awaiting Location...");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [rideSafetyRating, setRideSafetyRating] = useState<{text: string, color: string}>({text: "Analyzing...", color: "text-zinc-500"});
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // --- LIVE PEV NEWS STATE ---
  const [newsCategory, setNewsCategory] = useState("Micro-Mobility");
  const [newsSearchFilter, setNewsSearchFilter] = useState("");
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  // --- YOUTUBE MEDIA STATES ---
  const [ytSearchQuery, setYtSearchQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isFetchingYt, setIsFetchingYt] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytQueue, setYtQueue] = useState<{id: string, title: string, thumb: string}[]>([]);
  const [showYtSettings, setShowYtSettings] = useState(false);
  const [ytLoop, setYtLoop] = useState(false);
  const [ytVideoQuality, setYtVideoQuality] = useState("large");
  const [ytPlaybackRate, setYtPlaybackRate] = useState<number>(1);
  const [ytVolume, setYtVolume] = useState<number>(100);
  const [minimizeVideo, setMinimizeVideo] = useState(false);

  // --- UNIVERSAL IMPACT SETTINGS ---
  const [localGasPrice, setLocalGasPrice] = useState<number>(3.50);
  const [referenceMpg, setReferenceMpg] = useState<number>(25);
  const CO2_SAVED_PER_MILE_LBS = 0.89;

  // --- DYNAMIC THEME ENGINE ---
  const getTheme = () => {
    if (isNightVision) return { text: 'text-rose-600', bg: 'bg-rose-700', border: 'border-rose-900', shadow: '', dim: 'bg-rose-950/20 text-rose-500', hex: '#be123c', hover: 'group-hover:text-rose-400' };
    const baseTheme = theme;
    const themes: any = {
      rural: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14]', hex: '#39ff14', hover: 'group-hover:text-[#39ff14]' },
      cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', dim: 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50', hex: '#06b6d4', hover: 'group-hover:text-cyan-300' },
      emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', dim: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50', hex: '#10b981', hover: 'group-hover:text-emerald-300' },
      amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', dim: 'bg-amber-950/30 text-amber-400 border-amber-900/50', hex: '#f59e0b', hover: 'group-hover:text-amber-300' },
      rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', dim: 'bg-rose-950/30 text-rose-400 border-rose-900/50', hex: '#f43f5e', hover: 'group-hover:text-rose-300' }
    };
    return themes[baseTheme] || themes.rural;
  };
  const t = getTheme();

  // --- DAY MODE STYLING INJECTORS ---
  const bgBase = isDayMode ? "bg-zinc-200" : (isNightVision ? "bg-[#050000]" : "bg-[#06060a]");
  const bgPanel = isDayMode ? "bg-white border-zinc-300 shadow-md" : (isNightVision ? "bg-[#1a0000] border-rose-900" : "bg-[#0d0e15] border-zinc-900");
  const bgCard = isDayMode ? "bg-zinc-50 border-zinc-200" : "bg-black/60 border-zinc-800/80";
  const bgInput = isDayMode ? "bg-white border-zinc-300 text-zinc-900" : "bg-black border-zinc-800 text-white";
  const bgList = isDayMode ? "bg-zinc-100 border-zinc-300" : "bg-[#121318] border-zinc-800";
  const txtMain = isDayMode ? "text-zinc-900" : "text-white";
  const txtMuted = isDayMode ? "text-zinc-500" : "text-zinc-400";
  const brd = isDayMode ? "border-zinc-300" : "border-zinc-800";

  const safeRides = Array.isArray(savedRides) ? savedRides : [];

  const handleThemeChange = (newTheme: ThemeColor) => {
    setTheme(newTheme);
    setIsNightVision(false);
    setIsDayMode(false);
    window.dispatchEvent(new Event('theme-sync'));
  };

  // --- BOOT SEQUENCE ---
  useEffect(() => {
    setMounted(true);
    
    setIsNightVision(localStorage.getItem("rt_night_vision") === "true");
    setIsDayMode(localStorage.getItem("rt_day_mode") === "true");
    setTheme((localStorage.getItem("rt_theme") as ThemeColor) || 'rural');
    setUseMetric(localStorage.getItem("rt_use_metric") === "true");
    setHudStyle((localStorage.getItem("rt_hud_style") as any) || "digital");
    
    setCallsign(localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name") || "");
    setGhostMode(localStorage.getItem("radar_ghost_mode") === "true");
    setRadarRadius(parseInt(localStorage.getItem("radar_scan_radius") || "50"));
    setAiPersona(localStorage.getItem("copilot_persona") || "copilot");

    const savedBaseZone = localStorage.getItem("rt_base_zone") || "";
    setBaseZone(savedBaseZone);
    setBatteryVoltage(Number(localStorage.getItem("rural_pev_voltage")) || 48);
    
    const savedPeak = localStorage.getItem("rural_pev_peak_voltage");
    if (savedPeak) setPeakVoltage(Number(savedPeak));
    
    const savedPsi = localStorage.getItem("rural_pev_tire_psi");
    if (savedPsi) setTirePsi(Number(savedPsi));
    
    setBatteryCapacity(Number(localStorage.getItem("rural_pev_capacity")) || 15);
    setMotorWattage(Number(localStorage.getItem("rural_pev_wattage")) || 1000);
    setControllerAmps(Number(localStorage.getItem("rural_pev_amps")) || 25);
    setLocalGasPrice(Number(localStorage.getItem("pev_local_gas_price")) || 3.50);
    setReferenceMpg(Number(localStorage.getItem("pev_reference_mpg")) || 25);
    
    setRiderWeight(Number(localStorage.getItem("rt_rider_weight")) || 200);
    setRegenEfficiency(Number(localStorage.getItem("rt_regen_eff")) || 15);
    setBrakeSensitivity(Number(localStorage.getItem("rt_brake_sens")) || 3.5);
    setSpeedGovernor(Number(localStorage.getItem("rt_speed_gov")) || 30);
    setEnableGovernor(localStorage.getItem("rt_enable_gov") === "true");
    setTireFriction(localStorage.getItem("rt_tire_friction") || "Street");
    setTelemetryRate(Number(localStorage.getItem("rt_telemetry_rate")) || 1000);

    setTireOdoOffset(Number(localStorage.getItem("rt_tire_offset")) || 0);
    setBrakeOdoOffset(Number(localStorage.getItem("rt_brake_offset")) || 0);
    setChainOdoOffset(Number(localStorage.getItem("rt_chain_offset")) || 0);

    try {
      const saved = localStorage.getItem("universal_erides_rides");
      if (saved) setSavedRides(JSON.parse(saved));
    } catch(e) {
      setSavedRides([]);
    }
    
    setActiveUpdate(locationService.getCurrentUpdate() || {});

    const savedLat = localStorage.getItem("pev_weather_lat");
    const savedLng = localStorage.getItem("pev_weather_lng");
    const savedName = localStorage.getItem("pev_weather_name");
    const fbLat = localStorage.getItem("rt_fallback_lat");
    const fbLng = localStorage.getItem("rt_fallback_lng");

    if (savedLat && savedLng && savedName) {
      setSavedLocationName(savedName);
      fetchWeather(Number(savedLat), Number(savedLng));
    } else if (fbLat && fbLng && savedBaseZone) {
      setSavedLocationName(`${savedBaseZone} (Fallback)`);
      fetchWeather(Number(fbLat), Number(fbLng));
    } else {
      fetchWeather(35.2534, -95.1275);
      setSavedLocationName("Global GPS Lock");
    }
  }, []);

  // --- OMNIBUS PERSISTENCE ENGINE ---
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("rt_night_vision", isNightVision ? "true" : "false");
    localStorage.setItem("rt_day_mode", isDayMode ? "true" : "false");
    localStorage.setItem("rt_theme", theme);
    localStorage.setItem("rural_theme", theme);
    localStorage.setItem("copilot_theme", theme);
    localStorage.setItem("universal_brand_theme", theme);
    localStorage.setItem("rt_use_metric", useMetric ? "true" : "false");
    localStorage.setItem("rt_hud_style", hudStyle);
    
    if (peakVoltage) localStorage.setItem("rural_pev_peak_voltage", peakVoltage.toString());
    localStorage.setItem("rural_pev_tire_psi", tirePsi.toString());

    localStorage.setItem("rural_erides_username", callsign);
    localStorage.setItem("radar_screen_name", callsign);
    localStorage.setItem("radar_scan_radius", radarRadius.toString());
    localStorage.setItem("radar_ghost_mode", ghostMode ? "true" : "false");
    localStorage.setItem("rt_privacy_mode", ghostMode ? "true" : "false");
    localStorage.setItem("copilot_persona", aiPersona);

    localStorage.setItem("rt_base_zone", baseZone);
    localStorage.setItem("pev_local_gas_price", localGasPrice.toString());
    localStorage.setItem("pev_reference_mpg", referenceMpg.toString());
    localStorage.setItem("rt_rider_weight", riderWeight.toString());
    localStorage.setItem("rt_regen_eff", regenEfficiency.toString());
    localStorage.setItem("rt_brake_sens", brakeSensitivity.toString());
    localStorage.setItem("rt_speed_gov", speedGovernor.toString());
    localStorage.setItem("rt_enable_gov", enableGovernor ? "true" : "false");
    localStorage.setItem("rt_tire_friction", tireFriction);
    localStorage.setItem("rt_telemetry_rate", telemetryRate.toString());
    localStorage.setItem("radar_telemetry_interval", telemetryRate.toString());
    localStorage.setItem("rt_tire_offset", tireOdoOffset.toString());
    localStorage.setItem("rt_brake_offset", brakeOdoOffset.toString());
    localStorage.setItem("rt_chain_offset", chainOdoOffset.toString());
  }, [mounted, isNightVision, isDayMode, theme, useMetric, callsign, radarRadius, ghostMode, aiPersona, baseZone, localGasPrice, referenceMpg, riderWeight, regenEfficiency, brakeSensitivity, speedGovernor, enableGovernor, tireFriction, telemetryRate, tireOdoOffset, brakeOdoOffset, chainOdoOffset, hudStyle, peakVoltage, tirePsi]);

  // --- TELEMETRY ENGINE WITH PHYSICS & IDLE/SLOWDOWN FILTERING ---
  useEffect(() => {
    if (!mounted) return;

    const handleLocationUpdate = (update: any) => {
        if (!update) return;
        setActiveUpdate(update);
        
        if (update.lat && update.lng) {
          setLocalSpeedLimit(getLocalSpeedLimit(update.lat, update.lng, useMetric));
        }

        const rawSpeed = safeNum(update.speed);
        let smoothed = 0;
        
        if (rawSpeed < 1.0) {
            smoothed = 0;
        } else {
            const speedDiff = Math.abs(rawSpeed - safeNum(smoothedSpeedRef.current));
            const alpha = speedDiff > 3 ? 0.6 : 0.25; 
            smoothed = (rawSpeed * alpha) + (safeNum(smoothedSpeedRef.current) * (1 - alpha));
        }
        
        smoothedSpeedRef.current = smoothed;
        setDisplaySpeed(smoothed);

        let currentlyClimbing = false;
        let currentlyDescending = false;
        
        if (isTracking) {
          if (smoothed > maxSpeed) setMaxSpeed(smoothed);

          const currentAlt = update.altitude || 0;
          const altDiff = currentAlt - lastAltRef.current;
          
          if (lastAltRef.current > 0) {
             if (altDiff > 1.5) {
                currentlyClimbing = true;
                elevationGainRef.current += altDiff;
             } else if (altDiff < -1.5) {
                currentlyDescending = true;
             }
          }
          lastAltRef.current = currentAlt;
          setIsClimbing(currentlyClimbing);
          setIsDescending(currentlyDescending);

          const now = Date.now();
          const timeDelta = (now - lastTimeRef.current) / 1000;
          if (timeDelta > 0 && timeDelta < 5) {
             const speedDelta = smoothed - lastSpeedRef.current;
             const accel = speedDelta / timeDelta; 
             if (accel < -Number(brakeSensitivity)) { 
                setBrakeForceG(Math.abs(accel)); 
             } else {
                setBrakeForceG(0);
             }
          }
          lastSpeedRef.current = smoothed;
          lastTimeRef.current = now;
        }
        
        let baseDraw = smoothed > 0 ? (smoothed * 1.5) : 0;
        const weightFactor = riderWeight / 200;
        baseDraw *= weightFactor;

        if (powerMode === "Sport") baseDraw *= 1.4;
        if (powerMode === "Eco") baseDraw *= 0.7;
        if (currentlyClimbing) baseDraw *= 1.6; 
        if (currentlyDescending) baseDraw *= (1 - (regenEfficiency / 100));
        if (tireFriction === "Off-Road/Knobby") baseDraw *= 1.15;
        if (towingTrailer) baseDraw *= 1.45;

        // 🔥 Slowdown / Idle check: If speed is near zero or decelerating/idling, draw drops to minimal standby current (~2A)
        const activeAmps = smoothed < 1.0 ? 2.0 : Math.min(Math.max(baseDraw + (Math.random() * 2), 0), controllerAmps);
        setCurrentAmps(activeAmps);

        if (isTracking) {
          const effectiveVoltage = peakVoltage || batteryVoltage;
          const watts = activeAmps * effectiveVoltage;
          if (watts > peakWattsRef.current) peakWattsRef.current = watts;
          if (activeAmps > peakAmpsRef.current) peakAmpsRef.current = activeAmps;
        }
    };
    
    locationService.addListener(handleLocationUpdate);
    return () => locationService.removeListener(handleLocationUpdate);
  }, [mounted, isTracking, maxSpeed, powerMode, controllerAmps, batteryVoltage, peakVoltage, riderWeight, regenEfficiency, brakeSensitivity, tireFriction, towingTrailer, useMetric]);

  useEffect(() => {
    let timer: any;
    if (isTracking) {
      timer = setInterval(() => {
        setElapsedSeconds(s => s + (telemetryRate / 1000));
        // 🔥 Track moving seconds separately when speed >= 1.0 to prevent idle drain inflation
        if (displaySpeed >= 1.0) {
          setMovingSeconds(m => m + (telemetryRate / 1000));
        }
      }, telemetryRate);
    } else { 
      setElapsedSeconds(0); 
      setMovingSeconds(0);
      setCurrentAmps(0); 
      setIsClimbing(false);
      setIsDescending(false);
      setBrakeForceG(0);
      elevationGainRef.current = 0;
      peakWattsRef.current = 0;
      peakAmpsRef.current = 0;
      setDisplaySpeed(0);
      smoothedSpeedRef.current = 0;
    }
    return () => clearInterval(timer);
  }, [isTracking, telemetryRate, displaySpeed]);

  // --- DYNAMIC LIVE NEWS API ENGINE ---
  const fetchPEVNews = async () => {
    setIsLoadingNews(true);
    try {
      let q = '"electric scooter" OR ebike OR "e-bike" OR "electric unicycle"';
      if (newsCategory === "E-Bikes") q = 'ebike OR "e-bike" OR "electric bicycle"';
      if (newsCategory === "Electric Scooters") q = '"electric scooter"';
      if (newsCategory === "Battery Technology") q = '"solid state battery" OR "lithium ion" OR "battery tech"';
      if (newsCategory === "PEV Legislation") q = '"electric scooter" OR ebike laws legislation ban regulation';
      if (newsCategory === "Tech & Gadgets") q = 'technology OR gadgets OR "smart watch" OR samsung';

      const newsKey = getNewsApiKey();
      const url = `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&language=en&pageSize=15&apiKey=${newsKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.articles) setLiveNews(data.articles.filter((article: any) => article.title && article.title !== "[Removed]"));
    } catch (err) { console.error(err); } finally { setIsLoadingNews(false); }
  };

  useEffect(() => { fetchPEVNews(); }, [newsCategory]);

  const filteredNews = liveNews.filter(n => n.title.toLowerCase().includes(newsSearchFilter.toLowerCase()));

  // --- ENERGY CALCULATOR (USING MOVING TIME & EFFECTIVE PEAK VOLTAGE) ---
  useEffect(() => {
    let whPerMile = 20; 
    
    if (vehicleModel.includes("Scooter") || vehicleModel.includes("Skateboard")) whPerMile = 25;
    if (vehicleModel.includes("Unicycle") || vehicleModel.includes("Onewheel")) whPerMile = 22;
    if (vehicleModel.includes("Moped") || vehicleModel.includes("Dirt Bike")) whPerMile = 35;
    if (vehicleModel.includes("Trike")) whPerMile = 32;
    
    whPerMile *= (riderWeight / 200);

    if (powerMode === "Eco") whPerMile *= 0.85;   
    if (powerMode === "Sport") whPerMile *= 1.35;  
    if (terrain === "Trail") whPerMile *= 1.15;    
    if (tireFriction === "Off-Road/Knobby") whPerMile *= 1.15;
    if (isClimbing) whPerMile *= 1.6;
    if (isDescending) whPerMile *= (1 - (regenEfficiency / 150));
    if (towingTrailer) whPerMile *= 1.45;

    const effectiveVoltage = peakVoltage || batteryVoltage;
    const totalWattHours = effectiveVoltage * batteryCapacity;
    const absoluteMaxRange = totalWattHours / whPerMile;
    const calculatedMiles = (batteryPercent / 100) * absoluteMaxRange;
    
    setEstimatedRange(calculatedMiles);
    setEstimatedTimeRemain((calculatedMiles / 16) * 60); 
  }, [batteryPercent, batteryVoltage, peakVoltage, batteryCapacity, powerMode, terrain, vehicleModel, motorWattage, isClimbing, isDescending, riderWeight, regenEfficiency, tireFriction, towingTrailer]);

  // --- 🔥 75-RESULT YOUTUBE MULTI-PAGE FETCH ENGINE 🔥 ---
  const handleYoutubeSearch = async (queryToSearch?: string) => {
    const finalQuery = typeof queryToSearch === 'string' ? queryToSearch : ytSearchQuery;
    if (!finalQuery.trim()) return;
    
    setYtSearchQuery(finalQuery);
    setIsFetchingYt(true);
    setYtError(null);
    
    try {
      const ytKey = getYouTubeApiKey();
      const url1 = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${encodeURIComponent(finalQuery)}&type=video&key=${ytKey}`;
      const res1 = await fetch(url1);
      const data1 = await res1.json();
      
      let combinedItems = data1.items || [];
      
      if (data1.nextPageToken) {
        const url2 = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&pageToken=${data1.nextPageToken}&q=${encodeURIComponent(finalQuery)}&type=video&key=${ytKey}`;
        const res2 = await fetch(url2);
        const data2 = await res2.json();
        if (data2.items) {
          combinedItems = [...combinedItems, ...data2.items];
        }
      }
      
      setYtResults(combinedItems);
    } catch (err) { 
      setYtError("Network or API core link exception.");
    } finally { 
      setIsFetchingYt(false); 
    }
  };

  const handleShuffleQueue = () => {
    if (ytQueue.length <= 1) return;
    const currentTrack = ytQueue[0];
    const rest = [...ytQueue.slice(1)];
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    setYtQueue([currentTrack, ...rest]);
  };

  const handleNextTrack = () => {
    if (ytQueue.length > 1) {
      setYtQueue(prev => prev.slice(1));
    } else if (ytQueue.length === 1 && ytLoop) {
      setYtQueue([{...ytQueue[0]}]);
    } else {
      setYtQueue([]);
    }
  };

  const handleClearQueue = () => {
    if (window.confirm("Purge the entire audio queue?")) {
      setYtQueue([]);
    }
  };

  const handleLoadDeck = (track: {id: string, title: string, thumb: string}) => {
    setYtQueue([track]);
  };

  const handleAddToQueue = (track: {id: string, title: string, thumb: string}) => {
    setYtQueue(prev => [...prev, track]);
  };

  const manuallySetFallback = async () => {
    if (!fallbackInput.trim()) {
      setBaseZone("");
      localStorage.removeItem("rt_base_zone");
      localStorage.removeItem("rt_fallback_lat");
      localStorage.removeItem("rt_fallback_lng");
      alert("Fallback zone cleared.");
      return;
    }
    setIsFetchingWeather(true);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(fallbackInput)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) throw new Error("Not found");
      const loc = geoData.results[0];
      const displayName = `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}`;
      
      setBaseZone(displayName);
      localStorage.setItem("rt_base_zone", displayName);
      localStorage.setItem("rt_fallback_lat", loc.latitude.toString());
      localStorage.setItem("rt_fallback_lng", loc.longitude.toString());
      
      setSavedLocationName(`${displayName} (Fallback)`);
      fetchWeather(loc.latitude, loc.longitude);
      setFallbackInput("");
    } catch (error) {
      alert("Could not locate that zone. Please try another city.");
      setIsFetchingWeather(false);
    }
  };

  const handleLocationSearch = async () => {
    const query = weatherInput.trim() || baseZone.trim();
    if (!query) return;
    setIsFetchingWeather(true);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) throw new Error("Not found");
      const loc = geoData.results[0];
      const displayName = `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}`;
      setSavedLocationName(displayName);
      localStorage.setItem("pev_weather_lat", loc.latitude.toString());
      localStorage.setItem("pev_weather_lng", loc.longitude.toString());
      localStorage.setItem("pev_weather_name", displayName);
      fetchWeather(loc.latitude, loc.longitude);
    } catch (error) {
      alert("Location not found.");
      setIsFetchingWeather(false);
    }
  };

  // 🔥 12 COMPREHENSIVE ATMOSPHERIC WEATHER FEATURES 🔥
  const fetchWeather = async (lat: number, lng: number) => {
    setIsFetchingWeather(true);
    try {
      const tempP = useMetric ? 'celsius' : 'fahrenheit';
      const windP = useMetric ? 'kmh' : 'mph';
      const precipP = useMetric ? 'mm' : 'inch';
      
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,uv_index,visibility,wind_direction_10m,cloud_cover,surface_pressure,soil_temperature_0cm,direct_radiation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max&temperature_unit=${tempP}&wind_speed_unit=${windP}&precipitation_unit=${precipP}&timezone=auto&forecast_days=10`;
      const res = await fetch(url);
      const data = await res.json();
      setWeatherData(data);

      if (data.current) {
         const wind = data.current.wind_gusts_10m || data.current.wind_speed_10m;
         const precip = data.current.precipitation;
         const temp = data.current.temperature_2m;
         
         const windThreshold = useMetric ? 32 : 20; 
         const dangerWind = useMetric ? 48 : 30;
         const freezeTemp = useMetric ? 2 : 35;

         if (precip > 0 || wind >= dangerWind || temp <= freezeTemp) {
            setRideSafetyRating({ text: "DANGER: Extreme Elements", color: "text-rose-500" });
         } else if (wind >= windThreshold || temp > (useMetric ? 35 : 95)) {
            setRideSafetyRating({ text: "CAUTION: Heavy Resistance Vector", color: "text-amber-500" });
         } else {
            setRideSafetyRating({ text: "OPTIMAL: Clear Skies", color: "text-[#39ff14]" });
         }
      }
    } catch (err) { console.error(err); } finally { setIsFetchingWeather(false); }
  };

  const formatTimeFromIso = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(localeCode, { hour: 'numeric', minute: '2-digit' });
    } catch(e) {
      return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
  };

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun className="text-yellow-400 w-5 h-5" />;
    if (code <= 3) return <Cloud className="text-zinc-400 w-5 h-5" />;
    if (code <= 67) return <CloudRain className="text-cyan-400 w-5 h-5" />;
    if (code <= 82) return <Snowflake className="text-cyan-200 w-5 h-5" />;
    return <Zap className={`${t.text} w-5 h-5`} />;
  };

  // --- 🔥 SOS DISPATCH WITH NATIVE RECIPIENT SELECTION 🔥 ---
  const handleSOSDispatch = () => {
    const lat = activeUpdate?.lat || "UNKNOWN";
    const lng = activeUpdate?.lng || "UNKNOWN";
    const speed = useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) + ' km/h' : (displaySpeed || 0).toFixed(1) + ' mph';
    const link = `https://maps.google.com/?q=${lat},${lng}`;
    
    const msg = `🚨 EMERGENCY SOS 🚨\nPilot ${callsign || "Unknown"} requires immediate assistance.\n\n📍 Location: ${link}\n🧭 Heading: ${getCardinalDirection(activeUpdate?.heading)}\n💨 Speed: ${speed}\n🛴 Hardware: ${vehicleModel}\n🔋 Battery Remaining: ${safePct(batteryPercent).toFixed(1)}%\n⏱️ Time: ${new Date().toLocaleTimeString(localeCode)}`;
    
    window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
  };

  // --- 🔥 RIDE LOG GENERATOR & ANALYTICS ENGINE (USING MOVING TIME) 🔥 ---
  const startTracking = () => {
    locationService.start(pevType as PEVType); 
    setIsTracking(true); 
    setMaxSpeed(0);
    rideStartBatteryRef.current = batteryPercent;
  };

  const stopTracking = () => {
    locationService.stop();
    setIsTracking(false);
    
    const finalDistance = activeUpdate?.distance || 0;
    const hours = movingSeconds > 0 ? movingSeconds / 3600 : 0.001;
    const avg = finalDistance / hours;
    
    const effectiveVoltage = peakVoltage || batteryVoltage;
    const totalWh = effectiveVoltage * batteryCapacity;
    let baselineEfficiency = 20; 
    if (vehicleModel.includes("Scooter") || vehicleModel.includes("Skateboard")) baselineEfficiency = 25;
    if (vehicleModel.includes("Moped")) baselineEfficiency = 32;
    if (vehicleModel.includes("Trike")) baselineEfficiency = 30;
    if (powerMode === "Eco") baselineEfficiency *= 0.85;
    if (powerMode === "Sport") baselineEfficiency *= 1.35;
    if (terrain === "Trail") baselineEfficiency *= 1.2;
    if (tireFriction === "Off-Road/Knobby") baselineEfficiency *= 1.15;
    if (towingTrailer) baselineEfficiency *= 1.45;
    
    const speedFactor = Math.max(1.0, (avg / 15) ** 1.5);
    let actualWhPerMile = baselineEfficiency * speedFactor;
    if (elevationGainRef.current > 100) actualWhPerMile *= 1.3; 
    
    const tripWhConsumed = actualWhPerMile * finalDistance;
    const batteryPercentUsed = (tripWhConsumed / totalWh) * 100;
    const endingBatt = Math.max(0, batteryPercent - batteryPercentUsed);
    const savings = (finalDistance / referenceMpg) * localGasPrice;

    const rideScore = actualWhPerMile < 20 ? 'S+' : actualWhPerMile < 25 ? 'S' : actualWhPerMile < 30 ? 'A' : actualWhPerMile < 35 ? 'B' : 'C';

    const autoTags = [];
    if (actualWhPerMile < 22) autoTags.push("Eco-Miler");
    if (actualWhPerMile > 35) autoTags.push("High Drain");
    if (maxSpeed >= 20) autoTags.push("Speed Run");
    if (elevationGainRef.current > 100) autoTags.push("Mountain Climb");
    if (terrain === "Trail") autoTags.push("Off-Road");
    if (towingTrailer) autoTags.push("Towing Payload");

    const newRide: any = { 
        id: Date.now().toString(), 
        date: new Date().toLocaleString(localeCode), 
        duration: elapsedSeconds, 
        movingDuration: movingSeconds,
        distance: finalDistance, 
        maxSpeed, 
        avgSpeed: avg, 
        pevType,
        vehicleModel: customVehicleName || vehicleModel, 
        terrain, 
        powerMode,
        totalWhConsumed: tripWhConsumed,
        efficiencyWhPerMile: actualWhPerMile,
        elevationGain: elevationGainRef.current,
        peakWatts: peakWattsRef.current,
        peakAmps: peakAmpsRef.current,
        weatherCondition: weatherData?.current ? `${Math.round(weatherData.current.temperature_2m)}°, Hum: ${Math.round(weatherData.current.relative_humidity_2m)}%` : "Offline",
        co2SavedLbs: finalDistance * CO2_SAVED_PER_MILE_LBS,
        financialSavings: savings,
        startingBattery: rideStartBatteryRef.current,
        endingBattery: Number(endingBatt.toFixed(1)),
        rideScore,
        tags: autoTags,
        rideNote: "" 
    };
    
    setBatteryPercent(Number(endingBatt.toFixed(1)));
    setSavedRides(prev => {
        const updated = [newRide, ...(Array.isArray(prev) ? prev : [])];
        localStorage.setItem("universal_erides_rides", JSON.stringify(updated));
        return updated;
    });
  };

  const updateRideNote = (id: string, newNote: string) => {
    setSavedRides(prev => {
      const updated = prev.map(ride => ride.id === id ? { ...ride, rideNote: newNote } : ride);
      localStorage.setItem("universal_erides_rides", JSON.stringify(updated));
      return updated;
    });
  };

  const totalMiles = safeRides.reduce((acc, curr) => acc + safeNum(curr?.distance), 0);
  const lifetimeTopSpeed = safeRides.reduce((max, ride) => Math.max(max, safeNum(ride?.maxSpeed)), 0);
  const lifetimeSeconds = safeRides.reduce((acc, curr) => acc + safeNum(curr?.duration), 0);

  const speedLabel = useMetric ? "KM/H" : "MPH";
  const distLabel = useMetric ? "KM" : "MI";
  const altLabel = useMetric ? "M" : "FT";

  const activeTirePressureMil = Math.max(0, Math.round(totalMiles - tireOdoOffset));
  const activeBrakePadMil = Math.max(0, Math.round(totalMiles - brakeOdoOffset));
  const activeChainOdoMil = Math.max(0, Math.round(totalMiles - chainOdoOffset));

  if (!mounted) {
    return <div className="h-screen w-full bg-[#06060a] flex items-center justify-center text-[#39ff14] font-black tracking-widest uppercase text-xs animate-pulse">Initializing Telemetry Matrix...</div>;
  }

  return (
    <div className={`space-y-6 p-2 sm:p-4 pb-32 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar ${bgBase}`}>
      
      {/* --- TOP CONSOLE HEADER --- */}
      <div className={`flex justify-between items-center ${bgList} rounded-2xl p-2.5 shadow-xl`}>
        <div className={`text-[10px] sm:text-xs font-mono font-black uppercase ${txtMuted} tracking-wider flex items-center gap-1.5 px-1`}>
           <Activity className={`w-3.5 h-3.5 ${t.text}`} /> V6.5.0 UNIVERSAL CORE
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className={`min-h-[44px] px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${showSettings ? `${t.bg} text-black ${t.border}` : `${bgCard} ${t.text} ${t.border} shadow-lg`}`}
        >
          <Settings2 className="w-4 h-4"/> {tx('config')}
        </button>
      </div>

      {/* --- FULL RESTORED OMNIBUS CONFIGURATION PANEL --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`p-4 sm:p-5 rounded-3xl border shadow-2xl space-y-5 ${bgPanel}`}>
            <div className={`flex items-center justify-between border-b ${brd} pb-3`}>
              <h3 className={`${t.text} font-black uppercase tracking-widest text-xs flex items-center gap-2`}><Globe className="w-4 h-4"/> {tx('config')} MASTER OVERRIDE</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className={`${bgCard} p-4 rounded-xl border ${brd} col-span-1 md:col-span-2 lg:col-span-3`}>
                <div className="flex flex-col space-y-1 mb-3">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><MapPin className="w-3.5 h-3.5"/> Manual GPS Fallback Zone</span>
                  <span className={`text-[8px] ${txtMuted} font-mono uppercase`}>Manually set a global override city if hardware satellite lock is degraded.</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={fallbackInput} onChange={(e) => setFallbackInput(e.target.value)} placeholder="e.g. London, UK or Stigler, OK" className={`flex-1 min-h-[44px] ${bgInput} rounded-lg px-3 text-xs font-bold outline-none focus:${t.border}`}/>
                  <button onClick={manuallySetFallback} className={`min-h-[44px] px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${t.bg} text-black ${t.shadow}`}>Lock Base</button>
                </div>
                {baseZone && <div className={`mt-3 text-[9px] font-mono ${txtMuted} uppercase flex items-center gap-1.5`}>Active Fallback Lock: <span className={`${t.text} font-black`}>{baseZone}</span></div>}
              </div>

              {/* IDENTITY SYNC OVERLAY */}
              <div className={`${bgCard} p-4 rounded-xl border ${brd} col-span-1 md:col-span-2 lg:col-span-3 flex flex-col gap-2`}>
                <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><User className="w-3.5 h-3.5"/> Global Pilot Identity (Callsign)</span>
                <input type="text" value={callsign} onChange={e => setCallsign(e.target.value)} placeholder="e.g. Lord Bradley Callison" className={`w-full min-h-[44px] ${bgInput} rounded-lg px-3 text-xs font-bold outline-none focus:${t.border}`}/>
                <span className={`text-[8px] ${txtMuted} uppercase`}>Syncs your handle uniformly to Rider Radar & the Community Board.</span>
              </div>

              {/* GHOST MODE MASTER OVERRIDE */}
              <div className={`${bgCard} p-4 rounded-xl border ${brd} flex justify-between items-center`}>
                <div className="flex flex-col space-y-0.5 pr-2">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><EyeOff className="w-3.5 h-3.5"/> Global Ghost Mode</span>
                  <span className={`text-[8px] ${txtMuted} uppercase`}>Hides telemetry from Radar & Board</span>
                </div>
                <button onClick={() => setGhostMode(!ghostMode)} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors ${ghostMode ? "bg-rose-600" : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${ghostMode ? "translate-x-7" : "translate-x-1"}`}/></button>
              </div>

              {/* RADAR SWEEP RADIUS */}
              <div className={`${bgCard} p-4 rounded-xl border ${brd}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Radar className="w-3.5 h-3.5"/> Radar Sweep Radius: {radarRadius} {useMetric ? 'KM' : 'MI'}</span>
                </div>
                <input type="range" min="5" max="250" step="5" value={radarRadius} onChange={e => setRadarRadius(Number(e.target.value))} className={`w-full h-8 ${theme === 'rural' && !isNightVision && !isDayMode ? 'accent-[#39ff14]' : 'accent-current'}`} />
              </div>

              {/* AI PERSONA CONFIG */}
              <div className={`${bgCard} p-4 rounded-xl border ${brd} flex flex-col justify-center gap-2`}>
                <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><BrainCircuit className="w-3.5 h-3.5"/> AI Co-Pilot Persona</span>
                <select value={aiPersona} onChange={(e) => setAiPersona(e.target.value)} className={`w-full ${bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer`}>
                  <option value="copilot">Standard Co-Pilot</option>
                  <option value="mechanic">Master Mechanic</option>
                  <option value="legal">Legal Analyst</option>
                </select>
              </div>

              {/* SUN VISIBILITY / DAY MODE TOGGLE */}
              <div className={`${bgCard} p-4 rounded-xl border ${brd} flex justify-between items-center`}>
                <div className="flex flex-col space-y-0.5 pr-2">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Sun className="w-3.5 h-3.5"/> Sun Visibility Mode</span>
                  <span className={`text-[8px] ${txtMuted} uppercase`}>High-Contrast Anti-Glare Interface</span>
                </div>
                <button onClick={() => { setIsDayMode(!isDayMode); if(!isDayMode) setIsNightVision(false); }} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors ${isDayMode ? "bg-amber-500" : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${isDayMode ? "translate-x-7" : "translate-x-1"}`}/></button>
              </div>

              {/* NIGHT VISION MODE TOGGLE */}
              <div className={`${bgCard} p-4 rounded-xl border ${brd} flex justify-between items-center`}>
                <div className="flex flex-col space-y-0.5 pr-2">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><EyeOff className="w-3.5 h-3.5"/> Night Vision Mode</span>
                </div>
                <button onClick={() => { setIsNightVision(!isNightVision); if(!isNightVision) setIsDayMode(false); }} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors ${isNightVision ? "bg-rose-600" : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${isNightVision ? "translate-x-7" : "translate-x-1"}`}/></button>
              </div>

              {/* INTERFACE THEME MAP */}
              <div className={`${bgCard} p-4 rounded-xl border ${brd} flex justify-between items-center`}>
                <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Palette className="w-3.5 h-3.5"/> Interface Theme</span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleThemeChange('rural')} className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[#39ff14] border-2 border-black ${theme === 'rural' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                  <button onClick={() => handleThemeChange('cyan')} className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-cyan-500 border-2 border-black ${theme === 'cyan' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                  <button onClick={() => handleThemeChange('emerald')} className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-emerald-500 border-2 border-black ${theme === 'emerald' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                  <button onClick={() => handleThemeChange('amber')} className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-amber-500 border-2 border-black ${theme === 'amber' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                  <button onClick={() => handleThemeChange('rose')} className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-rose-500 border-2 border-black ${theme === 'rose' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                </div>
              </div>

              {/* GLOBAL MEASUREMENT UNITS */}
              <div className={`${bgCard} p-4 rounded-xl border ${brd} flex justify-between items-center flex-wrap gap-2`}>
                <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Gauge className="w-3.5 h-3.5"/> Metric System Scale</span>
                <div className={`flex ${bgList} p-1 rounded-lg border ${brd} shrink-0`}>
                  <button onClick={() => setUseMetric(false)} className={`min-h-[44px] px-3 text-[9px] font-black uppercase rounded-md transition-colors ${!useMetric ? `${t.bg} text-black font-black` : txtMuted}`}>Imperial</button>
                  <button onClick={() => setUseMetric(true)} className={`min-h-[44px] px-3 text-[9px] font-black uppercase rounded-md transition-colors ${useMetric ? `${t.bg} text-black font-black` : txtMuted}`}>Metric</button>
                </div>
              </div>
              
              <div className={`${bgCard} p-4 rounded-xl border ${brd} flex justify-between items-center flex-wrap gap-2`}>
                <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Activity className="w-3.5 h-3.5"/> Telemetry Polling Rate</span>
                <select value={telemetryRate} onChange={(e) => setTelemetryRate(Number(e.target.value))} className={`${bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer w-full`}>
                  <option value="500">Fast (0.5s)</option>
                  <option value="1000">Normal (1.0s)</option>
                  <option value="2000">Slow (2.0s)</option>
                </select>
              </div>

              <div className={`${bgCard} p-4 rounded-xl border ${brd} flex justify-between items-center flex-wrap gap-2`}>
                <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Disc className="w-3.5 h-3.5"/> Tire Friction Profile</span>
                <select value={tireFriction} onChange={(e) => setTireFriction(e.target.value)} className={`${bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer w-full`}>
                  <option value="Street">Street / Slick</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Off-Road/Knobby">Off-Road / Knobby</option>
                </select>
              </div>

              <div className={`${bgCard} p-4 rounded-xl border ${brd}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Weight className="w-3.5 h-3.5"/> Payload Weight: {riderWeight} lbs</span>
                </div>
                <input type="range" min="100" max="400" step="5" value={riderWeight} onChange={e => setRiderWeight(Number(e.target.value))} className={`w-full h-8 ${theme === 'rural' && !isNightVision && !isDayMode ? 'accent-[#39ff14]' : 'accent-current'}`} />
              </div>

              <div className={`${bgCard} p-4 rounded-xl border ${brd}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Disc className="w-3.5 h-3.5"/> Regen Reclamation: {regenEfficiency}%</span>
                </div>
                <input type="range" min="0" max="40" step="1" value={regenEfficiency} onChange={e => setRegenEfficiency(Number(e.target.value))} className={`w-full h-8 ${theme === 'rural' && !isNightVision && !isDayMode ? 'accent-[#39ff14]' : 'accent-current'}`} />
              </div>

              <div className={`${bgCard} p-4 rounded-xl border ${brd}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><AlertTriangle className="w-3.5 h-3.5"/> Velocity Alert Threshold</span>
                  <button onClick={() => setEnableGovernor(!enableGovernor)} className={`min-h-[44px] px-3 text-[9px] font-black border rounded-lg uppercase ${enableGovernor ? t.dim : 'bg-black border-zinc-800 text-zinc-500'}`}>{enableGovernor ? 'ON' : 'OFF'}</button>
                </div>
                <input type="range" min="15" max="60" step="1" value={speedGovernor} disabled={!enableGovernor} onChange={e => setSpeedGovernor(Number(e.target.value))} className={`w-full h-8 ${theme === 'rural' && !isNightVision && !isDayMode ? 'accent-[#39ff14]' : 'accent-current'} disabled:opacity-20`} />
              </div>

              <div className={`${bgCard} p-4 rounded-xl border ${brd}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[9px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Activity className="w-3.5 h-3.5"/> Braking G-Sensor Sensitivity</span>
                </div>
                <input type="range" min="2.0" max="6.0" step="0.5" value={brakeSensitivity} onChange={e => setBrakeSensitivity(Number(e.target.value))} className={`w-full h-8 ${theme === 'rural' && !isNightVision && !isDayMode ? 'accent-[#39ff14]' : 'accent-current'}`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- UNIVERSAL PRE-FLIGHT HARDWARE ARRAY --- */}
      {!isTracking && (
          <div className={`space-y-4 relative z-10 border p-4 sm:p-6 rounded-3xl shadow-2xl transition-colors ${bgPanel}`}>
              <div className={`flex items-center justify-between border-b ${brd} pb-3`}>
                <span className={`text-[12px] ${t.text} font-black uppercase tracking-widest flex items-center gap-2`}><ShieldCheck className="w-4 h-4"/> {tx('preflight')}</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`border ${brd} ${bgList} rounded-xl flex items-center px-3 transition-colors shadow-inner focus-within:${t.border}`}>
                      <PenTool className="w-4 h-4 text-zinc-500 shrink-0" />
                      <input 
                        type="text" value={customVehicleName} onChange={(e) => setCustomVehicleName(e.target.value)} placeholder="Custom Identifier"
                        className={`min-h-[44px] bg-transparent border-none ${txtMain} text-xs font-bold w-full outline-none placeholder:text-zinc-500`}
                      />
                    </div>
                    
                    <select value={vehicleModel} onChange={(e) => { 
                        const val = e.target.value; setVehicleModel(val); 
                        if (val.includes("Scooter") || val.includes("Skate")) setPevType(PEVType.SCOOTER); 
                        else setPevType(PEVType.EBIKE); 
                      }} 
                      className={`w-full ${txtMain} min-h-[44px] px-3 rounded-xl border ${brd} ${bgList} text-xs font-bold outline-none shadow-inner appearance-none cursor-pointer transition-colors`}
                    >
                      <optgroup label="Standard Classes" className="text-zinc-500">
                        <option value="Universal E-Scooter">Universal E-Scooter</option>
                        <option value="Universal E-Bike">Universal E-Bike</option>
                        <option value="Class 1 E-Bike">Class 1 E-Bike</option>
                        <option value="Class 2 E-Bike">Class 2 E-Bike</option>
                        <option value="Class 3 E-Bike">Class 3 E-Bike</option>
                        <option value="Electric Moped">Electric Moped</option>
                        <option value="Electric Dirt Bike">Electric Dirt Bike</option>
                      </optgroup>
                      <optgroup label="Stand-Up / Specialty Classes" className="text-zinc-500">
                        <option value="Electric Skateboard">Electric Skateboard</option>
                        <option value="Electric Unicycle (EUC)">Electric Unicycle (EUC)</option>
                        <option value="Onewheel">Onewheel</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className={`p-4 border ${brd} rounded-xl space-y-4 shadow-inner transition-colors ${bgCard}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest`}>Nominal Bus Voltage</label>
                          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                            {VOLTAGE_PRESETS.map(v => (
                              <button key={v} type="button" onClick={() => { setBatteryVoltage(v); localStorage.setItem("rural_pev_voltage", v.toString()); }} className={`px-1.5 py-0.5 shrink-0 rounded text-[8px] font-mono font-bold border ${batteryVoltage === v ? `${t.bg} text-black ${t.border}` : `${bgBase} ${brd} ${txtMuted}`}`}>{v}V</button>
                            ))}
                          </div>
                        </div>
                        <input type="number" step="0.1" value={batteryVoltage || ""} onChange={e => { const val = Number(e.target.value); setBatteryVoltage(val); localStorage.setItem("rural_pev_voltage", val.toString()); }} className={`w-full min-h-[44px] ${bgInput} rounded-xl px-3 text-xs font-bold outline-none font-mono shadow-inner transition-colors focus:${t.border}`} />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest flex items-center gap-1`}><AlertTriangle className="w-3 h-3 text-rose-500"/> Max Peak Charge (V)</label>
                        </div>
                        <input type="number" step="0.1" placeholder={`${batteryVoltage}V Target...`} value={peakVoltage || ""} onChange={e => { const val = Number(e.target.value); setPeakVoltage(val); localStorage.setItem("rural_pev_peak_voltage", val.toString()); }} className={`w-full min-h-[44px] ${bgInput} rounded-xl px-3 text-xs font-bold outline-none font-mono shadow-inner transition-colors focus:${t.border}`}/>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest`}>Capacity (Ah)</label>
                          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                            {CAPACITY_PRESETS.map(ah => (
                              <button key={ah} type="button" onClick={() => { setBatteryCapacity(ah); localStorage.setItem("rural_pev_capacity", ah.toString()); }} className={`px-1.5 py-0.5 shrink-0 rounded text-[8px] font-mono font-bold border ${batteryCapacity === ah ? `${t.bg} text-black ${t.border}` : `${bgBase} ${brd} ${txtMuted}`}`}>{ah}Ah</button>
                            ))}
                          </div>
                        </div>
                        <input type="number" step="0.1" value={batteryCapacity || ""} onChange={e => { const val = Number(e.target.value); setBatteryCapacity(val); localStorage.setItem("rural_pev_capacity", val.toString()); }} className={`w-full min-h-[44px] ${bgInput} rounded-xl px-3 text-xs font-bold outline-none font-mono shadow-inner transition-colors focus:${t.border}`}/>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest`}>Motor Power (W)</label>
                          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                            {WATTAGE_PRESETS.map(w => (
                              <button key={w} type="button" onClick={() => { setMotorWattage(w); localStorage.setItem("rural_pev_wattage", w.toString()); }} className={`px-1.5 py-0.5 shrink-0 rounded text-[8px] font-mono font-bold border ${motorWattage === w ? `${t.bg} text-black ${t.border}` : `${bgBase} ${brd} ${txtMuted}`}`}>{w}W</button>
                            ))}
                          </div>
                        </div>
                        <input type="number" step="10" value={motorWattage || ""} onChange={e => { const val = Number(e.target.value); setMotorWattage(val); localStorage.setItem("rural_pev_wattage", val.toString()); }} className={`w-full min-h-[44px] ${bgInput} rounded-xl px-3 text-xs font-bold outline-none font-mono shadow-inner transition-colors focus:${t.border}`}/>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest`}>Controller (A)</label>
                          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                            {AMP_PRESETS.map(a => (
                              <button key={a} type="button" onClick={() => { setControllerAmps(a); localStorage.setItem("rural_pev_amps", a.toString()); }} className={`px-1.5 py-0.5 shrink-0 rounded text-[8px] font-mono font-bold border ${controllerAmps === a ? `${t.bg} text-black ${t.border}` : `${bgBase} ${brd} ${txtMuted}`}`}>{a}A</button>
                            ))}
                          </div>
                        </div>
                        <input type="number" step="1" value={controllerAmps || ""} onChange={e => { const val = Number(e.target.value); setControllerAmps(val); localStorage.setItem("rural_pev_amps", val.toString()); }} className={`w-full min-h-[44px] ${bgInput} rounded-xl px-3 text-xs font-bold outline-none font-mono shadow-inner transition-colors focus:${t.border}`}/>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest`}>Cold Tire Pressure (PSI)</label>
                        </div>
                        <input type="number" step="1" value={tirePsi || ""} onChange={e => { const val = Number(e.target.value); setTirePsi(val); localStorage.setItem("rural_pev_tire_psi", val.toString()); }} className={`w-full min-h-[44px] ${bgInput} rounded-xl px-3 text-xs font-bold outline-none font-mono shadow-inner transition-colors focus:${t.border}`}/>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select value={powerMode} onChange={(e) => setPowerMode(e.target.value)} className={`${bgInput} min-h-[44px] px-3 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none shadow-inner`}>
                        <option value="Eco">🔋 Conservative Mode</option>
                        <option value="Standard">⚡ Standard Core</option>
                        <option value="Sport">🚀 Peak Output Run</option>
                    </select>
                    <select value={terrain} onChange={(e) => setTerrain(e.target.value)} className={`${bgInput} min-h-[44px] px-3 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none shadow-inner`}>
                        <option value="Road">🛣️ Paved Infrastructure</option>
                        <option value="Trail">🌲 Non-Paved Terrain</option>
                    </select>
                  </div>

                  {/* TOWING PAYLOAD TOGGLE */}
                  <div className={`${bgCard} p-4 rounded-xl border ${brd} flex justify-between items-center shadow-inner`}>
                    <div className="flex flex-col space-y-0.5 pr-2">
                      <span className={`text-[10px] ${txtMain} font-black uppercase tracking-widest flex items-center gap-2`}><Truck className="w-4 h-4 text-amber-500"/> Towing Trailer Payload</span>
                      <span className={`text-[8px] ${txtMuted} uppercase`}>Calculates 45% added drag for range math</span>
                    </div>
                    <button onClick={() => setTowingTrailer(!towingTrailer)} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors ${towingTrailer ? "bg-amber-600" : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${towingTrailer ? "translate-x-7" : "translate-x-1"}`}/></button>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-center">
                  <div className={`border ${brd} p-5 rounded-xl shadow-inner relative overflow-hidden transition-colors ${bgCard}`}>
                     <div className="absolute top-0 right-0 p-3 opacity-5"><Battery className="w-24 h-24"/></div>
                     <div className={`flex items-center justify-between text-[10px] font-black uppercase tracking-widest ${txtMuted} mb-4`}>
                        <span className="flex items-center gap-1.5"><Battery className={`w-3.5 h-3.5 ${t.text}`}/> {tx('battery')}: {safePct(batteryPercent)}%</span>
                        <span className={`font-mono text-[9px] ${bgList} border ${brd} px-2 py-1 rounded`}>{safeNum((peakVoltage || batteryVoltage) * batteryCapacity).toFixed(0)} Wh Total</span>
                     </div>
                     <input type="range" min="1" max="100" value={safePct(batteryPercent)} onChange={e => setBatteryPercent(Number(e.target.value))} className={`w-full h-4 rounded-lg cursor-pointer relative z-10 ${theme === 'rural' && !isNightVision && !isDayMode ? 'accent-[#39ff14] bg-zinc-800' : (isDayMode ? 'accent-zinc-900 bg-zinc-300' : 'accent-current bg-zinc-800')}`} />
                     
                     <div className={`grid grid-cols-2 gap-4 mt-5 pt-4 border-t ${brd}`}>
                       <div>
                         <div className={`text-[8px] ${txtMuted} font-bold uppercase tracking-widest mb-1`}>{tx('range')}</div>
                         <div className={`${t.text} font-mono font-black text-lg`}>{useMetric ? (estimatedRange * 1.609).toFixed(1) : estimatedRange.toFixed(1)} {distLabel}</div>
                       </div>
                       <div>
                         <div className={`text-[8px] ${txtMuted} font-bold uppercase tracking-widest mb-1`}>{tx('flight_time')}</div>
                         <div className={`${t.text} font-mono font-black flex items-center gap-1 text-lg`}><Clock className="w-4 h-4"/> {Math.floor(estimatedTimeRemain / 60)}h {Math.floor(estimatedTimeRemain % 60)}m</div>
                       </div>
                     </div>
                  </div>

                  <button onClick={() => setCheckedSafety(!checkedSafety)} className={`w-full min-h-[56px] rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${checkedSafety ? `${t.bg} text-black border-transparent shadow-[0_0_15px_currentColor]` : `${bgCard} ${txtMuted} ${brd}`}`}>
                      <CheckSquare size={16}/> Hardware Pre-Flight Protocol Confirmed
                  </button>
                </div>
              </div>
          </div>
      )}

      {/* --- PRIMARY TELEMETRY HUD (NON-OVERLAPPING SPEED LIMIT & HUD TOGGLE) --- */}
      <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden transition-colors border`}>
        <div className={`absolute top-0 right-0 w-64 h-64 ${t.bg} rounded-full blur-[120px] pointer-events-none opacity-10`}></div>

        {/* TOP HUD BAR: Speed Limit Sign & Buttons (Properly separated, zero overlap) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800 relative z-10">
           
           {/* Speed Limit Sign Badge */}
           <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-2xl shadow-inner">
              <div className="flex flex-col items-center justify-center w-12 h-14 bg-white border-2 border-black rounded shadow">
                 <span className="text-black text-[7px] font-black uppercase leading-none mt-0.5">SPEED</span>
                 <span className="text-black text-[7px] font-black uppercase leading-none">LIMIT</span>
                 <span className="text-black text-lg font-black font-mono leading-none">{localSpeedLimit}</span>
              </div>
              <div>
                 <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Zone Regulation</span>
                 <span className="text-xs font-mono font-black text-white">{localSpeedLimit} {speedLabel} Max</span>
              </div>
           </div>

           {/* HUD View & Action Controls */}
           <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button onClick={() => setHudStyle(s => s === "digital" ? "analog" : "digital")} className={`flex-1 sm:flex-none min-h-[44px] ${isDayMode ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-white'} transition-colors px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase border border-zinc-800 flex justify-center items-center gap-2 shadow-lg`}>
                  <CircleGauge size={14} className={t.text} /> HUD: {hudStyle.toUpperCase()}
              </button>
              <button onClick={() => window.open("tel:911")} className={`flex-1 sm:flex-none min-h-[44px] ${isDayMode ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-white'} transition-colors px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase border border-zinc-800 flex justify-center items-center gap-2 shadow-lg`}>
                  <PhoneCall size={14} className={t.text} /> Local Link 911
              </button>
              <button onClick={handleSOSDispatch} className="flex-1 sm:flex-none min-h-[44px] bg-rose-600 text-white hover:bg-rose-500 transition-colors px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase border border-rose-900/50 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                  <AlertTriangle size={14} className="animate-pulse" /> Emergency SOS
              </button>
           </div>
        </div>

        {/* PHYSICS WARNING HUDS */}
        <AnimatePresence>
          <div className="flex flex-col gap-2 mb-4 relative z-10">
            {isClimbing && (
              <div className="bg-amber-950/40 border border-amber-500/50 text-amber-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <TrendingUp className="w-4 h-4" /> Elevation Incline: High Electrical Load
              </div>
            )}
            {isDescending && (
              <div className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <TrendingDown className="w-4 h-4" /> Incline Reversal: Kinetic Energy Reclamation Active
              </div>
            )}
            {brakeForceG > 0 && (
              <div className="bg-rose-950/60 border border-rose-500 text-rose-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                <AlertOctagon className="w-4 h-4" /> High Inertial Deceleration Triggered: {brakeForceG.toFixed(1)}G
              </div>
            )}
            {isTracking && (displaySpeed * (useMetric ? 1.609 : 1)) > localSpeedLimit && (
              <div className="bg-red-950/40 border border-red-500/50 text-red-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="w-4 h-4 animate-pulse" /> ZONE SPEED LIMIT EXCEEDED
              </div>
            )}
          </div>
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center mb-8 relative z-10 w-full pt-4">
          <div className={`text-[12px] font-bold tracking-widest uppercase mb-[-10px] ${isDayMode ? 'text-zinc-500' : (isNightVision ? 'text-rose-900' : 'text-zinc-600')}`}>{tx('speed')} VECTOR</div>
          
          {hudStyle === "analog" ? (
             <div className="relative w-72 h-36 overflow-hidden mx-auto mt-8 mb-6">
               <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible drop-shadow-lg">
                 <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="currentColor" className="text-zinc-800" strokeWidth="8" strokeLinecap="round" />
                 <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="currentColor" className={t.text} strokeWidth="8" strokeLinecap="round" strokeDasharray="283" strokeDashoffset={283 - (283 * Math.min(useMetric ? displaySpeed * 1.609 : displaySpeed, 60) / 60)} />
                 <g transform={`rotate(${Math.min(useMetric ? displaySpeed * 1.609 : displaySpeed, 60) * (180 / 60) - 90} 100 100)`}>
                    <line x1="100" y1="100" x2="100" y2="20" stroke="currentColor" className="text-rose-500" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="100" cy="100" r="6" fill="currentColor" className="text-white" />
                 </g>
               </svg>
               <div className="absolute bottom-0 w-full text-center text-4xl font-black font-mono text-white tracking-tighter">
                 {useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) : (displaySpeed || 0).toFixed(1)}
               </div>
             </div>
          ) : (
            <div className={`text-[120px] sm:text-[160px] leading-none font-black font-mono tracking-tighter ${t.text} drop-shadow-[0_0_30px_currentColor]`}>
              {useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) : (displaySpeed || 0).toFixed(1)}
            </div>
          )}
          
          <div className={`font-black uppercase tracking-[0.5em] text-sm mt-[-5px] mb-8 ${t.text}`}>{useMetric ? 'KILOMETERS / HOUR' : 'MILES / HOUR'}</div>

          {/* LINEAR POWER GAUGE */}
          <div className={`w-full max-w-md ${bgCard} border ${brd} p-4 rounded-2xl shadow-inner mt-2`}>
             <div className={`text-[9px] font-black uppercase tracking-widest ${txtMuted} mb-2 flex items-center justify-between w-full`}>
               <span className="flex items-center gap-1.5"><ZapOff className="w-3.5 h-3.5" /> LIVE POWER DRAW</span>
               <span className={`${txtMain} font-mono text-xs font-bold`}>{safeNum(currentAmps * (peakVoltage || batteryVoltage)).toFixed(0)} W</span>
             </div>
             <div className={`w-full h-3 ${bgBase} border ${brd} rounded-full overflow-hidden shadow-inner`}>
                <div className={`h-full ${t.bg} ${t.shadow} transition-all duration-300 ease-out`} style={{ width: `${safePct((currentAmps / (controllerAmps || 1)) * 100)}%` }}></div>
             </div>
          </div>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 border-t ${brd} relative z-10`}>
            {[ 
               { icon: Timer, label: tx('time'), val: `${Math.floor(elapsedSeconds/60)}m ${Math.floor(elapsedSeconds%60)}s` },
               { icon: Gauge, label: "PEAK VELOCITY", val: useMetric ? `${(maxSpeed * 1.609).toFixed(1)} ${speedLabel}` : `${maxSpeed.toFixed(1)} ${speedLabel}` },
               { icon: Mountain, label: tx('alt'), val: useMetric ? `${((activeUpdate?.altitude || 0)/3.281).toFixed(0)} ${altLabel}` : `${(activeUpdate?.altitude || 0).toFixed(0)} ${altLabel}` },
               { icon: Compass, label: tx('heading'), val: `${getCardinalDirection(activeUpdate?.heading)} (${Math.round(activeUpdate?.heading || 0)}°)` }
            ].map((stat, i) => (
                <div key={i} className={`p-3.5 rounded-2xl border text-center shadow-inner flex flex-col justify-between transition-colors ${bgCard} ${brd}`}>
                    <stat.icon className={`mx-auto mb-2 w-4 h-4 ${t.text}`}/>
                    <div className={`text-[8px] ${txtMuted} font-black tracking-widest uppercase mb-1`}>{stat.label}</div>
                    <div className={`${txtMain} font-black text-xs sm:text-sm font-mono`}>{stat.val}</div>
                </div>
            ))}
        </div>

        <button 
          disabled={!isTracking && !checkedSafety}
          onClick={isTracking ? stopTracking : startTracking}
          className={`mt-4 w-full min-h-[64px] rounded-2xl font-black uppercase text-sm sm:text-lg tracking-widest text-black shadow-2xl transition-all relative z-10 ${!isTracking && !checkedSafety ? `opacity-40 ${bgCard} ${txtMuted} ${brd}` : (isTracking ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : `${t.bg} hover:opacity-90 ${t.shadow}`)}`}
        >
          {isTracking ? <div className="flex items-center justify-center gap-2"><Square className="w-5 h-5 fill-current" /> {tx('end_run')}</div> : <div className="flex items-center justify-center gap-2"><PlayCircle className="w-6 h-6" /> {tx('start_run')}</div>}
        </button>
      </div>

      {/* =========================================================
          🔥 EXPANDED MISSION LOGS & DETAILED RIDE RECORDS 🔥
          ========================================================= */}
      <div className={`${bgPanel} p-4 sm:p-5 rounded-3xl border shadow-xl transition-colors`}>
        <div className={`flex flex-col sm:flex-row sm:items-end justify-between mb-4 border-b ${brd} pb-4`}>
          <div>
            <h3 className={`${txtMain} font-black flex items-center gap-2 uppercase tracking-widest text-sm sm:text-base mb-1`}>
              <Award className={`w-5 h-5 ${t.text}`} /> {tx('logs')}
            </h3>
            <p className={`text-[10px] ${txtMuted} font-mono uppercase tracking-widest`}>Historical Telemetry Archives & Energy Efficiency Matrix</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 sm:mt-0">
            <div className="text-left sm:text-right">
              <div className={`text-[8px] ${txtMuted} font-black uppercase tracking-widest`}>Total Run Timeline</div>
              <div className={`${t.text} font-mono font-bold text-xs`}>{Math.floor(lifetimeSeconds / 3600)}h {Math.floor((lifetimeSeconds % 3600) / 60)}m</div>
            </div>
            <div className={`text-left sm:text-right border-l ${brd} pl-4`}>
              <div className={`text-[8px] ${txtMuted} font-black uppercase tracking-widest`}>Lifetime Max Speed</div>
              <div className={`${t.text} font-mono font-bold text-xs`}>{useMetric ? (lifetimeTopSpeed * 1.609).toFixed(1) : lifetimeTopSpeed.toFixed(1)} {speedLabel}</div>
            </div>
          </div>
        </div>

        {/* LOG FILTERS */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto custom-scrollbar pb-1">
            <Filter className={`w-4 h-4 ${txtMuted} shrink-0 mt-3`} />
            <button onClick={() => setLogFilter("ALL")} className={`min-h-[44px] px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${logFilter === 'ALL' ? `${t.bg} text-black` : `${bgCard} ${brd} border ${txtMuted}`}`}>All Matrix runs</button>
            <button onClick={() => setLogFilter("SPEED")} className={`min-h-[44px] px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${logFilter === 'SPEED' ? `${t.bg} text-black` : `${bgCard} ${brd} border ${txtMuted}`}`}>Speed Runs</button>
            <button onClick={() => setLogFilter("LONG")} className={`min-h-[44px] px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${logFilter === 'LONG' ? `${t.bg} text-black` : `${bgCard} ${brd} border ${txtMuted}`}`}>Long Radius</button>
        </div>

        {safeRides.length === 0 ? (
          <div className={`text-center py-10 ${bgCard} border border-dashed ${brd} rounded-2xl`}>
             <MapIcon className={`w-8 h-8 ${txtMuted} mx-auto mb-3`} />
             <div className={`${txtMuted} font-mono text-xs uppercase font-bold tracking-widest`}>No active run profiles compiled in storage.</div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
            {safeRides.filter(ride => {
              if (logFilter === "ALL") return true;
              if (logFilter === "SPEED" && safeNum(ride?.maxSpeed) >= 20) return true;
              if (logFilter === "LONG" && safeNum(ride?.distance) >= 5) return true;
              return true;
            }).map((ride, index) => (
              <div key={ride.id || index} className={`${bgBase} rounded-2xl border ${brd} flex flex-col gap-4 shadow-inner overflow-hidden group hover:border-zinc-500 transition-colors`}>
                 
                 {/* Card Header Summary */}
                 <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center border-b border-transparent gap-4 cursor-pointer" onClick={() => setExpandedRideId(expandedRideId === ride.id ? null : ride.id)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-xl border-2 ${
                          ride.rideScore === 'S+' ? 'bg-purple-950/40 border-purple-500 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' :
                          ride.rideScore === 'S' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                          ride.rideScore === 'A' ? 'bg-[#39ff14]/10 border-[#39ff14]/50 text-[#39ff14]' :
                          'bg-amber-950/40 border-amber-500/50 text-amber-500'
                      }`}>
                         {ride.rideScore || 'A'}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`${txtMain} font-black text-lg sm:text-xl`}>{useMetric ? (safeNum(ride.distance) * 1.609).toFixed(2) : safeNum(ride.distance).toFixed(2)} <span className={`text-[10px] ${txtMuted} ml-0.5`}>{distLabel}</span></span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border rounded ${t.dim}`}>{ride.powerMode || "N/A"}</span>
                        </div>
                        <div className={`${txtMuted} font-bold text-[10px] uppercase tracking-wide flex flex-wrap gap-2 items-center`}>
                          <span className={txtMain}>{ride.vehicleModel || "Unknown PEV"}</span>
                          <span>•</span>
                          <span>{ride.date}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3"/> {Math.floor(safeNum(ride.duration)/60)}m {Math.floor(safeNum(ride.duration)%60)}s</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex items-center justify-between sm:justify-start gap-4 sm:border-l ${brd} sm:pl-6 pt-2 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0`}>
                       <div className="text-left sm:text-right">
                         <div className={`text-[8px] sm:text-[9px] ${txtMuted} font-black uppercase tracking-widest`}>Top Speed</div>
                         <div className={`${txtMain} font-mono font-bold text-sm`}>{useMetric ? (safeNum(ride.maxSpeed) * 1.609).toFixed(1) : safeNum(ride.maxSpeed).toFixed(1)} {speedLabel}</div>
                       </div>
                       {expandedRideId === ride.id ? <ChevronUp className={txtMuted}/> : <ChevronDown className={txtMuted}/>}
                       <button onClick={(e) => { 
                         e.stopPropagation(); 
                         const newRides = safeRides.filter(r => r.id !== ride.id);
                         setSavedRides(newRides); 
                         localStorage.setItem("universal_erides_rides", JSON.stringify(newRides)); 
                       }} className={`min-h-[44px] min-w-[44px] flex items-center justify-center ${bgList} ${txtMuted} border ${brd} rounded-xl hover:bg-rose-950 hover:text-rose-500 hover:border-rose-900/50 transition-colors`}>
                         <Trash2 size={16}/>
                       </button>
                    </div>
                 </div>

                 {/* DETAILED DRILL-DOWN ANALYTICS */}
                 {expandedRideId === ride.id && (
                   <div className={`border-t ${brd} ${bgCard} p-4 sm:p-5 space-y-4`}>
                     
                     {/* Tags Array */}
                     {Array.isArray(ride.tags) && ride.tags.length > 0 && (
                       <div className="flex flex-wrap gap-2">
                         {ride.tags.map((tag: string, i: number) => (
                           <span key={`${ride.id}-tag-${i}`} className={`text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded ${bgBase} border ${t.border} ${t.text}`}>#{tag}</span>
                         ))}
                       </div>
                     )}

                     {/* 6 Metric Telemetry Grid */}
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className={`${bgList} p-3 rounded-xl border ${brd} text-center shadow-inner flex flex-col justify-center`}>
                          <div className={`text-[8px] ${txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Gauge className="w-3 h-3 text-cyan-500"/> {tx('avg_speed')}</div>
                          <div className={`text-sm font-mono font-black ${txtMain}`}>{useMetric ? (safeNum(ride.avgSpeed) * 1.609).toFixed(1) : safeNum(ride.avgSpeed).toFixed(1)} {speedLabel}</div>
                        </div>

                        <div className={`${bgList} p-3 rounded-xl border ${brd} text-center shadow-inner flex flex-col justify-center`}>
                          <div className={`text-[8px] ${txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Zap className="w-3 h-3 text-amber-500"/> Peak Output</div>
                          <div className={`text-sm font-mono font-black ${txtMain}`}>{safeNum(ride.peakWatts).toFixed(0)} W</div>
                        </div>

                        <div className={`${bgList} p-3 rounded-xl border ${brd} text-center shadow-inner flex flex-col justify-center`}>
                          <div className={`text-[8px] ${txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><TrendingUp className="w-3 h-3 text-emerald-500"/> Elevation Gain</div>
                          <div className={`text-sm font-mono font-black ${txtMain}`}>{useMetric ? (safeNum(ride.elevationGain)/3.281).toFixed(0) : safeNum(ride.elevationGain).toFixed(0)} {altLabel}</div>
                        </div>

                        <div className={`${bgList} p-3 rounded-xl border ${brd} text-center shadow-inner flex flex-col justify-center`}>
                          <div className={`text-[8px] ${txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Battery className="w-3 h-3 text-cyan-500"/> Energy Displaced</div>
                          <div className={`text-sm font-mono font-black ${txtMain}`}>{safeNum(ride.totalWhConsumed).toFixed(0)} Wh</div>
                        </div>

                        <div className={`${bgList} p-3 rounded-xl border ${brd} text-center shadow-inner flex flex-col justify-center relative overflow-hidden`}>
                          <div className={`absolute top-0 right-0 w-8 h-8 ${t.bg} blur-xl opacity-20`}></div>
                          <div className={`text-[8px] ${txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Activity className={`w-3 h-3 ${t.text}`}/> {tx('eff')}</div>
                          <div className={`text-sm font-mono font-black ${t.text}`}>{safeNum(ride.efficiencyWhPerMile).toFixed(1)} <span className={`text-[9px] ${txtMuted}`}>Wh/{useMetric?'km':'mi'}</span></div>
                        </div>

                        <div className={`${bgList} p-3 rounded-xl border ${brd} text-center shadow-inner flex flex-col justify-center`}>
                          <div className={`text-[8px] ${txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><DollarSign className="w-3 h-3 text-emerald-500"/> Gas Saved</div>
                          <div className="text-sm font-mono font-black text-emerald-500">${safeNum(ride.financialSavings).toFixed(2)}</div>
                        </div>
                     </div>

                     {/* Battery Drain & Weather Snapshots */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                          <CloudRain className="w-5 h-5 text-cyan-500 shrink-0" />
                          <div>
                            <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Ride Weather Snapshot</div>
                            <div className={`text-xs font-bold ${txtMain}`}>{ride.weatherCondition || "Offline"}</div>
                          </div>
                       </div>
                       <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                          <Battery className="w-5 h-5 text-amber-500 shrink-0" />
                          <div className="w-full">
                            <div className={`flex justify-between text-[8px] font-black uppercase tracking-widest ${txtMuted} w-full mb-1`}>
                              <span>Start: {safePct(ride.startingBattery)}%</span>
                              <span>End: {safePct(ride.endingBattery)}%</span>
                            </div>
                            <div className={`w-full h-1.5 ${bgBase} rounded-full flex justify-between overflow-hidden`}>
                               <div className="h-full bg-amber-500" style={{width: `${safePct(ride.endingBattery)}%`}}></div>
                               <div className="h-full bg-rose-500/50" style={{width: `${safePct(safeNum(ride.startingBattery, 100) - safeNum(ride.endingBattery, 0))}%`}}></div>
                            </div>
                          </div>
                       </div>
                     </div>
                     
                     {/* PILOT JOURNAL / RIDE NOTES */}
                     <div className={`${bgList} border ${brd} rounded-xl p-4 shadow-inner`}>
                        <div className={`text-[9px] font-black uppercase tracking-widest ${txtMuted} mb-2 flex items-center justify-between`}>
                          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> Pilot Journal & Maintenance Notes</span>
                          <Save className={`w-3.5 h-3.5 ${t.text} opacity-50`} />
                        </div>
                        <textarea 
                          value={ride.rideNote || ""} 
                          onChange={(e) => updateRideNote(ride.id, e.target.value)}
                          placeholder="Log terrain conditions, maintenance issues, or modifications felt during this run..."
                          className={`w-full ${bgBase} border ${brd} rounded-lg p-3 text-xs font-bold ${txtMain} outline-none focus:${t.border} transition-colors custom-scrollbar resize-none h-20`}
                        />
                     </div>

                   </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- 🔥 12 COMPREHENSIVE WEATHER & ATMOSPHERICS METRICS 🔥 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col border transition-colors ${brd}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b ${brd} pb-4 relative z-10 shrink-0`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${t.dim}`}><Thermometer className={`w-5 h-5 ${t.text}`} /></div>
              <h3 className={`${txtMain} font-black uppercase tracking-widest text-sm flex flex-col`}>
                {tx('weather')}
                <span className={`text-[10px] ${txtMuted} flex items-center gap-1 mt-1 font-bold`}><MapPin className="w-3 h-3"/> {savedLocationName}</span>
              </h3>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className={`flex flex-1 sm:flex-none ${bgBase} rounded-xl border overflow-hidden transition-colors ${brd} focus-within:border-zinc-500`}>
                <input 
                  value={weatherInput} onChange={(e) => setWeatherInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
                  placeholder="City override..."
                  className={`min-h-[44px] bg-transparent text-xs font-bold ${txtMain} px-4 outline-none w-full sm:w-36`}
                />
                <button onClick={handleLocationSearch} className={`min-h-[44px] min-w-[44px] ${bgList} transition-colors flex items-center justify-center ${t.text}`}><Search className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {isFetchingWeather ? (
            <div className={`flex-1 flex items-center justify-center py-10 text-xs font-bold uppercase tracking-widest animate-pulse ${t.text}`}>Syncing Satellites...</div>
          ) : weatherData && weatherData.current ? (
            <div className="relative z-10 flex-1 flex flex-col justify-between">
              
              <div className={`mb-5 ${bgCard} border ${brd} rounded-xl p-3 flex justify-between items-center shadow-inner`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${txtMuted}`}>Run Safety Vector</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-transparent ${rideSafetyRating.color === 'text-rose-500' ? 'bg-rose-950/40 border-rose-900/50' : ''} ${rideSafetyRating.color}`}>{rideSafetyRating.text}</span>
              </div>

              <div className="flex flex-wrap items-center gap-5 mb-6">
                <div className={`${txtMain} text-6xl font-black font-mono tracking-tighter drop-shadow-md`}>{Math.round(weatherData?.current?.temperature_2m ?? 0)}°</div>
                
                <div className={`border-l ${brd} pl-5 space-y-1.5`}>
                  <div className={`text-[11px] ${txtMuted} font-bold uppercase tracking-widest`}>Peak: {Math.round(weatherData?.daily?.temperature_2m_max?.[0] ?? 0)}° • Low: {Math.round(weatherData?.daily?.temperature_2m_min?.[0] ?? 0)}°</div>
                  <div className={`text-[11px] font-mono font-bold uppercase tracking-widest ${t.text}`}>Wind: {Math.round(weatherData?.current?.wind_speed_10m ?? 0)} {useMetric ? 'kmh' : 'mph'} <span className={txtMuted}>({getCardinalDirection(weatherData?.current?.wind_direction_10m)})</span></div>
                  <div className={`text-[11px] font-mono uppercase tracking-widest text-rose-500`}>Gusts: {Math.round(weatherData?.current?.wind_gusts_10m ?? weatherData?.current?.wind_speed_10m ?? 0)} {useMetric ? 'kmh' : 'mph'}</div>
                </div>

                {/* 🔥 12 COMPREHENSIVE WEATHER METRIC CARDS 🔥 */}
                <div className={`w-full grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2 pt-4 border-t ${brd}`}>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Sun className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Solar UV Index</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{weatherData?.current?.uv_index ?? 0} / 11</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Eye className={`w-5 h-5 ${t.text}`} />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Visibility</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{useMetric ? (((weatherData?.current?.visibility ?? 10000)/1000).toFixed(1) + ' km') : (((weatherData?.current?.visibility ?? 10000)/1609).toFixed(1) + ' mi')}</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Activity className={`w-5 h-5 text-purple-500`} />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Pressure</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{weatherData?.current?.surface_pressure ?? 1013} hPa</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <CloudFog className={`w-5 h-5 text-zinc-500`} />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Cloud Cover</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{weatherData?.current?.cloud_cover ?? 0}%</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Thermometer className="w-5 h-5 text-rose-400" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Feels Like</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{Math.round(weatherData?.current?.apparent_temperature ?? weatherData?.current?.temperature_2m ?? 0)}°</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Waves className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Dew Point</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{Math.round(weatherData?.current?.dew_point_2m ?? 0)}°</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Droplets className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Humidity</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{weatherData?.current?.relative_humidity_2m ?? 0}%</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <CloudRain className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Moisture</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{weatherData?.current?.precipitation ?? 0} {useMetric ? 'mm' : 'in'}</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Sunrise className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Solar Dawn</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{weatherData?.daily?.sunrise?.[0] ? formatTimeFromIso(weatherData.daily.sunrise[0]) : "N/A"}</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Sunset className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Solar Dusk</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{weatherData?.daily?.sunset?.[0] ? formatTimeFromIso(weatherData.daily.sunset[0]) : "N/A"}</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Thermometer className="w-5 h-5 text-amber-600" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Trail Surf Temp</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{Math.round(weatherData?.current?.soil_temperature_0cm ?? 0)}°</div>
                      </div>
                   </div>
                   <div className={`${bgList} border ${brd} rounded-xl p-3 flex items-center gap-3`}>
                      <Sun className="w-5 h-5 text-yellow-500" />
                      <div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${txtMuted}`}>Solar Radiation</div>
                        <div className={`text-xs font-bold ${txtMain}`}>{Math.round(weatherData?.current?.direct_radiation ?? 0)} W/m²</div>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className={`mt-2 border-t ${brd} pt-5`}>
                 <h4 className={`text-[10px] font-black ${txtMuted} uppercase tracking-widest mb-3 flex items-center gap-2`}>
                   <CalendarDays className="w-4 h-4"/> 10-Day Atmospheric Outlook
                 </h4>
                 <div className="flex gap-2.5 overflow-x-auto custom-scrollbar pb-2">
                   {weatherData?.daily?.time?.map((day: string, idx: number) => (
                      <div key={day} className={`${bgBase} border ${brd} p-3 rounded-xl text-center flex flex-col items-center justify-between h-28 min-w-[76px] shrink-0 shadow-inner`}>
                          <span className={`text-[9px] font-black ${txtMuted} uppercase`}>{new Date(day).toLocaleDateString(localeCode, { weekday: 'short' })}</span>
                          {getWeatherIcon(weatherData?.daily?.weather_code?.[idx])}
                          <div className="space-y-0.5">
                            <span className={`text-[11px] font-black ${txtMain}`}>{Math.round(weatherData?.daily?.temperature_2m_max?.[idx] ?? 0)}°</span>
                            <span className={`text-[9px] font-bold ${txtMuted} ml-1`}>{Math.round(weatherData?.daily?.temperature_2m_min?.[idx] ?? 0)}°</span>
                          </div>
                      </div>
                   ))}
                 </div>
              </div>
            </div>
          ) : (
            <div className={`flex-1 flex items-center justify-center py-6 ${txtMuted} font-mono text-[10px] uppercase`}>Base Station Unconfigured</div>
          )}
        </div>

        {/* Global PEV News Module */}
        <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col border transition-colors ${brd}`}>
           <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${brd} pb-4 mb-4 shrink-0 gap-3 w-full`}>
             <h3 className={`${t.text} font-black uppercase tracking-widest text-sm flex items-center gap-2`}>
                <Newspaper className="w-5 h-5" /> {tx('news')}
             </h3>
             <div className="flex items-center gap-2 w-full sm:w-auto">
               <button onClick={fetchPEVNews} className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${bgList} border ${brd} ${txtMuted} hover:${txtMain} transition-colors`} title="Force Sync Matrix">
                 <RefreshCw className={`w-4 h-4 ${isLoadingNews ? 'animate-spin' : ''}`}/>
               </button>
               <select 
                 value={newsCategory} 
                 onChange={(e) => setNewsCategory(e.target.value)}
                 className={`${bgBase} text-[10px] font-black uppercase tracking-widest ${txtMain} border ${brd} min-h-[44px] px-3 rounded-xl outline-none shadow-inner cursor-pointer w-full sm:w-auto`}
               >
                 {NEWS_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
             </div>
           </div>
           
           <input 
              value={newsSearchFilter} onChange={(e) => setNewsSearchFilter(e.target.value)}
              placeholder="Filter headlines by keyword..."
              className={`mb-4 ${bgList} border ${brd} rounded-xl px-4 min-h-[44px] ${txtMain} text-xs font-bold outline-none focus:${t.border} transition-colors w-full`}
           />

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[350px] pr-2">
             {isLoadingNews ? (
               <div className="flex justify-center items-center h-full pt-10">
                 <Loader2 className={`w-6 h-6 animate-spin ${t.text}`} />
               </div>
             ) : filteredNews.length === 0 ? (
               <div className={`text-center py-10 ${txtMuted} font-mono text-[10px] uppercase`}>No articles matching parameters.</div>
             ) : (
               filteredNews.map((news, idx) => (
                 <div key={`${news.url}-${idx}`} onClick={() => window.open(news.url, "_blank")} className={`group ${bgList} border ${brd} p-4 rounded-2xl transition-colors cursor-pointer shadow-inner hover:border-zinc-500`}>
                   <div className="flex justify-between items-start mb-2">
                     <span className={`text-[9px] font-black uppercase tracking-widest ${txtMuted} truncate pr-2`}>{news.source?.name || "Network"} • {new Date(news.publishedAt).toLocaleDateString(localeCode)}</span>
                     <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${brd} ${txtMuted} shrink-0 group-hover:${t.text} group-hover:border-current transition-colors`}>{Math.max(1, Math.ceil((news.content?.length || 500) / 200))} MIN READ</span>
                   </div>
                   <div className="flex items-center justify-between gap-4">
                     <h4 className={`text-xs font-bold ${txtMain} leading-relaxed transition-colors line-clamp-2`}>{news.title}</h4>
                     {news.urlToImage && (
                       <img src={news.urlToImage} alt="" className={`w-14 h-14 object-cover rounded-xl border ${brd} shrink-0`} />
                     )}
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>

      {/* --- YOUTUBE MEDIA DECK (75 RESULTS & 30 PRESETS) --- */}
      <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl border transition-colors space-y-5 ${brd}`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${brd} pb-4 gap-4 w-full`}>
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-2.5 rounded-xl text-white shadow-md"><Youtube className="w-5 h-5" /></div>
            <div>
              <h3 className={`${txtMain} font-black uppercase tracking-widest text-sm`}>{tx('audio')}</h3>
              <p className={`text-[9px] ${txtMuted} font-mono uppercase mt-1`}>{ytQueue.length} Active Target Array Sequences • 75 Stream Payload</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={handleClearQueue} className={`flex-1 sm:flex-none min-h-[44px] px-4 text-[10px] font-black border rounded-xl transition-colors flex items-center justify-center gap-2 ${bgBase} ${brd} ${txtMuted} hover:text-rose-500 hover:border-rose-900`}>
              <X className="w-4 h-4"/> {tx('clear')}
            </button>
            <button onClick={() => setShowYtSettings(!showYtSettings)} className={`flex-1 sm:flex-none min-h-[44px] px-4 text-[10px] font-black border rounded-xl transition-colors flex items-center justify-center gap-2 ${showYtSettings ? 'bg-zinc-800 border-zinc-700 text-white' : `${bgBase} ${brd} ${txtMuted} hover:border-zinc-500`}`}>
              <Sliders className="w-4 h-4"/> Config
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showYtSettings && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`${bgCard} p-4 rounded-2xl border ${brd} grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs overflow-hidden`}>
              <div className={`flex justify-between items-center ${bgList} px-4 min-h-[56px] rounded-xl border ${brd}`}>
                <span className={`text-[10px] font-black uppercase ${txtMuted} tracking-wider`}>Continuous Deck Loop</span>
                <button onClick={() => setYtLoop(!ytLoop)} className={`min-h-[36px] px-4 text-[9px] font-black border rounded-lg uppercase transition-colors ${ytLoop ? 'bg-rose-950/40 border-rose-900 text-rose-500' : `${bgBase} ${brd} ${txtMuted}`}`}>{ytLoop ? 'LOOP ON' : 'OFF'}</button>
              </div>
              <div className={`flex justify-between items-center ${bgList} px-4 min-h-[56px] rounded-xl border ${brd}`}>
                <span className={`text-[10px] font-black uppercase ${txtMuted} tracking-wider flex items-center gap-2`}><EyeOff className="w-4 h-4"/> Minimize Video Layer</span>
                <button onClick={() => setMinimizeVideo(!minimizeVideo)} className={`min-h-[36px] px-4 text-[9px] font-black border rounded-lg uppercase transition-colors ${minimizeVideo ? 'bg-emerald-950/40 border-emerald-900 text-emerald-500' : `${bgBase} ${brd} ${txtMuted}`}`}>{minimizeVideo ? 'MINIMIZED' : 'EXPANDED'}</button>
              </div>
              <div className={`flex justify-between items-center ${bgList} px-4 min-h-[56px] rounded-xl border ${brd}`}>
                <span className={`text-[10px] font-black uppercase ${txtMuted} tracking-wider`}>Viewport Scale Limit</span>
                <select value={ytVideoQuality} onChange={(e) => setYtVideoQuality(e.target.value)} className={`${bgBase} border ${brd} rounded px-1 min-h-[36px] text-[9px] font-bold ${txtMain} outline-none`}>
                  <option value="small">Compact (240p)</option>
                  <option value="large">Standard (480p)</option>
                  <option value="hd720">High Def (720p)</option>
                </select>
              </div>
              <div className={`flex justify-between items-center ${bgList} px-4 min-h-[56px] rounded-xl border ${brd}`}>
                <span className={`text-[10px] font-black uppercase ${txtMuted} tracking-wider`}>Audio Playback Speed</span>
                <div className={`flex ${bgBase} border ${brd} rounded-lg p-1`}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button key={speed} onClick={() => setYtPlaybackRate(speed)} className={`min-h-[36px] px-2.5 text-[9px] font-black uppercase rounded-md transition-colors ${ytPlaybackRate === speed ? `${t.bg} text-black` : `${txtMuted} hover:${txtMain}`}`}>{speed}x</button>
                  ))}
                </div>
              </div>
              <div className={`flex flex-col justify-center ${bgList} px-4 min-h-[56px] rounded-xl border ${brd} gap-1.5`}>
                <span className={`text-[10px] font-black uppercase ${txtMuted} tracking-wider flex items-center gap-2 w-full justify-between`}><span className="flex items-center gap-2"><Volume1 className="w-4 h-4"/> Master Output Gain</span> <span className={`${txtMain} font-mono`}>{ytVolume}%</span></span>
                <input type="range" min="0" max="100" value={ytVolume} onChange={e => setYtVolume(Number(e.target.value))} className="w-full accent-rose-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          <div className={`lg:col-span-5 flex flex-col justify-between space-y-4 ${bgCard} border ${brd} p-4 sm:p-5 rounded-3xl shadow-inner w-full`}>
            {ytQueue.length > 0 ? (
              <div className="space-y-4 w-full">
                <div className={`flex items-center justify-between ${bgList} border ${brd} rounded-xl p-3 px-4`}>
                  <span className="text-[9px] font-mono text-rose-500 font-black tracking-widest uppercase flex items-center gap-2">
                    <Disc className="w-4 h-4 animate-spin"/> STREAMING CONSOLE
                  </span>
                  <div className="flex items-end gap-1 h-4">
                    <span className="w-1 bg-rose-500 animate-[pulse_0.4s_infinite] h-3"></span>
                    <span className="w-1 bg-rose-500 animate-[pulse_0.7s_infinite] h-1.5"></span>
                    <span className="w-1 bg-rose-500 animate-[pulse_0.5s_infinite] h-2.5"></span>
                    <span className="w-1 bg-rose-500 animate-[pulse_0.6s_infinite] h-4"></span>
                  </div>
                </div>

                {!minimizeVideo && (
                  <div className={`rounded-2xl overflow-hidden border ${brd} shadow-2xl bg-black relative aspect-video w-full`}>
                    <iframe 
                      width="100%" height="100%"
                      src={`https://www.youtube.com/embed/${ytQueue[0].id}?autoplay=1&vq=${ytVideoQuality}&loop=${ytLoop ? 1 : 0}&playlist=${ytQueue[0].id}&playsinline=1`} 
                      frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen
                    ></iframe>
                  </div>
                )}
                {minimizeVideo && (
                  <div className="w-full h-0 overflow-hidden opacity-0 pointer-events-none">
                     <iframe 
                        width="10%" height="10%"
                        src={`https://www.youtube.com/embed/${ytQueue[0].id}?autoplay=1&vq=small&loop=${ytLoop ? 1 : 0}&playlist=${ytQueue[0].id}&playsinline=1`} 
                        frameBorder="0" allow="autoplay"
                     ></iframe>
                  </div>
                )}

                <div className={`${bgList} border ${brd} rounded-2xl p-4 flex flex-col gap-3`}>
                   <div className={`text-[11px] font-bold ${txtMain} truncate text-center px-1`}>{ytQueue[0].title}</div>
                   <div className={`flex justify-center items-center gap-4 pt-3 border-t ${brd}`}>
                     <button onClick={handleShuffleQueue} className={`min-h-[56px] min-w-[56px] flex items-center justify-center ${bgBase} border ${brd} rounded-xl ${txtMuted} hover:${txtMain} hover:border-zinc-500 transition-colors`} title="Shuffle Sequences"><Shuffle className="w-5 h-5"/></button>
                     <button onClick={handleNextTrack} className={`flex-1 flex items-center justify-center gap-2 min-h-[56px] px-4 bg-rose-950/40 border border-rose-900/50 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all`}><FastForward className="w-4 h-4"/> Next Array Track</button>
                   </div>
                </div>
              </div>
            ) : (
              <div className={`h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 border border-dashed ${brd} rounded-2xl`}>
                 <Music className={`w-10 h-10 ${txtMuted} animate-pulse mb-3`} />
                 <span className={`text-[11px] font-mono ${txtMuted} uppercase tracking-widest font-bold`}>Deck Pipeline Idle</span>
                 <span className={`text-[9px] ${txtMuted} uppercase mt-2`}>Select an item below to lock frequencies</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4 w-full">
            <div className="space-y-2">
              <span className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest block font-mono pl-1`}>Cockpit Presets</span>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                {YT_GENRES.map(genre => (
                  <button 
                    key={genre.label} onClick={() => { setYtSearchQuery(genre.query); handleYoutubeSearch(genre.query); }}
                    className={`min-w-[140px] min-h-[56px] px-4 ${bgList} border ${brd} hover:border-rose-500/50 ${txtMuted} hover:${txtMain} text-[10px] font-black uppercase tracking-wider rounded-xl text-left truncate transition-all shadow-inner shrink-0`}
                  >
                    {genre.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                value={ytSearchQuery} onChange={(e) => setYtSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleYoutubeSearch()}
                placeholder={tx('search')}
                className={`flex-1 min-h-[56px] ${bgList} border ${brd} rounded-xl px-4 ${txtMain} text-xs font-bold outline-none focus:border-rose-500 transition-colors`}
              />
              <button onClick={() => handleYoutubeSearch()} className="min-h-[56px] w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"><Search className="w-4 h-4"/> Query</button>
            </div>

            {ytResults.length > 0 && (
              <div className={`${bgCard} border ${brd} rounded-3xl p-3 max-h-[360px] overflow-y-auto custom-scrollbar space-y-2`}>
                {ytResults.map((vid, idx) => (
                  <div key={`${vid.id?.videoId || idx}-${idx}`} className={`${bgList} border ${brd} p-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-rose-500/50 transition-colors`}>
                    <div className="flex gap-3 items-center truncate">
                      <img src={vid.snippet.thumbnails.default.url} alt="" className={`w-16 h-12 object-cover rounded-xl border ${brd} shrink-0`} />
                      <div className="truncate">
                        <h4 className={`text-xs font-bold ${txtMain} group-hover:text-rose-500 transition-colors truncate`}>{vid.snippet.title}</h4>
                        <p className={`text-[9px] ${txtMuted} font-mono uppercase truncate mt-1`}>{vid.snippet.channelTitle}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                      <button onClick={() => handleLoadDeck({id: vid.id.videoId, title: vid.snippet.title, thumb: vid.snippet.thumbnails.default.url})} className="flex-1 sm:flex-none min-h-[56px] px-6 bg-rose-950/40 border border-rose-900/40 text-rose-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">{tx('play')}</button>
                      <button onClick={() => handleAddToQueue({id: vid.id.videoId, title: vid.snippet.title, thumb: vid.snippet.thumbnails.default.url})} className={`flex-1 sm:flex-none min-h-[56px] px-6 ${bgBase} border ${brd} ${txtMuted} rounded-xl text-[10px] hover:border-zinc-500 hover:${txtMain} transition-all flex items-center justify-center gap-2`}><ListPlus className="w-4 h-4"/> {tx('queue')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ytQueue.length > 0 && (
              <div className={`${bgCard} p-4 rounded-2xl border ${brd} mt-4`}>
                <div className={`text-[9px] font-black uppercase tracking-widest ${txtMuted} font-mono block mb-3 flex justify-between`}>
                   <span>Sequence Queue Matrix</span>
                   <span>{ytQueue.length} Pending</span>
                </div>
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                   {ytQueue.map((track, idx) => (
                     <div key={`${track.id}-${idx}`} className={`relative shrink-0 ${bgBase} border ${brd} p-2 rounded-xl flex items-center gap-3 w-[200px] shadow-inner`}>
                        <img src={track.thumb} alt="" className={`w-10 h-10 object-cover rounded-lg border ${brd} shrink-0`} />
                        <span className={`text-[10px] font-bold truncate pr-4 ${idx === 0 ? "text-rose-500" : txtMain}`}>{idx + 1}. {track.title}</span>
                        {idx > 0 && (
                          <button onClick={() => setYtQueue(prev => prev.filter((_, i) => i !== idx))} className={`absolute -top-1.5 -right-1.5 ${bgList} ${txtMuted} hover:text-rose-500 rounded-full p-1 border ${brd} shadow-md min-h-[36px] min-w-[36px] flex items-center justify-center`}><X className="w-4 h-4"/></button>
                        )}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- FINANCIAL STATS & DIAGNOSTIC REPAIR MODULES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-center border transition-colors ${brd}`}>
          <h3 className={`text-zinc-500 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2 border-b ${brd} pb-3`}>
            <PieChart className={`w-4 h-4 ${t.text}`} /> {tx('impact')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className={`${bgList} p-3 rounded-xl border ${brd} flex items-center gap-3 shadow-inner`}>
              <Fuel className="w-5 h-5 text-rose-500 shrink-0" />
              <div className="flex-1">
                <div className={`text-[9px] ${txtMuted} font-black uppercase tracking-widest mb-1`}>Premium Gas / Gal</div>
                <div className="flex items-center">
                  <span className={`${txtMain} text-sm font-mono font-bold`}>$</span>
                  <input type="number" step="0.01" value={localGasPrice} onChange={(e) => setLocalGasPrice(Number(e.target.value))} className={`bg-transparent ${txtMain} text-sm font-mono font-bold outline-none w-full ml-1`} />
                </div>
              </div>
            </div>
            <div className={`${bgList} p-3 rounded-xl border ${brd} flex items-center gap-3 shadow-inner`}>
              <Gauge className={`w-5 h-5 ${t.text} shrink-0`} />
              <div className="flex-1">
                <div className={`text-[9px] ${txtMuted} font-black uppercase tracking-widest mb-1`}>Baseline Car MPG</div>
                <input type="number" value={referenceMpg} onChange={(e) => setReferenceMpg(Number(e.target.value))} className={`bg-transparent ${txtMain} text-sm font-mono font-bold outline-none w-full`} />
              </div>
            </div>
          </div>
          <button onClick={() => { window.open(`https://www.google.com/maps/search/gas/@${activeUpdate?.lat || 35.2757},${activeUpdate?.lng || -95.1244},14z`, "_system"); }} className={`w-full min-h-[56px] mb-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-black transition-all flex items-center justify-center gap-2 ${t.bg} hover:opacity-90 ${t.shadow}`}>
            <MapIcon className="w-4 h-4" /> Map Nearby Gas Prices
          </button>
          
          <div className="space-y-3">
            <div className={`flex items-center justify-between ${bgList} p-4 rounded-xl border ${brd} shadow-inner`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${t.dim}`}><DollarSign className={`w-4 h-4 ${t.text}`}/></div>
                <div>
                  <div className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest mb-0.5`}>Displaced Fuel Expenditures</div>
                  <div className={`text-sm font-black ${txtMain}`}>${safeNum(totalMiles > 0 && referenceMpg > 0 ? (totalMiles / referenceMpg) * localGasPrice : 0).toFixed(2)} Savings</div>
                </div>
              </div>
            </div>
            <div className={`flex items-center justify-between ${bgList} p-4 rounded-xl border ${brd} shadow-inner`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-950/40 border border-amber-900/50 rounded-xl"><Car className="w-4 h-4 text-amber-500"/></div>
                <div>
                  <div className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest mb-0.5`}>Vehicle Wear & Tear Avoided</div>
                  <div className={`text-sm font-black ${txtMain}`}>${safeNum(totalMiles * 0.15).toFixed(2)} Saved</div>
                </div>
              </div>
            </div>
            <div className={`flex items-center justify-between ${bgList} p-4 rounded-xl border ${brd} shadow-inner`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-950/40 border border-emerald-900/50 rounded-xl"><Leaf className="w-4 h-4 text-emerald-500"/></div>
                <div>
                  <div className={`text-[9px] font-black ${txtMuted} uppercase tracking-widest mb-0.5`}>Carbon Offset Tree Equivalent</div>
                  <div className={`text-sm font-black ${txtMain}`}>{safeNum((totalMiles * CO2_SAVED_PER_MILE_LBS) / 48).toFixed(2)} Trees Planted</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl border transition-colors ${brd}`}>
          <h3 className={`text-zinc-500 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2 border-b ${brd} pb-3`}>
            <Settings2 className={`w-4 h-4 ${t.text}`} /> {tx('maintenance')}
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className={txtMuted}>Pneumatic Pressure (50 {distLabel})</span>
                <button onClick={() => setTireOdoOffset(totalMiles)} className={`text-[9px] font-mono px-3 py-1.5 min-h-[36px] ${bgList} border ${brd} rounded-lg uppercase tracking-wider ${t.text} flex items-center gap-1.5`}><RefreshCw className="w-3 h-3"/> reset</button>
              </div>
              <div className="flex justify-between mb-1.5 px-1"><span className={`text-[9px] ${txtMuted} font-mono`}>Index Data</span><span className={`text-[10px] font-bold ${t.text}`}>{activeTirePressureMil} / 50</span></div>
              <div className={`h-2 ${bgBase} rounded-full overflow-hidden shadow-inner`}><div className={`h-full transition-all duration-500 ${t.bg}`} style={{ width: `${safePct((activeTirePressureMil / 50) * 100)}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className={txtMuted}>Friction Rotor Index (250 {distLabel})</span>
                <button onClick={() => setBrakeOdoOffset(totalMiles)} className={`text-[9px] font-mono px-3 py-1.5 min-h-[36px] ${bgList} border ${brd} rounded-lg uppercase tracking-wider ${t.text} flex items-center gap-1.5`}><RefreshCw className="w-3 h-3"/> reset</button>
              </div>
              <div className="flex justify-between mb-1.5 px-1"><span className={`text-[9px] ${txtMuted} font-mono`}>Index Data</span><span className={`text-[10px] font-bold ${t.text}`}>{activeBrakePadMil} / 250</span></div>
              <div className={`h-2 ${bgBase} rounded-full overflow-hidden shadow-inner`}><div className={`h-full transition-all duration-500 ${t.bg}`} style={{ width: `${safePct((activeBrakePadMil / 250) * 100)}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className={txtMuted}>Drivetrain Lubrication (500 {distLabel})</span>
                <button onClick={() => setChainOdoOffset(totalMiles)} className={`text-[9px] font-mono px-3 py-1.5 min-h-[36px] ${bgList} border ${brd} rounded-lg uppercase tracking-wider ${t.text} flex items-center gap-1.5`}><RefreshCw className="w-3 h-3"/> reset</button>
              </div>
              <div className="flex justify-between mb-1.5 px-1"><span className={`text-[9px] ${txtMuted} font-mono`}>Index Data</span><span className={`text-[10px] font-bold ${t.text}`}>{activeChainOdoMil} / 500</span></div>
              <div className={`h-2 ${bgBase} rounded-full overflow-hidden shadow-inner`}><div className={`h-full transition-all duration-500 ${t.bg}`} style={{ width: `${safePct((activeChainOdoMil / 500) * 100)}%` }}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SATELLITE RADAR ATTACHMENT --- */}
      <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-2xl border transition-colors space-y-4 ${brd}`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between border-b ${brd} pb-4 gap-4`}>
           <h3 className={`${txtMain} font-black uppercase tracking-widest text-sm flex items-center gap-2`}><MapIcon className={t.text} /> Global Satellite Radar</h3>
           <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${isTracking ? `border-[#39ff14]/50 text-[#39ff14] bg-[#39ff14]/10 animate-pulse` : `border-zinc-500 ${txtMuted}`}`}>{isTracking ? 'Active Sat Lock' : 'Standby Mode'}</span>
        </div>
        <div className={`shadow-inner rounded-2xl overflow-hidden border transition-colors relative ${isDayMode ? 'border-zinc-300' : 'border-zinc-800'}`}>
          <div className={isDayMode ? "contrast-125" : ""}>
             <RiderMap userLat={activeUpdate.lat || 0} userLng={activeUpdate.lng || 0} speed={activeUpdate.speed || 0} pevType={pevType} userStatus={isTracking ? "Riding" : "Idle"} isTracking={isTracking} userName={callsign || "Anonymous Rider"} />
          </div>
        </div>
      </div>
    </div>
  );
}