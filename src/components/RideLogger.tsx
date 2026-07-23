"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Square, MapPin, Gauge, Timer, Activity, Zap, Mountain, Bike, Globe } from "lucide-react";

// 🔥 UNIVERSAL PEV LIST 🔥
const PEV_TYPES = [
  "Electric Scooter",
  "Electric Bike",
  "Electric Trike",
  "Electric Moped",
  "EUC / Unicycle",
  "Other / Custom"
];

export default function RideLogger() {
  const [isRiding, setIsRiding] = useState(false);
  const [activePEV, setActivePEV] = useState(PEV_TYPES[0]);
  
  // 🔥 UNIVERSAL UNIT TOGGLE 🔥
  const [useMetric, setUseMetric] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("radar_use_metric") === "true";
    return false;
  });

  const [rideStats, setRideStats] = useState({ 
    distance: 0, 
    speed: 0, 
    maxSpeed: 0, 
    duration: 0, 
    altitude: 0 
  });
  
  const lastCoords = useRef<GeolocationPosition | null>(null);
  const watchId = useRef<number | null>(null);
  const timerId = useRef<NodeJS.Timeout | null>(null);

  // Sync unit preference globally if changed here
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("radar_use_metric", useMetric ? "true" : "false");
    }
  }, [useMetric]);

  // Memory Leak Cleanup
  useEffect(() => {
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (timerId.current) clearInterval(timerId.current);
    };
  }, []);

  const startRide = () => {
    setIsRiding(true);
    setRideStats({ distance: 0, speed: 0, maxSpeed: 0, duration: 0, altitude: 0 });
    lastCoords.current = null; 
    
    // Increment the duration timer every second
    timerId.current = setInterval(() => {
      setRideStats(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);

    // Watch high-precision GPS
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        if (lastCoords.current) {
          const dist = calculateDistance(
            lastCoords.current.coords.latitude, lastCoords.current.coords.longitude,
            position.coords.latitude, position.coords.longitude
          );
          
          // Math conversion based on Metric/Imperial toggle
          const speedMultiplier = useMetric ? 3.6 : 2.23694;
          const altMultiplier = useMetric ? 1 : 3.28084;

          const currentSpeed = (position.coords.speed || 0) * speedMultiplier;
          const currentAlt = position.coords.altitude ? position.coords.altitude * altMultiplier : 0;
          
          setRideStats(prev => ({
            ...prev,
            distance: prev.distance + dist,
            speed: currentSpeed,
            maxSpeed: Math.max(prev.maxSpeed, currentSpeed),
            altitude: currentAlt
          }));
        }
        lastCoords.current = position;
      },
      (err) => console.error("GPS Lock Error", err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );
  };

  const stopRide = () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    if (timerId.current) clearInterval(timerId.current);
    setIsRiding(false);
  };

  // Dynamic Haversine formula based on Metric vs Imperial
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = useMetric ? 6371.0 : 3958.8; // Radius of Earth in KM vs Miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const avgSpeed = rideStats.duration > 0 ? (rideStats.distance / (rideStats.duration / 3600)) : 0;

  // UI Labels based on universal toggle
  const speedLabel = useMetric ? "KM/H" : "MPH";
  const distLabel = useMetric ? "KM" : "MI";
  const altLabel = useMetric ? "M" : "FT";

  return (
    <div className="bg-[#0d0e15] p-6 rounded-3xl border border-zinc-800 shadow-2xl space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" /> Ride Telemetry
            </h2>
            
            {/* Metric/Imperial Universal Toggle */}
            <button 
              onClick={() => !isRiding && setUseMetric(!useMetric)}
              disabled={isRiding}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors ${isRiding ? 'opacity-50 cursor-not-allowed' : ''} ${useMetric ? 'bg-cyan-950/30 text-cyan-400 border-cyan-900' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
              title="Toggle Unit System"
            >
              <Globe className="w-3 h-3"/> {useMetric ? 'Metric' : 'Imperial'}
            </button>
          </div>
          
          {/* Universal PEV Selector */}
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-zinc-500" />
            <select 
              value={activePEV} 
              onChange={(e) => setActivePEV(e.target.value)}
              disabled={isRiding}
              className="bg-black border border-zinc-800 text-xs text-cyan-400 rounded-lg px-2 py-1 outline-none focus:border-cyan-500 font-bold cursor-pointer disabled:opacity-50"
            >
              {PEV_TYPES.map(pev => (
                <option key={pev} value={pev}>{pev}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={isRiding ? stopRide : startRide}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
            isRiding 
              ? "bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-900/50" 
              : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          }`}
        >
          {isRiding ? <><Square className="w-4 h-4 fill-current"/> End Logging</> : <><Play className="w-4 h-4 fill-current"/> Start Run</>}
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        
        {/* Current Speed */}
        <div className="bg-black/60 p-4 rounded-xl border border-zinc-800/80 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500/50"></div>
          <p className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1.5 font-bold mb-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-400"/> Current Speed
          </p>
          <p className="text-3xl font-black font-mono text-white tracking-tight">
            {rideStats.speed.toFixed(1)} <span className="text-xs text-zinc-600 font-sans tracking-normal">{speedLabel}</span>
          </p>
        </div>

        {/* Max Speed */}
        <div className="bg-black/60 p-4 rounded-xl border border-zinc-800/80 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/50"></div>
          <p className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1.5 font-bold mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400"/> Top Speed
          </p>
          <p className="text-3xl font-black font-mono text-amber-400 tracking-tight">
            {rideStats.maxSpeed.toFixed(1)} <span className="text-xs text-amber-900 font-sans tracking-normal">{speedLabel}</span>
          </p>
        </div>

        {/* Distance */}
        <div className="bg-black/60 p-4 rounded-xl border border-zinc-800/80 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500/50"></div>
          <p className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1.5 font-bold mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400"/> Distance
          </p>
          <p className="text-3xl font-black font-mono text-white tracking-tight">
            {rideStats.distance.toFixed(2)} <span className="text-xs text-zinc-600 font-sans tracking-normal">{distLabel}</span>
          </p>
        </div>
        
        {/* Average Speed */}
        <div className="bg-black/60 p-4 rounded-xl border border-zinc-800/80 text-center relative overflow-hidden">
          <p className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1.5 font-bold mb-1">
            Avg Pace
          </p>
          <p className="text-xl font-black font-mono text-zinc-300 tracking-tight">
            {avgSpeed.toFixed(1)} <span className="text-[10px] text-zinc-600 font-sans tracking-normal">{speedLabel}</span>
          </p>
        </div>

        {/* Elevation */}
        <div className="bg-black/60 p-4 rounded-xl border border-zinc-800/80 text-center relative overflow-hidden">
          <p className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1.5 font-bold mb-1">
            <Mountain className="w-3.5 h-3.5 text-purple-400"/> Altitude
          </p>
          <p className="text-xl font-black font-mono text-zinc-300 tracking-tight">
            {rideStats.altitude.toFixed(0)} <span className="text-[10px] text-zinc-600 font-sans tracking-normal">{altLabel}</span>
          </p>
        </div>

        {/* Live Timer */}
        <div className="bg-black/60 p-4 rounded-xl border border-zinc-800/80 text-center relative overflow-hidden">
          <p className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1.5 font-bold mb-1">
            <Timer className="w-3.5 h-3.5 text-rose-400"/> Duration
          </p>
          <p className={`text-xl font-black font-mono tracking-tight ${isRiding ? "text-rose-400 animate-pulse" : "text-white"}`}>
            {formatTime(rideStats.duration)}
          </p>
        </div>

      </div>
    </div>
  );
}