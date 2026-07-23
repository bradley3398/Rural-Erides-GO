"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Loader2, UploadCloud, XCircle, Camera, CheckCircle, 
  AlertTriangle, Trash2, History, ShieldAlert, Wrench,
  Mic, MicOff, Volume2, Square, Zap, ThermometerSun, 
  Copy, Cpu, Search, ExternalLink, Sliders, Info, ImagePlus, Globe, Activity,
  Settings, UserCircle, Settings2, Gauge, ChevronDown, ChevronUp, Layers, LifeBuoy,
  ShoppingBag, ShoppingCart, Award, FileText, ChevronLeft, ChevronRight, Maximize2, MapPin, Sparkles, Key, Ruler, User, X
} from "lucide-react";
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// --- SECURE API ROUTING ---
import { getGeminiApiKey, getTavilyApiKey } from "../services/CoPilotService";

const MODEL_VERSION = "gemini-3.1-flash-lite"; 

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  image?: string | null;
}

interface DiagnosticSession {
  id: string;
  timestamp: string;
  title: string;
  image: string | null;
  mimeType: string | null;
  messages: Message[];
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
}

type ThemeColor = 'lime' | 'cyan' | 'emerald' | 'amber' | 'rose';

export default function UniversalPEVAssistant(props: any) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<"chat" | "database">("chat");
  const [dbSubTab, setDbSubTab] = useState<"specs" | "parts">("specs");
  
  const [dbSearch, setDbSearch] = useState<string>("");
  const [livePevResults, setLivePevResults] = useState<PEVRecord[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState<boolean>(false);
  const [hasSearchedDb, setHasSearchedDb] = useState<boolean>(false);
  const [expandedPevIdx, setExpandedPevIdx] = useState<number | null>(null);
  const [displayCountSpecs, setDisplayCountSpecs] = useState<number>(5);
  
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

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<DiagnosticSession[]>([]);
  const [currentlyReadingId, setCurrentlyReadingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- UNIVERSAL OMNIBUS STATES ---
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [callsign, setCallsign] = useState<string>("");
  const [theme, setTheme] = useState<ThemeColor>('lime');

  const [userFleet, setUserFleet] = useState<string>("");
  const [aiDetailLevel, setAiDetailLevel] = useState<"compact" | "standard" | "exhaustive">("standard");
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  
  const [searchScope, setSearchScope] = useState<"all" | "oem_only" | "aftermarket_only" | "third_party">("all");
  const [preferredMarketplace, setPreferredMarketplace] = useState<"aggregated" | "amazon" | "ebay" | "official">("aggregated");
  const [userRegion, setUserRegion] = useState<"US" | "UK" | "EU" | "CA" | "AU">("US"); 
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial"); 
  const [buildManifest, setBuildManifest] = useState<PartRecord[]>([]);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Safely initialize client-side states after mounting to prevent SSR mismatch / hydration crashes
  useEffect(() => {
    setMounted(true);
    setActiveSessionId(Date.now().toString());

    try {
      const savedHistory = localStorage.getItem("universal_diagnostic_sessions");
      if (savedHistory) setScanHistory(JSON.parse(savedHistory));

      const savedFleet = localStorage.getItem("universal_user_fleet") || localStorage.getItem("rural_erides_fleet");
      if (savedFleet) setUserFleet(savedFleet);

      const savedRate = localStorage.getItem("universal_tts_rate");
      if (savedRate) setTtsRate(parseFloat(savedRate));

      const savedPitch = localStorage.getItem("universal_tts_pitch");
      if (savedPitch) setTtsPitch(parseFloat(savedPitch));

      const savedManifest = localStorage.getItem("universal_build_manifest");
      if (savedManifest) setBuildManifest(JSON.parse(savedManifest));

      const savedRegion = localStorage.getItem("universal_user_region");
      if (savedRegion) setUserRegion(savedRegion as any);

      const savedUsername = localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name") || "";
      if (savedUsername) setCallsign(savedUsername);

      const savedTheme = (localStorage.getItem("rural_theme") as ThemeColor) || (props.theme as ThemeColor);
      if (savedTheme) setTheme(savedTheme);

      const savedMetric = localStorage.getItem("rt_use_metric");
      if (savedMetric === "true" || props.useMetric) setUnitSystem("metric");
    } catch (e) {
      console.warn("Hydration storage error bypassed.");
    }
  }, [props.theme, props.useMetric]);

  // --- 🔥 STABILIZED THEME ENGINE 🔥 ---
  const t = {
    lime: { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/50', hover: 'hover:text-[#39ff14]', hex: '#39ff14', borderSubtle: 'border-[#39ff14]/30', hoverBorder: 'hover:border-[#39ff14]/50', groupHoverText: 'group-hover:text-[#39ff14]' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', dim: 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50', hover: 'hover:text-cyan-400', hex: '#06b6d4', borderSubtle: 'border-cyan-900/40', hoverBorder: 'hover:border-cyan-500/50', groupHoverText: 'group-hover:text-cyan-400' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', dim: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50', hover: 'hover:text-emerald-400', hex: '#10b981', borderSubtle: 'border-emerald-900/40', hoverBorder: 'hover:border-emerald-500/50', groupHoverText: 'group-hover:text-emerald-400' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', dim: 'bg-amber-950/30 text-amber-400 border-amber-900/50', hover: 'hover:text-amber-400', hex: '#f59e0b', borderSubtle: 'border-amber-900/40', hoverBorder: 'hover:border-amber-500/50', groupHoverText: 'group-hover:text-amber-400' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', dim: 'bg-rose-950/30 text-rose-400 border-rose-900/50', hover: 'hover:text-rose-400', hex: '#f43f5e', borderSubtle: 'border-rose-900/40', hoverBorder: 'hover:border-rose-500/50', groupHoverText: 'group-hover:text-rose-400' }
  }[theme] || { text: 'text-[#39ff14]', bg: 'bg-[#39ff14]', border: 'border-[#39ff14]', shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]', dim: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/50', hover: 'hover:text-[#39ff14]', hex: '#39ff14', borderSubtle: 'border-[#39ff14]/30', hoverBorder: 'hover:border-[#39ff14]/50', groupHoverText: 'group-hover:text-[#39ff14]' };

  const randomPevPool = [
    "Aostirmotor A20 Ebike", "iSinwheel H7 Pro Scooter", "Engwe Y600 Scooter", "Geemax Etrike",
    "Surron Light Bee X", "Onewheel GT S-Series", "InMotion V12 HT EUC", "Begode Blitz EUC",
    "Segway Ninebot Max G2", "Talaria Sting R", "Dualtron Storm Limited", "Fiido Q1S Seated Scooter",
    "Vsett 10 Plus Scooter", "Super73 RX Electric Motorbike", "Apollo Phantom V3", "NAMI Burn-E 2 Max"
  ];

  const saveConfiguration = () => {
    try {
      localStorage.setItem("universal_user_fleet", userFleet);
      localStorage.setItem("rural_erides_fleet", userFleet);
      localStorage.setItem("universal_tts_rate", ttsRate.toString());
      localStorage.setItem("universal_tts_pitch", ttsPitch.toString());
      localStorage.setItem("universal_user_region", userRegion);
      localStorage.setItem("universal_user_units", unitSystem);
      localStorage.setItem("rt_use_metric", unitSystem === 'metric' ? 'true' : 'false');
      localStorage.setItem("rural_theme", theme);
      localStorage.setItem("rt_theme", theme);
      localStorage.setItem("rural_erides_username", callsign);
      localStorage.setItem("radar_screen_name", callsign);
      localStorage.setItem("copilot_pilot_name", callsign);
    } catch (e) {
      console.warn("Failed saving configuration to localStorage.");
    }
    setShowSettings(false);
  };

  useEffect(() => {
    if (!mounted || messages.length === 0) return;
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
      } catch (e) {
        console.warn("Storage ledger capacity maxed out.");
      }
      return newHistory;
    });
  }, [messages, activeSessionId, mounted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  useEffect(() => {
    if (!isAnalyzing && !isSearchingDb && !isSearchingParts) return;
    const steps = [
      "Accessing dynamic global web indexes (Tavily Multi-Channel Deep-Routing)...",
      "Scraping live manufacturer databases, Amazon inventories, and eBay channels...",
      "Calibrating search outputs for chosen regional pricing criteria...",
      "Parsing real-time multi-result technical parameters map..."
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
    if (currentlyReadingId) TextToSpeech.stop();
    setCurrentlyReadingId(null);
  };

  const loadPreviousSession = (session: DiagnosticSession) => {
    setActiveSessionId(session.id);
    clearImage();
    setMessages(session.messages);
    setQuestion("");
    setErrorMsg(null);
    if (currentlyReadingId) TextToSpeech.stop();
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
    } catch (err) {
      console.error("System clipboard failure", err);
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
        await TextToSpeech.stop();
        setCurrentlyReadingId(null);
      } else {
        if (currentlyReadingId) await TextToSpeech.stop();
        setCurrentlyReadingId(id);
        const cleanText = text.replace(/\*/g, '').replace(/#/g, '');
        await TextToSpeech.speak({ 
          text: cleanText, 
          lang: 'en-US', 
          rate: ttsRate, 
          pitch: ttsPitch, 
          volume: 1.0, 
          category: 'ambient' 
        });
        setCurrentlyReadingId(null);
      }
    } catch (e) {
      console.error("TTS Error:", e);
      setErrorMsg("Audio processing hardware failed initialization.");
      setCurrentlyReadingId(null);
    }
  };

  const getRegionalDomainSuffix = () => {
    if (userRegion === "UK") return { amazon: "amazon.co.uk", ebay: "ebay.co.uk", currency: "GBP (£)" };
    if (userRegion === "EU") return { amazon: "amazon.de", ebay: "ebay.de", currency: "EUR (€)" };
    if (userRegion === "CA") return { amazon: "amazon.ca", ebay: "ebay.ca", currency: "CAD ($)" };
    if (userRegion === "AU") return { amazon: "amazon.com.au", ebay: "ebay.com.au", currency: "AUD ($)" };
    return { amazon: "amazon.com", ebay: "ebay.com", currency: "USD ($)" };
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

  const searchLiveSpecs = async (targetOverride?: string) => {
    const searchQuery = targetOverride || dbSearch;
    if (!searchQuery.trim()) return;
    
    setIsSearchingDb(true);
    setHasSearchedDb(true);
    setErrorMsg(null);
    setLivePevResults([]); 
    setExpandedPevIdx(null);
    setActiveImageIndices({});
    setDisplayCountSpecs(5);

    try {
      const tavilyKey = getTavilyApiKey();
      const geminiKey = getGeminiApiKey();

      const tavilyQuery = `${searchQuery} official manufacturer store page mechanics technical specifications review data sheets`;
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: tavilyQuery,
          search_depth: "advanced", 
          include_raw_content: false,
          max_results: 20 
        })
      });
      
      const tavilyData = await tavilyResponse.json();
      if (!tavilyResponse.ok) throw new Error(tavilyData.error || "Tavily engine communication dropped.");
      
      const webContextData = JSON.stringify(tavilyData.results);

      const prompt = `You are a strict technical schema conversion layer. I have run an advanced internet search across all brands for "${searchQuery}".
      Here is the raw real-world context data parsed from dynamic web nodes:
      ${webContextData}
      
      Target Region Focus Parameter: ${userRegion}
      Measurement Unit: ${unitSystem.toUpperCase()} (Force output to this system).
      
      Analyze the text payload to reconstruct a high-fidelity specifications dataset mapping an expanded array of distinct matching vehicle variations discovered in the search logs. 
      CRITICAL INSTRUCTION: If this search represents a multi-vehicle request or random discovery mode, you MUST return exactly 10 matching hardware records using your expert knowledge base grounding to complete missing specs. Ensure everything uses accurate official factory parameters.
      
      CRITICAL LINK REQUIREMENT: Inside the "siteUrl" field, you MUST extract the actual, real manufacturer product URL, official distributor domain, or specific review link text from the provided search results. Do not provide dummy links.
      
      CRITICAL REGIONAL REQUISITE: Calibrate all parsed pricing figures specifically to support the designated country/region location code: ${userRegion}. Adapt appropriate currency notation configurations: ($, £, €) reflecting local inventory parameters.

      Return ONLY a clean JSON array matching this data model signature exactly. Do NOT add markdown blocks or conversational text. Just the raw array starting with [ and ending with ].
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
          "frameMaterial": "Chassis structural core profile alloy composite composition"
        }
      ]`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent?key=${geminiKey}`;
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
    const shuffledPool = [...randomPevPool].sort(() => 0.5 - Math.random());
    const selectedTenPevs = shuffledPool.slice(0, 10);
    const complexMacroQuery = selectedTenPevs.join(", ");
    
    setDbSearch("Random 10 PEV Database Roundup");
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
        targetQuery = `${universalPartQuery} parts components store ${storeFilter}`;
      } else {
        const modifier = searchScope === "aftermarket_only" ? "aftermarket upgrade performance modification" : 
                         searchScope === "third_party" ? "compatible replacement clone spare alternative" : "OEM genuine spare part";
        
        const makeModelString = (partsMake || partsModel) ? `${partsMake} ${partsModel}` : "electric scooter ebike hardware";
        targetQuery = `${makeModelString} ${partsCategory} ${modifier} ${storeFilter}`;
      }
      
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: targetQuery,
          search_depth: "advanced", 
          include_raw_content: false,
          max_results: 20 
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
      
      Parse real hardware components. Return an expanded layout of up to 15 distinct item entries to display a maxed out search database pool. Trace alternative 3rd party compatible components, non-OEM functional clone clones, and aftermarket options alongside standard OEM profiles. Match absolute store URLs directly inside the text blocks.
      
      IMPORTANT FAILSAFE: If the search context payload is thin or missing direct results, USE YOUR EXPERT KNOWLEDGE BASE to generate at least 10 highly accurate, real-world examples of components that exist on the market for this query, assigning logical marketplace URLs. DO NOT return an empty array.

      Return a clean JSON array matching this layout design. Do NOT add markdown blocks or conversational text. Just the raw array starting with [ and ending with ].
      [
        {
          "partName": "Precise hardware description (include parameters such as size, thread counts, valve types, TPI casing numbers, or electrical boundaries)",
          "category": "Tires | Tubes | Brakes | Batteries | Motors | Accessories | Controllers | Upgrades",
          "compatibility": "Verified model boundaries or universal fit criteria",
          "technicalSpecs": "Metrics: TPI values, dimensions, compound formulas, electrical capacity thresholds parsed from web results",
          "estimatedPrice": "Current live listing local region currency financial quote indicator string",
          "recommendedBrands": "OEM producer, third party alternative component, or prominent heavy-duty aftermarket variant maker found in text",
          "partUrl": "Absolute direct deep link path URL straight to product checkout page found inside search text logs",
          "partType": "OEM Stock" | "Aftermarket Upgrade" | "Performance Modification" | "3rd Party Clone Compatible",
          "sourcePlatform": "Official Store" | "Amazon" | "eBay" | "Multi-Vendor Network" | "AliExpress Store"
        }
      ]`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent?key=${geminiKey}`;
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

  const analyzeImage = async (overridePrompt?: string) => {
    const activeQuery = overridePrompt || question || (image ? "Please run a diagnostic scan on this hardware." : "");
    if (!activeQuery.trim()) {
      setErrorMsg("Enter a mechanical query or run a quick action module.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setQuestion("");

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: activeQuery };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    let depthInstruction = "";
    if (aiDetailLevel === "compact") depthInstruction = "Keep your answer to a single, concise paragraph.";
    if (aiDetailLevel === "standard") depthInstruction = "Provide a comprehensive answer detailing exactly how to fix the issue or answer the query.";
    if (aiDetailLevel === "exhaustive") depthInstruction = "Provide an exhaustive, step-by-step masterclass answer detailing torque specs, tool requirements, and safety warnings.";

    const systemContext = `
      You are a universal PEV master mechanic. Speak conversationally and directly to the operator.
      User Identity: ${callsign || 'Unknown Pilot'}.
      User's Known Active Fleet/Hardware: ${userFleet || "Unspecified Universal PEV"}.
      User's Measurement Unit System: ${unitSystem}.
      CRITICAL: NO markdown formatting. NO bullet points. NO numbered lists. NO bold text. 
      Answer the query based on safety and mechanics.
      ${depthInstruction}
    `;

    try {
      const apiContents = updatedMessages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const lastUserIndex = apiContents.length - 1;
      const promptParts: any[] = [{ text: `${systemContext}\n\nQuery: ${activeQuery}` }];

      if (image && mimeType) {
        promptParts.push({ inlineData: { mimeType: mimeType, data: image } });
      }

      apiContents[lastUserIndex].parts = promptParts;

      const geminiKey = getGeminiApiKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: apiContents })
      });

      const data = await response.json();
      if (response.status === 429) throw new Error("Cloud network threshold maxed. Hold execution 10 seconds.");
      if (!response.ok) throw new Error(data.error?.message || `Terminal Node Error ${response.status}`);

      const reportText = data.candidates[0].content.parts[0].text;
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: reportText };
      setMessages([...updatedMessages, aiMsg]);

    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : String(error));
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAnalyzing(false);
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
    copyToClipboard(`Universal PEV Build Manifest:\n\n${manifestText}`);
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
    const totalImages = livePevResults[pevIdx].imageUrls.length;
    const newImgIdx = imgIdx === 0 ? totalImages - 1 : imgIdx - 1;
    setLightboxState({ pevIdx, imgIdx: newImgIdx });
  };

  const handleLightboxNext = () => {
    if (!lightboxState) return;
    const { pevIdx, imgIdx } = lightboxState;
    const totalImages = livePevResults[pevIdx].imageUrls.length;
    const newImgIdx = imgIdx === totalImages - 1 ? 0 : imgIdx + 1;
    setLightboxState({ pevIdx, imgIdx: newImgIdx });
  };

  if (!mounted) {
    return <div className="p-6 text-center text-zinc-500 font-mono">Initializing Universal PEV Terminal...</div>;
  }

  return (
    <div className="space-y-4 p-4 max-w-6xl mx-auto font-sans text-zinc-200 relative">
      
      {/* BRANDED NAVIGATION INTERFACE */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#0a0a0f] p-4 rounded-2xl border border-zinc-900 shadow-xl gap-4">
        <div className="flex items-center gap-3">
          <div className={`${t.bg} p-2 rounded-xl ${t.shadow}`}>
            <Globe className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className={`${t.text} font-black text-sm tracking-widest uppercase flex items-center gap-2`}>
              UNIVERSAL HUB <span className={`px-1.5 py-0.5 rounded ${t.dim} text-[8px] animate-pulse`}>ONLINE</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono">DIAGNOSTICS &amp; GLOBAL SPEC ENGINE</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/60 p-1 border border-zinc-800 rounded-xl">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === "chat" ? `${t.bg} text-black ${t.shadow}` : "text-zinc-400 hover:text-white"}`}
          >
            Mechanical Copilot
          </button>
          <button 
            onClick={() => setActiveTab("database")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === "database" ? `${t.bg} text-black ${t.shadow}` : "text-zinc-400 hover:text-white"}`}
          >
            Global Spec Engine
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-mono tracking-wider font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 text-zinc-400">
            <MapPin className={`w-3.5 h-3.5 ${t.text}`} /> Index Zone: <span className={`${t.text} font-black`}>{userRegion}</span>
          </div>
          <button 
            type="button"
            onClick={() => setShowSettings(true)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 bg-[#121318] hover:bg-zinc-800 border border-zinc-800 ${t.text}`}
          >
            <Settings className="w-3 h-3" /> Config
          </button>
          <button 
            type="button"
            onClick={startNewSession}
            className={`bg-[#121318] hover:bg-zinc-800 border border-zinc-800 ${t.text} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2`}
          >
            <History className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* --- UNIVERSAL CONFIGURATION MODAL / DRAWER --- */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0a0a0f] border border-zinc-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-5 shrink-0">
              <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${t.text}`}>
                <Settings2 className="w-4 h-4" /> Universal Configuration Matrix
              </h3>
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-5 pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <User className={`w-3 h-3 ${t.text}`}/> Pilot Callsign
                  </label>
                  <input 
                    type="text" 
                    value={callsign} 
                    onChange={(e) => setCallsign(e.target.value)} 
                    placeholder="e.g. Unknown Rider" 
                    className="w-full bg-black border border-zinc-800 text-xs text-white rounded-xl px-4 py-3 outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <UserCircle className={`w-3 h-3 ${t.text}`}/> Operator Fleet Declaration
                  </label>
                  <input 
                    type="text" 
                    value={userFleet} 
                    onChange={(e) => setUserFleet(e.target.value)} 
                    placeholder="e.g. Surron Light Bee, Custom Builds..." 
                    className="w-full bg-black border border-zinc-800 text-xs text-white rounded-xl px-4 py-3 outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <Activity className={`w-3 h-3 ${t.text}`}/> Diagnostic Depth
                  </label>
                  <div className="flex gap-1.5">
                    {['compact', 'standard', 'exhaustive'].map(lvl => (
                      <button 
                        key={lvl} 
                        type="button"
                        onClick={() => setAiDetailLevel(lvl as any)}
                        className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${aiDetailLevel === lvl ? `${t.dim}` : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <Award className={`w-3 h-3 ${t.text}`}/> Component Tier
                  </label>
                  <select
                    value={searchScope}
                    onChange={(e) => setSearchScope(e.target.value as any)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none font-mono focus:border-zinc-500"
                  >
                    <option value="all" className="bg-black">All Options</option>
                    <option value="oem_only" className="bg-black">OEM Only</option>
                    <option value="aftermarket_only" className="bg-black">Aftermarket</option>
                    <option value="third_party" className="bg-black">3rd Party / Clones</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <MapPin className={`w-3 h-3 ${t.text}`}/> Region Framework
                  </label>
                  <select
                    value={userRegion}
                    onChange={(e) => setUserRegion(e.target.value as any)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none font-mono text-white focus:border-zinc-500"
                  >
                    <option value="US" className="bg-black text-white">United States (USD - $)</option>
                    <option value="UK" className="bg-black text-white">United Kingdom (GBP - £)</option>
                    <option value="EU" className="bg-black text-white">Eurozone (EUR - €)</option>
                    <option value="CA" className="bg-black text-white">Canada (CAD - $)</option>
                    <option value="AU" className="bg-black text-white">Australia (AUD - $)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <Gauge className={`w-3 h-3 ${t.text}`}/> Measurement Units
                  </label>
                  <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
                    <button type="button" onClick={() => setUnitSystem("imperial")} className={`min-h-[38px] px-3 text-[9px] font-black uppercase rounded-lg transition-colors flex-1 ${unitSystem === 'imperial' ? `${t.bg} text-black` : 'text-zinc-500'}`}>Imperial</button>
                    <button type="button" onClick={() => setUnitSystem("metric")} className={`min-h-[38px] px-3 text-[9px] font-black uppercase rounded-lg transition-colors flex-1 ${unitSystem === 'metric' ? `${t.bg} text-black` : 'text-zinc-500'}`}>Metric</button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className={`w-3 h-3 ${t.text}`}/> Theme Engine
                  </label>
                  <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setTheme('lime')} className={`w-9 h-9 rounded-full bg-[#39ff14] border-2 border-black ${theme === 'lime' ? 'ring-2 ring-white' : ''}`}></button>
                      <button type="button" onClick={() => setTheme('cyan')} className={`w-9 h-9 rounded-full bg-cyan-500 border-2 border-black ${theme === 'cyan' ? 'ring-2 ring-white' : ''}`}></button>
                      <button type="button" onClick={() => setTheme('emerald')} className={`w-9 h-9 rounded-full bg-emerald-500 border-2 border-black ${theme === 'emerald' ? 'ring-2 ring-white' : ''}`}></button>
                      <button type="button" onClick={() => setTheme('amber')} className={`w-9 h-9 rounded-full bg-amber-500 border-2 border-black ${theme === 'amber' ? 'ring-2 ring-white' : ''}`}></button>
                      <button type="button" onClick={() => setTheme('rose')} className={`w-9 h-9 rounded-full bg-rose-500 border-2 border-black ${theme === 'rose' ? 'ring-2 ring-white' : ''}`}></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-5 py-2.5 rounded-xl font-black uppercase text-[10px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={saveConfiguration} 
                className={`${t.bg} text-black px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-transform active:scale-95 cursor-pointer`}
              >
                Save &amp; Sync Globally
              </button>
            </div>

          </div>
        </div>
      )}

      {activeTab === "chat" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* LEFT SIDEBAR: CAMERA AND ACTIONS */}
          <div className="lg:col-span-1 space-y-4">
            
            <div className="bg-[#0a0a0f] p-4 rounded-2xl border border-zinc-900 shadow-xl space-y-3">
              <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-widest border-b border-zinc-900 pb-2 flex items-center gap-2">
                <Camera className={`w-3.5 h-3.5 ${t.text}`} /> Optical Inputs
              </h3>
              
              <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} className="hidden" />
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />

              {!previewUrl ? (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className={`border border-zinc-800 ${t.hoverBorder} rounded-xl p-4 text-center bg-black/40 transition-all flex flex-col items-center justify-center gap-1.5 group`}
                  >
                    <ImagePlus className={`w-5 h-5 text-zinc-500 ${t.groupHoverText} transition-colors`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Upload Photo</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className={`border border-zinc-800 ${t.hoverBorder} rounded-xl p-4 text-center bg-black/40 transition-all flex flex-col items-center justify-center gap-1.5 group`}
                  >
                    <Camera className={`w-5 h-5 text-zinc-500 ${t.groupHoverText} transition-colors`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Open Camera</span>
                  </button>
                </div>
              ) : (
                <div className={`relative rounded-xl overflow-hidden border ${t.borderSubtle} bg-zinc-950 shadow-inner`}>
                  <img src={previewUrl} alt="Inspection Target" className="w-full h-40 object-contain" />
                  <button 
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-black/80 hover:bg-rose-950 border border-zinc-800 text-zinc-300 hover:text-rose-400 p-1.5 rounded-lg transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <div className={`absolute bottom-2 left-2 bg-black/80 border ${t.borderSubtle} px-2 py-1 rounded-lg text-[8px] ${t.text} font-mono font-black flex items-center gap-1`}>
                    <CheckCircle className="w-2.5 h-2.5" /> FRAME RECOGNIZED
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: Zap, label: "Electrical", prompt: "Inspect battery contacts for corrosion, controller wiring for thermal damage, and display connectors." },
                  { icon: ThermometerSun, label: "Thermals", prompt: "What causes melted casing, heat discoloration, or thermal runaway on a PEV?" },
                  { icon: Wrench, label: "Mechanical", prompt: "Inspect frame welds, brake rotor warping, and chain/drivetrain tension." },
                  { icon: Gauge, label: "Tires & Sus", prompt: "Analyze tire pressure, sidewall wear, and suspension seal conditions." }
                ].map((mod, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => analyzeImage(mod.prompt)}
                    disabled={isAnalyzing}
                    className={`bg-black border border-zinc-800 ${t.hoverBorder} disabled:opacity-50 text-zinc-400 hover:text-white p-2 rounded-lg flex flex-col items-center gap-1 transition-colors group`}
                  >
                    <mod.icon className={`w-3.5 h-3.5 ${t.text} ${t.groupHoverText} transition-colors`} />
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-center">{mod.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0a0a0f] p-4 rounded-2xl border border-zinc-900 shadow-xl flex flex-col h-[280px]">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
                <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <History className="w-3.5 h-3.5" /> Garage Log Ledger
                </h3>
                {scanHistory.length > 0 && (
                  <button type="button" onClick={clearAllHistory} className="text-zinc-600 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8 text-zinc-700">
                    <Wrench className="w-5 h-5 mx-auto mb-2 opacity-20" />
                    <p className="text-[8px] uppercase font-black tracking-widest">No Logs Logged</p>
                  </div>
                ) : (
                  scanHistory.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => loadPreviousSession(item)}
                      className={`p-2 bg-black/60 border rounded-lg cursor-pointer transition-all ${activeSessionId === item.id ? `${t.borderSubtle} shadow-inner` : 'border-zinc-900 hover:border-zinc-800'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-mono font-bold text-zinc-500">{item.timestamp}</span>
                        {activeSessionId === item.id && <span className={`w-1.5 h-1.5 rounded-full ${t.bg} animate-pulse`} />}
                      </div>
                      <p className="text-[9px] font-black text-zinc-300 truncate tracking-wide uppercase">{item.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col bg-[#0a0a0f] border border-zinc-900 rounded-2xl shadow-xl h-[595px] overflow-hidden">
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <ShieldAlert className={`w-10 h-10 ${t.text} mb-3 animate-pulse`} />
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest text-center">
                    Universal Copilot Online.<br/>Feed terminal prompt or snap structural asset to index diagnostics.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed max-w-[85%] shadow-md ${
                      m.role === 'user' 
                        ? `${t.dim} text-zinc-200 rounded-br-sm border` 
                        : 'bg-[#181a20] border border-zinc-800 text-zinc-100 rounded-bl-sm font-medium'
                    }`}>
                      {m.image && (
                        <img src={m.image} alt="Payload Node Check" className="max-w-full h-32 object-cover rounded-xl mb-3 border border-zinc-800" />
                      )}
                      {m.text}
                    </div>
                    {m.role === 'ai' && (
                      <div className="flex gap-2 mt-1.5">
                        <button 
                          type="button"
                          onClick={() => handleTTS(m.text, m.id)} 
                          className={`text-[9px] font-bold uppercase flex items-center gap-1 transition-colors ${currentlyReadingId === m.id ? 'text-rose-400' : t.text}`}
                        >
                          {currentlyReadingId === m.id ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          {currentlyReadingId === m.id ? "Kill Audio" : "Voice Read"}
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => copyToClipboard(m.text, m.id)} 
                          className="text-[9px] font-bold uppercase flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <Copy className="w-3 h-3" /> 
                          {copiedId === m.id ? "Synced" : "Copy Payload"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="bg-[#181a20] border border-zinc-800 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                    <Loader2 className={`w-4 h-4 ${t.text} animate-spin`} />
                    <span className="text-xs text-zinc-400 font-mono">{loadingStep}</span>
                  </div>
                </div>
              )}
              
              {errorMsg && activeTab === "chat" && (
                <div className="bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3.5 flex gap-2.5 items-start mt-4">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="font-bold leading-relaxed">{errorMsg}</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-[#121318] border-t border-zinc-800/80 flex gap-2">
              <button 
                type="button"
                onClick={toggleListening}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                  isListening ? "bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse" : `bg-black border-zinc-800 text-zinc-400 hover:text-white ${t.hoverBorder}`
                }`}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyzeImage()}
                placeholder="Submit mechanical parameter inquiry or prompt core..."
                className={`flex-1 bg-black border border-zinc-800 text-xs text-white rounded-xl px-4 outline-none focus:${t.border} font-bold transition-colors placeholder:text-zinc-700`}
              />
              <button 
                type="button"
                onClick={() => analyzeImage()} 
                disabled={isAnalyzing || (!question.trim() && !image)}
                className={`p-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center border ${t.bg} hover:opacity-80 text-black ${t.border} disabled:opacity-30 disabled:hover:opacity-30 ${t.shadow}`}
              >
                {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>
      ) : (
        
        <div className="bg-[#0a0a0f] p-5 rounded-2xl border border-zinc-900 shadow-2xl space-y-6">
          
          {/* SUB-TAB NAVIGATOR FOR GLOBAL RETRIEVAL */}
          <div className="flex border-b border-zinc-800 pb-2 gap-4">
            <button 
              type="button"
              onClick={() => setDbSubTab("specs")}
              className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${dbSubTab === "specs" ? `${t.border} ${t.text}` : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
            >
              <Layers className="w-3.5 h-3.5" /> Official Deep Spec Lookup
            </button>
            <button 
              type="button"
              onClick={() => setDbSubTab("parts")}
              className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${dbSubTab === "parts" ? `${t.border} ${t.text}` : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
            >
              <LifeBuoy className="w-3.5 h-3.5" /> Factory Parts &amp; Supply Lines
            </button>
          </div>

          {/* MODE A: GLOBAL SPEC RETRIEVAL ENGINE WITH GALLERY SWIPER */}
          {dbSubTab === "specs" && (
            <div className="space-y-6">
              <div className={`flex flex-col md:flex-row justify-between items-center gap-3 bg-black/40 p-3 rounded-xl border ${t.borderSubtle}`}>
                <div className={`flex items-center gap-2 bg-black border border-zinc-800 rounded-xl px-3 py-1.5 flex-1 focus-within:${t.border} transition-colors`}>
                  <Globe className={`w-4 h-4 ${t.text} animate-pulse`} />
                  <input 
                    type="text"
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchLiveSpecs()}
                    placeholder="Search any model configuration (e.g. Aostirmotor A20, iSinwheel H7 Pro, EUC...)"
                    className="bg-transparent border-none text-xs text-white outline-none w-full font-bold placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    type="button"
                    onClick={handleRandomDiscovery}
                    disabled={isSearchingDb}
                    className={`flex-1 md:flex-none bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 ${t.text} px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-inner`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${t.text}`} />
                    Random Discovery (10 Devices)
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => searchLiveSpecs()}
                    disabled={isSearchingDb || !dbSearch.trim()}
                    className={`flex-1 md:flex-none ${t.bg} hover:opacity-80 disabled:opacity-50 text-black px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${t.shadow} flex items-center justify-center gap-2`}
                  >
                    {isSearchingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Max-Capacity Scan
                  </button>
                </div>
              </div>

              {isSearchingDb && (
                <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
                  <Activity className={`w-10 h-10 ${t.text} animate-bounce`} />
                  <div className={`${t.text} font-mono text-[10px] uppercase tracking-widest animate-pulse`}>{loadingStep}</div>
                </div>
              )}

              {/* VEHICLE BLUEPRINTS LISTING */}
              {!isSearchingDb && livePevResults.length === 0 ? (
                hasSearchedDb ? (
                  <div className="text-center py-16 border border-dashed border-rose-900/50 rounded-xl text-rose-500 font-mono text-[10px] uppercase tracking-widest flex flex-col items-center gap-3">
                    <AlertTriangle className="w-8 h-8 opacity-50" />
                    0 Compatible Technical Datasheets Parsed. Ensure spelling parameters match perfectly.
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-zinc-900 rounded-xl text-zinc-600 font-mono text-[10px] uppercase tracking-widest flex flex-col items-center gap-3">
                    <Globe className="w-8 h-8 opacity-20" />
                    Execute expanded maximum internet queries to isolate high-fidelity structural arrays and specific source link networks.
                  </div>
                )
              ) : !isSearchingDb && (
                <div className="flex flex-col gap-4">
                  {livePevResults.slice(0, displayCountSpecs).map((pev, idx) => {
                    const isExpanded = expandedPevIdx === idx;
                    const currentImgIdx = activeImageIndices[idx] || 0;
                    const totalImages = pev.imageUrls.length;

                    return (
                      <div 
                        key={idx} 
                        className={`bg-black/60 border border-zinc-900 rounded-2xl p-4 flex flex-col transition-all hover:${t.borderSubtle.replace('border-','border-')} overflow-hidden`}
                      >
                        {/* MAIN WRAPPER CARD COMPONENT */}
                        <div className="flex flex-col lg:flex-row gap-4">
                          
                          {/* MULTI-IMAGE CAROUSEL CONTAINER WITH SWIPE OVERLAYS */}
                          <div className="w-full lg:w-44 flex flex-col gap-2 shrink-0">
                            <div className="w-full h-44 rounded-xl overflow-hidden bg-white border border-zinc-900 relative group flex items-center justify-center">
                              <img 
                                src={pev.imageUrls[currentImgIdx]} 
                                alt={`${pev.name} - view ${currentImgIdx}`} 
                                className="w-full h-full object-cover mix-blend-multiply select-none transition-all duration-300" 
                              />
                              
                              <span className={`absolute top-2 left-2 bg-black/80 px-2 py-0.5 border border-zinc-800 rounded text-[7.5px] font-black tracking-widest ${t.text} uppercase font-mono`}>
                                {pev.category}
                              </span>

                              {/* Interactive Swiper controls */}
                              <button 
                                type="button"
                                onClick={(e) => handlePrevImage(idx, totalImages, e)}
                                className={`absolute left-1 top-1/2 -translate-y-1/2 bg-black/70 border border-zinc-800 ${t.hoverBorder} p-1 rounded-lg text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity`}
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => handleNextImage(idx, totalImages, e)}
                                className={`absolute right-1 top-1/2 -translate-y-1/2 bg-black/70 border border-zinc-800 ${t.hoverBorder} p-1 rounded-lg text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity`}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Lightbox Trigger Overlay */}
                              <button 
                                type="button"
                                onClick={() => setLightboxState({ pevIdx: idx, imgIdx: currentImgIdx })}
                                className={`absolute bottom-2 right-2 bg-black/80 border border-zinc-800 ${t.hoverBorder} p-1.5 rounded-lg text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg`}
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Thumbnail Track indicators */}
                            <div className="flex gap-1 justify-center overflow-x-auto p-0.5">
                              {pev.imageUrls.map((thumbUrl, tIdx) => (
                                <button
                                  key={tIdx}
                                  type="button"
                                  onClick={() => setActiveImageIndices(prev => ({ ...prev, [idx]: tIdx }))}
                                  className={`w-9 h-9 rounded bg-white border overflow-hidden p-0.5 transition-all ${currentImgIdx === tIdx ? `${t.border} ring-1 ring-current` : 'border-zinc-800 opacity-60 hover:opacity-100'}`}
                                >
                                  <img src={thumbUrl} alt="Thumbnail preview" className="w-full h-full object-contain mix-blend-multiply" />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CORE SPECS SCHEMATIC */}
                          <div className="flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">{pev.brand}</div>
                              <h4 className="text-white font-black text-sm tracking-wide uppercase leading-tight">{pev.name}</h4>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mt-3 text-[10px] font-mono">
                                <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                                  <span className="text-zinc-600 uppercase">LOCAL PRICE</span>
                                  <span className={`${t.text} font-bold`}>{pev.price}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                                  <span className="text-zinc-600 uppercase">TOP SPEED</span>
                                  <span className="text-white font-bold">{pev.topSpeed}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                                  <span className="text-zinc-600 uppercase">MAX RANGE</span>
                                  <span className="text-white font-bold">{pev.range}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                                  <span className="text-zinc-600 uppercase">BATTERY</span>
                                  <span className="text-zinc-400 font-bold truncate max-w-[80px] text-right">{pev.battery}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                                  <span className="text-zinc-600 uppercase">CURB WEIGHT</span>
                                  <span className="text-white font-bold">{pev.weight}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                                  <span className="text-zinc-600 uppercase">EFFICIENCY</span>
                                  <span className="text-zinc-400 font-bold truncate max-w-[80px] text-right">{pev.efficiency}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-2">
                              <button 
                                type="button"
                                onClick={() => setExpandedPevIdx(isExpanded ? null : idx)}
                                className={`flex-1 inline-flex items-center justify-center gap-1 bg-[#121318] hover:bg-zinc-800 border border-zinc-800 ${t.text} font-black text-[9px] uppercase tracking-widest py-2 px-3 rounded-xl transition-all`}
                              >
                                {isExpanded ? (
                                  <>Collapse Data Sheet <ChevronUp className="w-3 h-3" /></>
                                ) : (
                                  <>Expand Exhaustive Engineering Specification Matrix <ChevronDown className="w-3 h-3" /></>
                                )}
                              </button>
                              
                              <a 
                                href={pev.siteUrl && pev.siteUrl.startsWith('http') ? pev.siteUrl : `https://google.com/search?q=${encodeURIComponent(pev.brand + " " + pev.name + " official deep spec platform product listing")}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-[#121318] hover:bg-zinc-800 text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-[9px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                              >
                                Direct Deep Link Source <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* EXPANDABLE DEEP ENGINE PARAMETERS GRAPH */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-zinc-900/80 bg-black/40 p-4 rounded-xl space-y-3 animate-fadeIn">
                            <h5 className={`text-[10px] ${t.text} font-black tracking-widest uppercase font-mono flex items-center gap-2`}>
                              <Cpu className={`w-3.5 h-3.5 ${t.text}`} /> Grounded Blueprint Payload Matrix
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono">
                              <div className="space-y-1.5">
                                <p className="text-zinc-500 uppercase text-[9px]">Tires / Wheel Profile Configuration:</p>
                                <p className="text-zinc-200 font-bold bg-zinc-900/50 p-2 border border-zinc-800/60 rounded-lg">{pev.tireProfile || "N/A"}</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-zinc-500 uppercase text-[9px]">Braking Assembly Assembly:</p>
                                <p className="text-zinc-200 font-bold bg-zinc-900/50 p-2 border border-zinc-800/60 rounded-lg">{pev.brakingSystem || "N/A"}</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-zinc-500 uppercase text-[9px]">Suspension Shock Architecture:</p>
                                <p className="text-zinc-200 font-bold bg-zinc-900/50 p-2 border border-zinc-800/60 rounded-lg">{pev.suspensionType || "N/A"}</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-zinc-500 uppercase text-[9px]">Chassis Alloys &amp; Framework Material:</p>
                                <p className="text-zinc-200 font-bold bg-zinc-900/50 p-2 border border-zinc-800/60 rounded-lg">{pev.frameMaterial || "N/A"}</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-zinc-500 uppercase text-[9px]">Ingress Water Resistance Threshold:</p>
                                <p className="text-zinc-200 font-bold bg-zinc-900/50 p-2 border border-zinc-800/60 rounded-lg">{pev.waterResistance || "N/A"}</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-zinc-500 uppercase text-[9px]">Structural Load Rating Boundary Limit:</p>
                                <p className="text-zinc-200 font-bold bg-zinc-900/50 p-2 border border-zinc-800/60 rounded-lg">{pev.maxPayload || "N/A"}</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-zinc-500 uppercase text-[9px]">Controller Limit Power Parameters:</p>
                                <p className="text-zinc-200 font-bold bg-zinc-900/50 p-2 border border-zinc-800/60 rounded-lg">{pev.controllerAmperage || "N/A"}</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-zinc-500 uppercase text-[9px]">Physical Dimensions Profile:</p>
                                <p className="text-zinc-200 font-bold bg-zinc-900/50 p-2 border border-zinc-800/60 rounded-lg">{pev.dimensions || "N/A"}</p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}

                  {/* UPGRADED DYNAMIC REVEAL: LINKED "SHOW MORE RESULTS" MATRIX SWITCH */}
                  {livePevResults.length > displayCountSpecs && (
                    <button
                      type="button"
                      onClick={() => setDisplayCountSpecs(prev => prev + 5)}
                      className={`w-full mt-2 bg-[#121318] hover:bg-zinc-800 border border-zinc-800 ${t.text} py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2`}
                    >
                      <Layers className={`w-4 h-4 ${t.text}`} />
                      Reveal More Specifications Index Sheets ({livePevResults.length - displayCountSpecs} Variations Loaded)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE B: LIVE PARTS DATABASE SECTION */}
          {dbSubTab === "parts" && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-zinc-900 p-4 rounded-xl space-y-4">
                
                {/* --- TWO WAY SOURCE SPLITTER --- */}
                <div className="grid grid-cols-1 gap-4 bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${t.text} font-mono flex items-center gap-1`}>
                      <Globe className="w-3.5 h-3.5" /> Option 1: Universal Component Lookup Profile (Any Brand / Model Sweep)
                    </label>
                    <input 
                      type="text"
                      value={universalPartQuery}
                      onChange={(e) => {
                        setUniversalPartQuery(e.target.value);
                        if(e.target.value.trim()) { setPartsMake(""); setPartsModel(""); }
                      }}
                      placeholder="e.g. 20x4.0 fat tire inner tube, hydraulic brake pads, thumb throttle assembly..."
                      className={`w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:${t.border} font-mono transition-colors`}
                    />
                  </div>

                  <div className="flex items-center justify-center py-1">
                    <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase bg-zinc-900 px-3 py-1 border border-zinc-800 rounded-lg">— OR DEFINE PLATFORM SPECIFICS BELOW —</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest font-mono text-zinc-500">Vehicle Make / Brand</label>
                      <input 
                        type="text"
                        disabled={!!universalPartQuery.trim()}
                        value={partsMake}
                        onChange={(e) => setPartsMake(e.target.value)}
                        placeholder="e.g. Aostirmotor, Onewheel..."
                        className={`w-full bg-black border border-zinc-800 disabled:opacity-30 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:${t.border} font-mono`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest font-mono text-zinc-500">Vehicle Model Designation</label>
                      <input 
                        type="text"
                        disabled={!!universalPartQuery.trim()}
                        value={partsModel}
                        onChange={(e) => setPartsModel(e.target.value)}
                        placeholder="e.g. A20, GT, Y600..."
                        className={`w-full bg-black border border-zinc-800 disabled:opacity-30 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:${t.border} font-mono`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest font-mono text-zinc-500">Component Category Target</label>
                      <select
                        disabled={!!universalPartQuery.trim()}
                        value={partsCategory}
                        onChange={(e) => setPartsCategory(e.target.value)}
                        className={`w-full bg-black border border-zinc-800 disabled:opacity-30 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:${t.border} font-mono`}
                      >
                        {["Tires", "Tubes", "Brakes", "Batteries", "Motors", "Controllers", "Accessories", "Aftermarket Upgrades", "Heavy-Duty Mod Kits"].map(cat => (
                          <option key={cat} value={cat} className="bg-black text-white">{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={searchLiveParts}
                  disabled={isSearchingParts || (!universalPartQuery.trim() && !partsCategory.trim())}
                  className={`w-full ${t.bg} hover:opacity-80 disabled:opacity-40 text-black font-black uppercase tracking-widest text-[10px] py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2`}
                >
                  {isSearchingParts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
                  Audit Live Market Inventories (Deep Scan Sourcing)
                </button>
              </div>

              {buildManifest.length > 0 && (
                <div className={`${t.dim} border rounded-xl p-3 flex justify-between items-center font-mono text-xs`}>
                  <div className={`flex items-center gap-2 ${t.text}`}>
                    <FileText className="w-4 h-4" />
                    <span>Active Build Worksheet Manifest: <strong>{buildManifest.length} Components Isolated</strong></span>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={copyManifest} className={`text-zinc-400 ${t.hover} uppercase text-[9px] font-black tracking-widest flex items-center gap-1`}>
                      <Copy className="w-3 h-3"/> Export
                    </button>
                    <button type="button" onClick={clearManifest} className="text-zinc-500 hover:text-rose-400 uppercase text-[9px] font-black tracking-widest flex items-center gap-1">
                      <Trash2 className="w-3 h-3"/> Clear Workspace
                    </button>
                  </div>
                </div>
              )}

              {isSearchingParts && (
                <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
                  <Activity className={`w-10 h-10 ${t.text} animate-pulse`} />
                  <div className={`${t.text} font-mono text-[10px] uppercase tracking-widest animate-pulse`}>{loadingStep}</div>
                </div>
              )}

              {/* RENDER COMPONENT PARTS DISCOVERY MATRIX */}
              {!isSearchingParts && livePartsResults.length === 0 ? (
                hasSearchedParts ? (
                  <div className="text-center py-16 border border-dashed border-rose-900/50 rounded-xl text-rose-500 font-mono text-[10px] uppercase tracking-widest flex flex-col items-center gap-3">
                    <AlertTriangle className="w-8 h-8 opacity-50" />
                    0 Parts Or Third-Party Alternatives Discovered. Try broadening parameter terms.
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-zinc-900 rounded-xl text-zinc-600 font-mono text-[10px] uppercase tracking-widest flex flex-col items-center gap-3">
                    <Wrench className="w-8 h-8 opacity-20" />
                    Initiate real-time regional scans to aggregate live 3rd party components and factory stores.
                  </div>
                )
              ) : !isSearchingParts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {livePartsResults.slice(0, displayCountParts).map((part, index) => (
                    <div key={index} className="bg-black/40 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 transition-all group">
                      <div className="w-full sm:w-24 h-24 bg-white border border-zinc-900 rounded-xl overflow-hidden flex items-center justify-center p-1 shrink-0">
                        <img src={part.imageUrl} alt={part.partName} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between font-mono text-[10px]">
                        <div>
                          <div className="flex flex-wrap gap-1 items-center justify-between">
                            <div className="flex gap-1.5 items-center">
                              <span className={`text-[8px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 ${t.text} font-bold uppercase`}>{part.category}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase font-bold ${
                                part.partType === "OEM Stock" ? "bg-blue-950/40 text-blue-400 border-blue-900/40" : 
                                part.partType === "3rd Party Clone Compatible" ? "bg-amber-950/40 text-amber-400 border-amber-900/40" :
                                "bg-purple-950/40 text-purple-400 border-purple-900/40"
                              }`}>{part.partType}</span>
                            </div>
                            <span className={`${t.text} font-black text-xs`}>{part.estimatedPrice}</span>
                          </div>
                          <h4 className="text-zinc-100 font-black text-xs uppercase tracking-wide mt-1.5 line-clamp-1">{part.partName}</h4>
                          <p className="text-zinc-400 mt-1"><span className="text-zinc-600 font-bold uppercase text-[9px]">Compatibility:</span> {part.compatibility}</p>
                          <p className="text-zinc-400 mt-0.5"><span className="text-zinc-600 font-bold uppercase text-[9px]">Tech Specs:</span> {part.technicalSpecs}</p>
                          <p className="text-zinc-500 mt-0.5 flex justify-between">
                            <span><span className="text-zinc-600 font-bold uppercase text-[9px]">Brand/Maker:</span> {part.recommendedBrands}</span>
                            <span className={`${t.text} opacity-80 font-bold uppercase text-[8px]`}>Platform: {part.sourcePlatform}</span>
                          </p>
                        </div>

                        <div className="mt-3 flex gap-2 flex-wrap sm:flex-nowrap">
                          <a 
                            href={part.partUrl && part.partUrl.startsWith('http') ? part.partUrl : `https://google.com/search?q=${encodeURIComponent(part.partName + " " + userRegion + " buy store")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 ${t.bg} hover:opacity-80 text-black font-black uppercase text-[8.5px] py-1.5 rounded-lg text-center tracking-wider flex items-center justify-center gap-1 shadow-inner`}
                          >
                            Acquire Component <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          
                          <button
                            type="button"
                            onClick={() => addToManifest(part)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg text-[8.5px] uppercase tracking-wider font-bold"
                          >
                            + Add to Worksheet
                          </button>
                        </div>

                        <div className="mt-2 pt-2 border-t border-zinc-900/60 flex justify-between gap-4 text-[7.5px] text-zinc-500 uppercase tracking-widest">
                          <span className="text-zinc-600 font-bold">Region Sourced links ({userRegion}):</span>
                          <div className="flex gap-2">
                            <a href={`https://www.${getRegionalDomainSuffix().amazon}/s?k=${encodeURIComponent(part.partName)}`} target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors flex items-center gap-0.5"><ShoppingCart className="w-2 h-2"/> Amazon</a>
                            <a href={`https://www.${getRegionalDomainSuffix().ebay}/sch/i.html?_nkw=${encodeURIComponent(part.partName)}`} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-0.5"><ShoppingBag className="w-2 h-2"/> eBay</a>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}

                  {/* UPGRADED DYNAMIC REVEAL: LINKED "SHOW MORE RESULTS" MATRIX SWITCH */}
                  {livePartsResults.length > displayCountParts && (
                    <div className="col-span-1 md:col-span-2">
                      <button
                        type="button"
                        onClick={() => setDisplayCountParts(prev => prev + 6)}
                        className={`w-full mt-2 bg-[#121318] hover:bg-zinc-800 border border-zinc-800 ${t.text} py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2`}
                      >
                        <LifeBuoy className={`w-4 h-4 ${t.text}`} />
                        Reveal More Component Sourcing Inventories ({livePartsResults.length - displayCountParts} Line Items Loaded)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {errorMsg && activeTab === "database" && (
            <div className="bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3 flex gap-2 items-start mt-4">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="font-bold">{errorMsg}</p>
            </div>
          )}

        </div>
      )}

      {/* --- EXPANDABLE SWIPER LIGHTBOX MODAL --- */}
      {lightboxState !== null && livePevResults[lightboxState.pevIdx] && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-4 backdrop-blur-md animate-fadeIn select-none"
          onClick={() => setLightboxState(null)}
        >
          {/* Top Panel Bar */}
          <div className="flex justify-between items-center w-full max-w-5xl mx-auto py-2">
            <div className="font-mono">
              <span className="text-zinc-500 text-[10px] uppercase block">{livePevResults[lightboxState.pevIdx].brand}</span>
              <span className="text-white text-sm font-black uppercase tracking-wide">{livePevResults[lightboxState.pevIdx].name}</span>
            </div>
            <button 
              type="button"
              onClick={() => setLightboxState(null)}
              className="text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 font-mono font-bold text-xs uppercase transition-colors"
            >
              Exit View
            </button>
          </div>

          {/* Central Swipe/Click Window Frame */}
          <div className="flex-1 flex justify-between items-center max-w-5xl w-full mx-auto relative gap-4">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleLightboxPrev(); }}
              className={`p-3 rounded-xl bg-zinc-900/80 ${t.hoverBorder} hover:bg-black border border-zinc-800 text-zinc-300 transition-all shadow-xl backdrop-blur-sm shrink-0`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div 
              className="flex-1 max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-white p-4 border border-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={livePevResults[lightboxState.pevIdx].imageUrls[lightboxState.imgIdx]} 
                alt="Expanded full screen preview target"
                className="max-w-full max-h-[65vh] object-contain mix-blend-multiply pointer-events-none"
              />
            </div>

            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleLightboxNext(); }}
              className={`p-3 rounded-xl bg-zinc-900/80 ${t.hoverBorder} hover:bg-black border border-zinc-800 text-zinc-300 transition-all shadow-xl backdrop-blur-sm shrink-0`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Layout Slider Thumbnails Indicators */}
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2 pb-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              Perspective Vector: {lightboxState.imgIdx + 1} / {livePevResults[lightboxState.pevIdx].imageUrls.length}
            </p>
            <div className="flex gap-2 p-1 bg-black/40 border border-zinc-900 rounded-xl max-w-full overflow-x-auto">
              {livePevResults[lightboxState.pevIdx].imageUrls.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxState({ pevIdx: lightboxState.pevIdx, imgIdx: idx })}
                  className={`w-14 h-14 rounded-lg overflow-hidden bg-white p-1 border transition-all ${lightboxState.imgIdx === idx ? `${t.border} ring-2 ring-current` : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img src={imgUrl} alt="Indicator preview" className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}