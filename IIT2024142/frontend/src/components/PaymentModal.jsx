import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, Globe, ChevronDown, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";

// Removed CheckoutForm as Razorpay uses its own modal

export const PaymentModal = ({ isOpen, onClose, order }) => {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !order) return;

    const fetchCurrencies = async () => {
      try {
        const data = await api.get("/payments/currencies");
        setCurrencies(data);
        const usd = data.find(c => c.code === "USD");
        setSelectedCurrency(usd);
        setConvertedAmount(Number(order.price));
      } catch (err) {
        console.error("Failed to fetch currencies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, [isOpen, order?.price]);

  const handleCurrencySelect = async (currency) => {
    if (!order) return;
    setSelectedCurrency(currency);
    setShowCurrencyDropdown(false);
    try {
      const data = await api.get(`/payments/convert?amount=${order.price}&currency=${currency.code}`);
      setConvertedAmount(data.converted);
    } catch (err) {
      console.error("Conversion failed:", err);
    }
  };

  const handlePayment = async () => {
    if (!selectedCurrency || processing) return;

    setProcessing(true);
    setError(null);

    try {
      // 1. Create order on backend
      const { orderId, amount, currency } = await api.post("/payments/create-order", {
        auctionId: order.id,
        currency: selectedCurrency.code,
      });

      // 2. Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "Bidvora",
        description: `Acquisition of ${order.title}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            setProcessing(true);
            // 3. Verify payment on backend
            const verifyRes = await api.post("/payments/verify-payment", {
              ...response,
              auctionId: order.id
            });

            if (verifyRes.success) {
              handleSuccess();
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            setError("Error verifying payment signature.");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: "Valued Collector",
        },
        theme: {
          color: "#00F0FF",
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error.description);
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Payment initialization failed:", err);
      setError(err.message || "Failed to initialize secure payment gateway.");
      setProcessing(false);
    }
  };

  const handleSuccess = (paymentIntent) => {
    // Broadcast to live chat
    getSocket().emit("sendChatMessage", {
      auctionId: order.id,
      userId: null,
      message: `A collector has just secured this acquisition with a successful payment!`,
      isSystemMessage: true,
      user: { name: "System", role: "system" }
    });

    setIsPaid(true);
    setTimeout(() => {
      onClose();
      setIsPaid(false);
    }, 3000);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 md:p-12 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card w-full max-w-lg relative h-fit border border-white/10 overflow-hidden"
      >
        <div className="sticky top-0 z-20 p-8 border-b border-white/5 flex justify-between items-center bg-surface/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/50 text-accent flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-ink">Secure Checkout</h2>
              <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold">Auction Acquisition</p>
            </div>
          </div>
          {!isPaid && (
            <button 
              onClick={onClose} 
              className="flex items-center gap-2 px-4 py-2 glass-button text-ink/70 text-[10px] uppercase tracking-widest font-bold hover:text-red-400 hover:border-red-400/50 transition-all"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          )}
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {isPaid ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-accent/20 border border-accent/50 rounded-full flex items-center justify-center mx-auto mb-8 text-accent shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-serif mb-4 text-ink glow-text">Payment Successful</h3>
                <p className="text-ink/60 text-sm font-light max-w-xs mx-auto">
                  Your acquisition of <strong className="text-accent">{order.title}</strong> has been secured. Our curators will begin shipment processing shortly.
                </p>
              </motion.div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-accent glow-text" />
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent/70 animate-pulse">Initializing Secure Gateway</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-10"
              >
                {/* Summary */}
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-2xl font-serif font-bold mb-1 text-ink">{order.title}</h4>
                    <p className="text-xs text-ink/50 font-light">Original price: ${Number(order.price).toLocaleString()} USD</p>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className="flex items-center gap-2 px-4 py-2 glass-button text-[10px] uppercase tracking-widest font-bold text-ink/80 hover:text-accent hover:border-accent/50 transition-all"
                    >
                      <Globe className="w-4 h-4 text-accent" />
                      {selectedCurrency?.code}
                      <ChevronDown className={`w-3 h-3 transition-transform ${showCurrencyDropdown ? "rotate-180" : ""}`} />
                    </button>
                    
                    {showCurrencyDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-white/10 shadow-2xl rounded-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                        {currencies.map(c => (
                          <button
                            key={c.code}
                            onClick={() => handleCurrencySelect(c)}
                            className="w-full px-6 py-4 text-left hover:bg-white/5 flex items-center justify-between group transition-colors"
                          >
                            <div>
                              <span className="text-[10px] font-bold text-ink group-hover:text-accent">{c.code}</span>
                              <p className="text-[9px] text-ink/50 uppercase tracking-tighter">{c.name}</p>
                            </div>
                            <span className="text-xs font-serif italic text-ink/40">{c.symbol}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-end border-b border-white/5 pb-8">
                   <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/50">Total Payment Due</p>
                   <div className="text-right">
                     <span className="text-5xl font-serif font-bold text-accent glow-text">
                       {selectedCurrency?.symbol}{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                     </span>
                   </div>
                </div>

                <div className="space-y-8">
                  {error && (
                    <div className="flex gap-3 p-4 bg-red-500/10 text-red-400 text-xs items-center border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={processing}
                      className="flex-1 py-4 text-[10px] uppercase tracking-widest font-bold border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50 rounded-xl text-ink/70"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={processing || !selectedCurrency}
                      className="flex-[2] py-4 glass-button bg-accent/20 border-accent/50 text-accent text-[10px] uppercase tracking-widest font-bold hover:bg-accent hover:text-surface hover:glow-accent transition-all relative overflow-hidden group disabled:opacity-50 rounded-xl"
                    >
                      {processing ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Initializing...
                        </div>
                      ) : (
                        `Pay ${selectedCurrency?.symbol}${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} Now`
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-6 opacity-30 grayscale">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                     <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5" alt="Mastercard" />
                     <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="PayPal" />
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-ink/20 font-bold leading-relaxed">
                    By clicking "Pay Now", you authorize Bidvora to process this transaction securely. <br />
                    Taxes and insurance are included in the final amount.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
