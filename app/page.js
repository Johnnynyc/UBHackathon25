"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const snapshot = await getDocs(collection(db, "rooms"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRooms(data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      }
    }
    fetchRooms();
  }, []);

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Ice Breaker</h1>
      <p className="text-gray-300">
        Scan a QR to join a temporary in-store chat — no app, no signup.
      </p>

      {/* Join a room by ID */}
      <div className="card p-4 space-y-4">
        <div>
          <p className="font-medium">Join a room</p>
          <p className="text-sm text-gray-300">
            Paste the room ID from the dashboard or a QR code.
          </p>
        </div>
        <form action="/join" className="space-y-2">
          <label htmlFor="room" className="text-sm text-gray-300">
            Room ID
          </label>
          <div className="flex gap-2">
            <input
              id="room"
              name="room"
              placeholder="demo-aisle7"
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
            >
              Join
            </button>
          </div>
        </form>
      </div>

      {/* Dynamic list of rooms */}
      <div className="card p-4 space-y-3">
        <p className="font-medium">Quick links</p>
        {rooms.length > 0 ? (
          <ul className="list-disc list-inside text-sm text-gray-300">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link href={`/join?room=${room.id}`}>
                  {room.title || `Join Room ${room.id}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No rooms available yet.</p>
        )}
      </div>
    </main>
  );
}
