const navItems = [
  { id: "profile", label: "Profile" },
  { id: "connections", label: "Connections" },
  { id: "projects", label: "Projects" },
  { id: "messages", label: "Messages" }
];

function Navbar({ activePage, onLogout, onNavigate }) {
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
    </header>
  );
}

export default Navbar;
