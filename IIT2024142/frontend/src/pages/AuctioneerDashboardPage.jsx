import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { Shield, AlertTriangle, Eye, Clock, CheckCircle2, XCircle, Search, Video } from "lucide-react";
import { api } from "../lib/api";
import { AuctionCard } from "../components/AuctionCard";
import { getServerNow } from "../hooks/useServerTime";

export const AuctioneerDashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'auctioneer') {
      navigate("/");
      return;
    }

    const fetchAuctions = async () => {
      try {
        const response = await api.get('/mediator/auctions');
        setAuctions(response);
      } catch (error) {
        console.error("Failed to fetch auctioneer auctions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [isAuthenticated, user, navigate]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/auctions/${id}/mediator-status`, { status });
      setAuctions(auctions.map(a => a.id === id ? { ...a, mediator_status: status } : a));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pendingAuctions = auctions.filter(a => a.mediator_status === 'pending');
  const acceptedAuctions = auctions.filter(a => a.mediator_status === 'accepted' || !a.mediator_status);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <header className="mb-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl md:text-7xl font-serif mb-6 tracking-tight flex items-center justify-center gap-4"
        >
          <Shield className="w-10 h-10 md:w-16 md:h-16 text-gold hidden md:block" />
          Auctioneer <span className="text-gold italic">Control Center</span>
        </motion.h1>
        <p className="text-ink/60 font-light tracking-widest uppercase text-xs">
          Manage Assignments & Monitor Consignments
        </p>
      </header>

      {pendingAuctions.length > 0 && (
        <div className="mb-16">
          <h2 className="text-sm uppercase tracking-widest font-bold text-ink/40 mb-6 border-b border-ink/10 pb-4">Consignment Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {pendingAuctions.map(auction => (
              <div key={auction.id} className="relative opacity-90 transition-transform hover:scale-[1.02]">
                <AuctionCard auction={auction} />
                <div className="mt-4 p-4 border border-ink/10 bg-white flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-ink/60 bg-gold/10 px-3 py-2 border border-gold/30">
                    <span>Offered Commission:</span>
                    <span className="text-gold text-sm">{Number(auction.mediator_commission || 0)}%</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => handleStatusChange(auction.id, 'accepted')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-ink text-white text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept
                    </button>
                    <button 
                      onClick={() => handleStatusChange(auction.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-ink/10 text-ink text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm uppercase tracking-widest font-bold text-ink/40 mb-6 border-b border-ink/10 pb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Active Consignments Managed By You
        </h2>
        
        {acceptedAuctions.length === 0 ? (
          <div className="text-center py-20 md:py-32 border border-dashed border-ink/10 bg-white/50">
            <Search className="w-12 h-12 text-ink/20 mx-auto mb-4" />
            <p className="text-ink/40 font-serif italic text-xl md:text-2xl">No active consignments are currently assigned to you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {acceptedAuctions.map(auction => (
              <div key={auction.id} className="relative transition-transform hover:scale-[1.02]">
                <AuctionCard auction={auction} />
                <div className="mt-4 p-4 border border-ink/10 bg-white shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-ink/60 border-b border-ink/5 pb-2">
                    <span>Flags: <strong className={auction.flag_count > 0 ? 'text-red-500' : 'text-green-600'}>{auction.flag_count}</strong></span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(auction.end_time) > getServerNow() ? 'Active' : 'Ending'}</span>
                  </div>
                  <Link 
                    to={`/auction/${auction.id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors"
                  >
                    <Video className="w-4 h-4" /> Go to Studio Room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
