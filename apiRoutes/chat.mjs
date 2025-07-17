import express from "express";
import http from "http";
import { Message, User } from "../models.mjs";

const router = express.Router();

router.get("/profile", async (req, res) => {
  const user = req.user;
  try {
    const user = req.user;
    res.send({ message: "User profile", user: user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password -__v");
    res.json({ message: "Users fetched successfully", users: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId, "-password -__v");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User fetched successfully", user: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("message", async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  try {
    const message = Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content,
    });
    if (!message) {
      return res.status(400).json({ error: "Failed to send message" });
    }
    res
      .status(201)
      .json({ message: "Message sent successfully", message: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("messages", async (req, res) => {
  const { senderId, receiverId } = req.body;
   try {
        let conversation = await messageModel.find({
            $or: [
                {
                    from: receiverId,
                    to: senderId
                },
                {
                    from: senderId,
                    to: receiverId,
                }
            ]
        })
        res.send({message: "Message Found", conversation: conversation})
    } catch (error) {
        res.status(500).send({message: "Internal Server Error"})
    }
});
export default router;
