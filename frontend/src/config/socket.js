import io from 'socket.io-client';

let socket;

export const initializeSocket = (projectId) => {
  socket = io('http://localhost:3000', {
    query: { projectId },
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });
};

export const receiveMessage = (event, callback) => {
  if (!socket) return;
  socket.on(event, callback);
};

export const sendMessage = (event, data) => {
  if (!socket) return;
  socket.emit(event, data);
};