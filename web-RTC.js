import express from "express";
const app = express();

//1. Http handshake
import { createServer } from "http";
const httpServer = createServer(app);
//http handshake
//2. CORS security check
import cors from "cors";
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
};
app.use(cors());
//3. socket.io server setup
import { Server } from "socket.io";

const io = new Server(httpServer, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  console.log("New connection with id: ", socket.id);

  socket.on("message", (data) => {
    console.log(data.message);
    io.to(data.reciever).emit("forward", data);
  });
});

app.get("/", (req, res) => {
  res.send("Welcome to the chat app");
});

httpServer.listen(3000, () => {
  console.log("Server is live on http://localhost:3000/");
});

/*
┌─────────────────────────────────────────┐
│           Node.js HTTP Server           │  <-- handles WebSocket handshake
│  ┌────────────────────────────────────┐ │
│  │             Express App            │ │  <-- handles normal HTTP routes
│  └────────────────────────────────────┘ │
│                                         │
│            Socket.io Server             │  <-- handles real-time events
└─────────────────────────────────────────┘

⭐ 5. Why must Socket.io attach to HTTP server?

Because Socket.io needs to:

manage WebSocket connections

upgrade connections from HTTP to WS

fallback to polling if WS fails

use same port as Express

share cookies/session info

share middleware

If you try to attach Socket.io directly to Express → it will fail.
////////////////////////////////////////////////////////////////////////////////
✔ If your frontend and backend run on different ports or domains

➡ CORS is required
➡ Otherwise browser will block the connection

✔ CORS is a browser-side security rule, not a backend issue.
✔ For local development with React + Node

➡ CORS must be enabled
➡ Otherwise Socket.io will NOT connect.
*/
/*
////////////////////////////////////////////////////////////////////////////////////////////////////
import './App.css'
import { io } from 'socket.io-client'
import { useEffect, useMemo, useState } from 'react'

function App() {

  const [messages, setMessages] = useState([])
  const [socketId, setSocketId] = useState("")

  //request the server to connect
  // socket = client
  const socket = useMemo(()=>io('http://localhost:3000'), [])
  
  const handleSubmit = (e)=>{
    e.preventDefault();
    //emitting the message
    const message = e.target[0].value;
    const reciever = e.target[1].value;
    socket.emit('message', {message, reciever})
  }

  useEffect(()=>{
    socket.on("connect", ()=>{
      console.log("Connected to the server");
      setSocketId(socket.id)

    })

    socket.on("forward", (data)=>{
      console.log(data);
      setMessages((prev)=>[...prev, data.message])
    })
  }, [])

  return (
    <>
    <h1>Socket app</h1>
    <p>{socketId}</p>
    

    <form className="message" onSubmit={handleSubmit} >
      <input type="text"  placeholder='Please enter your message' />
      <input type='text' placeholder='Enter Reciever Id' />
      <button type='submit'>Send Message</button>
    </form>

    <div className='messages'>
      {
        messages.map((message, index)=>{
          return <div key={index} className='app-message'>
            {message}
            </div>
        })
      }
    </div>

    </>
  )
}

export default App
*/
