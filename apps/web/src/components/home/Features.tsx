import {
  BookOpen,
  Layers,
  MessageSquareText,
  Timer,
  Video,
  Workflow,
} from "lucide-react";

const items = [
  {
    icon: Video,
    title: "YouTube & playlists",
    body: "Bring single videos or whole courses. Lexora keeps ownership and scope per user—ready for playlist-wide RAG later.",
  },
  {
    icon: Layers,
    title: "Embeddings & Qdrant",
    body: "Transcript chunks become vectors with rich payload: video, time range, and user scope for safe retrieval.",
  },
  {
    icon: MessageSquareText,
    title: "Grounded answers",
    body: "Ask in natural language; answers cite where in the video the evidence lives—not generic LLM filler.",
  },
  {
    icon: Timer,
    title: "Timestamp navigation",
    body: "Jump back to the exact moment. Built for learners who need proof, not vibes.",
  },
  {
    icon: Workflow,
    title: "Worker pipeline",
    body: "Ingestion jobs with explicit states: queue, transcript, chunk, embed, index—observable and retriable.",
  },
  {
    icon: BookOpen,
    title: "Course-shaped data",
    body: "Playlists and ordering are first-class in the schema so “this module only” queries stay natural.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-400">
          Platform
        </p>
        <h2 className="font-display mt-2 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Everything you need to turn hours of video into usable knowledge
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          Lexora is being built as a flagship-grade system: modular services, real
          Postgres, and vector search you can reason about in production.
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="group rounded-2xl border border-white/[0.06] bg-lexora-surface/50 p-6 transition hover:border-violet-500/25 hover:bg-lexora-elevated/80"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 transition group-hover:bg-violet-500/25">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
