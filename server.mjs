import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import mongoose from 'mongoose';
import 'dotenv/config'
import jwt from 'jsonwebtoken';
import auth from './apiRoutes/auth.mjs'
import chat from './apiRoutes/chat.mjs'


const app = express();


// web socket 
import { Server } from 'socket.io';
import { createServer } from "http";
// Create an HTTP server
const server = createServer(app);
// Create a new instance of Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ya deployed frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
})

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on("disconnect", (reason) => {
        console.log("Client disconnected:", socket.id, "Reason:", reason);
    });
});

// setInterval(() => {
//   io.emit("message", { message: new Date().toLocaleTimeString() });
// }, 3000);
/////////
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"], // ya deployed frontend URL
    credentials: true,
  })
);

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;


mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on("connected", () => console.log("Connected to MongoDB"));
mongoose.connection.on("error", () =>
  console.log("Error connecting to MongoDB")
);


app.get("/api/v1/", (req, res) => {
  res.send("Welcome to the E-commerce API");
});
app.use("/api/v1", auth)

app.use("/api/v1/*splat", (req, res, next) => {
  const token = req.cookies.Token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
});

app.use("/api/v1", chat(io))





let __dirname = path.resolve();
app.use("/", express.static(path.join(__dirname, "./messaging-frontend/dist")));
app.use("/*splat", express.static(path.join(__dirname, "messaging-frontend", "dist")));





// Socket.IO connection if we use socket.io then we need to use http server.listen
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

