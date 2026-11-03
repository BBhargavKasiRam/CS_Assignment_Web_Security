import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Search, User, Briefcase, Star, Check, ChevronDown, Camera, Upload, ArrowRight, Clock, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";

export const CreateAuctionPage = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [mediators, setMediators] = useState([]);
  const [selectedMediator, setSelectedMediator] = useState(null);
  const [commission, setCommission] = useState("5");

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchAuctioneers = async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/users/auctioneers?search=${searchTerm}`);
        setMediators(response);
      } catch (err) {
        console.error("Failed to fetch auctioneers", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAuctioneers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; 

    if (!title.trim() || title.trim().length < 3)
      return setError("Title must be at least 3 characters");

    if (description.trim().length < 10)
      return setError("Description must be at least 10 characters");

    if (!startingPrice || Number(startingPrice) <= 0)
      return setError("Reserve price must be a positive number");

    if (!durationHours || Number(durationHours) <= 0)
      return setError("Please specify a valid duration");

    if (!image) {
      return setError("Please upload an image");
    }

    if (!selectedMediator) {
      return setError("Please select an auctioneer to manage your consignment");
    }

    try {
      setLoading(true);
      setError("");

      const durationSeconds = Math.floor(Number(durationHours) * 3600);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("starting_price", startingPrice);
      formData.append("duration", durationSeconds);
      formData.append("mediator_id", selectedMediator.id);
      formData.append("commission", commission);
      formData.append("image", image);

      await api.post("/auctions", formData);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans overflow-hidden selection:bg-gold/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gold/10 rounded-full blur-[120px] mix-blend-multiply animate-pulse-glow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-accent/5 rounded-full blur-[150px] mix-blend-multiply"></div>
        <div className="absolute top-[40%] left-[50%] w-[40vw] h-[40vw] bg-gold/5 rounded-full blur-[100px] mix-blend-multiply -translate-x-1/2"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-12 lg:h-screen lg:flex lg:flex-col">
        <header className="mb-10 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tighter text-ink letterpress">
              Launch Asset
            </h1>
            <p className="text-ink/60 mt-2 font-medium tracking-wide uppercase text-xs">Configure your next high-value listing</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-full border border-ink/10 bg-white/50 flex items-center justify-center hover:bg-white hover:border-gold transition-colors shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-ink/40" />
          </button>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-center gap-3 shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <div className="lg:flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:min-h-0">
          
          {/* Left Column: Interactive Form */}
          <div className="lg:col-span-7 xl:col-span-6 flex flex-col lg:h-full lg:overflow-y-auto pr-4 custom-scrollbar pb-32 lg:pb-0">
            <form id="create-auction-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Media Upload (Hero area of form) */}
              <div 
                onClick={() => fileInputRef.current.click()}
                className="group relative w-full h-72 rounded-3xl overflow-hidden bg-white/50 shadow-md border border-ink/10 cursor-pointer hover:border-gold hover:shadow-lg transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Preview" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-ink/40 group-hover:text-gold transition-colors bg-gold/5">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm border border-ink/5 group-hover:border-gold/30">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium tracking-widest uppercase">Upload Hero Image</p>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                  <span className="text-xs font-bold uppercase tracking-widest text-white shadow-sm">High Quality Recommended</span>
                  <div className="w-8 h-8 rounded-full bg-gold text-white shadow-md flex items-center justify-center"><Upload className="w-4 h-4" /></div>
                </div>
                <input type="file" ref={fileInputRef} hidden onChange={handleImageChange} accept="image/*" />
              </div>

              {/* Title & Desc */}
              <div className="space-y-6 glass-panel p-8 rounded-3xl">
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder=" "
                    className="block w-full px-0 py-4 text-3xl font-serif text-ink bg-transparent border-0 border-b-2 border-ink/10 appearance-none focus:outline-none focus:ring-0 focus:border-gold peer transition-colors"
                  />
                  <label className="absolute text-ink/40 text-lg duration-300 transform -translate-y-8 scale-75 top-4 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-8 peer-focus:text-gold font-serif">
                    Artifact Title
                  </label>
                </div>

                <div className="relative pt-4">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder=" "
                    className="block w-full px-0 py-4 text-lg font-light text-ink/70 bg-transparent border-0 border-b-2 border-ink/10 appearance-none focus:outline-none focus:ring-0 focus:border-gold peer transition-colors resize-none h-32"
                  />
                  <label className="absolute text-ink/40 text-lg duration-300 transform -translate-y-8 scale-75 top-8 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-8 peer-focus:text-gold font-sans font-light">
                    Detailed Story &amp; Provenance
                  </label>
                </div>
              </div>

              {/* Auction Configuration */}
              <div className="grid grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-gold transition-colors hover:shadow-md">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 group-hover:text-gold transition-all"><Shield className="w-16 h-16 text-ink" /></div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-4 block">Reserve Price</label>
                  <div className="flex items-end gap-2 relative z-10">
                    <span className="text-3xl font-light text-gold">$</span>
                    <input
                      type="number"
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent outline-none font-mono text-4xl text-ink placeholder:text-ink/20"
                    />
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-gold transition-colors hover:shadow-md">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 group-hover:text-gold transition-all"><Clock className="w-16 h-16 text-ink" /></div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-4 block">Duration</label>
                  <div className="flex items-end gap-2 relative z-10">
                    <input
                      type="number"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      placeholder="24"
                      className="w-full bg-transparent outline-none font-mono text-4xl text-ink placeholder:text-ink/20"
                    />
                    <span className="text-lg font-light text-ink/40 pb-1">HRS</span>
                  </div>
                </div>
              </div>

              {/* Mediator Selection */}
              <div className="glass-panel p-8 rounded-3xl" ref={dropdownRef}>
                <div className="flex justify-between items-center mb-6">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold block">Assign Auctioneer</label>
                  {selectedMediator && <span className="px-3 py-1 bg-gold/10 text-gold text-[10px] font-bold rounded-full border border-gold/20 uppercase tracking-widest">Selected</span>}
                </div>
                
                {!selectedMediator ? (
                  <div className="relative">
                    <div className="flex items-center gap-4 bg-white/50 border border-ink/10 rounded-2xl p-4 focus-within:border-gold focus-within:bg-white focus-within:shadow-sm transition-all">
                      <Search className="w-5 h-5 text-ink/40" />
                      <input 
                        type="text"
                        placeholder="Search professionals..."
                        value={searchTerm}
                        onFocus={() => setShowDropdown(true)}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowDropdown(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink/40 text-lg"
                      />
                    </div>

                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 5 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 left-0 right-0 top-full bg-white border border-ink/10 shadow-xl rounded-2xl overflow-hidden mt-2"
                        >
                          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                            {mediators.length === 0 && !isSearching && (
                              <div className="py-8 text-center text-ink/40 text-sm">No professionals found</div>
                            )}
                            {isSearching && (
                              <div className="py-8 text-center text-gold text-sm animate-pulse">Searching registry...</div>
                            )}
                            
                            {mediators.map((m) => (
                              <div 
                                key={m.id}
                                onClick={() => {
                                  setSelectedMediator(m);
                                  setSearchTerm("");
                                  setShowDropdown(false);
                                  setError("");
                                }}
                                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gold/5 transition-colors border-b border-ink/5 last:border-0"
                              >
                                <div className="w-10 h-10 rounded-full border border-ink/10 overflow-hidden bg-paper flex shrink-0">
                                  {m.profile_image ? (
                                    <img src={m.profile_image} className="w-full h-full object-cover" alt={m.name} />
                                  ) : (
                                    <span className="m-auto text-ink/50 font-serif">{m.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-ink font-medium">{m.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-ink/50 uppercase flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" /> {Number(m.rating).toFixed(1)}</span>
                                    <span className="w-1 h-1 rounded-full bg-ink/20" />
                                    <span className="text-[10px] text-ink/50 uppercase">{m.items_sold} Sold</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-gradient-to-r from-gold/5 to-white border border-gold/20 p-4 rounded-2xl relative group shadow-sm">
                    <div className="w-14 h-14 rounded-full border-2 border-gold/30 bg-white overflow-hidden shrink-0 shadow-sm">
                      {selectedMediator.profile_image ? (
                        <img src={selectedMediator.profile_image} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold font-serif text-xl">{selectedMediator.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg text-ink font-serif">{selectedMediator.name}</p>
                      <button type="button" onClick={() => setSelectedMediator(null)} className="text-xs text-ink/50 hover:text-gold transition-colors uppercase tracking-widest mt-1 font-medium">Change Selection</button>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase text-ink/40 mb-1 font-bold tracking-wider">Fee</span>
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-ink/10 shadow-inner">
                        <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="w-8 bg-transparent text-right outline-none text-ink font-mono font-medium" />
                        <span className="text-ink/50 font-mono">%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit - Mobile Only (Hidden on LG) */}
              <button
                type="submit"
                disabled={loading || !selectedMediator}
                className={`w-full lg:hidden py-6 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-md ${
                  loading || !selectedMediator ? "bg-ink/10 text-ink/40" : "bg-gold text-white hover:bg-ink hover:text-gold"
                }`}
              >
                {loading ? "Initializing..." : "Launch Listing"}
              </button>
              
            </form>
          </div>

          {/* Right Column: Live Interactive Preview */}
          <div className="hidden lg:col-span-5 xl:col-span-6 lg:flex flex-col items-center justify-center relative pl-8">
            <div className="absolute top-0 right-0 p-6">
              <span className="px-4 py-2 bg-white rounded-full text-[10px] uppercase tracking-[0.3em] font-bold text-ink/50 border border-ink/10 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                Live Preview
              </span>
            </div>
            
            <div className="w-full max-w-sm perspective-1000">
              <motion.div 
                className="w-full bg-white border border-ink/10 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(42,35,24,0.08)]"
                initial={{ rotateY: -10, rotateX: 5 }}
                animate={{ rotateY: 0, rotateX: 0 }}
                transition={{ duration: 1 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="h-64 bg-paper relative overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <motion.img initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} src={preview} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-12 h-12 text-ink/20" />
                  )}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur text-ink text-[10px] uppercase tracking-widest font-bold rounded-full shadow-sm">
                    Preview
                  </div>
                  {durationHours && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-gold text-ink shadow-md text-[10px] uppercase tracking-widest font-bold rounded-full">
                      {durationHours}H Left
                    </div>
                  )}
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-serif text-ink truncate">{title || "Artifact Title"}</h3>
                    <p className="text-ink/50 text-xs uppercase tracking-widest mt-1 truncate font-medium">By {user?.name || "You"}</p>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-ink/10 to-transparent"></div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-ink/50 uppercase tracking-widest mb-1 font-bold">Reserve</p>
                      <p className="text-2xl font-mono text-ink">${startingPrice || "0"}</p>
                    </div>
                    {selectedMediator && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-paper overflow-hidden border border-ink/10">
                          {selectedMediator.profile_image ? <img src={selectedMediator.profile_image} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center w-full h-full text-xs font-serif text-ink/50">{selectedMediator.name.charAt(0)}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Desktop Submit Button linked to Form */}
            <div className="w-full max-w-sm mt-12">
              <button
                type="submit"
                form="create-auction-form"
                disabled={loading || !selectedMediator}
                className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group overflow-hidden relative shadow-lg ${
                  loading || !selectedMediator ? "bg-ink/10 text-ink/40 cursor-not-allowed shadow-none" : "bg-ink text-gold hover:bg-gold hover:text-ink hover:shadow-[0_10px_30px_rgba(197,160,89,0.3)] hover:-translate-y-1"
                }`}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-gold/50 border-t-gold rounded-full animate-spin" /> Publishing...</>
                ) : (
                  <>
                    <span className="relative z-10">Launch Listing</span>
                    <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
