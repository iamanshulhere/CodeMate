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
        <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-700">
            CodeMate Frontend
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Clean collaboration dashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Log in with JWT auth, load your developer profile, browse connections,
            and chat live through Socket.IO.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatTile label="Backend" value="Live API" />
            <StatTile label="Auth" value="JWT" />
            <StatTile label="Realtime" value="Socket.IO" />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
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
              <FormField
                label="Name"
                name="name"
                onChange={onAuthFormChange}
                placeholder="Your full name"
                value={authForm.name}
              />
            ) : null}
            <FormField
              label="Email"
              name="email"
              onChange={onAuthFormChange}
              placeholder="you@example.com"
              type="email"
              value={authForm.email}
            />
            <FormField
              label="Password"
              name="password"
              onChange={onAuthFormChange}
              placeholder="Enter your password"
              type="password"
              value={authForm.password}
            />

            {authError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {authError}
              </div>
            ) : null}

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

function FormField({
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

function StatTile({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-950 px-4 py-4 text-white">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

export default AuthScreen;
