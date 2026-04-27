import { useEffect, useMemo, useState } from "react";
import {
  createProject,
  getConnections,
  getProjectInvites,
  getProjects,
  joinProject,
  rejectProjectInvite,
  sendProjectInvite,
  acceptProjectInvite
} from "../services/api";

function ProjectsPage({ token, currentUserId, onToast, highlightInviteId }) {
  const [projects, setProjects] = useState([]);
  const [connections, setConnections] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(null);
  const [inviteTargetProject, setInviteTargetProject] = useState("");
  const [processingInviteId, setProcessingInviteId] = useState("");
  const [sendingInviteId, setSendingInviteId] = useState("");
  const [form, setForm] = useState({ title: "", description: "", techStack: "" });

  const loadProjects = async () => {
    try {
      const response = await getProjects(token);
      setProjects(response.projects || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load projects.");
    }
  };

  const loadConnections = async () => {
    try {
      const response = await getConnections(token);
      setConnections(response.connections || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load your connections.");
    }
  };

  const loadInvites = async () => {
    try {
      const response = await getProjectInvites(token);
      setReceivedInvites(response.receivedInvites || []);
      setSentInvites(response.sentInvites || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load project invites.");
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    void Promise.all([loadProjects(), loadConnections(), loadInvites()])
      .catch((loadError) => {
        setError(loadError.message || "Unable to load projects and invites.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleCreateProject = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await createProject(token, {
        title: form.title.trim(),
        description: form.description.trim(),
        techStack: form.techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      });

      setProjects((previous) => [response.project, ...previous]);
      setForm({ title: "", description: "", techStack: "" });
      setSuccess("Project created successfully.");
      onToast?.("Project created successfully.");
    } catch (createError) {
      setError(createError.message || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinProject = async (projectId) => {
    setJoining(projectId);
    setError("");
    setSuccess("");

    try {
      const response = await joinProject(token, projectId);
      setProjects((previous) =>
        previous.map((project) =>
          project._id === response.project._id ? response.project : project
        )
      );
      setSuccess("You joined the project.");
      onToast?.("You joined the project.");
    } catch (joinError) {
      setError(joinError.message || "Failed to join project.");
    } finally {
      setJoining(null);
    }
  };

  const handleSendInvite = async (projectId, userId) => {
    const inviteKey = `${projectId}:${userId}`;
    setSendingInviteId(inviteKey);
    setError("");
    setSuccess("");

    try {
      await sendProjectInvite(token, projectId, userId);
      onToast?.("Project invite sent.");
      await loadInvites();
      setInviteTargetProject("");
    } catch (inviteError) {
      setError(inviteError.message || "Failed to send invite.");
    } finally {
      setSendingInviteId("");
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    setProcessingInviteId(inviteId);
    setError("");
    setSuccess("");

    try {
      await acceptProjectInvite(token, inviteId);
      onToast?.("Project invite accepted.");
      await Promise.all([loadProjects(), loadInvites()]);
    } catch (acceptError) {
      setError(acceptError.message || "Failed to accept invite.");
    } finally {
      setProcessingInviteId("");
    }
  };

  const handleRejectInvite = async (inviteId) => {
    setProcessingInviteId(inviteId);
    setError("");
    setSuccess("");

    try {
      await rejectProjectInvite(token, inviteId);
      onToast?.("Project invite rejected.");
      await loadInvites();
    } catch (rejectError) {
      setError(rejectError.message || "Failed to reject invite.");
    } finally {
      setProcessingInviteId("");
    }
  };

  return (
    <section className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
            Projects
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Collaboration workspace
          </h2>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Create new project</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Build a collaboration space and automatically join as a member.
                </p>
              </div>
              <button
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={handleCreateProject}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-300"
                placeholder="Project name"
              />

              <label className="block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-300"
                rows={4}
                placeholder="What is the project about?"
              />

              <label className="block text-sm font-semibold text-slate-700">Tech stack</label>
              <input
                name="techStack"
                value={form.techStack}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-300"
                placeholder="React, Node.js, MongoDB"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Available projects</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Browse collaboration spaces and join projects with one click.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {projects.length} projects
              </span>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading projects...</p>
          ) : null}

          {!loading && !projects.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No projects available. Create the first project to invite collaborators.
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {receivedInvites.length ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Received invites</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Respond to project invitations from your connections.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {receivedInvites.length} pending
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {receivedInvites.map((invite) => (
                  <article
                    key={invite._id}
                    className={`rounded-3xl border p-4 ${
                      invite._id === highlightInviteId ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{invite.sender.name}</p>
                        <p className="text-sm text-slate-500">{invite.sender.email}</p>
                        <p className="mt-1 text-sm text-slate-600">Invite to {invite.projectId?.title || "a project"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={() => handleAcceptInvite(invite._id)}
                          disabled={processingInviteId === invite._id}
                        >
                          {processingInviteId === invite._id ? "Processing..." : "Accept"}
                        </button>
                        <button
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={() => handleRejectInvite(invite._id)}
                          disabled={processingInviteId === invite._id}
                        >
                          {processingInviteId === invite._id ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {projects.map((project) => {
            const isMember = project.members.some(
              (member) => String(member._id ?? member) === String(currentUserId)
            );
            const invitedIds = new Set(
              sentInvites
                .filter((invite) => String(invite.projectId?._id) === String(project._id) && invite.status === "pending")
                .map((invite) => String(invite.receiver?._id || invite.receiver))
            );
            const projectMemberIds = new Set(project.members.map((member) => String(member._id ?? member)));

            const eligibleConnections = connections.filter(
              (connection) =>
                !projectMemberIds.has(String(connection.userId)) &&
                !invitedIds.has(String(connection.userId))
            );

            return (
              <article
                key={project._id}
                className={`rounded-3xl border p-5 shadow-sm ${
                  isMember ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{project.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">Created by {project.createdBy?.name || "Unknown"}</p>
                    <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isMember
                          ? "border border-green-300 bg-green-100 text-green-700 cursor-not-allowed"
                          : joining === project._id
                          ? "bg-amber-400 text-white cursor-wait"
                          : "bg-amber-600 text-white hover:bg-amber-700 hover:shadow-md"
                      }`}
                      onClick={() => handleJoinProject(project._id)}
                      disabled={isMember || joining === project._id}
                    >
                      {joining === project._id ? "Joining..." : isMember ? "Joined ✓" : "Join Project"}
                    </button>
                    {isMember ? (
                      <button
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        onClick={() => setInviteTargetProject((current) => (current === project._id ? "" : project._id))}
                      >
                        {inviteTargetProject === project._id ? "Hide invites" : "Invite connection"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.techStack?.length ? (
                    project.techStack.map((tech) => (
                      <span
                        key={`${project._id}-${tech}`}
                        className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {tech}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      No tech stack yet
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                      Members
                    </span>
                    <span>{project.members?.length || 0} collaborator(s)</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.members?.length ? (
                      project.members.map((member) => (
                        <span
                          key={member._id ?? member}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {member.name || member.email || member}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        No members yet
                      </span>
                    )}
                  </div>
                </div>

                {inviteTargetProject === project._id ? (
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">Invite a connected collaborator</h4>
                    {connections.length ? (
                      <div className="mt-3 space-y-3">
                        {eligibleConnections.length ? (
                          eligibleConnections.map((connection) => {
                            const inviteKey = `${project._id}:${connection.userId}`;
                            return (
                              <div key={connection.userId} className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{connection.name}</p>
                                  <p className="text-sm text-slate-500">{connection.email}</p>
                                </div>
                                <button
                                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                  onClick={() => handleSendInvite(project._id, connection.userId)}
                                  disabled={sendingInviteId === inviteKey}
                                >
                                  {sendingInviteId === inviteKey ? "Sending..." : "Send invite"}
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            No eligible connections to invite for this project.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Join or connect with users to invite collaborators.
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProjectsPage;
