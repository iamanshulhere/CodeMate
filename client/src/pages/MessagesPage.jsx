import { useEffect, useRef } from "react";

function MessagesPage({
  chatConnected,
  chatError,
  chatInput,
  chatStatus,
  contacts,
  currentUserId,
  loadingHistory,
  messagesByUser,
  onChatInputChange,
  onNewThread,
  onSelectConversation,
  onSendMessage,
  selectedChatUserId,
  selectedConversationUser,
  selectedMessages,
  sendingMessage,
  socketUrl
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [selectedMessages]);

  return (
    <section className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-700">
                Messages
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Conversations</h2>
            </div>
            <button
              className="rounded-full bg-rose-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-700"
              onClick={onNewThread}
            >
              New thread
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chat status: <span className="font-semibold text-slate-900">{chatStatus}</span>
            {!chatConnected ? " - waiting for socket" : ""}
          </div>

          {chatError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {chatError}
            </div>
          ) : null}

          {contacts.length ? (
            contacts.map((contact) => {
              const userId = contact.userId;
              const lastMessage = userId ? messagesByUser[userId]?.at(-1) : null;

              return (
                <button
                  key={userId}
                  className={`block w-full rounded-3xl border p-4 text-left transition ${
                    selectedChatUserId === userId
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => onSelectConversation(userId || "")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-950">{contact.name || "Unknown"}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {lastMessage?.text ||
                          contact.headline ||
                          "Select this match to start chatting."}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {lastMessage ? formatTimestamp(lastMessage.sentAt) : "New"}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              No chat contacts yet. Your live matches will appear here.
            </div>
          )}
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-950">
              {selectedConversationUser?.name || "Messages"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedConversationUser?.headline ||
                "Choose a connection to start a conversation."}
            </p>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-[#e9f2eb] p-4">
            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {loadingHistory ? (
                <p className="text-sm text-slate-500">Loading conversation history...</p>
              ) : null}
              {selectedMessages.length ? (
                selectedMessages.map((message) => {
                  const isOwn = String(message.senderId) === String(currentUserId);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="max-w-[60%] min-w-[9rem]">
                        <div
                          className={`rounded-[20px] px-4 py-3 text-sm shadow-sm ${
                            isOwn
                              ? "rounded-br-md bg-sky-900 text-white"
                              : "rounded-bl-md bg-slate-200 text-slate-900"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-6">
                            {message.text}
                          </p>
                        </div>
                        <p
                          className={`mt-1 px-2 text-[11px] ${
                            isOwn
                              ? "text-right text-slate-500"
                              : "text-left text-slate-500"
                          }`}
                        >
                          {formatTimestamp(message.sentAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  {selectedChatUserId
                    ? "No messages yet. Start the conversation."
                    : "Choose a connection to begin chatting."}
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <textarea
            className="mt-4 h-28 w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
            onChange={(event) => onChatInputChange(event.target.value)}
            placeholder={
              selectedChatUserId
                ? `Message ${selectedConversationUser?.name || "your collaborator"}...`
                : "Select a connection first to send a message."
            }
            value={chatInput}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Socket server: <span className="font-semibold">{socketUrl}</span>
            </p>
            <button
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={sendingMessage || !selectedChatUserId}
              onClick={onSendMessage}
            >
              {sendingMessage ? "Sending..." : "Send message"}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Now";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default MessagesPage;
