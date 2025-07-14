import React, { useState } from "react";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";

function App() {
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  return !joined ? (
    <Lobby
      username={username}
      setUsername={setUsername}
      roomCode={roomCode}
      setRoomCode={setRoomCode}
      setJoined={setJoined}
    />
  ) : (
    <GameRoom username={username} roomCode={roomCode} />
  );
}

export default App;
