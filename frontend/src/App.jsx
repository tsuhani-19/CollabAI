import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify"; // ✅ Add this
import "react-toastify/dist/ReactToastify.css"; // ✅ Import the CSS

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Room from "./pages/Room"; // dummy for now
import { UserProvider } from "./context/UserContext";

// Optional: Protect routes if user not logged in
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} /> {/* ✅ Add this */}
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/room/:projectId" element={<PrivateRoute><Room /></PrivateRoute>} />

          {/* Optional 404 Page */}
          <Route path="*" element={<div className="text-center mt-10 text-white">404 - Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
