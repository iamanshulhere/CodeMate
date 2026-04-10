const navItems = [
  { id: "profile", label: "Profile" },
  { id: "connections", label: "Connections" },
  { id: "projects", label: "Projects" },
  { id: "messages", label: "Messages" }
];

function Navbar({
  activePage,
  onLogout,
  onNavigate,
  onSearchChange,
  searchQuery,
  searchResults,
  searchingUsers,
  onSelectSearchUser
}) {
  return (
    <header className="mb-6 rounded-3xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <button
            className="text-left text-2xl font-black tracking-tight text-slate-950"
            onClick={() => onNavigate("profile")}
          >
            CodeMate
          </button>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 md:hidden">
            Dashboard
          </span>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activePage === item.id
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-3 md:min-w-[280px]">
          <div className="relative">
            <input
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-300"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search users by name or email"
              value={searchQuery}
            />
            {searchingUsers ? (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                Searching...
              </span>
            ) : null}
            {searchQuery.trim() && searchResults.length ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                    onClick={() => onSelectSearchUser(user)}
                  >
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="hidden text-sm text-slate-500 md:inline">MERN workspace</span>
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
