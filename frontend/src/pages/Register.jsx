import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import api from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", { name, email, password });
      toast.success("Registered successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Floating glowing shapes */}
      <div className="absolute w-96 h-96 bg-purple-700/30 rounded-full blur-[120px] top-[-10%] left-[-10%] animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-pink-600/30 rounded-full blur-[120px] bottom-[-10%] right-[-10%] animate-pulse delay-300"></div>

      {/* Neon glowing floating squares */}
      <div className="absolute top-12 left-16 w-16 h-16 border-2 border-purple-400 rotate-45 animate-bounce-slow shadow-[0_0_20px_#a855f7]"></div>
      <div className="absolute bottom-20 right-20 w-20 h-20 border-2 border-pink-400 rotate-12 animate-bounce-slow shadow-[0_0_25px_#ec4899]"></div>

      {/* Register Card */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-[400px] p-8 rounded-2xl 
                   bg-black/30 backdrop-blur-2xl 
                   border border-transparent 
                   [border-image:linear-gradient(90deg,#9333ea,#ec4899,#3b82f6)_1] 
                   shadow-[0_0_40px_rgba(147,51,234,0.6)] text-white"
      >
        {/* Logo Text */}
        <div className="flex justify-center mb-6">
          <div className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text 
                          bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 
                          drop-shadow-[0_0_15px_#22d3ee] animate-pulse">
            CollabAI
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-semibold mb-6">
          Create your account
        </h2>

        {/* Inputs */}
        <motion.input
          whileFocus={{ scale: 1.03, boxShadow: "0 0 20px #6366f1" }}
          type="text"
          placeholder="Name"
          className="w-full mb-4 p-3 rounded-xl bg-transparent border 
                     border-white/40 text-white placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <motion.input
          whileFocus={{ scale: 1.03, boxShadow: "0 0 20px #6366f1" }}
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-xl bg-transparent border 
                     border-white/40 text-white placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <motion.input
          whileFocus={{ scale: 1.03, boxShadow: "0 0 20px #6366f1" }}
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded-xl bg-transparent border 
                     border-white/40 text-white placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Register Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 25px #ec4899" }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="w-full py-3 rounded-xl font-bold text-lg 
                     bg-gradient-to-r from-pink-500 to-purple-600 
                     shadow-[0_0_25px_rgba(236,72,153,0.7)]
                     hover:opacity-90 transition-all"
        >
          Register
        </motion.button>

        {/* Login Link */}
        <p className="mt-6 text-center text-gray-300 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-purple-400 hover:underline hover:text-pink-400 transition"
          >
            Log in
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
