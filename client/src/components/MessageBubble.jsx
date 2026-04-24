function MessageBubble({ message, isOwn, showAvatar, avatarLabel }) {
  return (
    <div className={`flex items-end gap-3 ${isOwn ? "justify-end" : "justify-start"}`}>
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
        <p className={`text-[11px] ${isOwn ? "text-sky-100 text-right" : "text-slate-500 text-left"}`}>
          {formatTimestamp(message.sentAt)}
        </p>
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
