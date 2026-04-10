function ProjectsPage({ onAction, projectActionMessage }) {
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

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => onAction("Create Project")}
          >
            Create Project
          </button>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => onAction("Sync Tasks")}
          >
            Sync Tasks
          </button>
        </div>
      </div>

      {projectActionMessage ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {projectActionMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ProjectCard
          description="Create project spaces and later connect them to a real projects API."
          title="Project setup"
        />
        <ProjectCard
          description="Use this area for task boards, milestones, and collaborator invites."
          title="Task coordination"
        />
        <ProjectCard
          description="This page is intentionally minimal and ready for real project CRUD next."
          title="Future expansion"
        />
      </div>
    </section>
  );
}

function ProjectCard({ description, title }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}

export default ProjectsPage;
