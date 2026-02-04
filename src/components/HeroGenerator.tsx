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
     draw: (ctx, width, height, scheme, rng) => {
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
    draw: (ctx, width, height, scheme, rng) => {
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

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;

 export default function HeroGenerator() {
   const [brandKey, setBrandKey] = useState<keyof typeof BRANDS>("maxim");
   const [schemeIndex, setSchemeIndex] = useState(0);
   const [themeId, setThemeId] = useState(THEMES[0].id);
   const [title, setTitle] = useState(
     "This is a Sample Title: Add your own text here.",
   );
   const [kicker, setKicker] = useState("BLOG");
  const [seed, setSeed] = useState<number>(() => Date.now());
  const [showLogo, setShowLogo] = useState(true);
  const [invertBifrostLogo, setInvertBifrostLogo] = useState(false);
  const [textColorMode, setTextColorMode] = useState<"auto" | "light" | "dark">(
    "auto",
  );
  const [renderScale, setRenderScale] = useState(2);

   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const logoRef = useRef<HTMLImageElement | null>(null);

   const brand = BRANDS[brandKey];
   const scheme = brand.schemes[schemeIndex] ?? brand.schemes[0];
   const theme = useMemo(
     () => THEMES.find((item) => item.id === themeId) ?? THEMES[0],
     [themeId],
   );

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

     const pixelRatio = Math.max(1, Math.min(renderScale, 4));
     canvas.width = CANVAS_WIDTH * pixelRatio;
     canvas.height = CANVAS_HEIGHT * pixelRatio;
     ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
     const rng = mulberry32(seed);

     theme.draw(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, scheme, rng);

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
         CANVAS_WIDTH - logoWidth - padding,
         CANVAS_HEIGHT - logoHeight - padding,
         logoWidth,
         logoHeight,
       );
       ctx.restore();
     }
   }, [
     brandKey,
     invertBifrostLogo,
     kicker,
     scheme,
     seed,
     showLogo,
     textColor,
     theme,
     title,
     renderScale,
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
     draw();
   }, [draw]);

  const handleDownload = () => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     const link = document.createElement("a");
    const titleSlug = slugify(title) || "hero-image";
    link.download = `${titleSlug}-${brandKey}-${themeId}.png`;
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

             <div>
               <label className="text-sm font-medium text-emerald-950">Title</label>
               <textarea
                 value={title}
                 onChange={(event) => setTitle(event.target.value)}
                 rows={4}
                 className="mt-2 w-full resize-none rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm focus:border-emerald-500 focus:outline-none"
               />
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
            <div>
              <label className="text-sm font-medium text-emerald-950">Text color</label>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs font-semibold">
                {(["auto", "light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTextColorMode(mode)}
                    className={`rounded-xl border px-3 py-2 transition ${
                      textColorMode === mode
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-emerald-950/10 bg-white text-emerald-900/70 hover:border-emerald-950/30"
                    }`}
                  >
                    {mode === "auto" ? "Auto" : mode === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>

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
               <button
                 type="button"
                 onClick={() => setSeed(Date.now())}
                 className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
               >
                 Randomize pattern
               </button>
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
