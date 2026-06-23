import HeroGenerator from "@/components/HeroGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-950">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
            Hero Image Generator
          </p>
          <h1 className="text-3xl font-semibold text-emerald-950 sm:text-4xl">
            Build branded 16:9 hero images with AI isometric illustrations.
          </h1>
          <p className="max-w-2xl text-sm text-emerald-900/70 sm:text-base">
            Generate a per-topic isometric line illustration with Gemini, then
            overlay the logo, title and brand accents — or fall back to the
            abstract pattern themes.
          </p>
        </header>

        <section>
          <HeroGenerator />
        </section>
      </main>
    </div>
  );
}
