import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import api from "../api";
import { GlobalContext } from "../context/Context";
import { TextField, Button, CircularProgress } from "@mui/material";
import { UserPlus } from "lucide-react";
import { Link } from "react-router";

const Signup = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { dispatch } = useContext(GlobalContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/sign-up", form);
      toast.success(res.data.message);
      dispatch({ type: "USER_LOGIN", user: res.data.user });
      setForm({ firstName: "", lastName: "", email: "", password: "" });
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
          <UserPlus className="mx-auto text-blue-400" size={32} />
          <h2 className="text-2xl font-bold">Create Account</h2>
        </div>

        <TextField
          fullWidth
          label="First Name"
          margin="normal"
          variant="outlined"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          required
        />
        <TextField
          className="mt-4"
          margin="normal"
          fullWidth
          label="Last Name"
          variant="outlined"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          required
        />
        <TextField
          className="mt-4"
          margin="normal"
          fullWidth
          label="Email"
          type="email"
          variant="outlined"
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
          variant="outlined"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          className="!mt-6"
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
        </Button>

        <div className="text-sm text-center text-gray-400 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
