<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rural ERides Go | Official Telemetry &amp; Copilot Suite</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '#39ff14',
            darkbase: '#06060a',
            darkpanel: '#0d0e15',
          }
        }
      }
    }
  </script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;900&amp;family=Inter:wght@400;500;600;700;900&amp;display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #06060a; color: #fff; overflow-x: hidden; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glow-brand { box-shadow: 0 0 35px rgba(57, 255, 20, 0.2); }
    .glow-text { text-shadow: 0 0 20px rgba(57, 255, 20, 0.4); }
    .glass-panel { background: rgba(13, 14, 21, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(57, 255, 20, 0.15); }
    .grid-bg { background-image: radial-gradient(rgba(57, 255, 20, 0.08) 1px, transparent 1px); background-size: 32px 32px; }
  </style>
</head>
<body class="bg-[#06060a] text-white min-h-screen flex flex-col justify-between grid-bg selection:bg-[#39ff14] selection:text-black">

  <!-- HEADER NAVIGATION -->
  <header class="border-b border-zinc-900/80 bg-[#06060a]/90 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/40 flex items-center justify-center glow-brand overflow-hidden p-1">
          <img src="assets/logo.png" alt="Rural ERides Go Logo" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="w-full h-full bg-[#39ff14] text-black font-black flex items-center justify-center text-xs" style="display:none;">RE</div>
        </div>
        <div>
          <span class="text-[10px] font-mono font-black text-[#39ff14] tracking-widest uppercase block">Rural ERides Go</span>
          <span class="text-xs font-black uppercase tracking-wider text-zinc-300">Master Telemetry Suite</span>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <a href="https://youtube.com/@bradleycallison" target="_blank" rel="noopener noreferrer" class="hidden sm:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 hover:border-[#39ff14]/50 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-[#39ff14] transition-colors">
          <svg class="w-4 h-4 text-rose-500 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> @bradleycallison
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="bg-[#39ff14] text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest glow-brand hover:opacity-90 transition-all font-mono">
          GitHub Repo
        </a>
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section class="relative overflow-hidden py-16 lg:py-24">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#39ff14] opacity-5 rounded-full blur-[180px] pointer-events-none"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
      
      <div class="lg:col-span-7 space-y-8 text-left">
        <div class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] text-xs font-mono font-black uppercase tracking-widest">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Developed by Lord Bradley Callison
        </div>

        <h1 class="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none">
          The Ultimate <span class="text-[#39ff14] glow-text">Micro-Mobility</span> Operating System.
        </h1>

        <p class="text-zinc-400 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
          A production-grade React, Vite, and Capacitor application built for advanced electric personal vehicle (PEV) telemetry, real-time weather analytics, secure AI mechanical diagnostics, and sub-meter field tracking.
        </p>

        <div class="flex flex-wrap gap-4 pt-2">
          <a href="#features" class="bg-[#39ff14] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs glow-brand hover:opacity-90 transition-all flex items-center gap-2 font-mono">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg> Explore Architecture
          </a>
          <a href="#bio" class="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white transition-all flex items-center gap-2 font-mono">
            <svg class="w-4 h-4 text-[#39ff14]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> Creator Bio &amp; Fleet
          </a>
        </div>
      </div>

      <!-- TELEMETRY HUD PREVIEW CARD -->
      <div class="lg:col-span-5">
        <div class="glass-panel p-6 rounded-3xl relative overflow-hidden shadow-2xl space-y-6 border border-[#39ff14]/30">
          <div class="absolute -right-12 -top-12 w-48 h-48 bg-[#39ff14] opacity-10 rounded-full blur-2xl"></div>
          
          <div class="flex justify-between items-center border-b border-zinc-800/80 pb-4">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#39ff14] animate-ping"></span>
              <span class="text-[10px] font-mono font-black uppercase text-[#39ff14] tracking-widest">Live Telemetry HUD</span>
            </div>
            <span class="text-[10px] font-mono text-zinc-500 uppercase">S25 Plus Rig</span>
          </div>

          <div class="text-center py-4 space-y-1">
            <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Speed Vector</div>
            <div class="text-6xl font-black font-mono text-[#39ff14] glow-text">38.4</div>
            <div class="text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#39ff14]">Miles / Hour</div>
          </div>

          <div class="grid grid-cols-3 gap-3 pt-2">
            <div class="bg-black/60 border border-zinc-900 p-3 rounded-2xl text-center">
              <div class="text-[8px] font-mono text-zinc-500 uppercase">Pack Voltage</div>
              <div class="text-xs font-mono font-black text-white mt-1">52.4V</div>
            </div>
            <div class="bg-black/60 border border-zinc-900 p-3 rounded-2xl text-center">
              <div class="text-[8px] font-mono text-zinc-500 uppercase">Battery State</div>
              <div class="text-xs font-mono font-black text-[#39ff14] mt-1">94%</div>
            </div>
            <div class="bg-black/60 border border-zinc-900 p-3 rounded-2xl text-center">
              <div class="text-[8px] font-mono text-zinc-500 uppercase">Power Draw</div>
              <div class="text-xs font-mono font-black text-amber-400 mt-1">1,420W</div>
            </div>
          </div>

          <div class="bg-[#121318] border border-zinc-800 p-3 rounded-2xl flex items-center justify-between text-xs font-mono">
            <span class="text-zinc-400">GPS Status: <strong class="text-emerald-400">Locked</strong></span>
            <span class="text-[#39ff14] font-black">Rider Radar Active</span>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- CREATOR BIO & FLEET SHOWCASE -->
  <section id="bio" class="py-20 bg-zinc-950/60 border-t border-b border-zinc-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="glass-panel p-8 sm:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <div class="lg:col-span-4 flex flex-col items-center text-center space-y-4">
          <div class="w-32 h-32 rounded-3xl bg-zinc-900 border-2 border-[#39ff14]/40 flex items-center justify-center overflow-hidden glow-brand p-3 relative group">
            <img src="assets/logo.png" alt="Channel Logo" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="w-full h-full bg-[#39ff14]/20 text-[#39ff14] font-black flex items-center justify-center text-sm" style="display:none;">@BRADLEY</div>
          </div>
          <div>
            <h3 class="text-lg font-black uppercase tracking-wide">Lord Bradley Callison</h3>
            <span class="text-xs font-mono text-[#39ff14] font-black uppercase tracking-widest">Rural Erides Creator (@bradleycallison)</span>
          </div>
          <a href="https://youtube.com/@bradleycallison" target="_blank" rel="noopener noreferrer" class="w-full bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> Visit YouTube Channel
          </a>
        </div>

        <div class="lg:col-span-8 space-y-6">
          <div class="space-y-2">
            <span class="text-xs font-mono font-black text-[#39ff14] uppercase tracking-widest">About The Creator &amp; Fleet</span>
            <h3 class="text-2xl sm:text-3xl font-black uppercase tracking-wider">Field-Tested in Stigler, Oklahoma</h3>
            <p class="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Rural ERides Go was forged from real-world micro-mobility testing across Oklahoma terrain. Designed and coded by Lord Bradley Callison, this platform delivers precise telemetry monitoring without relying on closed-ecosystem apps.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div class="bg-black/60 border border-zinc-900 p-4 rounded-2xl space-y-1">
              <span class="text-[10px] font-mono text-[#39ff14] uppercase tracking-widest font-black">Active Personal Fleet</span>
              <p class="text-xs font-bold text-zinc-200">Aostirmotor A20 Folding Bike, Geemax E-Trike, isinwheel H7 Pro Scooter, &amp; Engwe Y600.</p>
            </div>
            <div class="bg-black/60 border border-zinc-900 p-4 rounded-2xl space-y-1">
              <span class="text-[10px] font-mono text-[#39ff14] uppercase tracking-widest font-black">Core Hardware Setup</span>
              <p class="text-xs font-bold text-zinc-200">Samsung Galaxy S25 Plus primary filmmaking &amp; mobile telemetry rig paired with dual-device Rider Radar.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- FEATURE ARCHITECTURE MATRIX -->
  <section id="features" class="py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      
      <div class="text-center space-y-3">
        <span class="text-xs font-mono font-black text-[#39ff14] uppercase tracking-widest">System Capabilities</span>
        <h3 class="text-2xl sm:text-4xl font-black uppercase tracking-wider">Advanced Technical Architecture</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div class="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div class="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h4 class="text-base font-black uppercase tracking-wide">Live GPS Telemetry</h4>
          <p class="text-zinc-400 text-xs leading-relaxed">
            High-precision speedometers, physics-based incline/decline detection, G-sensor braking force calculations, and cumulative mileage tracking designed for active mobile deployment.
          </p>
        </div>

        <div class="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div class="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
          </div>
          <h4 class="text-base font-black uppercase tracking-wide">12-Point Atmospherics</h4>
          <p class="text-zinc-400 text-xs leading-relaxed">
            Real-time weather matrix featuring wind gust vectors, UV solar indexes, surface soil temperatures, dew points, and dynamic ride safety ratings.
          </p>
        </div>

        <div class="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div class="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
          </div>
          <h4 class="text-base font-black uppercase tracking-wide">75-Result Audio Engine</h4>
          <p class="text-zinc-400 text-xs leading-relaxed">
            Embedded multi-page YouTube media deck pre-loaded with tailored ride genres ranging from classical piano and theatre organ consoles to synthwave and phonk mixes.
          </p>
        </div>

        <div class="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div class="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <h4 class="text-base font-black uppercase tracking-wide">AI Mechanical Copilot</h4>
          <p class="text-zinc-400 text-xs leading-relaxed">
            Optical image inspection for battery contacts, brake calipers, and controller wiring backed by secure API routing middleware and native Text-to-Speech.
          </p>
        </div>

        <div class="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div class="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <h4 class="text-base font-black uppercase tracking-wide">Global PEV Spec Database</h4>
          <p class="text-zinc-400 text-xs leading-relaxed">
            Deep-search technical datasheets and live manufacturer parts sourcing across Amazon, eBay, and multi-vendor networks calibrated for regional pricing.
          </p>
        </div>

        <div class="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div class="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          </div>
          <h4 class="text-base font-black uppercase tracking-wide">Dual-Device Rider Radar</h4>
          <p class="text-zinc-400 text-xs leading-relaxed">
            Sub-meter precision tracking enabling multi-device fleet monitoring between mobile phones and field tablets with built-in Ghost Mode privacy protections.
          </p>
        </div>

      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="border-t border-zinc-900 bg-[#0d0e15] py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-[#39ff14] animate-ping"></div>
        <span class="text-xs font-mono font-black uppercase tracking-widest text-zinc-400">Rural ERides Go v6.5.0 • Developed by Lord Bradley Callison</span>
      </div>
      <div class="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-zinc-500 font-mono">
        <a href="https://youtube.com/@bradleycallison" target="_blank" rel="noopener noreferrer" class="hover:text-[#39ff14] transition-colors">YouTube Channel</a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hover:text-[#39ff14] transition-colors">GitHub Repository</a>
      </div>
    </div>
  </footer>

</body>
</html>
