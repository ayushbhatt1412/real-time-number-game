import React, { useState } from "react";
import socket from "../socket";

const Lobby = ({ setInGame, setUsername, setRoom, setIsAdmin }) => {
  const [inputUsername, setInputUsername] = useState("");
  const [inputRoom, setInputRoom] = useState("");

  const joinRoom = () => {
    if (inputUsername.trim() && inputRoom.trim()) {
      setUsername(inputUsername.trim());
      setRoom(inputRoom.trim());
      setIsAdmin(false);
      socket.emit("joinRoom", { room: inputRoom.trim(), username: inputUsername.trim() });
      setInGame(true);
    } else {
      alert("Please enter both username and room code");
    }
  };

  const createRoom = () => {
    if (inputUsername.trim() && inputRoom.trim()) {
      setUsername(inputUsername.trim());
      setRoom(inputRoom.trim());
      setIsAdmin(true);
      socket.emit("createRoom", { room: inputRoom.trim(), username: inputUsername.trim() });
      setInGame(true);
    } else {
      alert("Please enter both username and room code");
    }
  };

  return (
    <div>
      <h2>Welcome to the Number Game</h2>
      <p>Enter a username and room code to join or create a room.</p>

      <input
        type="text"
        placeholder="Username"
        value={inputUsername}
        onChange={(e) => setInputUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Room Code"
        value={inputRoom}
        onChange={(e) => setInputRoom(e.target.value)}
      />

      <div>
        <button onClick={joinRoom}>Join Room</button>
        <button onClick={createRoom}>Create Room</button>
      </div>
    </div>
  );
};

export default Lobby;
