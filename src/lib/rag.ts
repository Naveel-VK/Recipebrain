import fs from "fs";
import path from "path";

export type ChunkVec = {
  id: string;
  source: string;      // filename
  text: string;        // chunk text
  embedding: number[]; // vector
};

const DATA_PATH = path.join(process.cwd(), "src", "data", "vectors.json");

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify([]));
}

export function loadVectors(): ChunkVec[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

export function saveVectors(v: ChunkVec[]) {
  ensureFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(v, null, 2));
}

export function cosineSim(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

export function chunkText(text: string, size = 700, overlap = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + size, clean.length);
    chunks.push(clean.slice(i, end));
    i += (size - overlap);
  }
  return chunks.filter(c => c.length > 80);
}
