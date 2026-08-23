"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { ActiveRider, PEVType } from "../types";
import { 
  Navigation, Users, Activity, RefreshCw, Eye, Search, X, 
  MapPin, Crosshair, Gauge, Route, Focus, ChevronRight, CornerDownRight, 
  Milestone, Clock, Volume2, VolumeX, Navigation2, Globe, Mountain,
  AlertTriangle, Compass, ShieldAlert, Radio, CircleDot, Trash2, RotateCcw,
  AlertOctagon, Wind, Volume1, CloudLightning, Magnet, Sun, Map as MapIcon, TrainFront
} from "lucide-react";

// Fix Leaflet's default icon paths in React environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface RiderMapProps {
  userLat: number;
  userLng: number;
  speed: number;
  pevType: PEVType;
  userStatus: string;
  isTracking: boolean;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  theme?: string;
  useMetric?: boolean;
  ghostMode?: boolean;
  satelliteMap?: boolean;
  locale?: string;
  timeFormat?: string;
  performanceMode?: boolean;
  uiScale?: string;
  globalVolume?: number;
  batteryPercent?: number;     
  estimatedRange?: number;     
  altitude?: number;           
  compassHeading?: number;     
  effectiveHeadwind?: number;  
}

interface RouteSummary { 
  distance: string; 
  time: string; 
  eta?: string; 
}

interface HazardPin {
  id: string;
  lat: number;
  lng: number;
  type: 'speed-trap' | 'pothole' | 'hazard' | 'meetup' | 'sos';
  timestamp: number;
}

export default function RiderMap({
  userLat,
  userLng,
  speed,
  pevType,
  userStatus,
  isTracking,
  onCoordinatesChange,
  theme = "lime",
  useMetric = false,
  ghostMode = false,
  satelliteMap = false,
  locale = "en",
  timeFormat = "12h",
  performanceMode = false,
  uiScale = "normal",
  globalVolume = 100,
  batteryPercent = 100,
  estimatedRange = 15,
  altitude = 0,
  compassHeading = 0,
  effectiveHeadwind = 0,
}: RiderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const rainRadarLayerRef = useRef<L.TileLayer | null>(null);
  const trailsLayerRef = useRef<L.TileLayer | null>(null);
  
  const userMarkerRef = useRef<L.Marker | null>(null);
  const otherMarkersRef = useRef<{ [id: string]: L.Marker }>({});
  const searchedMarkerRef = useRef<L.Marker | null>(null);
  const hazardMarkersRef = useRef<{ [id: string]: L.Marker }>({});
  
  const routingControlRef = useRef<any>(null);
  const lastRoutedPinRef = useRef<any>(null);
  
  const rangeCircleRef = useRef<L.Circle | null>(null);
  const reserveCircleRef = useRef<L.Circle | null>(null);

  // --- 🔥 CACHED COORDS FOR BACKGROUND APIS 🔥 ---
  const latRef = useRef(userLat);
  const lngRef = useRef(userLng);
  const pathRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    latRef.current = userLat;
    lngRef.current = userLng;
  }, [userLat, userLng]);

  const [riders, setRiders] = useState<ActiveRider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string>("Never");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchedPin, setSearchedPin] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [objectiveDistance, setObjectiveDistance] = useState<number>(Math.round(estimatedRange) || 15);

  const [topSpeed, setTopSpeed] = useState<number>(0);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [liveDynamicEta, setLiveDynamicEta] = useState<string | null>(null);
  const [closestRiderDist, setClosestRiderDist] = useState<number | null>(null);
  const [isFollowMode, setIsFollowMode] = useState<boolean>(true);

  // --- TACTICAL STATE ---
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'topo' | 'trails' | 'transit'>(satelliteMap ? 'satellite' : 'dark');
  const [followZoom, setFollowZoom] = useState<number>(16);
  const [showRainRadar, setShowRainRadar] = useState<boolean>(false);

  // --- LIVE ENVIRONMENTAL SENSORS ---
  const [liveAqi, setLiveAqi] = useState<number | null>(null);
  const [liveUv, setLiveUv] = useState<number | null>(null);

  // --- HAZARD & SPEED TRAP REPORTING STATE ---
  const [hazards, setHazards] = useState<HazardPin[]>([]);
  const [showRangeCircle, setShowRangeCircle] = useState<boolean>(true);
  const [mapOrientation, setMapOrientation] = useState<'north-up' | 'heading-up'>('north-up');
  const [autoZoomActive, setAutoZoomActive] = useState<boolean>(true);

  // --- SLOPE & ELEVATION GRADE TRACKER ---
  const [currentGrade, setCurrentGrade] = useState<number>(0);
  const lastAltCheckRef = useRef<number>(altitude);
  const lastDistCheckRef = useRef<{lat: number, lng: number}>({lat: userLat, lng: userLng});

  // --- TURN-BY-TURN NAVIGATION STATE ---
  const [routeInstructions, setRouteInstructions] = useState<any[]>([]);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState<number>(0);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [voiceNavEnabled, setVoiceNavEnabled] = useState<boolean>(true);

  // --- GPX TRAIL IMPORT STATE ---
  const [importedGpxPath, setImportedGpxPath] = useState<[number, number][] | null>(null);
  const [gpxFileName, setGpxFileName] = useState<string | null>(null);
  const gpxFileInputRef = useRef<HTMLInputElement>(null);
  const gpxPolylineRef = useRef<L.Polyline | null>(null);

  // --- GHOST RACING STATE ---
  const [ghostPosition, setGhostPosition] = useState<[number, number] | null>(null);
  const ghostIndexRef = useRef<number>(0);
  const ghostMarkerRef = useRef<L.Marker | null>(null);

  // --- GLOBAL THEME SYNC ENGINE ---
  const [localTheme, setLocalTheme] = useState<string>(theme || "lime");

  const getCardinalDirection = (angle: number) => {
    if (isNaN(angle)) return "N/A";
    const val = Math.floor((angle / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16 + 16) % 16];
  };

  useEffect(() => {
    if (theme) setLocalTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (estimatedRange && estimatedRange > 0) {
      setObjectiveDistance(Math.round(estimatedRange));
    }
  }, [estimatedRange]);

  useEffect(() => {
    const handleThemeSync = () => {
      const savedTheme = localStorage.getItem("rural_theme") || localStorage.getItem("rt_theme") || "lime";
      setLocalTheme(savedTheme);
    };

    window.addEventListener('theme-sync', handleThemeSync);
    window.addEventListener('storage', handleThemeSync);
    handleThemeSync();

    return () => {
      window.removeEventListener('theme-sync', handleThemeSync);
      window.removeEventListener('storage', handleThemeSync);
    };
  }, []);

  const themeMap = {
    lime: { hex: "#39ff14", text: "text-[#39ff14]", bg: "bg-[#39ff14]", border: "border-[#39ff14]", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(57,255,20,0.3)]", dim: "bg-[#39ff14]/20 border-[#39ff14]/50" },
    cyan: { hex: "#06b6d4", text: "text-cyan-400", bg: "bg-cyan-500", border: "border-cyan-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(6,182,212,0.3)]", dim: "bg-cyan-500/20 border-cyan-500/50" },
    emerald: { hex: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(16,185,129,0.3)]", dim: "bg-emerald-500/20 border-emerald-500/50" },
    amber: { hex: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(245,158,11,0.3)]", dim: "bg-amber-500/20 border-amber-500/50" },
    rose: { hex: "#f43f5e", text: "text-rose-400", bg: "bg-rose-500", border: "border-rose-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(244,63,94,0.3)]", dim: "bg-rose-500/20 border-rose-500/50" },
    purple: { hex: "#a855f7", text: "text-purple-400", bg: "bg-purple-500", border: "border-purple-500", shadow: performanceMode ? '' : "shadow-[0_0_20px_rgba(168,85,247,0.3)]", dim: "bg-purple-500/20 border-purple-500/50" },
    void: { hex: "#ffffff", text: "text-white", bg: "bg-zinc-800", border: "border-zinc-500", shadow: performanceMode ? '' : "shadow-[0_0_20px_rgba(255,255,255,0.1)]", dim: "bg-zinc-900/50 border-zinc-700/50" }
  };
  
  const activeTheme = themeMap[localTheme as keyof typeof themeMap] || themeMap.lime;

  // --- 🔥 LIVE OPEN-METEO ENVIRONMENTAL SYNC (GATED TO REAL COORDS) 🔥 ---
  useEffect(() => {
    const fetchEnvData = async () => {
      const lat = latRef.current;
      const lng = lngRef.current;
      
      if (!lat || !lng || lat === 0 || lng === 0) return;

      try {
        const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,uv_index`);
        if (res.ok) {
          const data = await res.json();
          if (data.current) {
            setLiveAqi(data.current.us_aqi ?? 0);
            setLiveUv(data.current.uv_index ?? 0);
          }
        }
      } catch (err) {
        console.warn("Environmental API latency. Retrying on next interval.");
      }
    };
    
    fetchEnvData();
    const interval = setInterval(fetchEnvData, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [userLat, userLng]);

  const mechanicSpeak = async (text: string) => {
    if (!voiceNavEnabled || globalVolume <= 0) return;
    try {
      await TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate: 1.0,
        pitch: 0.9,
        volume: globalVolume / 100,
        category: 'ambient'
      });
    } catch (err) {
      console.error("TTS Engine Playback Error:", err);
    }
  };

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/riders");
      if (res.ok) {
        const data = await res.json();
        const filteredRiders = ghostMode ? data.riders.filter((r: ActiveRider) => r.id !== "user-rider-active") : (data.riders || []);
        setRiders(filteredRiders);
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Failed to fetch riders:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendPositionUpdate = async (lat: number, lng: number) => {
    if (ghostMode) return;
    try {
      await fetch("/api/riders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "user-rider-active",
          name: "You (Rider)",
          lat,
          lng,
          speed,
          pevType,
          status: userStatus,
        }),
      });
    } catch (err) {
      console.error("Error updating location:", err);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = useMetric ? 6371 : 3958.8; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  const formatSpeed = (val: number) => {
    return useMetric ? (val * 1.60934).toFixed(1) : val.toFixed(1);
  };

  const formatDistance = (val: number) => {
    return useMetric ? `${(val * 1.60934).toFixed(2)} KM` : `${val.toFixed(2)} MI`;
  };

  // --- DROP HAZARD PIN OR SOS ---
  const reportHazard = (type: 'speed-trap' | 'pothole' | 'hazard' | 'meetup' | 'sos') => {
    if (userLat === 0 || userLng === 0) return;
    const newHazard: HazardPin = {
      id: Date.now().toString(),
      lat: userLat,
      lng: userLng,
      type,
      timestamp: Date.now()
    };
    setHazards(prev => [...prev, newHazard]);
    if (type === 'sos') {
      mechanicSpeak("EMERGENCY S.O.S. Beacon broadcasted to telemetry grid!");
    } else {
      mechanicSpeak(`Warning marker broadcasted: ${type.replace('-', ' ')}.`);
    }
  };

  const clearAllHazards = () => {
    setHazards([]);
    Object.keys(hazardMarkersRef.current).forEach(id => {
      hazardMarkersRef.current[id].remove();
      delete hazardMarkersRef.current[id];
    });
    mechanicSpeak("All hazard pins cleared.");
  };

  const removeSingleHazard = (id: string) => {
    setHazards(prev => prev.filter(h => h.id !== id));
    if (hazardMarkersRef.current[id]) {
      hazardMarkersRef.current[id].remove();
      delete hazardMarkersRef.current[id];
    }
    mechanicSpeak("Hazard pin removed.");
  };

  // Proximity Hazard Warning Scanner
  useEffect(() => {
    if (userLat === 0 || userLng === 0 || hazards.length === 0) return;
    hazards.forEach(hz => {
      const dist = calculateDistance(userLat, userLng, hz.lat, hz.lng);
      if (dist < 0.05) { 
        mechanicSpeak(`Caution! Approaching reported ${hz.type.replace('-', ' ')} ahead!`);
      }
    });
  }, [userLat, userLng, hazards]);

  // --- ELEVATION GRADE CALCULATION ---
  useEffect(() => {
    if (userLat === 0 || userLng === 0) return;
    const distMoved = calculateDistance(lastDistCheckRef.current.lat, lastDistCheckRef.current.lng, userLat, userLng);
    if (distMoved > 0.01) { 
      const altDiffMeters = (altitude - lastAltCheckRef.current) * 3.28084;
      const distMeters = distMoved * 1609.34;
      if (distMeters > 0) {
        const grade = (altDiffMeters / distMeters) * 100;
        setCurrentGrade(Math.round(grade));
        if (grade > 10) {
          mechanicSpeak("Steep incline detected. High motor torque required.");
        }
      }
      lastAltCheckRef.current = altitude;
      lastDistCheckRef.current = { lat: userLat, lng: userLng };
    }
  }, [userLat, userLng, altitude]);

  // --- FEATURE 3: SPEED-ADAPTIVE AUTO-ZOOM LOGIC ---
  useEffect(() => {
    if (!isTracking || !autoZoomActive || !mapRef.current) return;
    const currentSpeedMph = useMetric ? speed * 0.621371 : speed;
    let targetZoom = 16;
    if (currentSpeedMph > 30) targetZoom = 14;      
    else if (currentSpeedMph > 15) targetZoom = 15; 
    else if (currentSpeedMph < 3) targetZoom = 17;  

    setFollowZoom(targetZoom);
  }, [speed, isTracking, autoZoomActive, useMetric]);

  // Address Search Handler
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSearchedPin({ lat, lng, name: data[0].display_name });
        if (mapRef.current) mapRef.current.setView([lat, lng], 15, { animate: true });
        setIsFollowMode(false);
        mechanicSpeak(`Target locked for ${searchQuery}. Calculating navigation route.`);
      } else {
        alert("Address not found.");
        mechanicSpeak("I couldn't find that location on the grid.");
      }
    } catch (err) {
      console.error("Geocoding error", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGpxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGpxFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const gpxText = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxText, "text/xml");
        const trackPoints = xmlDoc.getElementsByTagName("trkpt");
        const coords: [number, number][] = [];
        
        for (let i = 0; i < trackPoints.length; i++) {
          const lat = parseFloat(trackPoints[i].getAttribute("lat") || "0");
          const lon = parseFloat(trackPoints[i].getAttribute("lon") || "0");
          if (lat !== 0 && lon !== 0) coords.push([lat, lon]);
        }
        
        if (coords.length > 0) {
          setImportedGpxPath(coords);
          mechanicSpeak("GPX Trail path imported successfully.");
          if (mapRef.current) {
            mapRef.current.fitBounds(L.polyline(coords).getBounds(), { padding: [50, 50] });
          }
        }
      } catch (err) {
        alert("Failed to parse GPX file.");
      }
    };
    reader.readAsText(file);
    if (gpxFileInputRef.current) gpxFileInputRef.current.value = "";
  };

  const clearGpxTrail = () => {
    setImportedGpxPath(null);
    setGpxFileName(null);
    if (gpxPolylineRef.current) {
      gpxPolylineRef.current.remove();
      gpxPolylineRef.current = null;
    }
    mechanicSpeak("Trail overlay cleared.");
  };

  // --- LIVE DOPPLER RAIN RADAR TILE LAYER ---
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (rainRadarLayerRef.current) {
      map.removeLayer(rainRadarLayerRef.current);
      rainRadarLayerRef.current = null;
    }
if (showRainRadar) {
      const fetchRadar = async () => {
        try {
          const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
          const data = await response.json();
          const latestFrame = data.radar.past[data.radar.past.length - 1];
          const radarUrl = `${data.host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

          rainRadarLayerRef.current = L.tileLayer(radarUrl, {
            opacity: 0.65,
            zIndex: 500,
            maxNativeZoom: 7, // 🔥 FIX: Prevents "Zoom Level Not Supported" errors at street level
            maxZoom: 20,
            attribution: 'RainViewer'
          }).addTo(map);
          mechanicSpeak("Live Doppler precipitation overlay engaged.");
        } catch (error) {
          console.warn("Failed to fetch live RainViewer radar matrix.", error);
        }
      };
      fetchRadar();
    }
    
  }, [showRainRadar]);

  // --- DUAL-BUFFER RANGE ISOCHRONE ENGINE ---
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (rangeCircleRef.current) {
      rangeCircleRef.current.remove();
      rangeCircleRef.current = null;
    }
    if (reserveCircleRef.current) {
      reserveCircleRef.current.remove();
      reserveCircleRef.current = null;
    }

    if (showRangeCircle && userLat !== 0 && userLng !== 0) {
      const distMiles = useMetric ? objectiveDistance / 1.60934 : objectiveDistance;
      const radiusMeters = distMiles * 1609.34;

      rangeCircleRef.current = L.circle([userLat, userLng], {
        radius: radiusMeters,
        color: activeTheme.hex,
        fillColor: activeTheme.hex,
        fillOpacity: 0.05,
        weight: 1.5,
        dashArray: "6, 6",
        interactive: false
      }).addTo(map);

      reserveCircleRef.current = L.circle([userLat, userLng], {
        radius: radiusMeters * 0.25,
        color: "#f43f5e",
        fillColor: "#f43f5e",
        fillOpacity: 0.12,
        weight: 2,
        dashArray: "2, 4",
        interactive: false
      }).addTo(map);
    }
  }, [showRangeCircle, userLat, userLng, objectiveDistance, activeTheme, useMetric]);

  // --- LIVE GPS TURN-BY-TURN ENGINE ---
  useEffect(() => {
    if (routeInstructions.length > 0 && routeCoords.length > 0 && currentInstructionIndex < routeInstructions.length && isTracking) {
      const nextInstruction = routeInstructions[currentInstructionIndex];
      const targetCoord = routeCoords[nextInstruction.index];

      if (targetCoord && userLat !== 0 && userLng !== 0) {
        const distToTurn = calculateDistance(userLat, userLng, targetCoord.lat, targetCoord.lng);
        const threshold = useMetric ? 0.05 : 0.03; 

        if (distToTurn < threshold) {
          mechanicSpeak(nextInstruction.text);
          setCurrentInstructionIndex(prev => prev + 1);
        }
      }
    }
  }, [userLat, userLng, routeInstructions, routeCoords, currentInstructionIndex, isTracking, useMetric]);

  // Calculate Distance to Targets and Live ETA dynamically
  useEffect(() => {
    if (speed > topSpeed) setTopSpeed(speed);

    if (searchedPin && userLat !== 0 && userLng !== 0) {
      const dist = calculateDistance(userLat, userLng, searchedPin.lat, searchedPin.lng);
      setDistanceToTarget(dist);
      
      if (speed > 1) {
        const speedMiles = useMetric ? speed * 0.621371 : speed;
        const distMiles = useMetric ? dist / 1.60934 : dist;
        const hoursToTarget = distMiles / speedMiles;
        const minsToTarget = Math.round(hoursToTarget * 60);
        
        if (minsToTarget < 60) setLiveDynamicEta(`${minsToTarget}m`);
        else setLiveDynamicEta(`${Math.floor(minsToTarget/60)}h ${minsToTarget%60}m`);
      } else {
        setLiveDynamicEta("--");
      }
    } else {
      setDistanceToTarget(null);
      setLiveDynamicEta(null);
    }

    if (riders.length > 0 && userLat !== 0 && userLng !== 0) {
      let minDistance = Infinity;
      riders.forEach(r => {
        if (r.id !== "user-rider-active") {
          const dist = calculateDistance(userLat, userLng, r.lat, r.lng);
          if (dist < minDistance) minDistance = dist;
        }
      });
      setClosestRiderDist(minDistance !== Infinity ? minDistance : null);
    } else {
      setClosestRiderDist(null);
    }
  }, [speed, userLat, userLng, searchedPin, riders]);

  // Map Initial Mounting Canvas & Drag Handler
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLat !== 0 ? userLat : 35.2637, userLng !== 0 ? userLng : -95.1294],
      zoom: followZoom,
      zoomControl: false,
      attributionControl: false,
    });

    map.on("dragstart movestart", (e: any) => {
      if (e.originalEvent) setIsFollowMode(false);
    });

    let initialUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    if (satelliteMap || mapStyle === 'satellite') initialUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

    tileLayerRef.current = L.tileLayer(initialUrl, { maxZoom: 20 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize({ animate: true });
    }, 250);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSearchedPin({ lat, lng, name: `Dropped Waypoint (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setIsFollowMode(false);
      mechanicSpeak("Custom waypoint pinned.");
    });

    pathRef.current = L.polyline([], { 
      color: activeTheme.hex, 
      weight: 4, 
      opacity: 0.8, 
      interactive: false 
    }).addTo(map);

    fetchRiders();
    const fetchInterval = setInterval(fetchRiders, 5000);

    return () => {
      clearInterval(fetchInterval);
      if (routingControlRef.current && mapRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // --- HAZARDS MARKER RENDERER ---
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const activeIds = hazards.map(h => h.id);

    Object.keys(hazardMarkersRef.current).forEach(id => {
      if (!activeIds.includes(id)) {
        hazardMarkersRef.current[id].remove();
        delete hazardMarkersRef.current[id];
      }
    });

    hazards.forEach(hz => {
      const icons = {
        'speed-trap': '👮‍♂️',
        'pothole': '⚠️',
        'hazard': '🚧',
        'meetup': '⛺',
        'sos': '🆘'
      };

      const hzIcon = L.divIcon({
        className: "hazard-marker",
        html: `<div class="bg-zinc-900 border ${hz.type === 'sos' ? 'border-rose-500 animate-bounce' : 'border-amber-500'} rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-lg cursor-pointer">${icons[hz.type]}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (!hazardMarkersRef.current[hz.id]) {
        const marker = L.marker([hz.lat, hz.lng], { icon: hzIcon }).addTo(map);
        
        const popupDiv = document.createElement('div');
        popupDiv.className = "text-zinc-900 p-1 font-sans";
        popupDiv.innerHTML = `
          <strong class="uppercase text-amber-600 block text-xs font-black">${hz.type.replace('-', ' ')}</strong>
          <span class="text-[10px] text-zinc-600 block mb-2">Reported on telemetry grid</span>
          <button id="clear-hz-${hz.id}" class="w-full bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase py-1 px-2 rounded shadow cursor-pointer">
            Clear Hazard
          </button>
        `;

        popupDiv.querySelector(`#clear-hz-${hz.id}`)?.addEventListener('click', () => {
          removeSingleHazard(hz.id);
        });

        marker.bindPopup(popupDiv);
        hazardMarkersRef.current[hz.id] = marker;
      }
    });
  }, [hazards]);

  // Update Path line color dynamically
  useEffect(() => {
    if (pathRef.current) {
      pathRef.current.setStyle({ color: activeTheme.hex });
    }
  }, [activeTheme]);

  // Render Imported GPX Trail Overlay
  useEffect(() => {
    if (!mapRef.current) return;
    if (gpxPolylineRef.current) {
      gpxPolylineRef.current.remove();
      gpxPolylineRef.current = null;
    }

    if (importedGpxPath && importedGpxPath.length > 0) {
      gpxPolylineRef.current = L.polyline(importedGpxPath, {
        color: "#f59e0b",
        weight: 5,
        opacity: 0.8,
        dashArray: "10, 10",
        lineCap: "round",
        interactive: false
      }).addTo(mapRef.current);
    }
  }, [importedGpxPath]);

  // --- GHOST RACING TIME-ATTACK ENGINE ---
  useEffect(() => {
    if (!isTracking || !importedGpxPath || importedGpxPath.length === 0) {
      setGhostPosition(null);
      ghostIndexRef.current = 0;
      return;
    }

    const ghostInterval = setInterval(() => {
      ghostIndexRef.current += 1;
      if (ghostIndexRef.current < importedGpxPath.length) {
        setGhostPosition(importedGpxPath[ghostIndexRef.current]);
      } else {
        clearInterval(ghostInterval);
      }
    }, 1000);

    return () => clearInterval(ghostInterval);
  }, [isTracking, importedGpxPath]);

  // Render Ghost Marker
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (ghostPosition) {
      const ghostIcon = L.divIcon({
        className: "ghost-racer-marker",
        html: `
          <div class="relative flex items-center justify-center opacity-70">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-white/40 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-white/80 border-2 border-dashed border-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.8)]"></span>
            <div class="absolute -top-7 whitespace-nowrap bg-zinc-900/90 text-[9px] font-black text-white px-1.5 py-0.5 rounded border border-zinc-700 shadow uppercase">
              👻 GHOST
            </div>
          </div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      });

      if (ghostMarkerRef.current) {
        ghostMarkerRef.current.setLatLng(ghostPosition).setIcon(ghostIcon);
      } else {
        ghostMarkerRef.current = L.marker(ghostPosition, { icon: ghostIcon, zIndexOffset: 950 }).addTo(mapRef.current);
      }
    } else if (ghostMarkerRef.current) {
      ghostMarkerRef.current.remove();
      ghostMarkerRef.current = null;
    }
  }, [ghostPosition]);

  // Dynamic Tactical Layer Toggling
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const map = mapRef.current;

    map.removeLayer(tileLayerRef.current);
    if (trailsLayerRef.current) {
      map.removeLayer(trailsLayerRef.current);
      trailsLayerRef.current = null;
    }
    
    let baseMapUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    if (mapStyle === 'satellite' || satelliteMap) baseMapUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (mapStyle === 'topo') baseMapUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
    if (mapStyle === 'trails' || mapStyle === 'transit') baseMapUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"; 

    tileLayerRef.current = L.tileLayer(baseMapUrl, { maxZoom: 20 }).addTo(map);

    if (mapStyle === 'trails') {
      trailsLayerRef.current = L.tileLayer("https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png", {
        maxZoom: 20,
        opacity: 0.8,
        zIndex: 400
      }).addTo(map);
    } else if (mapStyle === 'transit') {
      trailsLayerRef.current = L.tileLayer("https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", {
        maxZoom: 19,
        opacity: 0.7,
        zIndex: 400
      }).addTo(map);
    }

    if (showRainRadar && rainRadarLayerRef.current) {
       rainRadarLayerRef.current.bringToFront();
    }
  }, [mapStyle, satelliteMap]);

  // Process Live Routing Matrices
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (searchedPin === lastRoutedPinRef.current && searchedPin !== null) return; 

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    if (userLat !== 0 && userLng !== 0 && searchedPin) {
      lastRoutedPinRef.current = searchedPin;

      routingControlRef.current = (L as any).Routing.control({
        waypoints: [
          L.latLng(userLat, userLng),
          L.latLng(searchedPin.lat, searchedPin.lng)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        show: false, 
        lineOptions: {
          styles: [{ color: activeTheme.hex, weight: 6, opacity: 0.9 }]
        }
      }).addTo(map);

      routingControlRef.current.on('routesfound', function(e: any) {
        const routes = e.routes;
        if (routes && routes[0]) {
          const route = routes[0];
          const rawDistMeters = route.summary.totalDistance;
          const distFormatted = useMetric ? `${(rawDistMeters / 1000).toFixed(1)} KM` : `${(rawDistMeters / 1609.34).toFixed(1)} Miles`;
          const timeMins = Math.round(route.summary.totalTime / 60);
          
          const d = new Date();
          d.setMinutes(d.getMinutes() + timeMins);
          const etaStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: timeFormat === "12h" });

          setRouteSummary({
            distance: distFormatted,
            time: `${timeMins} Min`,
            eta: etaStr
          });
          
          if (route.instructions && route.coordinates) {
            setRouteInstructions(route.instructions);
            setRouteCoords(route.coordinates);
            setCurrentInstructionIndex(0); 
          }

          mechanicSpeak(`Route synchronized. Destination is ${distFormatted} out.`);
        }
      });
    } else if (!searchedPin) {
      lastRoutedPinRef.current = null;
      setRouteInstructions([]);
      setRouteCoords([]);
      setCurrentInstructionIndex(0);
      setRouteSummary(null);
    }
  }, [userLat, userLng, searchedPin, useMetric, timeFormat, activeTheme]);

  useEffect(() => {
    if (!isTracking || ghostMode) return;
    const updateInterval = setInterval(() => sendPositionUpdate(userLat, userLng), 4000);
    return () => clearInterval(updateInterval);
  }, [isTracking, userLat, userLng, speed, pevType, userStatus, ghostMode]);

  // --- 🔥 STABLE USER MARKER & PATH TRACKING ENGINE 🔥 ---
  useEffect(() => {
    if (!mapRef.current || userLat === 0 || userLng === 0) return;
    const map = mapRef.current;

    // 1. DIRECTIONAL VISION CONE & PLAYER ICON
    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: `
        <div class="relative flex items-center justify-center" style="transform: rotate(${mapOrientation === 'heading-up' ? 0 : (compassHeading || 0)}deg);">
          <!-- Tactical Vision Cone -->
          <div class="absolute -top-8 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[30px]" style="border-bottom-color: ${activeTheme.hex}40; filter: drop-shadow(0 0 6px ${activeTheme.hex});"></div>
          
          <!-- Core Icon Base -->
          <span class="absolute inline-flex h-8 w-8 rounded-full ${activeTheme.bg}/40 animate-pulse"></span>
          <span class="relative inline-flex rounded-full h-4.5 w-4.5 ${activeTheme.bg} border-2 border-zinc-950 flex items-center justify-center shadow-lg"></span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLat, userLng]);
      userMarkerRef.current.setIcon(userIcon);
    } else {
      userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    }
    userMarkerRef.current.bindPopup(`<strong class="text-zinc-900">You (Rider)</strong><br><span class="text-zinc-600 text-xs">${pevType} • ${formatSpeed(speed)} ${useMetric ? 'KM/H' : 'MPH'}</span>`);

    // 2. SAFE PATH RENDERING
    if (isTracking && pathRef.current) {
      pathRef.current.addLatLng([userLat, userLng]);
    }

    if (isTracking && isFollowMode) {
      map.setView([userLat, userLng], followZoom, { animate: true, duration: 1 });
      if (mapOrientation === 'heading-up' && compassHeading) {
        map.setBearing?.(compassHeading);
      }
    }
  }, [userLat, userLng, pevType, speed, isTracking, isFollowMode, followZoom, activeTheme, useMetric, mapOrientation, compassHeading]);

  // Active Riders Render
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const activeIds = riders.map(r => r.id);
    
    Object.keys(otherMarkersRef.current).forEach(id => {
      if (!activeIds.includes(id) && id !== "user-rider-active") {
        otherMarkersRef.current[id].remove();
        delete otherMarkersRef.current[id];
      }
    });

    riders.forEach(rider => {
      if (rider.id === "user-rider-active") return; 
      let colorClass = "bg-sky-400"; let pingClass = "bg-sky-500/30";
      if (rider.pevType.includes("Bike")) { colorClass = "bg-emerald-400"; pingClass = "bg-emerald-500/30"; }
      else if (rider.pevType.includes("Moped")) { colorClass = "bg-amber-400"; pingClass = "bg-amber-500/30"; }
      else if (rider.pevType.includes("Unicycle")) { colorClass = "bg-purple-400"; pingClass = "bg-purple-500/30"; }

      const riderIcon = L.divIcon({
        className: "custom-rider-marker",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-7 w-7 rounded-full ${pingClass} animate-pulse"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 ${colorClass} border-2 border-zinc-950 flex items-center justify-center shadow-md"></span>
            <div class="absolute -top-6 whitespace-nowrap bg-[#121318]/90 text-[9px] font-bold text-zinc-100 px-1.5 py-0.5 rounded border border-zinc-800 pointer-events-none shadow">
              ${rider.name}
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const popupHtml = `
        <div class="text-zinc-900 p-1 font-sans">
          <h4 class="font-bold text-xs">${rider.name}</h4>
          <p class="text-[10px] text-zinc-600 mt-0.5">${rider.pevType}</p>
          <div class="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-zinc-100 font-mono text-[9px] text-zinc-500">
            <span>📡 ${rider.status || 'N/A'}</span> <span>•</span> <span>💨 ${formatSpeed(rider.speed || 0)} ${useMetric ? 'KM/H' : 'MPH'}</span>
          </div>
        </div>
      `;

      if (otherMarkersRef.current[rider.id]) {
        otherMarkersRef.current[rider.id].setLatLng([rider.lat, rider.lng]);
        otherMarkersRef.current[rider.id].setPopupContent(popupHtml);
      } else {
        otherMarkersRef.current[rider.id] = L.marker([rider.lat, rider.lng], { icon: riderIcon }).addTo(map).bindPopup(popupHtml);
      }
    });
  }, [riders, useMetric]);

  return (
    <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-3 sm:p-5 space-y-4 relative w-full overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-zinc-200 font-bold text-sm tracking-wide flex items-center gap-2.5">
            <Users className={`w-5 h-5 ${activeTheme.text}`} /> RURAL RIDER RADAR {ghostMode && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase">Ghost Mode Active</span>}
          </h3>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Tactical telemetry, AI range isochrones, and hazard reporting.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {routeInstructions.length > 0 && currentInstructionIndex < routeInstructions.length && (
            <button 
              onClick={() => mechanicSpeak(routeInstructions[currentInstructionIndex].text)}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer"
              title="Repeat Turn Instruction"
            >
              <Volume1 className="w-3.5 h-3.5" /> Replay Turn
            </button>
          )}

          <button 
            onClick={() => {
                setVoiceNavEnabled(!voiceNavEnabled); 
                mechanicSpeak(voiceNavEnabled ? "Voice navigation muted." : "Voice navigation active.");
            }} 
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${voiceNavEnabled ? `${activeTheme.dim} ${activeTheme.text}` : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}
            title="Toggle Voice Navigation"
          >
            {voiceNavEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <span className="text-[9px] font-mono text-zinc-500 hidden sm:inline">Sync: {lastSync}</span>
          <button onClick={fetchRiders} disabled={loading} className="p-2 rounded-lg bg-[#181a20] hover:bg-[#20232c] border border-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? `animate-spin ${activeTheme.text}` : ""}`} />
          </button>
        </div>
      </div>

      {/* --- MOBILE-FRIENDLY TACTICAL CONTROL BAR --- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#181a20] border border-zinc-800 p-3 rounded-xl">
        
        {/* Left: Hazard Reporting Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <span className="text-[8px] font-mono font-black uppercase text-zinc-400 shrink-0 mr-1">Report:</span>
          
          <button onClick={() => reportHazard('speed-trap')} className="min-h-[36px] px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-amber-400 hover:border-amber-500 transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
            👮‍♂️ Trap
          </button>
          <button onClick={() => reportHazard('pothole')} className="min-h-[36px] px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-rose-400 hover:border-rose-500 transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
            ⚠️ Pothole
          </button>
          <button onClick={() => reportHazard('hazard')} className="min-h-[36px] px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-cyan-400 hover:border-cyan-500 transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
            🚧 Obstacle
          </button>
          <button onClick={() => reportHazard('sos')} className="min-h-[36px] px-3 rounded-lg bg-rose-950 border border-rose-800 text-[9px] font-black text-rose-300 hover:bg-rose-900 transition-colors flex items-center gap-1 shrink-0 cursor-pointer animate-pulse">
            🆘 S.O.S
          </button>

          {hazards.length > 0 && (
            <button onClick={clearAllHazards} className="min-h-[36px] px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-[9px] font-bold text-zinc-300 hover:text-white transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
              <Trash2 className="w-3 h-3" /> Clear ({hazards.length})
            </button>
          )}
        </div>

        {/* Right: Range Ring Slider, Doppler Radar & Orientation Toggle */}
        <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
          
          {/* RAINVIEWER DOPPLER TOGGLE */}
          <button 
            type="button"
            onClick={() => setShowRainRadar(!showRainRadar)} 
            className={`min-h-[36px] px-3 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${showRainRadar ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
          >
            <CloudLightning className="w-3.5 h-3.5 text-cyan-400" /> Doppler {showRainRadar ? "ON" : "OFF"}
          </button>

          <button 
            onClick={() => setShowRangeCircle(!showRangeCircle)} 
            className={`min-h-[36px] px-3 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${showRangeCircle ? `${activeTheme.dim} ${activeTheme.text}` : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
          >
            <CircleDot className="w-3.5 h-3.5" /> Rings {showRangeCircle ? "ON" : "OFF"}
          </button>

          {showRangeCircle && (
            <div className="flex items-center gap-2 bg-black/60 border border-zinc-800 px-2.5 py-1.5 rounded-lg">
              <span className="text-[9px] font-mono font-bold uppercase text-zinc-400">
                Range: <strong className={activeTheme.text}>{objectiveDistance} {useMetric ? 'KM' : 'MI'}</strong>
              </span>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={objectiveDistance} 
                onChange={(e) => setObjectiveDistance(Number(e.target.value))} 
                className={`w-20 sm:w-28 ${activeTheme.text} accent-current bg-zinc-800 h-1.5 rounded-lg cursor-pointer outline-none`} 
              />
            </div>
          )}

          <button 
            onClick={() => setMapOrientation(prev => prev === 'north-up' ? 'heading-up' : 'north-up')} 
            className="min-h-[36px] px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-wider text-cyan-400 hover:border-cyan-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" /> {mapOrientation.toUpperCase()}
          </button>
        </div>
      </div>

      {/* ADVANCED COORDINATE SEARCH INPUT */}
      <form onSubmit={handleSearchAddress} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search destination address or coordinates..." className={`w-full bg-[#181a20] border border-zinc-800 text-xs text-white pl-9 pr-4 py-3 rounded-xl outline-none focus:${activeTheme.border} transition-colors shadow-inner`} />
        </div>
        <button type="submit" disabled={isSearching || !searchQuery.trim()} className={`${activeTheme.bg} hover:opacity-90 disabled:opacity-50 text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center shadow-md cursor-pointer`}>
          {isSearching ? "Searching..." : "Search"}
        </button>
        {searchedPin && (
          <button type="button" onClick={() => { setSearchedPin(null); setSearchQuery(""); setDistanceToTarget(null); setLiveDynamicEta(null); setIsFollowMode(true); mechanicSpeak("Target cleared."); }} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-xs font-black uppercase transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* GPX TRAIL IMPORT CONTROLS */}
      <div className="flex items-center gap-2">
        <input 
          type="file" 
          accept=".gpx" 
          ref={gpxFileInputRef} 
          onChange={handleGpxUpload} 
          className="hidden" 
        />
        {importedGpxPath ? (
          <div className="flex items-center justify-between w-full bg-amber-950/20 border border-amber-500/40 px-3 py-2 rounded-xl">
            <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 truncate">
              <Route className="w-4 h-4 shrink-0" /> ACTIVE TRAIL: {gpxFileName}
            </span>
            <button 
              type="button" 
              onClick={clearGpxTrail} 
              className="text-amber-500 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            type="button" 
            onClick={() => gpxFileInputRef.current?.click()} 
            className={`w-full bg-[#181a20] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-inner cursor-pointer`}
          >
            <Milestone className="w-4 h-4" /> Import Custom .GPX Trail Overlay
          </button>
        )}
      </div>

      {/* TWO-COLUMN HUD LAYOUT FOR MAP & TURNS */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:h-[520px]">
        
        {/* LEFT COLUMN: INTERACTIVE LEAFLET VIEWPORT */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-zinc-800/80 relative bg-zinc-950 flex flex-col min-h-[400px] lg:h-full w-full">
          
          {/* 🔥 TOP-CENTER TACTICAL ENVIRONMENTAL HUD (LIVE DATA) 🔥 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 bg-black/85 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.8)] pointer-events-none">
            <div className="flex items-center gap-1.5 border-r border-zinc-700 pr-3">
              <Magnet className={`w-3.5 h-3.5 ${activeTheme.text} animate-pulse`} />
              <span className={`text-[10px] font-mono font-black tracking-widest uppercase ${activeTheme.text}`}>MAG-LOCK: {Math.round(compassHeading || 0)}° {getCardinalDirection(compassHeading || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5 border-r border-zinc-700 pr-3">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-black text-cyan-300">AQI: {liveAqi ?? '--'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono font-black text-amber-400">UV: {liveUv ?? '--'}</span>
            </div>
          </div>

          {/* TOP GRAPHICAL OVERLAY */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 bg-black/85 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.8)] pointer-events-none">
            <div className="flex items-center gap-1.5 border-r border-zinc-700 pr-3">
              <Magnet className={`w-3.5 h-3.5 ${activeTheme.text} animate-pulse`} />
              <span className={`text-[10px] font-mono font-black tracking-widest uppercase ${activeTheme.text}`}>MAG-LOCK: {Math.round(compassHeading || 0)}° {getCardinalDirection(compassHeading || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5 border-r border-zinc-700 pr-3">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-black text-cyan-300">AQI: {liveAqi ?? '--'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono font-black text-amber-400">UV: {liveUv ?? '--'}</span>
            </div>
          </div>

          {/* TOP GRAPHICAL OVERLAY */}
          <div className="absolute top-0 left-0 right-0 z-[400] bg-gradient-to-b from-zinc-950/90 to-transparent pt-14 pb-8 px-4 pointer-events-none flex justify-between items-start gap-2 flex-wrap">
            <div className="flex flex-col">
              <span className={`text-[10px] ${activeTheme.text} font-black tracking-widest uppercase flex items-center gap-1.5 mb-1`}><Gauge className="w-3.5 h-3.5" /> GROUND SPEED</span>
              <div className="flex items-baseline gap-1.5 drop-shadow-lg">
                <span className={`text-4xl font-black font-mono tracking-tighter ${((speed || 0) * (useMetric ? 1.609 : 1)) > (topSpeed || 0) ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{formatSpeed(speed)}</span>
                <span className="text-sm font-bold text-zinc-400">{useMetric ? 'KM/H' : 'MPH'}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 mt-1">V-MAX: <span className="text-zinc-300">{formatSpeed(topSpeed)} {useMetric ? 'KM/H' : 'MPH'}</span></span>
            </div>

            <div className="flex flex-col items-end text-right">
              {distanceToTarget !== null ? (
                <div className="flex flex-col items-end bg-black/60 border border-zinc-800 px-3 py-2 rounded-xl backdrop-blur-md">
                  <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase flex items-center gap-1.5 mb-1"><Crosshair className="w-3.5 h-3.5" /> TARGET DIST</span>
                  <div className="flex items-baseline gap-1.5 drop-shadow-lg">
                    <span className="text-3xl font-black text-white font-mono tracking-tighter">{formatDistance(distanceToTarget).split(' ')[0]}</span>
                    <span className="text-sm font-bold text-zinc-400">{useMetric ? 'KM' : 'MI'}</span>
                  </div>
                  {liveDynamicEta && (
                    <div className="text-[9px] font-mono text-cyan-400 mt-1 uppercase border-t border-zinc-700 pt-1 w-full text-right">Live ETA: {liveDynamicEta}</div>
                  )}
                </div>
              ) : closestRiderDist !== null ? (
                <>
                  <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5" /> NEAREST RIDER</span>
                  <div className="flex items-baseline gap-1.5 drop-shadow-lg">
                    <span className="text-3xl font-black text-amber-400 font-mono tracking-tighter">{formatDistance(closestRiderDist).split(' ')[0]}</span>
                    <span className="text-sm font-bold text-zinc-400">{useMetric ? 'KM' : 'MI'}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          
          {/* LIVE NEXT-TURN HUD BANNER OVERLAY */}
          {routeInstructions.length > 0 && currentInstructionIndex < routeInstructions.length && (
             <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[400] w-11/12 max-w-sm bg-black/85 backdrop-blur-md border ${activeTheme.border} p-4 rounded-2xl ${activeTheme.shadow} pointer-events-none`}>
                <div className="flex items-center gap-4">
                   <div className={`${activeTheme.bg} p-2.5 rounded-xl shadow-inner shrink-0`}>
                      <Navigation2 className="w-6 h-6 text-black" />
                   </div>
                   <div className="flex flex-col">
                      <span className={`text-[10px] ${activeTheme.text} font-black uppercase tracking-widest block mb-0.5`}>NEXT MANEUVER</span>
                      <span className="text-base font-black text-white leading-tight">{routeInstructions[currentInstructionIndex].text}</span>
                   </div>
                </div>
             </div>
          )}

          {/* LEFT ZOOM TOOLBAR */}
          <div className="absolute top-1/2 left-3 -translate-y-1/2 z-[400] flex flex-col gap-2">
              <button onClick={() => setFollowZoom(18)} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${followZoom === 18 ? `${activeTheme.dim} ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg cursor-pointer`} title="Macro Zoom">
                <Focus className="w-4 h-4" />
              </button>
              <button onClick={() => setFollowZoom(16)} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${followZoom === 16 ? `${activeTheme.dim} ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg cursor-pointer`} title="Combat Zoom">
                <Crosshair className="w-4 h-4" />
              </button>
              <button onClick={() => setFollowZoom(14)} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${followZoom === 14 ? `${activeTheme.dim} ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg cursor-pointer`} title="Recon Zoom">
                <Navigation className="w-4 h-4" />
              </button>
          </div>

          {/* RIGHT TACTICAL TOOLBAR */}
          <div className="absolute top-1/2 right-3 -translate-y-1/2 z-[400] flex flex-col gap-2">
              <button onClick={() => setMapStyle('dark')} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${mapStyle === 'dark' ? `${activeTheme.dim} ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg cursor-pointer`} title="Dark Matrix View">
                <MapPin className="w-4 h-4" />
              </button>
              <button onClick={() => setMapStyle('satellite')} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${mapStyle === 'satellite' ? `${activeTheme.dim} ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg cursor-pointer`} title="Satellite Recon">
                <Globe className="w-4 h-4" />
              </button>
              <button onClick={() => setMapStyle('topo')} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${mapStyle === 'topo' ? `${activeTheme.dim} ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg cursor-pointer`} title="Topographic Grid">
                <Mountain className="w-4 h-4" />
              </button>
              {/* WAYMARKED TRAILS & TRANSIT INFRASTRUCTURE LAYER TOGGLES */}
              <button onClick={() => setMapStyle('trails')} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${mapStyle === 'trails' ? `${activeTheme.dim} text-amber-500 border-amber-500/50` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-amber-500'} shadow-lg cursor-pointer`} title="PEV Cycling Trails">
                <MapIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setMapStyle('transit')} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${mapStyle === 'transit' ? `${activeTheme.dim} text-rose-500 border-rose-500/50` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-rose-500'} shadow-lg cursor-pointer`} title="Heavy Infrastructure & Transit">
                <TrainFront className="w-4 h-4" />
              </button>
          </div>

          {/* FEATURE 3: SPEED-ADAPTIVE AUTO-ZOOM TOGGLE & RE-CENTER BUTTON */}
          <div className="absolute bottom-12 right-3 z-[400] flex flex-col gap-2 items-end">
            <button 
              onClick={() => setAutoZoomActive(!autoZoomActive)} 
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg cursor-pointer ${autoZoomActive ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-black/80 border-zinc-700 text-zinc-400'}`}
            >
              🚀 Auto-Zoom: {autoZoomActive ? "ON" : "OFF"}
            </button>

            {!isFollowMode && (
              <button 
                onClick={() => {
                  setIsFollowMode(true);
                  if (mapRef.current) mapRef.current.setView([userLat, userLng], followZoom, { animate: true });
                  mechanicSpeak("Radar locked onto rider position.");
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-2xl flex items-center gap-1.5 cursor-pointer animate-bounce"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-Center Radar
              </button>
            )}
          </div>

          <div ref={mapContainerRef} className="flex-1 min-h-[400px] w-full h-full z-10" />
          
          {/* BOTTOM TELEMETRY OVERLAY */}
          <div className="absolute bottom-3 left-3 z-[400] bg-zinc-950/90 border border-zinc-800/80 px-3 py-2 rounded-lg flex items-center gap-4 text-[9px] font-mono font-bold text-zinc-400 shadow-lg backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${activeTheme.bg}`} /><span>YOU</span></div>
            <div className="flex items-center gap-1.5"><Route className={`w-3 h-3 ${activeTheme.text}`} /><span>PATH</span></div>
            <div className="flex items-center gap-1.5 text-zinc-500 border-l border-zinc-800 pl-4">LAT: {(userLat || 0).toFixed(4)} • LNG: {(userLng || 0).toFixed(4)}</div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTEGRATED STREAMING RADAR & TURN FEED */}
        <div className="bg-[#181a20] rounded-xl border border-zinc-800 p-3 flex flex-col h-[400px] lg:h-full overflow-hidden justify-between space-y-4">
          
          <div className="flex-1 flex flex-col min-h-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Navigation className={`w-3.5 h-3.5 ${activeTheme.text}`} /> ACTIVE RIDER INDEX
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              <div className={`p-2 rounded-lg ${activeTheme.dim} flex items-center justify-between`}>
                <div>
                  <span className={`text-xs font-bold ${activeTheme.text} block`}>You (Rider)</span>
                  <span className="text-[9px] text-zinc-400 block font-sans">{pevType}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-zinc-100 block">{formatSpeed(speed)} {useMetric ? 'KM/H' : 'MPH'}</span>
                  <button onClick={() => { setIsFollowMode(true); if(mapRef.current) mapRef.current.setView([userLat, userLng], followZoom); }} className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${activeTheme.text} hover:underline uppercase tracking-wide mt-0.5 cursor-pointer`}><Eye className="w-2.5 h-2.5" /> Center</button>
                </div>
              </div>

              {searchedPin && (
                <div className={`p-2 rounded-lg ${searchedPin.name.includes("Objective Target") ? "bg-emerald-950/20 border border-emerald-900/30" : "bg-cyan-950/20 border border-cyan-900/30"} flex items-center justify-between`}>
                  <div className="min-w-0 pr-2">
                    <span className={`text-[10px] font-black ${searchedPin.name.includes("Objective Target") ? "text-emerald-400" : "text-cyan-400"} block uppercase`}>{searchedPin.name.includes("Objective Target") ? "🎯 Mission" : "📍 Target"}</span>
                    <span className="text-[9px] text-zinc-400 block font-sans truncate">{searchedPin.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <button onClick={() => { setIsFollowMode(false); if(mapRef.current) mapRef.current.setView([searchedPin.lat, searchedPin.lng], 15); }} className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${searchedPin.name.includes("Objective Target") ? "text-emerald-400" : "text-cyan-400"} hover:underline uppercase tracking-wide mt-0.5 cursor-pointer`}><Eye className="w-2.5 h-2.5" /> View</button>
                  </div>
                </div>
              )}

              {riders.filter(r => r.id !== "user-rider-active").map(rider => (
                <div key={rider.id} className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 flex items-center justify-between transition-colors">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-200 block truncate">{rider.name}</span>
                    <span className="text-[9px] text-zinc-500 block font-sans truncate">{rider.pevType}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-zinc-300 block">{formatSpeed(rider.speed || 0)} {useMetric ? 'KM/H' : 'MPH'}</span>
                    <div className="flex gap-1.5 items-center justify-end mt-0.5">
                      <span className="text-[8px] font-mono text-zinc-400 flex items-center gap-0.5"><Activity className="w-2 h-2 text-amber-400" /> {rider.status || 'N/A'}</span>
                      <button onClick={() => { setIsFollowMode(false); if (mapRef.current) mapRef.current.setView([rider.lat, rider.lng], 15); }} className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${activeTheme.text} hover:underline uppercase tracking-wide cursor-pointer`}><Eye className="w-2.5 h-2.5" /> Ping</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TURN-BY-TURN INSTRUCTIONS CONTAINER */}
          <div className="h-[180px] border-t border-zinc-900 pt-3 flex flex-col min-h-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> ROUTE INSTRUCTIONS
            </span>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {routeInstructions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-2 py-4">
                  <Route className="w-6 h-6 text-zinc-600 mb-1" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 text-center">No Active Navigation Route</span>
                </div>
              ) : (
                routeInstructions.map((step, idx) => {
                  const isCurrent = idx === currentInstructionIndex;
                  const isPassed = idx < currentInstructionIndex;
                  
                  return (
                    <div key={idx} className={`p-3 border rounded-xl flex items-start gap-3 transition-all ${
                      isCurrent ? `${activeTheme.dim} shadow-[0_0_10px_currentColor] ${activeTheme.text}` : 
                      isPassed ? "bg-black/20 border-zinc-900/50 opacity-40" : "bg-black/40 border-zinc-900 hover:border-zinc-800"
                    }`}>
                      <CornerDownRight className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrent ? `${activeTheme.text} animate-bounce` : isPassed ? "text-zinc-600" : activeTheme.text}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-bold leading-snug font-sans break-words ${isCurrent ? "text-white" : isPassed ? "text-zinc-600" : "text-zinc-300"}`}>{step.text}</p>
                        <span className={`text-[9px] font-mono font-black block uppercase mt-1 ${isCurrent ? activeTheme.text : "text-zinc-500"}`}>
                          In {step.distance < 160.9 ? `${Math.round(step.distance * 3.28084)} Feet` : `${(step.distance / 1609.34).toFixed(1)} Miles`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}