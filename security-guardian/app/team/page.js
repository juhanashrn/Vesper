"use client";

import { useState } from "react";
import { Shield, Key, Search, Database, Globe, Server, Info, Building, LayoutGrid, User, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamAccess() {
    const [keyInput, setKeyInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const verifyKey = async (e) => {
        e.preventDefault();
        if (!keyInput.trim()) return;

        setLoading(true);
        setResult(null);
        setErrorMsg("");

        try {
            const { data: clientData, error: clientErr } = await supabase
                .from("clients")
                .select("*")
                .eq("security_key", keyInput.trim().toUpperCase())
                .limit(1)
                .single();

            const { data: qData } = await supabase
                .from("product_questionnaire")
                .select("*")
                .eq("security_key", keyInput.trim().toUpperCase())
                .limit(1)
                .single();

            if (clientErr || !clientData) {
                setErrorMsg("Invalid Security Key or no data found. Please try again.");
            } else {
                setResult({ client: clientData, q: qData });
            }
        } catch (err) {
            setErrorMsg("Error connecting to database.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl z-10"
            >
                <div className="text-center mb-8">
                    <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold tracking-tight">Team Portal</h1>
                    <p className="text-zinc-400 mt-2">Enter a client's Security Key to review their product's threat model architecture.</p>
                </div>

                {/* Input Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl mb-6">
                    <form onSubmit={verifyKey} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-zinc-500" />
                            </div>
                            <input
                                type="text"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                                placeholder="Ex: COMP-XYZ123"
                                className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-xl bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono uppercase"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !keyInput}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : (
                                <>
                                    <Search className="w-4 h-4" />
                                    Access
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Error State */}
                <AnimatePresence>
                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3"
                        >
                            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{errorMsg}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results Area */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="bg-zinc-800/50 p-4 border-b border-zinc-800 flex justify-between items-center">
                                <h3 className="font-semibold px-2">Client Architecture Profile</h3>
                                <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-mono">
                                    VERIFIED
                                </span>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Basic Client Info */}
                                <div>
                                    <h4 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-3">Client Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                                            <Building className="w-5 h-5 text-blue-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Company</p>
                                                <p className="font-medium text-white">{result.client.company}</p>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                                            <LayoutGrid className="w-5 h-5 text-purple-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Product Name</p>
                                                <p className="font-medium text-white">{result.client.product}</p>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                                            <User className="w-5 h-5 text-zinc-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Contact Details</p>
                                                <p className="font-medium text-white">{result.client.name} &bull; {result.client.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Architecture Info */}
                                {result.q ? (
                                    <div className="pt-4 border-t border-zinc-800/50">
                                        <h4 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-3">Architecture & Threat Data</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                                                <Shield className="w-5 h-5 text-indigo-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Authentication Method</p>
                                                    <p className="font-medium text-white">{result.q.auth_method}</p>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                                                <Globe className="w-5 h-5 text-emerald-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">API Exposure</p>
                                                    <p className="font-medium text-white">{result.q.exposes_api}</p>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                                                <Server className="w-5 h-5 text-orange-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Deployment Env</p>
                                                    <p className="font-medium text-white">{result.q.deployment_env}</p>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                                                <Database className="w-5 h-5 text-rose-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Sensitive Data</p>
                                                    <p className="font-medium text-white">{result.q.handles_sensitive_data}</p>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-start gap-3 md:col-span-2">
                                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Dependencies & CI/CD</p>
                                                    <p className="font-medium text-white">{result.q.dependency_scan}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-zinc-800/50">
                                        <p className="text-zinc-500 italic">This client has not filled out their detailed architecture questionnaire yet.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    );
}
