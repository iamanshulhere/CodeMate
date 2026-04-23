function AuthScreen({
  authError,
  authForm,
  authMode,
  loadingAuth,
  onAuthFormChange,
  onAuthModeChange,
  onSubmit
}) {
  const isLogin = authMode === "login";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              CodeMate
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {isLogin ? "Login to your account" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isLogin
                ? "Enter your email and password to continue."
                : "Set up your account with your name, email, and password."}
            </p>
          </div>

          <div className="mt-6 flex rounded-full bg-slate-100 p-1">
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isLogin
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => onAuthModeChange("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                !isLogin
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => onAuthModeChange("signup")}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
            {!isLogin ? (
              <FormField
                autoComplete="name"
                label="Name"
                name="name"
                onChange={onAuthFormChange}
                placeholder="Your full name"
                value={authForm.name}
              />
            ) : null}

            <FormField
              autoComplete="email"
              label="Email"
              name="email"
              onChange={onAuthFormChange}
              placeholder="you@example.com"
              type="email"
              value={authForm.email}
            />

            <FormField
              autoComplete={isLogin ? "current-password" : "new-password"}
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
                ? isLogin
                  ? "Logging in..."
                  : "Creating account..."
                : isLogin
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
  autoComplete,
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
        autoComplete={autoComplete}
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

export default AuthScreen;
