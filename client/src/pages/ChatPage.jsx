import { useEffect, useMemo, useRef, useState } from "react";
import MessageBubble from "../components/MessageBubble";
import { createChatSocket } from "../services/socket";
import { getConversationMessages } from "../services/api";

function ChatPage({ token, currentUserId, matches = [], selectedChatUserId, selectedChatUser, onNavigate }) {
  const [selectedConversationId, setSelectedConversationId] = useState(
    selectedChatUserId || ""
  );
  const [messagesByUser, setMessagesByUser] = useState({});
  const [chatConnected, setChatConnected] = useState(false);
  const [chatStatus, setChatStatus] = useState("Disconnected");
  const [chatError, setChatError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedConversationRef = useRef(selectedConversationId);
  const messagesEndRef = useRef(null);

  const contacts = useMemo(() => {
    const contactMap = new Map();

    matches.forEach((match) => {
      const developer = match.developer;
      const userId = developer?.userId;
      if (!userId) {
        return;
      }

      contactMap.set(userId, {
        userId,
        name: developer.name || "Unknown developer",
        headline: developer.headline || developer.email || "Collaborator",
        avatar: developer.name
          ? developer.name.charAt(0).toUpperCase()
          : developer.email?.charAt(0).toUpperCase() || "?",
        source: "match"
      });
    });

    if (selectedChatUser) {
      const userId = selectedChatUser.userId || selectedChatUser._id;
      if (userId) {
        contactMap.set(userId, {
          userId,
          name: selectedChatUser.name || selectedChatUser.email || "Unknown user",
          headline:
            selectedChatUser.headline || selectedChatUser.email || "Search result",
          avatar: selectedChatUser.name
            ? selectedChatUser.name.charAt(0).toUpperCase()
            : selectedChatUser.email?.charAt(0).toUpperCase() || "?",
          source: "search"
        });
      }
    }

    Object.keys(messagesByUser).forEach((userId) => {
      if (!contactMap.has(userId)) {
        contactMap.set(userId, {
          userId,
          name: "Conversation",
          headline: "Chat",
          avatar: userId.charAt(0).toUpperCase() || "?",
          source: "history"
        });
      }
    });

    return Array.from(contactMap.values()).sort((a, b) => {
      const aLast = messagesByUser[a.userId]?.at(-1)?.sentAt || "";
      const bLast = messagesByUser[b.userId]?.at(-1)?.sentAt || "";
      if (aLast !== bLast) {
        return bLast.localeCompare(aLast);
      }
      return a.name.localeCompare(b.name);
    });
  }, [matches, selectedChatUser, messagesByUser]);

  const selectedContact = useMemo(() => {
    return (
      contacts.find((contact) => contact.userId === selectedConversationId) ||
      contacts[0] ||
      null
    );
  }, [contacts, selectedConversationId]);

  const selectedMessages = selectedContact
    ? messagesByUser[selectedContact.userId] || []
    : [];

  useEffect(() => {
    if (selectedChatUserId) {
      setSelectedConversationId(selectedChatUserId);
    }
  }, [selectedChatUserId]);

  useEffect(() => {
    if (!selectedConversationId && contacts.length) {
      setSelectedConversationId(contacts[0].userId);
    }
  }, [contacts, selectedConversationId]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = createChatSocket(token);
    socketRef.current = socket;
    setChatStatus("Connecting...");
    setChatError("");

    socket.on("connect", () => {
      setChatConnected(true);
      setChatStatus("Connected");
      setChatError("");
    });

    socket.on("disconnect", () => {
      setChatConnected(false);
      setChatStatus("Disconnected");
    });

    socket.on("connect_error", (error) => {
      setChatConnected(false);
      setChatStatus("Connection failed");
      setChatError(error?.message || "Socket connection failed");
    });

    socket.on("chat:ready", () => {
      setChatConnected(true);
      setChatStatus("Connected");
      setChatError("");
    });

    socket.on("chat:error", ({ message }) => {
      setChatError(message || "Chat socket error");
    });

    socket.on("chat:typing", ({ fromUserId, isTyping }) => {
      if (!fromUserId) {
        return;
      }

      setTypingUsers((previous) => ({
        ...previous,
        [fromUserId]: Boolean(isTyping)
      }));
    });

    socket.on("chat:message", (payload) => {
      const partnerId =
        payload.fromUserId === currentUserId
          ? payload.toUserId
          : payload.fromUserId;

      const message = {
        id:
          payload.id || `${payload.sentAt}-${payload.fromUserId}-${payload.toUserId}`,
        senderId: payload.fromUserId,
        receiverId: payload.toUserId,
        text: payload.text,
        sentAt: payload.sentAt,
        direction:
          payload.fromUserId === currentUserId ? "outbound" : "inbound"
      };

      setMessagesByUser((previousMessages) => {
        const existingConversation = previousMessages[partnerId] || [];
        if (existingConversation.some((item) => item.id === message.id)) {
          return previousMessages;
        }

        return {
          ...previousMessages,
          [partnerId]: [...existingConversation, message]
        };
      });

      if (partnerId !== selectedConversationRef.current) {
        setUnreadCounts((previous) => ({
          ...previous,
          [partnerId]: (previous[partnerId] || 0) + 1
        }));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [token, currentUserId]);

  useEffect(() => {
    if (!chatConnected || !selectedConversationId || !socketRef.current) {
      return;
    }

    socketRef.current.emit("chat:join", { targetUserId: selectedConversationId });

    const loadConversation = async () => {
      setLoadingConversation(true);
      setChatError("");

      try {
        const response = await getConversationMessages(token, selectedConversationId);

        setMessagesByUser((previousMessages) => ({
          ...previousMessages,
          [selectedConversationId]: (response.messages || []).map((message) => ({
            id: message._id,
            senderId: String(message.sender),
            receiverId: String(message.receiver),
            text: message.text,
            sentAt: message.createdAt,
            direction:
              String(message.sender) === String(currentUserId)
                ? "outbound"
                : "inbound"
          }))
        }));

        setUnreadCounts((previous) => ({
          ...previous,
          [selectedConversationId]: 0
        }));
      } catch (error) {
        setChatError(error.message || "Failed to load conversation history.");
      } finally {
        setLoadingConversation(false);
      }
    };

    void loadConversation();
  }, [chatConnected, selectedConversationId, token, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [selectedMessages]);

  const setSelectedContactId = (userId) => {
    if (!userId) {
      return;
    }

    setSelectedConversationId(userId);
    setUnreadCounts((previous) => ({
      ...previous,
      [userId]: 0
    }));
  };

  const handleChatInputChange = (value) => {
    setChatInput(value);
    if (!socketRef.current || !selectedConversationId) {
      return;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      socketRef.current.emit("chat:typing", {
        targetUserId: selectedConversationId,
        isTyping: true
      });

      typingTimeoutRef.current = window.setTimeout(() => {
        socketRef.current?.emit("chat:typing", {
          targetUserId: selectedConversationId,
          isTyping: false
        });
        typingTimeoutRef.current = null;
      }, 1200);
    } else {
      socketRef.current.emit("chat:typing", {
        targetUserId: selectedConversationId,
        isTyping: false
      });
    }
  };

  const handleSendMessage = () => {
    if (!selectedConversationId) {
      setChatError("Choose a chat contact first.");
      return;
    }

    if (!chatConnected || !socketRef.current) {
      setChatError("Chat is not connected yet.");
      return;
    }

    if (!chatInput.trim()) {
      setChatError("Type a message before sending.");
      return;
    }

    socketRef.current.emit("chat:message", {
      targetUserId: selectedConversationId,
      text: chatInput.trim()
    });

    setChatInput("");

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socketRef.current.emit("chat:typing", {
      targetUserId: selectedConversationId,
      isTyping: false
    });
  };

  const activeTyping = selectedContact ? typingUsers[selectedContact.userId] : false;

  return (
    <section className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
            Chat
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Conversations</h2>
        </div>
        <button
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          onClick={() => onNavigate("connections")}
        >
          Back to connections
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Status
            </p>
            <p className="mt-3 text-sm text-slate-700">
              {chatStatus}
              {!chatConnected ? " - waiting for socket" : ""}
            </p>
          </div>

          {contacts.length ? (
            <div className="space-y-3">
              {contacts.map((contact) => {
                const lastMessage = (messagesByUser[contact.userId] || []).at(-1);
                const preview = lastMessage
                  ? lastMessage.text
                  : contact.headline || "Start the conversation.";

                return (
                  <button
                    key={contact.userId}
                    className={`block w-full rounded-3xl border p-4 text-left transition ${
                      selectedConversationId === contact.userId
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    onClick={() => setSelectedContactId(contact.userId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-950">{contact.name}</h3>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {preview}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[11px] text-slate-400">
                          {formatTimestamp(lastMessage?.sentAt)}
                        </span>
                        {unreadCounts[contact.userId] ? (
                          <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
                            {unreadCounts[contact.userId]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No conversations yet. Open a connection or search someone to start chatting.
            </div>
          )}
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                {selectedContact?.name || "Select a chat"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedContact?.headline || "Pick a contact to start messaging."}
              </p>
            </div>
            {activeTyping ? (
              <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                Typing...
              </div>
            ) : null}
          </div>

          <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4">
            {chatError ? (
              <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {chatError}
              </div>
            ) : null}

            {loadingConversation ? (
              <p className="text-sm text-slate-500">Loading conversation...</p>
            ) : null}

            <div className="max-h-[28rem] overflow-y-auto space-y-3 pr-1">
              {selectedMessages.length ? (
                selectedMessages.map((message, index) => {
                  const previousMessage = selectedMessages[index - 1];
                  const isOwn = String(message.senderId) === String(currentUserId);
                  const showAvatar =
                    !previousMessage || previousMessage.senderId !== message.senderId;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      avatarLabel={selectedContact?.avatar || "U"}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  {selectedContact
                    ? "No messages yet. Send the first one."
                    : "Select a contact to open the chat."}
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <textarea
            className="mt-4 h-28 w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
            placeholder={
              selectedContact
                ? `Message ${selectedContact.name}...`
                : "Select a contact to send a message."
            }
            value={chatInput}
            onChange={(event) => handleChatInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!selectedContact}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Socket status: <span className="font-semibold">{chatStatus}</span>
            </p>
            <button
              type="button"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!selectedContact || !chatConnected}
              onClick={handleSendMessage}
            >
              Send message
            </button>
          </div>
        </section>
      </div>
    </section>
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

export default ChatPage;
