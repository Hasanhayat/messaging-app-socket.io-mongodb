import { useEffect, useState, useContext } from "react";
import { GlobalContext } from "../context/Context";
import api from "../api";
import { useNavigate } from "react-router";
import {
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
  CircularProgress,
} from "@mui/material";
import { Send, LogOut, MessageCircle, CircleCheckBigIcon } from "lucide-react";
import io from "socket.io-client";

const Chat = () => {
  const { state, dispatch } = useContext(GlobalContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");

        let filteredUsers = res.data.users.filter(
          (user) => user._id !== state.user._id
        );

        setUsers(filteredUsers || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const socket = io(state.ioUrl, {
    withCredentials: true,
  });

  const ioConnect = (receiverId) => {
    console.log("Connecting to WebSocket for user:", receiverId);
    
    socket.on(`${receiverId}-${state.user._id}`, (data) => {
      console.log("New message received:", data);
      setMessages((prev) => [...prev, data]);
    });
  };

  useEffect(() => {

    socket.on("connect", () => {
      console.log("Connected to WebSocket server:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected. Reason:", reason);
    });

    socket.on("error", (error) => {
      console.log("Error:", error);
    });

    return () => {
      socket.disconnect();
      console.log("Disconnected from WebSocket server");
    };
  }, []);

  const loadConversation = async (receiverId) => {
    ioConnect(receiverId);
    try {
      const res = await api.post("/messages", {
        data: {
          receiverId: receiverId,
        },
      });
      // Handle the API response format: {message: "Message Found", conversation: [...]}
      setMessages(res.data.conversation || []);
      setSelectedUser(receiverId);

      // Find and set selected user info
      const userInfo = users.find((u) => u._id === receiverId);
      setSelectedUserInfo(userInfo);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await api.post("/message", {
        receiverId: selectedUser,
        content: message,
      });

      setMessages((prev) => [...prev, res.data.chat]);
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      dispatch({ type: "USER_LOGOUT" });
      setSelectedUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return messageTime.toLocaleDateString();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="#0a0a0a"
        color="white"
      >
        <CircularProgress size={48} sx={{ color: "#2196f3", mb: 2 }} />
        <Typography color="#888">Loading chat...</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" height="100vh" bgcolor="#0a0a0a" color="white">
      {/* Sidebar */}
      <Box width="320px" bgcolor="#1a1a1a" borderRight="1px solid #333">
        {/* Header */}
        <Box p={2} borderBottom="1px solid #333">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: "#2196f3", width: 40, height: 40 }}>
                {state.user?.firstName?.[0] || "U"}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="600" color="white">
                  {state.user?.firstName} {state.user?.lastName}
                </Typography>
                <Typography
                  variant="caption"
                  color="skyblue"
                  display="flex"
                  alignItems="center"
                >
                  <Box
                    component="span"
                    width={8}
                    height={8}
                    bgcolor="skyblue"
                    borderRadius="50%"
                    mr={0.5}
                  />
                  {state.user?.email}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleLogout}
              sx={{
                color: "#888",
                "&:hover": { color: "white", bgcolor: "#333" },
              }}
            >
              <LogOut size={18} />
            </IconButton>
          </Box>
        </Box>

        {/* Users List */}
        <Box>
          <Box p={2}>
            <Typography
              variant="subtitle2"
              color="#888"
              display="flex"
              alignItems="center"
              fontWeight="500"
            >
              <MessageCircle size={16} style={{ marginRight: 8 }} />
              Conversations
            </Typography>
          </Box>
          <List
            sx={{ pt: 0, maxHeight: "calc(100vh - 140px)", overflow: "auto" }}
          >
            {users.map((user) => (
              <ListItem
                key={user._id}
                button
                onClick={() => loadConversation(user._id)}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  bgcolor:
                    selectedUser === user._id ? "#2196f3" : "transparent",
                  "&:hover": {
                    bgcolor: selectedUser === user._id ? "#1976d2" : "#333",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: selectedUser === user._id ? "#1565c0" : "#555",
                      color: "white",
                    }}
                  >
                    {user.firstName[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      fontWeight="500"
                      color={selectedUser === user._id ? "white" : "#ddd"}
                    >
                      {user.firstName} {user.lastName}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      color={selectedUser === user._id ? "#bbdefb" : "#888"}
                    >
                      {user.email}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box flex={1} display="flex" flexDirection="column">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <Box p={2} borderBottom="1px solid #333" bgcolor="#1a1a1a">
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar sx={{ bgcolor: "#2196f3", width: 40, height: 40 }}>
                  {selectedUserInfo?.firstName?.[0] || "U"}
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    color="white"
                  >
                    {selectedUserInfo?.firstName} {selectedUserInfo?.lastName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="skyblue"
                    display="flex"
                    alignItems="center"
                  >
                    <Box
                      component="span"
                      width={8}
                      height={8}
                      bgcolor="skyblue"
                      borderRadius="50%"
                      mr={0.5}
                    />
                    {selectedUserInfo?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Messages */}
            <Box
              flex={1}
              p={2}
              sx={{
                overflowY: "auto",
                maxHeight: "calc(100vh - 140px)",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-track": { bgcolor: "#333" },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "#555",
                  borderRadius: "3px",
                },
              }}
            >
              <Box display="flex" flexDirection="column" gap={2}>
                {messages.map((msg, index) => {
                  const isOwnMessage = msg.sender._id === state.user._id;
                  return (
                    <Box
                      key={msg._id || index}
                      display="flex"
                      justifyContent={isOwnMessage ? "flex-end" : "flex-start"}
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          maxWidth: "70%",
                          p: 1.5,
                          bgcolor: isOwnMessage ? "#2196f3" : "#333",
                          color: "white",
                          borderRadius: 3,
                          borderBottomRightRadius: isOwnMessage ? 1 : 3,
                          borderBottomLeftRadius: isOwnMessage ? 3 : 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ wordBreak: "break-word" }}
                        >
                          {msg.content}
                        </Typography>
                        <Box
                          display="flex"
                          alignItems="center"
                          mt={0.5}
                          color={isOwnMessage ? "#bbdefb" : "#aaa"}
                        >
                          <CircleCheckBigIcon
                            size={12}
                            style={{ marginRight: 4 }}
                          />

                          <Typography variant="caption">
                            {formatTime(msg.timestamp)}
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Message Input */}
            <Box p={2} borderTop="1px solid #333" bgcolor="#1a1a1a">
              <Box display="flex" alignItems="center" gap={1}>
                <TextField
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  variant="outlined"
                  size="small"
                  disabled={sendingMessage}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#333",
                      color: "white",
                      "& fieldset": { borderColor: "#555" },
                      "&:hover fieldset": { borderColor: "#777" },
                      "&.Mui-focused fieldset": { borderColor: "#2196f3" },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "#888",
                      opacity: 1,
                    },
                  }}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendingMessage}
                  sx={{
                    bgcolor: "#2196f3",
                    color: "white",
                    "&:hover": { bgcolor: "#1976d2" },
                    "&:disabled": { bgcolor: "#555", color: "#888" },
                  }}
                >
                  {sendingMessage ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Send size={20} />
                  )}
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            flex={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box textAlign="center">
              <MessageCircle
                size={64}
                color="#555"
                style={{ marginBottom: 16 }}
              />
              <Typography variant="h5" fontWeight="600" color="#888" mb={1}>
                Welcome to Chat
              </Typography>
              <Typography color="#666">
                Select a conversation to start messaging
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Chat;
