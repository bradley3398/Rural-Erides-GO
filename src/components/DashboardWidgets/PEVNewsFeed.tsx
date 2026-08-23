import React, { useState, useEffect } from "react";
import { Newspaper, RefreshCw, Loader2 } from "lucide-react";
import { getNewsApiKey } from "../../services/CoPilotService";

const NEWS_CATEGORIES = ["Micro-Mobility", "E-Bikes", "Electric Scooters", "Battery Technology", "PEV Legislation", "Tech & Gadgets"];

export default function PEVNewsFeed({ localeCode, ui }: any) {
  const [newsCategory, setNewsCategory] = useState("Micro-Mobility");
  const [newsSearchFilter, setNewsSearchFilter] = useState("");
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

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

  return (
    <div className={`${ui.bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col border transition-colors ${ui.brd}`}>
       <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${ui.brd} pb-4 mb-4 shrink-0 gap-3 w-full`}>
         <h3 className={`${ui.t.text} font-black uppercase tracking-widest text-sm flex items-center gap-2`}>
            <Newspaper className="w-5 h-5" /> Global News Matrix
         </h3>
         <div className="flex items-center gap-2 w-full sm:w-auto">
           <button onClick={fetchPEVNews} className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${ui.bgList} border ${ui.brd} ${ui.txtMuted} hover:${ui.txtMain} transition-colors cursor-pointer`} title="Force Sync Matrix">
             <RefreshCw className={`w-4 h-4 ${isLoadingNews ? 'animate-spin' : ''}`}/>
           </button>
           <select 
             value={newsCategory} 
             onChange={(e) => setNewsCategory(e.target.value)}
             className={`${ui.bgBase} text-[10px] font-black uppercase tracking-widest ${ui.txtMain} border ${ui.brd} min-h-[44px] px-3 rounded-xl outline-none shadow-inner cursor-pointer w-full sm:w-auto`}
           >
             {NEWS_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
           </select>
         </div>
       </div>
       
       <input 
          value={newsSearchFilter} onChange={(e) => setNewsSearchFilter(e.target.value)}
          placeholder="Filter headlines by keyword..."
          className={`mb-4 ${ui.bgList} border ${ui.brd} rounded-xl px-4 min-h-[44px] ${ui.txtMain} text-xs font-bold outline-none focus:${ui.t.border} transition-colors w-full`}
       />

       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[350px] pr-2">
         {isLoadingNews ? (
           <div className="flex justify-center items-center h-full pt-10">
             <Loader2 className={`w-6 h-6 animate-spin ${ui.t.text}`} />
           </div>
         ) : filteredNews.length === 0 ? (
           <div className={`text-center py-10 ${ui.txtMuted} font-mono text-[10px] uppercase`}>No articles matching parameters.</div>
         ) : (
           filteredNews.map((news, idx) => (
             <div key={`${news.url}-${idx}`} onClick={() => window.open(news.url, "_blank")} className={`group ${ui.bgList} border ${ui.brd} p-4 rounded-2xl transition-colors cursor-pointer shadow-inner hover:border-zinc-500`}>
               <div className="flex justify-between items-start mb-2">
                 <span className={`text-[9px] font-black uppercase tracking-widest ${ui.txtMuted} truncate pr-2`}>{news.source?.name || "Network"} • {new Date(news.publishedAt).toLocaleDateString(localeCode)}</span>
               </div>
               <div className="flex items-center justify-between gap-4">
                 <h4 className={`text-xs font-bold ${ui.txtMain} leading-relaxed transition-colors line-clamp-2`}>{news.title}</h4>
                 {news.urlToImage && <img src={news.urlToImage} alt="" className={`w-14 h-14 object-cover rounded-xl border ${ui.brd} shrink-0`} />}
               </div>
             </div>
           ))
         )}
       </div>
    </div>
  );
}