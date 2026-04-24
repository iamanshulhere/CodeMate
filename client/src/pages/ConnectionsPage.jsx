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
        <p className="text-sm text-slate-500">{matches.length} user matches found</p>
      </div>

      {matches.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <article
              key={match.userId}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-950">
                      {match.developer?.name || "Unknown developer"}
                    </h3>
                    {match.developer?.isOnline ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                        Online
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {match.developer?.email || "No email available"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {match.matchScore} shared
                </span>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <InfoLine label="Role" value={match.developer?.role || "developer"} />
                <InfoLine
                  label="Compatibility"
                  value={`${Math.round((match.score || 0) * 100)}%`}
                />
              </div>

              <div className="mt-5 space-y-4">
                <MatchSection
                  label="Common Skills"
                  items={match.commonSkills}
                  tone="sky"
                />
                <MatchSection
                  label="Common Tech Stack"
                  items={match.commonTechStack}
                  tone="amber"
                />
                <MatchSection
                  label="Common Interests"
                  items={match.commonInterests}
                  tone="emerald"
                />
              </div>

              <button
                className="mt-5 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => match.developer?.userId && onOpenChat(match.developer.userId)}
                disabled={!match.developer?.userId}
              >
                Open messages
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
          No matches yet. Add more skills, tech stack items, or interests to improve recommendations.
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

function MatchSection({ items = [], label, tone }) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700"
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span
              key={`${label}-${item}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClasses[tone]}`}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
            No overlap
          </span>
        )}
      </div>
    </div>
  );
}

export default ConnectionsPage;
