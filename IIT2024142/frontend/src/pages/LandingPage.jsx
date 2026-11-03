import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Gavel, Shield, Zap, Globe, ArrowRight } from "lucide-react";

export const LandingPage = () => {
  return (
    <div className="overflow-hidden bg-paper relative">
      {/* Background ambient lighting */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10" />
          <img 
            src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Art" 
            className="w-full h-full object-cover scale-105"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="relative z-20 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[10px] uppercase tracking-[0.5em] text-accent glow-text font-bold mb-6 block">Est. 2026</span>
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-serif text-white mb-8 tracking-tighter leading-none glow-text">
              The Art of <br />
              <span className="italic text-accent">Acquisition</span>
            </h1>
            <p className="text-white/80 text-lg font-light tracking-widest uppercase mb-12 max-w-2xl mx-auto leading-relaxed">
              Access the world's most exclusive auctions. Rare masterpieces, timeless treasures, and digital artifacts curated for the discerning collector.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link 
                to="/register" 
                className="px-12 py-5 bg-accent/20 border border-accent/50 text-accent text-xs uppercase tracking-[0.3em] font-bold hover:bg-accent hover:text-surface hover:glow-accent transition-all rounded-full flex items-center gap-3 group hover-lift shadow-[0_0_20px_rgba(0,240,255,0.2)]"
              >
                Join the Circle
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="px-12 py-5 glass-button text-white text-xs uppercase tracking-[0.3em] font-bold hover:bg-white/10 transition-all rounded-full hover-lift"
              >
                Member Login
              </Link>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-[1px] h-12 bg-accent/50 shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-8 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 40 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="space-y-6 glass-panel p-8 md:p-10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,240,255,0.1)] group"
            >
              <div className="w-16 h-16 bg-surface border border-white/5 flex items-center justify-center text-accent rounded-2xl group-hover:glow-accent transition-all">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-serif text-ink group-hover:text-accent transition-colors">Verified Provenance</h3>
              <p className="text-ink/60 font-light leading-relaxed">
                Every item listed on Bidvora undergoes a rigorous multi-stage authentication process by world-class experts.
              </p>
            </motion.div>
            
            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 40 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -10 }}
              className="space-y-6 glass-panel p-8 md:p-10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,240,255,0.1)] group"
            >
              <div className="w-16 h-16 bg-surface border border-white/5 flex items-center justify-center text-accent rounded-2xl group-hover:glow-accent transition-all">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-serif text-ink group-hover:text-accent transition-colors">Real-Time Bidding</h3>
              <p className="text-ink/60 font-light leading-relaxed">
                Our proprietary low-latency engine ensures that every bid is recorded instantly, providing a seamless competitive experience.
              </p>
            </motion.div>
            
            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 40 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -10 }}
              className="space-y-6 glass-panel p-8 md:p-10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,240,255,0.1)] group"
            >
              <div className="w-16 h-16 bg-surface border border-white/5 flex items-center justify-center text-accent rounded-2xl group-hover:glow-accent transition-all">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-serif text-ink group-hover:text-accent transition-colors">Global Logistics</h3>
              <p className="text-ink/60 font-light leading-relaxed">
                White-glove delivery to over 180 countries. We handle the complexities of international shipping and insurance.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-40 px-8 relative text-center">
        <div className="max-w-4xl mx-auto relative z-10 glass-panel p-16 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <span className="text-accent text-6xl font-serif mb-8 block drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">"</span>
          <h2 className="text-5xl md:text-6xl font-serif italic leading-tight mb-12 text-ink">
            Value is not determined by the price paid, but by the rarity of the moment captured.
          </h2>
          <div className="w-20 h-[1px] bg-accent mx-auto mb-6 shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-accent/50">The Bidvora Manifesto</p>
        </div>
      </section>
    </div>
  );
};
