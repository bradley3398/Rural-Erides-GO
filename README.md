<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rural ERides Go | Official Telemetry &amp; Copilot Suite</title>
  <!-- Tailwind CSS CDN -->
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
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;900&amp;family=Inter:wght@400;500;600;700;900&amp;display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #06060a; color: #fff; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glow-brand { box-shadow: 0 0 30px rgba(57, 255, 20, 0.2); }
    .glow-text { text-shadow: 0 0 20px rgba(57, 255, 20, 0.4); }
    .glass-panel { background: rgba(13, 14, 21, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 20, 0.08); }
  </style>
</head>
<body class="bg-[#06060a] text-white min-h-screen flex flex-col justify-between selection:bg-[#39ff14] selection:text-black">

  <!-- --- HEADER NAVIGATION --- -->
  <header className="border-b border-zinc-900/80 bg-[#06060a]/90 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <!-- App Logo Placeholder: Drop your app logo image into an assets folder as app-logo.png -->
        <div className="w-11 h-11 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center overflow-hidden glow-brand">
          <img src="assets/app-logo.png" alt="Rural ERides Go Logo" class="w-8 h-8 object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <i data-lucide="zap" className="w-5 h-5 text-[#39ff14]" style="display:none;"></i>
        </div>
        <div>
          <span className="text-[10px] font-mono font-black text-[#39ff14] tracking-widest uppercase block">Rural ERides Go</span>
          <span className="text-xs font-black uppercase tracking-wider text-zinc-300">Master Telemetry Suite</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <a href="https://youtube.com/@bradleycallison" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 hover:border-[#39ff14]/50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-[#39ff14] transition-colors">
          <i data-lucide="youtube" className="w-4 h-4 text-rose-500"></i> @bradleycallison
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-[#39ff14] text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest glow-brand hover:opacity-90 transition-all font-mono">
          GitHub Repo
        </a>
      </div>
    </div>
  </header>

  <!-- --- HERO SECTION --- -->
  <section className="relative overflow-hidden py-20 lg:py-28">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#39ff14] opacity-5 rounded-full blur-[160px] pointer-events-none"></div>
    <div className="max-w-5xl mx-auto px-4 text-center relative z-10 space-y-8">
      
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] text-xs font-mono font-black uppercase tracking-widest">
        <i data-lucide="shield-check" className="w-3.5 h-3.5"></i> Developed by Lord Bradley Callison
      </div>

      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-none">
        The Ultimate <span className="text-[#39ff14] glow-text">Micro-Mobility</span> Operating System.
      </h1>

      <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
        A production-grade React, Vite, and Capacitor application built for advanced electric personal vehicle (PEV) telemetry, real-time weather analytics, secure AI diagnostics, and precision field tracking.
      </p>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <a href="#architecture" className="bg-[#39ff14] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs glow-brand hover:opacity-90 transition-all flex items-center gap-2 font-mono">
          <i data-lucide="cpu" className="w-4 h-4"></i> Explore Architecture
        </a>
        <a href="#bio" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white transition-all flex items-center gap-2 font-mono">
          <i data-lucide="user" className="w-4 h-4 text-[#39ff14]"></i> Creator Bio &amp; Fleet
        </a>
      </div>
    </div>
  </section>

  <!-- --- CREATOR BIO & FLEET SHOWCASE --- -->
  <section id="bio" className="py-20 bg-zinc-950/50 border-t border-zinc-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
          <!-- Channel Logo Placeholder: Drop your channel logo image into assets as channel-logo.png -->
          <div className="w-28 h-28 rounded-3xl bg-zinc-900 border-2 border-[#39ff14]/40 flex items-center justify-center overflow-hidden glow-brand p-2">
            <img src="assets/channel-logo.png" alt="Rural Erides Channel Logo" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <i data-lucide="video" className="w-12 h-12 text-[#39ff14]" style="display:none;"></i>
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wide">Lord Bradley Callison</h3>
            <span className="text-xs font-mono text-[#39ff14] font-black uppercase tracking-widest">Rural Erides Creator (@bradleycallison)</span>
          </div>
          <a href="https://youtube.com/@bradleycallison" target="_blank" rel="noopener noreferrer" className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg">
            <i data-lucide="youtube" className="w-4 h-4"></i> Visit YouTube Channel
          </a>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-black text-[#39ff14] uppercase tracking-widest">About The Creator &amp; Project</span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">Field-Tested in Stigler, Oklahoma</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Rural ERides Go was born out of real-world micro-mobility testing across rural terrain. Designed, coded, and field-tested under demanding real-world riding conditions, this platform delivers precise telemetry monitoring without relying on clunky, closed-ecosystem apps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-black/60 border border-zinc-900 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">Active Personal Fleet</span>
              <p className="text-xs font-bold text-zinc-200">Aostirmotor A20 Folding Bike, Geemax E-Trike, isinwheel H7 Pro Scooter, &amp; Dual Engwe Y600s.</p>
            </div>
            <div className="bg-black/60 border border-zinc-900 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">Core Hardware Setup</span>
              <p className="text-xs font-bold text-zinc-200">Samsung Galaxy S25 Plus primary filmmaking &amp; mobile telemetry rig paired with dual-device Rider Radar.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- --- FEATURE ARCHITECTURE MATRIX --- -->
  <section id="architecture" className="py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      
      <div className="text-center space-y-3">
        <span className="text-xs font-mono font-black text-[#39ff14] uppercase tracking-widest">System Capabilities</span>
        <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-wider">Advanced Technical Architecture</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- Feature 1 -->
        <div className="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="gauge" className="w-6 h-6"></i>
          </div>
          <h4 className="text-base font-black uppercase tracking-wide">Live GPS Telemetry</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            High-precision speedometers, physics-based incline/decline detection, G-sensor braking force calculations, and cumulative mileage tracking designed for active mobile deployment.
          </p>
        </div>

        <!-- Feature 2 -->
        <div className="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="cloud-sun" className="w-6 h-6"></i>
          </div>
          <h4 className="text-base font-black uppercase tracking-wide">12-Point Atmospherics</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Real-time weather matrix featuring wind gust vectors, UV solar indexes, surface soil temperatures, dew points, and dynamic ride safety ratings.
          </p>
        </div>

        <!-- Feature 3 -->
        <div className="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="youtube" className="w-6 h-6"></i>
          </div>
          <h4 className="text-base font-black uppercase tracking-wide">75-Result Audio Engine</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Embedded multi-page YouTube media deck pre-loaded with tailored ride genres ranging from classical piano and theatre organ consoles to synthwave and phonk mixes.
          </p>
        </div>

        <!-- Feature 4 -->
        <div className="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="wrench" className="w-6 h-6"></i>
          </div>
          <h4 className="text-base font-black uppercase tracking-wide">AI Mechanical Copilot</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Optical image inspection for battery contacts, brake calipers, and controller wiring backed by secure API routing middleware (`CoPilotService.ts`) and native Text-to-Speech.
          </p>
        </div>

        <!-- Feature 5 -->
        <div className="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="layers" className="w-6 h-6"></i>
          </div>
          <h4 className="text-base font-black uppercase tracking-wide">Global PEV Spec Database</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Deep-search technical datasheets and live manufacturer parts sourcing across Amazon, eBay, and multi-vendor networks calibrated for regional pricing.
          </p>
        </div>

        <!-- Feature 6 -->
        <div className="glass-panel p-8 rounded-3xl transition-all space-y-4 hover:border-[#39ff14]/50 group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="radar" className="w-6 h-6"></i>
          </div>
          <h4 className="text-base font-black uppercase tracking-wide">Dual-Device Rider Radar</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Sub-meter precision tracking enabling multi-device fleet monitoring between mobile phones and field tablets with built-in Ghost Mode privacy protections.
          </p>
        </div>

      </div>
    </div>
  </section>

  <!-- --- FOOTER --- -->
  <footer className="border-t border-zinc-900 bg-[#0d0e15] py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#39ff14] animate-ping"></div>
        <span className="text-xs font-mono font-black uppercase tracking-widest text-zinc-400">Rural ERides Go v6.5.0 • Developed by Lord Bradley Callison</span>
      </div>
      <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-zinc-500 font-mono">
        <a href="https://youtube.com/@bradleycallison" target="_blank" rel="noopener noreferrer" className="hover:text-[#39ff14] transition-colors">YouTube Channel</a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#39ff14] transition-colors">GitHub Repository</a>
      </div>
    </div>
  </footer>

  <!-- Initialize Lucide Icons -->
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
