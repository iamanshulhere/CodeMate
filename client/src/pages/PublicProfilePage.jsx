function PublicProfilePage({ error, loading, profile }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.20),_transparent_24%),linear-gradient(180deg,_#fbf7f0_0%,_#f7fafc_100%)] px-4 py-8 text-slate-900 sm:px-6">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
          Public Profile
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading public profile...</p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {profile ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-3xl bg-slate-950 p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">
                    {profile.user?.name || "Developer"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-300">
                    {profile.headline || "No headline available"}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-slate-950">
                  {getInitials(profile.user?.name || "CM")}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <InfoCard label="Location" value={profile.location || "Not set"} />
                <InfoCard
                  label="Experience"
                  value={`${profile.totalExperienceYears ?? 0}+ years`}
                />
                <InfoCard
                  label="Availability"
                  value={profile.availability || "Unknown"}
                />
              </div>
            </div>

            <section>
              <h2 className="text-lg font-bold text-slate-950">About</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {profile.bio || "No bio added yet."}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-950">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.skills || []).length ? (
                  profile.skills.map((skill) => (
                    <span
                      key={`${skill.name}-${skill.level}`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      {skill.name} - {skill.level}
                    </span>
                  ))
                ) : (
                  <EmptyState label="No skills listed." />
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-950">Interests</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.interests || []).length ? (
                  profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <EmptyState label="No interests listed." />
                )}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
      {label}
    </span>
  );
}

function getInitials(value) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default PublicProfilePage;
