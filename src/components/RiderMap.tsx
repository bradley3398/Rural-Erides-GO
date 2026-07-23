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
  Milestone, Clock, Volume2, VolumeX, Navigation2, Globe, Mountain
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
}

interface RouteSummary { 
  distance: string; 
  time: string; 
  eta?: string; 
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
}: RiderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  const userMarkerRef = useRef<L.Marker | null>(null);
  const otherMarkersRef = useRef<{ [id: string]: L.Marker }>({});
  const searchedMarkerRef = useRef<L.Marker | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const routingControlRef = useRef<any>(null);
  
  const [riders, setRiders] = useState<ActiveRider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string>("Never");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchedPin, setSearchedPin] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [objectiveDistance, setObjectiveDistance] = useState<number>(5);

  const [topSpeed, setTopSpeed] = useState<number>(0);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [closestRiderDist, setClosestRiderDist] = useState<number | null>(null);
  const [isFollowMode, setIsFollowMode] = useState<boolean>(true);

  // --- ADVANCED TACTICAL STATE ---
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'topo'>(satelliteMap ? 'satellite' : 'dark');
  const [followZoom, setFollowZoom] = useState<number>(16);

  // --- ADVANCED TURN-BY-TURN NAVIGATION STATE ---
  const [routeInstructions, setRouteInstructions] = useState<any[]>([]);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState<number>(0);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [voiceNavEnabled, setVoiceNavEnabled] = useState<boolean>(true);

  // Theme Sync Dictionary Mapping
  const themeMap = {
    lime: { hex: "#39ff14", text: "text-[#39ff14]", bg: "bg-[#39ff14]", border: "border-[#39ff14]", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(57,255,20,0.3)]" },
    cyan: { hex: "#06b6d4", text: "text-cyan-400", bg: "bg-cyan-500", border: "border-cyan-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(6,182,212,0.3)]" },
    emerald: { hex: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
    amber: { hex: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(245,158,11,0.3)]" },
    rose: { hex: "#f43f5e", text: "text-rose-400", bg: "bg-rose-500", border: "border-rose-500", shadow: performanceMode ? '' : "shadow-[0_0_15px_rgba(244,63,94,0.3)]" }
  };
  const activeTheme = themeMap[theme as keyof typeof themeMap] || themeMap.lime;

  // Pro Voice Engine Announcer synchronized with global volume
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
        // If ghost mode is active, filter out user telemetry from broadcast pool
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
    if (ghostMode) return; // Skip sending live position if ghost mode is active
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
    const R = useMetric ? 6371 : 3958.8; // Radius of Earth in kilometers or miles based on settings
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

  // Advanced Geocoder Input Parser
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    const coordRegex = /^[-+]?([1-8]?\d(\.\d+)?|95?(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
    if (coordRegex.test(searchQuery.trim())) {
      const parts = searchQuery.split(",");
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      setSearchedPin({ lat, lng, name: `Grid Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      if (mapRef.current) mapRef.current.setView([lat, lng], 15, { animate: true });
      setIsFollowMode(false);
      setIsSearching(false);
      mechanicSpeak("Grid coordinate lock established. Mapping destination vector.");
      return;
    }

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
        mechanicSpeak("I couldn't find that trailhead location on the grid.");
      }
    } catch (err) {
      console.error("Geocoding error", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationMark = () => {
    const baseLat = userLat !== 0 ? userLat : 35.2637;
    const baseLng = userLng !== 0 ? userLng : -95.1294;
    const targetDistMiles = useMetric ? objectiveDistance / 1.60934 : objectiveDistance;
    const randomHeading = Math.random() * 360;
    const radians = (randomHeading * Math.PI) / 180;
    const targetLat = baseLat + (targetDistMiles / 69) * Math.cos(radians);
    const targetLng = baseLng + (targetDistMiles / 55) * Math.sin(radians);

    setSearchedPin({ lat: targetLat, lng: targetLng, name: `Objective Target (${objectiveDistance} ${useMetric ? 'KM' : 'Mile'} Recon)` });
    if (mapRef.current) {
      mapRef.current.setView([targetLat, targetLng], 14, { animate: true });
      setIsFollowMode(false);
    }
    mechanicSpeak(`Tactical objective set at ${objectiveDistance} ${useMetric ? 'kilometers' : 'miles'} out. Plotting path.`);
  };

  // --- LIVE GPS TURN-BY-TURN ENGINE ---
  useEffect(() => {
    if (routeInstructions.length > 0 && routeCoords.length > 0 && currentInstructionIndex < routeInstructions.length && isTracking) {
      const nextInstruction = routeInstructions[currentInstructionIndex];
      const targetCoord = routeCoords[nextInstruction.index];

      if (targetCoord && userLat !== 0 && userLng !== 0) {
        const distToTurn = calculateDistance(userLat, userLng, targetCoord.lat, targetCoord.lng);
        const threshold = useMetric ? 0.05 : 0.03; // ~150-250 feet threshold

        if (distToTurn < threshold) {
          mechanicSpeak(nextInstruction.text);
          setCurrentInstructionIndex(prev => prev + 1);
        }
      }
    }
  }, [userLat, userLng, routeInstructions, routeCoords, currentInstructionIndex, isTracking, useMetric]);

  useEffect(() => {
    if (speed > topSpeed) setTopSpeed(speed);

    if (searchedPin && userLat !== 0 && userLng !== 0) {
      setDistanceToTarget(calculateDistance(userLat, userLng, searchedPin.lat, searchedPin.lng));
    } else {
      setDistanceToTarget(null);
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

  // Map Initial Mounting Canvas
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLat !== 0 ? userLat : 35.2637, userLng !== 0 ? userLng : -95.1294],
      zoom: followZoom,
      zoomControl: false,
      attributionControl: false,
    });

    let initialUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    if (satelliteMap) initialUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

    tileLayerRef.current = L.tileLayer(initialUrl, { maxZoom: 20 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: true });
      }
    }, 250);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSearchedPin({ lat, lng, name: `Dropped Waypoint (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setIsFollowMode(false);
      mechanicSpeak("Custom waypoint pinned. Engaging mapping controller.");
    });

    pathRef.current = L.polyline([], { 
      color: activeTheme.hex, 
      weight: 4, 
      opacity: 0.8, 
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

  // --- DYNAMIC TACTICAL LAYER TOGGLING (SYNCED WITH OMNIBUS SETTINGS) ---
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);
    
    let url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    if (mapStyle === 'satellite' || satelliteMap) url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (mapStyle === 'topo') url = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";

    tileLayerRef.current = L.tileLayer(url, { maxZoom: 20 }).addTo(mapRef.current);
  }, [mapStyle, satelliteMap]);

  // Process Live Routing Matrices and Extracted Instruction Sets
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    if (userLat !== 0 && userLng !== 0 && searchedPin) {
      routingControlRef.current = (L as any).Routing.control({
        waypoints: [
          L.latLng(userLat, userLng),
          L.latLng(searchedPin.lat, searchedPin.lng)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        show: false, 
        lineOptions: {
          styles: [{ color: '#0ea5e9', weight: 6, opacity: 0.9 }]
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

          mechanicSpeak(`Route synchronized. Destination is ${distFormatted} out. Follow the vector line.`);
        }
      });
    } else {
      setRouteInstructions([]);
      setRouteCoords([]);
      setCurrentInstructionIndex(0);
      setRouteSummary(null);
    }
  }, [userLat, userLng, searchedPin, useMetric, timeFormat]);

  useEffect(() => {
    if (!isTracking || ghostMode) return;
    const updateInterval = setInterval(() => sendPositionUpdate(userLat, userLng), 4000);
    return () => clearInterval(updateInterval);
  }, [isTracking, userLat, userLng, speed, pevType, userStatus, ghostMode]);

  useEffect(() => {
    if (!mapRef.current || userLat === 0 || userLng === 0) return;
    const map = mapRef.current;

    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: `
        <div class="relative flex items-center justify-center">
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
      userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
    }
    userMarkerRef.current.bindPopup(`<strong class="text-zinc-900">You (Rider)</strong><br><span class="text-zinc-600 text-xs">${pevType} • ${formatSpeed(speed)} ${useMetric ? 'KM/H' : 'MPH'}</span>`);

    if (isTracking && pathRef.current) {
      pathRef.current.addLatLng([userLat, userLng]);
    }

    if (isTracking && isFollowMode) {
      map.setView([userLat, userLng], followZoom, { animate: true, duration: 1 });
    }
  }, [userLat, userLng, pevType, speed, isTracking, isFollowMode, followZoom, activeTheme, useMetric]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (searchedPin) {
      const isObjective = searchedPin.name.includes("Objective Target");
      const searchIcon = L.divIcon({
        className: "search-pin-marker",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 rounded-full ${isObjective ? "bg-emerald-500/40" : "bg-cyan-500/40"} animate-ping"></span>
            <span class="relative inline-flex rounded-xl h-6 w-6 ${isObjective ? "bg-emerald-500" : "bg-cyan-500"} border-2 border-zinc-950 flex items-center justify-center text-xs shadow-xl">${isObjective ? "🎯" : "📍"}</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const popupHtml = `
        <div class="text-zinc-900 p-1">
          <h4 class="font-black text-[10px] ${isObjective ? "text-emerald-600" : "text-cyan-600"} uppercase">${isObjective ? "🎯 MISSION TARGET" : "📍 SEARCHED LOCATION"}</h4>
          <p class="text-xs font-bold mt-0.5 max-w-[200px]">${searchedPin.name}</p>
        </div>
      `;

      if (searchedMarkerRef.current) {
        searchedMarkerRef.current.setLatLng([searchedPin.lat, searchedPin.lng]);
        searchedMarkerRef.current.setPopupContent(popupHtml);
      } else {
        searchedMarkerRef.current = L.marker([searchedPin.lat, searchedPin.lng], { icon: searchIcon }).addTo(map).bindPopup(popupHtml);
      }
    } else if (searchedMarkerRef.current) {
      searchedMarkerRef.current.remove();
      searchedMarkerRef.current = null;
    }
  }, [searchedPin]);

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
    <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 relative">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-zinc-200 font-bold text-sm tracking-wide flex items-center gap-2.5">
            <Users className={`w-5 h-5 ${activeTheme.text}`} /> RURAL RIDER RADAR {ghostMode && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase">Ghost Mode Active</span>}
          </h3>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Tactical telemetry, breadcrumb pathing, and targeting grid.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => {
                setVoiceNavEnabled(!voiceNavEnabled); 
                mechanicSpeak(voiceNavEnabled ? "Voice navigation muted." : "Voice navigation active.");
            }} 
            className={`p-2 rounded-lg border transition-colors ${voiceNavEnabled ? `bg-lime-500/20 border-lime-500/50 ${activeTheme.text}` : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}
            title="Toggle Voice Navigation"
          >
            {voiceNavEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <span className="text-[9px] font-mono text-zinc-500 hidden sm:inline">Last Sync: {lastSync}</span>
          <button onClick={fetchRiders} disabled={loading} className="p-2 rounded-lg bg-[#181a20] hover:bg-[#20232c] border border-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? `animate-spin ${activeTheme.text}` : ""}`} />
          </button>
        </div>
      </div>

      {/* ADVANCED COORDINATE SEARCH INPUT */}
      <form onSubmit={handleSearchAddress} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search coordinates (e.g. 35.23, -95.12) or destination..." className="w-full bg-[#181a20] border border-zinc-800 text-xs text-white pl-9 pr-4 py-3 rounded-xl outline-none focus:border-lime-500 transition-colors shadow-inner" />
        </div>
        <button type="submit" disabled={isSearching || !searchQuery.trim()} className={`${activeTheme.bg} hover:opacity-90 disabled:opacity-50 text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center shadow-md`}>
          {isSearching ? "Searching..." : "Search"}
        </button>
        {searchedPin && (
          <button type="button" onClick={() => { setSearchedPin(null); setSearchQuery(""); setDistanceToTarget(null); setIsFollowMode(true); mechanicSpeak("Target cleared."); }} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-xs font-black uppercase transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* HARDWARE RECON HUD CONTROLS */}
      <div className="bg-[#181a20] border border-zinc-800/60 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 whitespace-nowrap">Mark Range: <strong className="text-emerald-400">{objectiveDistance} {useMetric ? 'KM' : 'MI'}</strong></span>
          <input type="range" min="1" max="35" value={objectiveDistance} onChange={(e) => setObjectiveDistance(Number(e.target.value))} className="w-full sm:w-48 accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer outline-none" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => setIsFollowMode(!isFollowMode)} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${isFollowMode ? `bg-lime-500/20 ${activeTheme.text} border border-lime-500/50` : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
            <Focus className="w-3.5 h-3.5" /> {isFollowMode ? "Lock On" : "Free Pan"}
          </button>
          <button type="button" onClick={handleLocationMark} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Set Target
          </button>
        </div>
      </div>

      {/* TWO-COLUMN HUD LAYOUT FOR MAP & TURNS */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:h-[520px]">
        
        {/* LEFT COLUMN: INTERACTIVE LEAFLET VIEWPORT */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-zinc-800/80 relative bg-zinc-950 flex flex-col min-h-[400px] lg:h-full w-full">
          
          {/* TOP GRAPHICAL OVERLAY */}
          <div className="absolute top-0 left-0 right-0 z-[400] bg-gradient-to-b from-zinc-950/90 to-transparent pt-3 pb-8 px-4 pointer-events-none flex justify-between items-start">
            <div className="flex flex-col">
              <span className={`text-[10px] ${activeTheme.text} font-black tracking-widest uppercase flex items-center gap-1.5 mb-1`}><Gauge className="w-3.5 h-3.5" /> GROUND SPEED</span>
              <div className="flex items-baseline gap-1.5 drop-shadow-lg">
                <span className="text-4xl font-black text-white font-mono tracking-tighter">{formatSpeed(speed)}</span>
                <span className="text-sm font-bold text-zinc-400">{useMetric ? 'KM/H' : 'MPH'}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 mt-1">V-MAX: <span className="text-zinc-300">{formatSpeed(topSpeed)} {useMetric ? 'KM/H' : 'MPH'}</span></span>
            </div>

            <div className="flex flex-col items-end text-right">
              {distanceToTarget !== null ? (
                <>
                  <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase flex items-center gap-1.5 mb-1"><Crosshair className="w-3.5 h-3.5" /> DIST TO TARGET</span>
                  <div className="flex items-baseline gap-1.5 drop-shadow-lg">
                    <span className="text-3xl font-black text-white font-mono tracking-tighter">{formatDistance(distanceToTarget).split(' ')[0]}</span>
                    <span className="text-sm font-bold text-zinc-400">{useMetric ? 'KM' : 'MI'}</span>
                  </div>
                </>
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
          
          {/* 🔥 LIVE NEXT-TURN HUD BANNER OVERLAY 🔥 */}
          {routeInstructions.length > 0 && currentInstructionIndex < routeInstructions.length && (
             <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] w-11/12 max-w-sm bg-black/85 backdrop-blur-md border border-cyan-500/50 p-4 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.2)] pointer-events-none">
                <div className="flex items-center gap-4">
                   <div className="bg-cyan-500 p-2.5 rounded-xl shadow-inner shrink-0">
                      <Navigation2 className="w-6 h-6 text-black" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest block mb-0.5">NEXT MANEUVER</span>
                      <span className="text-base font-black text-white leading-tight">{routeInstructions[currentInstructionIndex].text}</span>
                   </div>
                </div>
             </div>
          )}

          {/* LEFT ZOOM TOOLBAR */}
          <div className="absolute top-1/2 left-3 -translate-y-1/2 z-[400] flex flex-col gap-2">
              <button onClick={() => setFollowZoom(18)} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${followZoom === 18 ? `bg-lime-500/25 border-lime-500 ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg`} title="Macro Zoom">
                <Focus className="w-4 h-4" />
              </button>
              <button onClick={() => setFollowZoom(16)} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${followZoom === 16 ? `bg-lime-500/25 border-lime-500 ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg`} title="Combat Zoom">
                <Crosshair className="w-4 h-4" />
              </button>
              <button onClick={() => setFollowZoom(14)} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${followZoom === 14 ? `bg-lime-500/25 border-lime-500 ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg`} title="Recon Zoom">
                <Navigation className="w-4 h-4" />
              </button>
          </div>

          {/* RIGHT TACTICAL TOOLBAR */}
          <div className="absolute top-1/2 right-3 -translate-y-1/2 z-[400] flex flex-col gap-2">
              <button onClick={() => setMapStyle('dark')} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${mapStyle === 'dark' ? `bg-lime-500/25 border-lime-500 ${activeTheme.text}` : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg`} title="Dark Matrix View">
                <MapPin className="w-4 h-4" />
              </button>
              <button onClick={() => setMapStyle('satellite')} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${mapStyle === 'satellite' ? 'bg-cyan-500/25 border-cyan-500 text-cyan-400' : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg`} title="Satellite Recon">
                <Globe className="w-4 h-4" />
              </button>
              <button onClick={() => setMapStyle('topo')} className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${mapStyle === 'topo' ? 'bg-amber-500/25 border-amber-500 text-amber-400' : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-white'} shadow-lg`} title="Topographic Grid">
                <Mountain className="w-4 h-4" />
              </button>
          </div>

          <div ref={mapContainerRef} className="flex-1 w-full h-full z-10" />
          
          {/* BOTTOM TELEMETRY OVERLAY */}
          <div className="absolute bottom-3 left-3 z-[400] bg-zinc-950/90 border border-zinc-800/80 px-3 py-2 rounded-lg flex items-center gap-4 text-[9px] font-mono font-bold text-zinc-400 shadow-lg backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${activeTheme.bg}`} /><span>YOU</span></div>
            <div className="flex items-center gap-1.5"><Route className={`w-3 h-3 ${activeTheme.text}`} /><span>PATH</span></div>
            <div className="flex items-center gap-1.5 text-zinc-500 border-l border-zinc-800 pl-4">LAT: {userLat.toFixed(4)} • LNG: {userLng.toFixed(4)}</div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTEGRATED STREAMING RADAR & TURN FEED */}
        <div className="bg-[#181a20] rounded-xl border border-zinc-800 p-3 flex flex-col h-[400px] lg:h-full overflow-hidden justify-between space-y-4">
          
          {/* TOP HALF: RADAR POSITION INDEX LIST */}
          <div className="flex-1 flex flex-col min-h-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Navigation className={`w-3.5 h-3.5 ${activeTheme.text}`} /> ACTIVE RIDER INDEX
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              <div className="p-2 rounded-lg bg-lime-950/20 border border-lime-900/30 flex items-center justify-between">
                <div>
                  <span className={`text-xs font-bold ${activeTheme.text} block`}>You (Rider)</span>
                  <span className="text-[9px] text-zinc-400 block font-sans">{pevType}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-zinc-100 block">{formatSpeed(speed)} {useMetric ? 'KM/H' : 'MPH'}</span>
                  <button onClick={() => { setIsFollowMode(true); if(mapRef.current) mapRef.current.setView([userLat, userLng], followZoom); }} className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${activeTheme.text} hover:underline uppercase tracking-wide mt-0.5`}><Eye className="w-2.5 h-2.5" /> Center</button>
                </div>
              </div>

              {searchedPin && (
                <div className={`p-2 rounded-lg ${searchedPin.name.includes("Objective Target") ? "bg-emerald-950/20 border border-emerald-900/30" : "bg-cyan-950/20 border border-cyan-900/30"} flex items-center justify-between`}>
                  <div className="min-w-0 pr-2">
                    <span className={`text-[10px] font-black ${searchedPin.name.includes("Objective Target") ? "text-emerald-400" : "text-cyan-400"} block uppercase`}>{searchedPin.name.includes("Objective Target") ? "🎯 Mission" : "📍 Target"}</span>
                    <span className="text-[9px] text-zinc-400 block font-sans truncate">{searchedPin.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <button onClick={() => { setIsFollowMode(false); if(mapRef.current) mapRef.current.setView([searchedPin.lat, searchedPin.lng], 15); }} className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${searchedPin.name.includes("Objective Target") ? "text-emerald-400" : "text-cyan-400"} hover:underline uppercase tracking-wide mt-0.5`}><Eye className="w-2.5 h-2.5" /> View</button>
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
                      <button onClick={() => { setIsFollowMode(false); if (mapRef.current) mapRef.current.setView([rider.lat, rider.lng], 15); }} className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${activeTheme.text} hover:underline uppercase tracking-wide`}><Eye className="w-2.5 h-2.5" /> Ping</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM HALF: INTEGRATED TURN-BY-TURN STEP DECK CONTAINER */}
          <div className="h-[220px] border-t border-zinc-900 pt-3 flex flex-col min-h-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> ROUTE INSTRUCTIONS
            </span>
            
            {routeSummary && (
              <div className="grid grid-cols-2 gap-2 bg-black border border-zinc-900 p-2 rounded-xl text-center mb-2 shrink-0 shadow-inner">
                <div className="flex items-center gap-2 px-2 border-r border-zinc-900">
                  <Milestone className={`w-3.5 h-3.5 ${activeTheme.text}`} />
                  <div className="text-left">
                    <div className="text-[7px] text-zinc-500 font-black uppercase">DISTANCE</div>
                    <div className="text-[11px] font-mono font-black text-white">{routeSummary.distance}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <div className="text-left">
                    <div className="text-[7px] text-zinc-500 font-black uppercase">EST TIME (ETA: {routeSummary.eta})</div>
                    <div className="text-[11px] font-mono font-black text-white">{routeSummary.time}</div>
                  </div>
                </div>
              </div>
            )}

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
                      isCurrent ? "bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]" : 
                      isPassed ? "bg-black/20 border-zinc-900/50 opacity-40" : "bg-black/40 border-zinc-900 hover:border-zinc-800"
                    }`}>
                      <CornerDownRight className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrent ? "text-cyan-400 animate-bounce" : isPassed ? "text-zinc-600" : activeTheme.text}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-bold leading-snug font-sans break-words ${isCurrent ? "text-white" : isPassed ? "text-zinc-600" : "text-zinc-300"}`}>{step.text}</p>
                        <span className={`text-[9px] font-mono font-black block uppercase mt-1 ${isCurrent ? "text-cyan-500" : "text-zinc-500"}`}>
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