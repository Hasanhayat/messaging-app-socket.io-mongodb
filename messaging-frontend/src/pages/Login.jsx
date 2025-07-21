import React, { useContext, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { GlobalContext } from "../context/Context";
import { TextField, Button, CircularProgress } from "@mui/material";
import { LogIn } from "lucide-react";
import { Link } from "react-router";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { dispatch } = useContext(GlobalContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/login", form);
      dispatch({ type: "USER_LOGIN", user: res.data.user });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-2xl shadow-lg w-full max-w-sm p-8 space-y-4"
      >
        <div className="text-white text-center space-y-2">
          <LogIn className="mx-auto text-green-400" size={32} />
          <h2 className="text-2xl font-bold">Login</h2>
        </div>

        <TextField
          fullWidth
          label="Email"
          margin="normal"
          type="email"
          variant="filled"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <TextField
          className="mt-4"
          margin="normal"
          fullWidth
          label="Password"
          type="password"
          variant="filled"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="success"
          disabled={loading}
          className="!mt-6"
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
        </Button>

        <div className="text-sm text-center text-gray-400 mt-4">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-400 hover:underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
