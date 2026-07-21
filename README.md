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
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;900&amp;family=Inter:wght@400;600;900&amp;display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #06060a; color: #fff; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glow-brand { box-shadow: 0 0 25px rgba(57, 255, 20, 0.25); }
    .glow-text { text-shadow: 0 0 15px rgba(57, 255, 20, 0.4); }
  </style>
</head>
<body class="bg-[#06060a] text-white min-h-screen flex flex-col justify-between selection:bg-[#39ff14] selection:text-black">

  {/* --- HEADER NAVIGATION --- */}
  <header className="border-b border-zinc-900 bg-[#0d0e15]/80 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-[#39ff14] text-black p-2.5 rounded-2xl glow-brand font-black">
          <i data-lucide="zap" className="w-6 h-6"></i>
        </div>
        <div>
          <span className="text-xs font-mono font-black text-[#39ff14] tracking-widest uppercase block">Rural ERides Go</span>
          <h1 className="text-sm sm:text-base font-black tracking-wider uppercase text-white">Master Telemetry Suite</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <a href="https://youtube.com/@bradleycallison" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-[#39ff14]/50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-[#39ff14] transition-colors">
          <i data-lucide="youtube" className="w-4 h-4 text-rose-500"></i> @bradleycallison
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-[#39ff14] text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest glow-brand hover:opacity-90 transition-opacity">
          GitHub Repository
        </a>
      </div>
    </div>
  </header>

  {/* --- HERO SECTION --- */}
  <section className="relative overflow-hidden py-20 lg:py-32">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#39ff14] opacity-5 rounded-full blur-[140px] pointer-events-none"></div>
    <div className="max-w-5xl mx-auto px-4 text-center relative z-10 space-y-8">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] text-xs font-mono font-black uppercase tracking-widest">
        <i data-lucide="shield-check" className="w-3.5 h-3.5"></i> Curated by Lord Bradley Callison
      </div>
      <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-none">
        The Ultimate <span className="text-[#39ff14] glow-text">Micro-Mobility</span> Operating System.
      </h2>
      <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
        A production-grade React, Vite, and Capacitor application engineered for advanced electric personal vehicle (PEV) telemetry, real-time atmospheric weather mapping, multi-channel YouTube audio decks, and secure AI mechanical diagnostics.
      </p>
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <a href="#features" className="bg-[#39ff14] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs glow-brand hover:opacity-90 transition-all flex items-center gap-2">
          <i data-lucide="activity" className="w-4 h-4"></i> Explore Architecture
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-[#0d0e15] border border-zinc-800 hover:border-zinc-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white transition-all flex items-center gap-2">
          <i data-lucide="git-branch" className="w-4 h-4 text-[#39ff14]"></i> Clone Source Code
        </a>
      </div>
    </div>
  </section>

  {/* --- FEATURE MATRIX --- */}
  <section id="features" className="py-20 bg-[#0d0e15]/40 border-t border-b border-zinc-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center space-y-3">
        <span className="text-xs font-mono font-black text-[#39ff14] uppercase tracking-widest">System Capabilities</span>
        <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-wider">Engineered for Maximum Performance</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="bg-[#0d0e15] border border-zinc-900 hover:border-[#39ff14]/40 p-8 rounded-3xl transition-all space-y-4 shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="gauge" className="w-6 h-6"></i>
          </div>
          <h4 className="text-lg font-black uppercase tracking-wide">Live GPS Telemetry</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            High-precision speedometers, physics-based incline/decline detection, G-sensor braking force calculations, and cumulative mileage tracking designed for active mobile deployment.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0d0e15] border border-zinc-900 hover:border-[#39ff14]/40 p-8 rounded-3xl transition-all space-y-4 shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="cloud-sun" className="w-6 h-6"></i>
          </div>
          <h4 className="text-lg font-black uppercase tracking-wide">12-Point Atmospherics</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Real-time weather matrix featuring wind gust vectors, UV solar indexes, surface soil temperatures, dew points, and dynamic ride safety ratings.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#0d0e15] border border-zinc-900 hover:border-[#39ff14]/40 p-8 rounded-3xl transition-all space-y-4 shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="youtube" className="w-6 h-6"></i>
          </div>
          <h4 className="text-lg font-black uppercase tracking-wide">75-Result Audio Engine</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Embedded multi-page YouTube media deck pre-loaded with 30 tailored ride genres ranging from classical piano and theatre organ consoles to synthwave and phonk mixes.
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-[#0d0e15] border border-zinc-900 hover:border-[#39ff14]/40 p-8 rounded-3xl transition-all space-y-4 shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="wrench" className="w-6 h-6"></i>
          </div>
          <h4 className="text-lg font-black uppercase tracking-wide">AI Mechanical Copilot</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Optical image inspection for battery contacts, brake calipers, and controller wiring backed by secure API routing middleware (`CoPilotService.ts`) and native Text-to-Speech.
          </p>
        </div>

        {/* Card 5 */}
        <div className="bg-[#0d0e15] border border-zinc-900 hover:border-[#39ff14]/40 p-8 rounded-3xl transition-all space-y-4 shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="layers" className="w-6 h-6"></i>
          </div>
          <h4 className="text-lg font-black uppercase tracking-wide">Global PEV Spec Database</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Deep-search technical datasheets and live manufacturer parts sourcing across Amazon, eBay, and multi-vendor networks calibrated for regional pricing.
          </p>
        </div>

        {/* Card 6 */}
        <div className="bg-[#0d0e15] border border-zinc-900 hover:border-[#39ff14]/40 p-8 rounded-3xl transition-all space-y-4 shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14]">
            <i data-lucide="radar" className="w-6 h-6"></i>
          </div>
          <h4 className="text-lg font-black uppercase tracking-wide">Dual-Device Rider Radar</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Sub-meter precision tracking enabling multi-device fleet monitoring between mobile phones and field tablets with built-in Ghost Mode privacy protections.
          </p>
        </div>

      </div>
    </div>
  </section>

  {/* --- FOOTER --- */}
  <footer className="border-t border-zinc-900 bg-[#0d0e15] py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#39ff14] animate-ping"></div>
        <span className="text-xs font-mono font-black uppercase tracking-widest text-zinc-400">Rural ERides Go v6.5.0 • Developed by Lord Bradley Callison</span>
      </div>
      <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-zinc-500">
        <a href="https://youtube.com/@bradleycallison" target="_blank" rel="noopener noreferrer" className="hover:text-[#39ff14] transition-colors">YouTube Channel</a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#39ff14] transition-colors">GitHub</a>
      </div>
    </div>
  </footer>

  {/* Initialize Lucide Icons */}
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
