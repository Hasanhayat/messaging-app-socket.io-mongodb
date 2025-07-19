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

app.use("/api/v1", chat)





let __dirname = path.resolve();
app.use("/", express.static(path.join(__dirname, "./FRONTEND/dist")));
app.use("/*splat", express.static(path.join(__dirname, "FRONTEND", "dist")));







app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

