import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import { createChatSocket } from "../services/socket";
import {
  getCurrentUser,
  getProfileById,
  getMyProfile,
  getUserMatches,
  getNotifications,
  markNotificationRead,
  searchUsers
} from "../services/api";

function StatusBanner({ children, tone }) {
  const toneClasses = {
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
    warning: "border-amber-200 bg-amber-50 text-amber-800"
  };

  return (
    <div
      className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { token, currentUser, setCurrentUser, logout } = useAuth();
  const [activePage, setActivePage] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [highlightedConnectionId, setHighlightedConnectionId] = useState("");
  const [highlightedProjectInviteId, setHighlightedProjectInviteId] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const currentUserRef = useRef(currentUser);
  const activePageRef = useRef(activePage);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  useEffect(() => {
    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }

    void bootstrapDashboard(token);
  }, [token, navigate]);

  useEffect(() => {
    if (!selectedChatUserId && matches[0]?.developer?.userId) {
      setSelectedChatUserId(matches[0].developer.userId);
    }
  }, [matches, selectedChatUserId]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    if (!token) {
      setSearchResults([]);
      return undefined;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchingUsers(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setSearchingUsers(true);

      try {
        const results = await searchUsers(token, searchQuery.trim());
        console.log("[search] users fetched", results);
        setSearchResults(results);
      } catch (error) {
        console.error("[search] failed", error);
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, token]);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      return;
    }

    const socket = createChatSocket(token);
    socketRef.current = socket;
    setSocketConnected(socket.connected);

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    const handleNewNotification = (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification:new", handleNewNotification);

    return () => {
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("notification:new", handleNewNotification);
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [token, selectedChatUserId]);

  const bootstrapDashboard = async (authToken) => {
    setLoadingDashboard(true);
    setDashboardError("");
    console.log("[dashboard] bootstrapping with token");

    try {
      const fetchedUser = await getCurrentUser(authToken);
      console.log("[dashboard] current user fetched", fetchedUser);
      setCurrentUser(fetchedUser);

      const fetchedProfile = await getMyProfile(authToken);
      console.log("[dashboard] profile fetched", fetchedProfile);
      setProfile(fetchedProfile);
      setCurrentUser(fetchedProfile.user || fetchedUser || null);

      const fetchedMatches = await getUserMatches(authToken);
      console.log("[dashboard] matches fetched", fetchedMatches);
      setMatches(fetchedMatches.matches || []);

      const fetchedNotifications = await getNotifications(authToken);
      console.log("[dashboard] notifications fetched", fetchedNotifications);
      setNotifications(fetchedNotifications.notifications || []);
    } catch (error) {
      console.error("[dashboard] bootstrap failed", error);

      if (error.status === 404) {
        setProfile(null);
        setMatches([]);
        setDashboardError(
          "Your account is authenticated, but you do not have a developer profile yet."
        );
      } else if (error.status === 401) {
        logout();
        setDashboardError("Session expired. Please log in again.");
        navigate("/auth", { replace: true });
      } else {
        setDashboardError(error.message || "Failed to load dashboard data.");
      }
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(token, notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("[notification] failed to mark as read", error);
    }
  };

  const handleNotificationSelect = (notification) => {
    if (!notification) {
      return;
    }

    void handleMarkRead(notification._id);

    if (notification.type === "message" && notification.referenceId) {
      setSelectedChatUserId(notification.referenceId);
      setSelectedChatUser(null);
      setActivePage("messages");
      return;
    }

    if (notification.type === "connection") {
      setHighlightedConnectionId(notification.referenceId || "");
      setActivePage("connections");
      return;
    }

    if (notification.type === "project_invite" || notification.redirectUrl?.includes("/projects")) {
      setHighlightedProjectInviteId(notification.referenceId || "");
      setActivePage("projects");
      return;
    }

    if (notification.redirectUrl?.includes("/connections")) {
      setActivePage("connections");
      return;
    }

    if (notification.redirectUrl?.includes("/messages")) {
      setActivePage("messages");
      return;
    }
  };

  const handleOpenChat = (userId, userDetails = null) => {
    if (!userId) {
      return;
    }

    setSelectedChatUserId(userId);
    setSelectedChatUser(userDetails);
    setActivePage("messages");
  };

  const handleSearchSelect = (user) => {
    console.log("[search] selected user", user);
    setSearchQuery("");
    setSearchResults([]);
    handleOpenChat(user._id, {
      userId: user._id,
      name: user.name,
      email: user.email,
      headline: user.email
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.20),_transparent_24%),linear-gradient(180deg,_#fbf7f0_0%,_#f7fafc_100%)] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Navbar
          activePage={activePage}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onSelectNotification={handleNotificationSelect}
          onLogout={handleLogout}
          onNavigate={setActivePage}
          onSearchChange={setSearchQuery}
          onSelectSearchUser={handleSearchSelect}
          searchQuery={searchQuery}
          searchResults={searchResults}
          searchingUsers={searchingUsers}
        />

        {loadingDashboard ? (
          <StatusBanner tone="neutral">
            Loading profile, matches, and chat setup...
          </StatusBanner>
        ) : null}
        {dashboardError ? (
          <StatusBanner tone="warning">{dashboardError}</StatusBanner>
        ) : null}

        <div className="transition-all duration-200">
          <Outlet
            context={{
              token,
              currentUser,
              profile,
              setProfile,
              matches,
              setMatches,
              selectedChatUserId,
              setSelectedChatUserId,
              selectedChatUser,
              setSelectedChatUser,
              activePage,
              setActivePage,
              highlightedConnectionId,
              setHighlightedConnectionId,
              highlightedProjectInviteId,
              setHighlightedProjectInviteId,
              notifications,
              setNotifications,
              socketRef,
              toastMessage,
              setToastMessage,
              handleMarkRead,
              handleNotificationSelect,
              handleOpenChat,
              bootstrapDashboard,
              onToast: setToastMessage
            }}
          />
        </div>
      </div>
      {toastMessage ? (
        <div className="fixed bottom-4 right-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </main>
  );
}
