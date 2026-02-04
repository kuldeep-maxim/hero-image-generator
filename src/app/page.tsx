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
            Build abstract hero images with branded color themes.
          </h1>
          <p className="max-w-2xl text-sm text-emerald-900/70 sm:text-base">
            Pick a brand, choose one of two color schemes, select a theme, and
            generate a unique abstract pattern without any LLMs.
          </p>
        </header>

        <section>
          <HeroGenerator />
        </section>
      </main>
    </div>
  );
}
