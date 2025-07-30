"use client"

import { useEffect, useState, useContext } from "react"
import { GlobalContext } from "../context/Context"
import api from "../api"
import { useNavigate } from "react-router"
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  CircularProgress,
  TextField,
  Paper,
  Badge,
} from "@mui/material"
import { Send, LogOut, MessageCircle, Clock, X } from "lucide-react"
import io from "socket.io-client"
import { useSnackbar } from "notistack"

const Chat = () => {
  const { state, dispatch } = useContext(GlobalContext)
  const navigate = useNavigate()
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserInfo, setSelectedUserInfo] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingConversation, setLoadingConversation] = useState(false)

  const socket = io(state.ioUrl, {
    withCredentials: true,
  })

  // ✅ Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users")
        const filteredUsers = res.data.users.filter((user) => user._id !== state.user._id)
        setUsers(filteredUsers || [])
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // ✅ Socket Setup
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket:", socket.id)
    })

    // 🔔 Personal Notification Listener
    socket.on(`personal-channel-${state.user._id}`, (data) => {
      console.log("Notification received:", data)
      enqueueSnackbar(`New message from ${data.sender.firstName}: ${data.content}`, {
        variant: "info",
        autoHideDuration: 7000,
        action: (key) => (
          <button
            onClick={() => {
              loadConversation(data.sender._id)
              setSelectedUser(data.sender._id)
              closeSnackbar(key)
            }}
            style={{
              background: "#1976d2",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
              borderRadius: "4px",
              padding: "4px 10px",
              marginLeft: "10px",
              fontSize: "0.85rem",
              transition: "background 0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.background = "#1565c0")}
            onMouseOut={(e) => (e.target.style.background = "#1976d2")}
          >
            Open Chat
          </button>
        ),
      })
    })

    socket.on("disconnect", (reason) => {
      console.log("Disconnected. Reason:", reason)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // ✅ Load Conversation
  const ioConnect = (receiverId) => {
    console.log("Listening to:", `${receiverId}-${state.user._id}`)
    socket.on(`${receiverId}-${state.user._id}`, (data) => {
      console.log("New message:", data)
      setMessages((prev) => [...prev, data])
    })
  }

  const loadConversation = async (receiverId) => {
    setLoadingConversation(true)
    socket.disconnect()
    ioConnect(receiverId)
    try {
      const res = await api.post("/messages", {
        data: { receiverId },
      })
      setMessages(res.data.conversation || [])
      setSelectedUser(receiverId)
      const userInfo = users.find((u) => u._id === receiverId)
      setSelectedUserInfo(userInfo)
      
    } catch (err) {
      console.error("Error loading conversation:", err)
    } finally {
      setLoadingConversation(false)
    }
  }

  // ✅ Close Chat (for mobile)
  const handleCloseChat = () => {
    setSelectedUser(null)
    setSelectedUserInfo(null)
    setMessages([])
    socket.disconnect()
  }

  // ✅ Send Message
  const handleSendMessage = async () => {
    if (!message.trim() || sendingMessage) return
    setSendingMessage(true)
    try {
      const res = await api.post("/message", {
        receiverId: selectedUser,
        content: message,
      })
      setMessages((prev) => [...prev, res.data.chat])
      setMessage("")
    } catch (err) {
      console.error("Error sending message:", err)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await api.post("/logout")
      dispatch({ type: "USER_LOGOUT" })
      navigate("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  // ✅ Time Format
  const formatTime = (timestamp) => {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diff = Math.floor((now - messageTime) / (1000 * 60))
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return messageTime.toLocaleDateString()
  }

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
        sx={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 4,
            borderRadius: 3,
            bgcolor: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box sx={{ position: "relative", mb: 3 }}>
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: "#2196f3",
                filter: "drop-shadow(0 0 10px rgba(33, 150, 243, 0.3))",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <MessageCircle size={24} color="#2196f3" />
            </Box>
          </Box>
          <Typography variant="h6" color="white" fontWeight="600" mb={1} sx={{ textAlign: "center" }}>
            Loading Chat
          </Typography>
          <Typography variant="body2" color="#888" sx={{ textAlign: "center" }}>
            Connecting to your conversations...
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 0.5,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "#2196f3",
                  animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 0.3 },
                    "50%": { opacity: 1 },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      height="100vh"
      bgcolor="#0a0a0a"
      color="white"
      sx={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
      }}
    >
      {/* Sidebar */}
      <Box
        width={{ xs: "100%", md: "380px" }}
        bgcolor="rgba(26, 26, 26, 0.95)"
        borderRight="1px solid rgba(255, 255, 255, 0.1)"
        sx={{
          backdropFilter: "blur(10px)",
          display: { xs: selectedUser ? "none" : "flex", md: "flex" },
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: "rgba(33, 150, 243, 0.1)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 0,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                badgeContent={
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: "#4caf50",
                      border: "2px solid #1a1a1a",
                    }}
                  />
                }
              >
                <Avatar
                  sx={{
                    bgcolor: "#2196f3",
                    width: 48,
                    height: 48,
                    fontSize: "1.2rem",
                    fontWeight: "600",
                  }}
                >
                  {state.user?.firstName?.[0]}
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="h6" fontWeight="600" color="white">
                  {state.user?.firstName} {state.user?.lastName}
                </Typography>
                <Typography variant="caption" color="#64b5f6">
                  {state.user?.email}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleLogout}
              sx={{
                color: "#ff5722",
                bgcolor: "rgba(255, 87, 34, 0.1)",
                "&:hover": {
                  bgcolor: "rgba(255, 87, 34, 0.2)",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <LogOut size={20} />
            </IconButton>
          </Box>
        </Paper>

        {/* Users Section Header */}
        <Box p={3} pb={1}>
          <Typography
            variant="subtitle1"
            color="#888"
            display="flex"
            alignItems="center"
            fontWeight="600"
            sx={{ textTransform: "uppercase", letterSpacing: 1 }}
          >
            <MessageCircle size={18} style={{ marginRight: 12 }} />
            Conversations ({users.length})
          </Typography>
        </Box>

        {/* Users List */}
        <Box flex={1} sx={{ overflowY: "auto" }}>
          <List sx={{ px: 2 }}>
            {users.map((user, index) => (
              <ListItem
                key={user._id}
                button
                onClick={() => loadConversation(user._id)}
                sx={{
                  borderRadius: 3,
                  mb: 1,
                  bgcolor: selectedUser === user._id ? "rgba(33, 150, 243, 0.15)" : "transparent",
                  border: selectedUser === user._id ? "1px solid rgba(33, 150, 243, 0.3)" : "1px solid transparent",
                  "&:hover": {
                    bgcolor: selectedUser === user._id ? "rgba(33, 150, 243, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    transform: "translateX(4px)",
                  },
                  transition: "all 0.3s ease",
                  animation: `slideIn 0.3s ease ${index * 0.1}s both`,
                  "@keyframes slideIn": {
                    from: { opacity: 0, transform: "translateY(20px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "#4caf50",
                          border: "2px solid #1a1a1a",
                        }}
                      />
                    }
                  >
                    <Avatar
                      sx={{
                        bgcolor: selectedUser === user._id ? "#1976d2" : "#424242",
                        color: "white",
                        fontWeight: "600",
                        width: 44,
                        height: 44,
                      }}
                    >
                      {user.firstName[0]}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle1"
                      fontWeight="500"
                      color={selectedUser === user._id ? "#2196f3" : "white"}
                    >
                      {user.firstName} {user.lastName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color={selectedUser === user._id ? "#64b5f6" : "#888"}>
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
      <Box
        flex={1}
        display="flex"
        flexDirection="column"
        sx={{
          display: { xs: selectedUser ? "flex" : "none", md: "flex" },
        }}
      >
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: "rgba(26, 26, 26, 0.95)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                borderRadius: 0,
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "#4caf50",
                          border: "2px solid #1a1a1a",
                        }}
                      />
                    }
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#2196f3",
                        width: 48,
                        height: 48,
                        fontSize: "1.2rem",
                        fontWeight: "600",
                      }}
                    >
                      {selectedUserInfo?.firstName?.[0]}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="h6" fontWeight="600" color="white">
                      {selectedUserInfo?.firstName} {selectedUserInfo?.lastName}
                    </Typography>
                    <Typography variant="caption" color="#4caf50" display="flex" alignItems="center">
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#4caf50",
                          mr: 1,
                          animation: "pulse 2s infinite",
                          "@keyframes pulse": {
                            "0%": { opacity: 1 },
                            "50%": { opacity: 0.5 },
                            "100%": { opacity: 1 },
                          },
                        }}
                      />
                    {selectedUserInfo?.email}
                    </Typography>
                  </Box>
                </Box>
                {/* Close Button for Mobile */}
                <IconButton
                  onClick={handleCloseChat}
                  sx={{
                    display: { xs: "flex", md: "none" },
                    color: "#ff5722",
                    bgcolor: "rgba(255, 87, 34, 0.1)",
                    "&:hover": {
                      bgcolor: "rgba(255, 87, 34, 0.2)",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <X size={20} />
                </IconButton>
              </Box>
            </Paper>

            {/* Messages */}
            <Box
              flex={1}
              p={3}
              sx={{
                overflowY: "auto",
                background: "linear-gradient(180deg, rgba(10, 10, 10, 0.5) 0%, rgba(26, 26, 26, 0.3) 100%)",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-track": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "rgba(33, 150, 243, 0.5)",
                  borderRadius: "3px",
                  "&:hover": { bgcolor: "rgba(33, 150, 243, 0.7)" },
                },
              }}
            >
              {loadingConversation ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Box textAlign="center">
                    <CircularProgress size={40} sx={{ color: "#2196f3", mb: 2 }} />
                    <Typography color="#888">Loading conversation...</Typography>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender._id === state.user._id
                    return (
                      <Box
                        key={msg._id || index}
                        display="flex"
                        justifyContent={isOwn ? "flex-end" : "flex-start"}
                        sx={{
                          animation: `messageSlide 0.3s ease ${index * 0.05}s both`,
                          "@keyframes messageSlide": {
                            from: { opacity: 0, transform: "translateY(10px)" },
                            to: { opacity: 1, transform: "translateY(0)" },
                          },
                        }}
                      >
                        <Paper
                          elevation={3}
                          sx={{
                            p: 2,
                            maxWidth: "70%",
                            bgcolor: isOwn ? "#2196f3" : "rgba(66, 66, 66, 0.8)",
                            color: "white",
                            borderRadius: 3,
                            borderTopRightRadius: isOwn ? 1 : 3,
                            borderTopLeftRadius: isOwn ? 3 : 1,
                            backdropFilter: "blur(10px)",
                            border: `1px solid ${isOwn ? "rgba(33, 150, 243, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                            position: "relative",
                            "&::before": isOwn
                              ? {
                                  content: '""',
                                  position: "absolute",
                                  top: 0,
                                  right: -8,
                                  width: 0,
                                  height: 0,
                                  borderLeft: "8px solid #2196f3",
                                  borderTop: "8px solid transparent",
                                }
                              : {
                                  content: '""',
                                  position: "absolute",
                                  top: 0,
                                  left: -8,
                                  width: 0,
                                  height: 0,
                                  borderRight: "8px solid rgba(66, 66, 66, 0.8)",
                                  borderTop: "8px solid transparent",
                                },
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              wordBreak: "break-word",
                              lineHeight: 1.4,
                            }}
                          >
                            {msg.content}
                          </Typography>
                          <Box
                            display="flex"
                            alignItems="center"
                            mt={1}
                            color={isOwn ? "rgba(255, 255, 255, 0.8)" : "#aaa"}
                          >
                            <Clock size={12} style={{ marginRight: 6 }} />
                            <Typography variant="caption">{formatTime(msg.timestamp)}</Typography>
                          </Box>
                        </Paper>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Box>

            {/* Message Input */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: "rgba(26, 26, 26, 0.95)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                borderRadius: 0,
              }}
            >
              <Box display="flex" gap={2} alignItems="flex-end">
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  variant="outlined"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendingMessage}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      borderRadius: 3,
                      "& fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        borderWidth: 1,
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(33, 150, 243, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#2196f3",
                        borderWidth: 2,
                      },
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
                    width: 48,
                    height: 48,
                    "&:hover": {
                      bgcolor: "#1976d2",
                      transform: "scale(1.05)",
                    },
                    "&:disabled": {
                      bgcolor: "rgba(66, 66, 66, 0.5)",
                      color: "#888",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {sendingMessage ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
                </IconButton>
              </Box>
            </Paper>
          </>
        ) : (
          <Box
            flex={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              background: "linear-gradient(135deg, rgba(10, 10, 10, 0.5) 0%, rgba(26, 26, 26, 0.3) 100%)",
            }}
          >
            <Box textAlign="center" p={4}>
              <Box
                sx={{
                  mb: 3,
                  p: 3,
                  borderRadius: "50%",
                  bgcolor: "rgba(33, 150, 243, 0.1)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle size={48} color="#2196f3" />
              </Box>
              <Typography variant="h5" fontWeight="600" color="white" mb={2}>
                Welcome to Chat
              </Typography>
              <Typography variant="body1" color="#888" mb={3}>
                Select a conversation from the sidebar to start messaging
              </Typography>
              <Box display="flex" justifyContent="center" gap={1}>
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#2196f3",
                      animation: `bounce 1.5s ease-in-out ${i * 0.2}s infinite`,
                      "@keyframes bounce": {
                        "0%, 100%": { transform: "translateY(0)" },
                        "50%": { transform: "translateY(-10px)" },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Chat
