import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './screens/Home.jsx';
import Login from './screens/Login.jsx';
import Register from './screens/Register.jsx';
import Project from './screens/Project.jsx';
import { UserProvider } from './context/Usercontext.jsx';  // Import the UserProvider

const App = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/project" element={<Project />} />
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;