import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
      });
      toast.success("Registered successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d1a]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1a2e] p-8 rounded-xl shadow-lg w-[400px]"
      >
        <h2 className="text-white text-2xl mb-6 font-semibold text-center">
          Create an account
        </h2>
        <input
          type="text"
          placeholder="Name"
          className="w-full p-3 mb-4 rounded bg-[#0f1120] text-white border border-[#444]"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded bg-[#0f1120] text-white border border-[#444]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 rounded bg-[#0f1120] text-white border border-[#444]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
        >
          Register
        </button>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Already have an account? <Link to="/login" className="text-indigo-400">Log in</Link>
        </p>
      </form>
    </div>
  );
}