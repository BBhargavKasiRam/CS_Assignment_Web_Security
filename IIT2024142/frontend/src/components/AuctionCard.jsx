import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Clock, ChevronRight, Edit3, Video, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { getServerNow } from "../hooks/useServerTime";

export const AuctionCard = ({ auction }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [sellerRating, setSellerRating] = useState(null);
  const { user } = useAuth();

  const isConsignor = user && auction && user.id === auction.seller_id;
  const isEnded = auction && new Date(auction.end_time) <= getServerNow();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = getServerNow();
      const end = new Date(auction.end_time).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Ended");
        setIsUrgent(false);
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
        setIsUrgent(hours === 0 && mins < 30); // Urgent if < 30 mins left
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [auction.end_time]);

  // Fetch seller trust score
  useEffect(() => {
    if (auction?.seller_id) {
      api.get(`/reviews/${auction.seller_id}`)
        .then(data => {
          if (data && data.totalReviews > 0) setSellerRating(data);
        })
        .catch(() => {});
    }
  }, [auction?.seller_id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group glass-card p-6 border-white/5 hover:border-accent/30 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,240,255,0.15)] flex flex-col relative overflow-hidden"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"></div>
      
      {/* Auction image if exists */}
      {auction.image && (
        <div className="relative w-full aspect-[4/3] mb-6 overflow-hidden rounded-xl bg-surface/50 border border-white/5">
          <img
            src={auction.image}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-700" />
          {!isEnded && auction.mediator_id && (
            <div className="absolute top-3 left-3 bg-red-500/80 backdrop-blur-md text-white px-3 py-1.5 text-[8px] uppercase tracking-widest font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20 z-10 rounded-full border border-red-400/30 animate-pulse-red">
              <Video className="w-3 h-3" />
              Live
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50">
            Owner: {auction.seller_name}
          </span>
          {sellerRating && (
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  className={`w-2.5 h-2.5 ${s <= Math.round(sellerRating.averageRating) ? "fill-accent text-accent glow-text" : "text-white/10"}`}
                />
              ))}
              <span className="text-[9px] text-ink/40 ml-0.5">{sellerRating.averageRating}</span>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isUrgent ? 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse-red shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 bg-white/5 text-accent/80'}`}>
          <Clock className={`w-3 h-3 ${isUrgent ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-mono font-medium tracking-wider">{timeLeft}</span>
        </div>
      </div>

      <h3 className="text-2xl font-serif leading-tight mb-3 text-ink group-hover:text-accent group-hover:glow-text transition-all relative z-10">
        {auction.title}
      </h3>
      <p className="text-sm text-ink/70 line-clamp-2 mb-6 font-light leading-relaxed flex-1 relative z-10">
        {auction.description}
      </p>

      <div className="mb-6 relative z-10 p-4 rounded-xl bg-surface-light/30 border border-white/5 group-hover:border-accent/20 transition-colors">
        <span className="text-[10px] uppercase tracking-widest text-ink/50 block mb-1">
          Current Bid
        </span>
        <span className="text-2xl font-serif font-bold text-accent glow-text">
          ${Number(auction.current_price).toLocaleString()}
        </span>
      </div>

      {/* Role-based action buttons */}
      <div className="flex flex-col gap-3 mt-auto relative z-10">
        {isConsignor && !isEnded && (
          <Link
            to={`/auction/${auction.id}?edit=true`}
            className="flex items-center justify-center gap-2 px-4 py-3 glass-button text-ink/70 text-[9px] uppercase tracking-[0.3em] font-bold hover:text-accent hover:border-accent/50 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Consignment
          </Link>
        )}

        <Link
          to={`/auction/${auction.id}`}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-accent/10 border border-accent/30 text-accent text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-accent hover:text-surface hover:glow-accent rounded-lg transition-all duration-300 group/btn shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]"
        >
          See Auction
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
};