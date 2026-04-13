"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatWidget({ contextData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const name = localStorage.getItem("userName") || "Friend";
    if (messages.length === 0) {
      setMessages([{ sender: "bot", text: `Hi ${name}, I'm Vesper. How can I guide you to work effectively in our product today?` }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askAI = async () => {
    if (!input.trim() || !contextData) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage,
          context: contextData,
        })
      });
      const responseData = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: responseData.answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I am having trouble connecting to the server." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center group"
            >
              <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[360px] max-h-[600px] bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden"
          >
            <div className="bg-zinc-800/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Vesper AI</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 block"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 h-[350px] overflow-y-auto space-y-4 bg-zinc-950/50">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1">
                      {msg.sender === "user" ? (
                        <div className="bg-zinc-700 rounded-full w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-zinc-300" /></div>
                      ) : (
                        <div className="bg-blue-600 rounded-full w-full h-full flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
                      )}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.sender === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-zinc-800 text-zinc-100 rounded-tl-sm shadow-sm"}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-zinc-800 text-zinc-100 rounded-tl-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-zinc-900 border-t border-zinc-800">
              <form onSubmit={(e) => { e.preventDefault(); askAI(); }} className="flex items-center relative">
                <input
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your security..."
                  disabled={isChatLoading}
                />
                <button type="submit" disabled={!input.trim() || isChatLoading} className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
