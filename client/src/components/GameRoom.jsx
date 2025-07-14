import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const GameRoom = ({ socket, room, username, isAdmin }) => {
  const [number, setNumber] = useState("");
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3 min = 180 sec

  useEffect(() => {
    socket.emit("joinRoom", { room, username });

    socket.on("playersUpdate", (data) => {
      setPlayers(data);
    });

    socket.on("message", (msg) => {
      setMessage(msg);
    });

    socket.on("timeLeft", (time) => {
      setTimeLeft(time);
    });

    return () => {
      socket.off("playersUpdate");
      socket.off("message");
      socket.off("timeLeft");
    };
  }, [socket, room, username]);

  const submitNumber = () => {
    const num = parseFloat(number);
    if (!isNaN(num) && num >= 1 && num <= 100) {
      socket.emit("submitNumber", { room, username, number: num });
      setNumber("");
    } else {
      alert("Please enter a number between 1 and 100.");
    }
  };

  const kickPlayer = (player) => {
    if (isAdmin && player !== username) {
      socket.emit("kick", { room, target: player });
    }
  };

  return (
    <div>
      <h2>Room: {room}</h2>
      <h3>Welcome, {username} {isAdmin && "(Admin)"}</h3>
      <p>Time left: {timeLeft} sec</p>
      <p>{message}</p>

      <input
        type="number"
        min="1"
        max="100"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
      />
      <button onClick={submitNumber}>Submit</button>

      <h4>Players:</h4>
      <ul>
        {players.map((p, idx) => (
          <li key={idx}>
            {p.username} — Points: {p.points}
            {isAdmin && p.username !== username && (
              <button onClick={() => kickPlayer(p.username)}>Kick</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameRoom;
