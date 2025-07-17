import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import cookieParser from "cookie-parser";
import mongoose from 'mongoose';
import { config } from 'dotenv';
import auth from './apiRoutes/auth.mjs'
config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  cors({
    origin: ["*"], // ya deployed frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.SECRET_TOKEN;


mongoose.connect(MONGO_URI);
const db = mongoose.connection;

db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.get("/api/v1/", (req, res) => {
  res.send("Welcome to the E-commerce API");
});
app.use("/api/v1", auth)

// app.post("/api/v1/sign-up", async (req, res) => {
//   let { firstName, lastName, email, password } = req.body;
//   email = email.toLowerCase();
//   try {
//     if (!firstName || !lastName || !email || !password) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const existingUser = await db.query(
//       "SELECT * FROM users WHERE email = $1",
//       [email]
//     );

//     if (existingUser.rows.length > 0) {
//       return res.status(400).json({ error: "Email already exists" });
//     }

//     // Hash password
//     const salt = bcrypt.genSaltSync(10);
//     const hashedPassword = bcrypt.hashSync(password, salt);
//     // new user
//     await db.query(
//       "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)",
//       [firstName, lastName, email, hashedPassword]
//     );

//     let user = await db.query("SELECT * FROM users WHERE email = $1", [email]);

//     //jwt token
//     const token = jwt.sign(
//       {
//         id: user.rows[0].id,
//         email: user.rows[0].email,
//         firstName: user.rows[0].first_name,
//         lastName: user.rows[0].last_name,
//         user_role: user.rows[0].role || "4", // Default role if not set
//         iat: Date.now() / 1000,
//       },
//       JWT_SECRET,
//       { expiresIn: "1d" }
//     );
//     res.cookie("Token", token, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 86400000, //1 day
//     });

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error("Error during sign-up:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.post("/api/v1/login", async (req, res) => {
//   let { email, password } = req.body;
//   email = email.toLowerCase();
//   if (!email || !password) {
//     return res.status(400).json({ error: "Email and password are required" });
//   }
//   try {
//     const user = await db.query("SELECT * FROM users WHERE email = $1", [
//       email,
//     ]);

//     if (user.rows.length === 0) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     const isPasswordValid = bcrypt.compareSync(password, user.rows[0].password);

//     if (!isPasswordValid) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     // Generate token
//     const token = jwt.sign(
//       {
//         id: user.rows[0].id,
//         email: user.rows[0].email,
//         firstName: user.rows[0].first_name,
//         lastName: user.rows[0].last_name,
//         user_role: user.rows[0].role || "4", // Default role if not set
//         iat: Date.now() / 1000,
//       },
//       JWT_SECRET,
//       { expiresIn: "1d" }
//     );
//     res.cookie("Token", token, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 86400000, //1 day
//     });

//     res.json({ message: "Login successful", user: user.rows[0] });
//   } catch (error) {
//     console.log("Error during login:", error);
//     res.status(500).json({ error: "Internal server error", msg: error });
//   }
// });

// Middleware to check JWT token
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

app.get("/api/v1/profile", async (req, res) => {
  const user = req.user;
  try {
    let result = await db.query("SELECT * FROM users WHERE id = $1", [user.id]);
    res.send({ message: "User profile", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/v1/logout", (req, res) => {
  res.clearCookie("Token", {
    httpOnly: true,
    secure: true,
    maxAge: 0, // Clear the cookie
  });
  res.json({ message: "Logout successful" });
});

app.get("/api/v1/products", async (req, res) => {
  try {
    const products = await db.query(
      "SELECT name, description, price, image, category_name FROM products INNER JOIN categories ON products.category_id = categories.category_id"
    );
    res.json(products.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/v1/categories", async (req, res) => {
  try {
    const categories = await db.query("SELECT * FROM categories");
    res.json(categories.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//middeware to check if user is admin
app.use("/api/v1/*splat", (req, res, next) => {
  const user = req.user;
  if (user.user_role !== 1) {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
});

app.post("/api/v1/categories", async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const newCategory = await db.query(
      "INSERT INTO categories (category_name) VALUES ($1) RETURNING *",
      [name]
    );
    res.status(201).json(newCategory.rows[0]);
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/v1/products", async (req, res) => {
  const { name, description, price, image, category_id } = req.body;
  try {
    if (!name || !description || !price || !image || !category_id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newProduct = await db.query(
      "INSERT INTO products (name, description, price, image, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, price, image, category_id]
    );

    res.status(201).json(newProduct.rows[0]);
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/v1/users", async (req, res) => {
  try {
    const users = await db.query(
      "SELECT id, first_name, last_name, email, profile_img, role, phone, created_at FROM users"
    );
    res.json({ message: "Users fetched successfully", users: users.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Middleware to serve static files
let __dirname = path.resolve();
// app.use(express.static(path.join(__dirname, "frontend", "dist")));
app.use("/", express.static(path.join(__dirname, "./FRONTEND/dist")));
app.use("/*splat", express.static(path.join(__dirname, "FRONTEND", "dist")));







app.linkten(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

