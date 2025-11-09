//Client component for useState, useEffect
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import './landingPage.css';

export default function Home() {
  const router = useRouter();
  const [makeRoomName, setMakeRoomName] = useState("");
  const [joinRoomName, setJoinRoomName] = useState("");

  function handleMakeRoom(e) {
    e.preventDefault();
    if (!makeRoomName.trim()) return;
    router.push(`/join?room=${encodeURIComponent(makeRoomName)}&create=true`);
  }

  function handleJoinRoom(e) {
    e.preventDefault();
    if (!joinRoomName.trim()) return;
    router.push(`/join?room=${encodeURIComponent(joinRoomName)}&create=false`);
  }

  return (
    <main>
      <div className="iceBreakers-Logo">
        <div className="iceBreakers-Box">
          <h1 className="iceBreakers-text">Ice-Breakers</h1>
        </div>
      </div>

      <div className="landingPageButtons">
        <div className="makeRoom">
          <div className="makeRoom-Color"></div>
          <form onSubmit={handleMakeRoom}>
            <label htmlFor="makeRoomInput" className="makeRoom-Label">Make a Room</label>
            <input
              type="text"
              id="makeRoomInput"
              name="makeRoomInput"
              value={makeRoomName}
              onChange={(e) => setMakeRoomName(e.target.value)}
              placeholder="Room Name"
              className="makeRoom-Textbox"
            />
            <input type="submit" className="makeRoom-Button" value="Enter" />
          </form>
        </div>

        <div className="joinRoom">
          <div className="joinRoom-Color"></div>
          <form onSubmit={handleJoinRoom}>
            <label htmlFor="joinRoomInput" className="joinRoom-Label">Join a Room</label>
            <input
              type="text"
              id="joinRoomInput"
              name="joinRoomInput"
              value={joinRoomName}
              onChange={(e) => setJoinRoomName(e.target.value)}
              placeholder="Room Code"
              className="joinRoom-Textbox"
            />
            <input type="submit" className="joinRoom-Button" value="Enter" />
          </form>
        </div>
      </div>
    </main>
  );
}
