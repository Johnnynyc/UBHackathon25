"use client";
import { useState } from "react";
import './chatBox.css';

export default function ChatInput({ onSend, disabled }) {
  const [text, set] = useState("");
  return (
    <form
      onSubmit={(e)=>{e.preventDefault(); if(text.trim().length){ onSend(text.trim()); set(""); }}}
      className="form-whole"
      
    >
      <input
        value={text}
        onChange={(e)=>set(e.target.value)}
        placeholder="Ask or share..."
        maxLength={500}
        disabled={disabled}
        className="form-input"
      />
      <button
        type="submit"
        disabled={disabled}
        className="form-button"
      >Send</button>
    </form>
  );
}
