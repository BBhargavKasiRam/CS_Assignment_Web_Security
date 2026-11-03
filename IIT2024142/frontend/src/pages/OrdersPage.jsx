import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, Truck, CheckCircle, ExternalLink, Trophy, CreditCard, ShieldCheck, AlertCircle, Star } from "lucide-react";
import { api } from "../lib/api";
import { TrackingModal } from "../components/TrackingModal";
import { InvoiceModal } from "../components/InvoiceModal";
import { PaymentModal } from "../components/PaymentModal";
import { ReviewModal } from "../components/ReviewModal";
import { OrderSkeleton } from "../components/OrderSkeleton";

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Modal states
  const [showTracking, setShowTracking] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await api.get("/orders");
      setOrders(data);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTrack = (order) => {
    setSelectedOrder(order);
    setShowTracking(true);
  };

  const handleInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const handlePayment = (order) => {
    setSelectedOrder(order);
    setShowPayment(true);
  };

  const handleReview = (order) => {
    setSelectedOrder(order);
    setShowReview(true);
  };


  if (loading) return (
    <div className="max-w-7xl mx-auto px-8 py-20 relative">
      <div className="absolute top-20 left-20 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <header className="mb-20">
        <div className="h-4 w-32 bg-ink/5 mb-4 animate-pulse rounded" />
        <div className="h-16 w-64 bg-ink/5 animate-pulse rounded" />
      </header>
      <div className="space-y-12">
        {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
      </div>
    </div>
  );


  return (
    <div className="max-w-7xl mx-auto px-8 py-20 relative text-ink">
      <div className="absolute top-20 left-20 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <header className="mb-20">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold mb-4 block letterpress">
          Acquisition History
        </span>
        <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-ink">My Orders</h1>
        {orders.length > 0 && (
          <p className="mt-4 text-ink/60 text-sm font-light">
            {orders.length} winning acquisition{orders.length !== 1 ? "s" : ""}
          </p>
        )}
      </header>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-4 text-[11px] uppercase tracking-widest font-bold border-l-4 bg-red-50 text-red-700 border-red-600 rounded-r"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-12">
        <AnimatePresence>
          {orders.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="glass-card p-10 flex flex-col lg:flex-row gap-12 hover:border-gold/30 hover:shadow-[0_12px_40px_rgba(42,35,24,0.12)] transition-all hover-lift group border border-ink/5"
            >
              {/* Image */}
              <div className="w-full lg:w-64 h-64 bg-ink/5 border border-ink/10 rounded-xl overflow-hidden flex-shrink-0 relative shadow-inner">
                {order.image ? (
                  <img
                    src={order.image}
                    alt={order.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/20">
                    <Package className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2 py-1 bg-gold/20 border border-gold/50 text-gold text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-1 backdrop-blur-sm rounded">
                  <Trophy className="w-3 h-3" />
                  Won
                </div>
              </div>

              {/* Details */}
              <div className="grow flex flex-col justify-between py-2">
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold block mb-2">
                        Auction #{order.id.toString().padStart(4, "0")}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-serif group-hover:text-gold transition-colors text-ink">
                        {order.title}
                      </h3>
                      <p className="text-sm text-ink/60 mt-1 font-light">
                        Sold by <span className="font-bold text-ink/80">{order.seller_name}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold block mb-2">
                        Winning Bid
                      </span>
                      <span className="text-2xl sm:text-3xl font-serif font-bold text-gold">
                        ${Number(order.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-12 flex-wrap bg-ink/5 border border-ink/10 p-6 rounded-xl">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold mb-2">
                        Won On
                      </p>
                      <p className="text-sm font-light text-ink">
                        {new Date(order.won_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold mb-2">
                        Payment Status
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${order.payment_status === 'Paid' ? 'bg-green-600' : 'bg-gold animate-pulse'}`} />
                        <p className={`text-sm font-bold uppercase tracking-widest ${order.payment_status === 'Paid' ? 'text-green-700' : 'text-gold'}`}>
                          {order.payment_status}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold mb-2">
                        Shipment Status
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${order.payment_status === 'Paid' ? 'bg-gold' : 'bg-ink/20'}`} />
                        <p className={`text-sm font-bold uppercase tracking-widest ${order.payment_status === 'Paid' ? 'text-gold' : 'text-ink/40'}`}>
                          {order.payment_status === 'Paid' ? 'Processing' : 'Awaiting Payment'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-8">
                  {order.payment_status === 'Pending' ? (
                    <button
                      onClick={() => handlePayment(order)}
                      className="bg-gold hover:bg-ink text-white flex items-center gap-3 px-8 py-3 text-[10px] uppercase tracking-widest font-bold shadow-[0_4px_12px_rgba(197,160,89,0.3)] hover:shadow-[0_6px_20px_rgba(42,35,24,0.3)] rounded transition-all hover-lift"
                    >
                      <CreditCard className="w-4 h-4" />
                      Secure Payment
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTrack(order)}
                      className="bg-ink hover:bg-gold text-paper flex items-center gap-3 px-8 py-3 text-[10px] uppercase tracking-widest font-bold rounded transition-all hover-lift shadow-[0_4px_12px_rgba(42,35,24,0.2)]"
                    >
                      <Truck className="w-4 h-4" />
                      Track Shipment
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleInvoice(order)}
                    className="border border-ink/20 text-ink hover:border-gold hover:text-gold flex items-center gap-3 px-8 py-3 text-[10px] uppercase tracking-widest font-bold rounded transition-all bg-white shadow-[0_2px_8px_rgba(42,35,24,0.05)]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Invoice
                  </button>

                  {order.payment_status === 'Paid' && (
                    <>
                      <button
                        onClick={() => handleReview(order)}
                        className="border border-ink/20 text-ink hover:border-gold hover:text-gold flex items-center gap-3 px-8 py-3 text-[10px] uppercase tracking-widest font-bold rounded transition-all bg-white shadow-[0_2px_8px_rgba(42,35,24,0.05)]"
                      >
                        <Star className="w-4 h-4" />
                        Leave Review
                      </button>
                      <div className="flex items-center gap-2 ml-auto text-green-700 bg-green-50 px-4 py-2 border border-green-200 rounded-lg">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] uppercase tracking-widest font-bold">Guaranteed by Bidvora</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && orders.length === 0 && (
          <div className="text-center py-40 glass-panel border-dashed border-ink/10 text-ink/40">
            <Trophy className="w-16 h-16 text-ink/10 mx-auto mb-6" />
            <p className="text-2xl font-serif italic mb-4 text-ink/50">
              No winning bids yet.
            </p>
            <p className="text-[10px] uppercase tracking-widest text-ink/30">
              Start bidding to build your collection
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <TrackingModal 
        isOpen={showTracking} 
        onClose={() => setShowTracking(false)} 
        order={selectedOrder} 
      />
      <InvoiceModal 
        isOpen={showInvoice} 
        onClose={() => setShowInvoice(false)} 
        order={selectedOrder} 
      />
      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => {
          setShowPayment(false);
          fetchOrders(); // Refresh status after payment
        }} 
        order={selectedOrder} 
      />
      <ReviewModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        order={selectedOrder}
      />
    </div>
  );
};