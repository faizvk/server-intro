/* ============================================================
   SOCKET.IO EVENTS — FULL FOUNDATION FILE
   Covers:
   - HTTP + Express + Socket.io setup
   - Built-in events
   - Custom events
   - Broadcast patterns
   - Private messaging
   - Rooms (basic intro)
   - Beautiful explanations for each concept
============================================================ */

import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";

// Create Express application
const app = express();

/* -----------------------------------------------------------
   1. Create RAW HTTP server on top of Express
      Why?
      WebSockets require a low-level HTTP upgrade handshake.
      Express alone cannot handle that → needs raw server.
------------------------------------------------------------ */
const httpServer = createServer(app);

/* -----------------------------------------------------------
   2. Enable CORS
      Browsers block requests from different origins.
      CORS allows frontend (React/Vue) to talk to backend.
------------------------------------------------------------ */
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

/* -----------------------------------------------------------
   3. Create Socket.io Server
      Attaching io to the same HTTP server lets both:
      - Express handle HTTP routes
      - Socket.io handle WebSocket connections
      On the SAME port.
------------------------------------------------------------ */
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

/* ============================================================
   SOCKET.IO CORE EVENTS
============================================================ */
io.on("connection", (socket) => {
  /* ---------------------------------------------------------
     4. "connection" event
        Fired whenever a client connects.
        Each client gets a unique socket.id.
  ---------------------------------------------------------- */
  console.log("🔌 New client connected:", socket.id);

  /* ---------------------------------------------------------
     5. Built-in event: "disconnect"
        Fired when:
        - user closes tab
        - user refreshes
        - internet drops
        - server restarts
  ---------------------------------------------------------- */
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });

  /* ---------------------------------------------------------
     6. Custom event: LISTENING FOR MESSAGES FROM CLIENT
        Here "sendMessage" is a CUSTOM event you created.
        Client triggers this using socket.emit("sendMessage", {...}).
  ---------------------------------------------------------- */
  socket.on("sendMessage", (data) => {
    console.log("📨 Message received from:", socket.id, data);

    /* -------------------------------------------------------
       EMIT PATTERN #1: socket.emit() → Send BACK to sender only
    -------------------------------------------------------- */
    socket.emit("selfMessage", {
      message: data.message,
      from: "You",
    });

    /* -------------------------------------------------------
       EMIT PATTERN #2: io.emit() → Send to EVERYONE (Broadcast)
    -------------------------------------------------------- */
    io.emit("broadcastMessage", {
      message: data.message,
      from: socket.id,
    });

    /* -------------------------------------------------------
       EMIT PATTERN #3: Send to ONE specific user
       io.to(id).emit()
       Common for:
       - private chat
       - WebRTC signaling
       - notifications
    -------------------------------------------------------- */
    if (data.receiverId) {
      io.to(data.receiverId).emit("privateMessage", {
        message: data.message,
        from: socket.id,
      });
    }
  });

  /* ---------------------------------------------------------
     7. Room Joining Event
        Rooms are channels where multiple people can join.
        Example: chat rooms, game lobbies, video call rooms.
  ---------------------------------------------------------- */
  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    console.log(`🏠 ${socket.id} joined room: ${roomName}`);

    // Notify room members
    io.to(roomName).emit("roomNotification", {
      message: `${socket.id} joined the room`,
      room: roomName,
    });
  });

  /* ---------------------------------------------------------
     8. Room Messaging
        Use io.to(roomName).emit() to send message
        ONLY to people in that room.
  ---------------------------------------------------------- */
  socket.on("roomMessage", (data) => {
    io.to(data.room).emit("roomMessageForward", {
      message: data.message,
      from: socket.id,
      room: data.room,
    });
  });
});

/* ============================================================
   EXPRESS ROUTE
   (Only to verify server is running)
============================================================ */
app.get("/", (req, res) => {
  res.send("Socket.io Server is running 🚀");
});

/* ============================================================
   START SERVER
============================================================ */
httpServer.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000/");
});

/* ============================================================
   MASTER SUMMARY OF SOCKET.IO EVENTS:

   BUILT-IN EVENTS:
   - connection
   - disconnect
   - connect_error
   - reconnect

   CUSTOM EVENTS:
   - socket.emit()
   - socket.on()

   BROADCAST PATTERNS:
   1. socket.emit()       → send to yourself
   2. io.emit()           → send to everyone
   3. socket.broadcast.emit() → everyone EXCEPT you
   4. io.to(id).emit()    → send to one user
   5. io.to(room).emit()  → send to room

   ROOMS:
   - socket.join("room1")
   - socket.leave("room1")

   This file is your essential cheat-sheet + reference for mastering
   real-time backend systems.
============================================================ */
