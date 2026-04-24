import { useEffect, useState } from "react";
import { createProject, getProjects, joinProject } from "../services/api";

function ProjectsPage({ token, currentUserId, onNotify }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(null); // projectId being joined
  const [form, setForm] = useState({ title: "", description: "", techStack: "" });

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadProjects = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getProjects(token);
        setProjects(response.projects || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load projects.");
      } finally {
        setLoading(false);
      }
    };

    void loadProjects();
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

      if (typeof onNotify === "function") {
        onNotify({
          type: "project-created",
          title: "Project created",
          message: `You created ${response.project.title}`,
          page: "projects",
          data: { projectId: response.project._id },
          createdAt: new Date().toISOString(),
          read: false
        });
      }
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

      if (typeof onNotify === "function") {
        onNotify({
          type: "project-join",
          title: "Joined project",
          message: `You joined ${response.project.title}`,
          page: "projects",
          data: { projectId: response.project._id },
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    } catch (joinError) {
      setError(joinError.message || "Failed to join project.");
    } finally {
      setJoining(null);
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
              <label className="block text-sm font-semibold text-slate-700">
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-300"
                placeholder="Project name"
              />

              <label className="block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-300"
                rows={4}
                placeholder="What is the project about?"
              />

              <label className="block text-sm font-semibold text-slate-700">
                Tech stack
              </label>
              <input
                name="techStack"
                value={form.techStack}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-300"
                placeholder="React, Node.js, MongoDB"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

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
          {projects.map((project) => {
            const isMember = project.members.some(
              (member) => String(member._id) === String(currentUserId)
            );

            return (
              <article key={project._id} className={`rounded-3xl border p-5 shadow-sm ${isMember ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{project.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">Created by {project.createdBy?.name || "Unknown"}</p>
                    <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                  </div>
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
                          key={member._id}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {member.name || member.email}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        No members yet
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProjectsPage;
