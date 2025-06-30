// socket.js
import { io } from "socket.io-client";

const URL = "http://localhost:5000"; // ✅ Update if deployed
const socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false, // You call .connect() manually after user joins project
  reconnectionAttempts: 5,
  timeout: 10000,
});

export default socket;
