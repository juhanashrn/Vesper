import Link from "next/link";
import { Shield, Activity, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-50 font-sans selection:bg-blue-500/30">
      
      {/* Vesper Logo */}
      <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <Shield className="w-10 h-10 text-blue-500" />
        <span className="text-4xl font-bold tracking-tight">Vesper</span>
      </div>

      {/* Hero Section */}
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2 text-center animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150">
        Built in your hands,
      </h1>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
        guarded in ours.
      </h1>
      
      {/* Features Grid */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-4 mb-16 text-zinc-400 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <div className="flex items-center gap-2 bg-zinc-900/50 px-5 py-2.5 rounded-full border border-zinc-800">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-sm">Live Threat Analysis</span>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 px-5 py-2.5 rounded-full border border-zinc-800">
          <FileText className="w-4 h-4 text-green-400" />
          <span className="font-medium text-sm">Continuous Monitoring</span>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 px-5 py-2.5 rounded-full border border-zinc-800">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-sm">Local AI Guidance</span>
        </div>
      </div>

      {/* Button */}
      <Link 
        href="/login" 
        className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 text-lg animate-in fade-in zoom-in duration-500 delay-700"
      >
        <Shield className="w-5 h-5" />
        Guard Now
      </Link>
    </div>
  );
}
