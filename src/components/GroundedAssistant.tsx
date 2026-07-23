"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Send, Mic, MicOff, Volume2, Square, AlertTriangle, 
  Wind, CloudRain, ThermometerSun, Snowflake, Gauge, Disc, 
  Activity, Wrench, AlertOctagon, Users, Moon, Stethoscope, Scale, Map as MapIcon, ChevronDown, 
  ChevronUp, ImagePlus, Trash2, X, Zap, Camera, Cpu, Settings2, Download, FileText, Plus, Palette, BrainCircuit, LocateFixed, MapPinOff, MapPin, Loader2, Type, LayoutDashboard, MessageSquare, Radio
} from "lucide-react";
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { fetchWithRetry, getGeminiApiKey, getBraveApiKey, getImgbbApiKey } from '../services/CoPilotService';
import { locationService } from '../services/LocationService';

// --- DATA STRUCTURES ---
interface Message {
  role: 'user' | 'ai';
  text: string;
  image?: string | null; 
  timestamp?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

type ThemeColor = 'lime' | 'cyan' | 'emerald' | 'amber' | 'rose';
type AIPersona = 'copilot' | 'mechanic' | 'legal';
type Verbosity = 'brief' | 'detailed';
type FontSize = 'sm' | 'md' | 'lg';

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
  geminiApiKey?: string;
}

export default function GroundedAssistant({
  theme = "lime",
  useMetric = false,
  ghostMode = false,
  satelliteMap = false,
  locale = "en",
  timeFormat = "12h",
  performanceMode = false,
  uiScale = "normal",
  globalVolume = 100,
  geminiApiKey = ""
}: GroundedAssistantProps) {
  
  // --- CORE SYSTEM STATES ---
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [input, setInput] = useState("");
  
  // Optical Engine States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<{mimeType: string, data: string} | null>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  
  const [isSearching, setIsSearching] = useState(false);
  const [currentlyReadingIndex, setCurrentlyReadingIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);
  
  // --- UI TOGGLE STATES ---
  const [showTactical, setShowTactical] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // --- ADVANCED FEATURES & LOCAL SETTINGS ---
  const [deepReasoningMode, setDeepReasoningMode] = useState(false);
  const [legalComplianceMode, setLegalComplianceMode] = useState(true);
  
  const [isStiglerLocked, setIsStiglerLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("copilot_stigler_lock") !== "false";
    return true; 
  });

  const [baseZone, setBaseZone] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("copilot_base_zone") || "";
    return "";
  });

  const [verbosity, setVerbosity] = useState<Verbosity>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem("copilot_verbosity") as Verbosity) || 'detailed';
    return 'detailed';
  });

  const [autoTTS, setAutoTTS] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("copilot_auto_tts") === "true";
    return false;
  });

  const [customDirective, setCustomDirective] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("copilot_custom_directive") || "";
    return "";
  });

  const [showTelemetryHUD, setShowTelemetryHUD] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("copilot_show_hud") !== "false";
    return true;
  });
  
  const [persona, setPersona] = useState<AIPersona>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem("copilot_persona") as AIPersona) || 'copilot';
    return 'copilot';
  });
  
  // --- TELEMETRY & ATMOSPHERICS ---
  const [liveStats, setLiveStats] = useState<any>({});
  const [weatherStats, setWeatherStats] = useState<string>("Awaiting telemetry sync...");
  const [currentCity, setCurrentCity] = useState<string>("Resolving Zone...");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- THEME COLOR MAPPING (Synced with Omnibus Engine) ---
  const themeMap = {
    lime: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/20 text-[#39ff14] border-[#39ff14]/50', hover: 'hover:text-[#39ff14]', hex: '#39ff14' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', dim: 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50', hover: 'hover:text-cyan-400', hex: '#06b6d4' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', dim: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50', hover: 'hover:text-emerald-400', hex: '#10b981' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', dim: 'bg-amber-950/30 text-amber-400 border-amber-900/50', hover: 'hover:text-amber-400', hex: '#f59e0b' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', shadow: performanceMode ? '' : 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', dim: 'bg-rose-950/30 text-rose-400 border-rose-900/50', hover: 'hover:text-rose-400', hex: '#f43f5e' }
  };
  const t = themeMap[theme as keyof typeof themeMap] || themeMap.lime;

  const fontScaleMap = {
    compact: "text-[13px]",
    normal: "text-[15px]",
    large: "text-[18px]"
  };
  const fontSizeClass = fontScaleMap[uiScale as keyof typeof fontScaleMap] || "text-[15px]";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    localStorage.setItem("copilot_persona", persona);
    localStorage.setItem("copilot_stigler_lock", isStiglerLocked ? "true" : "false");
    localStorage.setItem("copilot_base_zone", baseZone);
    localStorage.setItem("copilot_verbosity", verbosity);
    localStorage.setItem("copilot_auto_tts", autoTTS ? "true" : "false");
    localStorage.setItem("copilot_custom_directive", customDirective);
    localStorage.setItem("copilot_show_hud", showTelemetryHUD ? "true" : "false");
  }, [persona, isStiglerLocked, baseZone, verbosity, autoTTS, customDirective, showTelemetryHUD]);

  useEffect(() => {
    if (!mounted) return;
    const savedSessions = localStorage.getItem("rural_copilot_sessions");

    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) setActiveSessionId(parsed[0].id);
    } else {
      const initialId = Date.now().toString();
      const defaultSession: ChatSession = { id: initialId, title: "LOG TERMINAL 1", messages: [] };
      setSessions([defaultSession]);
      setActiveSessionId(initialId);
    }
  }, [mounted]);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("rural_copilot_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (!mounted) return;
    const currentUpdate = locationService.getCurrentUpdate();
    if (currentUpdate) setLiveStats(currentUpdate);

    const handleLocationUpdate = (update: any) => {
        if (update) setLiveStats(update);
    };
    locationService.addListener(handleLocationUpdate);
    return () => locationService.removeListener(handleLocationUpdate);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (isStiglerLocked) {
      setCurrentCity("Stigler, OK");
      return;
    }
    
    if (liveStats?.lat && liveStats?.lng) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${liveStats.lat}&lon=${liveStats.lng}`)
        .then(res => res.json())
        .then(data => {
           const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Unknown Zone";
           setCurrentCity(city);
        })
        .catch(() => setCurrentCity("Resolving..."));
    } else if (baseZone) {
      setCurrentCity(`${baseZone} (Fallback)`);
    }
  }, [liveStats?.lat, liveStats?.lng, isStiglerLocked, baseZone, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const fetchLiveWeather = async () => {
      let targetLat = liveStats?.lat;
      let targetLng = liveStats?.lng;

      if (isStiglerLocked) {
        targetLat = 35.2757;
        targetLng = -95.1244;
      }

      if (!targetLat || !targetLng) {
        setWeatherStats("Satellite coordination link pending...");
        return;
      }
      try {
        const tUnit = useMetric ? "celsius" : "fahrenheit";
        const wUnit = useMetric ? "kmh" : "mph";
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=${tUnit}&wind_speed_unit=${wUnit}`
        );
        const data = await response.json();
        if (data?.current) {
          setWeatherStats(`Temp: ${Math.round(data.current.temperature_2m)}°${useMetric ? 'C' : 'F'}, Hum: ${data.current.relative_humidity_2m}%, Wind: ${Math.round(data.current.wind_speed_10m)} ${useMetric ? 'KMH' : 'MPH'}`);
        }
      } catch (err) {
        setWeatherStats("Atmospheric core data link offline");
      }
    };

    fetchLiveWeather();
    const interval = setInterval(fetchLiveWeather, 600000); 
    return () => clearInterval(interval);
  }, [mounted, liveStats?.lat, liveStats?.lng, useMetric, isStiglerLocked]);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const activeMessages = currentSession ? currentSession.messages : [];

  const handleNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title: `LOG TERMINAL ${sessions.length + 1}`, messages: [] };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const deleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) return alert("Cannot truncate the absolute fallback logging terminal. Clear the log instead.");
    if (window.confirm("Purge this conversation record node permanently?")) {
      const remaining = sessions.filter(s => s.id !== idToDelete);
      setSessions(remaining);
      if (activeSessionId === idToDelete) setActiveSessionId(remaining[0].id);
    }
  };

  const clearMemory = () => {
    if (window.confirm("Reset active logs? Clear operations wipe terminal records.")) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [] } : s));
      if (currentlyReadingIndex !== null) TextToSpeech.stop();
      setCurrentlyReadingIndex(null);
      setShowSettings(false);
    }
  };

  const exportChatHistory = async () => {
    if (activeMessages.length === 0) return;
    const textContent = activeMessages.map(m => `[${m.timestamp || "Log"}] ${m.role.toUpperCase()}:\n${m.text}\n`).join("\n------------------------\n\n");
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rural Pilot - Copilot Log ${activeSessionId}`,
          text: textContent,
        });
      } catch (err) {
        console.warn("User canceled share or mobile block.");
      }
    } else {
      try {
        await navigator.clipboard.writeText(textContent);
        alert("Log successfully copied to clipboard!");
      } catch (e) {
        alert("Unable to copy log. Your device may be restricting clipboard access.");
      }
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
        await TextToSpeech.speak({ 
          text: cleanText, 
          lang: 'en-US', 
          rate: 1.0, 
          pitch: 1.0, 
          volume: globalVolume / 100, 
          category: 'ambient' 
        });
        setCurrentlyReadingIndex(null);
      }
    } catch (e) {
      setHardwareError("Voice core driver rejected parsing instructions.");
      setCurrentlyReadingIndex(null);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return setHardwareError("Mic engine initialization fault on this target build version.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setHardwareError(null); };
    recognition.onresult = (event: any) => handleSearch(event.results[0][0].transcript);
    recognition.onerror = () => { setIsListening(false); setHardwareError("Audio recognition channel sync dropped."); };
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

      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgApiKey}`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          setSelectedImage(data.data.url); 
        }
      } catch (err) {
        setHardwareError("Cloud upload failed. Running strictly on local memory cache.");
      } finally {
        setIsUploadingImg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setBase64Image(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, isSearching]);

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
    clearSelectedImage();
    setIsSearching(true);
    setHardwareError(null);
    setShowTactical(false); 

    if (currentlyReadingIndex !== null) {
      await TextToSpeech.stop();
      setCurrentlyReadingIndex(null);
    }

    // Resolve Keys
    const geminiKey = getGeminiApiKey();
    const braveKey = getBraveApiKey();

    if (!geminiKey) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        messages: [...s.messages, { 
          role: 'ai', 
          text: "API Key offline. Please configure your Gemini API Key in the Universal Settings menu to enable AI processing.", 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === "12h" }) 
        }]
      } : s));
      setIsSearching(false);
      return;
    }

    let webContext = "";

    try {
      if (searchQuery.trim() && !deepReasoningMode && braveKey) { 
         try {
           const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery + " micro mobility road classification regulations PEV e-bike")}&count=3`;
           const braveRes = await fetch(braveUrl, {
             headers: { "Accept": "application/json", "X-Subscription-Token": braveKey }
           });
           
           if (braveRes.ok) {
             const braveData = await braveRes.json();
             if (braveData.web?.results?.length > 0) {
               const topResults = braveData.web.results.map((r: any) => `- ${r.title}: ${r.description}`).join("\n");
               webContext = `\nREGULATORY COMPLIANCE SYSTEM LOOKUP METRICS:\n${topResults}`;
             }
           }
         } catch (searchError) {
             console.warn("Brave search failed, falling back to local reasoning.");
         }
      }

      let personaDirective = "You are the RURAL PILOT. You are an advanced, completely universal micro-mobility and PEV technical analysis agent. You assist with any hardware tuning or diagnostics across scooters, unicycles, bikes, and multi-motor platforms without bias.";
      if (persona === 'mechanic') personaDirective = "You are a Master PEV Mechanic. Focus exclusively on hardware, maintenance, tools, battery cells, structural integrity, and mechanical fixes.";
      if (persona === 'legal') personaDirective = "You are a PEV Legal Analyst. Focus strictly on speed limits, helmet laws, Class 1-3 regulations, and road ordinances for micro-mobility.";

      const verbosityDirective = verbosity === 'brief' 
        ? "OUTPUT PROTOCOL: Keep your responses highly concise, tactical, and strictly under 4 sentences. Do not ramble." 
        : "OUTPUT PROTOCOL: Provide detailed, highly analytical, and comprehensive step-by-step guidance.";

      const customDirectiveContext = customDirective.trim() 
        ? `\n\nCRITICAL HARDWARE DIRECTIVE (MUST OBEY): The pilot has explicitly stated the following about their hardware or preferences: "${customDirective}". Tailor all physical calculations, limits, and advice specifically to this setup.\n` 
        : "";

      const activeLatStr = isStiglerLocked ? "35.27570" : (liveStats?.lat ? liveStats.lat.toFixed(5) : "Pending GPS Lock");
      const activeLngStr = isStiglerLocked ? "-95.12440" : (liveStats?.lng ? liveStats.lng.toFixed(5) : "Pending GPS Lock");
      const zoneName = isStiglerLocked ? "Stigler, Oklahoma" : (currentCity !== "Resolving Zone..." && currentCity !== "Resolving..." ? currentCity : (baseZone || "Unknown Zone"));
      
      const speedVal = useMetric ? (liveStats?.speed * 1.60934).toFixed(1) : liveStats?.speed?.toFixed(1) || 0;
      const speedUnit = useMetric ? 'KM/H' : 'MPH';

      const dynamicSystemContext = `
        ${personaDirective}
        AUDIO ENGINE FORMAT COMPLIANCE: Your responses parse directly to native speech. Avoid markdown formats, checkboxes, lists, asterisks, or headers completely. Present answers as smooth flowing paragraphs.
        ${verbosityDirective}
        ${customDirectiveContext}

        ${deepReasoningMode ? "DEEP INTELLIGENCE PARMETERS DEPLOYED: Focus strictly on low-level board diagnostics, phase wire tracking, controller architecture schemas, and thermal boundary thresholds." : ""}
        ${legalComplianceMode ? "LEGAL OVERDRIVE OVERLAY LOADED: Cross-reference transport laws, path ordinances, multi-class wattage safety regulations, and public land speed boundaries." : ""}

        ACTIVE TELEMETRY STREAM FEED:
        - Geographic Pin Matrix: Latitude ${activeLatStr}, Longitude ${activeLngStr}
        - Verified Operating Zone: ${zoneName}
        - Verified Velocity Profile: ${speedVal} ${speedUnit}
        - Structural Elevation Deck: ${liveStats?.altitude?.toFixed(0) || 0} FT
        - Local Atmospheric Reading: ${weatherStats}
        ${webContext}
      `;

      const historicalFeed = activeMessages.slice(-10).map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const newPromptParts: any[] = [{ text: `${dynamicSystemContext}\n\nUser Query: ${searchQuery}` }];
      
      if (imageToProcess) {
        newPromptParts.push({ inlineData: { mimeType: imageToProcess.mimeType, data: imageToProcess.data } });
      }

      historicalFeed.push({ role: 'user', parts: newPromptParts });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`;
      const payload = {
        contents: historicalFeed,
        generationConfig: deepReasoningMode ? { temperature: 0.15, topK: 5 } : { temperature: 0.65 }
      };

      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, { maxRetries: 3, timeoutMs: 25000, useCache: true }); 

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API rejected payload mapping.");
      
      const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Telemetry system timed out awaiting hardware context packet.";
      const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === "12h" });
      
      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        messages: [...s.messages, { role: 'ai', text: aiResponseText, timestamp: aiTimestamp }]
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
        messages: [...s.messages, { role: 'ai', text: `Signal fade detected: ${error.message}. Diagnostic engine offline until connection re-aligns.` }]
      } : s));
    } finally {
      setIsSearching(false);
    }
  };

  const tacticalFeatures = [
    { id: 'legal_class', icon: Scale, label: 'Legal Classes', prompt: 'Give me a brief breakdown of 3-class system rules for legal e-bike use on roadways and bike paths.' },
    { id: 'ordinance', icon: FileText, label: 'Path Legality', prompt: 'What are the general rules regarding stand-up electric scooter use on public sidewalks versus municipal roadways?' },
    { id: 'wind', icon: Wind, label: 'Wind Physics', prompt: 'Factor in my current speed profile. Give me 2 quick tips on handling strong crosswinds for safety.' },
    { id: 'wet', icon: CloudRain, label: 'Wet Asphalt', prompt: 'Explain safe cornering limits and weight distribution on wet city streets or slick gravel trails.' },
    { id: 'heat', icon: ThermometerSun, label: 'Thermal Duty', prompt: 'What are the safe hardware operational temperature limits for high drain lithium ion battery packs before cells degrade?' },
    { id: 'cold', icon: Snowflake, label: 'Voltage Sag', prompt: 'Explain the internal chemistry causes behind cell voltage sag when operating under cold ambient temperature conditions.' },
    { id: 'range', icon: MapIcon, label: 'Range Check', prompt: 'Based on current speed and topography altitude shifts, explain the math formula to estimate true runtime remaining.' },
    { id: 'psi', icon: Gauge, label: 'Pressure Matrix', prompt: 'How do I adjust tire casing air pressure settings when switching from loose sand paths to hard packed asphalt street running?' },
    { id: 'brakes', icon: Disc, label: 'Pad Wear', prompt: 'What are the main mechanical indicators that rotor and brake pads have hit dangerous thermal wear limits?' },
    { id: 'motor', icon: Cpu, label: 'Controller Field', prompt: 'Explain how field weakening and torque curve maps affect brushless motor heat dissipation ratios.' },
    { id: 'stop', icon: AlertOctagon, label: 'Panic Stop', prompt: 'What are the correct bio-mechanics positions to stop a high speed PEV without inducing pitch over handlebars?' },
    { id: 'crash', icon: Stethoscope, label: 'Post-Spill Diagnostics', prompt: 'I just low sided. Give me a fast body joint check and a structural fork and battery pack diagnostic script.' },
    { id: 'puncture', icon: Wrench, label: 'Puncture Fix', prompt: 'I have a flat tire out on the trail. Walk me through the absolute fastest way to plug a tubeless PEV tire.' },
    { id: 'signals', icon: Users, label: 'Group Signals', prompt: 'What are the standard universal hand and foot signals used during group PEV rides to warn followers of hazards?' },
    { id: 'night', icon: Moon, label: 'Night Optics', prompt: 'Explain proper lumen distribution and beam angles for front headlights to avoid blinding oncoming traffic while spotting potholes.' },
    { id: 'suspend', icon: Activity, label: 'Suspension Tune', prompt: 'Give me a quick guide on adjusting spring preload and rebound damping for a smoother ride on off-road gravel terrain.' }
  ];

  if (!mounted) return <div className="bg-[#0a0a0f] h-[650px] rounded-3xl flex items-center justify-center text-lime-400 font-black tracking-widest text-xs uppercase animate-pulse">Initializing Branded Core Matrix...</div>;

  return (
    <div className="bg-[#0a0a0f] border border-zinc-900 rounded-3xl p-4 h-[650px] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden font-sans select-none">
      
      {/* BRANDED INTERACTIVE HEADER */}
      <header className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`${t.bg} p-2 rounded-xl ${t.shadow}`}>
            <Activity className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className={`${t.text} font-black uppercase tracking-widest text-xs sm:text-sm`}>
              RURAL PILOT
            </h2>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wide">TACTICAL AI MATRIX</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => setDeepReasoningMode(!deepReasoningMode)}
            className={`min-h-[44px] px-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              deepReasoningMode 
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105' 
                : `bg-[#121318] border border-zinc-800 text-zinc-400 ${t.hover}`
            }`}
          >
            <Sparkles className="w-3 h-3" /> Deep Logic
          </button>

          <button 
            type="button"
            onClick={() => setShowSettings(true)} 
            className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer bg-[#121318] text-zinc-400 ${t.hover} border-zinc-800`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CONDITIONAL REAL-TIME TELEMETRY READOUT DECK */}
      {showTelemetryHUD && (
        <div className="bg-black/60 border border-zinc-900 rounded-xl p-2 mb-2 grid grid-cols-4 gap-2 text-center text-zinc-400 shrink-0 font-mono text-[9px] font-bold">
          <div className="bg-zinc-900/40 p-1.5 rounded border border-zinc-800/60 col-span-2 overflow-hidden">
            <span className="text-zinc-600 block text-[7px] uppercase font-black">ACTIVE ZONE</span>
            <span className={`text-white text-xs truncate block px-1 ${isStiglerLocked ? "text-amber-400" : ""}`}>
              {isStiglerLocked ? "STIGLER, OK (LOCKED)" : currentCity}
            </span>
          </div>
          <div className="bg-zinc-900/40 p-1.5 rounded border border-zinc-800/60">
            <span className="text-zinc-600 block text-[7px] uppercase font-black">VELOCITY</span>
            <span className={`${t.text} text-xs`}>{useMetric ? (liveStats?.speed * 1.60934).toFixed(0) : (liveStats?.speed ? Math.round(liveStats.speed) : 0)} {useMetric ? 'KMH' : 'MPH'}</span>
          </div>
          <div className="bg-zinc-900/40 p-1.5 rounded border border-zinc-800/60">
            <span className="text-zinc-600 block text-[7px] uppercase font-black">ALTITUDE</span>
            <span className="text-cyan-400 text-xs">{liveStats?.altitude ? Math.round(liveStats.altitude) : 0} FT</span>
          </div>
        </div>
      )}

      {/* HORIZONTAL SESSION TIMELINE */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-2 shrink-0 border-b border-zinc-900">
        <button 
          type="button"
          onClick={handleNewSession}
          className={`min-h-[44px] px-4 shrink-0 ${t.dim} rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80 transition-colors cursor-pointer`}
        >
          <Plus className="w-4 h-4"/> New Log
        </button>
        
        {sessions.map(s => (
          <div 
            key={s.id}
            onClick={() => setActiveSessionId(s.id)}
            className={`min-h-[44px] px-3 shrink-0 flex items-center gap-2 rounded-xl border cursor-pointer transition-all ${
              s.id === activeSessionId 
                ? `${t.bg} text-black ${t.border} ${t.shadow}` 
                : `bg-[#121318] text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200`
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider max-w-[120px] truncate">{s.title}</span>
            <button 
              type="button"
              onClick={(e) => deleteSession(e, s.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${s.id === activeSessionId ? 'hover:bg-black/20 text-black/70 hover:text-black' : 'hover:bg-rose-950/50 hover:text-rose-400 text-zinc-600'}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* --- STABILIZED PORTAL CONFIGURATION MATRIX --- */}
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#0a0a0f', border: '1px solid #27272a', width: '100%', maxWidth: '700px', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.hex, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Settings2 style={{ width: '16px', height: '16px' }} /> Local Matrix Settings
              </h3>
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                style={{ backgroundColor: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
              
              <div style={{ backgroundColor: '#121318', padding: '16px', borderRadius: '16px', border: '1px solid #27272a' }}>
                <label style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Hardware & Weight Specs (AI Context)</label>
                <p style={{ fontSize: '8px', color: '#52525b', textTransform: 'uppercase', marginBottom: '12px' }}>Define your specific rig (e.g. "60V Dual Motor", "Rider 210lbs") to permanently tailor AI math calculations.</p>
                <textarea 
                  value={customDirective} 
                  onChange={(e) => setCustomDirective(e.target.value)} 
                  placeholder="Enter custom hardware parameters here..."
                  style={{ width: '100%', minHeight: '70px', backgroundColor: 'black', border: '1px solid #27272a', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '12px', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ backgroundColor: '#121318', padding: '16px', borderRadius: '16px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Stigler Base Lock</span>
                    <span style={{ fontSize: '8px', color: '#52525b', textTransform: 'uppercase' }}>Bypass cell-tower GPS bounce</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsStiglerLocked(!isStiglerLocked)}
                    style={{ minHeight: '36px', padding: '0 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', border: '1px solid #27272a', backgroundColor: isStiglerLocked ? '#18181b' : 'black', color: isStiglerLocked ? t.hex : '#52525b', cursor: 'pointer' }}
                  >
                    {isStiglerLocked ? "LOCKED" : "GPS AUTO"}
                  </button>
                </div>
                
                <div style={{ paddingTop: '8px', borderTop: '1px solid #27272a' }}>
                  <label style={{ fontSize: '9px', color: '#a1a1aa', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Custom Base Zone (GPS Fallback)</label>
                  <input 
                    type="text" 
                    value={baseZone} 
                    onChange={(e) => setBaseZone(e.target.value)} 
                    placeholder="e.g. London, UK"
                    style={{ width: '100%', minHeight: '44px', backgroundColor: 'black', border: '1px solid #27272a', borderRadius: '8px', padding: '0 12px', color: 'white', fontSize: '12px', fontWeight: 'bold', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#121318', padding: '16px', borderRadius: '16px', border: '1px solid #27272a' }}>
                <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>AI Core Personality</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button type="button" onClick={() => setPersona('copilot')} style={{ padding: '8px', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '8px', border: '1px solid #27272a', backgroundColor: persona === 'copilot' ? '#18181b' : 'black', color: persona === 'copilot' ? t.hex : '#71717a', cursor: 'pointer' }}>Standard</button>
                  <button type="button" onClick={() => setPersona('mechanic')} style={{ padding: '8px', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '8px', border: '1px solid #27272a', backgroundColor: persona === 'mechanic' ? '#18181b' : 'black', color: persona === 'mechanic' ? t.hex : '#71717a', cursor: 'pointer' }}>Mechanic</button>
                  <button type="button" onClick={() => setPersona('legal')} style={{ padding: '8px', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '8px', border: '1px solid #27272a', backgroundColor: persona === 'legal' ? '#18181b' : 'black', color: persona === 'legal' ? t.hex : '#71717a', cursor: 'pointer' }}>Legal</button>
                </div>
              </div>

              <div style={{ backgroundColor: '#121318', padding: '16px', borderRadius: '16px', border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900, textTransform: 'uppercase' }}>Response Verbosity</span>
                <div style={{ display: 'flex', backgroundColor: 'black', padding: '4px', borderRadius: '8px', border: '1px solid #27272a' }}>
                  <button type="button" onClick={() => setVerbosity("brief")} style={{ minHeight: '32px', padding: '0 12px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '6px', backgroundColor: verbosity === 'brief' ? t.hex : 'transparent', color: verbosity === 'brief' ? 'black' : '#71717a', border: 'none', cursor: 'pointer' }}>Tactical</button>
                  <button type="button" onClick={() => setVerbosity("detailed")} style={{ minHeight: '32px', padding: '0 12px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '6px', backgroundColor: verbosity === 'detailed' ? t.hex : 'transparent', color: verbosity === 'detailed' ? 'black' : '#71717a', border: 'none', cursor: 'pointer' }}>Detailed</button>
                </div>
              </div>

              <div style={{ backgroundColor: '#121318', padding: '16px', borderRadius: '16px', border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900, textTransform: 'uppercase' }}>Telemetry HUD View</span>
                <button 
                  type="button"
                  onClick={() => setShowTelemetryHUD(!showTelemetryHUD)} 
                  style={{ position: 'relative', display: 'inline-flex', height: '28px', width: '50px', alignItems: 'center', borderRadius: '9999px', backgroundColor: showTelemetryHUD ? t.hex : '#27272a', cursor: 'pointer', border: 'none' }}
                >
                  <span style={{ display: 'block', height: '20px', width: '20px', borderRadius: '50%', backgroundColor: 'white', transform: showTelemetryHUD ? 'translateX(26px)' : 'translateX(4px)', transition: 'transform 0.2s' }} />
                </button>
              </div>
              
              <div style={{ backgroundColor: '#121318', padding: '16px', borderRadius: '16px', border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Legal Compliance Overlay</span>
                  <span style={{ fontSize: '8px', color: '#52525b', textTransform: 'uppercase' }}>Enforce statutory road code parameters</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setLegalComplianceMode(!legalComplianceMode)}
                  style={{ minHeight: '36px', padding: '0 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', border: '1px solid #27272a', backgroundColor: legalComplianceMode ? '#18181b' : 'black', color: legalComplianceMode ? t.hex : '#52525b', cursor: 'pointer' }}
                >
                  {legalComplianceMode ? "ENGAGED" : "BYPASSED"}
                </button>
              </div>

              <div style={{ backgroundColor: '#121318', padding: '16px', borderRadius: '16px', border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900, textTransform: 'uppercase' }}>Active Log Maintenance</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={exportChatHistory} style={{ padding: '8px 12px', backgroundColor: 'black', border: '1px solid #27272a', color: 'white', borderRadius: '8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>Export Log</button>
                  <button type="button" onClick={clearMemory} style={{ padding: '8px 12px', backgroundColor: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>Clear Log</button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                style={{ backgroundColor: '#18181b', color: '#d4d4d8', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', border: '1px solid #27272a', cursor: 'pointer' }}
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUICK COMMAND BOARD TRIGGER */}
      <button 
        type="button"
        onClick={() => setShowTactical(!showTactical)}
        className={`w-full min-h-[44px] flex items-center justify-between bg-[#121318] border border-zinc-800 px-4 rounded-xl mb-2 text-zinc-400 ${t.hover} transition-colors shadow-sm shrink-0 cursor-pointer`}
      >
        <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
          <Wrench className={`w-3.5 h-3.5 ${t.text}`} /> Tactical Quick Actions & Legality Filters
        </span>
        {showTactical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* EXPANDED FILTER MATRIX GRID */}
      {showTactical && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mb-2 shrink-0 overflow-y-auto max-h-[160px] custom-scrollbar p-0.5">
          {tacticalFeatures.map((feature) => (
            <button 
              key={feature.id}
              type="button"
              onClick={() => handleSearch(feature.prompt)} 
              className={`min-h-[44px] flex items-center gap-2 bg-black border border-zinc-800 ${t.hover} text-zinc-400 text-[9px] uppercase font-black px-3 py-2 rounded-xl transition-colors text-left cursor-pointer`}
            >
              <feature.icon className={`w-3.5 h-3.5 shrink-0 ${t.text}`} />
              <span className="truncate tracking-wide">{feature.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* STARK TERMINAL CONSOLE LOG FEED */}
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 pb-2">
        {activeMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-4">
            <Zap className={`w-10 h-10 opacity-10 ${t.text}`} />
            
            <div className="text-center space-y-1">
              <p className="font-black text-[10px] uppercase tracking-widest leading-relaxed font-mono text-zinc-600">
                SYSTEM CONSOLE OPEN
              </p>
              
              {isStiglerLocked || liveStats?.lat ? (
                <p className={`font-black text-[9px] uppercase tracking-widest font-mono flex items-center justify-center gap-1 ${t.text}`}>
                  <LocateFixed className="w-3 h-3 animate-pulse" /> SATELLITE POSITION LINK SYNCED
                </p>
              ) : (
                <p className="font-black text-[9px] uppercase tracking-widest font-mono flex items-center justify-center gap-1 text-amber-500">
                  <MapPinOff className="w-3 h-3" /> AWAITING SATELLITE LOCK
                </p>
              )}
              
              <p className="font-black text-[9px] uppercase tracking-widest font-mono text-zinc-600">
                READY FOR INPUT COMMAND
              </p>
            </div>
          </div>
        )}
        
        {activeMessages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-4 rounded-2xl ${fontSizeClass} whitespace-pre-wrap leading-relaxed max-w-[85%] font-sans ${
              m.role === 'user' 
                ? `${t.bg} text-black font-bold rounded-br-sm ${t.shadow}` 
                : 'bg-[#121318] border border-zinc-900 text-zinc-300 rounded-bl-sm font-normal tracking-wide shadow-sm'
            }`}>
              {m.image && (
                <img src={m.image} alt="Payload Node Check" className="max-w-full h-32 object-cover rounded-xl mb-3 border border-zinc-800" />
              )}
              {m.text}
            </div>
            
            <div className={`flex gap-3 mt-1.5 px-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
               <span className="text-[8px] font-mono text-zinc-600">{m.timestamp}</span>
               {m.role === 'ai' && (
                  <button 
                    type="button"
                    onClick={() => handleTTS(m.text, i)} 
                    className={`min-h-[36px] px-2 text-[9px] font-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${currentlyReadingIndex === i ? 'text-amber-400 animate-pulse' : `${t.text} ${t.hover}`}`}
                  >
                    {currentlyReadingIndex === i ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {currentlyReadingIndex === i ? "Halt Feed" : "Read Aloud"}
                  </button>
               )}
            </div>
          </div>
        ))}
        
        {isSearching && (
          <div className={`text-[9px] font-black font-mono uppercase tracking-widest flex items-center gap-2 pt-2 ${deepReasoningMode ? 'text-amber-500 animate-pulse' : t.text}`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-ping ${deepReasoningMode ? 'bg-amber-500' : t.bg}`} /> 
            {deepReasoningMode ? "PROCESSING HEAVY CALCULATIONS DATA MATRIX..." : "COMPUTING API CORE PAYLOAD FEED..."}
          </div>
        )}
        
        {hardwareError && (
          <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-xl flex items-start gap-2 mt-2">
            <AlertTriangle className="text-rose-400 w-4 h-4 shrink-0" />
            <p className="text-rose-400 text-[9px] font-black uppercase tracking-wider leading-relaxed">{hardwareError}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- SPLIT-ROW INPUT AREA --- */}
      <div className="mt-2 flex flex-col gap-2 shrink-0">
        
        <div className="flex gap-2 items-center">
          {selectedImage ? (
            <div className="relative inline-block w-fit">
              <img src={selectedImage} alt="Preview" className={`h-10 w-10 object-cover rounded-lg border ${t.border}`} />
              <button 
                type="button"
                onClick={clearSelectedImage}
                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-lg flex items-center justify-center cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploadingImg}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#121318] border border-zinc-800 text-zinc-500 rounded-xl ${t.hover} transition-colors disabled:opacity-50 cursor-pointer`}
              >
                {isUploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4.5 h-4.5" />}
              </button>

              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" />
              <button 
                type="button"
                onClick={() => cameraInputRef.current?.click()} 
                disabled={isUploadingImg}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#121318] border border-zinc-800 text-zinc-500 rounded-xl ${t.hover} transition-colors disabled:opacity-50 cursor-pointer`}
              >
                {isUploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4.5 h-4.5" />}
              </button>

              <button 
                type="button"
                onClick={toggleListening}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all border cursor-pointer ${
                  isListening ? "bg-rose-900/30 border-rose-900/40 text-rose-400 animate-pulse" : `bg-[#121318] border-zinc-800 text-zinc-500 ${t.hover}`
                }`}
              >
                {isListening ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(input)}
            className={`flex-1 min-w-0 bg-black border border-zinc-800 rounded-xl px-4 text-zinc-100 ${fontSizeClass} font-medium outline-none focus:${t.border} transition-colors placeholder:text-zinc-700 min-h-[44px]`}
            placeholder="Type command..."
          />
          
          <button 
            type="button"
            onClick={() => handleSearch(input)}
            disabled={(!input.trim() && !selectedImage) || isSearching || isUploadingImg}
            className={`min-h-[44px] w-16 shrink-0 rounded-xl disabled:opacity-20 transition-all flex items-center justify-center cursor-pointer ${deepReasoningMode ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]' : `${t.bg} text-black ${t.shadow}`}`}
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}