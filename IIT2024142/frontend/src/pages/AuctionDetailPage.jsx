import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Camera,
  Save,
  X,
  Edit3,
  Maximize2,
  Gavel,
  TrendingUp,
  ArrowLeft,
  History,
  Shield,
  Zap,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import { LiveChat } from "../components/LiveChat";
import { PrivateChat } from "../components/PrivateChat";
import { getServerNow } from "../hooks/useServerTime";

// ─── Anti-snipe Banner ────────────────────────────────────────────────────────
const AntiSnipeBanner = React.memo(({ wasExtended, extensionMinutes }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
          className="mb-4 p-4 bg-amber-50 border border-amber-400 flex items-start gap-3"
        >
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-amber-700">
              Anti-Snipe Protection Active
            </p>
            <p className="text-xs text-amber-600 mt-0.5 font-light">
              A bid was placed in the final minutes. Auction extended by{" "}
              <strong>{extensionMinutes} minutes</strong> to ensure fairness.
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="ml-auto text-amber-400 hover:text-amber-600"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ─── Countdown Timer ──────────────────────────────────────────────────────────
const CountdownTimer = React.memo(({ endTime, onExtended }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [currentEnd, setCurrentEnd] = useState(endTime);

  useEffect(() => {
    setCurrentEnd(endTime);
  }, [endTime]);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(currentEnd) - getServerNow();
      if (diff <= 0) {
        setTimeLeft("Ended");
        setIsUrgent(false);
        setIsCritical(false);
        return;
      }
      const critical = diff < 60 * 1000;
      const urgent = diff < 3 * 60 * 1000;
      setIsCritical(critical);
      setIsUrgent(urgent);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [currentEnd]);

  return (
    <div className="flex items-center gap-2">
      {isUrgent && (
        <Zap
          className={`w-3.5 h-3.5 ${isCritical ? "text-red-500 animate-pulse" : "text-amber-500"}`}
        />
      )}
      <span
        className={`font-mono font-bold text-lg ${
          isCritical
            ? "text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
            : isUrgent
            ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]"
            : "text-accent glow-text"
        }`}
      >
        {timeLeft}
      </span>
    </div>
  );
});

// ─── Bid History ──────────────────────────────────────────────────────────────
const BidHistory = React.memo(({ bids }) => {
  if (!bids || bids.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-ink/10">
        <Gavel className="w-8 h-8 text-ink/10 mx-auto mb-3" />
        <p className="text-sm font-serif italic text-ink/40">No bids placed yet.</p>
        <p className="text-[10px] uppercase tracking-widest text-ink/20 mt-1">
          Be the first to bid
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {bids.map((bid, idx) => (
        <motion.div
          key={bid.id || idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.04 }}
          className={`flex items-center justify-between p-4 mb-2 rounded-xl border transition-all ${
            idx === 0 ? "border-accent/50 bg-accent/10 shadow-[0_0_20px_rgba(0,240,255,0.15)]" : "border-white/5 glass bg-surface/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0
                  ? "bg-accent text-surface shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                  : "bg-surface border border-white/10 text-ink/60"
              }`}
            >
              {idx === 0 ? "★" : idx + 1}
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide">
                {bid.user_name || "Bidder"}
              </p>
              <p className="text-[9px] text-ink/40 uppercase tracking-widest">
                {bid.created_at
                  ? new Date(bid.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-lg font-serif font-bold ${
                idx === 0 ? "text-accent glow-text" : "text-ink"
              }`}
            >
              ${Number(bid.amount).toLocaleString()}
            </span>
            {idx === 0 && (
              <p className="text-[8px] uppercase tracking-widest text-accent font-bold animate-pulse">
                Leading
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// ─── WebRTC Video Component (FIXED FOR DEVICES) ───────────────────────────────
const VideoStream = React.memo(({ auctionId, isBroadcaster, broadcasterName }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnections = useRef({});
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const watchTimeoutRef = useRef(null);

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [broadcasterPresent, setBroadcasterPresent] = useState(false);
  const [broadcasterId, setBroadcasterId] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connectionState, setConnectionState] = useState("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" } // Additional fallback
    ],
  };

  const localVideoCallbackRef = useCallback((node) => {
    localVideoRef.current = node;
    if (node && localStream.current) {
      node.srcObject = localStream.current;
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = async (videoRef) => {
    if (!videoRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await videoRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const socket = getSocket();

    socket.on("broadcaster-present", ({ broadcasterId: bId }) => {
      setBroadcasterPresent(true);
      setBroadcasterId(bId);
      // Auto watch stream if viewer and not already watching
      if (!isBroadcaster && !isWatching) {
        watchStream(bId);
      }
    });

    socket.on("broadcast-ended", () => {
      setBroadcasterPresent(false);
      setBroadcasterId(null);
      setIsWatching(false);
      setConnectionState("idle");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
    });

    if (isBroadcaster) {
      socket.on("new-viewer", async ({ viewerId }) => {
        if (!localStream.current) return;
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnections.current[viewerId] = pc;
        localStream.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStream.current);
        });
        pc.onicecandidate = (e) => {
          if (e.candidate)
            socket.emit("ice-candidate", {
              targetId: viewerId,
              candidate: e.candidate,
              senderId: socket.id,
            });
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { targetId: viewerId, offer, senderId: socket.id });
      });

      socket.on("answer", async ({ answer, senderId }) => {
        const pc = peerConnections.current[senderId];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice-candidate", async ({ candidate, senderId }) => {
        const pc = peerConnections.current[senderId];
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on("viewer-disconnected", ({ viewerId }) => {
        if (peerConnections.current[viewerId]) {
          peerConnections.current[viewerId].close();
          delete peerConnections.current[viewerId];
        }
      });
    } else {
      socket.on("offer", async ({ offer, senderId }) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;

        pc.ontrack = (e) => {
          if (remoteVideoRef.current) {
            // Use the stream from the event, or create one if missing
            const stream = (e.streams && e.streams[0]) ? e.streams[0] : new MediaStream([e.track]);
            
            if (remoteVideoRef.current.srcObject !== stream) {
              remoteVideoRef.current.srcObject = stream;
            }
            
            // Ensure unmuted and full volume for the viewer
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.volume = 1.0;
            
            remoteVideoRef.current.play().catch(err => {
              console.error("Video play error (mic/video):", err);
              // Fallback: Try playing again if it was a permission issue
              if (err.name === "NotAllowedError") {
                remoteVideoRef.current.muted = true; // Play muted as last resort
                remoteVideoRef.current.play();
              }
            });
          }
          setConnectionState("connected");
          if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate)
            socket.emit("ice-candidate", {
              targetId: senderId,
              candidate: e.candidate,
              senderId: socket.id,
            });
        };

        pc.onconnectionstatechange = () => {
          setConnectionState(pc.connectionState);
          if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
            setConnectionState("failed");
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { targetId: senderId, answer, senderId: socket.id });
      });

      socket.on("ice-candidate", async ({ candidate, senderId }) => {
        if (peerConnection.current && candidate) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch(e) {
            console.error("Error adding ice candidate", e);
          }
        }
      });
    }

    return () => {
      socket.off("broadcaster-present");
      socket.off("broadcast-ended");
      socket.off("new-viewer");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("viewer-disconnected");
      if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
    };
  }, [isBroadcaster, auctionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      getSocket().emit("check-stream-status", { auctionId: String(auctionId) });
    }, 10000);
    getSocket().emit("check-stream-status", { auctionId: String(auctionId) });
    return () => clearInterval(interval);
  }, [auctionId]);

  const startBroadcast = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access, or you are not using HTTPS/localhost.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          googEchoCancellation: { ideal: true },
          googAutoGainControl: { ideal: true },
          googNoiseSuppression: { ideal: true },
          googHighpassFilter: { ideal: true },
          sampleRate: 44100
        },
      });
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsBroadcasting(true);
      getSocket().emit("start-broadcast", { auctionId: String(auctionId) });
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera/microphone: " + err.message);
    }
  };

  const stopBroadcast = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setIsBroadcasting(false);
    getSocket().emit("broadcast-ended-notify", { auctionId: String(auctionId) });
  };

  const watchStream = (targetBroadcasterId = broadcasterId) => {
    if (!targetBroadcasterId) return;
    setIsWatching(true);
    setConnectionState("connecting");
    if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
    
    // Auto-retry logic
    watchTimeoutRef.current = setTimeout(() => {
      if (connectionState !== "connected") {
        setConnectionState("failed");
      }
    }, 12000);

    getSocket().emit("viewer-ready", { auctionId: String(auctionId), viewerId: getSocket().id });
  };

  const toggleMic = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
      }
    }
  };

  if (isBroadcaster) {
    return (
      <div className="bg-white border border-ink/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink/60 flex items-center gap-2">
            <Video className="w-4 h-4 text-gold" />
            Live Auction Stream
          </h3>
          {isBroadcasting && (
            <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {isBroadcasting ? (
          <div className="space-y-3">
            <div className="relative bg-ink aspect-video overflow-hidden group rounded-lg shadow-inner w-full max-w-full">
              <video
                ref={localVideoCallbackRef}
                autoPlay
                muted
                playsInline
                onClick={() => toggleFullscreen(localVideoRef)}
                className="w-full h-full object-cover cursor-pointer"
              />
              <div className="absolute top-2 right-2 p-1.5 bg-ink/60 text-paper opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
              <div className="absolute bottom-3 left-3 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMic(); }}
                  className={`p-2 rounded-full text-paper text-xs transition-colors ${micOn ? "bg-ink/60 hover:bg-ink/80" : "bg-red-500 hover:bg-red-600"}`}
                >
                  {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCam(); }}
                  className={`p-2 rounded-full text-paper text-xs transition-colors ${camOn ? "bg-ink/60 hover:bg-ink/80" : "bg-red-500 hover:bg-red-600"}`}
                >
                  {camOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <button
              onClick={stopBroadcast}
              className="w-full py-3 bg-red-600 text-paper text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition"
            >
              <VideoOff className="w-4 h-4" />
              End Broadcast
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-ink/50 font-light leading-relaxed">
              Go live so bidders can see the item in real time. Your camera and microphone will
              be shared with all viewers in this auction.
            </p>
            <button
              onClick={startBroadcast}
              className="w-full py-3 bg-ink text-paper text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-gold transition"
            >
              <Video className="w-4 h-4" />
              Go Live
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-ink/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-ink/60 flex items-center gap-2">
          <Video className="w-4 h-4 text-gold" />
          Live Stream
        </h3>
        {isWatching && connectionState === "connected" && (
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-green-600">
            <Wifi className="w-3 h-3" /> Connected
          </span>
        )}
      </div>

      {broadcasterPresent || isWatching ? (
        <div className="space-y-3">
          {isWatching ? (
            <div className="relative bg-ink aspect-video overflow-hidden group rounded-lg shadow-inner w-full max-w-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                onClick={() => toggleFullscreen(remoteVideoRef)}
                className="w-full h-full object-cover cursor-pointer"
              />
              <div className="absolute top-2 right-2 p-1.5 bg-ink/60 text-paper opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
              {connectionState === "connecting" && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {connectionState === "failed" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/80 text-white gap-3">
                  <WifiOff className="w-8 h-8 text-red-500" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Connection Failed</span>
                  <button onClick={() => watchStream(broadcasterId)} className="px-4 py-2 bg-gold text-ink text-[10px] uppercase tracking-widest font-bold rounded">
                    Retry
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-paper/50 border border-dashed border-gold/30 flex flex-col items-center justify-center gap-3">
              <Video className="w-8 h-8 text-gold/50" />
              <p className="text-xs text-ink/50 uppercase tracking-widest font-bold">
                {broadcasterName} is live
              </p>
            </div>
          )}

          {!isWatching && connectionState !== "connecting" && (
            <button
              onClick={() => watchStream()}
              className="w-full py-3 bg-ink text-paper text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-gold transition"
            >
              <Video className="w-4 h-4" />
              Watch Live
            </button>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-paper/50 border border-dashed border-ink/10 flex flex-col items-center justify-center gap-3">
          <VideoOff className="w-8 h-8 text-ink/20" />
          <p className="text-xs text-ink/30 uppercase tracking-widest font-bold">No live stream</p>
        </div>
      )}
    </div>
  );
});

import { useToast } from "../context/ToastContext";

export const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  const prevLeaderId = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const shouldEdit = searchParams.get("edit") === "true";

  const [auction, setAuction] = useState(null);
  const [isEditing, setIsEditing] = useState(shouldEdit);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    current_price: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [currentEndTime, setCurrentEndTime] = useState(null);
  const [antiSnipeData, setAntiSnipeData] = useState(null);
  const [liveBids, setLiveBids] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [proxyBidLimit, setProxyBidLimit] = useState("");
  const [activeProxyBid, setActiveProxyBid] = useState(null);
  const [proxyLoading, setProxyLoading] = useState(false);

  // Seller Rating
  const [sellerRating, setSellerRating] = useState(null);

  const fetchAuction = useCallback(async (signal) => {
    try {
      const data = await api.get(`/auctions/${id}`, { signal });
      setAuction(data);
      setCurrentEndTime(data.end_time);
      
      setLiveBids(data.bids || []);
      prevLeaderId.current = data.bids?.[0]?.user_id;
      
      setEditForm({
        title: data.title,
        description: data.description,
        current_price: data.current_price,
      });

      if (data.image) {
        const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const fullUrl = data.image.startsWith("http")
          ? data.image
          : `${baseURL}/${data.image}`;
        setImagePreview(fullUrl);
      }

      try {
        const ratingData = await api.get(`/reviews/${data.seller_id}`, { signal });
        setSellerRating(ratingData);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Failed to fetch seller rating", err);
        }
      }

      if (user) {
        api.get(`/bids/proxy/${id}`, { signal })
          .then(res => {
            if (res.max_bid_amount) setActiveProxyBid(res.max_bid_amount);
          })
          .catch(e => {
            if (e.name !== "CanceledError" && e.name !== "AbortError") console.error(e);
          });
      }

    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        navigate("/");
      }
    }
  }, [id, navigate, user]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchAuction(abortController.signal);
    return () => abortController.abort();
  }, [fetchAuction]);

  useEffect(() => {
    if (isEditing) return;
    let abortController = new AbortController();
    const interval = setInterval(() => {
      abortController.abort(); // Cancel previous request if still pending
      abortController = new AbortController();
      fetchAuction(abortController.signal);
    }, 10000);
    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [id, isEditing, fetchAuction]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("joinAuction", String(id));

    socket.on("newBid", (bidData) => {
      // Logic for Outbid Notification
      if (user && prevLeaderId.current === user.id && bidData.user_id !== user.id) {
        showToast(`You've been outbid! New bid: $${bidData.amount.toLocaleString()}`, "error");
      } else if (user && bidData.user_id === user.id) {
        showToast(`Bid placed successfully: $${bidData.amount.toLocaleString()}`, "success");
      }

      setLiveBids((prev) => {
        const newBids = [bidData, ...prev];
        prevLeaderId.current = newBids[0]?.user_id;
        return newBids;
      });

      setAuction((prev) =>
        prev ? { ...prev, current_price: bidData.amount } : prev
      );
    });

    socket.on("timerExtended", ({ newEndTime, extensionMinutes }) => {
      setCurrentEndTime(newEndTime);
      setAntiSnipeData({ extensionMinutes });
      showToast(`Auction extended by ${extensionMinutes}m (Anti-Snipe)`, "info");
      setTimeout(() => setAntiSnipeData(null), 10000);
    });

    return () => {
      socket.emit("leaveAuction", String(id));
      socket.off("newBid");
      socket.off("timerExtended");
    };
  }, [id, user, showToast]);



  const handleUpdate = async () => {
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("current_price", editForm.current_price);
      if (selectedFile) formData.append("image", selectedFile);
      await api.put(`/auctions/${id}`, formData);
      setIsEditing(false);
      setSuccess("Listing updated successfully.");
      fetchAuction();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Update failed");
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/auctions/${id}`);
      setSuccess("Auction deleted successfully. Redirecting to gallery...");
      // Auto redirect after a short delay
      setTimeout(() => navigate("/gallery"), 2000);
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const amount = Number(bidAmount);
    const currentPrice = auction ? Number(auction.current_price) : 0;
    if (!amount || amount <= currentPrice) {
      setError(`Bid must be higher than $${currentPrice.toLocaleString()}`);
      return;
    }
    try {
      setBidLoading(true);
      const result = await api.post("/bids", {
        auction_id: Number(id),
        amount,
      });
      setSuccess(result.message || "Bid placed successfully!");
      setBidAmount("");
      
      // Broadcast to live chat for immediate visibility
      getSocket().emit("sendChatMessage", {
        auctionId: id,
        userId: null,
        message: `${user.name} just placed a new high bid of $${amount.toLocaleString()}!`,
        isSystemMessage: true,
        user: { name: "System", role: "system" }
      });
    } catch (err) {
      setError(err.message || "Bid failed");
    } finally {
      setBidLoading(false);
    }
  };

  const handleSetProxyBid = async (e) => {
    e.preventDefault();
    const amount = Number(proxyBidLimit);
    if (!amount || amount <= Number(auction?.current_price)) {
      setError("Proxy bid limit must be higher than current price");
      return;
    }
    try {
      setProxyLoading(true);
      await api.post("/bids/proxy", {
        auction_id: Number(id),
        max_bid_amount: amount
      });
      setActiveProxyBid(amount);
      setSuccess(`Auto-bidding activated up to $${amount.toLocaleString()}`);
      setProxyBidLimit("");
    } catch (err) {
      setError(err.message || "Failed to set proxy bid");
    } finally {
      setProxyLoading(false);
    }
  };

  const handleRemoveProxyBid = async () => {
    try {
      setProxyLoading(true);
      await api.delete(`/bids/proxy/${id}`);
      setActiveProxyBid(null);
      setSuccess("Auto-bidding disabled.");
    } catch (err) {
      setError("Failed to remove proxy bid");
    } finally {
      setProxyLoading(false);
    }
  };

  const isConsignor = user && auction && user.id === auction.seller_id;
  const isAuctioneer = user && auction && user.id === auction.mediator_id;
  const isBuyer = user && auction && user.id !== auction.seller_id && user.id !== auction.mediator_id;
  const isEnded = auction && currentEndTime
    ? new Date(currentEndTime) <= getServerNow()
    : false;
  const minBid = auction ? Number(auction.current_price) + 1 : 1;

  const handleLockAuction = async () => {
    if (!window.confirm("Are you sure you want to lock this auction? This will end it immediately and declare the current highest bidder as the winner.")) return;
    try {
      await api.put(`/auctions/${id}/close`);
      setSuccess("Auction locked successfully.");
      fetchAuction(); // Refresh auction state
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to lock auction");
    }
  };

  if (!auction) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── SELLER VIEW ──────────────────────────────────────────────────────────
  if (isConsignor) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-16 font-sans text-ink relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center p-10 cursor-zoom-out"
            >
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={imagePreview}
                className="max-w-full max-h-full object-contain"
                alt="Full view"
              />
              <button className="absolute top-10 right-10 text-paper hover:text-gold">
                <X size={40} />
              </button>
            </motion.div>
          )}

          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-ink/80 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white max-w-md w-full p-10 shadow-2xl border border-ink/5"
              >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-8 mx-auto">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-3xl font-serif text-center mb-4">Remove Lot?</h2>
                <p className="text-ink/60 text-center text-sm font-light leading-relaxed mb-10">
                  This action is permanent. All bids and history associated with this lot will be permanently removed from the collection.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmDelete}
                    className="w-full py-4 bg-red-600 text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-red-700 transition-colors shadow-lg"
                  >
                    Confirm Deletion
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-4 border border-ink/10 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-ink/5 transition-colors"
                  >
                    Keep Listing
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {success && success.includes("deleted") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[200] bg-gold flex flex-col items-center justify-center text-ink"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-ink text-gold rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-5xl font-serif mb-4">Lot Removed</h2>
                <p className="text-[10px] uppercase tracking-[0.5em] font-bold opacity-60">
                  Redirecting to Gallery
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink/40 hover:text-gold transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Gallery
        </Link>

        {antiSnipeData && (
          <AntiSnipeBanner
            wasExtended={true}
            extensionMinutes={antiSnipeData.extensionMinutes}
          />
        )}

        {/* TOP SECTION: Video & Chat (Span 5) */}
        <div className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-ink text-paper text-[10px] uppercase tracking-[0.2em] font-bold">
                  Consignor Dashboard
                </span>
                <span className="text-[10px] text-ink/40 font-mono uppercase tracking-widest">
                  Lot #{auction.id?.toString().padStart(4, "0")}
                </span>
              </div>
              <VideoStream
                auctionId={id}
                isBroadcaster={isAuctioneer}
                broadcasterName={auction.seller_name}
              />
            </div>
            <div className="lg:col-span-1 h-full">
              {!isEnded && <LiveChat auctionId={id} />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center gap-3 mb-2">
               {/* Labels are now in the top Media section */}
            </div>

            {isEditing ? (
              <input
                className="text-5xl font-serif w-full bg-transparent border-b border-gold/30 outline-none pb-2 focus:border-gold"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            ) : (
              <h1 className="text-5xl font-serif leading-tight tracking-tight">
                {auction.title}
              </h1>
            )}

            <div
              onClick={() => !isEditing && imagePreview && setIsModalOpen(true)}
              className={`relative group aspect-video bg-paper border border-ink/5 overflow-hidden shadow-sm ${
                !isEditing && imagePreview ? "cursor-zoom-in" : ""
              }`}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    isEditing ? "brightness-50 scale-105" : ""
                  }`}
                  alt="Auction"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink/20">
                  No image
                </div>
              )}
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current.click();
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-paper z-20"
                >
                  <Camera className="w-10 h-10 mb-2" />
                  <span className="text-xs uppercase tracking-[0.3em] font-bold">
                    Change Image
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    accept="image/*"
                  />
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                className="w-full text-lg text-ink/70 font-light leading-relaxed border-l-4 border-gold/20 pl-6 bg-transparent outline-none h-36 focus:border-gold"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            ) : (
              <p className="text-lg text-ink/70 font-light leading-relaxed border-l-4 border-gold/20 pl-6 whitespace-pre-wrap">
                {auction.description}
              </p>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!isEnded && (
              <div className="mb-6">
                <PrivateChat auctionId={id} />
              </div>
            )}

            <div className="bg-white border border-ink/10 p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gold" />

              <div className="mb-6">
                <span className="text-[10px] uppercase tracking-widest text-ink/40 block mb-2 font-bold">
                  Current Valuation
                </span>
                {isEditing ? (
                  <div className="flex items-baseline gap-1 border-b border-gold pb-1">
                    <span className="text-3xl font-serif text-ink/30">$</span>
                    <input
                      type="number"
                      className="text-5xl font-serif font-bold w-full bg-transparent outline-none"
                      value={editForm.current_price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, current_price: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="text-5xl font-serif font-bold tracking-tighter">
                    ${Number(auction.current_price).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-paper border border-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-ink/50">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                    Time Left
                  </span>
                </div>
                <CountdownTimer endTime={currentEndTime || auction.end_time} />
              </div>

              {!isEnded && (
                <div className="mb-4 p-3 bg-amber-50/60 border border-amber-200/50 flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[9px] text-amber-700 uppercase tracking-wide font-bold leading-relaxed">
                    Anti-snipe active · Bids in last 3 min extend by 3 min
                  </p>
                </div>
              )}

              {!isEditing && (
                <div className="mb-6 p-4 bg-paper border border-ink/5">
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-3">
                    Consignor Insights
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-ink/40">Starting Price</span>
                      <span className="font-bold">
                        ${Number(auction.starting_price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-ink/40">Total Gained</span>
                      <span className="font-bold text-gold">
                        +${(Number(auction.current_price) - Number(auction.starting_price)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-ink/40">Total Bids</span>
                      <span className="font-bold">{liveBids.length}</span>
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {(error || success) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-4 p-3 text-[10px] flex items-start gap-2 uppercase font-bold border-l-2 ${
                      error
                        ? "bg-red-50 text-red-600 border-red-600"
                        : "bg-green-50 text-green-600 border-green-600"
                    }`}
                  >
                    {error ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                    <span>{error || success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isEnded ? (
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdate}
                        className="w-full py-4 bg-ink text-paper text-[10px] uppercase tracking-[0.4em] hover:bg-gold transition-all font-bold flex items-center justify-center gap-2"
                      >
                        <Save size={13} /> Save Changes
                      </button>
                      <button
                        onClick={() => { setIsEditing(false); fetchAuction(); }}
                        className="w-full py-3 border border-ink/10 text-[10px] uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-2 hover:bg-ink/5 transition"
                      >
                        <X size={13} /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-4 border border-ink/10 text-[10px] uppercase tracking-[0.4em] hover:bg-ink hover:text-paper transition-all font-bold flex items-center justify-center gap-2"
                    >
                      <Edit3 size={13} /> Edit Listing
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-5 bg-ink/5 border border-dashed border-ink/10 text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">
                      Lot closed — modifications restricted
                    </p>
                    {liveBids.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-ink/5">
                        <p className="text-[9px] uppercase tracking-widest text-ink/30 mb-1">
                          Winning Bidder
                        </p>
                        <p className="text-lg font-serif text-gold">
                          {liveBids[0].user_name}
                        </p>
                        <p className="text-2xl font-serif font-bold mt-1">
                          ${Number(liveBids[0].amount).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleDelete}
                    className="w-full py-4 border border-red-100 text-[10px] uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all font-bold flex items-center justify-center gap-2 text-red-500"
                  >
                    <Trash2 size={13} /> Delete Auction
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 border border-ink/10 bg-white/50 flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-gold border border-ink/5 shadow-inner">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-ink/40 font-bold mb-0.5">
                    Curated By
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="font-serif text-xl">{auction.seller_name}</p>
                    {sellerRating && sellerRating.totalReviews > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-gold/10 text-gold border border-gold/20">
                        <Star className="w-3 h-3 fill-gold" />
                        {sellerRating.averageRating} ({sellerRating.totalReviews})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {auction.mediator_name && (
                <div className="p-6 border border-ink/10 bg-white/50 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-gold border border-ink/5 shadow-inner">
                    <Gavel className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-ink/40 font-bold mb-0.5">
                      Assigned Auctioneer
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="font-serif text-xl">{auction.mediator_name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-5 h-5 text-gold" />
            <h2 className="text-2xl font-serif">Bid History</h2>
            <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold ml-2">
              {liveBids.length} bids
            </span>
          </div>
          <BidHistory bids={liveBids} />
        </div>
      </div>
    );
  }

  // ─── BUYER / PUBLIC VIEW ──────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 font-sans text-ink relative">
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center p-10 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={imagePreview}
              className="max-w-full max-h-full object-contain"
              alt="Full view"
            />
            <button className="absolute top-10 right-10 text-paper hover:text-gold">
              <X size={40} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        to="/gallery"
        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink/40 hover:text-gold transition-colors mb-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Gallery
      </Link>

      {antiSnipeData && (
        <AntiSnipeBanner
          wasExtended={true}
          extensionMinutes={antiSnipeData.extensionMinutes}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* TOP SECTION: Video & Chat (Span 12) */}
        <div className="lg:col-span-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold ${
                    isEnded ? "bg-ink text-paper" : "bg-gold text-ink"
                  }`}
                >
                  {isEnded ? "Auction Ended" : "Live Auction"}
                </span>
                <span className="text-[10px] text-ink/40 font-mono uppercase tracking-widest">
                  Lot #{auction.id?.toString().padStart(4, "0")}
                </span>
                {!isEnded && (
                  <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-amber-600 border border-amber-200 px-2 py-0.5">
                    <Shield className="w-3 h-3" />
                    Anti-Snipe
                  </span>
                )}
                {isAuctioneer && !isEnded && (
                  <button 
                    onClick={handleLockAuction}
                    className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition"
                  >
                    <Gavel className="w-3.5 h-3.5" /> Lock Auction
                  </button>
                )}
              </div>
              <VideoStream
                auctionId={id}
                isBroadcaster={isAuctioneer}
                broadcasterName={auction.seller_name}
              />
            </div>
            <div className="lg:col-span-1 h-full">
              {!isEnded && <LiveChat auctionId={id} />}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Info & Bidding */}
        <div className="lg:col-span-7 space-y-8">
          {imagePreview && (
            <div
              onClick={() => setIsModalOpen(true)}
              className="relative group aspect-video bg-paper border border-ink/5 overflow-hidden shadow-sm cursor-zoom-in"
            >
              <img
                src={imagePreview}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt={auction.title}
              />
              <div className="absolute top-3 right-3 p-1.5 bg-ink/60 text-paper opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h1 className="text-4xl font-serif leading-[1.1] tracking-tight">
              {auction.title}
            </h1>
            <p className="text-md text-ink/70 font-light leading-relaxed border-l-2 border-gold/20 pl-4 whitespace-pre-wrap">
              {auction.description}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {!isEnded && (isConsignor || isAuctioneer) && (
            <div className="mb-6">
              <PrivateChat auctionId={id} />
            </div>
          )}

          <h1 className="text-4xl font-serif leading-[1.1] tracking-tight">
            {auction.title}
          </h1>

          <p className="text-md text-ink/70 font-light leading-relaxed border-l-2 border-gold/20 pl-4 whitespace-pre-wrap">
            {auction.description}
          </p>


          <div className="glass-card border border-white/10 p-8 relative overflow-hidden mt-6 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-500">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent shadow-[0_0_10px_rgba(0,240,255,0.8)]" />

            <div className="mb-6">
              <span className="text-[10px] uppercase tracking-widest text-ink/40 block mb-1 font-bold">
                Current Bid
              </span>
              <div className="text-5xl font-serif font-bold tracking-tighter">
                ${Number(auction.current_price).toLocaleString()}
              </div>
              {liveBids.length > 0 && (
                <p className="text-[10px] text-ink/40 mt-1 uppercase tracking-widest">
                  {liveBids.length} bid{liveBids.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="mb-4 p-4 bg-paper border border-ink/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink/50">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                  Ends In
                </span>
              </div>
              <CountdownTimer endTime={currentEndTime || auction.end_time} />
            </div>

            {!isEnded && (
              <div className="mb-4 flex items-center gap-2 text-[9px] text-amber-700 uppercase tracking-widest font-bold">
                <Shield className="w-3 h-3" />
                Last-min bid extends timer +3 min
              </div>
            )}

            <AnimatePresence>
              {(error || success) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mb-4 p-3 text-[10px] flex items-start gap-2 uppercase font-bold border-l-2 ${
                    error
                      ? "bg-red-50 text-red-600 border-red-600"
                      : "bg-green-50 text-green-600 border-green-600"
                  }`}
                >
                  {error ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                  <span>{error || success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {!isEnded && isBuyer && (
              <form onSubmit={handleBid} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-ink/40 block mb-2 font-bold">
                    Your Bid (min ${minBid.toLocaleString()})
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 font-serif text-xl">
                      $
                    </span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => {
                        setBidAmount(e.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      className="w-full border border-ink/10 pl-10 pr-4 py-4 font-mono text-2xl bg-paper/30 outline-none focus:border-gold transition-colors"
                      placeholder={minBid.toString()}
                      min={minBid}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {[minBid, minBid + 50, minBid + 200].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBidAmount(v.toString())}
                      className="flex-1 py-2 border border-ink/10 text-[9px] uppercase tracking-widest font-bold hover:border-gold hover:text-gold transition-colors"
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={bidLoading}
                  className="w-full py-5 glass-button bg-accent/20 border-accent/50 text-accent text-[12px] uppercase tracking-[0.4em] hover:bg-accent hover:text-surface hover:glow-accent transition-all font-bold shadow-[0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 hover-lift"
                >
                  <Gavel className="w-4 h-4" />
                  {bidLoading ? "Placing Bid…" : "Place Bid"}
                </button>

                <p className="text-[9px] text-ink/30 text-center leading-relaxed mt-4">
                  All bids are binding. Anti-snipe protection applies.
                </p>
              </form>
            )}

            {!isEnded && isBuyer && (
              <div className="mt-8 pt-6 border-t border-ink/10">
                <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-gold" /> Auto-Bid / Proxy Limit
                </h4>
                {activeProxyBid ? (
                  <div className="bg-green-50 border border-green-200 p-4">
                    <p className="text-xs font-bold text-green-800 mb-2">Auto-bidding is active.</p>
                    <p className="text-[10px] text-green-700 uppercase tracking-widest mb-4">Max Limit: ${Number(activeProxyBid).toLocaleString()}</p>
                    <button 
                      onClick={handleRemoveProxyBid}
                      disabled={proxyLoading}
                      className="text-[10px] uppercase font-bold text-red-600 hover:text-red-700"
                    >
                      {proxyLoading ? "Removing..." : "Remove Limit"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSetProxyBid} className="space-y-3">
                    <p className="text-xs text-ink/50 mb-2 leading-relaxed">
                      Set your maximum limit. The system will automatically bid the minimum amount required to keep you in the lead, up to your limit.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">$</span>
                        <input
                          type="number"
                          value={proxyBidLimit}
                          onChange={(e) => setProxyBidLimit(e.target.value)}
                          className="w-full border border-ink/10 pl-8 pr-3 py-3 font-mono text-sm outline-none focus:border-gold"
                          placeholder="Max Amount"
                          min={minBid}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={proxyLoading}
                        className="px-4 bg-ink text-white text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition"
                      >
                        {proxyLoading ? "..." : "Set"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {!user && !isEnded && (
              <div className="text-center space-y-3">
                <p className="text-sm text-ink/50 font-light">
                  Sign in to place a bid
                </p>
                <Link
                  to="/login"
                  className="block w-full py-4 bg-ink text-paper text-[10px] uppercase tracking-[0.4em] hover:bg-gold transition-colors font-bold text-center"
                >
                  Login to Bid
                </Link>
              </div>
            )}

            {isEnded && (
              <div className="p-5 bg-ink/5 border border-dashed border-ink/10 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/40">
                  This auction has ended
                </p>
                {liveBids.length > 0 && (
                  <p className="text-sm font-serif text-ink/60 mt-2">
                    Won by{" "}
                    <span className="font-bold text-gold">
                      {liveBids[0].user_name}
                    </span>{" "}
                    for{" "}
                    <span className="font-bold">
                      ${Number(liveBids[0].amount).toLocaleString()}
                    </span>
                  </p>
                )}

                {liveBids.length > 0 && user && liveBids[0].user_id === user.id && (
                  <Link
                    to="/orders"
                    className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-gold text-ink text-[10px] uppercase tracking-widest font-bold hover:bg-ink hover:text-paper transition-all shadow-xl"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    View My Orders
                  </Link>
                )}
              </div>
            )}
          </div>

          {!isEnded && liveBids.length > 2 && (
            <div className="flex items-center gap-3 p-4 border border-gold/20 bg-gold/5">
              <TrendingUp className="w-4 h-4 text-gold" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-gold">
                Hot auction — {liveBids.length} active bids
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 pt-12 border-t border-ink/5">
        <div className="flex items-center gap-3 mb-8">
          <History className="w-5 h-5 text-gold" />
          <h2 className="text-3xl font-serif">Bid History</h2>
          <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold ml-2 mt-1">
            {liveBids.length} bids total
          </span>
        </div>
        <BidHistory bids={liveBids} />
      </div>
    </div>
  );
};
