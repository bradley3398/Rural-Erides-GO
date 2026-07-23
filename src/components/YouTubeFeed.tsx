"use client";

import React, { useState, useEffect, useRef } from "react";
import icon from "../assets/icon.png";
import { 
  RefreshCw, Loader2, Youtube, Play, AlertTriangle, ExternalLink, 
  Film, X, Share2, Users, Video, Calendar, Flame, MessageCircle, Send,
  Eye, ThumbsUp, Bookmark, ArrowUpDown, CheckCircle2, Cpu, Activity,
  Maximize2, Radio, Zap, ShieldCheck, MapPin, Sliders, Palette, Heart, EyeOff, Layout, HelpCircle,
  TrendingUp, SlidersHorizontal, ToggleLeft, ToggleRight, MessageSquareCode, Ruler, Grid, Database, Search, BrainCircuit, Wrench, Map, List, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- NATIVE FIREBASE IMPORTS ---
import { 
  collection, onSnapshot, doc, setDoc, increment, arrayUnion, serverTimestamp 
} from "firebase/firestore";
import { db } from "../services/firebase"; 

// --- SECURE API ROUTING ---
import { getYouTubeApiKey, getGeminiApiKey, getTavilyApiKey } from "../services/CoPilotService";

// 🔥 UNIVERSAL LOGO IDENTITY COLOR THEMES (Aligned with Omnibus) 🔥
const COLOR_THEMES: Record<string, any> = {
  lime: { id: 'lime', name: 'Neon Protocol', primary: 'bg-[#39ff14]', text: 'text-[#39ff14]', border: 'border-[#39ff14]', hover: 'hover:bg-[#32e011]', glow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]', bgSubtle: 'bg-[#39ff14]/10', borderSubtle: 'border-[#39ff14]/30' },
  cyan: { id: 'cyan', name: 'Electric Cyan', primary: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', hover: 'hover:bg-cyan-400', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]', bgSubtle: 'bg-cyan-950/30', borderSubtle: 'border-cyan-900/50' },
  emerald: { id: 'emerald', name: 'Emerald City', primary: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', hover: 'hover:bg-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', bgSubtle: 'bg-emerald-950/30', borderSubtle: 'border-emerald-900/50' },
  amber: { id: 'amber', name: 'Desert Sun', primary: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400', hover: 'hover:bg-amber-300', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]', bgSubtle: 'bg-amber-950/30', borderSubtle: 'border-amber-900/50' },
  rose: { id: 'rose', name: 'Velocity Red', primary: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500', hover: 'hover:bg-rose-400', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]', bgSubtle: 'bg-rose-950/30', borderSubtle: 'border-rose-900/50' },
};

export default function YouTubeFeed(props: any) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [channelData, setChannelData] = useState({ 
    title: "Loading Rural eRides...", 
    desc: "Establishing satellite uplink to Stigler...", 
    avatar: "", 
    subs: "0", 
    views: "0", 
    totalVideos: "0",
    customUrl: ""
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Interface Configuration States
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  
  // Custom Extensions & Persistent Parameters Suite
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [showWatchlistDrawer, setShowWatchlistDrawer] = useState<boolean>(false);
  const [aiPersonality, setAiPersonality] = useState<"companion" | "mechanic" | "systems">("companion");
  const [aiDetailLevel, setAiDetailLevel] = useState<"compact" | "standard" | "deep">("standard");
  const [hideDescriptionBox, setHideDescriptionBox] = useState<boolean>(false);
  const [autoTheaterOnSelect, setAutoTheaterOnSelect] = useState<boolean>(false);
  const [autoLoadAiScan, setAutoLoadAiScan] = useState<boolean>(false);
  const [showRawJsonData, setShowRawJsonData] = useState<boolean>(false);
  
  // 🔥 CONFIGURATIONS 🔥
  const [userFleetConfig, setUserFleetConfig] = useState<string>("Standard PEV Fleet");
  const [userTerrainConfig, setUserTerrainConfig] = useState<string>("Mixed Road & Trails");
  
  const [aiCreativityLevel, setAiCreativityLevel] = useState<number>(0.7);
  const [aiThinkingLevel, setAiThinkingLevel] = useState<"minimal" | "low" | "medium" | "high">("medium");
  const [aiUnitSystem, setAiUnitSystem] = useState<"imperial" | "metric">("imperial");
  const [aiWebGrounding, setAiWebGrounding] = useState<boolean>(true);
  const [aiOutputLength, setAiOutputLength] = useState<"normal" | "extended">("normal");
  const [gridDensity, setGridDensity] = useState<"standard" | "compact">("standard");
  const [hideLowEngagement, setHideLowEngagement] = useState<boolean>(false);
  const [displayDiagnosticHUD, setDisplayDiagnosticHUD] = useState<boolean>(true);
  
  // Interrogate Video Context States
  const [videoQuestion, setVideoQuestion] = useState<string>("");
  const [videoAiChat, setVideoAiChat] = useState<string | null>(null);
  const [videoChatLoading, setVideoChatLoading] = useState<boolean>(false);

  // Community & AI States
  const [engagements, setEngagements] = useState<Record<string, any>>({});
  const [votedVolts, setVotedVolts] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem("yt_voted_volts") || "[]"); } catch (e) { return []; }
    }
    return [];
  });
  const [savedWatchlist, setSavedWatchlist] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const currentUser = props.callsign || (typeof window !== 'undefined' ? localStorage.getItem("radar_screen_name") || "Universal Pilot" : "Universal Pilot");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // ⚠️ EXCLUSIVE CHANNEL CONFIGURATION ⚠️
  const CHANNEL_ID = "UCJloGuR4YwCVIcAh3gjTbTg"; 

  const t = COLOR_THEMES[props.theme] || COLOR_THEMES.lime;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tactical Categorization Engine
  const getCategory = (title: string, desc: string, tags: string) => {
    const textContext = (title + " " + desc + " " + tags).toLowerCase();
    if (textContext.includes("review") || textContext.includes("range test") || textContext.includes("top speed")) return { label: "PEV Review", color: "text-lime-400 bg-lime-950/40 border-lime-900/50" };
    if (textContext.includes("battery") || textContext.includes("build") || textContext.includes("weld") || textContext.includes("repair") || textContext.includes("controller") || textContext.includes("swap")) return { label: "Garage / Build", color: "text-amber-400 bg-amber-950/40 border-amber-900/50" };
    if (textContext.includes("gravel") || textContext.includes("trail") || textContext.includes("offroad") || textContext.includes("creek") || textContext.includes("mud") || textContext.includes("fish")) return { label: "Trail Scout", color: "text-emerald-400 bg-emerald-400/10 border-emerald-900/50" };
    return { label: "General Ride", color: "text-zinc-300 bg-zinc-900 border-zinc-700" };
  };

  const parseDuration = (duration: string) => {
    if (!duration) return "0:00";
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "0:00";
    const h = match[1] ? parseInt(match[1].replace('H', '')) : 0;
    const m = match[2] ? parseInt(match[2].replace('M', '')) : 0;
    const s = match[3] ? parseInt(match[3].replace('S', '')) : 0;
    return `${h > 0 ? h + ':' : ''}${h > 0 ? m.toString().padStart(2, '0') : m}:${s.toString().padStart(2, '0')}`;
  };

  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " YRS AGO";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " MO AGO";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " DAYS AGO";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " HRS AGO";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " MINS AGO";
    return "JUST NOW";
  };

  // 🔥 TAVILY GROUNDED SEARCH HELPER 🔥
  const fetchTavilyWebGrounding = async (searchQueryText: string) => {
    const tavilyKey = getTavilyApiKey();
    if (!tavilyKey) return "";
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${searchQueryText} PEV electric scooter ebike specifications`,
          search_depth: "basic",
          max_results: 4
        })
      });
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return "\n\n--- TAVILY LIVE SEARCH GROUNDING DATA ---\n" + 
          data.results.map((r: any) => `- ${r.title}: ${r.content} (${r.url})`).join("\n") + 
          "\n----------------------------------------\n";
      }
    } catch (e) {
      console.warn("Tavily Grounded Search failed, falling back to pure LLM context.", e);
    }
    return "";
  };

  // 🔥 MASSIVE 50-VIDEO METADATA FETCH ENGINE 🔥
  const fetchLiveVideos = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const ytKey = getYouTubeApiKey();
      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${ytKey}`);
      const statsData = await statsRes.json();
      
      if (statsData.items && statsData.items.length > 0) {
        const ch = statsData.items[0];
        setChannelData({
          title: ch.snippet.title, 
          desc: ch.snippet.description || "Broadcasting authentic PEV adventures, mechanical repairs, and raw outdoor trail scout runs. Pure testing, zero filter.",
          avatar: ch.snippet.thumbnails?.high?.url || icon,
          subs: Number(ch.statistics.subscriberCount).toLocaleString(),
          views: Number(ch.statistics.viewCount).toLocaleString(),
          totalVideos: Number(ch.statistics.videoCount).toLocaleString(),
          customUrl: ch.snippet.customUrl || ""
        });
      }

      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${ytKey}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=50&type=video`);
      const searchData = await searchRes.json();
      
      if (!searchRes.ok) throw new Error("Failed to clear data channel payload arrays.");

      if (searchData.items && searchData.items.length > 0) {
        const videoIds = searchData.items.map((i: any) => i.id.videoId).filter(Boolean).join(',');
        
        if (videoIds) {
          const videoStatsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${ytKey}`);
          const videoStatsData = await videoStatsRes.json();

          const dataMap: any = {};
          videoStatsData.items?.forEach((i: any) => {
            dataMap[i.id] = {
              stats: i.statistics,
              desc: i.snippet.description,
              tags: i.snippet.tags ? i.snippet.tags.join(", ") : "No backend tags detected",
              rawTags: i.snippet.tags || [],
              duration: parseDuration(i.contentDetails?.duration)
            };
          });

          setVideos(searchData.items.map((i: any) => ({
            id: i.id.videoId, 
            url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
            title: i.snippet.title, 
            description: dataMap[i.id.videoId]?.desc || "No comprehensive description logs returned.",
            tags: dataMap[i.id.videoId]?.tags,
            rawTagsArray: dataMap[i.id.videoId]?.rawTags,
            duration: dataMap[i.id.videoId]?.duration,
            thumbnailUrl: i.snippet.thumbnails?.high?.url || i.snippet.thumbnails?.medium?.url || "",
            category: getCategory(i.snippet.title, dataMap[i.id.videoId]?.desc || "", dataMap[i.id.videoId]?.tags),
            publishedAt: i.snippet.publishedAt,
            timeAgo: timeSince(i.snippet.publishedAt),
            views: dataMap[i.id.videoId]?.stats?.viewCount || "0",
            ytLikes: dataMap[i.id.videoId]?.stats?.likeCount || "0"
          })).filter((v: any) => v.id));
        }
      }
    } catch (err: any) { 
      setErrorMsg(`Avionics interface dropped satellite synchronization lock. Detail: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 🔥 SEARCH SATELLITE ENGINE FIX (PREVENTS [object Object] BLACK SCREENS) 🔥 ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsFetching(true);
    setErrorMsg(null);

    try {
      const ytKey = getYouTubeApiKey();
      const url1 = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${encodeURIComponent(searchQuery)}&type=video&key=${ytKey}`;
      const res1 = await fetch(url1);
      const data1 = await res1.json();
      
      let combinedItems = data1.items || [];
      
      if (data1.nextPageToken) {
        const url2 = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&pageToken=${data1.nextPageToken}&q=${encodeURIComponent(searchQuery)}&type=video&key=${ytKey}`;
        const res2 = await fetch(url2);
        const data2 = await res2.json();
        if (data2.items) {
          combinedItems = [...combinedItems, ...data2.items];
        }
      }

      if (combinedItems.length === 0) {
        setErrorMsg("Zero signal returned for that frequency.");
        setResults([]);
      } else {
        const mappedResults = combinedItems.map((i: any) => {
          const validId = typeof i.id === 'object' ? i.id.videoId : i.id;
          return {
            id: validId,
            url: `https://www.youtube.com/watch?v=${validId}`,
            title: i.snippet?.title || "Unknown Signal",
            description: i.snippet?.description || "No description logs provided.",
            tags: "Search Result",
            rawTagsArray: [],
            duration: "VOD",
            thumbnailUrl: i.snippet?.thumbnails?.high?.url || i.snippet?.thumbnails?.medium?.url || "",
            category: getCategory(i.snippet?.title || "", i.snippet?.description || "", ""),
            publishedAt: i.snippet?.publishedAt || new Date().toISOString(),
            timeAgo: timeSince(i.snippet?.publishedAt || new Date().toISOString()),
            views: "0",
            ytLikes: "0"
          };
        }).filter((v: any) => v.id);

        setResults(mappedResults);
      }
    } catch (err) {
      setErrorMsg("Video Sat-Link Offline. Ensure network connection.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    setSortBy((localStorage.getItem("yt_sort") as any) || "newest");
    setAiPersonality((localStorage.getItem("yt_ai_personality") as any) || "companion");
    setAiDetailLevel((localStorage.getItem("yt_ai_detail") as any) || "standard");
    setHideDescriptionBox(localStorage.getItem("yt_hide_desc") === "true");
    setAutoTheaterOnSelect(localStorage.getItem("yt_auto_theater") === "true");
    setAutoLoadAiScan(localStorage.getItem("yt_auto_ai") === "true");
    setShowRawJsonData(localStorage.getItem("yt_show_json") === "true");
    setAiCreativityLevel(Number(localStorage.getItem("yt_ai_temp")) || 0.7);
    setAiThinkingLevel((localStorage.getItem("yt_ai_thinking") as any) || "medium");
    setAiUnitSystem((localStorage.getItem("yt_ai_units") as any) || "imperial");
    setAiWebGrounding(localStorage.getItem("yt_ai_web") !== "false");
    setAiOutputLength((localStorage.getItem("yt_ai_length") as any) || "normal");
    setGridDensity((localStorage.getItem("yt_grid_density") as any) || "standard");
    setHideLowEngagement(localStorage.getItem("yt_hide_low_eng") === "true");
    setDisplayDiagnosticHUD(localStorage.getItem("yt_hud_diag") !== "false");
    
    // Load User Preferences
    setUserFleetConfig(localStorage.getItem("universal_fleet_config") || "Standard PEV Setup");
    setUserTerrainConfig(localStorage.getItem("universal_terrain_config") || "Mixed Terrain & Road");

    fetchLiveVideos();

    const unsubscribe = onSnapshot(collection(db, "youtube_engagements"), (snapshot) => {
      const engData: Record<string, any> = {};
      snapshot.forEach(docDoc => { engData[docDoc.id] = docDoc.data(); });
      setEngagements(engData);
    });

    const unsubWatchlist = onSnapshot(collection(db, "watchlists"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(d => {
        if (d.data().username === currentUser) {
          list.push({ id: d.id, ...d.data() });
        }
      });
      setSavedWatchlist(list);
    });

    return () => {
      unsubscribe();
      unsubWatchlist();
    };
  }, [currentUser]);

  useEffect(() => {
    if (mounted) localStorage.setItem("yt_sort", sortBy);
  }, [sortBy, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("yt_ai_personality", aiPersonality);
      localStorage.setItem("yt_ai_detail", aiDetailLevel);
      localStorage.setItem("yt_hide_desc", hideDescriptionBox ? "true" : "false");
      localStorage.setItem("yt_auto_theater", autoTheaterOnSelect ? "true" : "false");
      localStorage.setItem("yt_auto_ai", autoLoadAiScan ? "true" : "false");
      localStorage.setItem("yt_show_json", showRawJsonData ? "true" : "false");
      localStorage.setItem("yt_ai_temp", aiCreativityLevel.toString());
      localStorage.setItem("yt_ai_thinking", aiThinkingLevel);
      localStorage.setItem("yt_ai_units", aiUnitSystem);
      localStorage.setItem("yt_ai_web", aiWebGrounding ? "true" : "false");
      localStorage.setItem("yt_ai_length", aiOutputLength);
      localStorage.setItem("yt_grid_density", gridDensity);
      localStorage.setItem("yt_hide_low_eng", hideLowEngagement ? "true" : "false");
      localStorage.setItem("yt_hud_diag", displayDiagnosticHUD ? "true" : "false");
      
      localStorage.setItem("universal_fleet_config", userFleetConfig);
      localStorage.setItem("universal_terrain_config", userTerrainConfig);
    }
  }, [aiPersonality, aiDetailLevel, hideDescriptionBox, autoTheaterOnSelect, autoLoadAiScan, showRawJsonData, aiCreativityLevel, aiThinkingLevel, aiUnitSystem, aiWebGrounding, aiOutputLength, gridDensity, hideLowEngagement, displayDiagnosticHUD, userFleetConfig, userTerrainConfig, mounted]);

  useEffect(() => {
    if (activeVideo && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
      if (autoTheaterOnSelect) setTheaterMode(true);
      setVideoAiChat(null);
      setVideoQuestion("");
      if (autoLoadAiScan) {
        handleAIAction();
      }
    }
  }, [activeVideo, autoTheaterOnSelect, autoLoadAiScan]);

  const handleVoltVideo = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (votedVolts.includes(videoId)) {
      showToast("Volt already registered for this payload!");
      return;
    }
    try {
      await setDoc(doc(db, "youtube_engagements", videoId), { volts: increment(1) }, { merge: true });
      const updatedVoted = [...votedVolts, videoId];
      setVotedVolts(updatedVoted);
      localStorage.setItem("yt_voted_volts", JSON.stringify(updatedVoted));
      showToast("1 Volt Injected!");
    } catch (err) {
      showToast("Network error registering Volt.");
    }
  };

  const handleBookmark = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    try {
      await setDoc(doc(db, "watchlists", `${currentUser}_${video.id}`), {
        username: currentUser, videoId: video.id, title: video.title, thumbnail: video.thumbnailUrl, timestamp: serverTimestamp()
      });
      showToast("Added to Saved Watchlist");
    } catch (err) {
      showToast("Error bookmarking video.");
    }
  };

  const handlePostComment = async (videoId: string) => {
    if (!commentText.trim()) return;
    await setDoc(doc(db, "youtube_engagements", videoId), {
      comments: arrayUnion({ 
        id: Date.now().toString(), 
        author: currentUser, 
        text: commentText.trim(), 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      })
    }, { merge: true });
    setCommentText("");
    showToast("Transmission Broadcasted");
  };

  // 🔥 UNIVERSAL AI ANALYSIS ENGINE (OBJECTIVE/ANONYMOUS) 🔥
  const handleAIAction = async () => { 
    if (!activeVideo) return;
    setAiLoading(true);
    setAiStatus(`Syncing neural pathways to Gemini 3.1 Flash-Lite. Scraping authentic metadata arrays for ${activeVideo.id}...`);
    
    try {
      let tavilyGroundingText = "";
      if (aiWebGrounding) {
        setAiStatus(`Executing Tavily web search grounding for: "${activeVideo.title}"...`);
        tavilyGroundingText = await fetchTavilyWebGrounding(activeVideo.title);
      }

      let personalityDirective = "";
      if (aiPersonality === "companion") {
        personalityDirective = `Act as an authentic, gritty, and experienced trail rider companion. Use casual, witty, and grounded language.`;
      } else if (aiPersonality === "mechanic") {
        personalityDirective = "Act as a masterful, highly technical PEV shop customizer and lead mechanic. Speak with direct, clear expertise.";
      } else {
        personalityDirective = "Act as an elite Avionics Systems Officer. Speak with formal, analytical precision.";
      }

      let depthDirective = "";
      if (aiDetailLevel === "compact") {
        depthDirective = "Provide a tight, high-impact single-paragraph factual overview.";
      } else if (aiDetailLevel === "standard") {
        depthDirective = "Provide a comprehensive data-grounded overview paragraph followed by a 3-bullet point tactical technical analysis breakdown.";
      } else {
        depthDirective = "Provide an exhaustive, highly detailed multi-paragraph engineering report extracting and itemizing every single factual detail found in the text data layer below.";
      }

      const promptText = `${personalityDirective}
      
      CRITICAL ANONYMITY & OBJECTIVITY DIRECTIVE: You are an independent AI Co-Pilot analyzing a public third-party video payload. DO NOT state, imply, or assume that the user interacting with you is the creator, author, or host of this video. Treat the host/creator in the video purely as an external third party.
      
      USER CONTEXT MATRIX:
      - Known Operator Fleet: [${userFleetConfig}]
      - Primary Operating Terrain: [${userTerrainConfig}]
      Cross-reference the tags against this fleet context to adapt the explanation.
      
      --- RAW YOUTUBE PAYLOAD BLOCK ---
      - Target Video URL: "${activeVideo.url}"
      - Video Title: "${activeVideo.title}"
      - Video Duration Runtime: ${activeVideo.duration}
      - Hidden Backend Tags (CRITICAL CONTEXT): [${activeVideo.tags}]
      - Performance Statistics: ${activeVideo.views} Views, ${activeVideo.ytLikes} Likes
      - Full Public Description: "${activeVideo.description}"
      ---------------------------------
      ${tavilyGroundingText}

      System Constraints:
      - Format all dimensions and speed/distance metrics utilizing ${aiUnitSystem.toUpperCase()} standards.
      - Thinking parameters configured to: ${aiThinkingLevel.toUpperCase()}. Use step-by-step logic where necessary.
      - ${depthDirective}
      
      Operational Directives:
      Based on the Title, Description, AND the exact Tags, explain what is happening in this video. Isolate real facts, specific parts, or trails documented across the logs. Do not fabricate or invent external script steps. Deliver fully natural human cadence.`;

      const requestBody: any = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { 
          temperature: aiCreativityLevel,
          maxOutputTokens: aiOutputLength === "extended" ? 65536 : 800
        }
      };

      const geminiKey = getGeminiApiKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`;
      const response = await fetch(url, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message || "Google AI Studio rejected the connection.");

      const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (summaryText) {
        setAiStatus(summaryText);
      } else {
        throw new Error("Null Node Output: The AI returned an empty block.");
      }
    } catch (err: any) {
      setAiStatus(`⚠️ AVIONICS UPLINK FAILED\n\nSystem Error: ${err.message}\n\nPlease verify your network connection or API limits.`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleInterrogateVideo = async () => {
    if (!videoQuestion.trim() || !activeVideo) return;
    setVideoChatLoading(true);
    setVideoAiChat("Interrogating video parameters. Cross-referencing query stream with full verified tags and description arrays...");

    try {
      let tavilyText = "";
      if (aiWebGrounding) {
        tavilyText = await fetchTavilyWebGrounding(`${activeVideo.title} ${videoQuestion}`);
      }

      const queryPrompt = `You are a professional, data-grounded PEV Co-Pilot answering technical prompts for a vehicle operator.
      
      CRITICAL ANONYMITY & OBJECTIVITY DIRECTIVE: Treat the creator of the video strictly as an external third party. Do not assume or state that the user is the author/creator of this video.
      
      Authentic Video Dataset Layer:
      - Title: "${activeVideo.title}"
      - Hidden Creator Tags/Keywords: [${activeVideo.tags}]
      - Video Runtime: ${activeVideo.duration}
      - Verified Log Description: "${activeVideo.description}"
      - Preferred Unit Matrix: Format parameters utilizing ${aiUnitSystem.toUpperCase()} standards.
      ${tavilyText}
      
      Operator Inquiry: "${videoQuestion.trim()}"
      
      Formulate a completely direct, professional, and natural human conversational reply addressing the operator's prompt using only the strict facts found within the text blocks provided. Avoid markdown stars or robotic structures. Keep it clean and highly tactical.`;

      const requestBody: any = {
        contents: [{ parts: [{ text: queryPrompt }] }],
        generationConfig: { temperature: aiCreativityLevel }
      };

      const geminiKey = getGeminiApiKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`;
      const response = await fetch(url, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "Google AI Studio rejected the connection.");
      
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textResult) {
        setVideoAiChat(textResult);
      } else {
        throw new Error("Terminal Feedback Blank");
      }
    } catch (err: any) {
      setVideoAiChat(`⚠️ UPLINK FAILED: ${err.message}`);
    } finally {
      setVideoChatLoading(false);
    }
  };

  const exportAiSummary = () => {
    if (!aiStatus || !activeVideo) return;
    const exportText = `RURAL FEED AI TECHNICAL REPORT\nTarget Video: ${activeVideo.title} (${activeVideo.url})\nDate: ${new Date().toLocaleString()}\n\n${aiStatus}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(exportText);
      showToast("Report copied to clipboard!");
    } else {
      const blob = new Blob([exportText], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `PEV_Report_${activeVideo.id}.txt`;
      a.click();
      showToast("Report downloaded!");
    }
  };

  const activePool = (searchQuery.trim() !== "" && results.length > 0) ? results : videos;

  const processed = [...activePool]
    .filter(v => activeFilter === "All" || v.category.label === activeFilter)
    .filter(v => !hideLowEngagement || parseInt(v.views) > 50 || engagements[v.id]?.volts > 0)
    .sort((a, b) => {
      if (sortBy === "popular") return parseInt(b.views) - parseInt(a.views);
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const activeEng = activeVideo ? (engagements[activeVideo.id] || { volts: 0, comments: [] }) : null;

  if (!mounted) return <div className="h-screen bg-black flex items-center justify-center animate-pulse tracking-widest text-xs uppercase text-zinc-500 font-black">Initializing Cinematic Core...</div>;

  return (
    <div className={`space-y-6 pb-24 font-sans text-zinc-100 min-h-screen transition-all duration-500 ${theaterMode ? "bg-black" : "bg-[#06060a]"}`} ref={scrollRef}>
      
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-black border ${t.border} px-5 py-3 rounded-xl flex items-center gap-3 ${t.glow}`}
          >
            <ShieldCheck className={`w-5 h-5 ${t.text}`} />
            <span className={`text-xs font-black ${t.text} uppercase tracking-widest font-mono`}>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navigation Header */}
      <nav className={`sticky top-0 backdrop-blur-xl border-b z-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl transition-colors duration-500 ${theaterMode ? "bg-black/95 border-zinc-900" : "bg-[#0d0e15]/95 border-zinc-800"}`}>
        <div className="flex items-center">
          <div className="relative flex items-center justify-center w-8 h-8 mr-3 shrink-0">
            <Youtube className={`w-6 h-6 ${t.text} absolute z-10`} />
            <div className={`absolute inset-0 ${t.primary} opacity-20 blur-md rounded-full animate-pulse`}></div>
          </div>
          <h1 className="text-sm sm:text-lg font-black uppercase text-white font-mono tracking-widest">
            RURAL FEED <span className={t.text}>LIVE</span>
          </h1>
        </div>
        
        {/* Search & Header Controls Container */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="relative flex items-center min-w-[140px] sm:min-w-[200px]">
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && handleSearch()}
               placeholder="Search metadata arrays..."
               className={`w-full bg-black border border-zinc-700 rounded-xl pl-3 pr-8 py-1.5 sm:py-2 text-[10px] text-white outline-none focus:${t.border} transition-colors font-mono placeholder:text-zinc-400`}
             />
             <button onClick={() => handleSearch()} disabled={isFetching} className={`absolute right-2 ${t.text} hover:text-white`}>
               {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
             </button>
          </div>

          <button 
            onClick={() => setShowWatchlistDrawer(true)}
            className="px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-black border-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1 transition-all shrink-0"
            title="Saved Watchlist"
          >
            <List className="w-3.5 h-3.5 text-amber-400" /> Watchlist ({savedWatchlist.length})
          </button>

          <button 
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-all shrink-0 ${showSettingsPanel ? `${t.primary} text-black border-transparent ${t.glow}` : "bg-black border-zinc-700 text-zinc-300 hover:text-white"}`}
          >
            <Sliders className="w-3.5 h-3.5" /> Config
          </button>
          <button onClick={fetchLiveVideos} disabled={loading || activeVideo !== null} className="p-2 bg-black hover:bg-zinc-800 border border-zinc-700 rounded-xl disabled:opacity-50 transition-colors shadow-inner group shrink-0">
            <RefreshCw className={`w-4 h-4 text-zinc-300 group-hover:text-white ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </nav>

      {/* WATCHLIST DRAWER MODAL */}
      <AnimatePresence>
        {showWatchlistDrawer && (
          <div className="fixed inset-0 z-[150] flex justify-end bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="w-full max-w-md bg-[#0d0e15] border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-400" /> Saved Watchlist
                  </h3>
                  <button onClick={() => setShowWatchlistDrawer(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar pr-1">
                  {savedWatchlist.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-mono text-center py-10 uppercase font-bold">No saved videos in vault.</p>
                  ) : (
                    savedWatchlist.map(item => (
                      <div key={item.id} className="bg-black border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                        <img src={item.thumbnail} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          <span className="text-[9px] text-zinc-400 font-mono">ID: {item.videoId}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={() => setShowWatchlistDrawer(false)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-colors">Close Vault</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`p-4 space-y-6 mx-auto transition-all duration-500 ${theaterMode ? "max-w-[1600px]" : "max-w-7xl"}`}>
        
        {/* --- EXPANDED CONFIG PANEL --- */}
        <AnimatePresence>
          {showSettingsPanel && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#0d0e15] border border-zinc-800 p-5 rounded-3xl shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${t.text} flex items-center gap-1.5`}><Database className="w-4 h-4"/> Feed Parameter Calibration Matrix</span>
                <button onClick={() => setShowSettingsPanel(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4"/></button>
              </div>
              
              {/* FLEET & TERRAIN CONFIGURATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zinc-800/80 pb-5">
                <div className="bg-black/40 p-4 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[9px] text-zinc-300 font-black uppercase tracking-widest flex items-center gap-2"><Wrench className="w-3.5 h-3.5"/> Operator Fleet Config</span>
                  <input type="text" value={userFleetConfig} onChange={(e) => setUserFleetConfig(e.target.value)} placeholder="e.g. Aostirmotor A20..." className={`w-full bg-[#121318] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:${t.border}`}/>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[9px] text-zinc-300 font-black uppercase tracking-widest flex items-center gap-2"><Map className="w-3.5 h-3.5"/> Local Terrain Matrix</span>
                  <input type="text" value={userTerrainConfig} onChange={(e) => setUserTerrainConfig(e.target.value)} placeholder="e.g. Stigler, OK Urban & Trail..." className={`w-full bg-[#121318] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:${t.border}`}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* AI Assistant Personality Customizer */}
                <div className="bg-black/40 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[9px] text-zinc-300 font-black uppercase tracking-widest block mb-1.5">AI Telemetry Model Tuning</span>
                    <div className="flex flex-wrap bg-[#121318] p-1 rounded-lg border border-zinc-700 gap-1">
                      <button onClick={() => setAiPersonality("companion")} className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all ${aiPersonality === "companion" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Companion</button>
                      <button onClick={() => setAiPersonality("mechanic")} className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all ${aiPersonality === "mechanic" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Mechanic</button>
                      <button onClick={() => setAiPersonality("systems")} className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all ${aiPersonality === "systems" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Avionics</button>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest block mb-1">AI Output Depth Focus</span>
                    <div className="flex bg-[#121318] p-1 rounded-lg border border-zinc-700 gap-1 mb-2">
                      <button type="button" onClick={() => setAiDetailLevel("compact")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all ${aiDetailLevel === "compact" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Compact</button>
                      <button type="button" onClick={() => setAiDetailLevel("standard")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all ${aiDetailLevel === "standard" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Standard</button>
                      <button type="button" onClick={() => setAiDetailLevel("deep")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all ${aiDetailLevel === "deep" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Deep Dive</button>
                    </div>
                    
                    <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest block mb-1">3.1 Flash-Lite Thinking Level</span>
                    <div className="flex bg-[#121318] p-1 rounded-lg border border-zinc-700 gap-1">
                      <button type="button" onClick={() => setAiThinkingLevel("minimal")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all ${aiThinkingLevel === "minimal" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Min</button>
                      <button type="button" onClick={() => setAiThinkingLevel("low")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all ${aiThinkingLevel === "low" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Low</button>
                      <button type="button" onClick={() => setAiThinkingLevel("medium")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all ${aiThinkingLevel === "medium" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>Med</button>
                      <button type="button" onClick={() => setAiThinkingLevel("high")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all ${aiThinkingLevel === "high" ? `${t.primary} text-black` : "text-zinc-400 hover:text-white"}`}>High</button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Cognitive Creativity Tone</span>
                      <span className="text-[8px] font-mono text-zinc-300 font-bold">{aiCreativityLevel.toFixed(1)}</span>
                    </div>
                    <input type="range" min="0.2" max="1.2" step="0.1" value={aiCreativityLevel} onChange={e => setAiCreativityLevel(parseFloat(e.target.value))} className="w-full accent-current" />
                  </div>
                </div>

                {/* UI Toggles & API Extensions */}
                <div className="bg-black/40 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2 xl:col-span-1 md:col-span-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setHideDescriptionBox(!hideDescriptionBox)} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center ${hideDescriptionBox ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black border-zinc-700 text-zinc-300 hover:text-white"}`}>
                      {hideDescriptionBox ? "👁️ Show Descriptions" : "🙈 Hide Descriptions"}
                    </button>
                    <button onClick={() => setAutoTheaterOnSelect(!autoTheaterOnSelect)} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center ${autoTheaterOnSelect ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black border-zinc-700 text-zinc-300 hover:text-white"}`}>
                      {autoTheaterOnSelect ? "🎬 Auto-Theater ON" : "📺 Auto-Theater OFF"}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setAiUnitSystem(u => u === "imperial" ? "metric" : "imperial")} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 ${aiUnitSystem === "metric" ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black border-zinc-700 text-zinc-300 hover:text-white"}`}>
                      <Ruler className="w-3.5 h-3.5"/> Units: {aiUnitSystem.toUpperCase()}
                    </button>
                    <button onClick={() => setGridDensity(g => g === "standard" ? "compact" : "standard")} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 ${gridDensity === "compact" ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black border-zinc-700 text-zinc-300 hover:text-white"}`}>
                      <Grid className="w-3.5 h-3.5"/> Grid: {gridDensity.toUpperCase()}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setAiWebGrounding(!aiWebGrounding)} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 ${aiWebGrounding ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/50" : "bg-black border-zinc-700 text-zinc-400"}`}>
                      <Search className="w-3.5 h-3.5"/> Search Grounding: {aiWebGrounding ? "ON" : "OFF"}
                    </button>
                    <button onClick={() => setAiOutputLength(l => l === "normal" ? "extended" : "normal")} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 ${aiOutputLength === "extended" ? "bg-purple-950/40 text-purple-300 border-purple-500/50" : "bg-black border-zinc-700 text-zinc-400"}`}>
                      <Layout className="w-3.5 h-3.5"/> Max Tokens: {aiOutputLength.toUpperCase()}
                    </button>
                  </div>

                  <button onClick={() => setAutoLoadAiScan(!autoLoadAiScan)} className={`w-full p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center ${autoLoadAiScan ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black border-zinc-700 text-zinc-300 hover:text-white"}`}>
                    {autoLoadAiScan ? "🤖 Auto-AI Scan: ENGAGED" : "🤖 Auto-AI Scan: MANUAL"}
                  </button>
                  <button onClick={() => setDisplayDiagnosticHUD(!displayDiagnosticHUD)} className={`w-full p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center ${displayDiagnosticHUD ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/50" : "bg-black border-zinc-700 text-zinc-300 hover:text-white"}`}>
                    {displayDiagnosticHUD ? "📊 Diagnostics HUD Ribbon: ON" : "📊 Diagnostics HUD Ribbon: OFF"}
                  </button>
                  
                  {/* System Payload Debug Toggle */}
                  <button onClick={() => setShowRawJsonData(!showRawJsonData)} className={`w-full p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all text-center mt-2 ${showRawJsonData ? "bg-rose-950/40 text-rose-300 border-rose-500/50" : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>
                    {showRawJsonData ? "Hide Architecture Matrix" : "Show JSON Debug Matrix"}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* --- EXPANDED VIDEO PLAYER PLATFORM NODE --- */}
        {activeVideo ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-[#0d0e15] border rounded-3xl overflow-hidden border-zinc-800 shadow-2xl`}
          >
            {/* Viewport Asset Frame */}
            <div className={`relative w-full bg-black border-b border-zinc-800 transition-all duration-500 ${theaterMode ? "aspect-[21/9]" : "aspect-video"}`}>
              <iframe 
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`} 
                title={activeVideo.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
                className="absolute inset-0 w-full h-full"
              ></iframe>
              
              <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2 z-10">
                <button onClick={() => setTheaterMode(!theaterMode)} className="p-2 bg-black/80 rounded-xl text-zinc-300 hover:text-white border border-zinc-700 shadow-xl backdrop-blur-md transition-colors"><Maximize2 className="w-5 h-5" /></button>
                <button onClick={() => { setActiveVideo(null); setAiStatus(null); setVideoAiChat(null); setTheaterMode(false); }} className="p-2 bg-black/80 rounded-xl text-zinc-300 hover:text-red-400 border border-zinc-700 shadow-xl backdrop-blur-md transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Live Diagnostics Telemetry Sub-Ribbon */}
            {displayDiagnosticHUD && (
              <div className="bg-black border-b border-zinc-900 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono text-[10px]">
                 <div className="border-r border-zinc-900 py-1"><span className="text-zinc-400 uppercase block text-[8px] font-bold">Metadata Stream Node</span><span className="text-white font-bold truncate block px-1">{activeVideo.id}</span></div>
                 <div className="border-r border-zinc-900 py-1"><span className="text-zinc-400 uppercase block text-[8px] font-bold">Extracted Video Runtime</span><span className={`${t.text} font-bold`}>{activeVideo.duration}</span></div>
                 <div className="border-r border-zinc-900 py-1"><span className="text-zinc-400 uppercase block text-[8px] font-bold">Data Grounding Target</span><span className="text-emerald-400 font-bold uppercase">Backend API Tags</span></div>
                 <div className="py-1"><span className="text-zinc-400 uppercase block text-[8px] font-bold">Google Web Search</span><span className={aiWebGrounding ? "text-cyan-400 font-bold" : "text-zinc-500 font-bold"}>{aiWebGrounding ? "ACTIVE" : "DISABLED"}</span></div>
              </div>
            )}

            <div className={`p-5 space-y-6 transition-all duration-500 ${theaterMode ? "md:p-8 max-w-5xl mx-auto" : "md:p-6"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-inner ${activeVideo.category?.color || "text-zinc-100 bg-zinc-800 border-zinc-600"}`}>
                  {activeVideo.category?.label || "Stream"}
                </span>
                <span className="px-3 py-1.5 bg-black border border-zinc-800 text-zinc-200 rounded-lg text-[10px] font-bold flex items-center gap-2 shadow-inner"><Eye className={`w-3.5 h-3.5 ${t.text}`} /> {Number(activeVideo.views).toLocaleString()} VIEWS</span>
                <span className="px-3 py-1.5 bg-black border border-zinc-800 text-zinc-200 rounded-lg text-[10px] font-bold flex items-center gap-2 shadow-inner"><ThumbsUp className={`w-3.5 h-3.5 ${t.text}`} /> {Number(activeVideo.ytLikes).toLocaleString()} LIKES</span>
                <span className="px-3 py-1.5 bg-black text-zinc-400 border border-zinc-800 rounded-lg text-[10px] font-bold flex items-center gap-2 shadow-inner ml-auto"><Calendar className="w-3.5 h-3.5" /> {new Date(activeVideo.publishedAt).toLocaleDateString()}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">{activeVideo.title}</h2>
              
              {/* DISPLAY EXTRACTED METADATA TAGS TO PROVE IT'S REAL */}
              {activeVideo.rawTagsArray && activeVideo.rawTagsArray.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeVideo.rawTagsArray.slice(0, 8).map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-black border border-zinc-700 rounded text-[9px] font-mono text-zinc-300 uppercase">#{tag}</span>
                  ))}
                  {activeVideo.rawTagsArray.length > 8 && <span className="px-2 py-1 bg-black border border-zinc-700 rounded text-[9px] font-mono text-zinc-400 uppercase">+{activeVideo.rawTagsArray.length - 8} MORE</span>}
                </div>
              )}

              {/* Functional Payload Triggers (Screen Fitting) */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                <button 
                  onClick={handleAIAction} disabled={aiLoading}
                  className={`flex-1 min-w-[200px] py-3.5 sm:py-4 px-4 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${aiLoading || aiStatus ? `${t.border} ${t.text} ${t.bgSubtle} ${t.glow}` : `bg-black border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-500`}`}
                >
                  {aiLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <BrainCircuit className="w-4.5 h-4.5" />} 
                  <span className="truncate">{aiLoading ? "Scanning Payload Array..." : `Scan Metadata [${aiDetailLevel.toUpperCase()}]`}</span>
                </button>
                <button 
                  onClick={(e) => handleVoltVideo(e, activeVideo.id)} 
                  disabled={votedVolts.includes(activeVideo.id)}
                  className={`flex-1 min-w-[140px] py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-inner border ${
                    votedVolts.includes(activeVideo.id) 
                      ? "bg-amber-950/40 border-amber-500/50 text-amber-400 cursor-not-allowed" 
                      : "bg-black border-zinc-700 hover:border-amber-500 text-zinc-300 hover:text-amber-400"
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${votedVolts.includes(activeVideo.id) ? "text-amber-500 fill-amber-500" : ""}`} /> 
                  <span className="truncate">{engagements[activeVideo.id]?.volts || 0} Volts {votedVolts.includes(activeVideo.id) ? "(Cast)" : ""}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`https://youtu.be/${activeVideo.id}`); showToast("Video Link Copied!"); }} className={`p-3.5 sm:p-4 rounded-xl bg-black border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 shrink-0 shadow-inner`}>
                  <Share2 className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Conversational AI Output Array */}
              <div className={`bg-black border rounded-2xl p-6 shadow-inner relative overflow-hidden transition-all ${aiStatus ? t.borderSubtle : "border-zinc-800"}`}>
                {aiLoading && <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent animate-[shimmer_1.5s_infinite] ${t.text}`}></div>}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${aiStatus ? t.bgSubtle : "bg-zinc-900"}`}><Cpu className={`w-4 h-4 ${aiStatus ? t.text : "text-zinc-400"}`} /></div>
                    <h3 className={`text-xs font-black uppercase tracking-widest ${aiStatus ? "text-white" : "text-zinc-400"}`}>Grounded Co-Pilot Matrix</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {aiStatus && <span className={`text-[8px] font-mono border ${t.borderSubtle} ${t.text} px-2 py-0.5 rounded uppercase hidden sm:block`}>{aiPersonality} : {aiDetailLevel}</span>}
                    {aiStatus && (
                      <button onClick={exportAiSummary} className={`px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-[9px] font-mono font-bold ${t.text} uppercase flex items-center gap-1.5 transition-colors shadow-inner`}>
                        <Download className="w-3 h-3"/> Export
                      </button>
                    )}
                  </div>
                </div>
                <div className={`text-xs md:text-sm font-bold leading-relaxed whitespace-pre-wrap font-sans ${!aiStatus ? "text-zinc-500 italic text-center py-4" : "text-zinc-100"}`}>
                  {aiStatus || "Awaiting target array lock. Deploy 'Scan Metadata' to perform objective AI analysis of the video properties."}
                </div>
              </div>

              {/* DIRECT VIDEO INFO CONTEXT INTERROGATION CHAT MODULE */}
              <div className="bg-[#0b0c10] border border-zinc-800 rounded-2xl p-5 shadow-inner space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                   <HelpCircle className={`w-4 h-4 ${t.text}`} />
                   <span className="text-xs font-black uppercase tracking-widest text-zinc-200">Interrogate Deep Video Logs</span>
                </div>
                
                {videoAiChat && (
                  <div className="p-4 rounded-xl bg-black border border-zinc-700 font-sans text-zinc-100 text-xs sm:text-sm leading-relaxed font-bold transition-all">
                     {videoAiChat}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text"
                    value={videoQuestion}
                    onChange={(e) => setVideoQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInterrogateVideo()}
                    placeholder="Ask anything about this video's published tags, runtime, or hardware specs..."
                    className={`flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-500 outline-none focus:${t.border} transition-colors shadow-inner font-bold`}
                  />
                  <button 
                    type="button" 
                    onClick={handleInterrogateVideo}
                    disabled={videoChatLoading || !videoQuestion.trim()}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${t.primary} text-black disabled:opacity-30 w-full sm:w-auto shrink-0`}
                  >
                    {videoChatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
                    Query Log
                  </button>
                </div>
              </div>

              {/* Description Log Toggled Sub-Block */}
              {!hideDescriptionBox && (
                <div className="bg-black/40 border border-zinc-800 p-5 rounded-2xl text-xs font-bold text-zinc-300 font-sans leading-relaxed space-y-2">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Raw Native Video Metadata Logs</span>
                  <p className="line-clamp-6 whitespace-pre-wrap">{activeVideo.description}</p>
                </div>
              )}

              {/* Discussion Channel Comms */}
              <div className="bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-inner flex flex-col">
                <div className="flex items-center gap-3 p-5 border-b border-zinc-800 bg-zinc-950">
                  <Radio className={`w-5 h-5 ${t.text}`} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-200">Field Operations Comms Channels</h3>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${t.primary}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${t.primary}`}></span>
                    </span>
                    <span className={`text-[9px] font-mono tracking-widest ${t.text}`}>ONLINE</span>
                  </div>
                </div>
                
                <div className="p-5 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar bg-[#06060a]">
                  {(!activeEng?.comments || activeEng.comments.length === 0) ? (
                    <div className="border-2 border-dashed border-zinc-800 rounded-xl p-10 flex flex-col items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-zinc-600 mb-3" />
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-400 text-center">No telemetry commentary registered on this wavelength.<br/>Transmit data logs.</p>
                    </div>
                  ) : (
                    activeEng.comments.map((reply: any) => (
                      <div key={reply.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 ${t.primary} text-black font-black flex items-center justify-center rounded text-[9px] uppercase`}>{reply.author.substring(0, 2)}</div>
                            <span className="font-black text-white uppercase tracking-wider">{reply.author}</span>
                          </div>
                          <span className="text-[8px] text-zinc-400 font-bold font-mono tracking-widest">{reply.time}</span>
                        </div>
                        <p className="text-zinc-300 font-sans leading-relaxed pl-7 font-bold">{reply.text}</p>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-3">
                  <input 
                    type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(activeVideo.id)}
                    placeholder={`Transmit message response as ${currentUser}...`} 
                    className={`flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:${t.border} transition-colors shadow-inner font-bold`}
                  />
                  <button onClick={() => handlePostComment(activeVideo.id)} disabled={!commentText.trim()} className={`${t.primary} text-black px-6 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors disabled:opacity-30 shrink-0`}>
                    <Send className="w-4 h-4" /> TX
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* DEFAULT MAIN RECYCLER CHANNEL OVERVIEW */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            {/* UNIVERSAL LIVE PROFILE DASHBOARD CARD */}
            <div className="bg-[#0d0e15] p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden mb-6">
              <div className={`absolute top-0 right-0 w-96 h-96 ${t.primary} opacity-5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none`}></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 w-full md:w-auto text-center md:text-left">
                {channelData.avatar ? (
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full bg-black border-4 ${t.border} ${t.glow} shrink-0 overflow-hidden p-1.5 relative`}>
                    <img src={channelData.avatar} alt="Channel Identity Vector" className="w-full h-full object-cover rounded-full" />
                    <div className={`absolute bottom-0 right-0 w-5 h-5 ${t.primary} border-2 border-black rounded-full animate-pulse`}></div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-800 animate-pulse shrink-0"></div>
                )}
                <div className="max-w-xl flex flex-col justify-center">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <MapPin className={`w-4 h-4 ${t.text}`} />
                    <span className={`text-[10px] font-mono ${t.text} tracking-widest uppercase font-black`}>Stigler, OK Sector Array</span>
                  </div>
                  <h2 className="text-white font-black text-3xl md:text-4xl tracking-widest mb-3 uppercase">
                    {channelData.title}
                  </h2>
                  <p className="text-xs md:text-sm text-zinc-300 font-bold leading-relaxed italic border-l-2 border-zinc-800 pl-4 mb-4">
                    "{channelData.desc}"
                  </p>
                  
                  {/* OFFICIAL NATIVE APP CHANNEL SUBSCRIBE BUTTON */}
                  <a 
                    href={`https://youtube.com/@bradleycallison?sub_confirmation=1`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-full sm:w-fit px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-red-600/20 transition-all active:scale-[0.98] mt-2`}
                  >
                    <Youtube className="w-4.5 h-4.5" /> Subscribe to Channel
                  </a>
                </div>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-1 gap-3 relative z-10 w-full md:w-48 shrink-0">
                <div className="flex flex-col items-center justify-center text-center gap-1.5 bg-black border border-zinc-800 p-4 rounded-2xl shadow-inner">
                  <div className={`p-2 ${t.bgSubtle} rounded-lg mb-0.5`}><Users className={`w-5 h-5 ${t.text}`} /></div>
                  <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-none">Subs</span>
                  <span className="text-base text-white font-mono font-black leading-none">{channelData.subs}</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-1.5 bg-black border border-zinc-800 p-4 rounded-2xl shadow-inner">
                  <div className={`p-2 ${t.bgSubtle} rounded-lg mb-0.5`}><Activity className={`w-5 h-5 ${t.text}`} /></div>
                  <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-none">Views</span>
                  <span className="text-base text-white font-mono font-black leading-none">{channelData.views}</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-1.5 bg-black border border-zinc-800 p-4 rounded-2xl shadow-inner">
                  <div className={`p-2 ${t.bgSubtle} rounded-lg mb-0.5`}><Video className={`w-5 h-5 ${t.text}`} /></div>
                  <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-none">Payloads</span>
                  <span className="text-base text-white font-mono font-black leading-none">{channelData.totalVideos}</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-950/45 border border-red-500/40 text-red-200 text-sm rounded-xl p-4 flex gap-3 items-center shadow-lg mb-6 font-mono uppercase">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" /> <p>{errorMsg}</p>
              </div>
            )}

            {/* ACTION INTERFACE ENGINE: CATEGORIES & SORT pills */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-[#0d0e15] p-3 rounded-2xl border border-zinc-800 shadow-xl mb-6">
              <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                {["All", "PEV Review", "Garage / Build", "Trail Scout", "General Ride"].map((tab) => (
                  <button
                    key={tab} onClick={() => setActiveFilter(tab)}
                    className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${activeFilter === tab ? `${t.bgSubtle} ${t.text} ${t.border} shadow-inner` : "bg-black text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-500"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setSortBy(s => s === "newest" ? "popular" : "newest")} 
                className={`w-full xl:w-auto flex justify-center items-center gap-2 px-5 py-2.5 bg-black border border-zinc-700 hover:border-zinc-500 rounded-xl text-[10px] font-black text-zinc-200 hover:text-white transition-colors shadow-inner uppercase tracking-widest`}
              >
                <ArrowUpDown className="w-4 h-4" /> {sortBy === "newest" ? "Timeline: Newest" : "Payload: Most Viewed"}
              </button>
            </div>

            {/* VIDEO FEED RECYCLER GRID FRAME */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-70">
                <div className="relative w-16 h-16 mb-6">
                  <div className={`absolute inset-0 border-4 ${t.border} opacity-20 rounded-full`}></div>
                  <div className={`absolute inset-0 border-4 ${t.border} border-t-transparent rounded-full animate-spin`}></div>
                  <Zap className={`absolute inset-0 m-auto w-6 h-6 ${t.text}`} />
                </div>
                <span className={`text-xs font-black tracking-widest ${t.text} uppercase font-mono animate-pulse`}>Syncing Satellite Telemetry Feeds...</span>
              </div>
            ) : processed.length === 0 ? (
              <div className="bg-[#0d0e15] border border-zinc-800 rounded-3xl p-16 text-center shadow-xl w-full">
                <ShieldCheck className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-zinc-400 font-black uppercase tracking-widest text-sm">No telemetry records returned in this filter context.</h3>
              </div>
            ) : (
              /* DENSITY COMPRESSION MATRIX GENERATOR */
              <div className={`grid gap-6 ${gridDensity === "compact" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
                {processed.map((v) => {
                  const eng = engagements[v.id] || { volts: 0, comments: [] };

                  return (
                    <div 
                      key={v.id} onClick={() => setActiveVideo(v)} 
                      className={`group cursor-pointer bg-[#0d0e15] rounded-3xl border border-zinc-800 hover:border-zinc-600 overflow-hidden flex flex-col transition-all duration-300 shadow-xl hover:${t.glow} hover:-translate-y-0.5`}
                    >
                      <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-zinc-800">
                        <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md text-[9px] font-black uppercase tracking-widest border shadow-lg ${v.category?.color || 'text-zinc-100 border-zinc-600'}`}>
                          {v.category?.label || 'Stream'}
                        </div>
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                          <div className="px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white flex items-center gap-1.5 border border-zinc-700 shadow-lg">
                            <Eye className={`w-3.5 h-3.5 ${t.text}`} /> {Number(v.views).toLocaleString()}
                          </div>
                          <div className="px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono font-bold text-zinc-300 flex items-center gap-1.5 border border-zinc-700 shadow-lg">
                            <Calendar className="w-3 h-3 text-zinc-400" /> {v.timeAgo}
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/10 transition-colors duration-300">
                          <div className={`w-14 h-14 ${t.primary} rounded-full flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300`}>
                            <Play className="w-6 h-6 text-black fill-current ml-1" />
                          </div>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                        <h4 className="font-black text-sm text-white line-clamp-2 leading-snug group-hover:text-zinc-300 transition-colors">
                          {v.title}
                        </h4>
                        
                        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                          <div className="flex gap-2">
                            {/* ONE-TIME CLICK VOLT BUTTON */}
                            <button 
                              onClick={(e) => handleVoltVideo(e, v.id)} 
                              disabled={votedVolts.includes(v.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 bg-black border rounded-lg text-xs font-bold transition-colors shadow-inner ${
                                votedVolts.includes(v.id) 
                                  ? "border-amber-500/50 text-amber-400 cursor-not-allowed bg-amber-950/40" 
                                  : "border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400"
                              }`}
                            >
                              <Flame className={`w-3.5 h-3.5 ${votedVolts.includes(v.id) ? "text-amber-500 fill-amber-500" : ""}`} /> 
                              {eng?.volts || 0}
                            </button>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 shadow-inner">
                              <MessageCircle className="w-3.5 h-3.5 text-zinc-400" /> {eng.comments?.length || 0}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => handleBookmark(e, v)} className={`p-2 bg-black rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-700 shadow-inner`} title="Save to Watchlist">
                              <Bookmark className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`https://youtu.be/${v.id}`); showToast("Video Link Copied!"); }} className={`p-2 bg-black rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-700 shadow-inner`}>
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* RAW ARCHITECTURE DEBUG WINDOW MODULE */}
            {showRawJsonData && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-black border border-zinc-800 rounded-2xl p-4 mt-6 shadow-inner font-mono text-[9px] text-zinc-400 overflow-x-auto">
                 <span className="text-white font-bold uppercase tracking-widest block mb-2">System JSON Payload Debug Matrix</span>
                 {JSON.stringify({ channelData, processedVideosCount: processed.length, brandHUD: t.name, activeFilter }, null, 2)}
              </motion.div>
            )}

          </motion.div>
        )}
      </div>
    </div>
  );
}