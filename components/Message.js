import './chatBox.css';

export default function Message({ m, self, displayHandle }) {
  const mine = self && m.uid === self.uid;
  const label = displayHandle || m.handle || "anon";

  return (
    <div className={`message-row ${mine ? "mine" : "theirs"}`}>
      <div className={`message-bubble ${mine ? "mine" : "theirs"} ${m.hidden ? "hidden-message" : ""}`}>
        <div className="message-header">
          <span className="message-handle">@{label}</span>
          {m.type && <span className={`message-badge ${m.type === "broadcast" ? "broadcast" : ""}`}>{m.type}</span>}
          {m.pinned && <span className="message-pinned">pinned</span>}
        </div>
        <div className="message-text">{m.text}</div>
      </div>
    </div>
  );
}
