"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ColorScheme = {
  name: string;
  background: string;
  accent: string;
};

type BrandConfig = {
  label: string;
  logoSrc: string;
  schemes: ColorScheme[];
};

type ThemeConfig = {
  id: string;
  name: string;
  draw: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scheme: ColorScheme,
    rng: () => number,
  ) => void;
};

type Mode = "isometric" | "pattern";

const BRANDS: Record<string, BrandConfig> = {
  maxim: {
    label: "Maxim AI",
    logoSrc: "/logos/maxim-logo.svg",
    schemes: [
      { name: "Deep Aqua", background: "#0C3B43", accent: "#99E5D3" },
      { name: "Midnight Mint", background: "#082a31", accent: "#7fe4d2" },
    ],
  },
  bifrost: {
    label: "Bifrost",
    logoSrc: "/logos/bifrost-logo.png",
    schemes: [
      { name: "Mint on White", background: "#ffffff", accent: "#33C19E" },
      { name: "Evergreen Mint", background: "#0f2d27", accent: "#33C19E" },
    ],
  },
};

const THEMES: ThemeConfig[] = [
  {
    id: "strata",
    name: "Strata",
    draw: (ctx, width, height, scheme, rng) => {
      const base = gradient(ctx, width, height, scheme.background, scheme.accent);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const stripeCount = 80;
      for (let i = 0; i < stripeCount; i += 1) {
        const x = Math.floor(rng() * width);
        const stripeWidth = 6 + Math.floor(rng() * 28);
        const alpha = 0.08 + rng() * 0.25;
        ctx.fillStyle = withAlpha(scheme.accent, alpha);
        ctx.fillRect(x, 0, stripeWidth, height);
      }

      const glowCount = 18;
      for (let i = 0; i < glowCount; i += 1) {
        const radius = 120 + rng() * 240;
        const x = rng() * width;
        const y = rng() * height;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, withAlpha(scheme.accent, 0.35));
        grad.addColorStop(1, withAlpha(scheme.background, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: "weave",
    name: "Weave",
    draw: (ctx, width, height, scheme, rng) => {
      ctx.fillStyle = scheme.background;
      ctx.fillRect(0, 0, width, height);

      const step = 36;
      for (let y = -step; y < height + step; y += step) {
        for (let x = -step; x < width + step; x += step) {
          const offset = (rng() - 0.5) * step * 0.6;
          const size = step * 0.9;
          ctx.strokeStyle = withAlpha(scheme.accent, 0.22);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(x + offset, y - offset, size, size);
          ctx.stroke();
        }
      }

      const ribbonCount = 6;
      for (let i = 0; i < ribbonCount; i += 1) {
        const startY = rng() * height;
        ctx.strokeStyle = withAlpha(scheme.accent, 0.5);
        ctx.lineWidth = 8 + rng() * 10;
        ctx.beginPath();
        for (let x = -40; x <= width + 40; x += 60) {
          const wave = Math.sin((x / width) * Math.PI * 2 + rng() * 4) * 40;
          ctx.lineTo(x, startY + wave);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: "circuit",
    name: "Circuit",
    draw: (ctx, width, height, scheme) => {
      ctx.fillStyle = scheme.background;
      ctx.fillRect(0, 0, width, height);

      const gridSize = 42;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = withAlpha(scheme.accent, 0.2);
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    },
  },
  {
    id: "minimal-grid",
    name: "Minimal Grid",
    draw: (ctx, width, height, scheme) => {
      ctx.fillStyle = scheme.background;
      ctx.fillRect(0, 0, width, height);

      const gridSize = 64;
      ctx.lineWidth = 1;
      ctx.strokeStyle = withAlpha(scheme.accent, 0.12);

      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    },
  },
  {
    id: "soft-diagonal",
    name: "Soft Diagonal",
    draw: (ctx, width, height, scheme, rng) => {
      const base = gradient(ctx, width, height, scheme.background, withAlpha(scheme.accent, 0.35));
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const bandCount = 8;
      for (let i = 0; i < bandCount; i += 1) {
        const alpha = 0.06 + rng() * 0.08;
        ctx.fillStyle = withAlpha(scheme.accent, alpha);
        ctx.save();
        ctx.translate(width * 0.1, -height * 0.2);
        ctx.rotate(-Math.PI / 10);
        ctx.fillRect(i * 180, 0, 120, height * 2);
        ctx.restore();
      }
    },
  },
  {
    id: "paper-waves",
    name: "Paper Waves",
    draw: (ctx, width, height, scheme, rng) => {
      ctx.fillStyle = scheme.background;
      ctx.fillRect(0, 0, width, height);

      const waveCount = 7;
      for (let i = 0; i < waveCount; i += 1) {
        const y = height * 0.2 + i * 70;
        const amplitude = 16 + rng() * 10;
        ctx.strokeStyle = withAlpha(scheme.accent, 0.22);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 24) {
          const wave = Math.sin((x / width) * Math.PI * 2 + i) * amplitude;
          ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: "high-contrast-stripes",
    name: "High Contrast Stripes",
    draw: (ctx, width, height, scheme, rng) => {
      const base = gradient(
        ctx,
        width,
        height,
        scheme.background,
        withAlpha(scheme.background, 0.9),
      );
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const bandHeight = Math.floor(height * 0.6);
      let x = 0;
      while (x < width) {
        const stripeWidth = 3 + Math.floor(rng() * 8);
        const gap = 2 + Math.floor(rng() * 6);
        const bright = rng() > 0.7;
        ctx.fillStyle = bright
          ? withAlpha(scheme.accent, 0.65)
          : withAlpha(scheme.accent, 0.18);
        ctx.fillRect(x, 0, stripeWidth, bandHeight);
        if (bright && rng() > 0.6) {
          ctx.fillStyle = withAlpha("#000000", 0.25);
          ctx.fillRect(x + Math.floor(stripeWidth * 0.6), 0, 1, bandHeight);
        }
        x += stripeWidth + gap;
      }

      ctx.fillStyle = withAlpha("#000000", 0.25);
      ctx.fillRect(0, bandHeight - 2, width, 2);
    },
  },
];

// 16:9 for the AI isometric layout, 1.91:1 (OG card) for the legacy patterns.
const DIMENSIONS: Record<Mode, { width: number; height: number }> = {
  isometric: { width: 1920, height: 1080 },
  pattern: { width: 1200, height: 630 },
};

const ISO_DARK = "#1f2937";

export default function HeroGenerator() {
  const [mode, setMode] = useState<Mode>("isometric");
  const [brandKey, setBrandKey] = useState<keyof typeof BRANDS>("bifrost");
  const [schemeIndex, setSchemeIndex] = useState(0);
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [title, setTitle] = useState(
    "Shadow MCP: The Ungoverned AI Tools Risking Your Data",
  );
  const [kicker, setKicker] = useState("BLOG");
  const [footer, setFooter] = useState("getbifrost.ai");
  const [seed, setSeed] = useState<number>(() => Date.now());
  const [showLogo, setShowLogo] = useState(true);
  const [invertBifrostLogo, setInvertBifrostLogo] = useState(false);
  const [textColorMode, setTextColorMode] = useState<"auto" | "light" | "dark">(
    "auto",
  );
  const [renderScale, setRenderScale] = useState(2);

  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [genModel, setGenModel] = useState("gemini-3-pro-image-preview");
  const [illustrationSrc, setIllustrationSrc] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("gemini_api_key");
    if (stored) setApiKey(stored);
  }, []);

  const updateApiKey = useCallback((value: string) => {
    setApiKey(value);
    if (value) localStorage.setItem("gemini_api_key", value);
    else localStorage.removeItem("gemini_api_key");
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const illustrationRef = useRef<HTMLImageElement | null>(null);

  const brand = BRANDS[brandKey];
  const scheme = brand.schemes[schemeIndex] ?? brand.schemes[0];
  const theme = useMemo(
    () => THEMES.find((item) => item.id === themeId) ?? THEMES[0],
    [themeId],
  );

  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = DIMENSIONS[mode];

  const textColor = useMemo(() => {
    if (textColorMode === "light") return "#ffffff";
    if (textColorMode === "dark") return "#0b1d1f";
    return isDark(scheme.background) ? "#ffffff" : "#0b1d1f";
  }, [scheme.background, textColorMode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dims = DIMENSIONS[mode];
    const pixelRatio = Math.max(1, Math.min(renderScale, 4));
    canvas.width = dims.width * pixelRatio;
    canvas.height = dims.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const rng = mulberry32(seed);

    if (mode === "isometric") {
      drawIsometricHero(ctx, dims.width, dims.height, {
        accent: scheme.accent,
        title,
        kicker,
        footer,
        logo: showLogo ? logoRef.current : null,
        illustration: illustrationRef.current,
        invertLogo: brandKey === "bifrost" && invertBifrostLogo,
      });
      return;
    }

    theme.draw(ctx, dims.width, dims.height, scheme, rng);

    if (kicker.trim()) {
      ctx.fillStyle = withAlpha(textColor, 0.85);
      ctx.font = "600 20px Geist, ui-sans-serif, system-ui";
      ctx.fillText(kicker.toUpperCase(), 72, 88);
    }

    ctx.fillStyle = textColor;
    const titleFontSize = title.length > 120 ? 44 : 56;
    ctx.font = `700 ${titleFontSize}px Geist, ui-sans-serif, system-ui`;
    ctx.textBaseline = "top";

    const titleLines = wrapText(ctx, title, 72, 140, 760, titleFontSize * 1.25);
    titleLines.forEach((line) => {
      ctx.fillText(line.text, line.x, line.y);
    });

    if (showLogo && logoRef.current && logoRef.current.complete) {
      const logo = logoRef.current;
      const maxWidth = brandKey === "maxim" ? 220 : 190;
      const maxHeight = 80;
      const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height, 1);
      const logoWidth = logo.width * scale;
      const logoHeight = logo.height * scale;
      const padding = 56;
      ctx.save();
      if (brandKey === "bifrost" && invertBifrostLogo) {
        ctx.filter = "invert(1)";
      }
      ctx.drawImage(
        logo,
        dims.width - logoWidth - padding,
        dims.height - logoHeight - padding,
        logoWidth,
        logoHeight,
      );
      ctx.restore();
    }
  }, [
    mode,
    brandKey,
    invertBifrostLogo,
    kicker,
    footer,
    scheme,
    seed,
    showLogo,
    textColor,
    theme,
    title,
    renderScale,
    illustrationSrc,
  ]);

  useEffect(() => {
    const img = new Image();
    img.src = brand.logoSrc;
    img.onload = () => {
      logoRef.current = img;
      draw();
    };
    img.onerror = () => {
      logoRef.current = null;
      draw();
    };
  }, [brand.logoSrc, draw]);

  useEffect(() => {
    if (!illustrationSrc) {
      illustrationRef.current = null;
      return;
    }
    const raw = new Image();
    raw.onload = () => {
      const trimmed = trimWhitespace(raw) ?? illustrationSrc;
      const img = new Image();
      img.onload = () => {
        illustrationRef.current = img;
        draw();
      };
      img.src = trimmed;
    };
    raw.src = illustrationSrc;
  }, [illustrationSrc, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleGenerate = useCallback(async () => {
    const prompt = topic.trim() || title.trim();
    if (!prompt) {
      setGenError("Add a topic (or title) first.");
      return;
    }
    if (!apiKey.trim()) {
      setGenError("Add your Gemini API key first.");
      return;
    }
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-illustration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": apiKey.trim(),
        },
        body: JSON.stringify({
          topic: prompt,
          accentColor: scheme.accent,
          aspectRatio,
          model: genModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || `Request failed (${res.status}).`);
      }
      setIllustrationSrc(data.image as string);
    } catch (error) {
      setGenError((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, [topic, title, scheme.accent, aspectRatio, genModel, apiKey]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const titleSlug = slugify(title) || "hero-image";
    link.download = `${titleSlug}-${brandKey}-${mode}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="rounded-3xl border border-emerald-900/10 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-900/60">
              Hero Preview
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-950/10 bg-emerald-950/5">
              <canvas
                ref={canvasRef}
                className="h-auto w-full"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
              />
            </div>
          </div>

          <div className="w-full max-w-md space-y-6">
            <div>
              <label className="text-sm font-medium text-emerald-950">Background</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(
                  [
                    ["isometric", "Isometric (AI)"],
                    ["pattern", "Abstract pattern"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      mode === key
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-emerald-950/10 bg-white text-emerald-900/70 hover:border-emerald-950/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-emerald-950">Brand</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {Object.entries(BRANDS).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setBrandKey(key as keyof typeof BRANDS);
                      setSchemeIndex(0);
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      brandKey === key
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-emerald-950/10 bg-white text-emerald-900/70 hover:border-emerald-950/30"
                    }`}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "isometric" && (
              <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-4">
                <label className="text-sm font-medium text-emerald-950">
                  Gemini API key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => updateApiKey(event.target.value)}
                  placeholder="AIza…"
                  autoComplete="off"
                  className="w-full rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-emerald-900/60">
                  Stored only in this browser (localStorage) and sent directly
                  with each request — never saved on the server.
                </p>
                <label className="text-sm font-medium text-emerald-950">
                  Illustration topic
                </label>
                <textarea
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  rows={2}
                  placeholder="Defaults to the title. e.g. MCP access control and audit logging"
                  className="w-full resize-none rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={genModel}
                    onChange={(event) => setGenModel(event.target.value)}
                    className="rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="gemini-3-pro-image-preview">Nano Banana Pro</option>
                    <option value="gemini-2.5-flash-image">Nano Banana (Flash)</option>
                  </select>
                  <select
                    value={aspectRatio}
                    onChange={(event) => setAspectRatio(event.target.value)}
                    className="rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {["1:1", "4:3", "3:4", "16:9"].map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating
                      ? "Generating…"
                      : illustrationSrc
                        ? "Regenerate"
                        : "Generate illustration"}
                  </button>
                </div>
                {genError && (
                  <p className="text-xs font-medium text-red-600">{genError}</p>
                )}
                {!illustrationSrc && !genError && (
                  <p className="text-xs text-emerald-900/60">
                    Generates an isometric line illustration with Gemini, then
                    overlays the logo, text and accents.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-emerald-950">Color Scheme</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {brand.schemes.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSchemeIndex(index)}
                    className={`rounded-xl border px-4 py-3 text-left text-xs font-semibold transition ${
                      schemeIndex === index
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-emerald-950/10 bg-white text-emerald-900/70 hover:border-emerald-950/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ background: item.background }}
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ background: item.accent }}
                      />
                      {item.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {mode === "pattern" && (
              <div>
                <label className="text-sm font-medium text-emerald-950">Theme</label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {THEMES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setThemeId(item.id)}
                      className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                        themeId === item.id
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : "border-emerald-950/10 bg-white text-emerald-900/70 hover:border-emerald-950/30"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-emerald-950">Title</label>
              <textarea
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm focus:border-emerald-500 focus:outline-none"
              />
              {mode === "isometric" && (
                <p className="mt-1 text-xs text-emerald-900/60">
                  Text before the first colon is highlighted in the accent color.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-emerald-950">Kicker</label>
                <input
                  value={kicker}
                  onChange={(event) => setKicker(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <input
                  id="show-logo"
                  type="checkbox"
                  checked={showLogo}
                  onChange={(event) => setShowLogo(event.target.checked)}
                  className="h-4 w-4 rounded border-emerald-950/30 text-emerald-600"
                />
                <label htmlFor="show-logo" className="text-sm text-emerald-950">
                  Show logo
                </label>
              </div>
            </div>

            {mode === "isometric" && (
              <div>
                <label className="text-sm font-medium text-emerald-950">
                  Footer / URL
                </label>
                <input
                  value={footer}
                  onChange={(event) => setFooter(event.target.value)}
                  placeholder="e.g. getbifrost.ai"
                  className="mt-2 w-full rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {mode === "pattern" && (
              <div>
                <label className="text-sm font-medium text-emerald-950">Text color</label>
                <div className="mt-2 grid grid-cols-3 gap-3 text-xs font-semibold">
                  {(["auto", "light", "dark"] as const).map((modeOption) => (
                    <button
                      key={modeOption}
                      type="button"
                      onClick={() => setTextColorMode(modeOption)}
                      className={`rounded-xl border px-3 py-2 transition ${
                        textColorMode === modeOption
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : "border-emerald-950/10 bg-white text-emerald-900/70 hover:border-emerald-950/30"
                      }`}
                    >
                      {modeOption === "auto"
                        ? "Auto"
                        : modeOption === "light"
                          ? "Light"
                          : "Dark"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-emerald-950">Quality</label>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs font-semibold">
                {[1, 2, 3].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setRenderScale(scale)}
                    className={`rounded-xl border px-3 py-2 transition ${
                      renderScale === scale
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-emerald-950/10 bg-white text-emerald-900/70 hover:border-emerald-950/30"
                    }`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>
            {brandKey === "bifrost" && (
              <div className="flex items-center gap-2">
                <input
                  id="invert-bifrost-logo"
                  type="checkbox"
                  checked={invertBifrostLogo}
                  onChange={(event) => setInvertBifrostLogo(event.target.checked)}
                  className="h-4 w-4 rounded border-emerald-950/30 text-emerald-600"
                />
                <label htmlFor="invert-bifrost-logo" className="text-sm text-emerald-950">
                  Invert Bifrost logo
                </label>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {mode === "pattern" && (
                <button
                  type="button"
                  onClick={() => setSeed(Date.now())}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  Randomize pattern
                </button>
              )}
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-xl border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

type IsometricOptions = {
  accent: string;
  title: string;
  kicker: string;
  footer: string;
  logo: HTMLImageElement | null;
  illustration: HTMLImageElement | null;
  invertLogo: boolean;
};

function drawIsometricHero(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  { accent, title, kicker, footer, logo, illustration, invertLogo }: IsometricOptions,
) {
  // Clean white background.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Illustration as a large, right-anchored background layer that bleeds off-frame.
  const regionLeft = width * 0.34;
  const regionTop = -height * 0.06;
  const regionWidth = width * 0.7;
  const regionHeight = height * 1.12;
  if (illustration && illustration.complete && illustration.naturalWidth > 0) {
    const scale = Math.max(
      regionWidth / illustration.naturalWidth,
      regionHeight / illustration.naturalHeight,
    );
    const drawWidth = illustration.naturalWidth * scale;
    const drawHeight = illustration.naturalHeight * scale;
    const dx = regionLeft + (regionWidth - drawWidth) / 2;
    const dy = regionTop + (regionHeight - drawHeight) / 2;
    ctx.drawImage(illustration, dx, dy, drawWidth, drawHeight);
  } else {
    drawIllustrationPlaceholder(
      ctx,
      width * 0.46,
      height * 0.3,
      width * 0.46,
      height * 0.4,
      accent,
    );
  }

  // Soft brand-tinted left scrim so the text column stays clean over the artwork.
  const { r, g, b } = hexToRgb(mixHex(accent, "#ffffff", 0.9));
  const scrim = ctx.createLinearGradient(0, 0, width, 0);
  scrim.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  scrim.addColorStop(0.32, `rgba(${r}, ${g}, ${b}, 0.97)`);
  scrim.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.75)`);
  scrim.addColorStop(0.66, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);

  const marginX = 96;

  // Logo, top-left.
  if (logo && logo.complete && logo.naturalWidth > 0) {
    const maxWidth = 300;
    const maxHeight = 76;
    const scale = Math.min(maxWidth / logo.naturalWidth, maxHeight / logo.naturalHeight, 1);
    const logoWidth = logo.naturalWidth * scale;
    const logoHeight = logo.naturalHeight * scale;
    ctx.save();
    if (invertLogo) ctx.filter = "invert(1)";
    ctx.drawImage(logo, marginX, 72, logoWidth, logoHeight);
    ctx.restore();
  }

  // Text block: kicker, two-tone title, footer — left-aligned, vertically centered.
  const textMaxWidth = width * 0.46;
  const titleSize = title.length > 90 ? 74 : title.length > 52 ? 90 : 106;
  const titleLineHeight = titleSize * 1.14;
  const kickerSize = 32;
  const footerSize = 34;

  ctx.textBaseline = "top";
  ctx.font = `700 ${titleSize}px Geist, ui-sans-serif, system-ui`;
  const lines = layoutRichTitle(ctx, title, textMaxWidth);

  const hasKicker = kicker.trim().length > 0;
  const hasFooter = footer.trim().length > 0;
  const kickerGap = 28;
  const footerGap = 40;
  const blockHeight =
    (hasKicker ? kickerSize + kickerGap : 0) +
    lines.length * titleLineHeight +
    (hasFooter ? footerGap + footerSize : 0);
  let cursorY = Math.max(height * 0.22, (height - blockHeight) / 2);

  if (hasKicker) {
    ctx.font = `600 ${kickerSize}px Geist, ui-sans-serif, system-ui`;
    ctx.fillStyle = accent;
    const spaced = kicker.trim().toUpperCase().split("").join("  ");
    ctx.fillText(spaced, marginX, cursorY);
    cursorY += kickerSize + kickerGap;
  }

  ctx.font = `700 ${titleSize}px Geist, ui-sans-serif, system-ui`;
  const spaceWidth = ctx.measureText(" ").width;
  lines.forEach((lineTokens) => {
    let cursorX = marginX;
    lineTokens.forEach((token) => {
      ctx.fillStyle = token.accent ? accent : ISO_DARK;
      ctx.fillText(token.text, cursorX, cursorY);
      cursorX += ctx.measureText(token.text).width + spaceWidth;
    });
    cursorY += titleLineHeight;
  });

  if (hasFooter) {
    const footerY = cursorY - titleLineHeight + titleSize + footerGap;
    ctx.font = `600 ${footerSize}px Geist, ui-sans-serif, system-ui`;
    ctx.fillStyle = mixHex(accent, ISO_DARK, 0.4);
    ctx.fillText(footer.trim(), marginX, footerY);
  }
}

function mixHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(ca.r, cb.r)}${channel(ca.g, cb.g)}${channel(ca.b, cb.b)}`;
}

function drawIllustrationPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
) {
  ctx.save();
  ctx.strokeStyle = withAlpha(accent, 0.4);
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.strokeRect(x + 20, y + 20, w - 40, h - 40);
  ctx.setLineDash([]);
  ctx.fillStyle = withAlpha(accent, 0.7);
  ctx.font = "600 26px Geist, ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Generate an illustration", x + w / 2, y + h / 2);
  ctx.textAlign = "left";
  ctx.restore();
}

type TitleToken = { text: string; accent: boolean };

function layoutRichTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
): TitleToken[][] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  let leadCount = 0;
  for (let i = 0; i < words.length; i += 1) {
    if (words[i].includes(":")) {
      leadCount = i + 1;
      break;
    }
  }

  const spaceWidth = ctx.measureText(" ").width;
  const lines: TitleToken[][] = [];
  let current: TitleToken[] = [];
  let currentWidth = 0;

  words.forEach((word, index) => {
    const token: TitleToken = { text: word, accent: index < leadCount };
    const wordWidth = ctx.measureText(word).width;
    const addedWidth = current.length ? spaceWidth + wordWidth : wordWidth;
    if (current.length && currentWidth + addedWidth > maxWidth) {
      lines.push(current);
      current = [token];
      currentWidth = wordWidth;
    } else {
      current.push(token);
      currentWidth += addedWidth;
    }
  });
  if (current.length) lines.push(current);
  return lines;
}

// Crops the surrounding white margin so the line art fills its target box.
function trimWhitespace(img: HTMLImageElement): string | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let found = false;
  const threshold = 248;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const isWhite =
        data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold;
      const transparent = data[i + 3] < 12;
      if (!isWhite && !transparent) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;
  const pad = Math.round(Math.max(w, h) * 0.03);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  if (cropW < 8 || cropH < 8) return null;

  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  const outCtx = out.getContext("2d");
  if (!outCtx) return null;
  outCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return out.toDataURL("image/png");
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function gradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  start: string,
  end: string,
) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, start);
  grad.addColorStop(1, end);
  return grad;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines: { text: string; x: number; y: number }[] = [];
  const paragraphs = text.split("\n").map((line) => line.trim());
  let currentY = y;

  paragraphs.forEach((paragraph, index) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    words.forEach((word, wordIndex) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push({ text: line, x, y: currentY });
        currentY += lineHeight;
        line = word;
      } else {
        line = testLine;
      }
      if (wordIndex === words.length - 1 && line) {
        lines.push({ text: line, x, y: currentY });
        currentY += lineHeight;
      }
    });
    if (words.length === 0) {
      currentY += lineHeight;
    }
    if (index !== paragraphs.length - 1) {
      currentY += lineHeight * 0.3;
    }
  });

  return lines;
}

function withAlpha(color: string, alpha: number) {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string) {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((value) => value + value)
      .join("");
  }
  const int = parseInt(clean, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function isDark(color: string) {
  const { r, g, b } = hexToRgb(color);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}
