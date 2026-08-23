"use client";

import React, { useState, useEffect, useRef } from "react";
import { PEVType } from "../types";
import { 
  Activity, AlertTriangle, Compass, Mountain, Crosshair, MapPin, 
  Sun, Cloud, CloudRain, Snowflake, Zap, Thermometer, Wind, PhoneCall, 
  ZapOff, AlertOctagon, Loader2, PlayCircle, Square, EyeOff, RotateCw, 
  TrendingUp, TrendingDown, CircleGauge, ShieldAlert as ShieldAlertIcon, 
  ShieldAlert, Disc, CircleDashed, Timer, Gauge, Battery, Scale, Map as MapIcon, Settings2
} from "lucide-react";
import { locationService } from "../services/LocationService";
import RiderMap from "./RiderMap";
import FinancialImpact from "./DashboardWidgets/FinancialImpact";
import PredictiveMaintenance from "./DashboardWidgets/PredictiveMaintenance";
import PEVNewsFeed from "./DashboardWidgets/PEVNewsFeed";
import MissionLogs from "./DashboardWidgets/MissionLogs";
import WeatherMatrix from "./DashboardWidgets/WeatherMatrix";
import AICopilotWidget from "./DashboardWidgets/AICopilotWidget";
import YoutubeDeck from "./DashboardWidgets/YoutubeDeck";
import SettingsMatrix from "./DashboardWidgets/SettingsMatrix";
import PEVProfileSetup from "./DashboardWidgets/PEVProfileSetup";
import { AnimatePresence } from "framer-motion";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { getGeminiApiKey } from "../services/CoPilotService";
import { ScreenBrightness } from '@capacitor-community/screen-brightness';
import { App as CapApp } from '@capacitor/app';

type ThemeColor = 'rural' | 'lime' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'void';

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
  return arr[(val % 16 + 16) % 16];
};

export default function UniversalTelemetry(props: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (props.theme) setTheme(props.theme as ThemeColor);
  }, [props.theme]);

  useEffect(() => {
    if (props.useMetric !== undefined) setUseMetric(props.useMetric);
  }, [props.useMetric]);

  const localeCode = props.locale || "en";
  const tx = (key: string, fallback?: string) => I18N[localeCode]?.[key] || I18N['en']?.[key] || fallback || key;

  // --- CORE TRACKING STATE ---
  const [pevType, setPevType] = useState<PEVType>(PEVType.SCOOTER);
  const [vehicleModel, setVehicleModel] = useState("Universal E-Scooter");
  const [customVehicleName, setCustomVehicleName] = useState("");
  const [terrain, setTerrain] = useState("Road");
  const [powerMode, setPowerMode] = useState("Standard");
  const [checkedSafety, setCheckedSafety] = useState(false);
  
  // Custom HUD states
  const [hudStyle, setHudStyle] = useState<"digital" | "analog" | "minimalist" | "bar" | "cyber" | "aviation" | "orb">("digital");
  const [hudFontColor, setHudFontColor] = useState<string>("#39ff14");

  const [gpsSmoothing, setGpsSmoothing] = useState<"Loose" | "Balanced" | "Strict">("Balanced");
  const [speedLimitPolling, setSpeedLimitPolling] = useState<"Aggressive" | "Balanced" | "Eco">("Aggressive");
  const [autoWakeSpeed, setAutoWakeSpeed] = useState<number>(10);
  const [speedSignStyle, setSpeedSignStyle] = useState<"us" | "eu" | "minimal">("us");
  const [cutoffVoltage, setCutoffVoltage] = useState<number | null>(null);
  const [liveRestingVoltage, setLiveRestingVoltage] = useState<number>(48);
  const [batteryChemistry, setBatteryChemistry] = useState<string>("Li-Ion");

  // --- MACHINE SPECS STATE ---
  const [wheelSize, setWheelSize] = useState<number>(10);
  const [motorTopology, setMotorTopology] = useState<string>("Direct Drive Hub");
  const [batteryTopology, setBatteryTopology] = useState<string>("14S 4P");
  const [aeroProfile, setAeroProfile] = useState<"Standing" | "Crouched" | "Seated">("Standing");
  const [suspensionType, setSuspensionType] = useState<"Rigid" | "Front Suspension" | "Full Suspension">("Full Suspension");
  const [towingTrailer, setTowingTrailer] = useState(false);
  const [savedPevProfiles, setSavedPevProfiles] = useState<any[]>([]);

  // --- TELEMETRY STATE ---
  const [activeUpdate, setActiveUpdate] = useState<any>({});
  const [isTracking, setIsTracking] = useState(false);
  const [savedRides, setSavedRides] = useState<any[]>([]);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [movingSeconds, setMovingSeconds] = useState(0); 
  const [currentAmps, setCurrentAmps] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [logFilter, setLogFilter] = useState("ALL");
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);

  // --- ADVANCED PHYSICS TRACKING & GPS SMOOTHING ---
  const [isClimbing, setIsClimbing] = useState(false);
  const [isDescending, setIsDescending] = useState(false);
  const [brakeForceG, setBrakeForceG] = useState(0);
  const [accelForceG, setAccelForceG] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [liveSpeedLimit, setLiveSpeedLimit] = useState(35);
  const [currentRoadType, setCurrentRoadType] = useState("Querying Live Web Infrastructure...");
  const [isSchoolZone, setIsSchoolZone] = useState(false);
  const [isFetchingSpeedLimit, setIsFetchingSpeedLimit] = useState(false);
  const [currentStreet, setCurrentStreet] = useState("");
  const [effectiveHeadwind, setEffectiveHeadwind] = useState<number>(0);
  
  // --- IMU CRASH DETECTION STATE ---
  const [isCrashAlertActive, setIsCrashAlertActive] = useState<boolean>(false);
  const [crashCountdown, setCrashCountdown] = useState<number | null>(null);
  const crashTimerRef = useRef<any>(null);
  const lastCrashTimeRef = useRef<number>(0);

  // DYNAMIC PHYSICS METRICS
  const [liveRPM, setLiveRPM] = useState<number>(0);
  const [kineticEnergyJoules, setKineticEnergyJoules] = useState<number>(0);
  
  // --- HARDWARE SENSOR STATES ---
  const [magFieldLoad, setMagFieldLoad] = useState<number>(0);
  const [magBaseline, setMagBaseline] = useState<number>(0); 
  const [magAmplifier, setMagAmplifier] = useState<number>(15); 
  const [magFluxDelta, setMagFluxDelta] = useState<number>(0);
  const [leanAngle, setLeanAngle] = useState<number>(0);
  const [pitchAngle, setPitchAngle] = useState<number>(0);
  const [hardwareGForce, setHardwareGForce] = useState<number>(0);
  const [roadJitter, setRoadJitter] = useState<number>(0);
  const [ambientLux, setAmbientLux] = useState<number>(0);
  const [ambientPressure, setAmbientPressure] = useState<number>(0);
  const [autoNightMode, setAutoNightMode] = useState<boolean>(false);
  const [proximityDistance, setProximityDistance] = useState<number | null>(null);
  
  const [hardBrakeCount, setHardBrakeCount] = useState<number>(0);
  const [suspensionBumps, setSuspensionBumps] = useState<number>(0);
  const [maxLateralG, setMaxLateralG] = useState<number>(0);
  const [trueNorthStatus, setTrueNorthStatus] = useState<string>("Hardware Mag Lock");

  const [rotRate, setRotRate] = useState({ x: 0, y: 0, z: 0 });
  const [gravVector, setGravVector] = useState({ x: 0, y: 0, z: 0 });
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [networkType, setNetworkType] = useState<string>("Scanning...");
  const [networkPing, setNetworkPing] = useState<number>(0);
  const [aeroDragForce, setAeroDragForce] = useState<number>(0);

  const [audioWarnings, setAudioWarnings] = useState<boolean>(true);
  const [audioThrottleInterval, setAudioThrottleInterval] = useState<number>(3000); 
  const [visualGForceAlerts, setVisualGForceAlerts] = useState<boolean>(true);
  const audioCtxRef = useRef<any>(null);
  const lastBeepTimeRef = useRef<number>(0);

  const [sensorsUnlocked, setSensorsUnlocked] = useState<boolean>(false);
  const [gyroOffset, setGyroOffset] = useState<{ pitch: number, lean: number }>({ pitch: 0, lean: 0 });
  const [configTab, setConfigTab] = useState<"display" | "sensors" | "preferences">("display");
  
  const [liveGradePercent, setLiveGradePercent] = useState(0);
  const [tripAhConsumed, setTripAhConsumed] = useState(0);
  const [sagVoltage, setSagVoltage] = useState(48);
  const [instantWhPerMile, setInstantWhPerMile] = useState(0);

  const [estMotorTemp, setEstMotorTemp] = useState(75);
  const [estStatorTemp, setEstStatorTemp] = useState(75);
  const [estRotorTemp, setEstRotorTemp] = useState(75);
  const [thermalThrottlingActive, setThermalThrottlingActive] = useState(false);
  const [thermalRunawayIndex, setThermalRunawayIndex] = useState(0);

  const [batteryHealthSOH, setBatteryHealthSOH] = useState(100);
  const [liveInternalResistance, setLiveInternalResistance] = useState(0.12);

  const [regenEnergyHarvestedWh, setRegenEnergyHarvestedWh] = useState(0);
  const [bonusRegenMiles, setBonusRegenMiles] = useState(0);

  const [tireDeflationAnomaly, setTireDeflationAnomaly] = useState(false);
  const [terrainClassifier, setTerrainClassifier] = useState<string>("Smooth Asphalt");
  const [motorEfficiencyPct, setMotorEfficiencyPct] = useState<number>(88);
  const [optimalCruiseSpeed, setOptimalCruiseSpeed] = useState<number>(18);
  const [topographyRangeImpact, setTopographyRangeImpact] = useState<number>(0);
  const [pilotRiskIndex, setPilotRiskIndex] = useState<number>(0);
  const [liveWaveform, setLiveWaveform] = useState<{ speed: number; power: number }[]>(Array(40).fill({ speed: 0, power: 0 }));
  const [historicalAiAnalysis, setHistoricalAiAnalysis] = useState<Record<string, string>>({});
  const [isFetchingHistoricalAi, setIsFetchingHistoricalAi] = useState<string | null>(null);

  const sensorRefs = useRef({ 
    lean: 0, pitch: 0, gForce: 0, jitter: 0, mag: 0, magDelta: 0, lux: 0, baro: 0, prox: null as number | null, 
    rawHeading: 0, targetHeading: 0, smoothedHeading: 0, heading: 0, trueNorthStatus: "Hardware Mag Lock",
    rot: {x:0, y:0, z:0}, grav: {x:0, y:0, z:0}, rtt: 0, netType: "Offline"
  });
  const weatherDataRef = useRef<any>(null);
  const lastAltRef = useRef<number>(0);
  const lastSpeedRef = useRef<number>(0);
  const smoothedSpeedRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const elevationGainRef = useRef<number>(0);
  const peakWattsRef = useRef<number>(0);
  const peakAmpsRef = useRef<number>(0);
  const maxGForceRef = useRef<number>(0);
  const maxGradeRef = useRef<number>(0);
  const maxLeanRef = useRef<number>(0);
  const minVoltageRef = useRef<number>(999);
  const rideStartBatteryRef = useRef<number>(100);
  const rideStartTimeRef = useRef<string>("");
  const lastFetchedCoordsRef = useRef<{lat: number, lng: number} | null>(null);
  const lastHeadingRef = useRef<number | null>(null);
  const routeLogRef = useRef<{lat: number, lng: number}[]>([]); 

  const brakeCountRef = useRef<number>(0);
  const bumpCountRef = useRef<number>(0);
  const maxLatGRef = useRef<number>(0);
  const lastBrakeTimeRef = useRef<number>(0);

  const [showSettings, setShowSettings] = useState(false);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [isDayMode, setIsDayMode] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeColor>('rural');
  const [useMetric, setUseMetric] = useState<boolean>(false);
  
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

  const [batteryPercent, setBatteryPercent] = useState<number>(100);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(48);
  const [peakVoltage, setPeakVoltage] = useState<number | null>(null);
  const [batteryCapacity, setBatteryCapacity] = useState<number>(15);
  const [tirePsi, setTirePsi] = useState<number>(35);
  const [motorWattage, setMotorWattage] = useState<number>(1000);
  const [controllerAmps, setControllerAmps] = useState<number>(25);
  const [estimatedRange, setEstimatedRange] = useState<number>(0);
  const [estimatedTimeRemain, setEstimatedTimeRemain] = useState<number>(0);

  const [weatherInput, setWeatherInput] = useState("");
  const [savedLocationName, setSavedLocationName] = useState("Awaiting Location...");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [rideSafetyRating, setRideSafetyRating] = useState<{text: string, color: string}>({text: "Analyzing...", color: "text-zinc-500"});
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  const configRefs = useRef({
    wheelSize, aeroProfile, towingTrailer, riderWeight, powerMode, regenEfficiency, 
    controllerAmps, batteryVoltage, peakVoltage, cutoffVoltage, batteryPercent,
    gpsSmoothing, magAmplifier, magBaseline, tireFriction, brakeSensitivity, useMetric,
    isTracking, gyroOffset
  });
  const dynamicRefs = useRef({ currentAmps: 0 });

  useEffect(() => {
    configRefs.current = {
      wheelSize, aeroProfile, towingTrailer, riderWeight, powerMode, regenEfficiency, 
      controllerAmps, batteryVoltage, peakVoltage, cutoffVoltage, batteryPercent,
      gpsSmoothing, magAmplifier, magBaseline, tireFriction, brakeSensitivity, useMetric,
      isTracking, gyroOffset
    };
  }, [wheelSize, aeroProfile, towingTrailer, riderWeight, powerMode, regenEfficiency, controllerAmps, batteryVoltage, peakVoltage, cutoffVoltage, batteryPercent, gpsSmoothing, magAmplifier, magBaseline, tireFriction, brakeSensitivity, useMetric, isTracking, gyroOffset]);

  useEffect(() => { dynamicRefs.current.currentAmps = currentAmps; }, [currentAmps]);
  useEffect(() => { weatherDataRef.current = weatherData; }, [weatherData]);

  const getCalibratedLean = () => Math.abs(leanAngle - gyroOffset.lean);
  const getDynamicEMF = () => Math.max(0, (magFieldLoad - magBaseline) * magAmplifier);

  const getTheme = () => {
    if (isNightVision) return { text: 'text-rose-600', bg: 'bg-rose-700', border: 'border-rose-900', shadow: '', dim: 'bg-rose-950/20 text-rose-500', hex: '#be123c', hover: 'group-hover:text-rose-400' };
    const baseTheme = theme;
    const themes: any = {
      rural: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14]', hex: '#39ff14', hover: 'group-hover:text-[#39ff14]' },
      lime: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14]', hex: '#39ff14', hover: 'group-hover:text-[#39ff14]' },
      cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', dim: 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50', hex: '#06b6d4', hover: 'group-hover:text-cyan-300' },
      emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', dim: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50', hex: '#10b981', hover: 'group-hover:text-emerald-300' },
      amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', dim: 'bg-amber-950/30 text-amber-400 border-amber-900/50', hex: '#f59e0b', hover: 'group-hover:text-amber-300' },
      rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', dim: 'bg-rose-950/30 text-rose-400 border-rose-900/50', hex: '#f43f5e', hover: 'group-hover:text-rose-300' },
      purple: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500', shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', dim: 'bg-purple-950/30 text-purple-400 border-purple-900/50', hex: '#a855f7', hover: 'group-hover:text-purple-300' },
      void: { text: 'text-white', bg: 'bg-zinc-800', border: 'border-zinc-500', shadow: 'shadow-[0_0_20px_rgba(255,255,255,0.1)]', dim: 'bg-zinc-900/50 text-white border-zinc-700/50', hex: '#ffffff', hover: 'group-hover:text-zinc-300' }
    };
    return themes[baseTheme] || themes.rural;
  };
  const t = getTheme();

  const bgBase = isDayMode ? "bg-zinc-200" : (isNightVision ? "bg-[#050000]" : "bg-[#06060a]");
  const bgPanel = isDayMode ? "bg-white border-zinc-300 shadow-md" : (isNightVision ? "bg-[#1a0000] border-rose-900" : "bg-[#0d0e15] border-zinc-900");
  const bgCard = isDayMode ? "bg-zinc-50 border-zinc-200" : "bg-black/60 border-zinc-800/80";
  const bgInput = isDayMode ? "bg-white border-zinc-300 text-zinc-900" : "bg-black border-zinc-800 text-white";
  const bgList = isDayMode ? "bg-zinc-100 border-zinc-300" : "bg-[#121318] border-zinc-800";
  const txtMain = isDayMode ? "text-zinc-900" : "text-white";
  const txtMuted = isDayMode ? "text-zinc-500" : "text-zinc-400";
  const brd = isDayMode ? "border-zinc-300" : "border-zinc-800";
  const uiConfig = { t, bgBase, bgPanel, bgCard, bgInput, bgList, txtMain, txtMuted, brd };

  const safeRides = Array.isArray(savedRides) ? savedRides : [];

  const handleSaveCurrentPevProfile = () => {
    triggerHaptic();
    const profileName = customVehicleName.trim() || vehicleModel || "Custom PEV";
    const newProfile = {
      id: Date.now().toString(),
      name: profileName,
      type: pevType,
      wheels: wheelSize,
      ah: batteryCapacity,
      volts: batteryVoltage,
      peak: peakVoltage || (batteryVoltage * 1.166),
      watts: motorWattage,
      amps: controllerAmps
    };
    try {
      const existing = JSON.parse(localStorage.getItem("rural_saved_pev_profiles") || "[]");
      const updatedProfiles = [...existing, newProfile];
      localStorage.setItem("rural_saved_pev_profiles", JSON.stringify(updatedProfiles));
      setSavedPevProfiles(updatedProfiles);
      alert(`PEV Profile "${profileName}" saved to fleet memory!`);
    } catch(e) {
      alert("Failed to save PEV profile.");
    }
  };

  const handleLoadPevProfile = (profile: any) => {
    triggerHaptic();
    setCustomVehicleName(profile.name);
    setVehicleModel(profile.name);
    setPevType(profile.type);
    setWheelSize(profile.wheels);
    setBatteryCapacity(profile.ah);
    setBatteryVoltage(profile.volts);
    setPeakVoltage(profile.peak);
    setMotorWattage(profile.watts);
    setControllerAmps(profile.amps);
  };

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch (e) {}
  };

  // --- EXCLUSIVE 100% PURE MAGNETIC COMPASS & MOTION SENSORS ---
  useEffect(() => {
    if (!mounted) return;

    const handleOrientation = (e: any) => {
      if (e.gamma !== null && e.gamma !== undefined) {
        const lean = Math.round(e.gamma);
        sensorRefs.current.lean = lean;
        const calibratedLean = Math.abs(lean - configRefs.current.gyroOffset.lean);
        if (configRefs.current.isTracking && calibratedLean > Math.abs(maxLeanRef.current)) {
          maxLeanRef.current = calibratedLean;
        }
      }
      if (e.beta !== null && e.beta !== undefined) {
         sensorRefs.current.pitch = Math.round(e.beta);
      }

      let rawMagneticHeading: number | null = null;
      if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null && !isNaN(e.webkitCompassHeading)) {
         rawMagneticHeading = Math.round(e.webkitCompassHeading);
         sensorRefs.current.trueNorthStatus = "Raw Magnetic Field Lock";
      } else if (e.absolute && e.alpha !== null && e.alpha !== undefined) {
         rawMagneticHeading = Math.round((360 - e.alpha) % 360);
         sensorRefs.current.trueNorthStatus = "Absolute Magnetic Array";
      } 

      if (rawMagneticHeading !== null) {
         sensorRefs.current.rawHeading = rawMagneticHeading;
         sensorRefs.current.targetHeading = rawMagneticHeading;

         let current = sensorRefs.current.smoothedHeading;
         let delta = rawMagneticHeading - current;
         while (delta < -180) delta += 360;
         while (delta > 180) delta -= 360;

         const newSmoothed = (current + delta * 0.35 + 360) % 360;
         sensorRefs.current.smoothedHeading = newSmoothed;
         sensorRefs.current.heading = Math.round(newSmoothed);
      }
    };

    const handleMotion = (e: any) => {
      if (e.acceleration && e.acceleration.y !== null && e.acceleration.z !== null && e.acceleration.x !== null) {
        const ax = e.acceleration.x || 0;
        const ay = e.acceleration.y || 0;
        const az = e.acceleration.z || 0;
        const gVector = Math.sqrt(ax*ax + ay*ay + az*az) / 9.81;
        const latG = Math.abs(ax) / 9.81;
        sensorRefs.current.gForce = gVector;

        if (configRefs.current.isTracking) {
          if (latG > maxLatGRef.current) maxLatGRef.current = latG;

          const zJitter = Math.abs(az - 9.81); 
          if (zJitter > 1.5) {
             sensorRefs.current.jitter = (sensorRefs.current.jitter * 0.8) + (zJitter * 0.2); 
             if (zJitter > 3.0) bumpCountRef.current += 1;
          } else {
             sensorRefs.current.jitter *= 0.95;
          }

          const currentLean = Math.abs(sensorRefs.current.lean - configRefs.current.gyroOffset.lean);
          
          if (gVector > 8.5 && currentLean > 50) {
            const now = Date.now();
            if (now - lastCrashTimeRef.current > 30000 && !isCrashAlertActive) {
              lastCrashTimeRef.current = now;
              setIsCrashAlertActive(true);
              setCrashCountdown(15);
              triggerHaptic();
            }
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
      window.addEventListener('devicemotion', handleMotion, true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
        window.removeEventListener('deviceorientation', handleOrientation, true);
        window.removeEventListener('devicemotion', handleMotion, true);
      }
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (isTracking) {
         alert("CRITICAL: Cannot exit application while active Telemetry Tracking is running. End your mission run first.");
      } else if (canGoBack) {
         window.history.back();
      } else {
         CapApp.exitApp();
      }
    });
    return () => { backListener.then(l => l.remove()); };
  }, [isTracking, mounted]);

  const handleThemeChange = (newTheme: ThemeColor) => {
    triggerHaptic();
    setTheme(newTheme);
    setIsNightVision(false);
    setIsDayMode(false);
    window.dispatchEvent(new Event('theme-sync'));
  };

  const toggleSunVisibility = async () => {
    triggerHaptic();
    const newVal = !isDayMode;
    setIsDayMode(newVal);
    if (newVal) {
      setIsNightVision(false);
      setAutoNightMode(false);
    }
    try {
      if (newVal) {
        await ScreenBrightness.setBrightness({ brightness: 1.0 }); 
      } else {
        await ScreenBrightness.setBrightness({ brightness: -1 }); 
      }
    } catch (e) {}
  };

  useEffect(() => {
    setMounted(true);
    
    const handleThemeSync = () => {
      const savedTheme = (localStorage.getItem("rural_theme") || localStorage.getItem("rt_theme") || 'rural') as ThemeColor;
      setTheme(savedTheme);
      setIsNightVision(localStorage.getItem("rt_night_vision") === "true");
      setIsDayMode(localStorage.getItem("rt_day_mode") === "true");
    };

    window.addEventListener('theme-sync', handleThemeSync);
    window.addEventListener('storage', handleThemeSync);
    
    setIsNightVision(localStorage.getItem("rt_night_vision") === "true");
    setIsDayMode(localStorage.getItem("rt_day_mode") === "true");
    setTheme((localStorage.getItem("rt_theme") as ThemeColor) || 'rural');
    setUseMetric(localStorage.getItem("rt_use_metric") === "true");
    setHudStyle((localStorage.getItem("rt_hud_style") as any) || "digital");
    setGpsSmoothing((localStorage.getItem("rt_gps_smooth") as any) || "Balanced");
    setSpeedLimitPolling((localStorage.getItem("rt_speed_polling") as any) || "Aggressive");
    setAutoWakeSpeed(Number(localStorage.getItem("rt_auto_wake")) || 10);
    setBatteryChemistry(localStorage.getItem("rt_battery_chem") || "Li-Ion");
    setHudFontColor(localStorage.getItem("rt_hud_font_color") || "#39ff14");
    
    setGhostMode(localStorage.getItem("radar_ghost_mode") === "true");
    setRadarRadius(parseInt(localStorage.getItem("radar_scan_radius") || "50"));
    setAiPersona(localStorage.getItem("copilot_persona") || "copilot");
    setAutoNightMode(localStorage.getItem("rt_auto_night") === "true");
    setAudioWarnings(localStorage.getItem("rt_audio_warn") !== "false");
    setAudioThrottleInterval(Number(localStorage.getItem("rt_audio_throttle")) || 3000);
    setVisualGForceAlerts(localStorage.getItem("rt_visual_gforce") !== "false");

    setWheelSize(Number(localStorage.getItem("rural_wheel_size")) || 10);
    setMotorTopology(localStorage.getItem("rural_motor_topology") || "Direct Drive Hub");
    setBatteryTopology(localStorage.getItem("rural_battery_topology") || "14S 4P");

    try {
      const gOff = localStorage.getItem("rt_gyro_offset");
      if (gOff) setGyroOffset(JSON.parse(gOff));
    } catch(e) {}

    try {
      const profiles = JSON.parse(localStorage.getItem("rural_saved_pev_profiles") || "[]");
      setSavedPevProfiles(Array.isArray(profiles) ? profiles : []);
    } catch(e) {}

    const savedBaseZone = localStorage.getItem("rt_base_zone") || "";
    setBaseZone(savedBaseZone);
    setBatteryVoltage(Number(localStorage.getItem("rural_pev_voltage")) || 48);
    setMagAmplifier(Number(localStorage.getItem("rural_mag_amp")) || 15);
    setMagBaseline(Number(localStorage.getItem("rural_mag_baseline")) || 0);
    setAeroProfile((localStorage.getItem("rural_aero_profile") as any) || "Standing");
    setSuspensionType((localStorage.getItem("rural_suspension") as any) || "Full Suspension");
    
    const savedPeak = localStorage.getItem("rural_pev_peak_voltage");
    if (savedPeak) setPeakVoltage(Number(savedPeak));
    
    const savedPsi = localStorage.getItem("rural_pev_tire_psi");
    if (savedPsi) setTirePsi(Number(savedPsi));
    
    setBatteryCapacity(Number(localStorage.getItem("rural_pev_capacity")) || 15);
    setMotorWattage(Number(localStorage.getItem("rural_pev_wattage")) || 1000);
    setControllerAmps(Number(localStorage.getItem("rural_pev_amps")) || 25);
    
    setRiderWeight(Number(localStorage.getItem("rt_rider_weight")) || 200);
    setRegenEfficiency(Number(localStorage.getItem("rt_regen_eff")) || 15);
    setBrakeSensitivity(Number(localStorage.getItem("rt_brake_sens")) || 3.5);
    setSpeedGovernor(Number(localStorage.getItem("rt_speed_gov")) || 30);
    setEnableGovernor(localStorage.getItem("rt_enable_gov") === "true");
    setTireFriction(localStorage.getItem("rt_tire_friction") || "Street");
    setTelemetryRate(Number(localStorage.getItem("rt_telemetry_rate")) || 1000);

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

    return () => {
      window.removeEventListener('theme-sync', handleThemeSync);
      window.removeEventListener('storage', handleThemeSync);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("rt_night_vision", isNightVision ? "true" : "false");
    localStorage.setItem("rt_day_mode", isDayMode ? "true" : "false");
    localStorage.setItem("rt_auto_night", autoNightMode ? "true" : "false");
    localStorage.setItem("rt_audio_warn", audioWarnings ? "true" : "false");
    localStorage.setItem("rt_audio_throttle", audioThrottleInterval.toString());
    localStorage.setItem("rt_visual_gforce", visualGForceAlerts ? "true" : "false");
    localStorage.setItem("rt_theme", theme);
    localStorage.setItem("rural_theme", theme);
    localStorage.setItem("copilot_theme", theme);
    localStorage.setItem("universal_brand_theme", theme);
    localStorage.setItem("rt_use_metric", useMetric ? "true" : "false");
    localStorage.setItem("rt_hud_style", hudStyle);
    localStorage.setItem("rt_hud_font_color", hudFontColor);
    localStorage.setItem("rt_gps_smooth", gpsSmoothing);
    localStorage.setItem("rt_speed_polling", speedLimitPolling);
    localStorage.setItem("rt_auto_wake", autoWakeSpeed.toString());
    localStorage.setItem("rt_battery_chem", batteryChemistry);
    localStorage.setItem("rt_gyro_offset", JSON.stringify(gyroOffset));
    
    localStorage.setItem("rural_wheel_size", wheelSize.toString());
    localStorage.setItem("rural_motor_topology", motorTopology);
    localStorage.setItem("rural_battery_topology", batteryTopology);

    if (peakVoltage) localStorage.setItem("rural_pev_peak_voltage", peakVoltage.toString());
    localStorage.setItem("rural_pev_tire_psi", tirePsi.toString());
    localStorage.setItem("rural_mag_amp", magAmplifier.toString());
    localStorage.setItem("rural_mag_baseline", magBaseline.toString());
    localStorage.setItem("rural_aero_profile", aeroProfile);
    localStorage.setItem("rural_suspension", suspensionType);

    localStorage.setItem("radar_scan_radius", radarRadius.toString());
    localStorage.setItem("radar_ghost_mode", ghostMode ? "true" : "false");
    localStorage.setItem("rt_privacy_mode", ghostMode ? "true" : "false");
    localStorage.setItem("copilot_persona", aiPersona);

    localStorage.setItem("rt_base_zone", baseZone);
    localStorage.setItem("rt_rider_weight", riderWeight.toString());
    localStorage.setItem("rt_regen_eff", regenEfficiency.toString());
    localStorage.setItem("rt_brake_sens", brakeSensitivity.toString());
    localStorage.setItem("rt_speed_gov", speedGovernor.toString());
    localStorage.setItem("rt_enable_gov", enableGovernor ? "true" : "false");
    localStorage.setItem("rt_tire_friction", tireFriction);
    localStorage.setItem("rt_telemetry_rate", telemetryRate.toString());
    localStorage.setItem("radar_telemetry_interval", telemetryRate.toString());
  }, [mounted, isNightVision, isDayMode, autoNightMode, audioWarnings, audioThrottleInterval, visualGForceAlerts, theme, useMetric, radarRadius, ghostMode, aiPersona, baseZone, riderWeight, regenEfficiency, brakeSensitivity, speedGovernor, enableGovernor, tireFriction, telemetryRate, hudStyle, hudFontColor, peakVoltage, tirePsi, gyroOffset, gpsSmoothing, magAmplifier, magBaseline, aeroProfile, suspensionType, wheelSize, motorTopology, batteryTopology]);

  useEffect(() => {
    if (!mounted || !activeUpdate?.lat || !activeUpdate?.lng) return;
    const currentLat = activeUpdate.lat;
    const currentLng = activeUpdate.lng;
    const currentHeading = activeUpdate.heading || sensorRefs.current.heading || 0;

    let shouldFetch = false;

    if (lastFetchedCoordsRef.current) {
      const R = 3958.8;
      const dLat = ((currentLat - lastFetchedCoordsRef.current.lat) * Math.PI) / 180;
      const dLon = ((currentLng - lastFetchedCoordsRef.current.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lastFetchedCoordsRef.current.lat * Math.PI) / 180) * Math.cos((currentLat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      let distThreshold = 0.05; 
      let turnThreshold = 40; 
      
      if (speedLimitPolling === "Aggressive") {
        distThreshold = 0.01; 
        turnThreshold = 20; 
      } else if (speedLimitPolling === "Eco") {
        distThreshold = 0.15; 
        turnThreshold = 60;
      }

      if (dist >= distThreshold) shouldFetch = true;

      if (lastHeadingRef.current !== null && dist > 0.005) {
        let headingDiff = Math.abs(currentHeading - lastHeadingRef.current);
        if (headingDiff > 180) headingDiff = 360 - headingDiff; 
        if (headingDiff > turnThreshold) shouldFetch = true;
      }
    } else {
      shouldFetch = true;
    }

    if (!shouldFetch) return;

    lastFetchedCoordsRef.current = { lat: currentLat, lng: currentLng };
    lastHeadingRef.current = currentHeading;
    setIsFetchingSpeedLimit(true);

    const fetchRealSpeedLimit = async () => {
      try {
        let foundLimit: number | null = null;
        let routeType = "Live Web Route";
        let schoolZoneDetected = false;
        let detectedStreet = "";

        const tomtomKey = import.meta.env.VITE_TOMTOM_API_KEY;

        const parseSpeedTag = (tagVal: string) => {
           if (!tagVal) return null;
           const lower = tagVal.toLowerCase();
           if (lower === "none" || lower === "unrestricted") return useMetric ? 130 : 80;
           if (lower === "walk" || lower.includes("pedestrian")) return useMetric ? 10 : 5;
           
           const match = lower.match(/(\d+)/);
           if (!match) return null;
           const num = parseInt(match[1], 10);
           
           const isKmh = lower.includes("km") || lower.includes("kph");
           const isMph = lower.includes("mp") || lower.includes("mph");
           
           if (useMetric && isMph) return Math.round(num * 1.609);
           if (!useMetric && isKmh) return Math.round(num / 1.609);
           return num; 
        };

        if (tomtomKey) {
           try {
             const ttUrl = `https://api.tomtom.com/search/2/reverseGeocode/${currentLat},${currentLng}.json?key=${tomtomKey}&returnSpeedLimit=true&radius=20`;
             const ttRes = await fetch(ttUrl, { signal: AbortSignal.timeout(3000) });
             if (ttRes.ok) {
                const ttData = await ttRes.json();
                if (ttData?.addresses && ttData.addresses.length > 0) {
                   const addr = ttData.addresses[0].address;
                   if (addr.streetName) detectedStreet = `${addr.streetName} • ${addr.municipality || addr.countrySubdivision || "USA"}`;
                   if (addr.speedLimit) foundLimit = parseSpeedTag(addr.speedLimit);
                   if (foundLimit) {
                      if (foundLimit > 55) routeType = "motorway";
                      else if (foundLimit > 35) routeType = "primary";
                      else routeType = "residential";
                   }
                }
             }
           } catch (e) {}
        }

        if (!foundLimit || !detectedStreet) {
            const query = `[out:json][timeout:5];(way(around:20,${currentLat},${currentLng})["highway"];way(around:20,${currentLat},${currentLng})["maxspeed"];way(around:20,${currentLat},${currentLng})["maxspeed:advisory"];way(around:30,${currentLat},${currentLng})["zone:maxspeed"];node(around:50,${currentLat},${currentLng})["amenity"="school"];way(around:50,${currentLat},${currentLng})["amenity"="school"];);out tags;`;
            const endpoints = [
              `https://nominatim.openstreetmap.org/reverse?format=json&extratags=1&addressdetails=1&lat=${currentLat}&lon=${currentLng}`,
              `https://geocode.maps.co/reverse?lat=${currentLat}&lon=${currentLng}`,
              "https://overpass-api.de/api/interpreter"
            ];

            for (const endpoint of endpoints) {
              try {
                if (endpoint.includes("reverse") || endpoint.includes("geocode")) {
                   const res = await fetch(endpoint, { signal: AbortSignal.timeout(3000) });
                   if (res.ok) {
                      const nomData = await res.json();
                      if (!detectedStreet && (nomData?.address || nomData?.locality)) {
                         const addr = nomData.address || {};
                         const roadName = addr.road || addr.pedestrian || nomData.name || "";
                         let geoTags = [];
                         if (addr.city || addr.town || addr.village) geoTags.push(addr.city || addr.town || addr.village);
                         if (addr.state) geoTags.push(addr.state);
                         if (roadName && geoTags.length > 0) detectedStreet = `${roadName} • ${geoTags.join(", ")}`;
                         else if (roadName) detectedStreet = roadName;
                      }
                      if (nomData?.extratags) {
                        const speedStr = nomData.extratags.maxspeed || nomData.extratags["zone:maxspeed"];
                        if (speedStr && !foundLimit) foundLimit = parseSpeedTag(speedStr);
                        if (nomData.extratags.highway) routeType = nomData.extratags.highway;
                      }
                   }
                } else {
                   const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(3000) });
                   if (res.ok) {
                     const data = await res.json();
                     if (data?.elements && data.elements.length > 0) {
                        for (const el of data.elements) {
                          if (el.tags && (el.tags.amenity === "school" || el.tags.school)) schoolZoneDetected = true;
                          if (el.tags && !foundLimit) {
                             const speedTag = el.tags.maxspeed || el.tags["zone:maxspeed"];
                             if (speedTag) foundLimit = parseSpeedTag(speedTag);
                             if (el.tags.highway) routeType = el.tags.highway;
                          }
                        }
                     }
                     if (foundLimit || schoolZoneDetected) break; 
                   }
                }
              } catch (e) { continue; }
            }
        }

        setIsSchoolZone(schoolZoneDetected);
        setCurrentStreet(detectedStreet || "Unmapped Infrastructure");

        const typeMap: Record<string, string> = {
           motorway: "Interstate / Motorway", trunk: "State Highway",
           primary: "Primary Arterial Route", secondary: "Secondary City Road",
           residential: "Residential Street", living_street: "Shared Living Street"
        };
        const uiRoadType = typeMap[routeType] || (routeType !== "Live Web Route" ? routeType.charAt(0).toUpperCase() + routeType.slice(1) : "Live GPS Track");

        if (schoolZoneDetected) {
          setLiveSpeedLimit(useMetric ? 24 : 15);
          setCurrentRoadType("Active School Zone");
        } else {
          setCurrentRoadType(uiRoadType);
          setLiveSpeedLimit(foundLimit || 0);
        }
      } catch (err) {
        setLiveSpeedLimit(0);
        setCurrentRoadType("Live GPS Track");
      } finally {
        setIsFetchingSpeedLimit(false);
      }
    };

    fetchRealSpeedLimit();
  }, [activeUpdate?.lat, activeUpdate?.lng, useMetric]);

  useEffect(() => {
     if (!isTracking || !audioWarnings) return;
     const currentVelocity = displaySpeed * (useMetric ? 1.609 : 1);
     const maxLimit = enableGovernor ? speedGovernor : liveSpeedLimit;
     
     if (maxLimit > 0 && currentVelocity > maxLimit) {
         const now = Date.now();
         if (now - lastBeepTimeRef.current < audioThrottleInterval) return;
         lastBeepTimeRef.current = now;

         try {
           if (!audioCtxRef.current) {
               const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
               if (AudioCtx) audioCtxRef.current = new AudioCtx();
           }
           const ctx = audioCtxRef.current;
           if (ctx && ctx.state === 'suspended') ctx.resume();
           if (ctx) {
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             osc.type = "square";
             osc.frequency.setValueAtTime(880, ctx.currentTime);
             gain.gain.setValueAtTime(0.1, ctx.currentTime);
             osc.connect(gain);
             gain.connect(ctx.destination);
             osc.start();
             osc.stop(ctx.currentTime + 0.15);
           }
         } catch(e) {}
     }
  }, [displaySpeed, enableGovernor, speedGovernor, liveSpeedLimit, isTracking, audioWarnings, useMetric, audioThrottleInterval]);

  const requestSensorPermissions = async () => {
    // @ts-ignore
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        // @ts-ignore
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') setSensorsUnlocked(true);
        else alert("Sensor access denied.");
      } catch (error) {}
    } else {
      setSensorsUnlocked(true);
    }
  };

  const calibrateIMU = () => {
     triggerHaptic();
     setGyroOffset({ pitch: pitchAngle + gyroOffset.pitch, lean: leanAngle + gyroOffset.lean });
     alert("IMU Calibrated.");
  };

  const calibrateEMF = () => {
     triggerHaptic();
     setMagBaseline(magFieldLoad);
     alert(`EMF Zeroed to ${Math.round(magFieldLoad)}µT.`);
  };

  useEffect(() => {
    if (!isCrashAlertActive || crashCountdown === null) return;
    if (crashCountdown === 0) {
      setIsCrashAlertActive(false);
      setCrashCountdown(null);
      handleSOSDispatch();
      return;
    }
    crashTimerRef.current = setTimeout(() => {
      setCrashCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => { if (crashTimerRef.current) clearTimeout(crashTimerRef.current); };
  }, [isCrashAlertActive, crashCountdown]);

  const cancelCrashAlert = () => {
    triggerHaptic();
    setIsCrashAlertActive(false);
    setCrashCountdown(null);
    if (crashTimerRef.current) clearTimeout(crashTimerRef.current);
  };

  useEffect(() => {
    let interval: any;
    if (sensorsUnlocked || isTracking || mounted) {
       interval = setInterval(() => {
          setLeanAngle(sensorRefs.current.lean);
          setPitchAngle(sensorRefs.current.pitch);
          setHardwareGForce(sensorRefs.current.gForce);
          setRoadJitter(sensorRefs.current.jitter);
          setMagFieldLoad(sensorRefs.current.mag);
          setMagFluxDelta(sensorRefs.current.magDelta);
          setRotRate(sensorRefs.current.rot);
          setGravVector(sensorRefs.current.grav);
          setProximityDistance(sensorRefs.current.prox);
          setNetworkPing(sensorRefs.current.rtt);
          setNetworkType(sensorRefs.current.netType);
          setHardBrakeCount(brakeCountRef.current);
          setSuspensionBumps(bumpCountRef.current);
          setMaxLateralG(maxLatGRef.current);
          setCompassHeading(sensorRefs.current.heading);
          setTrueNorthStatus(sensorRefs.current.trueNorthStatus);

          if (sensorRefs.current.lux > 0) setAmbientLux(sensorRefs.current.lux);
          if (sensorRefs.current.baro > 0) setAmbientPressure(sensorRefs.current.baro);

          if (weatherDataRef.current?.current) {
             const windDir = weatherDataRef.current.current.wind_direction_10m || 0;
             const windSpd = weatherDataRef.current.current.wind_speed_10m || 0;
             const angleDiffRad = (windDir - sensorRefs.current.heading) * (Math.PI / 180);
             setEffectiveHeadwind(Math.cos(angleDiffRad) * windSpd);
          }
       }, 200); 
    }
    return () => clearInterval(interval);
  }, [sensorsUnlocked, isTracking, mounted]);

  useEffect(() => {
    if (!autoNightMode) return;
    let isNight = false;
    if (ambientLux > 0) {
      if (ambientLux < 15) isNight = true;
      else if (ambientLux > 60) isNight = false;
      else return;
    } else {
      if (weatherData?.daily?.sunrise?.[0] && weatherData?.daily?.sunset?.[0]) {
         const now = new Date().getTime();
         const sunrise = new Date(weatherData.daily.sunrise[0]).getTime();
         const sunset = new Date(weatherData.daily.sunset[0]).getTime();
         isNight = now < sunrise || now > sunset;
      } else {
         const currentHour = new Date().getHours();
         isNight = currentHour >= 18 || currentHour <= 6;
      }
    }

    setIsNightVision(prev => {
      if (prev !== isNight) {
        setIsDayMode(!isNight);
        return isNight;
      }
      return prev;
    });
  }, [ambientLux, autoNightMode, weatherData]);

  useEffect(() => {
    if (!mounted) return;

    const handleLocationUpdate = (update: any) => {
        if (!update) return;
        setActiveUpdate(update);

        const rawSpeed = safeNum(update.speed);
        let smoothed = 0;
        const isHardwareStationary = sensorRefs.current.gForce < 1.05 && sensorRefs.current.jitter < 0.2;

        if (rawSpeed < 0.8 || (isHardwareStationary && rawSpeed < 1.5)) {
            smoothed = 0.0;
        } else {
            const currentSmoothed = safeNum(smoothedSpeedRef.current);
            const speedDiff = Math.abs(rawSpeed - currentSmoothed);
            let alpha = speedDiff > 4 ? 0.4 : 0.15; 
            if (gpsSmoothing === "Strict") alpha = speedDiff > 4 ? 0.25 : 0.1;
            if (gpsSmoothing === "Loose") alpha = speedDiff > 4 ? 0.6 : 0.3;

            const calculatedSpeed = (rawSpeed * alpha) + (currentSmoothed * (1 - alpha));
            smoothed = Math.max(0, Math.round(calculatedSpeed * 10) / 10);
        }
        
        smoothedSpeedRef.current = smoothed;
        setDisplaySpeed(smoothed);

        const speedMph = useMetric ? smoothed * 0.621371 : smoothed;
        const calcRpm = Math.max(0, Math.round((speedMph * 5280 * 12) / (wheelSize * Math.PI * 60)));
        setLiveRPM(calcRpm);

        let currentlyClimbing = false;
        let currentlyDescending = false;
        let gradePercent = 0;
        
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
             gradePercent = Math.min(30, Math.max(-30, Math.round((altDiff / 10) * 100) / 10));
             setLiveGradePercent(gradePercent);
             if (gradePercent > maxGradeRef.current) maxGradeRef.current = gradePercent;
          }
          lastAltRef.current = currentAlt;
          setIsClimbing(currentlyClimbing);
          setIsDescending(currentlyDescending);

          const currentG = sensorRefs.current.gForce;
          if (currentG > 0) {
             if (currentG > maxGForceRef.current) maxGForceRef.current = currentG;
             if (currentG > 0.4) {
               setAccelForceG(currentG);
               setBrakeForceG(0);
             } else {
               setAccelForceG(0);
               setBrakeForceG(0);
             }
          }

          let aeroCdA = aeroProfile === "Crouched" ? 0.6 : aeroProfile === "Seated" ? 0.8 : 1.1; 
          if (towingTrailer) aeroCdA += 0.4;
          const velocityMs = smoothed * 0.44704;
          const airDensity = ambientPressure > 0 ? (ambientPressure * 100) / (287.05 * ((weatherData?.current?.temperature_2m || 20) + 273.15)) : 1.225;
          const newDragForce = 0.5 * airDensity * aeroCdA * Math.pow(velocityMs, 2);
          setAeroDragForce(newDragForce);
          
          const massKg = riderWeight * 0.453592;
          const ke = 0.5 * massKg * Math.pow(velocityMs, 2);
          setKineticEnergyJoules(ke);

          lastSpeedRef.current = smoothed;
          lastTimeRef.current = Date.now();
        }
        
        let activeAmps = 0;
        const dynamicMagVariance = getDynamicEMF();
        const liveFluxPickup = sensorRefs.current.magDelta * magAmplifier;

        if (smoothed >= 0.5 || dynamicMagVariance > 1.5 || liveFluxPickup > 1.5) {
          let baseDraw = (smoothed * 1.5);
          const weightFactor = riderWeight / 200;
          baseDraw *= weightFactor;

          if (powerMode === "Sport") baseDraw *= 1.4;
          if (powerMode === "Eco") baseDraw *= 0.7;
          if (currentlyClimbing) baseDraw *= 1.6; 
          if (currentlyDescending) baseDraw *= (1 - (regenEfficiency / 100));
          if (tireFriction === "Off-Road/Knobby") baseDraw *= 1.15;
          if (towingTrailer) baseDraw *= 1.45;

          let emfAmps = 0;
          const combinedMagSignal = Math.max(dynamicMagVariance, liveFluxPickup * 10);
          if (combinedMagSignal > 1.5) emfAmps = (combinedMagSignal / 150) * controllerAmps;

          const blendedAmps = Math.max(baseDraw, emfAmps);
          activeAmps = Math.min(Math.max(blendedAmps + (Math.random() * 0.3), 0.5), controllerAmps);
        }

        setCurrentAmps(activeAmps);

        const nominalV = batteryVoltage || 48;
        const maxV = peakVoltage || (nominalV * 1.166);
        const minV = cutoffVoltage || (nominalV * 0.8125);
        
        const currentRestingVolts = minV + ((maxV - minV) * (safePct(batteryPercent) / 100));
        setLiveRestingVoltage(currentRestingVolts);

        const ambientC = weatherData?.current?.temperature_2m ?? 20;
        const tempIRMultiplier = ambientC < 5 ? 1.45 : ambientC < 15 ? 1.2 : 1.0;
        const calculatedIR = 0.12 * (1 + ((100 - batteryHealthSOH) * 0.025)) * tempIRMultiplier;
        setLiveInternalResistance(calculatedIR);

        const internalResistanceDrop = activeAmps * calculatedIR;
        const dynamicSagVolts = activeAmps > 0 ? Math.max(minV, currentRestingVolts - internalResistanceDrop) : currentRestingVolts;
        setSagVoltage(dynamicSagVolts);

        if (isTracking && dynamicSagVolts < minVoltageRef.current && dynamicSagVolts > 20) {
          minVoltageRef.current = dynamicSagVolts;
          if (dynamicSagVolts < minV + 2 && batteryPercent > 30) {
            setBatteryHealthSOH(prev => Math.max(50, prev - 0.05));
          }
        }

        const liveWatts = activeAmps * dynamicSagVolts;
        const currentWhMi = smoothed > 0 ? liveWatts / smoothed : 0;
        setInstantWhPerMile(currentWhMi);

        setEstStatorTemp(prevStator => {
          const windCooling = (smoothed * 0.025) + (Math.max(0, -effectiveHeadwind) * 0.015);
          const ambientF = (ambientC * 1.8) + 32;
          
          const newStator = activeAmps > (controllerAmps * 0.5) 
            ? Math.min(235, prevStator + (activeAmps * 0.018)) 
            : (activeAmps === 0 && smoothed > 3) 
              ? Math.max(ambientF, prevStator - windCooling)
              : Math.max(ambientF, prevStator - 0.04);
          
          setEstRotorTemp(prevRotor => {
            const newRotor = activeAmps > (controllerAmps * 0.5)
              ? Math.min(200, prevRotor + (activeAmps * 0.009) - (calcRpm * 0.0001))
              : (activeAmps === 0 && smoothed > 3)
                ? Math.max(ambientF, prevRotor - (windCooling * 0.75))
                : Math.max(ambientF, prevRotor - 0.02);
            
            const blendedTemp = (newStator * 0.65) + (newRotor * 0.35);
            setEstMotorTemp(blendedTemp);
            
            if (blendedTemp > 185) setThermalThrottlingActive(true);
            else if (blendedTemp < 160) setThermalThrottlingActive(false);

            const sagStress = Math.min(40, (internalResistanceDrop / 10) * 40);
            const heatStress = Math.min(40, (Math.max(0, blendedTemp - 130) / 90) * 40);
            const loadStress = (activeAmps / (controllerAmps || 1)) * 20;
            setThermalRunawayIndex(Math.round(sagStress + heatStress + loadStress));

            return newRotor;
          });
          return newStator;
        });

        if (isTracking && (currentlyDescending || brakeForceG > 0.15)) {
          const regenAmps = (controllerAmps * (regenEfficiency / 100)) * Math.min(1.5, brakeForceG + (currentlyDescending ? 0.3 : 0));
          const stepSec = telemetryRate / 1000;
          const recoveredWh = (regenAmps * dynamicSagVolts * stepSec) / 3600;
          
          setRegenEnergyHarvestedWh(prev => {
            const updated = prev + recoveredWh;
            setBonusRegenMiles(updated / Math.max(15, currentWhMi || 25));
            return updated;
          });
        }

        const currentJitter = sensorRefs.current.jitter;
        if (currentJitter > 4.5) setTerrainClassifier("Off-Road Singletrack");
        else if (currentJitter > 2.5) setTerrainClassifier("Gravel / Dirt Trail");
        else if (currentJitter > 1.2) setTerrainClassifier("Rough Chip-Seal");
        else setTerrainClassifier("Smooth Asphalt");

        if (smoothed > 10 && Math.abs(gradePercent) < 2 && effectiveHeadwind < 6 && currentWhMi > 38) {
          setTireDeflationAnomaly(true);
        } else if (currentWhMi < 30) {
          setTireDeflationAnomaly(false);
        }

        if (smoothed > 0) {
          const mechanicalPowerWatts = (riderWeight * 0.453592) * 9.81 * (smoothed * 0.44704) * 0.05 + aeroDragForce * (smoothed * 0.44704);
          const computedEff = liveWatts > 0 ? Math.min(94, Math.max(50, Math.round((mechanicalPowerWatts / liveWatts) * 100))) : 88;
          setMotorEfficiencyPct(computedEff);
          
          const targetOptSpeed = effectiveHeadwind > 8 ? 14 : 19;
          setOptimalCruiseSpeed(useMetric ? Math.round(targetOptSpeed * 1.609) : targetOptSpeed);

          const baselineWh = useMetric ? 15 : 25; 
          const currentImpactMiles = ((batteryCapacity * dynamicSagVolts * (safePct(batteryPercent) / 100)) / Math.max(1, currentWhMi)) - ((batteryCapacity * nominalV * (safePct(batteryPercent) / 100)) / baselineWh);
          setTopographyRangeImpact(currentImpactMiles);

          const speedRisk = Math.min(40, (smoothed / Math.max(1, liveSpeedLimit || 30)) * 40);
          const leanRisk = Math.min(30, (getCalibratedLean() / 40) * 30);
          const jitterRisk = Math.min(20, (currentJitter / 4) * 20);
          const weatherRisk = (weatherData?.current?.precipitation > 0 || weatherData?.current?.wind_speed_10m > 20) ? 10 : 0;
          setPilotRiskIndex(Math.min(100, Math.round(speedRisk + leanRisk + jitterRisk + weatherRisk)));
        } else {
          setTopographyRangeImpact(0);
          setPilotRiskIndex(0);
        }

        if (isTracking) {
          if (liveWatts > peakWattsRef.current) peakWattsRef.current = liveWatts;
          if (activeAmps > peakAmpsRef.current) peakAmpsRef.current = activeAmps;
        }
    };
    
    locationService.addListener(handleLocationUpdate);
    return () => locationService.removeListener(handleLocationUpdate);
  }, [mounted, isTracking, maxSpeed, powerMode, controllerAmps, batteryVoltage, peakVoltage, cutoffVoltage, batteryPercent, riderWeight, regenEfficiency, brakeSensitivity, tireFriction, towingTrailer, useMetric, gpsSmoothing, magAmplifier, magBaseline, aeroProfile, ambientPressure, weatherData, wheelSize]);

  useEffect(() => {
    let timer: any;
    if (isTracking) {
      timer = setInterval(() => {
        const stepSec = telemetryRate / 1000;
        setElapsedSeconds(s => s + stepSec);
        
        if (smoothedSpeedRef.current >= 0.5) {
          setMovingSeconds(m => m + stepSec);
          const amps = dynamicRefs.current.currentAmps;
          setTripAhConsumed(ah => ah + ((amps * stepSec) / 3600));
          
          const isOffRoad = configRefs.current.terrain === "Trail" ? 1.3 : 1.0;
          const isHeavyLoad = amps > (configRefs.current.controllerAmps * 0.6) ? 1.2 : 1.0;
          const kgWeight = configRefs.current.riderWeight * 0.453592;
          const metValue = 3.5 * isOffRoad * isHeavyLoad; 
          const calPerSecond = (metValue * 3.5 * kgWeight / 200) / 60;
          setCaloriesBurned(c => c + (calPerSecond * stepSec));
        }

        setLiveWaveform(prev => {
          const newPoint = { 
             speed: smoothedSpeedRef.current, 
             power: dynamicRefs.current.currentAmps * configRefs.current.batteryVoltage 
          };
          return [...prev.slice(1), newPoint]; 
        });

      }, telemetryRate);
    } else { 
      setElapsedSeconds(0); 
      setMovingSeconds(0);
      setCurrentAmps(0); 
      setTripAhConsumed(0);
      setCaloriesBurned(0);
      setIsClimbing(false);
      setIsDescending(false);
      setBrakeForceG(0);
      setAccelForceG(0);
      setLiveGradePercent(0);
      elevationGainRef.current = 0;
      peakWattsRef.current = 0;
      peakAmpsRef.current = 0;
      maxGForceRef.current = 0;
      maxGradeRef.current = 0;
      maxLeanRef.current = 0;
      minVoltageRef.current = 999;
      brakeCountRef.current = 0;
      bumpCountRef.current = 0;
      maxLatGRef.current = 0;
      setDisplaySpeed(0);
      smoothedSpeedRef.current = 0;
      setLiveWaveform(Array(40).fill({ speed: 0, power: 0 })); 
    }
    return () => clearInterval(timer);
  }, [isTracking, telemetryRate]);

  const getAILearnedEfficiency = () => {
    if (!savedRides || savedRides.length === 0) return 25; 
    const relevantRides = savedRides.filter(r => r.efficiencyWhPerMile && r.efficiencyWhPerMile > 5);
    if (relevantRides.length === 0) return 25;

    let totalWh = 0;
    let totalWeight = 0;
    relevantRides.forEach((ride, idx) => {
      const weight = Math.max(0.2, 1 - (idx * 0.1)); 
      totalWh += safeNum(ride.efficiencyWhPerMile) * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalWh / totalWeight : 25;
  };

  useEffect(() => {
    const learnedWhPerMile = getAILearnedEfficiency();
    let adjustedWhPerMile = learnedWhPerMile;

    if (powerMode === "Eco") adjustedWhPerMile *= 0.85;
    if (powerMode === "Sport") adjustedWhPerMile *= 1.30;
    if (isClimbing) adjustedWhPerMile *= 1.50;
    if (towingTrailer) adjustedWhPerMile *= 1.40;

    const currentTemp = weatherData?.current?.temperature_2m;
    if (currentTemp !== undefined) {
      if (currentTemp < 0) adjustedWhPerMile *= 1.35;
      else if (currentTemp < 5) adjustedWhPerMile *= 1.20;
      else if (currentTemp < 10) adjustedWhPerMile *= 1.10;
    }

    if (effectiveHeadwind > 5) {
       adjustedWhPerMile *= (1 + ((effectiveHeadwind - 5) * 0.025));
    } else if (effectiveHeadwind < -5) {
       adjustedWhPerMile *= Math.max(0.85, 1 - (Math.abs(effectiveHeadwind) * 0.01));
    }

    let effectiveVoltage = liveRestingVoltage; 
    if (batteryChemistry === "LiFePO4") effectiveVoltage *= 0.95;
    if (batteryChemistry === "SLA") effectiveVoltage *= 0.8;

    const totalWattHours = effectiveVoltage * batteryCapacity;
    const absoluteMaxRange = totalWattHours / adjustedWhPerMile;
    const calculatedMiles = (batteryPercent / 100) * absoluteMaxRange;
    
    setEstimatedRange(calculatedMiles);
    setEstimatedTimeRemain((calculatedMiles / Math.max(1, displaySpeed || 15)) * 60); 
  }, [batteryPercent, batteryVoltage, peakVoltage, batteryCapacity, powerMode, terrain, vehicleModel, motorWattage, isClimbing, isDescending, riderWeight, regenEfficiency, tireFriction, towingTrailer, batteryChemistry, weatherData, liveRestingVoltage, effectiveHeadwind, displaySpeed, savedRides]);

  const getLiveRideScore = () => {
    if (instantWhPerMile <= 0) return "--";
    if (instantWhPerMile < 20) return "S+";
    if (instantWhPerMile < 26) return "S";
    if (instantWhPerMile < 32) return "A";
    if (instantWhPerMile < 40) return "B";
    return "C";
  };
  const liveRideScore = getLiveRideScore();

  const getAICopilotRecommendation = () => {
    if (thermalRunawayIndex > 75) {
      return { status: "CRITICAL ALERT", msg: `High thermal stress (${thermalRunawayIndex}% index). Disengage throttle to prevent cell damage.`, color: "text-rose-500 border-rose-900 animate-pulse" };
    }
    if (getCalibratedLean() > 35) {
      return { status: "TRACTION WARNING", msg: `High lean angle (${getCalibratedLean()}°). Maintain smooth throttle through apex.`, color: "text-orange-500 border-orange-900 animate-pulse" };
    }
    if (tireDeflationAnomaly) {
      return { status: "ANOMALY DETECTED", msg: "High rolling drag on flat ground. Inspect tires for low PSI or slow puncture.", color: "text-amber-500 border-amber-900 animate-pulse" };
    }
    if (aeroDragForce > 25) {
      return { status: "AERO OVERLOAD", msg: `Severe wind resistance (${Math.round(aeroDragForce)}N). Crouch into tuck position to save power.`, color: "text-purple-400 border-purple-900" };
    }
    if (thermalThrottlingActive) {
      return { status: "THERMAL LIMIT", msg: `Stator winding at ${Math.round(estStatorTemp)}°F. Throttling peak amperage to protect magnets.`, color: "text-rose-400 border-rose-900" };
    }
    if (bonusRegenMiles > 0.5) {
      return { status: "KERS RECOVERY", msg: `Regen active: +${bonusRegenMiles.toFixed(2)} bonus miles (+${regenEnergyHarvestedWh.toFixed(1)} Wh) recaptured!`, color: "text-emerald-400 border-emerald-900" };
    }
    if (effectiveHeadwind > 12) {
      return { status: "AERO RESISTANCE", msg: `Severe headwind (${Math.round(effectiveHeadwind)} mph). Crouch into tuck to reduce aero drag by 30%.`, color: "text-amber-400 border-amber-900" };
    }
    if (batteryPercent < 20) {
      return { status: "ECO CONSERVATION", msg: `Battery critical. Cruise at ${optimalCruiseSpeed} ${speedLabel} for maximum range recovery.`, color: "text-amber-500 border-amber-900" };
    }
    if (terrainClassifier === "Gravel / Dirt Trail" || terrainClassifier === "Off-Road Singletrack") {
      return { status: "OFF-ROAD PROFILE", msg: `${terrainClassifier} detected via IMU. High road-jitter damping active.`, color: "text-purple-400 border-purple-900" };
    }
    return { status: "OPTIMIZED CRUISE", msg: `Motor operating at ${motorEfficiencyPct}% efficiency. All telemetry parameters nominal.`, color: "text-[#39ff14] border-[#39ff14]/50" };
  };
  
  const aiAdvice = getAICopilotRecommendation();
  const learnedEfficiency = Math.round(getAILearnedEfficiency());  

  const previousAiStatus = useRef<string>("");
  useEffect(() => {
    if (!audioWarnings || typeof window === 'undefined' || !isTracking) return;
    if (aiAdvice.status !== "OPTIMIZED CRUISE" && aiAdvice.status !== previousAiStatus.current) {
      previousAiStatus.current = aiAdvice.status;
      try {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`Tactical Alert: ${aiAdvice.msg}`);
          utterance.rate = 1.1; 
          utterance.pitch = 0.95;
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {}
    } else if (aiAdvice.status === "OPTIMIZED CRUISE") {
      previousAiStatus.current = "OPTIMIZED CRUISE";
    }
  }, [aiAdvice.status, aiAdvice.msg, audioWarnings, isTracking]);

  const [cloudAiAnalysis, setCloudAiAnalysis] = useState<string | null>(null);
  const [isFetchingCloudAi, setIsFetchingCloudAi] = useState(false);

  const triggerCloudAiAnalysis = async () => {
    triggerHaptic();
    setIsFetchingCloudAi(true);
    setCloudAiAnalysis(null);
    try {
       const apiKey = getGeminiApiKey() || import.meta.env.VITE_GEMINI_API_KEY;
       if (!apiKey) {
          setCloudAiAnalysis(`API KEY MISSING: Gemini API Key not found in .env file.`);
          setIsFetchingCloudAi(false);
          return;
       }

       const locName = savedLocationName || "Unknown Zone";
       const lat = activeUpdate?.lat || 35.2534;
       const lng = activeUpdate?.lng || -95.1275;

       const payload = {
         contents: [{
           parts: [{
             text: `You are the highly advanced, tactical AI Copilot for a Personal Electric Vehicle (PEV). 
             Analyze this real-time web telemetry for ${locName} (Lat: ${lat}, Lng: ${lng}).
             
             Telemetry Data:
             - Vehicle: ${vehicleModel}
             - Battery: ${batteryPercent}% (Sagging to ${sagVoltage.toFixed(1)}V under load)
             - Speed: ${displaySpeed} ${useMetric ? 'km/h' : 'mph'} (Zone Limit: ${liveSpeedLimit})
             - Motor Temp Estimate: ${estMotorTemp}°F
             - Aerodynamic Drag: ${Math.round(aeroDragForce)}N
             - Lean Angle: ${getCalibratedLean()}° (Pitch: ${Math.round(pitchAngle - gyroOffset.pitch)}°)
             - G-Force Vector: ${hardwareGForce.toFixed(2)}G
             - Environment: ${weatherData?.current?.temperature_2m || 'Unknown'}°, Headwind: ${effectiveHeadwind.toFixed(1)}
             - Range Left: ${estimatedRange.toFixed(1)} ${distLabel}
             
             Task: Provide a highly technical, 2-to-3 sentence tactical briefing regarding the ride conditions, safety, and efficiency.`
           }]
         }],
         generationConfig: { maxOutputTokens: 200, temperature: 0.4 }
       };

       const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload)
       });

       const data = await res.json();
       if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status} API Rejection`);
       if (data.candidates && data.candidates.length > 0) setCloudAiAnalysis(data.candidates[0].content.parts[0].text.replace(/\*/g, ''));
       else throw new Error("Empty payload returned from neural net.");
    } catch (e: any) {
       setCloudAiAnalysis(`UPLINK REJECTED: ${e.message.toUpperCase()}`);
    } finally {
       setIsFetchingCloudAi(false);
    }
  };

  const triggerHistoricalAiDebrief = async (ride: any) => {
    triggerHaptic();
    setIsFetchingHistoricalAi(ride.id);
    try {
       const apiKey = getGeminiApiKey() || import.meta.env.VITE_GEMINI_API_KEY;
       if (!apiKey) {
          setHistoricalAiAnalysis(prev => ({...prev, [ride.id]: "API KEY MISSING: Gemini API Key not found in .env file."}));
          return;
       }

       const speedUnit = useMetric ? "km/h" : "mph";
       const distUnit = useMetric ? "km" : "mi";
       const distance = useMetric ? (ride.distance * 1.609).toFixed(2) : ride.distance.toFixed(2);
       const maxSpeed = useMetric ? (ride.maxSpeed * 1.609).toFixed(1) : ride.maxSpeed.toFixed(1);

       const payload = {
         contents: [{
           parts: [{
             text: `You are a tactical AI Personal Electric Vehicle (PEV) riding coach. Give a highly technical, 2-to-3 sentence post-flight debrief for this historical mission log:
             - Vehicle: ${ride.vehicleModel}
             - Distance: ${distance} ${distUnit}
             - Efficiency: ${ride.efficiencyWhPerMile.toFixed(1)} Wh/${distUnit}
             - Max Speed: ${maxSpeed} ${speedUnit}
             - Elevation Grade Max: ${ride.maxGrade}%
             - IMU Terrain Impacts: ${ride.suspensionBumps} heavy suspension bumps, ${ride.hardBrakes} hard braking events
             - Max Cornering G-Force: ${ride.maxLateralG?.toFixed(2) || 0}G
             - Battery Dropped: ${ride.batteryPercentDropped}%
             
             Task: Provide insights on rider aggression, battery drain efficiency, and hardware stress for this specific run.`
           }]
         }],
         generationConfig: { maxOutputTokens: 250, temperature: 0.4 }
       };

       const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload)
       });

       const data = await res.json();
       if (!res.ok) throw new Error(data.error?.message || "API Rejection");
       if (data.candidates && data.candidates.length > 0) {
         setHistoricalAiAnalysis(prev => ({...prev, [ride.id]: data.candidates[0].content.parts[0].text.replace(/\*/g, '')}));
       }
    } catch (e: any) {
       setHistoricalAiAnalysis(prev => ({...prev, [ride.id]: `UPLINK FAILED: ${e.message}`}));
    } finally {
       setIsFetchingHistoricalAi(null);
    }
  };

  useEffect(() => {
    if (!cloudAiAnalysis || !audioWarnings || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cloudAiAnalysis);
        utterance.rate = 1.05; 
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  }, [cloudAiAnalysis, audioWarnings]);

  const handleBroadcastRideToBoard = async (ride: any) => {
    try {
      const speedVal = useMetric ? `${(ride.maxSpeed * 1.609).toFixed(1)} km/h` : `${ride.maxSpeed.toFixed(1)} mph`;
      const distVal = useMetric ? `${(ride.distance * 1.609).toFixed(2)} km` : `${ride.distance.toFixed(2)} mi`;
      const activeCallsign = props.callsign || localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name") || "Pilot";

      const postContent = `🚀 **MISSION RUN COMPLETED**\n- **Distance:** ${distVal}\n- **Top Speed:** ${speedVal}\n- **Pack Voltage:** ${ride.batteryVoltage || 48}V (${ride.batteryTopology || 'N/A'})\n- **Capacity:** ${ride.batteryCapacity || 15} Ah\n- **Motor:** ${ride.motorWattage || 1000}W (${ride.wheelSize || 10}" wheel)\n- **Ah Used:** ${ride.totalAhConsumed?.toFixed(2) || 0} Ah\n- **Energy Consumed:** ${ride.totalWhConsumed?.toFixed(0) || 0} Wh\n- **Efficiency:** ${ride.efficiencyWhPerMile?.toFixed(1) || 0} Wh/mi\n\n*${ride.rideNote || "Successful run logged via Telemetry HUD."}*`;

      const safeLocation = ride.route && ride.route.length > 0 
        ? { lat: ride.route[ride.route.length - 1].lat, lng: ride.route[ride.route.length - 1].lng } 
        : (activeUpdate?.lat && activeUpdate?.lng ? { lat: activeUpdate.lat, lng: activeUpdate.lng } : null);

      await addDoc(collection(db, "board_posts"), {
        username: activeCallsign,
        pfpUrl: localStorage.getItem("rural_erides_pfp") || null,
        fleetSignature: ride.vehicleModel,
        content: postContent,
        category: "Trail Reports",
        pevType: ride.pevType || "Electric Scooter",
        template: "speed",
        imageUrl: null,
        videoUrl: null,
        isHelpNeeded: false,
        youtubeId: null,
        poll: null,
        telemetry: { speed: speedVal, temp: null },
        location: safeLocation,
        route: ride.route || [],
        volts: 0,
        comments: [],
        timestamp: new Date().toLocaleString(),
        timestamp_epoch: serverTimestamp(),
        isEdited: false
      });
      alert("Mission run successfully broadcasted to the Community Board!");
    } catch (err: any) {
      alert(`Failed to broadcast: ${err.message || "Unknown error."}`);
    }
  };

  const exportRideGPX = (ride: any) => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Rural ERides GO Avionics">
  <trk>
    <name>${ride.vehicleModel} Ride - ${ride.date}</name>
    <desc>Distance: ${ride.distance} miles, Top Speed: ${ride.maxSpeed} mph, Pack: ${ride.batteryVoltage}V ${ride.batteryCapacity}Ah</desc>
    <trkseg>
      <trkpt lat="${activeUpdate?.lat || 35.2534}" lon="${activeUpdate?.lng || -95.1275}">
        <ele>${ride.elevationGain || 0}</ele>
        <time>${new Date().toISOString()}</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ride_Log_${ride.id || Date.now()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
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

  const fetchWeather = async (lat: number, lng: number) => {
    setIsFetchingWeather(true);
    try {
      const tempP = useMetric ? 'celsius' : 'fahrenheit';
      const windP = useMetric ? 'kmh' : 'mph';
      const precipP = useMetric ? 'mm' : 'inch';
      
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,uv_index,visibility,cloud_cover,surface_pressure,soil_temperature_0cm,direct_radiation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset,uv_index_max&temperature_unit=${tempP}&wind_speed_unit=${windP}&precipitation_unit=${precipP}&timezone=auto&forecast_days=10`;
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
    } catch (err) {} finally { setIsFetchingWeather(false); }
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

  const handleSOSDispatch = () => {
    const lat = activeUpdate?.lat || "UNKNOWN";
    const lng = activeUpdate?.lng || "UNKNOWN";
    const speed = useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) + ' km/h' : (displaySpeed || 0).toFixed(1) + ' mph';
    const link = `https://maps.google.com/?q=${lat},${lng}`;
    
    const msg = `🚨 EMERGENCY SOS 🚨\nPilot requires immediate assistance.\n\n📍 Location: ${link}\n🧭 Heading: ${getCardinalDirection(compassHeading !== null && compassHeading !== undefined ? compassHeading : activeUpdate?.heading)}\n💨 Speed: ${speed}\n🛴 Hardware: ${vehicleModel}\n🔋 Battery Remaining: ${safePct(batteryPercent).toFixed(1)}%\n⏱️ Time: ${new Date().toLocaleTimeString(localeCode)}`;
    
    window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
  };

  const startTracking = () => {
    setElapsedSeconds(0); 
    setMovingSeconds(0);
    setCurrentAmps(0); 
    setTripAhConsumed(0);
    setCaloriesBurned(0);
    setIsClimbing(false);
    setIsDescending(false);
    setBrakeForceG(0);
    setAccelForceG(0);
    setLiveGradePercent(0);
    elevationGainRef.current = 0;
    peakWattsRef.current = 0;
    peakAmpsRef.current = 0;
    maxGForceRef.current = 0;
    maxGradeRef.current = 0;
    maxLeanRef.current = 0;
    minVoltageRef.current = 999;
    brakeCountRef.current = 0;
    bumpCountRef.current = 0;
    maxLatGRef.current = 0;
    setDisplaySpeed(0);
    smoothedSpeedRef.current = 0;
    routeLogRef.current = []; 

    requestAnimationFrame(() => {
       locationService.start(pevType as PEVType); 
       setIsTracking(true); 
       setMaxSpeed(0);
       rideStartBatteryRef.current = batteryPercent;
       rideStartTimeRef.current = new Date().toLocaleTimeString(localeCode);
    });
  };

  const stopTracking = () => {
    locationService.stop();
    setIsTracking(false);
    const endTime = new Date().toLocaleTimeString(localeCode);
    
    const finalDistance = activeUpdate?.distance || 0;
    const hours = movingSeconds > 0 ? movingSeconds / 3600 : 0.001;
    const calculatedAvgSpeed = finalDistance / hours;
    const avg = Math.min(calculatedAvgSpeed, maxSpeed);
    
    const effectiveVoltage = liveRestingVoltage;
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
    const estimatedEndingBatt = Math.max(0, batteryPercent - batteryPercentUsed);
    
    const userPrompt = prompt(`Mission Complete! Enter your actual ending battery % (AI Estimate: ${estimatedEndingBatt.toFixed(1)}%):`, estimatedEndingBatt.toFixed(1));
    const endingBatt = userPrompt !== null && !isNaN(Number(userPrompt)) 
      ? Math.max(0, Math.min(100, Number(userPrompt))) 
      : estimatedEndingBatt;

    const savings = finalDistance * 0.76;
    const rideScore = actualWhPerMile < 20 ? 'S+' : actualWhPerMile < 25 ? 'S' : actualWhPerMile < 30 ? 'A' : actualWhPerMile < 35 ? 'B' : 'C';

    const autoTags = [];
    if (actualWhPerMile < 22) autoTags.push("Eco-Miler");
    if (actualWhPerMile > 35) autoTags.push("High Drain");
    if (maxSpeed >= 20) autoTags.push("Speed Run");
    if (elevationGainRef.current > 100) autoTags.push("Mountain Climb");
    if (terrain === "Trail") autoTags.push("Off-Road");
    if (towingTrailer) autoTags.push("Towing Payload");
    if (isSchoolZone) autoTags.push("School Zone Route");

    const newRide: any = { 
        id: Date.now().toString(), 
        date: new Date().toLocaleDateString(localeCode), 
        startTime: rideStartTimeRef.current || "N/A",
        endTime: endTime,
        duration: elapsedSeconds, 
        movingDuration: movingSeconds,
        distance: finalDistance, 
        maxSpeed, 
        avgSpeed: avg, 
        pevType,
        vehicleModel: customVehicleName || vehicleModel, 
        batteryVoltage,
        batteryCapacity,
        motorWattage,
        controllerAmps,
        wheelSize,
        batteryTopology,
        terrain, 
        powerMode,
        totalWhConsumed: tripWhConsumed,
        totalAhConsumed: tripAhConsumed,
        efficiencyWhPerMile: actualWhPerMile,
        elevationGain: elevationGainRef.current,
        maxGrade: maxGradeRef.current,
        maxGForce: maxGForceRef.current,
        maxLeanAngle: maxLeanRef.current,
        minVoltage: minVoltageRef.current === 999 ? effectiveVoltage : minVoltageRef.current,
        peakWatts: peakWattsRef.current,
        peakAmps: peakAmpsRef.current,
        tirePsiLogged: tirePsi,
        towingTrailer,
        hardBrakes: brakeCountRef.current,
        suspensionBumps: bumpCountRef.current,
        maxLateralG: maxLatGRef.current,
        weatherCondition: weatherData?.current ? `${Math.round(weatherData.current.temperature_2m)}°, Hum: ${Math.round(weatherData.current.relative_humidity_2m)}%` : "Offline",
        co2SavedLbs: finalDistance * 0.89,
        financialSavings: savings,
        startingBattery: rideStartBatteryRef.current,
        endingBattery: Number(endingBatt.toFixed(1)),
        caloriesBurned: caloriesBurned,
        rideScore,
        tags: autoTags,
        rideNote: "",
        route: [...routeLogRef.current],
        avgMotorTemp: Math.round(estMotorTemp),
        batteryPercentDropped: Number((rideStartBatteryRef.current - endingBatt).toFixed(1)),
        aiEfficiencyScore: actualWhPerMile < 22 ? "AI-Optimized (S+)" : actualWhPerMile < 28 ? "Standard Profile (A)" : "High Energy Draw (B)"
    };
    setBatteryPercent(Number(endingBatt.toFixed(1)));
    setSavedRides(prev => {
        const updated = [newRide, ...(Array.isArray(prev) ? prev : [])];
        localStorage.setItem("universal_erides_rides", JSON.stringify(updated));
        return updated;
    });
  };

  useEffect(() => {
    const autoRecordEnabled = typeof window !== 'undefined' ? localStorage.getItem("rt_auto_record") === "true" : false;
    if (!mounted || isTracking || !autoRecordEnabled) return;
    const triggerSpeed = useMetric ? Math.round(autoWakeSpeed * 1.609) : autoWakeSpeed; 
    if (displaySpeed >= triggerSpeed) {
      triggerHaptic();
      startTracking();
    }
  }, [displaySpeed, isTracking, autoWakeSpeed, useMetric, mounted]);

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
  const totalFinancialSavings = safeRides.reduce((acc, curr) => acc + safeNum(curr?.financialSavings), 0);

  const speedLabel = useMetric ? "KM/H" : "MPH";
  const distLabel = useMetric ? "KM" : "MI";

  if (!mounted) {
    return <div className="h-screen w-full bg-[#06060a] flex items-center justify-center text-[#39ff14] font-black tracking-widest uppercase text-xs animate-pulse">Initializing Telemetry Matrix...</div>;
  }

  return (
    <div className={`space-y-6 p-2 sm:p-4 pb-32 max-w-7xl mx-auto min-h-screen w-full overflow-y-auto custom-scrollbar ${bgBase}`}>
      
      {/* --- TOP CONSOLE HEADER --- */}
      <div className={`flex justify-between items-center ${bgList} rounded-2xl p-2.5 shadow-xl`}>
        <div className={`text-[10px] sm:text-xs font-mono font-black uppercase ${txtMuted} tracking-wider flex items-center gap-1.5 px-1`}>
           <Activity className={`w-3.5 h-3.5 ${t.text}`} /> UNIVERSAL AVIONICS CORE
        </div>
        <button 
          onClick={() => { triggerHaptic(); setShowSettings(!showSettings); }} 
          className={`min-h-[44px] px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer ${showSettings ? `${t.bg} text-black ${t.border}` : `${bgCard} ${t.text} ${t.border} shadow-lg`}`}
        >
          <Settings2 className="w-4 h-4"/> {tx('config')}
        </button>
      </div>

      {/* --- OMNIBUS SETTINGS COMPONENT --- */}
      <SettingsMatrix
        showSettings={showSettings} configTab={configTab} setConfigTab={setConfigTab}
        triggerHaptic={triggerHaptic} hudStyle={hudStyle} setHudStyle={setHudStyle}
        speedSignStyle={speedSignStyle} setSpeedSignStyle={setSpeedSignStyle}
        hudFontColor={hudFontColor} setHudFontColor={setHudFontColor} theme={theme}
        handleThemeChange={handleThemeChange} isDayMode={isDayMode}
        toggleSunVisibility={toggleSunVisibility} isNightVision={isNightVision}
        setIsNightVision={setIsNightVision} setIsDayMode={setIsDayMode}
        autoNightMode={autoNightMode} setAutoNightMode={setAutoNightMode}
        sensorsUnlocked={sensorsUnlocked} requestSensorPermissions={requestSensorPermissions}
        getCalibratedLean={getCalibratedLean} pitchAngle={pitchAngle} gyroOffset={gyroOffset}
        hardwareGForce={hardwareGForce} ambientLux={ambientLux} magBaseline={magBaseline}
        calibrateEMF={calibrateEMF} magAmplifier={magAmplifier} setMagAmplifier={setMagAmplifier}
        magFluxDelta={magFluxDelta} calibrateIMU={calibrateIMU} brakeSensitivity={brakeSensitivity}
        setBrakeSensitivity={setBrakeSensitivity} tireFriction={tireFriction}
        setTireFriction={setTireFriction} networkType={networkType} networkPing={networkPing}
        useMetric={useMetric} setUseMetric={setUseMetric} audioWarnings={audioWarnings}
        setAudioWarnings={setAudioWarnings} audioThrottleInterval={audioThrottleInterval}
        setAudioThrottleInterval={setAudioThrottleInterval} visualGForceAlerts={visualGForceAlerts}
        setVisualGForceAlerts={setVisualGForceAlerts} gpsSmoothing={gpsSmoothing}
        setGpsSmoothing={setGpsSmoothing} telemetryRate={telemetryRate}
        setTelemetryRate={setTelemetryRate} speedLimitPolling={speedLimitPolling}
        setSpeedLimitPolling={setSpeedLimitPolling} autoWakeSpeed={autoWakeSpeed}
        setAutoWakeSpeed={setAutoWakeSpeed} speedLabel={speedLabel}
        batteryChemistry={batteryChemistry} setBatteryChemistry={setBatteryChemistry}
        fallbackInput={fallbackInput} setFallbackInput={setFallbackInput}
        manuallySetFallback={manuallySetFallback} ui={uiConfig} tx={tx}
      />

      {/* --- PEV PROFILE SETUP COMPONENT --- */}
      <PEVProfileSetup
        isTracking={isTracking} handleSaveCurrentPevProfile={handleSaveCurrentPevProfile}
        savedPevProfiles={savedPevProfiles} handleLoadPevProfile={handleLoadPevProfile}
        customVehicleName={customVehicleName} setCustomVehicleName={setCustomVehicleName}
        pevType={pevType} setPevType={setPevType} wheelSize={wheelSize} setWheelSize={setWheelSize}
        batteryPercent={batteryPercent} setBatteryPercent={setBatteryPercent}
        batteryCapacity={batteryCapacity} setBatteryCapacity={setBatteryCapacity}
        peakVoltage={peakVoltage} setPeakVoltage={setPeakVoltage} motorWattage={motorWattage}
        setMotorWattage={setMotorWattage} controllerAmps={controllerAmps}
        setControllerAmps={setControllerAmps} batteryVoltage={batteryVoltage}
        setBatteryVoltage={setBatteryVoltage} startTracking={startTracking}
        triggerHaptic={triggerHaptic} ui={uiConfig} tx={tx}
      />

      {/* --- PRIMARY TELEMETRY HUD --- */}
      <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden transition-colors border ${brd}`}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[120px] pointer-events-none opacity-10" style={{ backgroundColor: hudFontColor }}></div>

        {/* TOP HUD BAR WITH DYNAMIC WEB SPEED LIMIT SIGN */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800 relative z-10">
           <div className={`flex items-center gap-4 bg-zinc-900 border ${isSchoolZone ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'border-zinc-700'} px-4 py-3 rounded-2xl shadow-inner w-full sm:w-auto`}>
              <div className={`flex flex-col items-center justify-center w-16 h-20 ${isSchoolZone ? 'bg-amber-400 text-black' : 'bg-white text-black'} border-[3px] border-black rounded-lg shadow-md shrink-0 relative overflow-hidden`}>
                 <span className="text-[9px] font-black uppercase leading-none mt-1">SPEED</span>
                 <span className="text-[9px] font-black uppercase leading-none mb-1">LIMIT</span>
                 {isFetchingSpeedLimit ? (
                   <Loader2 className="w-6 h-6 animate-spin text-black my-auto" />
                 ) : (
                   <span className="text-3xl font-black font-mono leading-none tabular-nums tracking-tighter">
                     {liveSpeedLimit === 0 ? "--" : liveSpeedLimit}
                   </span>
                 )}
              </div>
              <div className="truncate flex flex-col justify-center min-w-0">
                 <span className={`text-xs ${isSchoolZone ? 'text-amber-400 font-black' : 'text-cyan-400 font-bold'} uppercase tracking-wider block truncate`}>
                   {currentRoadType}
                 </span>
                 <span className="text-[11px] text-zinc-300 font-mono font-bold truncate block mt-0.5 mb-1">
                   {currentStreet || "Awaiting Map Data..."}
                 </span>
                 <span className="text-xs font-mono font-black text-white tabular-nums flex items-center gap-1.5">
                   <ShieldAlertIcon className="w-3.5 h-3.5 text-rose-500" /> {liveSpeedLimit === 0 ? "UNMAPPED ZONE" : `${liveSpeedLimit} ${speedLabel} Zone`}
                 </span>
              </div>
           </div>
           <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button onClick={() => {
                const styles = ["digital", "analog", "minimalist", "bar", "cyber", "aviation", "orb"] as const;
                const nextIdx = (styles.indexOf(hudStyle) + 1) % styles.length;
                setHudStyle(styles[nextIdx]);
              }} className={`flex-1 sm:flex-none min-h-[44px] ${isDayMode ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-white'} transition-colors px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase border border-zinc-800 flex justify-center items-center gap-2 shadow-lg cursor-pointer`}>
                  <CircleGauge size={14} style={{ color: hudFontColor }} /> HUD: {hudStyle.toUpperCase()}
              </button>
              <button onClick={() => window.open("tel:911")} className={`flex-1 sm:flex-none min-h-[44px] ${isDayMode ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-white'} transition-colors px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase border border-zinc-800 flex justify-center items-center gap-2 shadow-lg cursor-pointer`}>
                  <PhoneCall size={14} style={{ color: hudFontColor }} /> Local Link 911
              </button>
              <button onClick={handleSOSDispatch} className="flex-1 sm:flex-none min-h-[44px] bg-rose-600 text-white hover:bg-rose-500 transition-colors px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase border border-rose-900/50 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)] cursor-pointer">
                  <AlertTriangle size={14} className="animate-pulse" /> Emergency SOS
              </button>
           </div>
        </div>

        {/* CRASH ALERT EMERGENCY MODAL */}
        {isCrashAlertActive && (
          <div className="bg-rose-950/90 border-2 border-rose-500 text-white p-5 rounded-2xl flex flex-col items-center justify-center gap-3 animate-pulse shadow-[0_0_30px_rgba(244,63,94,0.8)] z-50">
            <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest">
              <AlertOctagon className="w-6 h-6 text-rose-500 animate-bounce" /> SEVERE IMPACT DETECTED
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-black text-white tabular-nums">AUTO-SOS IN {crashCountdown}S</p>
              <p className="text-[10px] text-zinc-300 uppercase tracking-wider font-bold mt-1">
                Emergency SMS payload with GPS coordinates will dispatch automatically.
              </p>
            </div>
            <button
              onClick={cancelCrashAlert}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              I'M OK — CANCEL EMERGENCY SOS
            </button>
          </div>
        )}

        {/* PHYSICS WARNING HUDS */}
        <AnimatePresence>
          <div className="flex flex-col gap-2 mb-4 relative z-10">
            {isSchoolZone && isTracking && (
              <div className="bg-amber-950/60 border border-amber-500 text-amber-400 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <AlertOctagon className="w-4 h-4" /> SCHOOL ZONE DETECTED: 15 MPH RESTRICTION IN EFFECT
              </div>
            )}
            {proximityDistance !== null && proximityDistance < 5 && isTracking && (
              <div className="bg-red-950/60 border border-red-500 text-red-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                <AlertOctagon className="w-4 h-4" /> PROXIMITY COLLISION WARNING: OBJECT AT {proximityDistance.toFixed(1)} CM
              </div>
            )}
            {isClimbing && (
              <div className="bg-amber-950/40 border border-amber-500/50 text-amber-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <TrendingUp className="w-4 h-4" /> Elevation Incline (+{liveGradePercent}% Slope): High Electrical Load
              </div>
            )}
            {isDescending && (
              <div className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <TrendingDown className="w-4 h-4" /> Incline Reversal ({liveGradePercent}% Slope): Kinetic Energy Reclamation Active
              </div>
            )}
            {visualGForceAlerts && brakeForceG > 0 && (
              <div className="bg-rose-950/60 border border-rose-500 text-rose-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                <AlertOctagon className="w-4 h-4" /> High Inertial Deceleration Triggered: {brakeForceG.toFixed(2)}G
              </div>
            )}
            {visualGForceAlerts && accelForceG > 0.1 && (
              <div className="bg-cyan-950/60 border border-cyan-500 text-cyan-400 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Zap className="w-4 h-4 animate-bounce" /> Acceleration Torque Burst: +{accelForceG.toFixed(2)}G
              </div>
            )}
            {isTracking && getCalibratedLean() > 40 && (
              <div className="bg-orange-950/60 border border-orange-500 text-orange-400 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <RotateCw className="w-4 h-4 animate-pulse" /> Extreme Lean Angle Detected: {getCalibratedLean()}°
              </div>
            )}
            {isTracking && (displaySpeed * (useMetric ? 1.609 : 1)) > liveSpeedLimit && (
              <div className="bg-red-950/40 border border-red-500/50 text-red-500 p-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="w-4 h-4 animate-pulse" /> ZONE SPEED LIMIT EXCEEDED
              </div>
            )}
          </div>
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center mb-8 relative z-10 w-full pt-4">
          <div className={`text-[12px] font-bold tracking-widest uppercase mb-[-10px] ${isDayMode ? 'text-zinc-500' : (isNightVision ? 'text-rose-900' : 'text-zinc-600')}`}>{tx('speed')} VECTOR ({hudStyle.toUpperCase()})</div>
          
          {hudStyle === "analog" ? (
             <div className="relative w-80 h-40 overflow-hidden mx-auto mt-6 mb-4">
               {(() => {
                 const currentVal = Math.min(useMetric ? displaySpeed * 1.609 : displaySpeed, 60);
                 const angleDeg = (currentVal / 60) * 180 - 90;
                 const angleRadRot = (angleDeg * Math.PI) / 180;
                 const tipX = 100 + 72 * Math.cos(angleRadRot);
                 const tipY = 100 + 72 * Math.sin(angleRadRot);
                 return (
                   <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible drop-shadow-lg">
                     <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="currentColor" className="text-zinc-800" strokeWidth="10" strokeLinecap="round" />
                     <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke={hudFontColor} strokeWidth="10" strokeLinecap="round" strokeDasharray="283" strokeDashoffset={283 - (283 * currentVal / 60)} style={{ transition: "stroke-dashoffset 0.2s linear" }} />
                     {Array.from({ length: 7 }).map((_, i) => {
                        const val = i * 10;
                        const angleRad = Math.PI - (val / 60) * Math.PI;
                        const x1 = 100 + 82 * Math.cos(angleRad);
                        const y1 = 100 - 82 * Math.sin(angleRad);
                        const x2 = 100 + 90 * Math.cos(angleRad);
                        const y2 = 100 - 90 * Math.sin(angleRad);
                        const txPos = 100 + 65 * Math.cos(angleRad);
                        const tyPos = 100 - 65 * Math.sin(angleRad);
                        return (
                          <g key={val}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" className="text-zinc-600" strokeWidth="2" />
                            <text x={txPos} y={tyPos + 4} fill="currentColor" className="text-zinc-500 tabular-nums" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{val}</text>
                          </g>
                        );
                     })}
                     <g transform={`rotate(${angleDeg} 100 100)`} style={{ transition: "transform 0.2s linear" }}>
                        <line x1="100" y1="100" x2="100" y2="22" stroke={hudFontColor} strokeWidth="3" strokeLinecap="round" />
                        <circle cx="100" cy="100" r="7" fill={hudFontColor} />
                     </g>
                     <text x={tipX} y={tipY - 4} fill={hudFontColor} fontSize="11" fontWeight="900" fontFamily="monospace" textAnchor="middle" className="drop-shadow-md tabular-nums transition-all duration-200 ease-linear">
                       {currentVal.toFixed(0)}
                     </text>
                   </svg>
                 );
               })}
               <div className="absolute bottom-1 w-full text-center text-3xl font-black font-mono tracking-tighter tabular-nums" style={{ color: hudFontColor }}>
                 {useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) : (displaySpeed || 0).toFixed(1)}
               </div>
             </div>
          ) : hudStyle === "minimalist" ? (
            <div className="py-10 text-center">
              <div className="text-8xl sm:text-9xl font-black font-mono tracking-tighter drop-shadow-lg tabular-nums" style={{ color: hudFontColor }}>
                {useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) : (displaySpeed || 0).toFixed(1)}
              </div>
              <div className="text-xs font-mono font-bold tracking-widest opacity-60 uppercase mt-1" style={{ color: hudFontColor }}>{speedLabel}</div>
            </div>
          ) : hudStyle === "bar" ? (
            <div className="w-full max-w-lg py-6 space-y-3">
              <div className="flex justify-between font-mono font-black text-xs tabular-nums" style={{ color: hudFontColor }}>
                <span>0 {speedLabel}</span>
                <span className="text-2xl font-bold">{useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) : (displaySpeed || 0).toFixed(1)}</span>
                <span>60 {speedLabel}</span>
              </div>
              <div className="w-full h-6 bg-black border border-zinc-800 rounded-xl overflow-hidden p-1 shadow-inner">
                <div className="h-full rounded-lg transition-all duration-200 ease-linear" style={{ width: `${safePct(((useMetric ? displaySpeed * 1.609 : displaySpeed) / 60) * 100)}%`, backgroundColor: hudFontColor }}></div>
              </div>
            </div>
          ) : hudStyle === "cyber" ? (
             <div className="relative w-full max-w-sm mx-auto h-40 mt-6 mb-4 flex items-center justify-center bg-black/40 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '20px 20px', color: hudFontColor }}></div>
               <div className="absolute left-0 top-0 w-16 h-16 border-t-4 border-l-4 rounded-tl-xl" style={{ borderColor: hudFontColor }}></div>
               <div className="absolute right-0 bottom-0 w-16 h-16 border-b-4 border-r-4 rounded-br-xl" style={{ borderColor: hudFontColor }}></div>
               <div className="relative z-10 flex flex-col items-center">
                 <div className="text-7xl font-black font-mono tracking-tighter drop-shadow-md tabular-nums" style={{ color: hudFontColor }}>
                   {useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) : (displaySpeed || 0).toFixed(1)}
                 </div>
                 <div className="text-[10px] font-bold tracking-[0.3em] uppercase mt-2 bg-black px-3 py-1 rounded border border-zinc-800" style={{ color: hudFontColor }}>
                   SYS_VELOCITY // {speedLabel}
                 </div>
               </div>
             </div>
          ) : hudStyle === "aviation" ? (
             <div className="relative w-full max-w-sm mx-auto h-40 mt-6 mb-4 bg-black border-2 border-zinc-800 rounded-lg overflow-hidden flex shadow-inner">
               <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
                 <div 
                   className="w-[200%] h-[400%] absolute flex flex-col transition-transform duration-75 ease-linear"
                   style={{ transform: `rotate(${getCalibratedLean()}deg) translateY(${Math.min(50, Math.max(-50, pitchAngle - configRefs.current.gyroOffset.pitch))}px)` }}
                 >
                    <div className="flex-1 bg-cyan-900/40 border-b-2 border-white"></div>
                    <div className="flex-1 bg-amber-900/40"></div>
                 </div>
               </div>
               
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 opacity-40 pointer-events-none z-10">
                 <div className="w-32 h-px bg-white"></div>
                 <div className="w-48 h-px bg-white"></div>
                 <div className="w-32 h-px bg-white"></div>
               </div>
               
               <div className="w-16 border-r border-zinc-800 flex flex-col justify-center items-end pr-2 text-xs font-mono font-bold bg-zinc-950/80 shadow-[10px_0_15px_rgba(0,0,0,0.5)] z-20 tabular-nums" style={{ color: hudFontColor }}>
                 <span className="opacity-50 mb-2">{Math.floor((useMetric ? displaySpeed * 1.609 : displaySpeed) + 10)}</span>
                 <span className="text-lg border-y-2 border-l-2 py-1 px-2 border-current bg-black z-20 mr-[-2px]">{useMetric ? ((displaySpeed || 0) * 1.609).toFixed(0) : (displaySpeed || 0).toFixed(0)}</span>
                 <span className="opacity-50 mt-2">{Math.max(0, Math.floor((useMetric ? displaySpeed * 1.609 : displaySpeed) - 10))}</span>
               </div>
               
               <div className="flex-1 flex items-center justify-center relative z-20">
                 <div className="w-4 h-4 border-2 border-current rounded-full z-10" style={{ color: hudFontColor }}></div>
                 <div className="w-8 h-1 border-t-2 border-current absolute top-1/2 -ml-16" style={{ borderColor: hudFontColor }}></div>
                 <div className="w-8 h-1 border-t-2 border-current absolute top-1/2 ml-16" style={{ borderColor: hudFontColor }}></div>
                 <span className="absolute bottom-2 text-[9px] font-bold tracking-widest text-zinc-300 uppercase tabular-nums w-24 bg-black/60 px-2 py-0.5 rounded text-center">HDG {Math.round(compassHeading)}°</span>
               </div>

               <div className="w-16 border-l border-zinc-800 flex flex-col justify-center items-start pl-2 text-xs font-mono font-bold text-emerald-400 bg-zinc-950/80 shadow-[-10px_0_15px_rgba(0,0,0,0.5)] z-20 tabular-nums">
                 <span className="opacity-50 mb-2">{Math.floor((activeUpdate?.altitude || 0) + 50)}</span>
                 <span className="text-lg border-y-2 border-r-2 py-1 px-2 border-current bg-black z-20 ml-[-2px]">{((activeUpdate?.altitude || 0)).toFixed(0)}</span>
                 <span className="opacity-50 mt-2">{Math.max(0, Math.floor((activeUpdate?.altitude || 0) - 50))}</span>
               </div>
             </div>
          ) : hudStyle === "orb" ? (
             <div className="relative w-48 h-48 mx-auto mt-4 mb-2 flex items-center justify-center rounded-full border-4 shadow-lg bg-black" style={{ borderColor: hudFontColor, boxShadow: `0 0 30px ${hudFontColor}40, inset 0 0 20px ${hudFontColor}40` }}>
                <div className="absolute inset-2 border-2 border-dashed rounded-full animate-[spin_8s_linear_infinite]" style={{ borderColor: hudFontColor, opacity: 0.6 }}></div>
                <div className="absolute inset-6 border-4 border-dotted rounded-full animate-[spin_12s_linear_infinite_reverse]" style={{ borderColor: hudFontColor, opacity: 0.3 }}></div>
                <div className="text-center z-10 flex flex-col items-center mt-2">
                  <span className="text-6xl font-black font-mono leading-none tracking-tighter tabular-nums" style={{ color: hudFontColor, textShadow: `0 0 15px ${hudFontColor}` }}>
                    {useMetric ? ((displaySpeed || 0) * 1.609).toFixed(0) : (displaySpeed || 0).toFixed(0)}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest mt-1" style={{ color: hudFontColor }}>{speedLabel}</span>
                </div>
             </div>
          ) : (
            <div className="text-[120px] sm:text-[160px] leading-none font-black font-mono tracking-tighter drop-shadow-[0_0_30px_currentColor] tabular-nums" style={{ color: hudFontColor }}>
              {useMetric ? ((displaySpeed || 0) * 1.609).toFixed(1) : (displaySpeed || 0).toFixed(1)}
            </div>
          )}
          
          {hudStyle !== "minimalist" && hudStyle !== "cyber" && hudStyle !== "orb" && (
            <div className="font-black uppercase tracking-[0.5em] text-sm mt-[-5px] mb-8" style={{ color: hudFontColor }}>
              {useMetric ? 'KILOMETERS / HOUR' : 'MILES / HOUR'}
            </div>
          )}

          {/* MAGNETIC FIELD MOTOR WATTAGE OVERRIDE */}
          <div className={`w-full max-w-md ${bgCard} border ${brd} p-4 rounded-2xl shadow-inner mt-2`}>
             <div className={`text-[9px] font-black uppercase tracking-widest ${txtMuted} mb-2 flex items-center justify-between w-full`}>
               <span className="flex items-center gap-1.5"><ZapOff className="w-3.5 h-3.5" /> LIVE POWER DRAW</span>
               <div className="text-right">
                  <span className={`${txtMain} font-mono text-xs font-bold tabular-nums`}>{safeNum(currentAmps * sagVoltage).toFixed(0)} W</span>
                  {getDynamicEMF() > 1.5 && (
                     <div className="text-cyan-400 font-mono text-[8px] animate-pulse mt-0.5 tabular-nums">
                       EMF INDUCTION: {Math.round((getDynamicEMF() / 150) * motorWattage)}W
                     </div>
                  )}
               </div>
             </div>
             <div className={`w-full h-3 ${bgBase} border ${brd} rounded-full overflow-hidden shadow-inner`}>
                <div className={`h-full ${t.bg} ${t.shadow} transition-all duration-200 ease-linear`} style={{ width: `${safePct((currentAmps / (controllerAmps || 1)) * 100)}%` }}></div>
             </div>
          </div>

          {/* AVIONICS HEADING & BEARING TAPE */}
          <div className={`w-full max-w-md ${bgCard} border ${brd} p-3 rounded-2xl shadow-inner mt-3 flex flex-col items-center gap-1`}>
             <div className={`text-[8px] font-black uppercase tracking-[0.25em] ${txtMuted} flex items-center justify-between w-full`}>
               <span className="flex items-center gap-1.5"><Compass className="w-3 h-3 text-cyan-400" /> AVIONICS HEADING TAPE</span>
               <span className="text-cyan-500 font-mono">{trueNorthStatus}</span>
             </div>
             
             <div className="relative w-full h-10 overflow-hidden bg-black/80 rounded-xl border border-zinc-800 flex items-center justify-center mt-1">
               <div 
                 className="absolute h-full flex items-center text-[10px] font-mono font-bold text-zinc-500 transition-transform duration-200 ease-linear"
                 style={{ transform: `translateX(calc(50% - 360px - ${compassHeading * 2}px))` }}
               >
                  {Array.from({length: 73}).map((_, i) => {
                     const angle = (i - 18) * 10; 
                     const isMajor = angle % 90 === 0;
                     const isMinor = angle % 45 === 0 && !isMajor;
                     const displayAngle = (angle + 360) % 360;
                     let label = "";
                     if (displayAngle === 0) label = "N";
                     else if (displayAngle === 90) label = "E";
                     else if (displayAngle === 180) label = "S";
                     else if (displayAngle === 270) label = "W";
                     else if (isMinor) {
                       if (displayAngle === 45) label = "NE";
                       if (displayAngle === 135) label = "SE";
                       if (displayAngle === 225) label = "SW";
                       if (displayAngle === 315) label = "NW";
                     }
                     
                     return (
                       <div key={i} className="flex flex-col items-center justify-end w-[20px] shrink-0 h-full pb-1">
                         {label && <span className={`mb-1 ${isMajor ? 'text-white text-xs' : 'text-cyan-400'}`}>{label}</span>}
                         <div className={`w-0.5 bg-zinc-600 ${isMajor ? 'h-3' : isMinor ? 'h-2' : 'h-1.5 opacity-50'}`}></div>
                       </div>
                     )
                  })}
               </div>
               
               <div className="absolute w-0.5 h-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)] z-10"></div>
               <div className="absolute top-0 mt-0.5 z-20 text-[9px] font-black font-mono text-cyan-400 bg-black px-1.5 rounded border border-cyan-500/50 tabular-nums">
                  {Math.round(compassHeading)}°
               </div>
             </div>
          </div>
        </div>

        {/* TACTICAL PITCH & ROLL INCLINOMETER */}
        <div className={`w-full max-w-md ${bgCard} border ${brd} p-4 rounded-2xl shadow-inner mt-3 mb-2 flex flex-col items-center`}>
           <div className={`text-[8px] font-black uppercase tracking-[0.25em] ${txtMuted} flex items-center justify-between w-full mb-4`}>
             <span className="flex items-center gap-1.5"><Crosshair className="w-3 h-3 text-amber-400" /> OFF-ROAD INCLINOMETER</span>
             <span className={Math.abs(pitchAngle - gyroOffset.pitch) > 25 ? "text-rose-500 animate-pulse font-bold" : "text-amber-500 font-mono"}>
               {Math.abs(pitchAngle - gyroOffset.pitch) > 25 ? "WARNING: STEEP GRADE" : "NOMINAL"}
             </span>
           </div>
           
           <div className="flex w-full items-center justify-around px-2">
              <div className="flex flex-col items-center gap-2">
                 <div className="h-20 w-4 bg-black rounded-full border border-zinc-800 relative overflow-hidden flex items-center justify-center shadow-inner">
                    <div className="absolute w-full h-[2px] bg-zinc-400 z-10"></div>
                    <div 
                       className="w-full bg-amber-500 transition-transform duration-100 ease-linear opacity-80"
                       style={{ 
                         height: '50%', 
                         transform: `translateY(${Math.min(100, Math.max(-100, (pitchAngle - gyroOffset.pitch) * 2.5))}%)`
                       }}
                    ></div>
                 </div>
                 <span className={`text-[10px] font-black ${txtMain} font-mono tabular-nums`}>
                   {Math.round(pitchAngle - gyroOffset.pitch)}° PITCH
                 </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                 <div 
                   className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-600 relative flex items-center justify-center transition-transform duration-100 ease-linear bg-black/40 shadow-inner"
                   style={{ transform: `rotate(${leanAngle - gyroOffset.lean}deg)` }}
                 >
                    <div className="w-full h-[2px] bg-amber-500 absolute"></div>
                    <div className="w-2 h-2 bg-white rounded-full absolute border-2 border-black z-10"></div>
                 </div>
                 <span className={`text-[10px] font-black ${txtMain} font-mono tabular-nums`}>
                   {getCalibratedLean()}° ROLL
                 </span>
              </div>
           </div>
        </div>

        {/* LIVE TELEMETRY DASHBOARD GRID */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 py-4 border-t ${brd} relative z-10`}>
            {[ 
               { icon: Timer, label: tx('time'), val: `${Math.floor(elapsedSeconds/60)}m ${Math.floor(elapsedSeconds%60)}s` },
               { icon: Gauge, label: "PEAK VELOCITY", val: useMetric ? `${(maxSpeed * 1.609).toFixed(1)} ${speedLabel}` : `${maxSpeed.toFixed(1)} ${speedLabel}` },
               { icon: CircleDashed, label: "MOTOR RPM", val: `${liveRPM} RPM` },
               { icon: Crosshair, label: "TILT VECTOR", val: `${getCalibratedLean()}° / ${Math.round(pitchAngle - gyroOffset.pitch)}°` },
               { icon: Battery, label: "EST. CYCLES", val: batteryCapacity > 0 ? `${(totalMiles / (batteryCapacity * liveRestingVoltage / 25)).toFixed(1)} Cyc` : "0" },
               { icon: Zap, label: "SAG VOLTAGE", val: `${sagVoltage.toFixed(1)} V` },
               { icon: Battery, label: "AMP-HOURS USED", val: `${tripAhConsumed.toFixed(2)} Ah` },
               { icon: TrendingUp, label: "SLOPE GRADE", val: `${liveGradePercent}%` },
               { icon: Activity, label: "KINETIC ENGY", val: `${(kineticEnergyJoules / 1000).toFixed(1)} kJ` },
               { icon: Wind, label: "RELATIVE WIND", val: `${Math.abs(effectiveHeadwind).toFixed(1)} ${useMetric ? 'km/h' : 'mph'} ${effectiveHeadwind > 0 ? 'HEAD' : 'TAIL'}` }
            ].map((stat, i) => (
                <div key={i} className={`p-3 rounded-2xl border text-center shadow-inner flex flex-col justify-between transition-colors ${bgCard} ${brd}`}>
                    <stat.icon className={`mx-auto mb-1.5 w-4 h-4 ${t.text}`}/>
                    <div className={`text-[8px] ${txtMuted} font-black tracking-widest uppercase mb-0.5`}>{stat.label}</div>
                    <div className={`${txtMain} font-black text-xs font-mono tabular-nums`}>{stat.val}</div>
                </div>
            ))}
        </div>

        {/* LIVE TELEMETRY VECTOR WAVEFORM GRAPH */}
        <div className={`w-full h-24 ${bgCard} border ${brd} rounded-2xl shadow-inner mt-4 p-3 relative flex flex-col justify-between z-10`}>
          <div className="flex justify-between items-center z-10 relative">
            <span className={`text-[9px] font-black uppercase tracking-widest ${txtMuted} flex items-center gap-1.5`}><Activity className={`w-3.5 h-3.5 ${t.text}`}/> Live Vector Waveform</span>
            <div className="flex gap-3 text-[8px] font-bold uppercase tracking-widest">
              <span className="text-cyan-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Velocity</span>
              <span className="text-amber-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Load (W)</span>
            </div>
          </div>
          
          <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-14 mt-1 opacity-90 relative z-0 drop-shadow-md">
            <polyline 
              fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
              points={liveWaveform.map((pt, i) => `${(i / 39) * 400},${100 - Math.min(100, (pt.power / ((motorWattage || 1000) * 1.5)) * 100)}`).join(' ')}
              style={{ transition: "all 0.5s linear" }}
            />
            <polyline 
              fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
              points={liveWaveform.map((pt, i) => `${(i / 39) * 400},${100 - Math.min(100, (pt.speed / 50) * 100)}`).join(' ')}
              style={{ transition: "all 0.5s linear" }}
            />
          </svg>
        </div>

        <button 
          disabled={!isTracking && !checkedSafety}
          onClick={isTracking ? stopTracking : startTracking}
          className={`mt-4 w-full min-h-[64px] rounded-2xl font-black uppercase text-sm sm:text-lg tracking-widest text-black shadow-2xl transition-all relative z-10 cursor-pointer ${!isTracking && !checkedSafety ? `opacity-40 ${bgCard} ${txtMuted} ${brd}` : (isTracking ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : `${t.bg} hover:opacity-90 ${t.shadow}`)}`}
        >
          {isTracking ? <div className="flex items-center justify-center gap-2"><Square className="w-5 h-5 fill-current" /> {tx('end_run')}</div> : <div className="flex items-center justify-center gap-2"><PlayCircle className="w-6 h-6" /> {tx('start_run')}</div>}
        </button>
      </div>

      {/* --- AI COPILOT COMPONENT --- */}
      <AICopilotWidget 
        ui={uiConfig} triggerCloudAiAnalysis={triggerCloudAiAnalysis} 
        isFetchingCloudAi={isFetchingCloudAi} cloudAiAnalysis={cloudAiAnalysis} 
        aiAdvice={aiAdvice} learnedEfficiency={learnedEfficiency} 
        motorEfficiencyPct={motorEfficiencyPct} pilotRiskIndex={pilotRiskIndex} 
        topographyRangeImpact={topographyRangeImpact} estStatorTemp={estStatorTemp} 
        estRotorTemp={estRotorTemp} liveRideScore={liveRideScore} 
        aeroDragForce={aeroDragForce} bonusRegenMiles={bonusRegenMiles} 
        terrainClassifier={terrainClassifier} thermalRunawayIndex={thermalRunawayIndex} 
        distLabel={distLabel}
      />

      {/* --- FINANCIAL SAVINGS COMPONENT --- */}
      <FinancialImpact totalMiles={totalMiles} ui={uiConfig} />

      {/* --- PREDICTIVE MAINTENANCE COMPONENT --- */}
      <PredictiveMaintenance totalMiles={totalMiles} safeRides={safeRides} triggerHaptic={triggerHaptic} ui={uiConfig} />

      {/* --- MISSION LOGS COMPONENT --- */}
      <MissionLogs
        safeRides={safeRides} logFilter={logFilter} setLogFilter={setLogFilter}
        expandedRideId={expandedRideId} setExpandedRideId={setExpandedRideId}
        lifetimeSeconds={lifetimeSeconds} totalFinancialSavings={totalFinancialSavings}
        lifetimeTopSpeed={lifetimeTopSpeed} speedLabel={speedLabel} distLabel={distLabel}
        useMetric={useMetric} exportRideGPX={exportRideGPX} setSavedRides={setSavedRides}
        handleBroadcastRideToBoard={handleBroadcastRideToBoard}
        triggerHistoricalAiDebrief={triggerHistoricalAiDebrief}
        isFetchingHistoricalAi={isFetchingHistoricalAi} historicalAiAnalysis={historicalAiAnalysis}
        updateRideNote={updateRideNote} tirePsi={tirePsi} callsign={props.callsign} ui={uiConfig} tx={tx}
      />

      {/* --- WEATHER & NEWS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <WeatherMatrix
          weatherData={weatherData} weatherInput={weatherInput} setWeatherInput={setWeatherInput}
          handleLocationSearch={handleLocationSearch} isFetchingWeather={isFetchingWeather}
          savedLocationName={savedLocationName} rideSafetyRating={rideSafetyRating}
          useMetric={useMetric} formatTimeFromIso={formatTimeFromIso}
          getWeatherIcon={getWeatherIcon} getCardinalDirection={getCardinalDirection}
          ui={uiConfig} tx={tx} localeCode={localeCode}
        />

        <PEVNewsFeed localeCode={localeCode} ui={uiConfig} />
      </div>

      {/* --- YOUTUBE DECK COMPONENT --- */}
      <YoutubeDeck ui={uiConfig} tx={tx} />

      {/* --- SATELLITE RADAR ATTACHMENT --- */}
      <div className={`${bgPanel} p-4 sm:p-6 rounded-3xl shadow-2xl border transition-colors space-y-4 ${brd}`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between border-b ${brd} pb-4 gap-4`}>
           <h3 className={`${txtMain} font-black uppercase tracking-widest text-sm flex items-center gap-2`}><MapIcon className={t.text} /> Global Satellite Radar</h3>
           <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${isTracking ? `border-[#39ff14]/50 text-[#39ff14] bg-[#39ff14]/10 animate-pulse` : `border-zinc-500 ${txtMuted}`}`}>{isTracking ? 'Active Sat Lock' : 'Standby Mode'}</span>
        </div>
        <div className={`shadow-inner rounded-2xl overflow-hidden border transition-colors relative ${isDayMode ? 'border-zinc-300' : 'border-zinc-800'}`}>
          <div className={isDayMode ? "contrast-125" : ""}>
             <RiderMap 
               userLat={activeUpdate.lat || 0} 
               userLng={activeUpdate.lng || 0} 
               speed={activeUpdate.speed || 0} 
               pevType={pevType} 
               userStatus={isTracking ? "Riding" : "Idle"} 
               isTracking={isTracking} 
               userName={"Anonymous Rider"} 
               compassHeading={compassHeading} 
             />
          </div>
        </div>
      </div>
    </div>
  );
}