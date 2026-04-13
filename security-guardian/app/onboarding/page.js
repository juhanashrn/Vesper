"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Shield, Sparkles, CheckCircle, Server, Globe, Database } from "lucide-react";
import { motion } from "framer-motion";

export default function Onboarding() {
    const router = useRouter();
    const [securityKey, setSecurityKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const [answers, setAnswers] = useState({
        authMethod: "OAuth/SSO",
        exposesApi: "Yes",
        deploymentEnv: "Cloud (AWS/GCP/Azure)",
        handlesSensData: "Yes",
        dependencyScan: "Automated via CI/CD",
    });

    useEffect(() => {
        const key = localStorage.getItem("securityKey");
        if (!key) {
            router.push("/signup");
        } else {
            setSecurityKey(key);
        }
    }, [router]);

    const questions = [
        {
            id: "authMethod",
            title: "How does the application authenticate users?",
            icon: <Shield className="w-8 h-8 text-blue-400 mb-4" />,
            options: ["OAuth/SSO", "Passwords + MFA", "Passwords Only", "No Authentication"],
        },
        {
            id: "exposesApi",
            title: "Does the application expose any public APIs?",
            icon: <Globe className="w-8 h-8 text-purple-400 mb-4" />,
            options: ["Yes", "Internal Only", "No"],
        },
        {
            id: "deploymentEnv",
            title: "Where is the product deployed?",
            icon: <Server className="w-8 h-8 text-indigo-400 mb-4" />,
            options: ["Cloud (AWS/GCP/Azure)", "On-Premises", "Hybrid", "Serverless / Edge"],
        },
        {
            id: "handlesSensData",
            title: "Does it process or store sensitive user data (PII, Financial, Health)?",
            icon: <Database className="w-8 h-8 text-rose-400 mb-4" />,
            options: ["Yes", "No"],
        },
        {
            id: "dependencyScan",
            title: "How often are dependencies and third-party libraries scanned?",
            icon: <CheckCircle className="w-8 h-8 text-green-400 mb-4" />,
            options: ["Automated via CI/CD", "Manual regular scans", "Never / Not tracked"],
        },
    ];

    const handleSelect = (option) => {
        const questionId = questions[currentStep].id;
        setAnswers((prev) => ({ ...prev, [questionId]: option }));
    };

    const nextStep = async () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setLoading(true);
            try {
                // Insert answers to Supabase table
                // This expects a table named 'product_questionnaire' to exist in your Supabase project.
                const { error } = await supabase.from("product_questionnaire").insert([
                    {
                        security_key: securityKey,
                        auth_method: answers.authMethod,
                        exposes_api: answers.exposesApi,
                        deployment_env: answers.deploymentEnv,
                        handles_sensitive_data: answers.handlesSensData,
                        dependency_scan: answers.dependencyScan,
                    },
                ]);

                if (error) {
                    console.error("Supabase insert error:", error);
                }

                // Trigger RAG ingestion so local AI has client context
                try {
                    await fetch("http://localhost:5000/rag/ingest", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ securityKey }),
                    });
                } catch (ragErr) {
                    console.warn("RAG ingestion skipped:", ragErr.message);
                }

                // Progress to dashboard after saving
                router.push("/dashboard");
            } catch (err) {
                console.error("Error saving onboarding details:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10"
            >
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="w-8 h-8 text-blue-500" />
                    <h1 className="text-2xl font-bold tracking-tight">Vesper Profiler</h1>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-800 h-2 rounded-full mb-8 overflow-hidden">
                    <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Question Area */}
                <div className="min-h-[280px]">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {questions[currentStep].icon}
                        <h2 className="text-2xl font-medium mb-6">{questions[currentStep].title}</h2>

                        <div className="space-y-4">
                            {questions[currentStep].options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleSelect(option)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${answers[questions[currentStep].id] === option
                                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                                        : "bg-zinc-800/30 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
                                        }`}
                                >
                                    <span className="font-medium">{option}</span>
                                    {answers[questions[currentStep].id] === option && (
                                        <CheckCircle className="w-5 h-5 text-blue-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Navigation */}
                <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0 || loading}
                        className="px-6 py-2.5 rounded-xl font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>

                    <button
                        onClick={nextStep}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">Processing...</span>
                        ) : currentStep === questions.length - 1 ? (
                            <span className="flex items-center gap-2">Complete <Sparkles className="w-4 h-4 ml-1" /></span>
                        ) : (
                            "Continue"
                        )}
                    </button>
                </div>
            </motion.div >
        </div >
    );
}