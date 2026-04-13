"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Shield, Key, ArrowRight } from "lucide-react";

export default function Login() {
    const [key, setKey] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!key.trim()) {
            setError("Please enter a valid security key");
            return;
        }

        try {
            const { data, error } = await supabase
                .from('clients')
                .select('security_key')
                .eq('security_key', key.trim().toUpperCase())
                .limit(1)
                .single();

            if (error || !data) {
                setError("Invalid security key. Please check again.");
                return;
            }

            localStorage.setItem("securityKey", key.trim().toUpperCase());
            router.push("/dashboard");
        } catch (err) {
            console.error(err);
            setError("Error connecting to database.");
        }
    };

    return (
        <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans">
            {/* Left side pattern overlay */}
            <div className="hidden lg:flex flex-1 relative bg-zinc-900 justify-center items-center overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "radial-gradient(#3f3f46 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
                <div className="z-10 flex flex-col items-center max-w-md text-center">
                    <Shield className="w-24 h-24 text-blue-500 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">Vesper</h1>
                    <p className="text-zinc-400 text-lg">
                        Built in your hands , guarded in ours
                    </p>
                </div>
            </div>

            {/* Right side form */}
            <div className="flex flex-1 justify-center items-center p-8 bg-zinc-950">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-zinc-400">Enter your security key to access your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="key" className="block text-sm font-medium text-zinc-300">
                                    Security Key
                                </label>
                                <div className="mt-2 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input
                                        id="key"
                                        name="key"
                                        type="text"
                                        required
                                        value={key}
                                        onChange={(e) => {
                                            setKey(e.target.value);
                                            setError("");
                                        }}
                                        className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                        placeholder="COMP-XXXXXXXX"
                                    />
                                </div>
                                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-zinc-950 transition-colors"
                            >
                                Access Dashboard
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="text-center mt-4">
                            <p className="text-sm text-zinc-400">
                                Don't have a key?{" "}
                                <a href="/signup" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                                    Sign up
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
