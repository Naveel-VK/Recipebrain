"use client";
import { useState } from "react";

export default function Page() {

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  async function upload() {
    if (!file) return;

    setStatus("Uploading + indexing...");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/ingest", { method: "POST", body: fd });
      const text = await res.text();

      if (!text) {
        setStatus("Server returned empty response (check terminal).");
        return;
      }

      const data = JSON.parse(text);

      setStatus(
        res.ok && data.ok
          ? `Indexed ${data.file} ✅ (chunks: ${data.chunksAdded})`
          : `Error: ${data.error || "Upload failed"}`
      );
    } catch (e: any) {
      setStatus(`Error: ${e?.message || "Upload failed"}`);
    }
  }

  async function ask() {

    setA("Thinking...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });

      const text = await res.text();

      if (!text) {
        setA("Server returned empty response (check terminal).");
        return;
      }

      const data = JSON.parse(text);

      if (!res.ok) {
        setA(`Error: ${data.error || "Chat failed"}`);
        return;
      }

      setA(data.answer || "No answer");

    } catch (e: any) {
      setA(`Chat error: ${e?.message || "Unknown error"}`);
    }
  }

  return (

    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(120deg,#fff8f0,#f0f7ff)",
      padding: "40px 20px",
      fontFamily: "system-ui"
    }}>

      <div style={{ maxWidth: 820, margin: "auto" }}>

        {/* HEADER */}
        <div style={{
          background: "white",
          padding: 24,
          borderRadius: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          marginBottom: 22
        }}>
          <h1 style={{ margin: 0, fontSize: 34 }}>
            🍳 RecipeBrain AI
          </h1>
          <p style={{ marginTop: 8, opacity: .7 }}>
            Upload recipes 
          </p>
        </div>

        {/* UPLOAD CARD */}
        <div style={{
          background: "white",
          padding: 22,
          borderRadius: 18,
          boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
          marginBottom: 22
        }}>

          <h3 style={{ marginTop: 0 }}>📂 Upload recipes</h3>

          <input
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={upload}
            style={{
              marginLeft: 12,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "#ff7a18",
              color: "white",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Index File
          </button>

          <div style={{ marginTop: 12, opacity: .8 }}>{status}</div>

        </div>

        {/* ASK CARD */}
        <div style={{
          background: "white",
          padding: 22,
          borderRadius: 18,
          boxShadow: "0 8px 25px rgba(0,0,0,0.06)"
        }}>

          <h3 style={{ marginTop: 0 }}>🤖 Ask RecipeBrain</h3>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Example: "How to cook chicken curry with less oil?"'
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ddd",
              fontSize: 16
            }}
          />

          <button
            onClick={ask}
            style={{
              marginTop: 14,
              padding: "12px 22px",
              borderRadius: 12,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Ask AI
          </button>

          <div style={{
            whiteSpace: "pre-wrap",
            marginTop: 18,
            background: "#fafafa",
            padding: 16,
            borderRadius: 14,
            border: "1px solid #eee",
            minHeight: 80
          }}>
            {a}
          </div>

        </div>

      </div>
    </div>
  );
}
