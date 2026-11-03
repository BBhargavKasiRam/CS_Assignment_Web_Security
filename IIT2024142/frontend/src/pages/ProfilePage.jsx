import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Shield, Settings, Edit3, Save, X, CheckCircle2, AlertCircle, Camera, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [trustScore, setTrustScore] = useState(null);
  
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Sync formData with user when user changes or when cancelling edit mode
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
      });
      setPreviewUrl(user.profile_image || null);
    }
  }, [user, isEditing]);

  useEffect(() => {
    if (user?.id) {
      api.get(`/reviews/${user.id}`)
        .then(data => setTrustScore(data))
        .catch(() => {});
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    twoFactorAuth: false,
    publicProfile: true,
  });

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleUpdatePreferences = () => {
    setSuccess("Preferences updated successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      return setError("Name and email are required");
    }

    try {
      setLoading(true);
      setError("");
      
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("role", formData.role);
      if (selectedImage) {
        data.append("profile_image", selectedImage);
      }
      
      const response = await api.put("/auth/profile", data);
      
      // Update local auth context
      updateUser(response.user);
      
      setSuccess("Profile updated successfully");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-20">
      <header className="mb-20 text-center relative">
        <div className="relative w-32 h-32 mx-auto mb-8 group">
          <div className="w-full h-full bg-ink text-paper rounded-full flex items-center justify-center text-5xl font-serif shadow-2xl border-4 border-gold/20 overflow-hidden">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => {
              handleImageChange(e);
              setIsEditing(true);
            }} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -right-2 -bottom-2 w-10 h-10 bg-gold text-ink rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
            title="Change Photo"
          >
            <Camera size={18} />
          </button>
        </div>
        
        {isEditing ? (
          <div className="max-w-xs mx-auto">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-4xl font-serif mb-2 tracking-tight text-center w-full border-b border-gold bg-transparent outline-none pb-2"
              autoFocus
            />
          </div>
        ) : (
          <h1 className="text-5xl font-serif mb-4 tracking-tight">{user?.name}</h1>
        )}
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">Elite Member since 2026</p>

        {/* Trust Score Badge */}
        {trustScore && trustScore.totalReviews > 0 && (
          <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-gold/5 border border-gold/20">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(trustScore.averageRating) ? "fill-gold text-gold" : "text-ink/10"}`}
                />
              ))}
            </div>
            <div className="text-left">
              <p className="font-bold font-serif leading-none">{trustScore.averageRating} Trust Score</p>
              <p className="text-[9px] uppercase tracking-widest text-ink/40">{trustScore.totalReviews} review{trustScore.totalReviews !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </header>

      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-12 p-5 text-[10px] flex items-start gap-3 uppercase font-bold border-l-2 shadow-sm ${
              error ? "bg-red-50 text-red-600 border-red-600" : "bg-gold/10 text-gold border-gold"
            }`}
          >
            {error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{error || success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-12">
          <section className="bg-white border border-ink/5 p-10 shadow-xl relative">
            <form onSubmit={(e) => { e.preventDefault(); if (isEditing) handleSaveProfile(); }}>
              <div className="flex justify-between items-center mb-10 border-b border-ink/5 pb-4">
                 <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-ink/40">Personal Information</h3>
                 {isEditing && (
                   <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="text-ink/40 hover:text-ink transition-colors"
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="text-gold hover:text-gold/80 transition-colors"
                        title="Save Changes"
                      >
                        {loading ? <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                      </button>
                   </div>
                 )}
              </div>
              
              <div className="space-y-10">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-ink/5 flex items-center justify-center text-ink/30 rounded-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="grow">
                    <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold mb-1">Full Name</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="text-lg font-serif w-full border-b border-gold/30 bg-transparent outline-none focus:border-gold"
                      />
                    ) : (
                      <p className="text-lg font-serif">{user?.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-ink/5 flex items-center justify-center text-ink/30 rounded-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="grow">
                    <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold mb-1">Email Address</p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="text-lg font-serif w-full border-b border-gold/30 bg-transparent outline-none focus:border-gold"
                      />
                    ) : (
                      <p className="text-lg font-serif">{user?.email}</p>
                    )}
                  </div>
                </div>
  
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-ink/5 flex items-center justify-center text-ink/30 rounded-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="grow">
                    <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold mb-1">Account Role</p>
                    {isEditing ? (
                      <div className="flex gap-2 mt-1">
                        {['buyer', 'consignor', 'auctioneer'].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setFormData({ ...formData, role: r })}
                            className={`flex-1 py-1 text-[8px] uppercase tracking-widest font-bold border rounded-full transition-all ${
                              formData.role === r ? "bg-gold text-ink border-gold" : "text-ink/40 border-ink/10 hover:border-ink/20"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-lg font-serif capitalize">{user?.role}</p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </section>

          <section className="bg-white border border-ink/5 p-10 shadow-xl">
            <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-ink/40 mb-10 border-b border-ink/5 pb-4">Security</h3>
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-ink/5 flex items-center justify-center text-ink/30 rounded-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold mb-1">Account Status</p>
                  <p className="text-lg font-serif text-green-600">Verified & Secured</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="bg-ink border border-ink/5 p-12 shadow-2xl relative overflow-hidden text-paper">
          <div className="absolute top-0 right-0 p-8 text-white/5">
            <Settings className="w-32 h-32 rotate-12" />
          </div>
          <h3 className="text-2xl font-serif mb-12 text-gold">Preferences</h3>
          <div className="space-y-10 relative z-10">
            <div className="flex justify-between items-center group">
              <span className="text-sm uppercase tracking-widest group-hover:text-gold transition-colors">Email Notifications</span>
              <div
                onClick={() => togglePreference("emailNotifications")}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                  preferences.emailNotifications ? "bg-gold" : "bg-paper/20"
                }`}
              >
                <motion.div
                  animate={{ x: preferences.emailNotifications ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                />
              </div>
            </div>

            <div className="flex justify-between items-center group">
              <span className="text-sm uppercase tracking-widest group-hover:text-gold transition-colors">Two-Factor Auth</span>
              <div
                onClick={() => togglePreference("twoFactorAuth")}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                  preferences.twoFactorAuth ? "bg-gold" : "bg-paper/20"
                }`}
              >
                <motion.div
                  animate={{ x: preferences.twoFactorAuth ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                />
              </div>
            </div>

            <div className="flex justify-between items-center group">
              <span className="text-sm uppercase tracking-widest group-hover:text-gold transition-colors">Public Profile</span>
              <div
                onClick={() => togglePreference("publicProfile")}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                  preferences.publicProfile ? "bg-gold" : "bg-paper/20"
                }`}
              >
                <motion.div
                  animate={{ x: preferences.publicProfile ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                />
              </div>
            </div>

            <button
              onClick={handleUpdatePreferences}
              className="w-full py-5 border border-white/10 text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-gold hover:text-ink transition-all mt-10 hover:border-gold"
            >
              Update Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reviews Section */}
      {trustScore && trustScore.totalReviews > 0 && (
        <section className="mt-12 bg-white border border-ink/5 p-10 shadow-xl">
          <div className="flex items-center justify-between mb-8 border-b border-ink/5 pb-4">
            <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-ink/40">Trust Score & Reviews</h3>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(trustScore.averageRating) ? "fill-gold text-gold" : "text-ink/10"}`}
                />
              ))}
              <span className="text-sm font-bold ml-1">{trustScore.averageRating}</span>
              <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold ml-1">
                ({trustScore.totalReviews} review{trustScore.totalReviews !== 1 ? "s" : ""})
              </span>
            </div>
          </div>
          <div className="space-y-6">
            {trustScore.reviews?.slice(0, 5).map((review, i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-ink/5 last:border-0">
                <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center font-serif text-base flex-shrink-0">
                  {review.reviewer_name?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-sm">{review.reviewer_name}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-gold text-gold" : "text-ink/10"}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-ink/60 font-light leading-relaxed">{review.comment}</p>
                  )}
                  <p className="text-[9px] uppercase tracking-widest text-ink/30 mt-2">
                    {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};