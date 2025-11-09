export default function Message({ m, self, displayHandle }) {
  const mine = self && m.uid === self.uid;
  const badge = m.type === "broadcast" ? "bg-indigo-600" : "bg-gray-600";
  const hidden = m.hidden ? "opacity-50 line-through" : "";
  const label = displayHandle || m.handle || "anon";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} my-1`}>
      <div className={`max-w-[80%] px-3 py-2 rounded-lg ${mine ? "bg-blue-600" : "bg-slate-700"} ${hidden}`}>
        <div className="text-xs text-gray-300 mb-0.5 flex gap-2">
          <span>@{label}</span>
          {m.type && <span className={`text-[10px] ${badge} px-1 rounded`}>{m.type}</span>}
          {m.pinned && <span className="text-[10px] bg-yellow-600 px-1 rounded">pinned</span>}
        </div>
        <div className="text-sm whitespace-pre-wrap">{m.text}</div>
      </div>
    </div>
  );
}
