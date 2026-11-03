import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";

export const ReviewModal = ({ isOpen, onClose, order }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/reviews", {
        auction_id: order.id,
        reviewee_id: order.seller_id,
        rating,
        comment
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setRating(0);
        setComment("");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white max-w-md w-full relative shadow-2xl"
        >
          {success ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-3xl font-serif mb-2">Thank You</h3>
              <p className="text-ink/50 text-sm">Your review has been successfully submitted.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-ink/10 flex justify-between items-center bg-paper/50">
                <div>
                  <h2 className="text-xl font-serif">Rate {order.seller_name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-1">
                    Lot #{order.id.toString().padStart(4, "0")}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full transition-colors text-ink/50 hover:text-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-l-2 border-red-600">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="text-center">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40 block mb-4">
                    Select a rating
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className={`p-2 transition-transform ${hoveredRating >= star || rating >= star ? "scale-110" : ""}`}
                      >
                        <Star 
                          className={`w-8 h-8 ${hoveredRating >= star || rating >= star ? "fill-gold text-gold" : "text-ink/10"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40 block mb-2">
                    Add a comment (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-ink/10 bg-paper/30 p-4 min-h-[100px] outline-none focus:border-gold text-sm"
                    placeholder="Describe your experience with this consignor..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className="w-full py-4 bg-ink text-paper text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition-colors disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
