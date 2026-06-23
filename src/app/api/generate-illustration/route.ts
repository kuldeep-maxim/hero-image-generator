import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = "gemini-3-pro-image-preview";
const ALLOWED_ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16"] as const;

type GenerateBody = {
  topic?: string;
  accentColor?: string;
  aspectRatio?: string;
  model?: string;
};

function buildPrompt(topic: string, accentColor: string) {
  return [
    `A sprawling isometric technical illustration for a software engineering blog about "${topic}".`,
    `The scene fills the ENTIRE frame edge to edge with LARGE, prominent objects, interconnected elements extending and bleeding off all four edges (no small centered single cluster, no empty margins).`,
    `Style: BOLD, clearly visible dark charcoal/indigo outline strokes (medium-to-thick, confident line weight) with soft FLAT tonal fills in medium tints of ${accentColor} (a mint green) plus light grey and white. Modern flat vector blueprint aesthetic — flat fills only, no heavy shading, no gradients, no drop shadows, no photographic elements.`,
    `Depict interconnected isometric 3D objects that fit the topic — servers, databases, gateways, modules, circuit pathways, gears, locks, shields, data blocks and nodes connected by pipes and lines.`,
    `The illustration must read clearly over a pure white background, so keep outlines dark and fills saturated enough to stay legible.`,
    `IMPORTANT: render on a solid pure WHITE background (#ffffff). Do NOT use a transparent background and do NOT draw any checkerboard or grid pattern — the area behind the objects must be flat solid white.`,
    `Absolutely NO text, NO words, NO labels, NO numbers anywhere in the image.`,
    `Crisp, clean, evenly distributed composition that occupies the whole canvas.`,
  ].join(" ");
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-gemini-key")?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Add your Gemini API key in the panel. It is stored only in your browser.",
      },
      { status: 401 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topic = body.topic?.trim();
  if (!topic) {
    return NextResponse.json(
      { error: "A topic is required to generate an illustration." },
      { status: 400 },
    );
  }

  const accentColor = body.accentColor?.trim() || "#33C19E";
  const aspectRatio = ALLOWED_ASPECT_RATIOS.includes(
    body.aspectRatio as (typeof ALLOWED_ASPECT_RATIOS)[number],
  )
    ? (body.aspectRatio as string)
    : "1:1";
  const model =
    body.model?.trim() || process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const requestBody = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: buildPrompt(topic, accentColor) }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio },
    },
  });

  let upstream: Response;
  const maxAttempts = 3;
  try {
    for (let attempt = 1; ; attempt += 1) {
      upstream = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: requestBody,
      });
      // The image models are frequently overloaded; retry on 503/429.
      if ((upstream.status === 503 || upstream.status === 429) && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        continue;
      }
      break;
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to reach Gemini: ${(error as Error).message}` },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text();
    return NextResponse.json(
      { error: `Gemini request failed (${upstream.status}).`, detail },
      { status: upstream.status },
    );
  }

  const data = (await upstream.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> };
    }>;
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    const textPart = parts.find((part) => part.text)?.text;
    return NextResponse.json(
      {
        error: "Gemini did not return an image.",
        detail: textPart ?? "No image data in response.",
      },
      { status: 502 },
    );
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return NextResponse.json({
    image: `data:${mimeType};base64,${imagePart.inlineData.data}`,
    model,
    aspectRatio,
  });
}
