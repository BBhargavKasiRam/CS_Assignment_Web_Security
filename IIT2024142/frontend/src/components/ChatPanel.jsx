import React, { useState, useEffect, useRef } from "react";
import { Send, Shield, Trash2, MicOff, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export const ChatPanel = ({ auctionId, socket, sellerId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch initial chat history
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/${auctionId}`);
        setMessages(response.messages || []);
        if (user && response.mutedUsers?.includes(user.id)) {
            setIsMuted(true);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    fetchHistory();
  }, [auctionId, user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    };

    const handleUserMuted = ({ userId }) => {
      if (user?.id === userId) {
        setIsMuted(true);
      }
    };

    const handleChatError = ({ message }) => {
        alert(message);
    };

    socket.on("newChatMessage", handleNewMessage);
    socket.on("chatMessageDeleted", handleMessageDeleted);
    socket.on("userMuted", handleUserMuted);
    socket.on("chatError", handleChatError);

    return () => {
      socket.off("newChatMessage", handleNewMessage);
      socket.off("chatMessageDeleted", handleMessageDeleted);
      socket.off("userMuted", handleUserMuted);
      socket.off("chatError", handleChatError);
    };
  }, [socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !user || isMuted) return;

    socket.emit("sendChatMessage", {
      auctionId,
      userId: user.id,
      message: newMessage.trim(),
      isSystemMessage: false,
      user: { name: user.name, role: user.role }
    });

    setNewMessage("");
  };

  const deleteMessage = (messageId) => {
    if (socket && user?.role === 'mediator') {
      socket.emit("deleteChatMessage", { auctionId, messageId });
    }
  };

  const muteUser = (targetUserId) => {
    if (socket && user?.role === 'mediator') {
      socket.emit("muteUser", { auctionId, targetUserId, mediatorId: user.id });
    }
  };

  const resolveDispute = async () => {
    if (socket && user?.role === 'mediator') {
       socket.emit("sendChatMessage", {
          auctionId,
          userId: user.id,
          message: "Mediator: Dispute resolved. Proceed with bidding.",
          isSystemMessage: true,
          user: { name: user.name, role: user.role }
       });
       // Optional: Log to DB
       try {
         await api.post("/mediator/action", { auctionId, actionType: 'resolve_dispute', note: 'Dispute resolved in chat.' });
       } catch (e) {}
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-ink/10 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-ink/10 bg-paper/50 flex justify-between items-center">
        <div>
           <h3 className="text-sm font-bold uppercase tracking-widest text-ink">Live Chat</h3>
           <p className="text-[10px] text-ink/50 uppercase tracking-widest">Global Room</p>
        </div>
        {user?.role === 'mediator' && (
           <button 
             onClick={resolveDispute}
             className="text-[10px] bg-green-50 text-green-700 px-3 py-1 rounded border border-green-200 flex items-center gap-1 hover:bg-green-100 transition-colors"
           >
             <CheckCircle className="w-3 h-3" /> Resolve
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-stone-50/50">
        {messages.length === 0 ? (
          <p className="text-center text-ink/40 font-serif italic py-8">Room is quiet. Be the first to speak.</p>
        ) : (
          messages.map((msg, idx) => {
            const isMe = user?.id === msg.user_id;
            const isSystem = msg.is_system_message === 1 || msg.is_system_message === true;
            const isMediator = msg.user_role === 'mediator';
            const isSeller = msg.user_id === sellerId;

            if (isSystem) {
              return (
                <div key={msg.id || idx} className="flex justify-center my-2">
                  <span className="bg-ink/5 text-ink/60 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                    {msg.message}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${isMediator ? 'text-gold flex items-center gap-1' : isSeller ? 'text-blue-600' : 'text-ink/60'}`}>
                    {isMediator && <Shield className="w-3 h-3" />}
                    {msg.user_name} {isSeller ? '(Seller)' : ''} {isMe ? '(You)' : ''}
                  </span>
                  
                  {user?.role === 'mediator' && !isMe && !isMediator && (
                    <div className="hidden group-hover:flex items-center gap-1">
                       <button onClick={() => muteUser(msg.user_id)} title="Mute User" className="text-red-400 hover:text-red-600 p-1">
                         <MicOff className="w-3 h-3" />
                       </button>
                    </div>
                  )}
                </div>
                <div className={`relative max-w-[85%] px-4 py-2 text-sm leading-relaxed ${isMe ? "bg-ink text-paper" : isMediator ? "bg-gold/10 border border-gold/30 text-ink" : "bg-white border border-ink/10 text-ink"} shadow-sm`}>
                  {/* {msg.message} */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: msg.message
                    }}
                  />
                  {user?.role === 'mediator' && (
                     <button 
                       onClick={() => deleteMessage(msg.id)} 
                       className="absolute -right-6 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 hidden group-hover:block"
                       title="Delete Message"
                     >
                       <Trash2 className="w-3 h-3" />
                     </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-ink/10 bg-white">
        {isMuted ? (
           <div className="w-full py-2 px-4 bg-red-50 text-red-600 text-xs text-center border border-red-100 uppercase tracking-widest font-bold">
             You are muted by a mediator
           </div>
        ) : (
          <form onSubmit={sendMessage} className="relative flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full pl-4 pr-12 py-3 bg-paper/50 border border-ink/20 focus:border-gold outline-none transition-colors text-sm text-ink placeholder:text-ink/30"
              disabled={!user}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || !user}
              className="absolute right-2 p-2 text-ink/40 hover:text-gold disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
        {!user && <p className="text-[10px] text-center text-ink/50 mt-2 uppercase tracking-widest">Login to participate in chat</p>}
      </div>
    </div>
  );
};
