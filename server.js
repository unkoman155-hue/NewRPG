const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
cors: {
origin: "*"
}
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();

function createRoomId() {
let id;

do {
id = Math.random().toString(36).substring(2, 7).toUpperCase();
} while (rooms.has(id));

return id;
}

function getRoomPlayers(roomId) {
const room = rooms.get(roomId);

if (!room) return [];

return [...room.players.values()].map(player => ({
id: player.id,
name: player.name
}));
}

function broadcastRoomPlayers(roomId) {
io.to(roomId).emit("roomPlayers", getRoomPlayers(roomId));
}

io.on("connection", socket => {
console.log("接続:", socket.id);

socket.on("createRoom", data => {
const name =
data && typeof data.name === "string" && data.name.trim()
? data.name.trim().slice(0, 16)
: "勇者";

const roomId = createRoomId();

rooms.set(roomId, {
  players: new Map()
});

rooms.get(roomId).players.set(socket.id, {
  id: socket.id,
  name
});

socket.join(roomId);
socket.data.roomId = roomId;
socket.data.name = name;

socket.emit("roomCreated", {
  roomId,
  players: getRoomPlayers(roomId)
});

broadcastRoomPlayers(roomId);

console.log(`${name} が部屋 ${roomId} を作成`);

});

socket.on("joinRoom", data => {
const roomId =
data && typeof data.roomId === "string"
? data.roomId.trim().toUpperCase()
: "";

const name =
  data && typeof data.name === "string" && data.name.trim()
    ? data.name.trim().slice(0, 16)
    : "勇者";

if (!roomId) {
  socket.emit("roomError", "ルームIDを入力してください");
  return;
}

const room = rooms.get(roomId);

if (!room) {
  socket.emit("roomError", "そのルームは存在しません");
  return;
}

if (room.players.size >= 20) {
  socket.emit("roomError", "このルームは満員です");
  return;
}

room.players.set(socket.id, {
  id: socket.id,
  name
});

socket.join(roomId);
socket.data.roomId = roomId;
socket.data.name = name;

socket.emit("roomJoined", {
  roomId,
  players: getRoomPlayers(roomId)
});

socket.to(roomId).emit("systemMessage", `${name} が参加しました`);

broadcastRoomPlayers(roomId);

console.log(`${name} が部屋 ${roomId} に参加`);

});

socket.on("chat", message => {
const roomId = socket.data.roomId;

if (!roomId) {
  socket.emit("roomError", "先にルームへ参加してください");
  return;
}

if (typeof message !== "string") return;

const text = message.trim().slice(0, 200);

if (!text) return;

io.to(roomId).emit("chat", {
  name: socket.data.name || "勇者",
  message: text,
  time: Date.now()
});

});

socket.on("leaveRoom", () => {
leaveRoom(socket);
});

socket.on("disconnect", () => {
console.log("切断:", socket.id);
leaveRoom(socket);
});
});

function leaveRoom(socket) {
const roomId = socket.data.roomId;

if (!roomId) return;

const room = rooms.get(roomId);

if (!room) {
socket.data.roomId = null;
return;
}

const player = room.players.get(socket.id);

room.players.delete(socket.id);
socket.leave(roomId);

if (player) {
io.to(roomId).emit(
"systemMessage",
"${player.name} が退出しました"
);
}

if (room.players.size === 0) {
rooms.delete(roomId);
} else {
broadcastRoomPlayers(roomId);
}

socket.data.roomId = null;
}

app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(PORT, () => {
console.log("勇者の懸賞金RPG SERVER ONLINE : ${PORT}");
});
