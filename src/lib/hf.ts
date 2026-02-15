import { InferenceClient } from "@huggingface/inference";

let client: InferenceClient | null = null;

function hf() {
  if (!process.env.HF_TOKEN) throw new Error("Missing HF_TOKEN");
  if (!client) client = new InferenceClient(process.env.HF_TOKEN);
  return client;
}

// ===============================
// EMBEDDINGS
// ===============================
export async function embed(text: string): Promise<number[]> {

  const model =
    process.env.HF_EMBED_MODEL ||
    "sentence-transformers/all-MiniLM-L6-v2";

  const res: any = await hf().featureExtraction({
    model,
    inputs: text,
  });

  // already pooled vector
  if (Array.isArray(res) && typeof res[0] === "number") {
    return res as number[];
  }

  // mean pool token embeddings
  const tokens = res as number[][];
  const dims = tokens[0].length;
  const mean = new Array(dims).fill(0);

  for (const t of tokens)
    for (let i = 0; i < dims; i++)
      mean[i] += t[i];

  for (let i = 0; i < dims; i++)
    mean[i] /= tokens.length;

  return mean;
}


// ===============================
// CHAT ANSWER (FINAL)
// ===============================
export async function generateAnswer(prompt: string): Promise<string> {

  const model =
    process.env.HF_CHAT_MODEL ||
    "HuggingFaceTB/SmolLM3-3B";

  const out: any = await hf().chatCompletion({

    // 🔥 IMPORTANT → force correct provider
    provider: "hf-inference",

    model,

    messages: [
      {
        role: "system",
        content:
          "You answer ONLY using the provided context. If the answer is not in context, say you don't know."
      },
      {
        role: "user",
        content: prompt
      }
    ],

    max_tokens: 220,
    temperature: 0.4
  });

  return out?.choices?.[0]?.message?.content || "";
}
