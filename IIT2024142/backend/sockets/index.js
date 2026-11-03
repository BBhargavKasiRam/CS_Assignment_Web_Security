const jwt = require("jsonwebtoken");
const db = require("../config/db");

const socketHandler = (io) => {
  // Socket.io Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const tokenString = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    try {
      const decoded = jwt.verify(tokenString, process.env.JWT_SECRET || "secret");
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  const broadcasters = {}; // auctionId → socketId

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?.name || 'Unknown'})`);

    // ── Auction Room Management ──
    socket.on("joinAuction", (auctionId) => {
      const aid = String(auctionId);
      socket.join(`auction:${aid}`);
      console.log(`User ${socket.user?.name} joined auction:${aid}`);

      if (broadcasters[aid]) {
        socket.emit("broadcaster-present", { broadcasterId: broadcasters[aid] });
      }
    });

    socket.on("leaveAuction", (auctionId) => {
      socket.leave(`auction:${auctionId}`);
    });

    // ── Live Chat Relay ──
    socket.on("send-chat-message", ({ auctionId, messageData }) => {
      socket.to(`auction:${String(auctionId)}`).emit("receive-chat-message", messageData);
    });

    socket.on("send-mediator-message", ({ auctionId, messageData }) => {
      socket.to(`auction:${String(auctionId)}`).emit("receive-mediator-message", messageData);
    });

    socket.on("timerExtended", ({ auctionId, newEndTime, extensionMinutes }) => {
      io.to(`auction:${auctionId}`).emit("timerExtended", { 
        newEndTime, 
        extensionMinutes: extensionMinutes || 3 
      });
    });

    // ── WebRTC Video Streaming ──
    socket.on("check-stream-status", ({ auctionId }) => {
      const aid = String(auctionId);
      if (broadcasters[aid]) {
        socket.emit("broadcaster-present", { broadcasterId: broadcasters[aid] });
      } else {
        socket.emit("broadcast-ended");
      }
    });
    
    socket.on("start-broadcast", ({ auctionId }) => {
      const aid = String(auctionId);
      // If there's an existing broadcaster for this auction, clean up
      if (broadcasters[aid] && broadcasters[aid] !== socket.id) {
        io.to(broadcasters[aid]).emit("force-stop-broadcast");
      }
      broadcasters[aid] = socket.id;
      socket.join(`auction:${aid}`);
      socket.to(`auction:${aid}`).emit("broadcaster-present", { broadcasterId: socket.id });
      console.log(`Broadcast started for auction:${aid} by socket:${socket.id}`);
    });

    socket.on("viewer-ready", ({ auctionId, viewerId }) => {
      const aid = String(auctionId);
      const broadcasterId = broadcasters[aid];
      if (broadcasterId) {
        io.to(broadcasterId).emit("new-viewer", { viewerId });
        console.log(`Viewer ${viewerId} ready for auction:${aid}, broadcaster:${broadcasterId}`);
      } else {
        // No broadcaster active — tell viewer
        socket.emit("broadcast-ended");
      }
    });

    // ── WebRTC Signaling (with error handling) ──
    socket.on("offer", ({ targetId, offer, senderId }) => {
      if (!targetId || !offer) return;
      io.to(targetId).emit("offer", { offer, senderId });
    });

    socket.on("answer", ({ targetId, answer, senderId }) => {
      if (!targetId || !answer) return;
      io.to(targetId).emit("answer", { answer, senderId });
    });

    socket.on("ice-candidate", ({ targetId, candidate, senderId }) => {
      if (!targetId || !candidate) return;
      io.to(targetId).emit("ice-candidate", { candidate, senderId });
    });

    socket.on("broadcast-ended-notify", ({ auctionId }) => {
      const aid = String(auctionId);
      if (broadcasters[aid] === socket.id) {
        delete broadcasters[aid];
        io.to(`auction:${aid}`).emit("broadcast-ended");
        console.log(`Broadcast ended for auction:${aid}`);
      }
    });

    // ── Chat & Mediator Logic (with DB) ──
    socket.on("sendChatMessage", async ({ auctionId, userId, message, isSystemMessage, user }) => {
      try {
        const [muted] = await db.query("SELECT id FROM muted_users WHERE auction_id = ? AND user_id = ?", [auctionId, userId]);
        if (muted.length > 0) {
          socket.emit("chatError", { message: "You are muted in this room." });
          return;
        }

        const query = `INSERT INTO chat_messages (auction_id, user_id, message, is_system_message) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(query, [auctionId, userId || null, message, isSystemMessage ? 1 : 0]);
        
        const newMessage = {
          id: result.insertId,
          auction_id: auctionId,
          user_id: userId,
          message,
          is_system_message: isSystemMessage ? 1 : 0,
          created_at: new Date(),
          user_name: user?.name || (isSystemMessage ? "System" : "Unknown"),
          user_role: user?.role || "system"
        };

        io.to(`auction:${auctionId}`).emit("newChatMessage", newMessage);
      } catch (err) {
        console.error("Socket chat error:", err);
      }
    });

    socket.on("disconnect", () => {
      for (const [auctionId, broadcasterId] of Object.entries(broadcasters)) {
        if (broadcasterId === socket.id) {
          delete broadcasters[auctionId];
          io.to(`auction:${auctionId}`).emit("broadcast-ended");
          console.log(`Broadcaster disconnected for auction:${auctionId}`);
        } else {
          // Notify broadcaster that a viewer disconnected
          io.to(broadcasterId).emit("viewer-disconnected", { viewerId: socket.id });
        }
      }
      console.log("Socket disconnected:", socket.id);
    });

    // ... mediator events ...
    socket.on("mediatorJoined", ({ auctionId }) => io.to(`auction:${auctionId}`).emit("mediatorPresence", { isPresent: true }));
    socket.on("mediatorLeft", ({ auctionId }) => io.to(`auction:${auctionId}`).emit("mediatorPresence", { isPresent: false }));
  });
};


module.exports = socketHandler;
