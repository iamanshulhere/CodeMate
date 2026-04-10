import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  createProfile,
  getCurrentUser,
  getMyProfile,
  getProfileMatches,
  loginUser,
  signupUser
} from "./services/api";

const tokenStorageKey = "codemate_token";
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

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

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [token, setToken] = useState(
    () => localStorage.getItem(tokenStorageKey) || ""
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState("");
  const [messagesByUser, setMessagesByUser] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [profileDraft, setProfileDraft] = useState(emptyProfileDraft);
  const [chatConnected, setChatConnected] = useState(false);
  const [chatStatus, setChatStatus] = useState("Disconnected");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [authError, setAuthError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [chatError, setChatError] = useState("");
  const [projectActionMessage, setProjectActionMessage] = useState("");

  const selectedMatch = useMemo(
    () =>
      matches.find((match) => match.developer?.userId === selectedChatUserId) ||
      null,
    [matches, selectedChatUserId]
  );

  const selectedMessages = useMemo(
    () => messagesByUser[selectedChatUserId] || [],
    [messagesByUser, selectedChatUserId]
  );

  const dashboardMetrics = useMemo(() => {
    const skillCount = profile?.skills?.length || 0;
    const matchCount = matches.length;
    const unreadChats = Object.values(messagesByUser).reduce(
      (total, conversation) =>
        total +
        conversation.filter(
          (message) => message.direction === "inbound" && !message.read
        ).length,
      0
    );

    return {
      skillCount,
      matchCount,
      unreadChats
    };
  }, [matches.length, messagesByUser, profile?.skills?.length]);

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

    const socket = io(socketUrl, {
      auth: {
        token: authToken
      }
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
        previousUser ? { ...previousUser, _id: previousUser._id || userId } : { _id: userId }
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
              text: payload.text,
              sentAt: payload.sentAt,
              direction: payload.fromUserId === currentUserId ? "outbound" : "inbound",
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
      currentUserIdRef.current = fetchedProfile.user?._id || currentUserIdRef.current;

      const fetchedMatches = await getProfileMatches(authToken);
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
    setAuthForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleProfileDraftChange = (event) => {
    const { name, value } = event.target;
    setProfileDraft((previous) => ({ ...previous, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
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
      setToken(authResponse.token);
      setCurrentUser({
        _id: authResponse._id,
        name: authResponse.name,
        email: authResponse.email,
        role: authResponse.role
      });
    } catch (error) {
      console.error("[auth] failed", error);
      setAuthError(error.message || "Authentication failed.");
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
          yearsOfExperience: Math.max(Number(profileDraft.totalExperienceYears) || 0, 0)
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
      currentUserIdRef.current = createdProfile.user?._id || currentUserIdRef.current;
      setProfileDraft(emptyProfileDraft);

      const fetchedMatches = await getProfileMatches(token);
      setMatches(fetchedMatches.matches || []);
      setDashboardError("");
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

    console.log("[chat] sending", { targetUserId: selectedChatUserId, text: messageText });
    socketRef.current.emit("chat:message", {
      targetUserId: selectedChatUserId,
      text: messageText
    });

    setChatInput("");
    setSendingMessage(false);
  };

  const handleSelectConversation = (userId) => {
    if (!userId) {
      return;
    }

    console.log("[chat] selecting conversation", userId);
    setSelectedChatUserId(userId);
    setMessagesByUser((previousMessages) => ({
      ...previousMessages,
      [userId]: (previousMessages[userId] || []).map((message) => ({
        ...message,
        read: true
      }))
    }));
  };

  const handleProjectAction = (action) => {
    console.log("[projects] action", action);
    setProjectActionMessage(
      `${action} is wired to the UI. Add a project API next to make this persistent.`
    );
  };

  if (!token) {
    return (
      <AuthScreen
        authError={authError}
        authForm={authForm}
        authMode={authMode}
        loadingAuth={loadingAuth}
        onAuthFormChange={handleAuthFormChange}
        onAuthModeChange={setAuthMode}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.20),_transparent_24%),linear-gradient(180deg,_#fbf7f0_0%,_#f7fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader
          currentUser={currentUser}
          dashboardMetrics={dashboardMetrics}
          onLogout={handleLogout}
          profile={profile}
        />

        {loadingDashboard ? (
          <Notice tone="neutral">Loading profile, matches, and chat setup...</Notice>
        ) : null}
        {dashboardError ? <Notice tone="warning">{dashboardError}</Notice> : null}

        <section className="grid flex-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <ProfilePanel
            chatStatus={chatStatus}
            currentUser={currentUser}
            onCreateProfile={handleCreateProfile}
            onProfileDraftChange={handleProfileDraftChange}
            profile={profile}
            profileDraft={profileDraft}
            submittingProfile={submittingProfile}
          />

          <CollaborationPanel
            chatConnected={chatConnected}
            matches={matches}
            onProjectAction={handleProjectAction}
            onRefresh={() => bootstrapDashboard(token)}
            onSelectConversation={handleSelectConversation}
            profile={profile}
            projectActionMessage={projectActionMessage}
            selectedMatch={selectedMatch}
          />

          <ChatPanel
            chatConnected={chatConnected}
            chatError={chatError}
            chatInput={chatInput}
            chatStatus={chatStatus}
            matches={matches}
            messagesByUser={messagesByUser}
            onChatInputChange={setChatInput}
            onProjectAction={handleProjectAction}
            onSelectConversation={handleSelectConversation}
            onSendMessage={handleSendMessage}
            selectedChatUserId={selectedChatUserId}
            selectedMatch={selectedMatch}
            selectedMessages={selectedMessages}
            sendingMessage={sendingMessage}
          />
        </section>
      </div>
    </main>
  );
}

function AuthScreen({
  authError,
  authForm,
  authMode,
  loadingAuth,
  onAuthFormChange,
  onAuthModeChange,
  onSubmit
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.20),_transparent_24%),linear-gradient(180deg,_#fbf7f0_0%,_#f7fafc_100%)] px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-700">
            CodeMate Frontend
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Connect your frontend to the full MERN stack.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Log in with JWT auth, load your developer profile, fetch real matches,
            and chat live through Socket.IO from a responsive React dashboard.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatTile label="Backend" value="Live API" />
            <StatTile label="Auth" value="JWT" />
            <StatTile label="Realtime" value="Socket.IO" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
          <div className="mb-6 flex rounded-full bg-slate-100 p-1">
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                authMode === "login"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => onAuthModeChange("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                authMode === "signup"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => onAuthModeChange("signup")}
            >
              Sign Up
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {authMode === "signup" ? (
              <InputField
                label="Name"
                name="name"
                onChange={onAuthFormChange}
                placeholder="Your full name"
                value={authForm.name}
              />
            ) : null}
            <InputField
              label="Email"
              name="email"
              onChange={onAuthFormChange}
              placeholder="you@example.com"
              type="email"
              value={authForm.email}
            />
            <InputField
              label="Password"
              name="password"
              onChange={onAuthFormChange}
              placeholder="Enter your password"
              type="password"
              value={authForm.password}
            />

            {authError ? <Notice tone="error">{authError}</Notice> : null}

            <button
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingAuth}
              type="submit"
            >
              {loadingAuth
                ? authMode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : authMode === "login"
                  ? "Login"
                  : "Create account"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function DashboardHeader({ currentUser, dashboardMetrics, onLogout, profile }) {
  return (
    <header className="mb-6 rounded-[2rem] border border-white/60 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-700">
            CodeMate Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {profile?.headline || "Developer collaboration workspace"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {profile?.bio ||
              `Signed in as ${currentUser?.email || "an authenticated user"}. Your dashboard is connected to live backend data.`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Skills" value={String(dashboardMetrics.skillCount)} accent="amber" />
            <MetricCard label="Matches" value={String(dashboardMetrics.matchCount)} accent="sky" />
            <MetricCard label="Unread" value={String(dashboardMetrics.unreadChats)} accent="emerald" />
          </div>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function ProfilePanel({
  chatStatus,
  currentUser,
  onCreateProfile,
  onProfileDraftChange,
  profile,
  profileDraft,
  submittingProfile
}) {
  return (
    <aside className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Profile
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              {profile?.user?.name || currentUser?.name || "Authenticated User"}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {currentUser?.email || "Email unavailable"}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-slate-950">
            {getInitials(profile?.user?.name || currentUser?.name || "CM")}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <InfoPill label="Experience" value={`${profile?.totalExperienceYears ?? 0}+ years`} />
          <InfoPill label="Location" value={profile?.location || "Not set"} />
          <InfoPill label="Role" value={profile?.user?.role || currentUser?.role || "developer"} />
          <InfoPill label="Chat" value={chatStatus} />
        </div>
      </div>

      {profile ? (
        <>
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
                Skills
              </h3>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Live profile
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(profile.skills || []).length ? (
                profile.skills.map((skill) => (
                  <span
                    key={`${skill.name}-${skill.level}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {skill.name} · {skill.level}
                  </span>
                ))
              ) : (
                <EmptyBadge label="No skills added yet" />
              )}
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-sky-100 bg-sky-50/80 p-4">
            <h3 className="text-sm font-bold text-sky-900">Interests</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
              {(profile.interests || []).length ? (
                profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-white/80 bg-white/80 px-3 py-2"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <EmptyBadge label="No interests configured" />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4">
          <h3 className="text-lg font-bold text-slate-900">Create your profile</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Matches need a developer profile. Add a quick one to unlock recommendations.
          </p>

          <div className="mt-4 space-y-3">
            <InputField
              label="Headline"
              name="headline"
              onChange={onProfileDraftChange}
              placeholder="Full-stack developer"
              value={profileDraft.headline}
            />
            <TextAreaField
              label="Bio"
              name="bio"
              onChange={onProfileDraftChange}
              placeholder="What kind of projects do you enjoy building?"
              rows={3}
              value={profileDraft.bio}
            />
            <InputField
              label="Location"
              name="location"
              onChange={onProfileDraftChange}
              placeholder="City or country"
              value={profileDraft.location}
            />
            <InputField
              label="Experience (years)"
              name="totalExperienceYears"
              onChange={onProfileDraftChange}
              placeholder="3"
              type="number"
              value={profileDraft.totalExperienceYears}
            />
            <InputField
              label="Interests"
              name="interests"
              onChange={onProfileDraftChange}
              placeholder="Realtime systems, open source, hackathons"
              value={profileDraft.interests}
            />
            <InputField
              label="Skills"
              name="skills"
              onChange={onProfileDraftChange}
              placeholder="React, Node.js, MongoDB"
              value={profileDraft.skills}
            />
            <InputField
              label="Tech stack"
              name="techStack"
              onChange={onProfileDraftChange}
              placeholder="React, Socket.IO, Express"
              value={profileDraft.techStack}
            />

            <button
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submittingProfile}
              onClick={onCreateProfile}
              type="button"
            >
              {submittingProfile ? "Creating profile..." : "Create Profile"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function CollaborationPanel({
  chatConnected,
  matches,
  onProjectAction,
  onRefresh,
  onSelectConversation,
  profile,
  projectActionMessage,
  selectedMatch
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">
            Project Collaboration
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Backend-connected collaboration overview
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => onProjectAction("Create Project")}
          >
            Create Project
          </button>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => onProjectAction("Sync Tasks")}
          >
            Sync Tasks
          </button>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={onRefresh}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {projectActionMessage ? <Notice tone="neutral">{projectActionMessage}</Notice> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <CollaborationCard
          description={
            profile
              ? `${profile.skills?.length || 0} skills and ${profile.interests?.length || 0} interests are available for matching.`
              : "Create a profile to power personalized matches and collaboration."
          }
          title="Profile Readiness"
          value={profile ? "Ready" : "Needs setup"}
        />
        <CollaborationCard
          description={
            matches.length
              ? "Your collaboration panel is using live recommendations from /api/matches."
              : "No matches yet. Add more skills or interests to improve recommendations."
          }
          title="Available Matches"
          value={String(matches.length)}
        />
        <CollaborationCard
          description={
            chatConnected
              ? "Socket.IO is connected and ready to send messages."
              : "Chat will reconnect automatically when the socket is available."
          }
          title="Realtime Chat"
          value={chatConnected ? "Online" : "Offline"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
            Developer Match Insights
          </p>
          <div className="mt-4 space-y-4">
            {matches.length ? (
              matches.slice(0, 3).map((match) => (
                <div
                  key={match.profileId}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white">
                        {match.developer?.name || "Unknown developer"}
                      </p>
                      <p className="text-sm text-slate-300">
                        {match.developer?.headline || "No headline yet"}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                      {(match.score * 100).toFixed(0)}% fit
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {match.commonSkills?.length ? (
                      match.commonSkills.map((skill) => (
                        <span
                          key={`${match.profileId}-${skill}`}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <EmptyBadge dark label="No overlapping skills found" />
                    )}
                  </div>

                  <button
                    className="mt-4 text-sm font-semibold text-sky-300 transition hover:text-sky-200"
                    onClick={() => onSelectConversation(match.developer?.userId || "")}
                  >
                    Open chat
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">
                No live matches available yet. Once your profile is in place, this panel
                will fill automatically from the backend.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
            Selected Collaboration Partner
          </p>
          {selectedMatch ? (
            <>
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                {selectedMatch.developer?.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedMatch.developer?.headline ||
                  "This developer has not added a headline yet."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(selectedMatch.commonTechStack || []).length ? (
                  selectedMatch.commonTechStack.map((tag) => (
                    <span
                      key={`${selectedMatch.profileId}-${tag}`}
                      className="rounded-full bg-white px-3 py-2 text-sm font-medium text-emerald-800"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <EmptyBadge label="No shared tech stack listed" />
                )}
              </div>
              <button
                className="mt-5 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() =>
                  onProjectAction(`Invite ${selectedMatch.developer?.name} to project`)
                }
              >
                Invite to collaborate
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Pick a match from the insights or chat panel to view collaboration details.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ChatPanel({
  chatConnected,
  chatError,
  chatInput,
  chatStatus,
  matches,
  messagesByUser,
  onChatInputChange,
  onProjectAction,
  onSelectConversation,
  onSendMessage,
  selectedChatUserId,
  selectedMatch,
  selectedMessages,
  sendingMessage
}) {
  return (
    <aside className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-700">
            Team Chat
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Messages</h2>
        </div>
        <button
          className="rounded-full bg-rose-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-700"
          onClick={() => onProjectAction("New thread")}
        >
          New thread
        </button>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Chat status: <span className="font-semibold text-slate-900">{chatStatus}</span>
        {!chatConnected ? " - waiting for socket" : ""}
      </div>

      {chatError ? <Notice tone="error">{chatError}</Notice> : null}

      <div className="mt-5 space-y-3">
        {matches.length ? (
          matches.map((match) => {
            const userId = match.developer?.userId;
            const lastMessage = userId ? messagesByUser[userId]?.at(-1) : null;

            return (
              <button
                key={match.profileId}
                className={`block w-full rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                  selectedChatUserId === userId
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white"
                }`}
                onClick={() => onSelectConversation(userId || "")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white">
                      {getInitials(match.developer?.name || "NA")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {match.developer?.name || "Unknown"}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {(match.score * 100).toFixed(0)}% match
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {lastMessage ? formatTimestamp(lastMessage.sentAt) : "New"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {lastMessage?.text ||
                    match.developer?.headline ||
                    "Select this match to start chatting."}
                </p>
              </button>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No chat contacts yet. Your live matches will appear here.
          </div>
        )}
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Quick reply
        </label>
        <div className="mt-3 rounded-[1.25rem] border border-slate-200 bg-white p-3">
          <div className="max-h-48 space-y-3 overflow-y-auto">
            {selectedMessages.length ? (
              selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.direction === "outbound" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.direction === "outbound"
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <p>{message.text}</p>
                    <p
                      className={`mt-2 text-[11px] ${
                        message.direction === "outbound"
                          ? "text-slate-300"
                          : "text-slate-400"
                      }`}
                    >
                      {formatTimestamp(message.sentAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                {selectedChatUserId
                  ? "No messages yet. Start the conversation."
                  : "Choose a match to begin chatting."}
              </p>
            )}
          </div>
        </div>

        <textarea
          className="mt-3 h-28 w-full resize-none rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300"
          onChange={(event) => onChatInputChange(event.target.value)}
          placeholder={
            selectedChatUserId
              ? `Message ${selectedMatch?.developer?.name || "your collaborator"}...`
              : "Select a match first to send a message."
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
      </div>
    </aside>
  );
}

function InputField({
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextAreaField({ label, name, onChange, placeholder, rows = 4, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </label>
  );
}

function Notice({ children, tone }) {
  const toneClasses = {
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-rose-200 bg-rose-50 text-rose-700"
  };

  return (
    <div className={`mb-6 rounded-[2rem] border px-5 py-4 text-sm ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  const accentClasses = {
    amber: "from-amber-100 to-orange-100 text-amber-900",
    sky: "from-sky-100 to-cyan-100 text-sky-900",
    emerald: "from-emerald-100 to-lime-100 text-emerald-900"
  };

  return (
    <div
      className={`rounded-[1.5rem] bg-gradient-to-br px-4 py-3 ${accentClasses[accent]}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-950 px-4 py-4 text-white">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function EmptyBadge({ dark = false, label }) {
  return (
    <span
      className={`rounded-full px-3 py-2 text-sm font-medium ${
        dark
          ? "bg-white/10 text-slate-200"
          : "border border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

function CollaborationCard({ description, title, value }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <h3 className="mt-3 text-2xl font-black text-slate-950">{value}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function splitCommaValues(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getInitials(value) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

export default App;
