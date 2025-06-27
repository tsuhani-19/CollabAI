// src/context/UserContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import React from "react";


const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token); // get user info from token
        setUser(decoded); // decoded = { _id, name, email, etc. }
      } catch (err) {
        console.error("Invalid token");
        localStorage.removeItem("token");
      }
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
