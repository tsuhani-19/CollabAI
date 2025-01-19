// filepath: /c:/Users/LENOVO/my-node-project/chatapp/frontend/src/context/usercontext.jsx
import React, { createContext, useState } from 'react';

// Create a context for the user
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
