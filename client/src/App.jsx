const profileSkills = [
  "React",
  "Node.js",
  "MongoDB",
  "Socket.IO",
  "System Design",
  "TypeScript"
];

const activeChats = [
  {
    name: "Maya Chen",
    role: "Frontend Lead",
    message: "Pushed the new dashboard states. Can you review the empty-state copy?",
    time: "2m ago",
    online: true
  },
  {
    name: "Arjun Patel",
    role: "Backend Engineer",
    message: "Socket auth is stable now. I am testing reconnect flows next.",
    time: "18m ago",
    online: true
  },
  {
    name: "Lena Ortiz",
    role: "Product Designer",
    message: "Dropped revised collaboration cards in Figma for the sprint review.",
    time: "43m ago",
    online: false
  }
];

const projectCards = [
  {
    title: "Realtime Pairing Workspace",
    status: "In Progress",
    summary:
      "Shared coding rooms, lightweight video, and live notes for async and synchronous collaboration.",
    progress: 72,
    contributors: ["MC", "AP", "LO", "JS"]
  },
  {
    title: "Developer Match Engine",
    status: "Review",
    summary:
      "Scoring developers by skills, interests, and preferred stack to recommend strong project partners.",
    progress: 88,
    contributors: ["RK", "AP", "SJ"]
  },
  {
    title: "Sprint Command Center",
    status: "Planning",
    summary:
      "A cross-team overview for blockers, priorities, and release readiness across active projects.",
    progress: 36,
    contributors: ["MC", "LO", "AB"]
  }
];

const feedItems = [
  "Profile completeness increased to 92% after adding architecture and mentoring tags.",
  "Two new collaboration requests arrived from developers who share React and WebRTC interests.",
  "Current sprint has 5 tasks ready for review and 1 blocker waiting on API validation."
];

function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.20),_transparent_24%),linear-gradient(180deg,_#fbf7f0_0%,_#f7fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[2rem] border border-white/60 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-700">
                CodeMate Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Build, chat, and ship with your crew.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                A collaboration workspace for developer profiles, active conversations,
                and project momentum all in one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCard label="Open Projects" value="12" accent="amber" />
              <MetricCard label="Unread Chats" value="8" accent="sky" />
              <MetricCard label="Match Score" value="94%" accent="emerald" />
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Profile
                  </p>
                  <h2 className="mt-3 text-2xl font-bold">Anshu Sharma</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Full-stack developer focused on collaboration tooling and real-time
                    systems.
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-slate-950">
                  AS
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <InfoPill label="Experience" value="5+ years" />
                <InfoPill label="Location" value="India" />
                <InfoPill label="Availability" value="Open" />
                <InfoPill label="Focus" value="Realtime" />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
                  Tech Stack
                </h3>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Top skills
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {profileSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-sky-100 bg-sky-50/80 p-4">
              <h3 className="text-sm font-bold text-sky-900">Activity Feed</h3>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                {feedItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-white/80 bg-white/80 px-3 py-3"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">
                  Project Collaboration
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Team momentum at a glance
                </h2>
              </div>

              <div className="flex gap-3">
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Create Project
                </button>
                <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  Sync Tasks
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {projectCards.map((project) => (
                <article
                  key={project.title}
                  className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                      {project.status}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {project.summary}
                  </p>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-600">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.contributors.map((person) => (
                        <div
                          key={person}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-xs font-bold text-white"
                        >
                          {person}
                        </div>
                      ))}
                    </div>
                    <button className="text-sm font-semibold text-sky-700 transition hover:text-sky-900">
                      Open board
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Sprint Pulse
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <SprintStat label="Ready for review" value="05" />
                  <SprintStat label="Blocked tasks" value="01" />
                  <SprintStat label="Team velocity" value="+18%" />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
                  Recommended Match
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  Arjun Patel matches your real-time stack.
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Strong overlap in Node.js, Socket.IO, MongoDB, and collaboration
                  systems. Great fit for the Pairing Workspace project.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Node.js", "MongoDB", "Socket.IO", "WebRTC"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white px-3 py-2 text-sm font-medium text-emerald-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-700">
                  Team Chat
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Messages</h2>
              </div>
              <button className="rounded-full bg-rose-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                New thread
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {activeChats.map((chat) => (
                <article
                  key={chat.name}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white">
                          {chat.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                            chat.online ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">{chat.name}</h3>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          {chat.role}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-slate-400">{chat.time}</span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">{chat.message}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Quick reply
              </label>
              <textarea
                className="mt-3 h-28 w-full resize-none rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300"
                placeholder="Drop a standup update, ask for a review, or kick off a new pairing session."
              />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">Mentions, links, and snippets supported</p>
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Send message
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
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

function SprintStat({ label, value }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default App;
