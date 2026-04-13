"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Shield, User, Mail, Building, LayoutGrid, ArrowRight } from "lucide-react";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    product: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from('clients')
        .select('*')
        .eq('email', form.email.trim().toLowerCase())
        .limit(1)
        .single();

      if (existingUser) {
        alert("An account with this email/name already exists!");
        setLoading(false);
        return;
      }

      const generatedKey = Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

      const { error } = await supabase.from('clients').insert([{
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        company: form.company,
        product: form.product,
        security_key: generatedKey
      }]);

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Failed to create account: " + error.message);
        return;
      }

      localStorage.setItem("securityKey", generatedKey);
      router.push("/onboarding");
    } catch (err) {
      console.error(err);
      alert("Error signing up.");
    } finally {
      setLoading(false);
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
            <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="mt-2 text-zinc-400">Join thousands of companies securing their infrastructure</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Full Name</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Email Address</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Company</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  name="company"
                  type="text"
                  required
                  value={form.company}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Target Product</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LayoutGrid className="h-5 w-5 text-zinc-500" />
                </div>
                <select
                  name="product"
                  required
                  value={form.product}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm appearance-none"
                >
                  <option value="" disabled className="bg-zinc-900">Select Product</option>
                  <option value="Web App" className="bg-zinc-900">Web App</option>
                  <option value="Mobile App" className="bg-zinc-900">Mobile App</option>
                  <option value="API" className="bg-zinc-900">API</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-zinc-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Sign up"}
                {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-zinc-400">
                Already have a key?{" "}
                <a href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                  Log in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}