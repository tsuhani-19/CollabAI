import { io } from 'socket.io-client';

let socket;

export const initializeSocket = (projectId) => {
    socket = io(import.meta.env.VITE_API_URL, {
        query: { projectId }
    });
};

export const sendMessage = (event, data) => {
    if (socket) {
        socket.emit(event, data);
    }
};

export const receiveMessage = (event, callback) => {
    if (socket) {
        socket.on(event, callback);
    }
};