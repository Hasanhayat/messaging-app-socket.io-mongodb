import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "../context/Context";
import api from "../api";
import {
  CircularProgress,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
} from "@mui/material";
import { Send } from "lucide-react";

const Chat = () => {
  const { state } = useContext(GlobalContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(res.data.users);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const loadConversation = async (receiverId) => {
    try {
      const res = await api.post("/messages", {
        data: {
          receiverId: receiverId,
        },
      });
      setMessages(res.data.conversation);
      setSelectedUser(receiverId);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      const res = await api.post("/message", {
        senderId: state.user._id,
        receiverId: selectedUser,
        content: message,
      });
      setMessages((prev) => [...prev, res.data.message]);
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  return (
    <Box display="flex" height="100vh" bgcolor="#121212" color="#fff">
      {/* Sidebar */}
      <Box width="25%" bgcolor="#1f1f1f" p={2}>
        <Typography variant="h6" gutterBottom>
          Users
        </Typography>
        <List>
          {users
            .filter((u) => u._id !== state.user._id)
            .map((user) => (
              <ListItem
                button
                key={user._id}
                onClick={() => loadConversation(user._id)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: selectedUser === user._id ? "#2e2e2e" : "inherit",
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "#2196f3" }}>
                    {user.firstName[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  primaryTypographyProps={{ color: "#fff" }}
                />
              </ListItem>
            ))}
        </List>
      </Box>

      {/* Chat area */}
      <Box flex={1} display="flex" flexDirection="column" p={2}>
        {selectedUser ? (
          <>
            <Box flex={1} overflow="auto" px={1}>
              {messages.map((msg, index) => (
                <Paper
                  key={index}
                  elevation={2}
                  sx={{
                    alignSelf:
                      msg.sender === state.user._id ? "flex-end" : "flex-start",
                    bgcolor: msg.sender === state.user._id ? "#2196f3" : "#333",
                    color: "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    my: 1,
                    maxWidth: "70%",
                  }}
                >
                  {msg.content}
                </Paper>
              ))}
            </Box>
            <Box display="flex" mt={2}>
              <TextField
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                sx={{ bgcolor: "#2a2a2a", input: { color: "white" } }}
              />
              <IconButton onClick={handleSendMessage} color="primary">
                <Send size={20} />
              </IconButton>
            </Box>
          </>
        ) : (
          <Typography variant="h6" color="gray" align="center" mt={4}>
            Select a user to start chatting
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Chat;
