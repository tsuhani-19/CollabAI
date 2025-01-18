import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './screens/Home.jsx';
import Login from './screens/Login.jsx';
import Register from './screens/Register.jsx';
import Project from './screens/Project.jsx';  // Import the Project component

import { UserProvider } from "./context/Usercontext.jsx";

const App = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/project" element={<Project />} />  // Define the Project route
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;