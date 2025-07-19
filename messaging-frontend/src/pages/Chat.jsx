import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "../context/Context";
import api from "../api";
import { CircularProgress, Box, Typography, TextField, Button, Avatar, List, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

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
      const res = await api.get("/messages", {
        data: {
          senderId: state.user._id,
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
      setMessages([...messages, res.data.message]);
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  return (
    <Box display="flex" height="100vh">
      {/* Sidebar for users */}
      <Box width="25%" bgcolor="#f5f5f5" p={2}>
        <Typography variant="h6" gutterBottom>
          Users
        </Typography>
        <List>
          {users.filter(u => u._id !== state.user._id).map((user) => (
            <ListItem button key={user._id} onClick={() => loadConversation(user._id)}>
              <ListItemAvatar>
                <Avatar>{user.firstName[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={`${user.firstName} ${user.lastName}`} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Chat area */}
      <Box flex={1} display="flex" flexDirection="column" p={2}>
        {selectedUser ? (
          <>
            <Box flex={1} overflow="auto">
              {messages.map((msg, index) => (
                <Box
                  key={index}
                  alignSelf={msg.sender === state.user._id ? "flex-end" : "flex-start"}
                  bgcolor={msg.sender === state.user._id ? "#1976d2" : "#e0e0e0"}
                  color={msg.sender === state.user._id ? "white" : "black"}
                  borderRadius={2}
                  p={1.5}
                  m={1}
                  maxWidth="70%"
                >
                  {msg.content}
                </Box>
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
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ ml: 1 }}
                onClick={handleSendMessage}
                endIcon={<SendIcon />}
              >
                Send
              </Button>
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
