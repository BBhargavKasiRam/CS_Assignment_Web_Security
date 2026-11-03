import React, { useState, useEffect, useRef } from "react";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import { Send, Lock } from "lucide-react";
import { api } from "../lib/api";

export const PrivateChat = React.memo(({ auctionId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    api.get(`/auctions/${auctionId}/mediator-messages`)
      .then((data) => {
        setMessages(data.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          text: m.message,
          timestamp: m.created_at
        })));
      })
      .catch(console.error);

    const socket = getSocket();
    socket.on("receive-mediator-message", (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    return () => { socket.off("receive-mediator-message"); };
  }, [auctionId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const messageData = {
      id: Date.now() + Math.random(),
      senderId: user.id,
      senderName: user.name,
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      await api.post(`/auctions/${auctionId}/mediator-messages`, { message: inputText.trim() });
      getSocket().emit("send-mediator-message", { auctionId, messageData });
      setMessages((prev) => [...prev, messageData]);
      setInputText("");
    } catch (err) {
      console.error("Failed to send private message", err);
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-white/90 border border-gold/30 shadow-[0_8px_32px_rgba(42,35,24,0.12)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gold/20 bg-gold/5">
        <h3 className="text-xs uppercase tracking-widest font-bold flex items-center gap-2 text-ink">
          <Lock className="w-3.5 h-3.5 text-gold" />
          Private Coordination Chat
        </h3>
        <p className="text-[9px] text-ink/50 uppercase tracking-widest mt-1">Only visible to Consignor &amp; Auctioneer</p>
      </div>
      
      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper/40">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`text-sm flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-[10px] uppercase tracking-widest text-ink/50 mb-1 font-bold">{isMe ? "You" : msg.senderName}</span>
              <div className={`px-4 py-2 rounded-xl max-w-[80%] ${
                isMe
                  ? "bg-gold/15 text-ink border border-gold/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  : "bg-white border border-ink/10 text-ink/80 shadow-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gold/20 bg-white">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Secure message..."
            className="flex-1 px-3 py-2 text-sm border border-ink/20 rounded-lg outline-none focus:border-gold bg-paper text-ink placeholder:text-ink/30 transition-colors"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-gold text-white rounded-lg hover:bg-ink disabled:opacity-40 transition shadow-[0_2px_8px_rgba(197,160,89,0.3)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
});
