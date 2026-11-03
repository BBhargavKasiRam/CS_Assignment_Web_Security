import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart3, TrendingUp, Package, Activity,
  DollarSign, Trophy, ArrowLeft, Gavel, Star
} from "lucide-react";
import { api } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from "recharts";

const StatCard = ({ title, value, icon: Icon, accentClass = "bg-gold", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 relative overflow-hidden group hover-lift"
  >
    <div className={`absolute top-0 left-0 w-1 h-full ${accentClass}`} />
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[10px] uppercase tracking-widest text-ink/60 font-bold">{title}</h3>
      <Icon className="w-5 h-5 text-gold/60 group-hover:text-gold transition-colors" />
    </div>
    <p className="text-2xl sm:text-3xl md:text-4xl font-serif text-ink letterpress">{value}</p>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gold/20 shadow-[0_8px_24px_rgba(42,35,24,0.15)] px-4 py-3 rounded-xl text-sm">
        <p className="font-bold mb-1 text-gold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-[11px] uppercase tracking-widest text-ink">
            {p.name}: <span className="font-bold">${Number(p.value).toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const SellerAnalyticsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellerRating, setSellerRating] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== "consignor" && user?.role !== "seller")) {
      navigate("/");
      return;
    }

    const fetchAll = async () => {
      try {
        const [data, ratingData] = await Promise.all([
          api.get("/auctions/seller-analytics"),
          api.get(`/reviews/${user.id}`).catch(() => null)
        ]);
        setAnalytics(data);
        if (ratingData) setSellerRating(ratingData);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-ink/40 font-serif italic text-xl">
        Failed to load analytics data.
      </div>
    );
  }

  const hasRevenueData = analytics.revenueByMonth && analytics.revenueByMonth.length > 0;
  const hasTopItems = analytics.topItems && analytics.topItems.length > 0;
  const winRate = analytics.total_auctions > 0
    ? Math.round((analytics.total_sold / analytics.total_auctions) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 relative text-ink">
      <div className="absolute top-20 left-20 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {/* Header */}
      <header className="mb-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink/50 font-bold mb-6 hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight flex items-center gap-4 text-ink letterpress">
              <BarChart3 className="w-8 h-8 text-gold" />
              Analytics Dashboard
            </h1>
            <p className="text-ink/60 uppercase tracking-widest text-xs mt-3 font-bold">
              Performance Overview · <span className="text-gold">{user?.name}</span>
            </p>
          </div>

          {/* Trust Score */}
          {sellerRating && sellerRating.totalReviews > 0 && (
            <div className="flex items-center gap-3 px-6 py-4 glass-card border border-gold/20 hover-lift">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${s <= Math.round(sellerRating.averageRating) ? "fill-gold text-gold" : "text-ink/10"}`}
                  />
                ))}
              </div>
              <div>
                <p className="font-bold text-lg font-serif leading-none text-ink">{sellerRating.averageRating}</p>
                <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold">
                  Trust Score · {sellerRating.totalReviews} review{sellerRating.totalReviews !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        <StatCard title="Total Revenue" value={`$${Number(analytics.total_revenue || 0).toLocaleString()}`} icon={DollarSign} accentClass="bg-gold" delay={0} />
        <StatCard title="Total Auctions" value={analytics.total_auctions || 0} icon={Package} accentClass="bg-blue-600" delay={0.05} />
        <StatCard title="Active Listings" value={analytics.active_auctions || 0} icon={Activity} accentClass="bg-green-600" delay={0.1} />
        <StatCard title="Avg. Sale Price" value={`$${Number(analytics.average_sale_price || 0).toLocaleString()}`} icon={TrendingUp} accentClass="bg-purple-600" delay={0.15} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="glass-card p-6 text-center hover-lift">
          <p className="text-[10px] uppercase tracking-widest text-ink/60 font-bold mb-2">Completed Sales</p>
          <p className="text-3xl font-serif text-gold">{analytics.total_sold || 0}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="glass-card p-6 text-center hover-lift">
          <p className="text-[10px] uppercase tracking-widest text-ink/60 font-bold mb-2">Win Rate</p>
          <p className="text-3xl font-serif text-green-700">{winRate}%</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="glass-card p-6 text-center col-span-2 md:col-span-1 hover-lift">
          <p className="text-[10px] uppercase tracking-widest text-ink/60 font-bold mb-2">Trust Score</p>
          <p className="text-3xl font-serif text-gold">
            {sellerRating?.totalReviews > 0 ? `${sellerRating.averageRating} ★` : "No reviews"}
          </p>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-card p-8 mb-8">
        <div className="flex items-center justify-between mb-8 border-b border-ink/10 pb-4">
          <div>
            <h2 className="text-xl font-serif text-ink">Revenue Over Time</h2>
            <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold mt-1">Last 6 Months</p>
          </div>
          <TrendingUp className="w-5 h-5 text-gold" />
        </div>

        {hasRevenueData ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics.revenueByMonth} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,35,24,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "monospace", fill: "rgba(42,35,24,0.5)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: "monospace", fill: "rgba(42,35,24,0.5)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f59e0b" strokeWidth={3} fill="url(#revenueGradient)"
                dot={{ fill: "#f59e0b", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#ea580c", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-ink/30 border border-dashed border-ink/15 rounded-xl">
            <BarChart3 className="w-12 h-12 mb-3 text-ink/20" />
            <p className="text-sm font-serif italic text-ink/40">Revenue data will appear here once auctions end.</p>
          </div>
        )}
      </motion.div>

      {/* Auctions Count Bar Chart */}
      {hasRevenueData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-8 mb-8">
          <div className="flex items-center justify-between mb-8 border-b border-ink/10 pb-4">
            <div>
              <h2 className="text-xl font-serif text-ink">Auctions Completed</h2>
              <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold mt-1">Per Month</p>
            </div>
            <Gavel className="w-5 h-5 text-gold/60" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.revenueByMonth} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,35,24,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "monospace", fill: "rgba(42,35,24,0.5)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: "monospace", fill: "rgba(42,35,24,0.5)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="auctions_count" name="Auctions" radius={[4, 4, 0, 0]}>
                {analytics.revenueByMonth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === analytics.revenueByMonth.length - 1 ? "#f59e0b" : "rgba(245,158,11,0.3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Top Items Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="glass-card p-8">
        <div className="flex items-center justify-between mb-8 border-b border-ink/10 pb-4">
          <div>
            <h2 className="text-xl font-serif text-ink">Top Performing Items</h2>
            <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold mt-1">Highest Sale Prices</p>
          </div>
          <Trophy className="w-5 h-5 text-gold" />
        </div>

        {hasTopItems ? (
          <div className="divide-y divide-ink/10">
            {analytics.topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 group hover:bg-gold/5 px-4 -mx-4 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-gold text-white shadow-[0_4px_12px_rgba(197,160,89,0.4)]" : "bg-ink/10 text-ink/60"}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm text-ink group-hover:text-gold transition-colors">{item.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold">
                      {new Date(item.end_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-serif font-bold text-gold">${Number(item.sale_price).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-ink/15 rounded-xl">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-ink/20" />
            <p className="text-sm font-serif italic text-ink/40">Top items will appear once your auctions complete.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
