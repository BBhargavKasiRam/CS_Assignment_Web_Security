import React from "react";
import { motion } from "motion/react";
import { X, Truck, Package, MapPin, CheckCircle2, Clock } from "lucide-react";

export const TrackingModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const getStatus = (stepIndex) => {
    const statusMap = {
      Pending: 1,
      Shipped: 2,
      "In Transit": 2.5,
      "Local Hub": 3,
      Delivered: 4
    };
    
    const currentStatusLevel = statusMap[order.shipping_status] || 0;
    
    // Step 0: Order Placed (Always done)
    if (stepIndex === 0) return "completed";
    
    // Step 1: Payment Verified
    if (stepIndex === 1) {
      return order.payment_status === "Paid" ? "completed" : "current";
    }
    
    // Step 2: Shipped from Gallery
    if (stepIndex === 2) {
      if (currentStatusLevel >= 2) return "completed";
      if (order.payment_status === "Paid") return "current";
      return "upcoming";
    }

    // Step 3: Local Hub
    if (stepIndex === 3) {
      if (currentStatusLevel >= 3) return "completed";
      if (currentStatusLevel >= 2) return "current";
      return "upcoming";
    }

    // Step 4: Delivered
    if (stepIndex === 4) {
      if (currentStatusLevel >= 4) return "completed";
      if (currentStatusLevel >= 3) return "current";
      return "upcoming";
    }

    return "upcoming";
  };

  const steps = [
    { 
      title: "Order Placed", 
      date: new Date(order.won_at).toLocaleDateString(), 
      status: getStatus(0), 
      icon: <Package className="w-5 h-5" /> 
    },
    { 
      title: "Payment Verified", 
      date: order.payment_status === "Paid" ? "Confirmed" : "Awaiting Payment", 
      status: getStatus(1), 
      icon: <CheckCircle2 className="w-5 h-5" /> 
    },
    { 
      title: "Shipped from Gallery", 
      date: order.shipping_status === "Shipped" || getStatus(2) === "completed" ? "Dispatched" : "Pending", 
      status: getStatus(2), 
      icon: <Truck className="w-5 h-5" /> 
    },
    { 
      title: "Arrival at Local Hub", 
      date: getStatus(3) === "completed" ? "Arrived" : "In Transit", 
      status: getStatus(3), 
      icon: <MapPin className="w-5 h-5" /> 
    },
    { 
      title: "Delivered", 
      date: order.shipping_status === "Delivered" ? "Received" : "Expected soon", 
      status: getStatus(4), 
      icon: <CheckCircle2 className="w-5 h-5" /> 
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-center p-4 md:p-12 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl shadow-2xl relative h-fit overflow-hidden mb-12"
      >
        <div className="sticky top-0 z-20 p-8 border-b border-ink/5 flex justify-between items-center bg-white/90 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-serif font-bold">Track Shipment</h2>
            <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mt-1">
              Order #{order.id.toString().padStart(4, "0")} • {order.title}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-6 py-2 bg-ink text-paper text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition-all"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>

        <div className="p-10">
          <div className="flex flex-col gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-6 items-start relative">
                {idx !== steps.length - 1 && (
                  <div className={`absolute left-[22px] top-10 w-[2px] h-[calc(100%-10px)] ${step.status === "completed" ? "bg-gold" : "bg-ink/10"}`} />
                )}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  step.status === "completed" ? "bg-gold text-ink" : 
                  step.status === "current" ? "bg-ink text-paper animate-pulse" : "bg-ink/5 text-ink/20"
                }`}>
                  {step.icon}
                </div>
                <div className="pt-1">
                  <h4 className={`text-sm font-bold uppercase tracking-widest ${step.status === "upcoming" ? "text-ink/30" : "text-ink"}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-ink/40 mt-1 font-light flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {step.date}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-paper/50 border border-ink/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white flex items-center justify-center border border-ink/5 shadow-sm">
                <Truck className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold">Courier</p>
                <p className="text-sm font-serif">{order.courier_name || "Assigning Logistics Partner..."}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold">Waybill / Tracking</p>
                <p className="text-sm font-mono">{order.tracking_number || "PENDING-ASSIGNMENT"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
