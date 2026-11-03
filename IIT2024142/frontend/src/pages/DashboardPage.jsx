import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  Package, 
  User, 
  Clock, 
  Plus, 
  ChevronRight,
  Gavel,
  ShieldAlert,
  DollarSign
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { AuctionCard } from "../components/AuctionCard";

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    stat1: { label: 'Active Auctions', value: 0, icon: Gavel },
    stat2: { label: 'Items Won', value: 0, icon: Package },
    stat3: { label: 'My Consignments', value: 0, icon: TrendingUp }
  });
  const [recentAuctions, setRecentAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        
        // Fetch recent active auctions for the bottom gallery section
        const auctions = await api.get("/auctions?status=active");
        setRecentAuctions(auctions.slice(0, 3));

        let statData = { ...stats };

        if (user.role === 'buyer') {
          let orders = [];
          try { orders = await api.get("/orders"); } catch(e) {}
          
          statData = {
            stat1: { label: 'Active Auctions', value: auctions.length, icon: Gavel },
            stat2: { label: 'Items Won', value: orders.length || 0, icon: Package },
            stat3: { label: 'Active Bids', value: '-', icon: TrendingUp }
          };
        } else if (user.role === 'consignor' || user.role === 'seller') {
          let analytics = {};
          try { analytics = await api.get("/auctions/seller-analytics"); } catch(e) {}
          
          statData = {
            stat1: { label: 'Total Auctions', value: analytics.total_auctions || 0, icon: Package },
            stat2: { label: 'Active Listings', value: analytics.active_auctions || 0, icon: Clock },
            stat3: { label: 'Total Revenue', value: `$${analytics.total_revenue || 0}`, icon: DollarSign }
          };
        } else if (user.role === 'auctioneer' || user.role === 'mediator') {
          let medAuctions = [];
          try { medAuctions = await api.get("/mediators/auctions"); } catch(e) {}
          
          const pending = medAuctions.filter(a => a.mediator_status === 'pending').length;
          
          statData = {
            stat1: { label: 'Assigned Auctions', value: medAuctions.length || 0, icon: ShieldAlert },
            stat2: { label: 'Pending Requests', value: pending, icon: Clock },
            stat3: { label: 'Active Sessions', value: medAuctions.length - pending, icon: Gavel }
          };
        }
        
        setStats(statData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 relative">
      <div className="absolute top-20 left-20 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <span className="text-sm uppercase tracking-[0.3em] text-gold font-bold mb-4 block letterpress">Member Dashboard</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif tracking-tight text-ink">Welcome, <span className="italic text-gold">{user?.name}</span></h1>
        </div>
        {(user?.role === 'consignor' || user?.role === 'seller') && (
          <Link 
            to="/create" 
            className="px-8 py-4 bg-gold text-white text-sm uppercase tracking-widest font-bold hover:bg-ink transition-all flex items-center gap-3 hover-lift shadow-[0_4px_16px_rgba(197,160,89,0.3)] rounded"
          >
            <Plus className="w-4 h-4" />
            Consign New Item
          </Link>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {[stats.stat1, stats.stat2, stats.stat3].map((stat, i) => (
          <div key={i} className="glass-card p-10 relative overflow-hidden group hover-lift border border-ink/5">
            <div className="absolute top-0 right-0 p-4 text-gold/10 group-hover:text-gold/20 transition-colors">
              <stat.icon className="w-24 h-24 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
            </div>
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-widest text-ink/50 font-bold mb-4">{stat.label}</p>
              <p className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold text-gold">{stat.value}</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
        <Link to="/gallery" className="lg:col-span-2 glass-panel p-10 flex flex-col justify-between group hover:border-gold/50 hover:shadow-[0_8px_30px_rgba(197,160,89,0.15)] transition-all hover-lift border border-ink/5">
          <h3 className="text-4xl font-serif mb-8 text-ink group-hover:text-gold transition-colors">Explore the Gallery</h3>
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-gold">View All Auctions</span>
            <ChevronRight className="w-6 h-6 text-gold group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

        <Link to="/orders" className="glass-panel p-10 flex flex-col justify-between group hover:border-gold/30 transition-all hover-lift border border-ink/5">
          <h3 className="text-3xl font-serif mb-8 group-hover:text-gold transition-colors text-ink">My Orders</h3>
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-ink/50 group-hover:text-gold transition-colors">Track Purchases</span>
            <ChevronRight className="w-5 h-5 text-ink/40 group-hover:text-gold group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        <Link to="/profile" className="glass-panel p-10 flex flex-col justify-between group hover:border-gold/30 transition-all hover-lift border border-ink/5">
          <h3 className="text-3xl font-serif mb-8 group-hover:text-gold transition-colors text-ink">Account</h3>
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-ink/50 group-hover:text-gold transition-colors">Manage Profile</span>
            <ChevronRight className="w-5 h-5 text-ink/40 group-hover:text-gold group-hover:translate-x-2 transition-all" />
          </div>
        </Link>
      </div>

      {/* Recent Auctions */}
      <section>
        <div className="flex justify-between items-end mb-10 border-b border-ink/10 pb-4">
          <h2 className="text-4xl font-serif text-ink">Featured Acquisitions</h2>

          <Link to="/gallery" className="text-xs uppercase tracking-widest font-bold text-gold hover:underline transition-all flex items-center gap-2 group">
            View All Gallery
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {recentAuctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </section>
    </div>
  );
};
