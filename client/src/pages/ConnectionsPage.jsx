import { useEffect, useMemo, useState } from "react";
import {
  acceptConnectionRequest,
  getConnectionRequests,
  getConnections,
  sendConnectionRequest,
  rejectConnectionRequest
} from "../services/api";

function ConnectionsPage({ matches, token, onOpenChat, onToast, highlightConnectionId }) {
  const [connections, setConnections] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeRequestId, setActiveRequestId] = useState("");
  const [sendingRequestId, setSendingRequestId] = useState("");

  const loadConnectionData = async () => {
    setLoading(true);
    setError("");

    try {
      const [connectionsResponse, requestsResponse] = await Promise.all([
        getConnections(token),
        getConnectionRequests(token)
      ]);

      setConnections(connectionsResponse.connections || []);
      setReceivedRequests(requestsResponse.receivedRequests || []);
      setSentRequests(requestsResponse.sentRequests || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load connection data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    void loadConnectionData();
  }, [token]);

  const handleSendRequest = async (userId) => {
    setSendingRequestId(userId);
    setError("");

    try {
      await sendConnectionRequest(token, userId);
      onToast?.("Connection request sent.");
      await loadConnectionData();
    } catch (requestError) {
      setError(requestError.message || "Unable to send connection request.");
    } finally {
      setSendingRequestId("");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActiveRequestId(requestId);
    setError("");

    try {
      await acceptConnectionRequest(token, requestId);
      onToast?.("Connection accepted.");
      await loadConnectionData();
    } catch (actionError) {
      setError(actionError.message || "Unable to accept request.");
    } finally {
      setActiveRequestId("");
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActiveRequestId(requestId);
    setError("");

    try {
      await rejectConnectionRequest(token, requestId);
      onToast?.("Connection request rejected.");
      await loadConnectionData();
    } catch (actionError) {
      setError(actionError.message || "Unable to reject request.");
    } finally {
      setActiveRequestId("");
    }
  };

  const acceptedIds = useMemo(
    () => new Set(connections.map((connection) => String(connection.userId))),
    [connections]
  );

  const outgoingIds = useMemo(
    () => new Set(sentRequests.map((request) => String(request.receiver._id))),
    [sentRequests]
  );

  const incomingRequests = useMemo(
    () => new Map(receivedRequests.map((request) => [String(request.sender._id), request])),
    [receivedRequests]
  );

  return (
    <section className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
            Connections
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Recommended collaborators
          </h2>
        </div>
        <p className="text-sm text-slate-500">{matches.length} user matches found</p>
      </div>

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">
          Loading connection data...
        </div>
      ) : null}

      {receivedRequests.length ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Pending requests</h3>
              <p className="mt-1 text-sm text-slate-500">
                Review connection requests from collaborators and respond quickly.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {receivedRequests.length} pending
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {receivedRequests.map((request) => (
              <article
                key={request._id}
                className={`rounded-3xl border p-4 ${
                  request._id === highlightConnectionId ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{request.sender.name}</p>
                    <p className="text-sm text-slate-500">{request.sender.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => handleAcceptRequest(request._id)}
                      disabled={activeRequestId === request._id}
                    >
                      {activeRequestId === request._id ? "Processing..." : "Accept"}
                    </button>
                    <button
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => handleRejectRequest(request._id)}
                      disabled={activeRequestId === request._id}
                    >
                      {activeRequestId === request._id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {matches.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => {
            const userId = match.developer?.userId;
            const isConnected = userId && acceptedIds.has(String(userId));
            const outgoingPending = userId && outgoingIds.has(String(userId));
            const incomingRequest = userId && incomingRequests.get(String(userId));

            return (
              <article
                key={userId || match.developer?.email || match.developer?.name}
                className={`rounded-3xl border p-5 transition ${
                  incomingRequest ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">
                        {match.developer?.name || "Unknown developer"}
                      </h3>
                      {match.developer?.isOnline ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                          Online
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {match.developer?.email || "No email available"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {match.matchScore} shared
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <InfoLine label="Role" value={match.developer?.role || "developer"} />
                  <InfoLine
                    label="Compatibility"
                    value={`${Math.round((match.score || 0) * 100)}%`}
                  />
                </div>

                <div className="mt-5 space-y-4">
                  <MatchSection
                    label="Common Skills"
                    items={match.commonSkills}
                    tone="sky"
                  />
                  <MatchSection
                    label="Common Tech Stack"
                    items={match.commonTechStack}
                    tone="amber"
                  />
                  <MatchSection
                    label="Common Interests"
                    items={match.commonInterests}
                    tone="emerald"
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  {incomingRequest ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => handleAcceptRequest(incomingRequest._id)}
                        disabled={activeRequestId === incomingRequest._id}
                      >
                        {activeRequestId === incomingRequest._id ? "Processing..." : "Accept request"}
                      </button>
                      <button
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => handleRejectRequest(incomingRequest._id)}
                        disabled={activeRequestId === incomingRequest._id}
                      >
                        {activeRequestId === incomingRequest._id ? "Processing..." : "Reject request"}
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isConnected
                          ? "bg-slate-300 text-slate-700 cursor-not-allowed"
                          : outgoingPending
                          ? "bg-amber-200 text-slate-700 cursor-not-allowed"
                          : "bg-slate-950 text-white hover:bg-slate-800"
                      }`}
                      disabled={!userId || isConnected || outgoingPending || sendingRequestId === userId}
                      onClick={() => userId && handleSendRequest(userId)}
                    >
                      {isConnected
                        ? "Connected"
                        : outgoingPending
                        ? "Pending"
                        : sendingRequestId === userId
                        ? "Sending..."
                        : "Connect"}
                    </button>
                  )}

                  <button
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    onClick={() => match.developer?.userId && onOpenChat(match.developer.userId)}
                  >
                    Open messages
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-slate-400">{label}</span>
      <span className="text-right text-slate-700">{value}</span>
    </div>
  );
}

function MatchSection({ items = [], label, tone }) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700"
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span
              key={`${label}-${item}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClasses[tone]}`}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
            No overlap
          </span>
        )}
      </div>
    </div>
  );
}

export default ConnectionsPage;
