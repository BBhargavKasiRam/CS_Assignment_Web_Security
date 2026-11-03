import React from "react";
import { motion } from "motion/react";
import { X, Download, Printer, Gavel, ShieldCheck } from "lucide-react";

export const InvoiceModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center p-4 md:p-12 bg-ink/60 backdrop-blur-sm print:static print:p-0 print:bg-white overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-4xl shadow-2xl relative h-fit print:shadow-none print:max-w-none print:m-0 mb-12 print:block"
      >
        {/* Actions Bar - Sticky at top */}
        <div className="sticky top-0 z-20 p-4 border-b border-ink/5 flex justify-between items-center bg-white/90 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-gold" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Digital Certificate of Acquisition</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-paper border border-ink/10 text-ink text-[10px] uppercase tracking-widest font-bold hover:bg-ink hover:text-paper transition-all"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose} 
              className="flex items-center gap-2 px-6 py-2 bg-ink text-paper text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition-all"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-16 print:p-10 font-serif">
          <header className="flex justify-between items-start mb-20">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Gavel className="w-10 h-10 text-gold" />
                <span className="text-3xl font-bold tracking-tight">BIDVORA</span>
              </div>
              <div className="text-xs text-ink/60 font-sans uppercase tracking-widest leading-loose">
                124 Collector's Row<br />
                Art District, London<br />
                United Kingdom, SE1 9AL
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-6xl font-light tracking-tighter mb-4 text-ink/10 uppercase">Invoice</h1>
              <div className="space-y-1">
                <p className="text-[10px] font-sans uppercase tracking-widest text-ink/40 font-bold">Invoice Number</p>
                <p className="text-xl font-sans font-bold">#INV-{order.id.toString().padStart(6, "0")}</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-20 mb-20 font-sans">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/30 mb-4">Billed To</p>
              <p className="text-lg font-bold mb-1">Valued Collector</p>
              <p className="text-xs text-ink/60 leading-relaxed">
                Registered Member<br />
                Global Acquisition Network
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/30 mb-4">Acquisition Details</p>
              <p className="text-sm"><span className="text-ink/40 font-bold uppercase tracking-widest mr-2">Won On:</span> {new Date(order.won_at).toLocaleDateString()}</p>
              <p className="text-sm"><span className="text-ink/40 font-bold uppercase tracking-widest mr-2">End Price:</span> ${Number(order.price).toLocaleString()}</p>
            </div>
          </div>

          <table className="w-full mb-20 font-sans">
            <thead className="border-b-2 border-ink">
              <tr>
                <th className="text-left py-4 text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Description</th>
                <th className="text-right py-4 text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Quantity</th>
                <th className="text-right py-4 text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Price</th>
                <th className="text-right py-4 text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              <tr>
                <td className="py-8">
                  <p className="font-bold text-lg mb-1">{order.title}</p>
                  <p className="text-xs text-ink/40 italic">Sold by {order.seller_name}</p>
                </td>
                <td className="text-right py-8 text-sm">1</td>
                <td className="text-right py-8 text-sm">${Number(order.price).toLocaleString()}</td>
                <td className="text-right py-8 text-sm font-bold">${Number(order.price).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end font-sans">
            <div className="w-full max-w-xs space-y-4">
              <div className="flex justify-between text-xs uppercase tracking-widest">
                <span className="text-ink/40">Subtotal</span>
                <span>${Number(order.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs uppercase tracking-widest">
                <span className="text-ink/40">Shipping & Insurance</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-xs uppercase tracking-widest">
                <span className="text-ink/40">Buyer's Premium (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="pt-4 border-t border-ink flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Total Amount</span>
                <span className="text-3xl font-serif font-bold text-gold">${Number(order.price).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <footer className="mt-40 pt-10 border-t border-ink/5 font-sans flex justify-between items-center">
            <div className="flex items-center gap-3 text-gold">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-ink/40">Verified Acquisition • Bidvora Integrity Guarantee</span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-ink/20 font-bold">Thank you for your patronage</p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
};
