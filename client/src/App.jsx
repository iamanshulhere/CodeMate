const features = [
  "Real-time project discussions",
  "Task and sprint collaboration",
  "Team workspaces and profiles",
  "Code review and issue tracking"
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Developer Collaboration Platform</p>
        <h1>Build together, ship faster.</h1>
        <p className="hero-copy">
          A MERN stack foundation for teams to collaborate on projects, discuss
          ideas, track work, and stay aligned.
        </p>

        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature} className="feature-card">
              <h2>{feature}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
