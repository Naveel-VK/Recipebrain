import { NextResponse } from "next/server";
import { embed, generateAnswer } from "@/lib/hf";
import { cosineSim, loadVectors } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const vectors = loadVectors();
    if (vectors.length === 0) {
      return NextResponse.json({ answer: "Upload a recipe PDF first, then ask me 😊" });
    }

    const q = await embed(message);

    const scored = vectors
      .map((v) => ({ v, s: cosineSim(q, v.embedding) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 5);

    const context = scored
      .map((x, i) => `(${i + 1}) [${x.v.source}] ${x.v.text}`)
      .join("\n\n");

    const prompt = `
You are RecipeBrain AI.
Answer ONLY using the CONTEXT below. If the answer isn't in context, say: "I don't have that in the uploaded recipes."

CONTEXT:
${context}

QUESTION:
${message}

Give a clear step-by-step answer.
`.trim();

    let raw = "";
    try {
      raw = await generateAnswer(prompt);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || "HuggingFace inference failed" },
        { status: 500 }
      );
    }

    const answer =
      raw.split("QUESTION:").length > 1 ? raw.split("QUESTION:").pop()! : raw;

    return NextResponse.json({
      answer: answer.trim() || "No answer generated",
      sources: scored.map((x) => x.v.source),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
