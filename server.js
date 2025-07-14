
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const { nanoid } = require("nanoid");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {};

function calculateTarget(numbers) {
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return +(avg * 0.8).toFixed(2);
}

io.on("connection", (socket) => {
  socket.on("create-room", (username, callback) => {
    const roomCode = nanoid(6);
    rooms[roomCode] = {
      players: {},
      admin: socket.id,
      scores: {},
      banned: [],
      round: 0,
    };
    rooms[roomCode].players[socket.id] = { username, number: null };
    rooms[roomCode].scores[socket.id] = 0;

    socket.join(roomCode);
    callback(roomCode);
    io.to(roomCode).emit("update-players", rooms[roomCode].players, rooms[roomCode].scores, rooms[roomCode].admin);
  });

  socket.on("join-room", (roomCode, username, callback) => {
    if (!rooms[roomCode]) return callback("Room does not exist");
    if (rooms[roomCode].banned.includes(username)) return callback("You are banned");

    rooms[roomCode].players[socket.id] = { username, number: null };
    rooms[roomCode].scores[socket.id] = 0;

    socket.join(roomCode);
    callback(null);
    io.to(roomCode).emit("update-players", rooms[roomCode].players, rooms[roomCode].scores, rooms[roomCode].admin);
  });

  socket.on("submit-number", (roomCode, number) => {
    if (!rooms[roomCode] || !rooms[roomCode].players[socket.id]) return;
    rooms[roomCode].players[socket.id].number = number;
  });

  socket.on("start-round", (roomCode) => {
    if (!rooms[roomCode]) return;
    rooms[roomCode].round++;

    setTimeout(() => {
      const submitted = Object.entries(rooms[roomCode].players).filter(([id, p]) => p.number !== null);
      if (submitted.length < 2) {
        io.to(roomCode).emit("round-result", "Not enough submissions");
        return;
      }

      const nums = submitted.map(([_, p]) => p.number);
      const target = calculateTarget(nums);

      let closestId = submitted[0][0];
      let closestDiff = Math.abs(submitted[0][1].number - target);

      for (let [id, p] of submitted) {
        const diff = Math.abs(p.number - target);
        if (diff < closestDiff) {
          closestId = id;
          closestDiff = diff;
        }
      }

      for (let id in rooms[roomCode].players) {
        if (id === closestId) rooms[roomCode].scores[id]++;
        else rooms[roomCode].scores[id]--;
      }

      for (let id in rooms[roomCode].scores) {
        if (rooms[roomCode].scores[id] < -10) {
          delete rooms[roomCode].players[id];
          delete rooms[roomCode].scores[id];
          io.to(id).emit("eliminated");
        }
      }

      for (let id in rooms[roomCode].players) {
        rooms[roomCode].players[id].number = null;
      }

      io.to(roomCode).emit("update-players", rooms[roomCode].players, rooms[roomCode].scores, rooms[roomCode].admin);
      io.to(roomCode).emit("round-result", `Target: ${target}`, rooms[roomCode].players);
    }, 3 * 60 * 1000); // 3 minutes
  });

  socket.on("kick", (roomCode, playerId) => {
    if (rooms[roomCode]?.admin === socket.id) {
      delete rooms[roomCode].players[playerId];
      delete rooms[roomCode].scores[playerId];
      io.to(playerId).emit("kicked");
      io.to(roomCode).emit("update-players", rooms[roomCode].players, rooms[roomCode].scores, rooms[roomCode].admin);
    }
  });

  socket.on("ban", (roomCode, playerId) => {
    if (rooms[roomCode]?.admin === socket.id) {
      const username = rooms[roomCode].players[playerId]?.username;
      if (username) rooms[roomCode].banned.push(username);
      delete rooms[roomCode].players[playerId];
      delete rooms[roomCode].scores[playerId];
      io.to(playerId).emit("banned");
      io.to(roomCode).emit("update-players", rooms[roomCode].players, rooms[roomCode].scores, rooms[roomCode].admin);
    }
  });

  socket.on("disconnect", () => {
    for (let room in rooms) {
      if (rooms[room].players[socket.id]) {
        delete rooms[room].players[socket.id];
        delete rooms[room].scores[socket.id];
        io.to(room).emit("update-players", rooms[room].players, rooms[room].scores, rooms[room].admin);
      }
    }
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
