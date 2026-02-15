import { NextResponse } from "next/server";
import { embed } from "@/lib/hf";
import { chunkText, loadVectors, saveVectors, ChunkVec } from "@/lib/rag";
import { PdfReader } from "pdfreader";

export const runtime = "nodejs";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ✅ Extract PDF text in Node without DOM/worker
async function extractPdfText(buf: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const lines: Record<number, { y: number; parts: string[] }> = {};
    const reader = new PdfReader();

    reader.parseBuffer(buf, (err: any, item: any) => {
      if (err) return reject(err);

      // end of file
      if (!item) {
        const sorted = Object.values(lines)
          .sort((a, b) => a.y - b.y)
          .map((l) => l.parts.join(" ").trim())
          .filter(Boolean);
        return resolve(sorted.join("\n"));
      }

      // text item
      if (item.text && typeof item.y === "number") {
        // group by line (y) with rounding
        const key = Math.round(item.y * 10);
        if (!lines[key]) lines[key] = { y: item.y, parts: [] };
        lines[key].parts.push(item.text);
      }
    });
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    let text = "";
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      text = await extractPdfText(buf);
    } else {
      text = await file.text();
    }

    // ✅ faster demo indexing
    const chunks = chunkText(text, 1200, 150).slice(0, 20);

    const existing = loadVectors();
    const newItems: ChunkVec[] = [];

    for (const c of chunks) {
      const v = await embed(c);
      newItems.push({
        id: uid(),
        source: file.name,
        text: c,
        embedding: v,
      });
    }

    const merged = [...existing, ...newItems];
    saveVectors(merged);

    return NextResponse.json({
      ok: true,
      file: file.name,
      chunksAdded: newItems.length,
      totalChunks: merged.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Ingest failed" },
      { status: 500 }
    );
  }
}
