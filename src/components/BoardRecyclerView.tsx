"use client";

import React, { useState, useEffect, useRef } from "react";
import { PEVType } from "../types";
import { fetchWithRetry } from "../services/CoPilotService";

// --- FIREBASE IMPORTS ---
import { 
  collection, query, orderBy, onSnapshot, doc, updateDoc, increment, 
  serverTimestamp, arrayUnion, deleteDoc, addDoc 
} from "firebase/firestore";
import { db } from "../services/firebase"; 

// --- ICONS & ANIMATIONS ---
import { 
  Zap, MapPin, Image as ImageIcon, MessageCircle, 
  Share2, Award, Flame, Send, Search, UserPlus, Wrench, 
  ImagePlus, X, Loader2, Youtube, Gauge, Thermometer, Trash2, 
  ChevronDown, CheckCircle, Lock, BarChart2, ArrowUpDown, Edit3, Save,
  Shield, AlertTriangle, Sparkles, Flag, PlayCircle, Users, Sliders,
  Paintbrush, Palette, ShieldCheck, Camera, Video, Settings, HelpCircle, 
  User, RefreshCw, Globe, Bookmark, Map, Languages
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["Universal Feed", "Hardware Diagnostics", "Custom Builds", "Trail Reports", "Marketplace"];
const PEV_TYPES = ["Class 1 E-Bike", "Class 2 E-Bike", "Class 3 E-Bike", "Electric Scooter", "Electric Moped", "Electric Unicycle", "Electric Trike", "Onewheel"];

const PEV_TEMPLATES = [
  { id: "none", name: "Standard", style: "border-zinc-800 bg-[#0a0a0f]", icon: null, badgeBg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  { id: "trail", name: "Trail Scout", style: "border-amber-500/40 bg-gradient-to-br from-[#0a0a0f] to-amber-950/20", icon: "🌲 MUD & GRAVEL", badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "speed", name: "Speed Demon", style: "border-red-500/40 bg-gradient-to-br from-[#0a0a0f] to-red-950/20", icon: "⚡ FULL THROTTLE", badgeBg: "bg-red-500/10 text-red-400 border-red-500/20" },
  { id: "garage", name: "The Workshop", style: "border-zinc-500/40 bg-gradient-to-br from-[#0a0a0f] to-zinc-800/30", icon: "🔧 BUILD LOG", badgeBg: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20" },
  { id: "night", name: "Night Rider", style: "border-purple-500/40 bg-gradient-to-br from-[#0a0a0f] to-purple-950/20", icon: "🌙 NIGHT OPS", badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
];

const COLOR_THEMES: Record<string, any> = {
  lime: { id: 'lime', name: 'Neon Protocol', primary: 'bg-[#39ff14]', hover: 'hover:bg-[#32e011]', text: 'text-[#39ff14]', border: 'border-[#39ff14]', glow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', bgSubtle: 'bg-[#39ff14]/10', borderSubtle: 'border-[#39ff14]/30' },
  cyan: { id: 'cyan', name: 'Cyber Cyan', primary: 'bg-cyan-500', hover: 'hover:bg-cyan-400', text: 'text-cyan-400', border: 'border-cyan-500', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]', bgSubtle: 'bg-cyan-950/30', borderSubtle: 'border-cyan-900/50' },
  emerald: { id: 'emerald', name: 'Emerald City', primary: 'bg-emerald-500', hover: 'hover:bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', bgSubtle: 'bg-emerald-950/30', borderSubtle: 'border-emerald-900/50' },
  amber: { id: 'amber', name: 'Warning Amber', primary: 'bg-amber-400', hover: 'hover:bg-amber-300', text: 'text-amber-400', border: 'border-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]', bgSubtle: 'bg-amber-950/30', borderSubtle: 'border-amber-900/50' },
  rose: { id: 'rose', name: 'Danger Rose', primary: 'bg-rose-500', hover: 'hover:bg-rose-400', text: 'text-rose-400', border: 'border-rose-500', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]', bgSubtle: 'bg-rose-950/30', borderSubtle: 'border-rose-900/50' },
  green: { id: 'green', name: 'Rural Neon', primary: 'bg-[#39ff14]', hover: 'hover:bg-[#32e011]', text: 'text-[#39ff14]', border: 'border-[#39ff14]', glow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', bgSubtle: 'bg-[#39ff14]/10', borderSubtle: 'border-[#39ff14]/30' },
  orange: { id: 'orange', name: 'Trail Dirt', primary: 'bg-orange-500', hover: 'hover:bg-orange-400', text: 'text-orange-500', border: 'border-orange-500', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]', bgSubtle: 'bg-orange-950/30', borderSubtle: 'border-orange-900/50' },
  blue: { id: 'blue', name: 'Electric Cyan', primary: 'bg-cyan-500', hover: 'hover:bg-cyan-400', text: 'text-cyan-400', border: 'border-cyan-500', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]', bgSubtle: 'bg-cyan-950/30', borderSubtle: 'border-cyan-900/50' },
  purple: { id: 'purple', name: 'Night Ops', primary: 'bg-purple-500', hover: 'hover:bg-purple-400', text: 'text-purple-400', border: 'border-purple-500', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', bgSubtle: 'bg-purple-950/30', borderSubtle: 'border-purple-900/50' },
};

const getYoutubeId = (url: string) => {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

const DISALLOWED_KEYWORDS = ["abuse", "idiot", "jerk", "asshole", "bitch", "crap", "damn", "fuck", "shit", "bastard", "trash", "hate", "kill", "stupid", "moron", "spam", "scam"];
function checkContentSafety(text: string): { safe: boolean; blockedWord?: string } {
  const normalized = text.toLowerCase();
  for (const word of DISALLOWED_KEYWORDS) {
    if (normalized.includes(word)) return { safe: false, blockedWord: word };
  }
  return { safe: true };
}

export default function UnifiedCommunityBoard(props: any) {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [username, setUsername] = useState<string>(() => {
    if (props.callsign) return props.callsign;
    if (typeof window !== 'undefined') return localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name") || "";
    return "";
  });

  useEffect(() => {
    if (props.callsign) {
      setUsername(props.callsign);
    }
  }, [props.callsign]);

  const [isUsernameLocked, setIsUsernameLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return !!localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_callsign_locked") === "true";
    return false;
  });
  
  const [pfpUrl, setPfpUrl] = useState<string>("");
  const [userFleet, setUserFleet] = useState<string>("");
  const [userBio, setUserBio] = useState<string>("");
  
  const [useMetric, setUseMetric] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "garage" | "preferences" | "appearance">("profile");
  
  const t = COLOR_THEMES[props.theme] || COLOR_THEMES[localStorage.getItem("rural_theme") || "lime"] || COLOR_THEMES.lime;

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [postCategory, setPostCategory] = useState("Universal Feed");
  const [pevType, setPevType] = useState("Electric Scooter");
  const [postTemplate, setPostTemplate] = useState("none");
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [isHelpNeeded, setIsHelpNeeded] = useState(false);

  const [feedView, setFeedView] = useState<"universal" | "saved" | "class" | "help">("universal");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "trending">("newest");
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [topSpeed, setTopSpeed] = useState("");
  const [motorTemp, setMotorTemp] = useState("");

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<{id: number, text: string, votes: number}[]>([{ id: 1, text: "", votes: 0 }, { id: 2, text: "", votes: 0 }]);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pfpInputRef = useRef<HTMLInputElement>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiRunningId, setAiRunningId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    if (!props.callsign) {
      setUsername(localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_screen_name") || "");
    }
    setIsUsernameLocked(!!localStorage.getItem("rural_erides_username") || localStorage.getItem("radar_callsign_locked") === "true");
    
    setPfpUrl(localStorage.getItem("rural_erides_pfp") || "");
    setUserFleet(localStorage.getItem("rural_erides_fleet") || "");
    setUserBio(localStorage.getItem("rural_erides_bio") || "");
    setUseMetric(localStorage.getItem("rt_use_metric") === "true");
    setPrivacyMode(localStorage.getItem("rt_privacy_mode") === "true");
    setPostText(localStorage.getItem("rural_post_draft") || "");
    
    const saved = localStorage.getItem("rural_post_bookmarks");
    if (saved) setSavedPosts(JSON.parse(saved));
    
    const flagged = localStorage.getItem("rural_post_flags");
    if (flagged) setFlaggedIds(JSON.parse(flagged));

    const q = query(collection(db, "board_posts"), orderBy("timestamp_epoch", "desc"));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [props.callsign]);

  useEffect(() => {
    if (mounted) localStorage.setItem("rural_post_draft", postText);
  }, [postText, mounted]);

  const handleMediaPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(null); setVideoPreview(null);
      setMediaFile(e.target.files[0]);
      setMediaPreview(URL.createObjectURL(e.target.files[0]));
      setIsComposerOpen(true);
    }
  };

  const handleCameraSnap = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(null); setVideoPreview(null);
      setMediaFile(e.target.files[0]);
      setMediaPreview(URL.createObjectURL(e.target.files[0]));
      setIsComposerOpen(true);
    }
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(null); setMediaPreview(null);
      setVideoFile(e.target.files[0]);
      setVideoPreview(URL.createObjectURL(e.target.files[0]));
      setIsComposerOpen(true);
    }
  };

  const handlePfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("image", file);
      const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY as string;
      try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          setPfpUrl(data.data.url);
          localStorage.setItem("rural_erides_pfp", data.data.url);
        }
      } catch (err) {
        alert("Avatar gateway communication fault.");
      }
    }
  };

  const toggleBookmark = (postId: string) => {
    setSavedPosts(prev => {
      const isSaved = prev.includes(postId);
      const newSaved = isSaved ? prev.filter(id => id !== postId) : [...prev, postId];
      localStorage.setItem("rural_post_bookmarks", JSON.stringify(newSaved));
      return newSaved;
    });
  };

  const handleFlagPost = (postId: string) => {
    setFlaggedIds(prev => {
      const newFlags = [...prev, postId];
      localStorage.setItem("rural_post_flags", JSON.stringify(newFlags));
      return newFlags;
    });
  };

  const enhanceWithAI = () => {
    if (!postText.trim()) return;
    setIsEnhancing(true);
    setTimeout(() => {
      setPostText(prev => prev.trim() + "\n\n⚡ Ride safe and keep carving! What is everyone else riding today?");
      setIsEnhancing(false);
    }, 1000);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !postText.trim()) return;

    const nameSafety = checkContentSafety(username);
    if (!nameSafety.safe) return setSafetyWarning("Rider Callsign contains an inappropriate term.");
    const messageSafety = checkContentSafety(postText);
    if (!messageSafety.safe) return setSafetyWarning(`Your transmission contains a restricted term ("${messageSafety.blockedWord}").`);
    
    setSafetyWarning(null);
    setIsPublishing(true);
    
    try {
      let imageUrl = null;
      let finalVideoUrl = null;
      let ytbId = youtubeUrl ? getYoutubeId(youtubeUrl) : null;

      if (mediaFile) {
        const formData = new FormData();
        formData.append("image", mediaFile);
        const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY as string; 
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) imageUrl = data.data.url; 
        else throw new Error("Image server rejected the file.");
      }

      if (videoFile) {
        finalVideoUrl = videoPreview;
      }

      let pollData = null;
      if (showPollBuilder && pollQuestion.trim()) {
        const validOptions = pollOptions.filter(o => o.text.trim());
        if (validOptions.length >= 2) pollData = { question: pollQuestion.trim(), options: validOptions, votedUsers: [] };
      }

      await addDoc(collection(db, "board_posts"), {
        username: username.trim(),
        pfpUrl: pfpUrl || null,
        fleetSignature: userFleet || null,
        content: postText.trim(),
        category: postCategory,
        pevType: pevType,
        template: postTemplate,
        imageUrl: imageUrl,
        videoUrl: finalVideoUrl,
        isHelpNeeded: isHelpNeeded,
        youtubeId: ytbId,
        poll: pollData,
        telemetry: privacyMode ? null : { speed: topSpeed ? `${topSpeed} ${useMetric ? 'km/h' : 'mph'}` : null, temp: motorTemp ? `${motorTemp} °C` : null },
        volts: 0,
        comments: [],
        timestamp: new Date().toLocaleString(),
        timestamp_epoch: serverTimestamp(),
        isEdited: false
      });

      if (!isUsernameLocked) {
        localStorage.setItem("rural_erides_username", username.trim());
        localStorage.setItem("radar_screen_name", username.trim());
        localStorage.setItem("copilot_pilot_name", username.trim());
        localStorage.setItem("radar_callsign_locked", "true");
        setIsUsernameLocked(true);
      }

      setPostText(""); localStorage.removeItem("rural_post_draft");
      setMediaFile(null); setMediaPreview(null);
      setVideoFile(null); setVideoPreview(null); setIsHelpNeeded(false);
      setYoutubeUrl(""); setTopSpeed(""); setMotorTemp(""); 
      setShowAdvanced(false); setShowPollBuilder(false); setShowCustomizer(false);
      setPostTemplate("none"); setIsComposerOpen(false);
      setPollQuestion(""); setPollOptions([{ id: 1, text: "", votes: 0 }, { id: 2, text: "", votes: 0 }]);
    } catch (error: any) {
      setSafetyWarning("Broadcast failed: " + error.message);
    } finally { 
      setIsPublishing(false); 
    }
  };

  const handleTriggerAISolver = async (postId: string) => {
    setAiRunningId(postId);
    try {
      const res = await fetchWithRetry("/api/forum/ai-troubleshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        const data = await res.json();
        await updateDoc(doc(db, "board_posts", postId), {
          comments: arrayUnion({
            id: Date.now().toString(),
            author: "AI CO-PILOT",
            text: data.reply.message,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            isAI: true
          })
        });
      }
    } catch (err) {
      alert("AI Co-Pilot is currently offline.");
    } finally {
      setAiRunningId(null);
    }
  };

  const handleVolt = async (postId: string) => updateDoc(doc(db, "board_posts", postId), { volts: increment(1) });
  const handleDeletePost = async (postId: string) => { if (window.confirm("Delete broadcast?")) await deleteDoc(doc(db, "board_posts", postId)); };

  const displayedPosts = posts.filter(post => {
    if (flaggedIds.includes(post.id)) return false;
    if (feedView === "saved") return savedPosts.includes(post.id);
    if (feedView === "help") return post.isHelpNeeded || post.category === "Hardware Diagnostics";
    if (feedView === "class" && pevType) return post.pevType === pevType;

    const safeContent = post.content ? String(post.content).toLowerCase() : "";
    const safeUser = post.username ? String(post.username).toLowerCase() : "";
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = safeContent.includes(query) || safeUser.includes(query);
    return matchesSearch && (feedView === "universal" || post.category === feedView);
  }).sort((a, b) => {
    if (sortBy === "trending") return (b.volts || 0) - (a.volts || 0);
    return 0; 
  });

  const activeThemeConfig = PEV_TEMPLATES.find(temp => temp.id === postTemplate) || PEV_TEMPLATES[0];

  if (!mounted) {
    return <div className="h-screen w-full bg-[#030303] flex items-center justify-center text-zinc-500 font-black tracking-widest uppercase text-xs animate-pulse">Initializing Universal Network...</div>;
  }

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-200 font-sans pb-24 selection:bg-white/20">
      
      {/* FLOATING UNIVERSAL GLASS NAVBAR */}
      <div className="sticky top-0 z-50 p-4 pb-2">
        <nav className="w-full bg-[#0a0a0f]/80 backdrop-blur-3xl border border-zinc-800/80 rounded-3xl flex flex-col px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className={`${t.primary} p-2 rounded-xl ${t.glow} relative`}>
                <div className={`absolute inset-0 ${t.primary} blur-sm rounded-xl animate-pulse opacity-50`}></div>
                <Globe className="w-5 h-5 text-black relative z-10" />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-widest text-white drop-shadow-md flex items-center gap-2">Rural Post</h1>
                 <p className={`text-[9px] ${t.text} font-bold uppercase tracking-wider`}>Universal Rider Network</p>
              </div>
            </div>
            
            {/* USER CONTROL PANEL ROUTER */}
            <div 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 bg-black/50 border border-zinc-800 px-3 py-1.5 rounded-xl shadow-inner cursor-pointer hover:border-zinc-700 transition-all group"
            >
              <span className="text-[10px] font-black uppercase text-zinc-100 group-hover:text-white transition-colors hidden sm:block">{username || "Join Network"}</span>
              {pfpUrl ? (
                <img src={pfpUrl} alt="Callsign Avatar" className={`w-6 h-6 rounded-full object-cover border ${t.border} ${t.glow}`} />
              ) : (
                <div className={`w-6 h-6 rounded-full bg-black border ${t.border} flex items-center justify-center font-black ${t.text} text-xs ${t.glow}`}>
                  {username ? username.charAt(0).toUpperCase() : <Settings className="w-3 h-3"/>}
                </div>
              )}
            </div>
          </div>
          
          <div className="relative flex gap-2 max-w-4xl mx-auto w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input type="text" placeholder="Search the universal matrix (riders, fleets, builds)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus:${t.border} shadow-inner transition-colors placeholder:text-zinc-600`} />
            </div>
          </div>
        </nav>
      </div>

      <div className="p-4 space-y-6 max-w-3xl mx-auto mt-2">
        
        {/* UNIVERSAL ALIGNMENT BANNER */}
        <div className={`${t.bgSubtle} border ${t.borderSubtle} rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-xl`}>
          <div className="flex gap-3.5 items-center">
            <Globe className={`w-8 h-8 ${t.text} shrink-0 ${t.glow}`} />
            <div>
              <span className={`text-[10px] font-black ${t.text} uppercase tracking-widest block mb-0.5`}>Global Relay Active</span>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                Connect with riders worldwide. Share your fleet, log trail reports, upload repair footage, and request instant peer diagnostics regardless of region.
              </p>
            </div>
          </div>
        </div>

        {safetyWarning && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-950/45 border border-red-500/30 text-red-200 text-xs rounded-2xl p-4 flex gap-3 items-start shadow-xl">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1"><span className="font-black text-red-400 block mb-0.5 uppercase tracking-wide">Network Block</span><p className="leading-relaxed font-medium">{safetyWarning}</p></div>
            <button onClick={() => setSafetyWarning(null)} className="text-[10px] text-red-400 hover:underline uppercase font-black shrink-0"><X className="w-4 h-4"/></button>
          </motion.div>
        )}

        {/* EXPANDABLE SMART COMPOSER OVERLAY */}
        <div className={`border rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-500 ${activeThemeConfig.style} ${isHelpNeeded ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : ''}`}>
          {activeThemeConfig.icon && isComposerOpen && (
            <div className="absolute top-0 left-0 w-full bg-black/50 border-b border-white/5 px-4 py-1.5 flex items-center justify-center backdrop-blur-sm z-0">
               <span className="text-[8px] font-black uppercase tracking-widest text-white/80 drop-shadow-md">{activeThemeConfig.icon} - PREVIEW</span>
            </div>
          )}

          <div className={`relative z-10 ${activeThemeConfig.icon && isComposerOpen ? 'pt-10 pb-5 px-5' : 'p-5'}`}>
            {!isComposerOpen ? (
              <div className="flex items-center gap-3 cursor-text" onClick={() => setIsComposerOpen(true)}>
                <div className={`w-10 h-10 rounded-full bg-zinc-900 border ${t.border} flex items-center justify-center font-black ${t.text} shadow-inner overflow-hidden shrink-0`}>
                  {pfpUrl ? <img src={pfpUrl} className="w-full h-full object-cover" /> : (username ? username.charAt(0).toUpperCase() : "+")}
                </div>
                <div className={`flex-1 bg-black/50 border border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold ${postText ? t.text : 'text-zinc-500'} hover:border-zinc-600 transition-colors shadow-inner truncate`}>
                  {postText ? "Draft in progress... Click to resume" : "Broadcast to the Universal Network..."}
                </div>
                <div className="hidden sm:flex gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className={`p-3 bg-black/50 border border-zinc-800 text-zinc-400 ${t.hover} transition-colors shadow-inner rounded-xl`}><Camera className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className={`p-3 bg-black/50 border border-zinc-800 text-zinc-400 ${t.hover} rounded-xl transition-colors shadow-inner`}><ImagePlus className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePublish} className="flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    {isHelpNeeded ? <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse"/> : <Send className={`w-4 h-4 ${t.text}`}/>} 
                    {isHelpNeeded ? "Emergency Hardware Assistance Signal" : "New Transmission Matrix"}
                  </h3>
                  <button type="button" onClick={() => setIsComposerOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-2"><X className="w-4 h-4"/></button>
                </div>

                {/* Identity & Classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5">Rider Callsign</label>
                    {isUsernameLocked ? (
                      <div className={`flex items-center justify-between ${t.bgSubtle} border ${t.borderSubtle} text-xs ${t.text} rounded-xl p-3 font-bold shadow-inner`}>
                        <div className="flex items-center gap-2 truncate"><CheckCircle className="w-4 h-4 shrink-0" /> <span className="text-white ml-1 truncate">{username}</span></div>
                        <Lock className={`w-4 h-4 ${t.text} opacity-50 shrink-0`} />
                      </div>
                    ) : (
                      <input type="text" required placeholder="e.g. Lord Bradley Callison" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full bg-black/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:${t.border} transition-colors backdrop-blur-sm shadow-inner`} />
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5">Vehicle Classification</label>
                    <select value={pevType} onChange={(e) => setPevType(e.target.value)} className={`w-full bg-black/80 border border-zinc-800 rounded-xl px-3 py-3 text-xs font-bold ${t.text} focus:outline-none focus:${t.border} appearance-none outline-none backdrop-blur-sm cursor-pointer shadow-inner`}>
                      {PEV_TYPES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                {/* Content Core */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block">Log Payload</label>
                    <select value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className={`bg-transparent text-[10px] font-black uppercase tracking-widest ${t.text} outline-none cursor-pointer appearance-none text-right`}>
                      {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-black">[{cat}]</option>)}
                    </select>
                  </div>
                  <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder={isHelpNeeded ? "Describe the mechanical failure or error code clearly so passing technicians globally can diagnose..." : "Share your ride, build details, fleet updates, or ask for diagnostic help..."} className={`w-full bg-black/60 border border-zinc-800/80 rounded-xl p-4 pb-12 text-white text-xs font-medium resize-none focus:outline-none focus:${t.border} min-h-[120px] shadow-inner backdrop-blur-md transition-colors`} />
                  
                  {/* AI Enhance Button inside Textarea */}
                  <div className="absolute bottom-3 right-3">
                    <button type="button" onClick={enhanceWithAI} disabled={!postText.trim() || isEnhancing} className={`flex items-center gap-1.5 px-3 py-1.5 ${t.bgSubtle} border ${t.borderSubtle} ${t.hover} ${t.text} text-[9px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50`}>
                      {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                      {isEnhancing ? "Polishing..." : "AI Polish"}
                    </button>
                  </div>
                </div>

                {/* Post Settings Toggle Panel */}
                <div className="flex items-center justify-between p-3 bg-black/40 border border-zinc-800/50 rounded-xl shadow-inner">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-zinc-400" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-white block">Flag as Diagnostic SOS</span>
                      <p className="text-[9px] text-zinc-500 font-medium hidden sm:block">Alert fellow builders for fast technical assistance</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsHelpNeeded(!isHelpNeeded);
                      if(!isHelpNeeded) setPostCategory("Hardware Diagnostics");
                    }} 
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shadow-inner shrink-0 ${isHelpNeeded ? 'bg-red-500 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Media Component Dynamic Custom Previews */}
                {mediaPreview && (
                  <div className="relative w-full h-42 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner">
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover opacity-90" />
                    <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="absolute top-3 right-3 bg-black/80 p-2 rounded-full text-white hover:text-red-400 backdrop-blur-md transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                )}

                {videoPreview && (
                  <div className="relative w-full h-42 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner bg-black">
                    <video src={videoPreview} className="w-full h-full object-contain" controls />
                    <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(null); }} className="absolute top-3 right-3 bg-black/80 p-2 rounded-full text-white hover:text-red-400 backdrop-blur-md z-20 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                )}

                {/* ADVANCED PIPELINE MODULES */}
                <AnimatePresence>
                  {showCustomizer && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-black/60 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl space-y-3 overflow-hidden shadow-inner">
                       <label className={`text-[10px] ${t.text} font-black uppercase tracking-widest block mb-2 flex items-center gap-1.5`}><Palette className="w-4 h-4"/> Custom Layout Themes</label>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {PEV_TEMPLATES.map(temp => (
                            <button key={temp.id} type="button" onClick={() => setPostTemplate(temp.id)} className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${postTemplate === temp.id ? `${t.border} ${t.bgSubtle} ${t.text} ${t.glow}` : 'border-zinc-800 bg-[#0d0e15] text-zinc-500 hover:border-zinc-600 shadow-inner'}`}>
                              {temp.name}
                            </button>
                          ))}
                       </div>
                    </motion.div>
                  )}

                  {showPollBuilder && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-black/60 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl space-y-3 overflow-hidden shadow-inner">
                      <div className={`flex items-center gap-2 ${t.text} font-black uppercase tracking-widest text-[10px]`}><BarChart2 className="w-4 h-4"/> Build Poll</div>
                      <input type="text" placeholder="Question (e.g. Best tire PSI?)" value={pollQuestion} onChange={e=>setPollQuestion(e.target.value)} className={`w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:${t.border} transition-colors shadow-inner`}/>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pollOptions.map((opt, idx) => (
                          <input key={opt.id} type="text" placeholder={`Option ${idx+1}`} value={opt.text} onChange={e=>{
                            const newOpts = [...pollOptions]; newOpts[idx].text = e.target.value; setPollOptions(newOpts);
                          }} className={`w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:${t.border} transition-colors shadow-inner`}/>
                        ))}
                      </div>
                      {pollOptions.length < 4 && <button type="button" onClick={()=>setPollOptions([...pollOptions, {id: Date.now(), text: "", votes: 0}])} className={`text-[10px] ${t.text} hover:opacity-80 font-black uppercase tracking-widest mt-2`}>+ Add Parameter</button>}
                    </motion.div>
                  )}

                  {showAdvanced && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-black/60 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl space-y-4 overflow-hidden shadow-inner">
                      <div>
                        <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-red-500"/> YouTube Link</label>
                        <input type="text" placeholder="Paste Video URL..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-red-500 transition-colors shadow-inner" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5 flex items-center gap-1.5`}><Gauge className={`w-3.5 h-3.5 ${t.text}`}/> Top Speed</label>
                          <div className="relative">
                            <input type="number" placeholder="0.0" value={topSpeed} onChange={(e) => setTopSpeed(e.target.value)} className={`w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:${t.border} pr-10 transition-colors shadow-inner`} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-500">{useMetric ? 'KM/H' : 'MPH'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-amber-400"/> Motor Temp</label>
                          <div className="relative">
                            <input type="number" placeholder="0.0" value={motorTemp} onChange={(e) => setMotorTemp(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500 pr-8 transition-colors shadow-inner" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-500">°C</span>
                          </div>
                        </div>
                      </div>
                      {privacyMode && (
                        <div className="text-[9px] text-amber-500 flex items-center gap-1 font-mono uppercase bg-amber-950/20 p-2 rounded-lg border border-amber-900/50"><AlertTriangle className="w-3 h-3"/> Privacy Mode Active: Telemetry blocked from broadcast.</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* COMPOSER ACTION BAR WITH SCROLLABLE WRAPPER TO FIX BUTTON FIT */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 gap-3">
                  
                  {/* Scrollable container for control buttons so they never overflow */}
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 w-full sm:w-auto">
                    {/* Native Hardware Capture Tunnels */}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleMediaPick} className="hidden" />
                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleCameraSnap} className="hidden" />
                    <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoPick} className="hidden" />
                    
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className={`p-3 shrink-0 bg-black/80 border border-zinc-800 text-zinc-400 ${t.hover} rounded-xl transition-all shadow-inner`} title="Snap Photo via Camera"><Camera className="w-4 h-4" /></button>
                    <button type="button" onClick={() => videoInputRef.current?.click()} className={`p-3 shrink-0 bg-black/80 border border-zinc-800 text-zinc-400 ${t.hover} rounded-xl transition-all shadow-inner`} title="Add Troubleshooting Video"><Video className="w-4 h-4" /></button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 shrink-0 bg-black/80 border border-zinc-800 text-zinc-400 ${t.hover} rounded-xl transition-all shadow-inner`} title="Upload Image File"><ImagePlus className="w-4 h-4" /></button>
                    
                    <button type="button" onClick={() => setShowCustomizer(!showCustomizer)} className={`p-3 shrink-0 rounded-xl transition-all border shadow-inner ${showCustomizer ? `${t.bgSubtle} ${t.text} ${t.borderSubtle}` : `bg-black/80 text-zinc-400 border-zinc-800 ${t.hover}`}`} title="Custom Theme"><Paintbrush className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setShowPollBuilder(!showPollBuilder)} className={`p-3 shrink-0 rounded-xl transition-all border shadow-inner ${showPollBuilder ? `${t.bgSubtle} ${t.text} ${t.borderSubtle}` : `bg-black/80 text-zinc-400 border-zinc-800 ${t.hover}`}`} title="Create Poll"><BarChart2 className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={`flex shrink-0 items-center gap-1.5 p-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border shadow-inner ${showAdvanced ? "bg-zinc-800 text-white border-zinc-600" : "bg-black/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"}`} title="Advanced Telemetry">
                      <Sliders className="w-4 h-4" /> <span className="hidden sm:inline">Modules</span>
                    </button>
                  </div>

                  {/* Broadcast Button */}
                  <button type="submit" disabled={isPublishing || !postText.trim() || !username.trim()} className={`font-black text-xs px-6 py-3 sm:py-3.5 rounded-xl uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shrink-0 w-full sm:w-auto ${isHelpNeeded ? 'bg-red-500 hover:bg-red-400 text-white' : `${t.primary} text-black hover:opacity-90 ${t.glow}`}`}>
                    {isPublishing ? <><Loader2 className="w-4 h-4 animate-spin"/> Syncing</> : <><Send className="w-4 h-4" /> Broadcast</>}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>

        {/* FEED FILTER PILLS */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-2 custom-scrollbar items-center whitespace-nowrap">
          <button onClick={() => {setFeedView("universal"); setSortBy("newest");}} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-md flex items-center gap-1.5 ${feedView === "universal" && sortBy === "newest" ? `${t.primary} text-black ${t.border} ${t.glow}` : "bg-[#0d0e15] text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"}`}>
            <Globe className="w-3.5 h-3.5" /> Universal Feed
          </button>
          <button onClick={() => {setFeedView("class");}} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-md flex items-center gap-1.5 ${feedView === "class" ? `${t.primary} text-black ${t.border} ${t.glow}` : "bg-[#0d0e15] text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"}`}>
            <Zap className="w-3.5 h-3.5" /> My Class
          </button>
          <div className="w-px h-6 bg-zinc-800 mx-1 shrink-0"></div>
          <button onClick={() => {setFeedView("universal"); setSortBy("trending");}} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-md flex items-center gap-1.5 ${sortBy === "trending" ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-[#0d0e15] text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-amber-500"}`}>
            <Flame className="w-3.5 h-3.5" /> Trending
          </button>
          <button onClick={() => {setFeedView("saved"); setSortBy("newest");}} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-md flex items-center gap-1.5 ${feedView === "saved" ? `${t.bgSubtle} ${t.text} ${t.borderSubtle}` : "bg-[#0d0e15] text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"}`}>
            <Bookmark className="w-3.5 h-3.5" /> Saved Vault
          </button>
          <button onClick={() => {setFeedView("help"); setSortBy("newest");}} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-md flex items-center gap-1.5 ${feedView === "help" ? "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-[#0d0e15] text-red-400 border-zinc-800 hover:border-red-500/30"}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> SOS Board
          </button>
        </div>

        {/* THE FEED */}
        <div className="space-y-6 pt-2">
          <AnimatePresence>
            {displayedPosts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0d0e15] border border-zinc-900 rounded-3xl p-16 text-center shadow-2xl relative overflow-hidden">
                <div className={`absolute inset-0 ${t.primary} opacity-5 blur-3xl rounded-full`}></div>
                <div className="relative z-10">
                  <Search className="w-12 h-12 text-zinc-800 mx-auto mb-4 drop-shadow-md" />
                  <h3 className="text-zinc-400 font-black uppercase tracking-widest text-sm mb-2">No Transmissions Found</h3>
                  <p className="text-xs text-zinc-600 font-medium">Try adjusting your filters or be the first to broadcast.</p>
                </div>
              </motion.div>
            ) : (
              displayedPosts.map((post) => (
                <FeedPost 
                  key={post.id} 
                  post={post} 
                  currentUser={username} 
                  onVolt={() => handleVolt(post.id)} 
                  onDelete={() => handleDeletePost(post.id)}
                  onAiTrigger={() => handleTriggerAISolver(post.id)}
                  aiRunning={aiRunningId === post.id}
                  themeColors={t}
                  isSaved={savedPosts.includes(post.id)}
                  onToggleSave={() => toggleBookmark(post.id)}
                  onFlag={() => { if (window.confirm("Report this post for inappropriate content?")) handleFlagPost(post.id); }}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RURAL POST MODULAR SETTINGS DRAWER */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0a0a0f] border border-zinc-800 w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2"><Sliders className={`w-4 h-4 ${t.text}`}/> Network Control Center</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
              </div>
              
              <div className="flex border-b border-zinc-800/50 bg-black/40 overflow-x-auto custom-scrollbar">
                <button onClick={() => setSettingsTab("profile")} className={`flex-1 py-3.5 text-[9px] font-black uppercase tracking-widest transition-colors whitespace-nowrap px-4 ${settingsTab === "profile" ? `${t.text} border-b-2 ${t.border} bg-zinc-900/30` : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20"}`}>Identity</button>
                <button onClick={() => setSettingsTab("garage")} className={`flex-1 py-3.5 text-[9px] font-black uppercase tracking-widest transition-colors whitespace-nowrap px-4 ${settingsTab === "garage" ? `${t.text} border-b-2 ${t.border} bg-zinc-900/30` : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20"}`}>Garage Fleet</button>
                <button onClick={() => setSettingsTab("preferences")} className={`flex-1 py-3.5 text-[9px] font-black uppercase tracking-widest transition-colors whitespace-nowrap px-4 ${settingsTab === "preferences" ? `${t.text} border-b-2 ${t.border} bg-zinc-900/30` : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20"}`}>Universal Prefs</button>
              </div>

              <div className="p-6 h-[60vh] sm:h-auto overflow-y-auto custom-scrollbar">
                
                {settingsTab === "profile" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-4 bg-black/40 border border-zinc-800/60 p-4 rounded-2xl">
                      <div className="relative group cursor-pointer shrink-0" onClick={() => pfpInputRef.current?.click()}>
                        <div className={`w-16 h-16 rounded-full bg-zinc-900 border-2 ${t.border} flex items-center justify-center font-black text-2xl ${t.text} overflow-hidden shadow-lg`}>
                          {pfpUrl ? <img src={pfpUrl} className="w-full h-full object-cover" /> : (username ? username.charAt(0).toUpperCase() : <User />)}
                        </div>
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                        <input type="file" accept="image/*" ref={pfpInputRef} onChange={handlePfpUpload} className="hidden" />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase text-white tracking-wide">Sync Profile Image</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Upload a custom identifier banner to display on all Global Matrix posts.</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Callsign Config</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={username} 
                          disabled={true} 
                          className={`flex-1 bg-black/50 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 text-xs font-bold transition-colors shadow-inner w-full cursor-not-allowed`} 
                        />
                      </div>
                      <p className="text-[9px] text-red-500 mt-2 font-mono uppercase font-black"><Lock className="w-3 h-3 inline mr-1"/> Managed by Master App Settings</p>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Rider Biography</label>
                      <textarea 
                        value={userBio} 
                        onChange={(e) => setUserBio(e.target.value)}
                        placeholder="Tell the network you like your trails dirty and your e-trike fast..." 
                        className={`w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:${t.border} resize-none transition-colors shadow-inner`}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {settingsTab === "garage" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-black/40 border border-zinc-800/60 p-5 rounded-2xl shadow-inner">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${t.bgSubtle} ${t.text}`}><Wrench className="w-5 h-5" /></div>
                        <div>
                          <span className="text-xs font-black uppercase text-white tracking-wide">Virtual Fleet Registry</span>
                          <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest">Attach your garage list to your profile</p>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={userFleet} 
                        onChange={(e) => setUserFleet(e.target.value)}
                        placeholder="e.g. Aostirmotor A20, Geemax, Engwe Y600..." 
                        className={`w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:${t.border} transition-colors shadow-inner`}
                      />
                      <p className="text-[10px] text-zinc-500 font-mono mt-3 leading-relaxed">
                        This fleet signature will be publicly displayed on your Rural Post broadcasts so riders globally know what hardware you run.
                      </p>
                    </div>
                  </div>
                )}

                {settingsTab === "preferences" && (
                  <div className="space-y-4 animate-fade-in">
                    
                    <div className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-3 pr-2">
                        <Languages className="w-5 h-5 text-zinc-400 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase text-zinc-200 block">Universal Language Region</span>
                          <p className="text-[9px] text-zinc-500">Auto-translate network matrix (Mock UI)</p>
                        </div>
                      </div>
                      <select className="bg-zinc-900 border border-zinc-800 text-white text-[10px] font-bold rounded-lg px-2 py-1 outline-none shrink-0">
                        <option>English (US)</option>
                        <option>Español</option>
                        <option>Français</option>
                        <option>Deutsch</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-3 pr-2">
                        <Gauge className="w-5 h-5 text-zinc-400 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase text-zinc-200 block">Global Metric System</span>
                          <p className="text-[9px] text-zinc-500">Toggle KM/H and Celsius displays</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setUseMetric(!useMetric)} 
                        className={`w-10 h-6 shrink-0 rounded-full p-1 transition-colors duration-200 focus:outline-none ${useMetric ? `${t.primary} flex justify-end` : 'bg-zinc-800 flex justify-start'}`}
                      >
                        <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-3 pr-2">
                        <Shield className="w-5 h-5 text-zinc-400 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase text-zinc-200 block">Telemetry Privacy Mode</span>
                          <p className="text-[9px] text-zinc-500">Hide speed/temp data from public broadcasts</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setPrivacyMode(!privacyMode)} 
                        className={`w-10 h-6 shrink-0 rounded-full p-1 transition-colors duration-200 focus:outline-none ${privacyMode ? 'bg-amber-500 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}
                      >
                        <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>

                  </div>
                )}

              </div>

              <div className="p-6 border-t border-zinc-800/80 bg-black/20 flex justify-end">
                <button 
                  onClick={() => {
                    localStorage.setItem("rural_erides_fleet", userFleet);
                    localStorage.setItem("rural_erides_bio", userBio);
                    localStorage.setItem("rt_use_metric", useMetric ? "true" : "false");
                    localStorage.setItem("rt_privacy_mode", privacyMode ? "true" : "false");
                    setIsSettingsOpen(false);
                  }}
                  className={`${t.primary} text-black font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto`}
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- ISOLATED FEED POST MATRIX COMPONENT ---
function FeedPost({ post, currentUser, onVolt, onDelete, onAiTrigger, aiRunning, themeColors }: any) {
  const isDiagnostics = post.category === "Hardware Diagnostics";
  const isOwnPost = currentUser.toLowerCase() === (post.username || "").toLowerCase();
  const themeConfig = PEV_TEMPLATES.find(t => t.id === post.template) || PEV_TEMPLATES[0];
  const t = themeColors;
  
  const isFounder = (post.username || "").toUpperCase() === "RURALERIDE" || (post.username || "").toUpperCase() === "BRADLEY CALLISON" || (post.username || "").toUpperCase() === "LORD BRADLEY CALLISON" || (post.username || "").toUpperCase() === "RURALERIDES26";
  let badgeText = "Verified Rider";
  let badgeStyle = themeConfig.badgeBg;
  if (isFounder) {
    badgeText = "Network Founder"; badgeStyle = `text-black ${t.border} ${t.primary} ${t.glow}`;
  } else if (post.isHelpNeeded) {
    badgeText = "SOS Technical Help Request"; badgeStyle = "text-white border-red-500 bg-red-600 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]";
  } else if (post.volts >= 20) {
    badgeText = "Master Builder"; badgeStyle = "text-black border-amber-400 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]";
  } else if (post.volts >= 5) {
    badgeText = "Trail Scout"; badgeStyle = "text-black border-emerald-400 bg-emerald-400";
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");

  const wordCount = post.content ? String(post.content).split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    const commentSafety = checkContentSafety(commentText);
    if (!commentSafety.safe) return alert("Reply violates safety guidelines.");

    await updateDoc(doc(db, "board_posts", post.id), {
      comments: arrayUnion({ 
        id: Date.now().toString(), 
        author: currentUser || "Guest", 
        text: commentText.trim(), 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        isAI: false
      })
    });
    setCommentText("");
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await updateDoc(doc(db, "board_posts", post.id), { content: editContent.trim(), isEdited: true });
    setIsEditing(false);
  };

  const handleVotePoll = async (optionId: number) => {
    if (!post.poll || post.poll.votedUsers?.includes(currentUser)) return;
    const updatedOptions = post.poll.options?.map((opt: any) => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt) || [];
    const updatedVotedUsers = [...(post.poll.votedUsers || []), currentUser];
    await updateDoc(doc(db, "board_posts", post.id), { poll: { ...post.poll, options: updatedOptions, votedUsers: updatedVotedUsers } });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `Rural Post: ${post.username}`, text: post.content, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`Check out this post on Rural Post: ${String(post.content || "").substring(0, 30)}...`);
      triggerToast("Link Copied to Clipboard");
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return String(text).split("\n").map((line, idx) => {
      if (line.startsWith("### ")) return <h4 key={idx} className="text-[10px] font-black text-amber-400 mt-3 mb-1.5 tracking-widest font-mono uppercase">{line.replace("### ", "")}</h4>;
      if (line.startsWith("## ")) return <h3 key={idx} className={`text-xs font-black ${t.text} mt-3 mb-1.5 tracking-widest font-mono uppercase`}>{line.replace("## ", "")}</h3>;
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const cleanLine = line.trim().replace(/^[*+-]\s+/, "");
        return <li key={idx} className="text-xs text-zinc-300 leading-relaxed list-disc ml-4 mb-1 font-sans">{cleanLine}</li>;
      }
      const parts = line.split(/(@\w+)/g);
      return (
        <p key={idx} className="text-[13px] text-zinc-300 leading-relaxed font-sans mb-1.5 font-medium break-words">
          {parts.map((part, i) => 
            part.startsWith('@') ? <span key={i} className={`${t.text} font-bold ${t.bgSubtle} px-1 py-0.5 rounded`}>{part}</span> : part
          )}
        </p>
      );
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`border rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-500 ${themeConfig.style} ${post.isHelpNeeded ? 'border-red-500/40 bg-gradient-to-br from-[#0a0a0f] to-red-950/10' : ''}`}>
      
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`absolute top-4 right-4 z-50 ${t.primary} text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2`}>
            <CheckCircle className="w-3.5 h-3.5" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {themeConfig.icon && (
        <div className="absolute top-0 left-0 w-full bg-black/50 border-b border-white/5 px-4 py-2 flex items-center justify-center backdrop-blur-sm z-0">
           <span className="text-[9px] font-black uppercase tracking-widest text-white/80 drop-shadow-md">{themeConfig.icon}</span>
        </div>
      )}

      <div className={`p-5 sm:p-6 relative z-10 ${themeConfig.icon ? 'pt-12' : ''}`}>
        <div className="flex justify-between items-start mb-5">
          <div className="flex gap-3 sm:gap-4 w-full">
            
            <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center font-black text-xl shadow-inner overflow-hidden ${isFounder ? `${t.primary} text-black ${t.glow} border-2 ${t.border}` : "bg-zinc-800 text-white border-2 border-zinc-700"}`}>
              {post.pfpUrl ? (
                <img src={post.pfpUrl} alt={`${post.username} Avatar`} className="w-full h-full object-cover" />
              ) : (
                post.username?.charAt(0).toUpperCase() || "R"
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-sm font-black text-white truncate">{post.username || "Rider"}</h4>
                <span className={`px-2 py-0.5 border rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${badgeStyle} shrink-0`}>
                  <Award className="w-3 h-3" /> {badgeText}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono mt-1">
                <span>{post.timestamp || "Just now"}</span>
                <span className="text-zinc-700 hidden sm:inline">•</span>
                <span className={`px-2 py-0.5 rounded-md shrink-0 ${isDiagnostics || post.isHelpNeeded ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-zinc-800/80 text-zinc-300 border border-zinc-700"}`}>{post.category}</span>
                <span className="text-zinc-700 hidden sm:inline">•</span>
                <span className={`${t.text} shrink-0`}>{post.pevType}</span>
                {post.isEdited && <span className="text-zinc-600 shrink-0">(EDITED)</span>}
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-2">
            {isOwnPost && <button onClick={() => setIsEditing(!isEditing)} className={`text-zinc-500 ${t.hover} p-2 bg-black/50 rounded-xl border border-zinc-800/50 backdrop-blur-sm transition-colors shadow-inner`}><Edit3 className="w-3.5 h-3.5" /></button>}
            {isOwnPost && <button onClick={onDelete} className="text-zinc-500 hover:text-red-500 p-2 bg-black/50 rounded-xl border border-zinc-800/50 backdrop-blur-sm transition-colors shadow-inner"><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        </div>

        {isEditing ? (
          <div className="mb-5 bg-black/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-2 shadow-inner">
             <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-transparent p-4 text-xs font-bold text-white focus:outline-none resize-none" rows={4} />
             <div className="flex justify-end gap-3 p-3 border-t border-zinc-900/80">
               <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Cancel</button>
               <button onClick={handleSaveEdit} className={`px-5 py-2.5 ${t.primary} text-black text-[10px] font-black uppercase tracking-widest rounded-xl ${t.glow} transition-colors hover:opacity-90 flex items-center gap-2`}><Save className="w-3.5 h-3.5"/> Update</button>
             </div>
          </div>
        ) : (
          <div className="mb-6 drop-shadow-sm">{renderFormattedText(post.content)}</div>
        )}

        {post.poll && (
          <div className="mb-6 bg-black/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-5 shadow-inner">
             <h4 className={`text-xs font-black ${t.text} mb-4 flex items-center gap-2 uppercase tracking-widest`}><BarChart2 className="w-4 h-4"/> {post.poll.question}</h4>
             <div className="space-y-3">
               {post.poll.options?.map((opt: any) => {
                  const hasVoted = post.poll.votedUsers?.includes(currentUser);
                  const totalVotes = post.poll.options?.reduce((acc: number, o: any) => acc + (o.votes || 0), 0) || 0;
                  const percent = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                  
                  return hasVoted ? (
                    <div key={opt.id} className="relative bg-[#0d0e15] rounded-2xl overflow-hidden border border-zinc-800 p-4 text-xs shadow-inner">
                      <div className={`absolute top-0 left-0 h-full ${t.bgSubtle} transition-all duration-1000 border-r ${t.borderSubtle}`} style={{ width: `${percent}%` }}></div>
                      <div className="relative z-10 flex justify-between items-center"><span className="text-white font-bold drop-shadow-md">{opt.text}</span><span className={`font-black ${t.text} font-mono drop-shadow-md`}>{percent}%</span></div>
                    </div>
                  ) : (
                    <button key={opt.id} onClick={() => handleVotePoll(opt.id)} className={`w-full text-left p-4 bg-[#0d0e15] hover:bg-zinc-900 border border-zinc-800 hover:${t.border.replace('border-', 'border-')} rounded-2xl text-xs font-bold text-zinc-300 transition-all shadow-inner group`}>
                      <span className={`group-hover:${t.text.replace('text-', 'text-')} transition-colors`}>{opt.text}</span>
                    </button>
                  );
               })}
             </div>
             <div className="text-[9px] text-zinc-500 mt-4 font-mono font-black uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {post.poll.options?.reduce((acc: number, o: any) => acc + (o.votes || 0), 0) || 0} Total Scans</div>
          </div>
        )}

        {(post.telemetry?.speed || post.telemetry?.temp) && (
          <div className="flex flex-wrap gap-2.5 mb-6">
            {post.telemetry.speed && <div className={`flex items-center gap-1.5 ${t.bgSubtle} border ${t.borderSubtle} px-3.5 py-2 rounded-xl ${t.text} text-[10px] font-black uppercase tracking-widest shadow-inner`}><Gauge className="w-4 h-4" /> {post.telemetry.speed}</div>}
            {post.telemetry.temp && <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-900/50 px-3.5 py-2 rounded-xl text-amber-400 text-[10px] font-black uppercase tracking-widest shadow-inner"><Thermometer className="w-4 h-4" /> {post.telemetry.temp}</div>}
          </div>
        )}

        {post.imageUrl && <div className="w-full rounded-3xl overflow-hidden border border-zinc-800/80 mb-6 shadow-xl"><img src={post.imageUrl} className="w-full h-auto object-cover max-h-[400px]" /></div>}
        
        {post.videoUrl && (
          <div className="w-full rounded-3xl overflow-hidden border border-zinc-800/80 mb-6 bg-black shadow-xl relative aspect-video">
            <video src={post.videoUrl} controls className="w-full h-full object-contain" />
          </div>
        )}
        
        {post.youtubeId && (
          <div className="w-full rounded-3xl overflow-hidden border border-zinc-800/80 mb-6 aspect-video bg-black shadow-xl relative group cursor-pointer hover:border-red-500/50 transition-colors">
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${post.youtubeId}?rel=0`} frameBorder="0" allowFullScreen className="absolute inset-0 z-10"></iframe>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 group-hover:bg-transparent transition-colors"><PlayCircle className="w-16 h-16 text-white drop-shadow-xl opacity-80 group-hover:scale-110 transition-transform" /></div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between pt-5 border-t border-zinc-800/50 gap-4">
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button onClick={onVolt} className={`flex-1 sm:flex-none justify-center items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${post.volts > 0 ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "bg-black/50 backdrop-blur-md border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-900/50"}`}>
              <Flame className="w-4 h-4" /> {post.volts || 0} Volts
            </button>
            <button onClick={() => setIsExpanded(!isExpanded)} className={`flex-1 sm:flex-none justify-center items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${isExpanded ? `${t.bgSubtle} ${t.text} border ${t.borderSubtle}` : `bg-black/50 backdrop-blur-md border border-zinc-800 text-zinc-400 ${t.hover} hover:${t.borderSubtle.replace('border-', 'border-')}`}`}>
              <MessageCircle className="w-4 h-4" /> {post.comments?.length || 0} Threads
            </button>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">~{readTime} Min Read</span>
            <button onClick={handleShare} className={`p-2.5 bg-black/50 backdrop-blur-md border border-zinc-800 text-zinc-400 ${t.hover} hover:${t.borderSubtle.replace('border-', 'border-')} rounded-xl transition-all shadow-sm shrink-0`}><Share2 className="w-4 h-4" /></button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-6 overflow-hidden">
              
              {(isDiagnostics || post.isHelpNeeded) && (
                <button onClick={onAiTrigger} disabled={aiRunning} className="w-full mb-5 bg-amber-950/30 border border-amber-500/30 py-4 rounded-xl text-[10px] font-black text-amber-400 hover:bg-amber-900/40 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-inner">
                  {aiRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Matrix...</> : <><Sparkles className="w-4 h-4" /> Trigger AI Co-Pilot Diagnostics</>}
                </button>
              )}

              <div className="space-y-3.5 mb-5 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {(!post.comments || post.comments.length === 0) ? <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center py-8 bg-black/40 border border-dashed border-zinc-800/80 rounded-3xl shadow-inner">No active threads. Initiate the channel.</p> : (
                  post.comments.map((reply: any) => (
                    <div key={reply.id} className={`p-4 rounded-2xl border shadow-inner ${reply.isAI ? "bg-amber-950/20 border-amber-900/40" : "bg-[#0d0e15]/80 border-zinc-800/80"}`}>
                      <div className="flex justify-between items-center mb-2 font-mono">
                        <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${reply.isAI ? "text-amber-400" : t.text}`}>
                          {reply.isAI && <Sparkles className="w-3 h-3" />} {reply.author}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-bold">{reply.time}</span>
                      </div>
                      {reply.isAI ? <div className="text-zinc-200">{renderFormattedText(reply.text)}</div> : <p className="text-zinc-300 font-sans text-xs leading-relaxed font-medium break-words">{reply.text}</p>}
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-800/50">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Transmit reply to thread..." className={`flex-1 w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none focus:${t.border} shadow-inner transition-colors`} />
                <button onClick={handlePostComment} disabled={!commentText.trim()} className={`${t.primary} shrink-0 disabled:opacity-50 hover:opacity-80 text-black px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${t.glow} flex items-center justify-center`}><Send className="w-4 h-4"/></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}