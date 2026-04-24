import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import AuthScreen from "./components/AuthScreen";
import Navbar from "./components/Navbar";
import ConnectionsPage from "./pages/ConnectionsPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectsPage from "./pages/ProjectsPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import {
  createProfile,
  getConversationMessages,
  getCurrentUser,
  getProfileById,
  getMyProfile,
  getUserMatches,
  loginUser,
  searchUsers,
  signupUser
} from "./services/api";

const tokenStorageKey = "codemate_token";
const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
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
  const socketRef = useRef(null);
  const currentUserIdRef = useRef("");
  const selectedChatUserIdRef = useRef("");

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
  const [messagesByUser, setMessagesByUser] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [profileDraft, setProfileDraft] = useState(emptyProfileDraft);
  const [chatConnected, setChatConnected] = useState(false);
  const [chatStatus, setChatStatus] = useState("Disconnected");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPublicProfile, setLoadingPublicProfile] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [authError, setAuthError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [chatError, setChatError] = useState("");
  const [projectActionMessage, setProjectActionMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicProfileError, setPublicProfileError] = useState("");

  const selectedMatch = useMemo(
    () =>
      matches.find((match) => match.developer?.userId === selectedChatUserId) ||
      null,
    [matches, selectedChatUserId]
  );

  const selectedConversationUser = useMemo(() => {
    if (selectedMatch?.developer) {
      return {
        name: selectedMatch.developer.name,
        headline: selectedMatch.developer.headline,
        userId: selectedMatch.developer.userId
      };
    }

    if (selectedChatUser) {
      return {
        name: selectedChatUser.name,
        headline: selectedChatUser.headline || selectedChatUser.email,
        userId: selectedChatUser.userId || selectedChatUser._id
      };
    }

    return null;
  }, [selectedChatUser, selectedMatch]);

  const chatContacts = useMemo(() => {
    const contactsMap = new Map();

    matches.forEach((match) => {
      if (!match.developer?.userId) {
        return;
      }

      contactsMap.set(match.developer.userId, {
        userId: match.developer.userId,
        name: match.developer.name,
        email: match.developer.email,
        headline: match.developer.headline || "",
        source: "match"
      });
    });

    if (selectedChatUser?._id || selectedChatUser?.userId) {
      const selectedUserId = selectedChatUser.userId || selectedChatUser._id;
      contactsMap.set(selectedUserId, {
        userId: selectedUserId,
        name: selectedChatUser.name,
        email: selectedChatUser.email,
        headline: selectedChatUser.headline || selectedChatUser.email || "",
        source: "search"
      });
    }

    Object.entries(messagesByUser).forEach(([userId]) => {
      if (!contactsMap.has(userId)) {
        contactsMap.set(userId, {
          userId,
          name: userId,
          email: "",
          headline: "",
          source: "history"
        });
      }
    });

    return Array.from(contactsMap.values());
  }, [matches, messagesByUser, selectedChatUser]);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setCurrentUser(null);
      setProfile(null);
      setMatches([]);
      return;
    }

    localStorage.setItem(tokenStorageKey, token);
    void bootstrapDashboard(token);

    return () => {
      disconnectSocket();
    };
  }, [token]);

  useEffect(() => {
    if (!selectedChatUserId && matches[0]?.developer?.userId) {
      setSelectedChatUserId(matches[0].developer.userId);
    }
  }, [matches, selectedChatUserId]);

  useEffect(() => {
    selectedChatUserIdRef.current = selectedChatUserId;
  }, [selectedChatUserId]);

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

  const disconnectSocket = () => {
    if (socketRef.current) {
      console.log("[socket] disconnecting");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setChatConnected(false);
    setChatStatus("Disconnected");
  };

  const connectSocket = (authToken) => {
    if (!authToken) {
      return;
    }

    disconnectSocket();
    console.log("[socket] connecting", socketUrl);
    console.log("[socket] token available", Boolean(authToken));
    setChatStatus("Connecting...");

    const socket = io(socketUrl, {
      auth: {
        token: authToken
      },
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
    });

    socket.on("chat:ready", ({ userId }) => {
      console.log("[socket] ready", userId);
      currentUserIdRef.current = userId;
      setChatConnected(true);
      setChatStatus("Connected");
      setChatError("");
      setCurrentUser((previousUser) =>
        previousUser
          ? { ...previousUser, _id: previousUser._id || userId }
          : { _id: userId }
      );
    });

    socket.on("connect_error", (error) => {
      console.error("[socket] connect error", error);
      setChatConnected(false);
      setChatStatus("Connection failed");
      setChatError(error.message || "Failed to connect chat.");
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected", reason);
      setChatConnected(false);
      setChatStatus("Disconnected");
    });

    socket.on("chat:error", ({ message }) => {
      console.error("[socket] chat error", message);
      setChatError(message || "Chat error");
    });

    socket.on("chat:message", (payload) => {
      console.log("[socket] message received", payload);
      const currentUserId = currentUserIdRef.current;
      const partnerUserId =
        payload.fromUserId === currentUserId ? payload.toUserId : payload.fromUserId;

      setMessagesByUser((previousMessages) => {
        const existingConversation = previousMessages[partnerUserId] || [];

        return {
          ...previousMessages,
          [partnerUserId]: [
            ...existingConversation,
            {
              id: `${payload.sentAt}-${payload.fromUserId}-${existingConversation.length}`,
              senderId: payload.fromUserId,
              receiverId: payload.toUserId,
              text: payload.text,
              sentAt: payload.sentAt,
              direction:
                payload.fromUserId === currentUserId ? "outbound" : "inbound",
              read:
                payload.fromUserId === currentUserId ||
                partnerUserId === selectedChatUserIdRef.current
            }
          ]
        };
      });
    });

    socket.on("chat:typing", (payload) => {
      console.log("[socket] typing", payload);
    });
  };

  const bootstrapDashboard = async (authToken) => {
    setLoadingDashboard(true);
    setDashboardError("");
    console.log("[dashboard] bootstrapping with token");

    try {
      const fetchedUser = await getCurrentUser(authToken);
      console.log("[dashboard] current user fetched", fetchedUser);
      setCurrentUser(fetchedUser);
      currentUserIdRef.current = fetchedUser._id || currentUserIdRef.current;

      const fetchedProfile = await getMyProfile(authToken);
      console.log("[dashboard] profile fetched", fetchedProfile);
      setProfile(fetchedProfile);
      setCurrentUser(fetchedProfile.user || fetchedUser || null);
      currentUserIdRef.current =
        fetchedProfile.user?._id || currentUserIdRef.current;

      const fetchedMatches = await getUserMatches(authToken);
      console.log("[dashboard] matches fetched", fetchedMatches);
      setMatches(fetchedMatches.matches || []);
      connectSocket(authToken);
    } catch (error) {
      console.error("[dashboard] bootstrap failed", error);

      if (error.status === 404) {
        setProfile(null);
        setMatches([]);
        setDashboardError(
          "Your account is authenticated, but you do not have a developer profile yet."
        );
        connectSocket(authToken);
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
    disconnectSocket();
    currentUserIdRef.current = "";
    setToken("");
    setCurrentUser(null);
    setProfile(null);
    setMatches([]);
    setMessagesByUser({});
    setSelectedChatUserId("");
    setChatInput("");
    setAuthError("");
    setDashboardError("");
    setChatError("");
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
      currentUserIdRef.current =
        createdProfile.user?._id || currentUserIdRef.current;
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

  const handleSendMessage = () => {
    if (!socketRef.current || !chatConnected) {
      setChatError("Chat is not connected yet.");
      return;
    }

    if (!selectedChatUserId) {
      setChatError("Choose a match to chat with.");
      return;
    }

    if (!chatInput.trim()) {
      setChatError("Type a message before sending.");
      return;
    }

    setSendingMessage(true);
    setChatError("");
    const messageText = chatInput.trim();

    console.log("[chat] sending", {
      targetUserId: selectedChatUserId,
      text: messageText
    });

    socketRef.current.emit("chat:message", {
      targetUserId: selectedChatUserId,
      text: messageText
    });

    setChatInput("");
    setSendingMessage(false);
  };

  const handleSelectConversation = async (userId, userDetails = null) => {
    if (!userId) {
      return;
    }

    console.log("[chat] selecting conversation", userId);
    setSelectedChatUserId(userId);
    if (userDetails) {
      setSelectedChatUser(userDetails);
    }
    setActivePage("messages");
    setLoadingHistory(true);

    try {
      const response = await getConversationMessages(token, userId);
      console.log("[chat] history fetched", response);
      setMessagesByUser((previousMessages) => ({
        ...previousMessages,
        [userId]: (response.messages || []).map((message) => ({
          id: message._id,
          senderId: String(message.sender),
          receiverId: String(message.receiver),
          text: message.text,
          sentAt: message.createdAt,
          direction:
            String(message.sender) === String(currentUserIdRef.current)
              ? "outbound"
              : "inbound",
          read: true
        }))
      }));
    } catch (error) {
      console.error("[chat] history failed", error);
      setChatError(error.message || "Failed to load message history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleProjectAction = (action) => {
    console.log("[projects] action", action);
    setProjectActionMessage(
      `${action} is wired to the UI. Add a project API next to make this persistent.`
    );
  };

  const handleSearchSelect = (user) => {
    console.log("[search] selected user", user);
    setSearchQuery("");
    setSearchResults([]);
    void handleSelectConversation(user._id, {
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
            onOpenChat={(userId) => void handleSelectConversation(userId)}
          />
        );
      case "projects":
        return (
          <ProjectsPage
            onAction={handleProjectAction}
            projectActionMessage={projectActionMessage}
          />
        );
      case "messages":
        return (
          <MessagesPage
            chatConnected={chatConnected}
            chatError={chatError}
            chatInput={chatInput}
            chatStatus={chatStatus}
            contacts={chatContacts}
            currentUserId={currentUser?._id || currentUserIdRef.current}
            loadingHistory={loadingHistory}
            messagesByUser={messagesByUser}
            onChatInputChange={setChatInput}
            onNewThread={() => handleProjectAction("New thread")}
            onSelectConversation={(userId) => void handleSelectConversation(userId)}
            onSendMessage={handleSendMessage}
            selectedChatUserId={selectedChatUserId}
            selectedConversationUser={selectedConversationUser}
            selectedMessages={messagesByUser[selectedChatUserId] || []}
            sendingMessage={sendingMessage}
            socketUrl={socketUrl}
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
