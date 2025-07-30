import React, { useContext, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalContext } from "./context/Context.jsx";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import api from "./api";

function App() {
  const { state, dispatch } = useContext(GlobalContext);
  const fetchUser = async () => {
    try {
      const res = await api.get("/profile");
      if (res.data.user) {
        dispatch({ type: "USER_LOGIN", user: res.data.user });
      }
    } catch (err) {
      console.log("Not logged in or session expired.");
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <>
      {state.isLogin ? (
        <Routes>
          <Route path="*" element={<Navigate to="/chat" replace />} />
          <Route path="/login" element={<Navigate to="/chat" replace />} />
          <Route path="/signup" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
      <Toaster position="top-center" reverseOrder={false} />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
