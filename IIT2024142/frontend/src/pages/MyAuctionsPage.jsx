import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { AuctionCard } from "../components/AuctionCard";
import { getServerNow } from "../hooks/useServerTime";

export const MyAuctionsPage = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [mediators, setMediators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignForm, setAssignForm] = useState({ auctionId: null, mediatorId: "", commission: "5" });
  const [auctioneerSearch, setAuctioneerSearch] = useState("");

  // Fetch Auctions once
  useEffect(() => {
    if (user?.id) {
      api.get(`/auctions?seller_id=${user.id}`)
        .then(setAuctions)
        .catch(err => console.error("Failed to fetch auctions", err))
        .finally(() => setLoading(false));
    } else if (user !== undefined) {
      // user is null (not logged in) - stop the spinner
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch Mediators with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      api.get(`/users/auctioneers?search=${auctioneerSearch}`)
        .then(setMediators);
    }, 400);

    return () => clearTimeout(timer);
  }, [auctioneerSearch]);

  const handleAssignMediator = async () => {
    if (!assignForm.mediatorId || assignForm.commission === "") return;
    try {
      await api.put(`/auctions/${assignForm.auctionId}/assign-mediator`, { 
        mediator_id: assignForm.mediatorId,
        commission: assignForm.commission
      });
      setAuctions(auctions.map(a => a.id === assignForm.auctionId ? { ...a, mediator_id: assignForm.mediatorId } : a));
      setAssignForm({ auctionId: null, mediatorId: "", commission: "" });
    } catch (err) {
      console.error("Failed to assign auctioneer", err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <header className="mb-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-7xl font-serif mb-6 tracking-tight"
        >
          My <span className="text-gold italic">Consignments</span>
        </motion.h1>
        <p className="text-ink/60 font-light tracking-widest uppercase text-xs">
          Manage Your Submitted Items
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {auctions.map(auction => (
          <div key={auction.id} className="relative">
            <AuctionCard auction={auction} />
            <div className="mt-4 p-4 border border-ink/10 bg-white shadow-sm">
              {auction.mediator_id ? (
                <div className="text-xs text-ink/60 font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gold"></span> Auctioneer Assigned
                </div>
              ) : (
                <>
                  {new Date(auction.end_time) <= getServerNow() ? (
                    <div className="text-xs text-ink/40 font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-ink/20"></span> Auction Ended
                    </div>
                  ) : (
                    <>
                      {assignForm.auctionId === auction.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleAssignMediator(); }} className="space-y-3">
                          <div>
                            <div className="space-y-2">
                              <input 
                                type="text"
                                placeholder="Search auctioneer..."
                                className="w-full p-2 border border-ink/10 text-[10px] uppercase outline-none focus:border-gold"
                                value={auctioneerSearch}
                                onChange={(e) => setAuctioneerSearch(e.target.value)}
                              />
                              <select 
                                className="w-full p-2 border border-ink/10 text-sm focus:border-gold outline-none"
                                value={assignForm.mediatorId}
                                onChange={(e) => setAssignForm({ ...assignForm, mediatorId: e.target.value })}
                              >
                                <option value="" disabled>Choose...</option>
                                {mediators.map(m => (
                                  <option key={m.id} value={m.id}>{m.name} (Rating: {m.rating})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold mb-1">Commission %:</p>
                            <input 
                              type="number"
                              placeholder="e.g. 5"
                              className="w-full p-2 border border-ink/10 text-sm focus:border-gold outline-none"
                              value={assignForm.commission}
                              onChange={(e) => setAssignForm({ ...assignForm, commission: e.target.value })}
                              min="0"
                              max="100"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="submit"
                              disabled={!assignForm.mediatorId || assignForm.commission === ""}
                              className="flex-1 py-2 bg-ink text-white text-[10px] uppercase tracking-widest font-bold hover:bg-gold disabled:opacity-50 transition"
                            >
                              Confirm
                            </button>
                            <button 
                              type="button"
                              onClick={() => setAssignForm({ auctionId: null, mediatorId: "", commission: "" })} 
                              className="py-2 px-4 border border-ink/10 text-ink text-[10px] uppercase tracking-widest font-bold hover:bg-ink/5"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button 
                          onClick={() => setAssignForm({ auctionId: auction.id, mediatorId: "", commission: "" })}
                          className="w-full py-2 bg-ink text-white text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition"
                        >
                          Assign Auctioneer
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {auctions.length === 0 && (
        <div className="text-center py-32 border border-dashed border-ink/10 bg-white/50">
          <Search className="w-12 h-12 text-ink/20 mx-auto mb-4" />
          <p className="text-ink/40 font-serif italic text-2xl">You haven't submitted any items yet.</p>
        </div>
      )}
    </div>
  );
};
