import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { AuctionCard } from "../components/AuctionCard";

export const HomePage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auctions?status=active")
      .then(setAuctions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh] relative">
      <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full w-64 h-64 mx-auto my-auto animate-pulse"></div>
      <Loader2 className="w-12 h-12 animate-spin text-accent glow-text relative z-10" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <header className="mb-16 text-center relative z-10">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-serif mb-6 tracking-tight text-ink"
        >
          Bidvora <span className="text-accent italic glow-text">Elite</span>
        </motion.h1>
        <p className="text-ink/60 font-light tracking-widest uppercase text-xs">
          The Premier Destination for Rare Acquisitions
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
        {auctions.map(auction => (
          <div key={auction.id}>
            <AuctionCard auction={auction} />
          </div>
        ))}
      </div>
      
      {auctions.length === 0 && (
        <div className="text-center py-32 glass-panel border-dashed border-white/10 relative z-10">
          <Search className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-ink/40 font-serif italic text-2xl">The gallery is currently empty.</p>
          <p className="text-xs uppercase tracking-widest text-ink/30 mt-2">Check back soon for new arrivals</p>
        </div>
      )}
    </div>
  );
};

