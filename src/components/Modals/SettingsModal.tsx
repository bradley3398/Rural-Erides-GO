"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Settings, User, Shield, Cloud, Loader2, CloudUpload, CloudDownload, 
  FileText, LogOut, Trash2, ShieldCheck, Languages, Type as TypeIcon, 
  Activity, Bell, Navigation, EyeOff, HeartPulse, Palette, Layout, 
  PieChart, Layers, Map, Volume2, Radio, VolumeX, Cpu, Eye, MapPin, 
  CloudRain, HardDrive, ShieldAlert, BrainCircuit, Image as ImageIcon, Sun, ShieldOff 
} from "lucide-react";

export default function SettingsModal(props: any) {
  const {
    isSettingsOpen, setIsSettingsOpen, settingsTab, setSettingsTab,
    user, isOfflineMode, cloudSyncStatus, handleCloudBackup, handleCloudRestore, isProcessingAuth,
    handleSignOut, wipeLocalData, pilotRankBadge, setPilotRankBadge, autoCloudSyncOnFinish, setAutoCloudSyncOnFinish,
    locale, changeLanguage, uiScale, updateUiScale, fontFamily, setFontFamily, reducedMotion, setReducedMotion,
    dynamicIsland, setDynamicIsland, swipeNav, setSwipeNav, autoHideHeader, setAutoHideHeader,
    hapticDuration, setHapticDuration, dataFontWeight, setDataFontWeight, tabIconAnimation, setTabIconAnimation,
    cardOpacityLevel, setCardOpacityLevel, minimalBanners, setMinimalBanners, dashLayout, setDashLayout,
    dataVizStyle, setDataVizStyle, dashDataDensity, setDashDataDensity, mapDefaultZoom, setMapDefaultZoom,
    hapticFeedback, toggleHapticFeedback, hapticIntensity, setHapticIntensity, globalVolume, updateGlobalVolume,
    soundPack, setSoundPack, autoMuteOnVideo, setAutoMuteOnVideo, dataRetentionPolicy, setDataRetentionPolicy,
    highPrecisionBgGps, setHighPrecisionBgGps, autoErrorLogging, setAutoErrorLogging, maxFps, setMaxFps,
    distanceUnitOverride, setDistanceUnitOverride, tempUnitOverride, setTempUnitOverride, decimalPrecision, setDecimalPrecision,
    privacyZone, setPrivacyZone, routeSnapping, setRouteSnapping, autoWeatherSync, setAutoWeatherSync,
    weatherUpdateFrequency, setWeatherUpdateFrequency, strictHardwareGps, setStrictHardwareGps, telemetryRate, setTelemetryRate,
    gpsAccuracyLimit, setGpsAccuracyLimit, gpsDriftTol, setGpsDriftTol, autoStartTracking, setAutoStartTracking,
    shareLeaderboard, setShareLeaderboard, cloudSyncInterval, setCloudSyncInterval, offlineSyncTimeout, setOfflineSyncTimeout,
    bgNetThrottle, setBgNetThrottle, backgroundGps, setBackgroundGps, powerSaveThreshold, setPowerSaveThreshold,
    maxCacheLimit, setMaxCacheLimit, offlinePrefetch, setOfflinePrefetch, biometricAppLock, setBiometricAppLock,
    emergencyContactName, setEmergencyContactName, sosContactNumber, setSosContactNumber, sosCancelWindow, setSosCancelWindow,
    crashSensitivity, setCrashSensitivity, batteryProfile, setBatteryProfile, voiceHotwordActive, setVoiceHotwordActive,
    smartBatteryAi, setSmartBatteryAi, autoErrorScrape, setAutoErrorScrape, localEncryption, setLocalEncryption,
    imuPollingRate, setImuPollingRate, offlineTileProvider, setOfflineTileProvider, wakeLockEnabled, toggleWakeLock,
    autoSleep, toggleAutoSleep, hardwareAcceleration, setHardwareAcceleration, diagnosticAutoScan, setDiagnosticAutoScan,
    autoUpdateChecks, setAutoUpdateChecks, debugMode, setDebugMode, brandTheme, changeTheme, nightModeSchedule, setNightModeSchedule,
    cornerStyle, setCornerStyle, panelBorderWidth, setPanelBorderWidth, cardElevation, setCardElevation,
    transitionSpeedProfile, setTransitionSpeedProfile, headerStyleVariant, setHeaderStyleVariant, borderGlowIntensity, setBorderGlowIntensity,
    bgTexture, setBgTexture, glowRadius, setGlowRadius, mapLineColor, setMapLineColor, buttonStyling, setButtonStyling, glassmorphism, setGlassmorphism,
    activeTheme, glassBlurClass, triggerHaptic
  } = props;

  if (!isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-xl`}></motion.div>
        
        <motion.div initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : 20 }} className={`bg-black/60 backdrop-blur-3xl border border-white/10 w-full max-w-2xl ${glassBlurClass} ${cornerStyle} p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative z-10 flex flex-col max-h-[90vh]`}>
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 shrink-0">
            <h2 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2`}><Settings className={`w-5 h-5 ${activeTheme.text}`} /> System Config</h2>
            <button type="button" onClick={() => { triggerHaptic(); setIsSettingsOpen(false); }} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-wrap border-b border-white/10 bg-black/40 shrink-0 mb-4 rounded-xl shadow-inner overflow-hidden">
            <button type="button" onClick={() => { triggerHaptic(); setSettingsTab("profile"); }} className={`flex-1 min-w-[25%] py-3 px-2 text-[9px] font-black uppercase tracking-widest transition-colors text-center cursor-pointer ${settingsTab === "profile" ? `${activeTheme.text} bg-white/10` : "text-zinc-400 hover:text-white"}`}>Account</button>
            <button type="button" onClick={() => { triggerHaptic(); setSettingsTab("preferences"); }} className={`flex-1 min-w-[25%] py-3 px-2 text-[9px] font-black uppercase tracking-widest transition-colors text-center cursor-pointer ${settingsTab === "preferences" ? `${activeTheme.text} bg-white/10` : "text-zinc-400 hover:text-white"}`}>UI Prefs</button>
            <button type="button" onClick={() => { triggerHaptic(); setSettingsTab("app_settings"); }} className={`flex-1 min-w-[25%] py-3 px-2 text-[9px] font-black uppercase tracking-widest transition-colors text-center cursor-pointer ${settingsTab === "app_settings" ? `${activeTheme.text} bg-white/10` : "text-zinc-400 hover:text-white"}`}>App Config</button>
            <button type="button" onClick={() => { triggerHaptic(); setSettingsTab("appearance"); }} className={`flex-1 min-w-[25%] py-3 px-2 text-[9px] font-black uppercase tracking-widest transition-colors text-center cursor-pointer ${settingsTab === "appearance" ? `${activeTheme.text} bg-white/10` : "text-zinc-400 hover:text-white"}`}>Appearance</button>
          </div>

          <div className="overflow-y-auto space-y-6 pr-2 custom-scrollbar relative">
            <AnimatePresence mode="wait">
            
            {settingsTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Network Identity</h3>
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-inner gap-4">
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-12 h-12 shrink-0 rounded-full ${activeTheme.bg} flex items-center justify-center text-black font-black text-lg shadow-lg`}>
                        {user?.email?.charAt(0).toUpperCase() || "P"}
                      </div>
                      <div className="truncate w-full">
                        <div className="text-xs font-bold text-white mb-0.5 truncate">{user?.email || "Unknown Pilot"}</div>
                        <div className={`text-[9px] ${isOfflineMode ? 'text-amber-500' : activeTheme.text} font-mono uppercase tracking-widest flex items-center gap-1`}><Shield className="w-3 h-3" /> {isOfflineMode ? 'Offline Cache Active' : 'Secure Token Active'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5 text-cyan-400"/> Firebase Cloud Sync</h3>
                  {cloudSyncStatus ? (
                    <div className="bg-cyan-950/40 border border-cyan-900/50 text-cyan-300 text-[10px] font-mono p-4 rounded-xl flex items-center justify-center gap-3 w-full shadow-inner">
                      <Loader2 className={`w-4 h-4 ${reducedMotion ? '' : 'animate-spin'}`} /> {cloudSyncStatus}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={handleCloudBackup} disabled={isProcessingAuth} className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 p-4 rounded-xl text-left transition-colors active:scale-95 flex items-center gap-2.5 font-bold text-xs cursor-pointer shadow-inner disabled:opacity-50"><CloudUpload className="w-4 h-4 shrink-0" /> Backup to Cloud</button>
                      <button type="button" onClick={handleCloudRestore} disabled={isProcessingAuth} className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 p-4 rounded-xl text-left transition-colors active:scale-95 flex items-center gap-2.5 font-bold text-xs cursor-pointer shadow-inner disabled:opacity-50"><CloudDownload className="w-4 h-4 shrink-0" /> Restore Backup</button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Access Control</h3>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={handleSignOut} className="w-full bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 text-rose-400 hover:text-rose-300 p-4 rounded-xl active:scale-95 text-left transition-colors flex items-center justify-between group shadow-inner cursor-pointer"><div><div className="text-xs font-bold mb-0.5 flex items-center gap-2">Disconnect Pilot Link <LogOut className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" /></div><div className="text-[9px] text-rose-500/70 font-mono">Sign out of your network account securely.</div></div></button>
                    <button type="button" onClick={wipeLocalData} className="w-full bg-black/40 hover:bg-rose-950/20 border border-white/5 hover:border-rose-900/50 text-zinc-400 hover:text-rose-500 p-4 rounded-xl active:scale-95 text-left transition-colors flex items-center justify-between group shadow-inner cursor-pointer"><div><div className="text-xs font-bold mb-0.5 flex items-center gap-2">Purge Local Cache & Reset <Trash2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /></div><div className="text-[9px] text-zinc-500 font-mono">Deletes saved rides, local settings, and resets all legal TOS agreements.</div></div></button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400"/> Pilot Rank &amp; Cloud Automation</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Verified Pilot Rank</div><div className="text-[9px] text-zinc-400 font-mono">Display classification badge on profile.</div></div>
                      <select value={pilotRankBadge} onChange={(e) => { triggerHaptic(); setPilotRankBadge(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="Rookie Pilot">Rookie Pilot</option>
                        <option value="Trail Scout">Trail Scout</option>
                        <option value="Elite Scout">Elite Scout</option>
                        <option value="Master Commander">Master Commander</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Auto-Cloud Backup on Ride Finish</div><div className="text-[9px] text-zinc-400 font-mono">Automatically backup stats to Firebase post-run.</div></div>
                      <button type="button" onClick={() => { triggerHaptic(); setAutoCloudSyncOnFinish(!autoCloudSyncOnFinish); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoCloudSyncOnFinish ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoCloudSyncOnFinish ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {settingsTab === "preferences" && (
              <motion.div key="preferences" initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 text-zinc-400"><Settings className="w-4 h-4"/> Global Interface Settings</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Languages className="w-4 h-4 text-zinc-300 shrink-0"/> System Language</div><div className="text-[9px] text-zinc-400 font-mono">Active translation dictionary.</div></div>
                      <select value={locale} onChange={(e) => changeLanguage(e.target.value)} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"><option value="en">English (US)</option><option value="es">Español</option><option value="de">Deutsch</option><option value="fr">Français</option><option value="zh">中文 (Chinese)</option></select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><TypeIcon className="w-4 h-4 text-zinc-300 shrink-0"/> Global UI Scale</div><div className="text-[9px] text-zinc-400 font-mono">Adjusts master text rendering size.</div></div>
                      <div className="flex bg-black/50 border border-white/10 rounded-lg p-1 shrink-0">
                        <button type="button" onClick={() => updateUiScale("compact")} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all cursor-pointer ${uiScale === "compact" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>SM</button>
                        <button type="button" onClick={() => updateUiScale("normal")} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all cursor-pointer ${uiScale === "normal" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>MD</button>
                        <button type="button" onClick={() => updateUiScale("large")} className={`px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all cursor-pointer ${uiScale === "large" ? `${activeTheme.bg} text-black` : "text-zinc-500 hover:text-white"}`}>LG</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><TypeIcon className="w-4 h-4 text-zinc-300 shrink-0"/> Font Family</div><div className="text-[9px] text-zinc-400 font-mono">Select system typography style.</div></div>
                      <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="font-sans">Modern Sans</option>
                         <option value="font-mono">Cyberpunk Mono</option>
                         <option value="font-serif">Classic Serif</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Activity className="w-4 h-4 text-zinc-300 shrink-0"/> Reduced Motion</div><div className="text-[9px] text-zinc-400 font-mono">Strips animations for accessibility & performance.</div></div>
                      <button type="button" onClick={() => { triggerHaptic(); setReducedMotion(!reducedMotion); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${reducedMotion ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${reducedMotion ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ENHANCED UI CONTROLS */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 text-zinc-400"><Layers className="w-4 h-4"/> Enhanced Interface Controls</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Bell className="w-4 h-4 text-zinc-300 shrink-0"/> Dynamic Island Alerts</div><div className="text-[9px] text-zinc-400 font-mono">Use pill-shaped top popups for system alerts.</div></div>
                      <button type="button" onClick={() => { triggerHaptic(); setDynamicIsland(!dynamicIsland); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${dynamicIsland ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${dynamicIsland ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Navigation className="w-4 h-4 text-zinc-300 shrink-0"/> Swipe Navigation</div><div className="text-[9px] text-zinc-400 font-mono">Enable left/right swiping between main tabs.</div></div>
                      <button type="button" onClick={() => { triggerHaptic(); setSwipeNav(!swipeNav); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${swipeNav ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${swipeNav ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><EyeOff className="w-4 h-4 text-zinc-300 shrink-0"/> Auto-Hide Top Header</div><div className="text-[9px] text-zinc-400 font-mono">Hide header when scrolling down feed.</div></div>
                      <button type="button" onClick={() => { triggerHaptic(); setAutoHideHeader(!autoHideHeader); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoHideHeader ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoHideHeader ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><HeartPulse className="w-4 h-4 text-zinc-300 shrink-0"/> Haptic Pulse Duration</div><div className="text-[9px] text-zinc-400 font-mono">Length of physical vibration.</div></div>
                      <select value={hapticDuration} onChange={(e) => { triggerHaptic(); setHapticDuration(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="short">Short</option>
                         <option value="medium">Medium</option>
                         <option value="long">Long</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><TypeIcon className="w-4 h-4 text-zinc-300 shrink-0"/> Data Font Weight</div><div className="text-[9px] text-zinc-400 font-mono">Thickness of numbers in telemetry.</div></div>
                      <select value={dataFontWeight} onChange={(e) => { triggerHaptic(); setDataFontWeight(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="normal">Standard</option>
                         <option value="bold">Bold</option>
                         <option value="black">Ultra Black</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* EXPANDED UI PREFERENCES */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 text-zinc-400"><Palette className="w-4 h-4"/> Advanced UI Customization</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Tab Bar Icon Animation</div><div className="text-[9px] text-zinc-400 font-mono">Animate icons when switching navigation tabs.</div></div>
                      <button type="button" onClick={() => { triggerHaptic(); setTabIconAnimation(!tabIconAnimation); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${tabIconAnimation ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${tabIconAnimation ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Dashboard Card Opacity</div><div className="text-[9px] text-zinc-400 font-mono">Transparency level for modular background cards.</div></div>
                      <select value={cardOpacityLevel} onChange={(e) => { triggerHaptic(); setCardOpacityLevel(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="60">60% (Transparent)</option>
                        <option value="80">80% (Balanced)</option>
                        <option value="100">100% (Solid Opaque)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Minimal Notification Banners</div><div className="text-[9px] text-zinc-400 font-mono">Condense toast alerts into minimal notifications.</div></div>
                      <button type="button" onClick={() => { triggerHaptic(); setMinimalBanners(!minimalBanners); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${minimalBanners ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${minimalBanners ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 text-zinc-400"><Layout className="w-4 h-4"/> Layout & Dash Densities</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Layout className="w-4 h-4 text-zinc-300 shrink-0"/> Dashboard Layout Style</div><div className="text-[9px] text-zinc-400 font-mono">Arrangement of main components.</div></div>
                      <select value={dashLayout} onChange={(e) => { triggerHaptic(); setDashLayout(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="modular">Modular Cards</option><option value="compact">Compact Grid</option><option value="expanded">Expanded List</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><PieChart className="w-4 h-4 text-zinc-300 shrink-0"/> Data Visualization Style</div><div className="text-[9px] text-zinc-400 font-mono">How telemetry metrics are rendered.</div></div>
                      <select value={dataVizStyle} onChange={(e) => { triggerHaptic(); setDataVizStyle(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="gauges">Arc Gauges</option><option value="raw">Raw Numbers</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Layers className="w-4 h-4 text-zinc-300 shrink-0"/> Dash Data Density</div><div className="text-[9px] text-zinc-400 font-mono">Padding and spacing in telemetry widgets.</div></div>
                      <select value={dashDataDensity} onChange={(e) => { triggerHaptic(); setDashDataDensity(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="spacious">Spacious (Default)</option><option value="compact">Compact (More Data)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Map className="w-4 h-4 text-zinc-300 shrink-0"/> Map Default Zoom Level</div><div className="text-[9px] text-zinc-400 font-mono">Camera elevation upon boot.</div></div>
                      <select value={mapDefaultZoom} onChange={(e) => { triggerHaptic(); setMapDefaultZoom(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="12">Level 12 (Macro)</option><option value="14">Level 14 (Standard)</option><option value="16">Level 16 (Tactical)</option><option value="18">Level 18 (Street)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 text-zinc-400"><HeartPulse className="w-4 h-4"/> Haptics & Audio</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><HeartPulse className="w-4 h-4 text-zinc-300 shrink-0"/> Haptic Feedback Master</div><div className="text-[9px] text-zinc-400 font-mono">Enable physical vibration on interactive components.</div></div>
                      <button type="button" onClick={toggleHapticFeedback} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hapticFeedback ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hapticFeedback ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><HeartPulse className="w-4 h-4 text-zinc-300 shrink-0"/> Haptic Intensity</div><div className="text-[9px] text-zinc-400 font-mono">Vibration force multiplier.</div></div>
                      <select value={hapticIntensity} onChange={(e) => { triggerHaptic(); setHapticIntensity(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="light">Light</option>
                         <option value="medium">Medium</option>
                         <option value="heavy">Heavy</option>
                         <option value="extreme">Extreme</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Volume2 className="w-4 h-4 text-zinc-300 shrink-0"/> Global AI Audio Gain</div><div className="text-[9px] text-zinc-400 font-mono">Set {globalVolume}% volume cap.</div></div>
                      <div className="w-32 shrink-0"><input type="range" min="0" max="100" step="10" value={globalVolume} onChange={(e) => updateGlobalVolume(Number(e.target.value))} className={`w-full ${activeTheme.text} accent-current cursor-pointer`} /></div>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Radio className="w-4 h-4 text-zinc-300 shrink-0"/> Notification Sound Pack</div><div className="text-[9px] text-zinc-400 font-mono">System alert audio style.</div></div>
                      <select value={soundPack} onChange={(e) => { triggerHaptic(); setSoundPack(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="tactical">Tactical Beeps</option>
                         <option value="soft">Soft Chimes</option>
                         <option value="scifi">Sci-Fi Synths</option>
                         <option value="silent">Silent / Muted</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><VolumeX className="w-4 h-4 text-zinc-300 shrink-0"/> Auto-Mute on Video</div><div className="text-[9px] text-zinc-400 font-mono">Mute walkie-talkie when watching YouTube.</div></div>
                      <button type="button" onClick={() => { triggerHaptic(); setAutoMuteOnVideo(!autoMuteOnVideo); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoMuteOnVideo ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoMuteOnVideo ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* APP CONFIG (ALL SETTINGS RENDERED AS A SINGLE SCROLLING LIST - NO FRAGILE TABS) */}
            {settingsTab === "app_settings" && (
              <motion.div key="app_settings" initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                
                {/* APP CONFIG TELEMETRY & STORAGE */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2 flex items-center gap-1.5"><Cpu className="w-4 h-4"/> System Telemetry &amp; Storage Config</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Telemetry Data Retention Policy</div><div className="text-[9px] text-zinc-400 font-mono">How long historical rides are saved in local cache.</div></div>
                      <select value={dataRetentionPolicy} onChange={(e) => { triggerHaptic(); setDataRetentionPolicy(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="30days">30 Days</option>
                        <option value="1year">1 Year</option>
                        <option value="forever">Forever</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">High-Precision Background GPS</div><div className="text-[9px] text-zinc-400 font-mono">Request maximum satellite accuracy when app is minimized.</div></div>
                      <button onClick={() => { triggerHaptic(); setHighPrecisionBgGps(!highPrecisionBgGps); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${highPrecisionBgGps ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${highPrecisionBgGps ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Automatic Error Log Diagnostics</div><div className="text-[9px] text-zinc-400 font-mono">Bundle and log runtime exceptions for review.</div></div>
                      <button onClick={() => { triggerHaptic(); setAutoErrorLogging(!autoErrorLogging); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoErrorLogging ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoErrorLogging ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* DISPLAY & HUD */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2 flex items-center gap-1.5"><Eye className="w-4 h-4"/> Display & HUD Physics</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Max Rendering FPS Limit</div><div className="text-[9px] text-zinc-400 font-mono">Visual frame rate cap to limit GPU.</div></div>
                      <select value={maxFps} onChange={(e) => { triggerHaptic(); setMaxFps(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="30">30 FPS</option><option value="60">60 FPS</option><option value="120">120 FPS</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Distance Unit Override</div><div className="text-[9px] text-zinc-400 font-mono">Force standard output.</div></div>
                      <select value={distanceUnitOverride} onChange={(e) => { triggerHaptic(); setDistanceUnitOverride(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="auto">Sync Locale</option><option value="mi">Miles (Mi)</option><option value="km">Kilometers (Km)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Temperature Override</div><div className="text-[9px] text-zinc-400 font-mono">Force thermal units.</div></div>
                      <select value={tempUnitOverride} onChange={(e) => { triggerHaptic(); setTempUnitOverride(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="auto">Sync Locale</option><option value="f">Fahrenheit</option><option value="c">Celsius</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Decimal Precision Output</div><div className="text-[9px] text-zinc-400 font-mono">Rounding limits for speed/distance.</div></div>
                      <select value={decimalPrecision} onChange={(e) => { triggerHaptic(); setDecimalPrecision(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="0">Whole (0)</option><option value="1">Tenths (0.1)</option><option value="2">Hundredths (0.01)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* LOCATION PRIVACY & ROUTING */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4"/> Location Privacy & Routing</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Privacy Zone Radius</div><div className="text-[9px] text-zinc-400 font-mono">Hide start/end points of your rides.</div></div>
                      <select value={privacyZone} onChange={(e) => { triggerHaptic(); setPrivacyZone(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="0">Disabled</option><option value="0.25">0.25 Mi</option><option value="0.5">0.5 Mi</option><option value="1">1.0 Mi</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Map Route Snapping</div><div className="text-[9px] text-zinc-400 font-mono">Align raw GPS tracks to known roads/trails.</div></div>
                      <button onClick={() => { triggerHaptic(); setRouteSnapping(!routeSnapping); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${routeSnapping ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${routeSnapping ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ENVIRONMENTAL & WEATHER */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-2 flex items-center gap-1.5"><CloudRain className="w-4 h-4"/> Environmental & Weather</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Auto-Sync Weather Telemetry</div><div className="text-[9px] text-zinc-400 font-mono">Fetch live atmospheric data via GPS.</div></div>
                      <button onClick={() => { triggerHaptic(); setAutoWeatherSync(!autoWeatherSync); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoWeatherSync ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoWeatherSync ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Weather Update Frequency</div><div className="text-[9px] text-zinc-400 font-mono">Conserve battery by throttling pulls.</div></div>
                      <select value={weatherUpdateFrequency} onChange={(e) => { triggerHaptic(); setWeatherUpdateFrequency(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="15m">15 Mins</option><option value="30m">30 Mins</option><option value="1h">1 Hour</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* TELEMETRY & TRACKING */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4"/> Telemetry & Tracking Data</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Strict Hardware GPS Lock</div><div className="text-[9px] text-zinc-400 font-mono">Reject IP/Tower fallback signals (Prevents Eufaula bug).</div></div>
                      <button onClick={() => { triggerHaptic(); setStrictHardwareGps(!strictHardwareGps); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${strictHardwareGps ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${strictHardwareGps ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Telemetry UI Polling Rate</div><div className="text-[9px] text-zinc-400 font-mono">CPU tick speed for UI updates.</div></div>
                      <select value={telemetryRate} onChange={(e) => { triggerHaptic(); setTelemetryRate(Number(e.target.value)); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="500">Fast (0.5s)</option><option value="1000">Normal (1.0s)</option><option value="2000">Slow (2.0s)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Minimum GPS Accuracy Filter</div><div className="text-[9px] text-zinc-400 font-mono">Reject bad satellite pings over limit.</div></div>
                      <select value={gpsAccuracyLimit} onChange={(e) => { triggerHaptic(); setGpsAccuracyLimit(Number(e.target.value)); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="10">10 Meters</option><option value="20">20 Meters</option><option value="50">50 Meters</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">GPS Drift Tolerance</div><div className="text-[9px] text-zinc-400 font-mono">Movement distance validation filter.</div></div>
                      <select value={gpsDriftTol} onChange={(e) => { triggerHaptic(); setGpsDriftTol(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="2">Strict (2m)</option><option value="5">Balanced (5m)</option><option value="15">Loose (15m)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Auto-Start Telemetry Tracking</div><div className="text-[9px] text-zinc-400 font-mono">Launch telemetry instantly on boot.</div></div>
                      <button onClick={() => { triggerHaptic(); setAutoStartTracking(!autoStartTracking); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoStartTracking ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoStartTracking ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Share Anonymous Stats to Global Leaderboard</div><div className="text-[9px] text-zinc-400 font-mono">Opt-in to global rider stats.</div></div>
                      <button onClick={() => { triggerHaptic(); setShareLeaderboard(!shareLeaderboard); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${shareLeaderboard ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${shareLeaderboard ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* NETWORK & CLOUD */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2 flex items-center gap-1.5"><Cloud className="w-4 h-4"/> Network & Cloud Routing</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Cloud Sync Interval</div><div className="text-[9px] text-zinc-400 font-mono">Background backup timing.</div></div>
                      <select value={cloudSyncInterval} onChange={(e) => { triggerHaptic(); setCloudSyncInterval(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="instant">Instant</option><option value="hourly">Hourly</option><option value="manual">Manual Only</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Offline Sync Timeout Limit</div><div className="text-[9px] text-zinc-400 font-mono">Wait time before defaulting to local cache.</div></div>
                      <select value={offlineSyncTimeout} onChange={(e) => { triggerHaptic(); setOfflineSyncTimeout(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="10s">10 Secs</option><option value="30s">30 Secs</option><option value="60s">60 Secs</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Background Network Throttling</div><div className="text-[9px] text-zinc-400 font-mono">Limit bandwidth usage when minimized.</div></div>
                      <button onClick={() => { triggerHaptic(); setBgNetThrottle(!bgNetThrottle); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${bgNetThrottle ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${bgNetThrottle ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Background Location Services</div><div className="text-[9px] text-zinc-400 font-mono">Run tracking when app is minimized.</div></div>
                      <button onClick={() => { triggerHaptic(); setBackgroundGps(!backgroundGps); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${backgroundGps ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${backgroundGps ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* RESOURCE & STORAGE CACHE */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-2 flex items-center gap-1.5"><HardDrive className="w-4 h-4"/> Resource Management & Storage</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Aggressive Power Save</div><div className="text-[9px] text-zinc-400 font-mono">Halt non-essential tracking when battery &lt; 20%.</div></div>
                      <button onClick={() => { triggerHaptic(); setPowerSaveThreshold(!powerSaveThreshold); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${powerSaveThreshold ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${powerSaveThreshold ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Max Storage Cache Limit</div><div className="text-[9px] text-zinc-400 font-mono">Cap local database size.</div></div>
                      <select value={maxCacheLimit} onChange={(e) => { triggerHaptic(); setMaxCacheLimit(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="50">50 MB</option><option value="100">100 MB</option><option value="500">500 MB</option><option value="unlimited">Unlimited</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Offline Map Pre-fetching</div><div className="text-[9px] text-zinc-400 font-mono">Download local tiles over Wi-Fi automatically.</div></div>
                      <button onClick={() => { triggerHaptic(); setOfflinePrefetch(!offlinePrefetch); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${offlinePrefetch ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${offlinePrefetch ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SAFETY & VOICE */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-2 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4"/> Safety, SOS & Battery Modeling</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Native Biometric App Lock</div><div className="text-[9px] text-zinc-400 font-mono">Require FaceID/Fingerprint to open app.</div></div>
                      <button onClick={() => { triggerHaptic(); setBiometricAppLock(!biometricAppLock); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${biometricAppLock ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${biometricAppLock ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">SOS Dispatch Config</div><div className="text-[9px] text-zinc-400 font-mono">Contact Name & Number.</div></div>
                      <div className="flex flex-col gap-1.5">
                        <input type="text" value={emergencyContactName} onChange={(e) => { setEmergencyContactName(e.target.value); }} placeholder="e.g. Wife / 911" className={`w-full max-w-[120px] bg-black border border-zinc-800 rounded-lg py-2 px-3 text-[10px] font-bold text-white outline-none focus:${activeTheme.border}`} />
                        <input type="tel" value={sosContactNumber} onChange={(e) => { setSosContactNumber(e.target.value); }} placeholder="e.g. 555-0199" className={`w-full max-w-[120px] bg-black border border-zinc-800 rounded-lg py-2 px-3 text-[10px] font-bold text-white outline-none focus:${activeTheme.border} font-mono`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">SOS Cancel Window</div><div className="text-[9px] text-zinc-400 font-mono">Time before auto-dispatch.</div></div>
                      <select value={sosCancelWindow} onChange={(e) => { triggerHaptic(); setSosCancelWindow(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="5">5s</option><option value="10">10s</option><option value="15">15s</option><option value="30">30s</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Crash Detection Sensitivity</div><div className="text-[9px] text-zinc-400 font-mono">G-Force limits for SOS Trigger.</div></div>
                      <select value={crashSensitivity} onChange={(e) => { triggerHaptic(); setCrashSensitivity(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="high">High (Minor Spills)</option><option value="normal">Normal</option><option value="low">Low (Severe Impact)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Battery Chemistry Profile</div><div className="text-[9px] text-zinc-400 font-mono">Adjusts voltage sag curve predictions.</div></div>
                      <select value={batteryProfile} onChange={(e) => { triggerHaptic(); setBatteryProfile(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="Li-Ion">Li-Ion (Standard)</option><option value="LiFePO4">LiFePO4 (Flat Curve)</option><option value="Solid State">Solid State (High Drain)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><HeartPulse className="w-4 h-4 text-zinc-300 shrink-0"/> Hands-Free Voice Hotword</div><div className="text-[9px] text-zinc-400 font-mono">Background listening for Co-Pilot.</div></div>
                      <button onClick={() => { triggerHaptic(); setVoiceHotwordActive(!voiceHotwordActive); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${voiceHotwordActive ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${voiceHotwordActive ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* NEW: ADVANCED SYSTEM LOGIC */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-2 flex items-center gap-1.5"><BrainCircuit className="w-4 h-4"/> Advanced System Logic</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Smart Battery AI</div><div className="text-[9px] text-zinc-400 font-mono">AI dynamically manages GPS polling to save battery.</div></div>
                      <button onClick={() => { triggerHaptic(); setSmartBatteryAi(!smartBatteryAi); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${smartBatteryAi ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${smartBatteryAi ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Automated Error Code Scraping</div><div className="text-[9px] text-zinc-400 font-mono">Auto-queries web manuals if fault is detected.</div></div>
                      <button onClick={() => { triggerHaptic(); setAutoErrorScrape(!autoErrorScrape); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoErrorScrape ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoErrorScrape ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Local Cache Encryption</div><div className="text-[9px] text-zinc-400 font-mono">Encrypt offline logs and telemetry data.</div></div>
                      <button onClick={() => { triggerHaptic(); setLocalEncryption(!localEncryption); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${localEncryption ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localEncryption ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">IMU Gyro Polling Rate</div><div className="text-[9px] text-zinc-400 font-mono">Frequency of internal accelerometer checks.</div></div>
                      <select value={imuPollingRate} onChange={(e) => { triggerHaptic(); setImuPollingRate(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="20hz">20 Hz (Eco)</option><option value="50hz">50 Hz (Standard)</option><option value="100hz">100 Hz (Aggressive)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Offline Map Tile Provider</div><div className="text-[9px] text-zinc-400 font-mono">Source imagery for map cache.</div></div>
                      <select value={offlineTileProvider} onChange={(e) => { triggerHaptic(); setOfflineTileProvider(e.target.value); }} className="bg-black border border-zinc-800 text-white text-[9px] font-black uppercase min-h-[36px] px-2 rounded cursor-pointer max-w-[120px]">
                        <option value="carto_dark">CartoDB Dark</option><option value="osm">OpenStreet</option><option value="satellite">Satellite High-Res</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ADVANCED & DEVELOPER */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2 flex items-center gap-1.5"><Cpu className="w-4 h-4"/> Advanced / Developer Diagnostics</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-amber-400">Hardware Screen Wake-Lock</div><div className="text-[9px] text-zinc-400 font-mono">Native device screen timeout override.</div></div>
                      <button onClick={toggleWakeLock} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${wakeLockEnabled ? "bg-amber-500" : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${wakeLockEnabled ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Auto-Sleep GPS Throttle</div><div className="text-[9px] text-zinc-400 font-mono">Throttle polling to save battery when idle.</div></div>
                      <button onClick={toggleAutoSleep} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoSleep ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoSleep ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Hardware Render Acceleration</div><div className="text-[9px] text-zinc-400 font-mono">Use WebGL/GPU for heavy components.</div></div>
                      <button onClick={() => { triggerHaptic(); setHardwareAcceleration(!hardwareAcceleration); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hardwareAcceleration ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hardwareAcceleration ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Diagnostic Auto-Scan</div><div className="text-[9px] text-zinc-400 font-mono">Scan hardware components on app boot.</div></div>
                      <button onClick={() => { triggerHaptic(); setDiagnosticAutoScan(!diagnosticAutoScan); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${diagnosticAutoScan ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${diagnosticAutoScan ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Auto-Update Repository Checks</div><div className="text-[9px] text-zinc-400 font-mono">Ping GitHub API for latest releases.</div></div>
                      <button onClick={() => { triggerHaptic(); setAutoUpdateChecks(!autoUpdateChecks); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoUpdateChecks ? activeTheme.bg : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoUpdateChecks ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-amber-400">Developer Debug Mode</div><div className="text-[9px] text-zinc-400 font-mono">Expose unhandled exceptions &amp; raw logs.</div></div>
                      <button onClick={() => { triggerHaptic(); setDebugMode(!debugMode); }} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${debugMode ? "bg-amber-500" : "bg-white/20"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${debugMode ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>
                
              </motion.div>
            )}

            {settingsTab === "appearance" && (
              <motion.div key="appearance" initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Palette className="w-4 h-4"/> Primary Base Themes</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {[
                      { id: "lime", label: "Neon Lime", color: "bg-[#39ff14]" },
                      { id: "cyan", label: "Cyber Cyan", color: "bg-cyan-500" },
                      { id: "emerald", label: "Emerald City", color: "bg-emerald-500" },
                      { id: "amber", label: "Warning Amber", color: "bg-amber-500" },
                      { id: "rose", label: "Danger Rose", color: "bg-rose-500" },
                      { id: "purple", label: "Synth Purple", color: "bg-purple-500" },
                      { id: "void", label: "Void Black", color: "bg-zinc-800 border border-zinc-500" }
                    ].map(theme => (
                      <button key={theme.id} type="button" onClick={() => changeTheme(theme.id as ThemePreset)} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${reducedMotion ? '' : 'active:scale-95'} ${brandTheme === theme.id ? 'bg-white/10 border-white/20 shadow-md' : 'bg-black/40 border-white/5'}`}>
                        <div className={`w-6 h-6 rounded-full ${theme.color}`}></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Sun className="w-4 h-4"/> Auto Night-Mode Schedule</h3>
                  <div className="grid grid-cols-3 gap-2">
                     <button type="button" onClick={() => { triggerHaptic(); setNightModeSchedule("system"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${nightModeSchedule === "system" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>System Default</button>
                     <button type="button" onClick={() => { triggerHaptic(); setNightModeSchedule("always_dark"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${nightModeSchedule === "always_dark" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Always Dark</button>
                     <button type="button" onClick={() => { triggerHaptic(); setNightModeSchedule("time_based"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${nightModeSchedule === "time_based" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Time Based</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Layout className="w-4 h-4"/> Component Border Styling</h3>
                  <div className="grid grid-cols-3 gap-2">
                     <button type="button" onClick={() => { triggerHaptic(); setCornerStyle("rounded-none"); }} className={`p-3 border text-[9px] font-black uppercase rounded-none transition-all cursor-pointer ${cornerStyle === "rounded-none" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Sharp Box</button>
                     <button type="button" onClick={() => { triggerHaptic(); setCornerStyle("rounded-xl"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${cornerStyle === "rounded-xl" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Soft Curve</button>
                     <button type="button" onClick={() => { triggerHaptic(); setCornerStyle("rounded-3xl"); }} className={`p-3 border text-[9px] font-black uppercase rounded-3xl transition-all cursor-pointer ${cornerStyle === "rounded-3xl" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Pill Edge</button>
                  </div>
                </div>

                {/* 🔥 MASSIVE APPEARANCE UPGRADE SECTION 🔥 */}
                <div className="space-y-3">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Layers className="w-4 h-4"/> Advanced Structural Appearance</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Panel Border Width</div><div className="text-[9px] text-zinc-400 font-mono">Stroke thickness for cards & modals.</div></div>
                      <select value={panelBorderWidth} onChange={(e) => { triggerHaptic(); setPanelBorderWidth(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="thin">Thin (1px)</option>
                        <option value="normal">Normal (2px)</option>
                        <option value="thick">Thick (3px)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Card Elevation Style</div><div className="text-[9px] text-zinc-400 font-mono">Shadow depth and elevation lighting.</div></div>
                      <select value={cardElevation} onChange={(e) => { triggerHaptic(); setCardElevation(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="flat">Flat Minimal</option>
                        <option value="raised">Raised Shadow</option>
                        <option value="floating">Floating 3D</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Transition Speed Profile</div><div className="text-[9px] text-zinc-400 font-mono">Animation timing curve preset.</div></div>
                      <select value={transitionSpeedProfile} onChange={(e) => { triggerHaptic(); setTransitionSpeedProfile(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="instant">Instant Snappy</option>
                        <option value="smooth">Smooth Fluid</option>
                        <option value="cinematic">Cinematic Slow</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Header Style Variant</div><div className="text-[9px] text-zinc-400 font-mono">Top navigation bar visual layout.</div></div>
                      <select value={headerStyleVariant} onChange={(e) => { triggerHaptic(); setHeaderStyleVariant(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="solid">Solid Opaque</option>
                        <option value="translucent">Translucent Glass</option>
                        <option value="floating">Floating Island</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white">Border Glow Intensity</div><div className="text-[9px] text-zinc-400 font-mono">Ambient aura strength around active elements.</div></div>
                      <select value={borderGlowIntensity} onChange={(e) => { triggerHaptic(); setBorderGlowIntensity(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                        <option value="none">Disabled</option>
                        <option value="subtle">Subtle Aura</option>
                        <option value="intense">Intense Glow</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><ImageIcon className="w-4 h-4"/> Background Texture Overlays</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {/* Default Textures */}
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("none"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "none" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Solid Pure</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("grid"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "grid" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Cyber Grid</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("topo"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "topo" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Topographic</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("hex"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "hex" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>Hexagons</button>
                     
                     {/* 8 Rural & Road Textures */}
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("asphalt"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "asphalt" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>🛣️ Country Asphalt</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("gravel"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "gravel" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>🪨 Gravel Trail</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("contour"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "contour" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>🗺️ Topo Contour</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("county_grid"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "county_grid" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>🚗 County Road Net</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("forest"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "forest" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>🌲 Pine Canopy</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("farmland"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "farmland" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>🌾 Farmland Crop Rows</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("mountain"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "mountain" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>⛰️ Mountain Ridge</button>
                     <button type="button" onClick={() => { triggerHaptic(); setBgTexture("trail_dust"); }} className={`p-3 border text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer ${bgTexture === "trail_dust" ? `${activeTheme.bg} text-black border-transparent shadow-md` : "bg-black/40 text-zinc-400 border-white/10"}`}>💨 Trail Dust</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><ShieldOff className="w-4 h-4"/> Advanced Visual Effects</h3>
                  <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/10 shadow-inner">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Sun className="w-4 h-4 text-zinc-300 shrink-0"/> Accent Glow Radius</div><div className="text-[9px] text-zinc-400 font-mono">Intensity of drop-shadows globally.</div></div>
                      <select value={glowRadius} onChange={(e) => { triggerHaptic(); setGlowRadius(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="none">None</option>
                         <option value="small">Small</option>
                         <option value="medium">Medium</option>
                         <option value="massive">Massive</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Map className="w-4 h-4 text-zinc-300 shrink-0"/> Custom Map Line Color</div><div className="text-[9px] text-zinc-400 font-mono">Routing line path visualizer.</div></div>
                      <select value={mapLineColor} onChange={(e) => { triggerHaptic(); setMapLineColor(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="theme">Sync w/ Theme</option>
                         <option value="pink">Neon Pink</option>
                         <option value="green">Acid Green</option>
                         <option value="blue">Electric Blue</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Layout className="w-4 h-4 text-zinc-300 shrink-0"/> UI Button Styling</div><div className="text-[9px] text-zinc-400 font-mono">Depth logic for interactables.</div></div>
                      <select value={buttonStyling} onChange={(e) => { triggerHaptic(); setButtonStyling(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="flat">Modern Flat</option>
                         <option value="neumorphic">Neumorphic</option>
                         <option value="outlined">Hollow / Outlined</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><Layers className="w-4 h-4 text-zinc-300 shrink-0"/> Glassmorphism Intensity</div><div className="text-[9px] text-zinc-400 font-mono">Control backdrop blur levels.</div></div>
                      <select value={glassmorphism} onChange={(e) => { triggerHaptic(); setGlassmorphism(e.target.value); }} className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer">
                         <option value="high">High Blur</option>
                         <option value="medium">Medium Blur</option>
                         <option value="low">Low Blur</option>
                         <option value="none">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}