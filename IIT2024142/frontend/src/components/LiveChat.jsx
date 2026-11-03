import React, { useState, useEffect, useRef } from "react";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import { Send, Trophy, Star, Heart, Gavel } from "lucide-react";
import { api } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";

const USER_COLORS = [
  "text-blue-700", "text-red-700", "text-green-700", 
  "text-purple-700", "text-orange-700", "text-pink-700",
  "text-teal-700", "text-indigo-700", "text-amber-700"
];

const getUserColor = (userId) => {
  if (!userId) return "text-gold";
  return USER_COLORS[userId % USER_COLORS.length];
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export const LiveChat = React.memo(({ auctionId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    api.get(`/chat/${auctionId}`)
      .then((data) => {
        if (data && data.messages) {
          const formattedMessages = data.messages.map(m => ({
            id: m.id,
            senderId: m.user_id,
            senderName: m.user_name || (m.is_system_message ? "System" : "Unknown"),
            text: m.message,
            timestamp: m.created_at,
            isPayment: m.message.toLowerCase().includes("payment") || 
                       m.message.toLowerCase().includes("secured") ||
                       m.message.toLowerCase().includes("bid of")
          }));
          setMessages(formattedMessages);
        }
      })
      .catch(console.error);

    const socket = getSocket();
    socket.on("newChatMessage", (m) => {
      setMessages((prev) => [...prev, {
        id: m.id,
        senderId: m.user_id,
        senderName: m.user_name || (m.is_system_message ? "System" : "Unknown"),
        text: m.message,
        timestamp: m.created_at,
        isSystem: m.is_system_message,
        isPayment: m.message.toLowerCase().includes("payment") || 
                   m.message.toLowerCase().includes("secured") ||
                   m.message.toLowerCase().includes("bid of")
      }]);
    });

    return () => { socket.off("newChatMessage"); };
  }, [auctionId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    getSocket().emit("sendChatMessage", { auctionId, userId: user.id, message: inputText.trim(), isSystemMessage: false, user });
    setInputText("");
  };

  return (
    <div className="flex flex-col h-[600px] bg-white/90 border border-ink/10 shadow-[0_8px_32px_rgba(42,35,24,0.1)] rounded-2xl overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 border-b border-ink/10 bg-paper flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 text-ink">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live Auction Chat
        </h3>
        <div className="flex gap-2 text-gold/50">
          <Star className="w-3 h-3" />
          <Heart className="w-3 h-3" />
        </div>
      </div>
      
      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-paper/50">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-3 items-start p-2 rounded-lg transition-colors ${
                msg.isPayment ? 'bg-gold/10 border-l-2 border-gold -mx-2 px-4' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold bg-paper border border-ink/10 shadow-sm ${
                msg.isSystem ? 'text-gold' : getUserColor(msg.senderId)
              }`}>
                {msg.isSystem ? (
                  msg.text.toLowerCase().includes("bid") ? <Gavel className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />
                ) : getInitials(msg.senderName)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className={`text-[11px] font-bold ${msg.isSystem ? 'text-gold uppercase tracking-tighter' : getUserColor(msg.senderId)}`}>
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-ink/30 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed break-words ${msg.isPayment ? 'font-bold text-gold' : 'text-ink/80'}`}>
                  {/*msg.text*/}
                  <div
                      className={`text-sm leading-relaxed break-words ${
                        msg.isPayment ? 'font-bold text-gold' : 'text-ink/80'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: msg.text
                      }}
                  />
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-ink/10 bg-white">
        {user ? (
          <form onSubmit={sendMessage} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Say something..."
                className="w-full pl-0 pr-10 py-2 text-sm border-b-2 border-ink/20 outline-none focus:border-gold transition-all bg-transparent text-ink placeholder:text-ink/30"
                maxLength={200}
              />
              <button type="submit" disabled={!inputText.trim()} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gold hover:text-ink disabled:opacity-30 transition">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-ink/30 uppercase tracking-widest font-bold">{inputText.length}/200</span>
              <div className="flex gap-4 opacity-20">
                <Star className="w-3.5 h-3.5" />
                <Heart className="w-3.5 h-3.5" />
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-2">Join the conversation</p>
            <button className="text-[10px] uppercase tracking-widest text-gold font-bold hover:underline">Sign in to chat</button>
          </div>
        )}
      </div>
    </div>
  );
});
