export function HowItWorks() {
  const steps = [
    { n: "01", t: "Sign in", d: "Google or email—your library is always scoped to you." },
    { n: "02", t: "Add a source", d: "Paste a YouTube URL; workers fetch, chunk, and embed." },
    { n: "03", t: "Ask Lexora", d: "Semantic search + local LLM answers with citations." },
  ];

  return (
    <section id="how" className="scroll-mt-24 border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          How it works
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <span className="font-display text-5xl font-bold text-violet-500/30">
                {s.n}
              </span>
              <h3 className="mt-2 text-xl font-semibold text-white">{s.t}</h3>
              <p className="mt-2 text-zinc-500">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
