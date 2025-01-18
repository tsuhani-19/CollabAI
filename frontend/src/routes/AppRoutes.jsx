import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../screens/Login.jsx"; // adjust the path to your Login component
import Register from "../screens/Register.jsx";
import Home from "../screens/Home.jsx";
import Project from "../screens/Project.jsx";
import UserAuth from "../auth/UserAuth.jsx";
 // adjust the path to your Register component

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<UserAuth><Home/></UserAuth>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register/>} />
      <Route path="/project" element={<UserAuth><Project/></UserAuth>} />
    </Routes>
  );
};

export default AppRoutes;
