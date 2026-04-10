function ConnectionsPage({ matches, onOpenChat }) {
  return (
    <section className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
            Connections
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Recommended collaborators
          </h2>
        </div>
        <p className="text-sm text-slate-500">{matches.length} live matches found</p>
      </div>

      {matches.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <article
              key={match.profileId}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    {match.developer?.name || "Unknown developer"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {match.developer?.headline || "No headline added"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {(match.score * 100).toFixed(0)}% fit
                </span>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <InfoLine label="Location" value={match.developer?.location || "Not set"} />
                <InfoLine
                  label="Availability"
                  value={match.developer?.availability || "Unknown"}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {match.commonSkills?.length ? (
                  match.commonSkills.map((skill) => (
                    <span
                      key={`${match.profileId}-${skill}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                    No overlapping skills
                  </span>
                )}
              </div>

              <button
                className="mt-5 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => onOpenChat(match.developer?.userId || "")}
              >
                Open messages
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
          No matches yet. Add more skills or interests to your profile to improve recommendations.
        </div>
      )}
    </section>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-slate-400">{label}</span>
      <span className="text-right text-slate-700">{value}</span>
    </div>
  );
}

export default ConnectionsPage;
