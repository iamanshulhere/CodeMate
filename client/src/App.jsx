import { useEffect, useRef, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import Navbar from "./components/Navbar";
import ConnectionsPage from "./pages/ConnectionsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectsPage from "./pages/ProjectsPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import { createChatSocket } from "./services/socket";
import {
  createProfile,
  getCurrentUser,
  getProfileById,
  getMyProfile,
  getUserMatches,
  loginUser,
  searchUsers,
  signupUser
} from "./services/api";

const tokenStorageKey = "codemate_token";
const emptyAuthForm = {
  name: "",
  email: "",
  password: ""
};

const emptyProfileDraft = {
  headline: "",
  bio: "",
  location: "",
  totalExperienceYears: 0,
  interests: "",
  skills: "",
  techStack: ""
};

function App() {
  const [activePage, setActivePage] = useState("profile");
  const [routePath, setRoutePath] = useState(() => window.location.pathname);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [token, setToken] = useState(
    () => localStorage.getItem(tokenStorageKey) || ""
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [profileDraft, setProfileDraft] = useState(emptyProfileDraft);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingPublicProfile, setLoadingPublicProfile] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [authError, setAuthError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicProfileError, setPublicProfileError] = useState("");
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
      setCurrentUser(null);
      setProfile(null);
      setMatches([]);
      return;
    }

    localStorage.setItem(tokenStorageKey, token);
    void bootstrapDashboard(token);
  }, [token]);

  useEffect(() => {
    if (!selectedChatUserId && matches[0]?.developer?.userId) {
      setSelectedChatUserId(matches[0].developer.userId);
    }
  }, [matches, selectedChatUserId]);

  useEffect(() => {
    const handlePopState = () => {
      console.log("[route] popstate", window.location.pathname);
      setRoutePath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
    const handleChatMessage = (payload) => {
      const currentUser = currentUserRef.current;
      if (!currentUser || !payload || payload.fromUserId === currentUser._id) {
        return;
      }

      if (
        activePageRef.current === "messages" &&
        selectedChatUserId === payload.fromUserId
      ) {
        return;
      }

      addNotification({
        id: `message-${payload.id}-${Date.now()}`,
        type: "message",
        title: `New message from ${payload.fromUserName || "a contact"}`,
        message: payload.text,
        page: "messages",
        data: {
          userId: payload.fromUserId,
          name: payload.fromUserName
        },
        createdAt: new Date().toISOString(),
        read: false
      });
    };

    const handleProjectJoinNotification = (payload) => {
      if (!payload) {
        return;
      }

      addNotification({
        id: payload.id || `project-join-${Date.now()}`,
        type: payload.type || "project-join",
        title: payload.title || "New project activity",
        message: payload.message || "A collaborator joined your project.",
        page: payload.page || "projects",
        data: payload,
        createdAt: payload.createdAt || new Date().toISOString(),
        read: false
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("chat:message", handleChatMessage);
    socket.on("notification:project-join", handleProjectJoinNotification);

    return () => {
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("chat:message", handleChatMessage);
        socket.off("notification:project-join", handleProjectJoinNotification);
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [token, selectedChatUserId]);

  useEffect(() => {
    const profileId = getProfileIdFromPath(routePath);

    if (!profileId) {
      setPublicProfile(null);
      setPublicProfileError("");
      setLoadingPublicProfile(false);
      return;
    }

    const loadPublicProfile = async () => {
      setLoadingPublicProfile(true);
      setPublicProfileError("");

      try {
        const fetchedProfile = await getProfileById(profileId);
        console.log("[profile] public profile fetched", fetchedProfile);
        setPublicProfile(fetchedProfile);
      } catch (error) {
        console.error("[profile] public profile failed", error);
        setPublicProfile(null);
        setPublicProfileError(error.message || "Failed to load public profile.");
      } finally {
        setLoadingPublicProfile(false);
      }
    };

    void loadPublicProfile();
  }, [routePath]);


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

      if (
        fetchedMatches.matches?.length > 0 &&
        activePageRef.current !== "connections"
      ) {
        addNotification({
          type: "match",
          title: "Match alerts available",
          message: `${fetchedMatches.matches.length} new developer matches are ready.`,
          page: "connections",
          data: { count: fetchedMatches.matches.length },
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error("[dashboard] bootstrap failed", error);

      if (error.status === 404) {
        setProfile(null);
        setMatches([]);
        setDashboardError(
          "Your account is authenticated, but you do not have a developer profile yet."
        );
      } else if (error.status === 401) {
        handleLogout();
        setDashboardError("Session expired. Please log in again.");
      } else {
        setDashboardError(error.message || "Failed to load dashboard data.");
      }
    } finally {
      setLoadingDashboard(false);
    }
  };

  const addNotification = (notification) => {
    setNotifications((previous) => [
      {
        id:
          notification.id ||
          `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        read: false,
        createdAt: new Date().toISOString(),
        ...notification
      },
      ...previous
    ]);
  };

  const markNotificationRead = (notificationId) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true }))
    );
  };

  const handleNotificationSelect = (notification) => {
    if (!notification) {
      return;
    }

    markNotificationRead(notification.id);

    if (notification.page) {
      setActivePage(notification.page);
    }

    if (notification.page === "messages" && notification.data?.userId) {
      setSelectedChatUserId(notification.data.userId);
      setSelectedChatUser({
        userId: notification.data.userId,
        name: notification.data.name || notification.data.email || "Unknown"
      });
    }
  };

  const handleNotify = (notification) => {
    addNotification(notification);
  };

  const notificationCount = notifications.filter((notification) => !notification.read)
    .length;

  const handleAuthFormChange = (event) => {
    const { name, value } = event.target;
    setAuthError("");
    setAuthForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleAuthModeChange = (nextMode) => {
    setAuthMode(nextMode);
    setAuthError("");
    setAuthForm((previousForm) => ({
      name: nextMode === "signup" ? previousForm.name : "",
      email: previousForm.email,
      password: ""
    }));
  };

  const handleProfileDraftChange = (event) => {
    const { name, value } = event.target;
    setProfileDraft((previous) => ({ ...previous, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateAuthForm(authMode, authForm);

    if (validationError) {
      setAuthError(validationError);
      return;
    }

    setLoadingAuth(true);
    setAuthError("");

    try {
      const authResponse =
        authMode === "login"
          ? await loginUser({
              email: authForm.email,
              password: authForm.password
            })
          : await signupUser({
              name: authForm.name,
              email: authForm.email,
              password: authForm.password
            });

      console.log("[auth] success", authResponse);
      setActivePage("profile");
      setToken(authResponse.token);
      setCurrentUser({
        _id: authResponse._id,
        name: authResponse.name,
        email: authResponse.email,
        role: authResponse.role
      });
      setAuthForm(emptyAuthForm);
    } catch (error) {
      console.error("[auth] failed", error);
      setAuthError(resolveAuthError(authMode, error));
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    console.log("[auth] logout");
    localStorage.removeItem(tokenStorageKey);
    setToken("");
    setCurrentUser(null);
    setProfile(null);
    setMatches([]);
    setSelectedChatUserId("");
    setSelectedChatUser(null);
    setAuthError("");
    setDashboardError("");
    setActivePage("profile");
  };

  const handleCreateProfile = async () => {
    if (!token) {
      setDashboardError("Log in before creating a profile.");
      return;
    }

    setSubmittingProfile(true);
    setDashboardError("");

    try {
      const payload = {
        headline: profileDraft.headline,
        bio: profileDraft.bio,
        location: profileDraft.location,
        totalExperienceYears: Number(profileDraft.totalExperienceYears) || 0,
        interests: splitCommaValues(profileDraft.interests),
        skills: splitCommaValues(profileDraft.skills).map((skill) => ({
          name: skill,
          level: "intermediate",
          yearsOfExperience: Math.max(
            Number(profileDraft.totalExperienceYears) || 0,
            0
          )
        })),
        techStack: [
          {
            category: "Core",
            technologies: splitCommaValues(profileDraft.techStack)
          }
        ]
      };

      console.log("[profile] creating", payload);
      const createdProfile = await createProfile(token, payload);
      setProfile(createdProfile);
      setCurrentUser(createdProfile.user || currentUser);
      setProfileDraft(emptyProfileDraft);

      const fetchedMatches = await getUserMatches(token);
      setMatches(fetchedMatches.matches || []);
    } catch (error) {
      console.error("[profile] create failed", error);
      setDashboardError(error.message || "Failed to create profile.");
    } finally {
      setSubmittingProfile(false);
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

  const handleShareProfile = async () => {
    if (!profile?._id) {
      setDashboardError("Create a profile before sharing it.");
      return;
    }

    const shareUrl = `${window.location.origin}/profile/${profile._id}`;
    console.log("[profile] share url", shareUrl);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage("Profile link copied!");
    } catch (error) {
      console.error("[profile] share failed", error);
      setDashboardError("Failed to copy profile link.");
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "connections":
        return (
          <ConnectionsPage
            matches={matches}
            onOpenChat={handleOpenChat}
          />
        );
      case "projects":
        return (
          <ProjectsPage
            token={token}
            currentUserId={currentUser?._id || ""}
            onNotify={handleNotify}
          />
        );
      case "messages":
        return (
          <ChatPage
            token={token}
            currentUserId={currentUser?._id || ""}
            matches={matches}
            selectedChatUserId={selectedChatUserId}
            selectedChatUser={selectedChatUser}
            onNavigate={setActivePage}
          />
        );
      case "profile":
      default:
        return (
          <ProfilePage
            currentUser={currentUser}
            onCreateProfile={handleCreateProfile}
            onProfileDraftChange={handleProfileDraftChange}
            onShareProfile={handleShareProfile}
            profile={profile}
            profileDraft={profileDraft}
            submittingProfile={submittingProfile}
          />
        );
    }
  };

  if (getProfileIdFromPath(routePath)) {
    return (
      <PublicProfilePage
        error={publicProfileError}
        loading={loadingPublicProfile}
        profile={publicProfile}
      />
    );
  }

  if (!token) {
    return (
      <AuthScreen
        authError={authError}
        authForm={authForm}
        authMode={authMode}
        loadingAuth={loadingAuth}
        onAuthFormChange={handleAuthFormChange}
        onAuthModeChange={handleAuthModeChange}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.20),_transparent_24%),linear-gradient(180deg,_#fbf7f0_0%,_#f7fafc_100%)] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Navbar
          activePage={activePage}
          notificationsCount={notificationCount}
          notifications={notifications}
          onSelectNotification={handleNotificationSelect}
          onMarkAllRead={markAllNotificationsRead}
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

        <div className="transition-all duration-200">{renderActivePage()}</div>
      </div>
      {toastMessage ? (
        <div className="fixed bottom-4 right-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </main>
  );
}

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

function splitCommaValues(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateAuthForm(mode, form) {
  const normalizedEmail = form.email.trim();
  const password = form.password.trim();

  if (mode === "signup" && !form.name.trim()) {
    return "Name is required.";
  }

  if (!normalizedEmail || !password) {
    return "Email and password are required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Enter a valid email address.";
  }

  return "";
}

function resolveAuthError(mode, error) {
  if (mode === "signup" && error.status === 409) {
    return "User already exists";
  }

  if (mode === "login" && error.status === 404) {
    return "User not found";
  }

  if (mode === "login" && error.status === 401) {
    return "Invalid credentials";
  }

  return error.message || "Authentication failed.";
}

function getProfileIdFromPath(pathname) {
  const match = pathname.match(/^\/profile\/([^/]+)$/);
  return match ? match[1] : "";
}

export default App;
