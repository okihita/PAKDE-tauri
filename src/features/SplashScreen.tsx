export default function SplashScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#070b14] text-white text-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
          <div className="relative text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent px-6 py-2 border-[0.5px] border-emerald-500/30 rounded-2xl bg-emerald-950/20">
            KDKMP
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-wider text-slate-200">COCKPIT PANEL</h2>
          <p className="text-slate-500 text-xs font-mono">SQLite Local Node Initialization</p>
        </div>
        <div className="w-40 bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800/40">
          <div className="bg-emerald-500 h-full w-2/3 animate-[pulse_1.5s_infinite] rounded-full" />
        </div>
      </div>
      <p className="absolute bottom-8 text-slate-600 font-mono text-[10px]">VER 0.5.0 • SAK EP COMPLIANT</p>
    </div>
  );
}
