function ProfilePage({
  currentUser,
  onCreateProfile,
  onProfileDraftChange,
  profile,
  profileDraft,
  submittingProfile
}) {
  return (
    <section className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Profile</p>
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

          <div className="mt-6 space-y-3 text-sm">
            <InfoRow label="Headline" value={profile?.headline || "Not set"} />
            <InfoRow label="Location" value={profile?.location || "Not set"} />
            <InfoRow
              label="Experience"
              value={`${profile?.totalExperienceYears ?? 0}+ years`}
            />
            <InfoRow
              label="Role"
              value={profile?.user?.role || currentUser?.role || "developer"}
            />
          </div>
        </div>

        {profile ? (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold text-slate-950">About</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {profile.bio || "No bio added yet."}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-950">Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
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
                  <EmptyState label="No skills added yet." />
                )}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-950">Interests</h3>
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
                  <EmptyState label="No interests configured." />
                )}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-950">Tech Stack</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.techStack || []).flatMap((group) => group.technologies || []).length ? (
                  profile.techStack
                    .flatMap((group) => group.technologies || [])
                    .map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        {item}
                      </span>
                    ))
                ) : (
                  <EmptyState label="No tech stack listed." />
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <h3 className="text-xl font-bold text-slate-950">Create your profile</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your profile powers matches and helps collaborators understand what you build.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileField
                label="Headline"
                name="headline"
                onChange={onProfileDraftChange}
                placeholder="Full-stack developer"
                value={profileDraft.headline}
              />
              <ProfileField
                label="Location"
                name="location"
                onChange={onProfileDraftChange}
                placeholder="City or country"
                value={profileDraft.location}
              />
              <ProfileField
                label="Experience (years)"
                name="totalExperienceYears"
                onChange={onProfileDraftChange}
                placeholder="3"
                type="number"
                value={profileDraft.totalExperienceYears}
              />
              <ProfileField
                label="Interests"
                name="interests"
                onChange={onProfileDraftChange}
                placeholder="Realtime systems, open source"
                value={profileDraft.interests}
              />
              <ProfileField
                label="Skills"
                name="skills"
                onChange={onProfileDraftChange}
                placeholder="React, Node.js, MongoDB"
                value={profileDraft.skills}
              />
              <ProfileField
                label="Tech stack"
                name="techStack"
                onChange={onProfileDraftChange}
                placeholder="React, Socket.IO, Express"
                value={profileDraft.techStack}
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Bio</span>
              <textarea
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                name="bio"
                onChange={onProfileDraftChange}
                placeholder="What kind of projects do you enjoy building?"
                rows={4}
                value={profileDraft.bio}
              />
            </label>

            <button
              className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submittingProfile}
              onClick={onCreateProfile}
              type="button"
            >
              {submittingProfile ? "Creating profile..." : "Create Profile"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileField({
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

function InfoRow({ label, value }) {
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

export default ProfilePage;
