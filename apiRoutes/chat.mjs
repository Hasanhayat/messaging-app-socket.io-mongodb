import express from "express";
import http from "http";
import { Message, User } from "../models.mjs";
import { log } from "console";

const router = express.Router();
router.use(express.json());

export default function (io) {
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

  router.post("/message", async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;
    try {
      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content: content,
      });
      if (!message) {
        return res.status(400).json({ error: "Failed to send message" });
      }

      // Optionally, you can populate the sender and receiver details
      const populatedMessage = await Message.findById(message._id)
        .populate({ path: 'sender', select: 'firstName lastName email' })
        .populate({ path: 'receiver', select: 'firstName lastName email' })
        .exec();
        io.emit("message", {
          message: populatedMessage,
        });
      res
        .status(201)
        .json({ message: "Message sent successfully", chat: populatedMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  router.post("/messages", async (req, res) => {
    const { receiverId } = req.body.data;
    const senderId = req.user.id;

    try {
      let conversation = await Message.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ]
      }).populate({path: 'sender', select: 'firstName lastName email'})
        .populate({path: 'receiver', select: 'firstName lastName email'})
        .exec();

      res.send({ message: "Message Found", conversation: conversation });
    } catch (error) {
      res.status(500).send({ message: "Internal Server Error", error: error });
    }
  });

  return router;
}
