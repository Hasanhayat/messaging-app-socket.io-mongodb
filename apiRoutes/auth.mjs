import express from "express";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models.mjs";
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/sign-up", async (req, res) => {
  let { firstName, lastName, email, password } = req.body;
  email = email.toLowerCase();
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    // new user
    let result = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    //jwt token
    const token = jwt.sign(
      {
        id: result._id,
        email: result.email,
        firstName:result.firstName,
        lastName: result.lastName,
        iat: Date.now() / 1000,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("Token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 86400000, //1 day
    });
    result.password = "*******"

    res
      .status(201)
      .json({ message: "User registered successfully",user: result });
  } catch (error) {
    console.log("Error during sign-up:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        iat: Date.now() / 1000,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("Token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 86400000, //1 day
    });
    user.password = "*******"

    res.json({ message: "Login successful", user: user });
  } catch (error) {
    console.log("Error during login:", error);
    res.status(500).json({ error: "Internal server error"});
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("Token", {
    httpOnly: true,
    secure: true,
    maxAge: 0, // Clear the cookie
  });
  res.json({ message: "Logout successful" });
});

export default router;
