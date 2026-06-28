const sections = [
  {
    title: 'Developer / GitHub',
    description: 'Developer sign-in through GitHub App and local project management.',
  },
  {
    title: 'PM / Slack',
    description: 'PM sign-in through Slack to join an invited session.',
  },
];

export function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="space-y-4">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
            PairDock MVP skeleton
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Developer and PM surfaces with provider boundaries in place
            </h1>
            <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
              Initial React surface for the GitHub developer flow and Slack PM flow, now styled with TailwindCSS tokens
              instead of inline styles.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30"
            >
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{section.description}</p>
            </section>
          ))}
        </section>
      </div>
    </main>
  );
}
