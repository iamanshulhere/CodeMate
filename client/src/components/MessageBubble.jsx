function MessageBubble({ message, isOwn, showAvatar, avatarLabel, isConsecutive = false, isRead = false }) {
  return (
    <div className={`flex items-end gap-3 ${isOwn ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-1" : "mt-3"}`}>
      {!isOwn ? (
        showAvatar ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700">
            {avatarLabel}
          </div>
        ) : (
          <div className="w-10" />
        )
      ) : null}

      <div
        className={`max-w-[70%] space-y-2 rounded-[20px] px-4 py-3 text-sm shadow-sm ${
          isOwn
            ? "rounded-br-none bg-sky-600 text-white"
            : "rounded-bl-none bg-slate-100 text-slate-900"
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-6">{message.text}</p>
        <div className={`flex items-center justify-end gap-1 text-[11px] ${isOwn ? "text-sky-100" : "text-slate-500"}`}>
          <span>{formatTimestamp(message.sentAt)}</span>
          {isOwn && (
            <span className={`text-xs ${isRead ? "text-green-300" : "text-sky-200"}`}>
              ✓
            </span>
          )}
        </div>
      </div>

      {isOwn ? <div className="w-10" /> : null}
    </div>
  );
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default MessageBubble;
