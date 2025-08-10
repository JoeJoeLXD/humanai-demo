"use client";
import { useState } from "react";

export default function Home() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [ingText, setIngText] = useState("");
  const [loading, setLoading] = useState(false);

  const ingest = async () => {
    if (!ingText.trim()) return;
    await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ texts: ingText.split("\n").filter(Boolean) })
    });
    setIngText("");
    alert("Docs ingested");
  };

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setA(null);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ question: q })
    });
    const data = await res.json();
    setA(data.answer);
    setLoading(false);
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">HumanAI Demo (RAG)</h1>
        <p className="text-gray-600">Ingest a few lines of text, then ask a question. The answer is grounded in your context.</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-medium">Ingest</h2>
        <textarea
          placeholder="Paste a few lines… each line is a document"
          value={ingText}
          onChange={e => setIngText(e.target.value)}
          rows={5}
          className="w-full p-3 border rounded-md focus:outline-none"
        />
        <button onClick={ingest} className="px-3 py-2 rounded-md border hover:bg-gray-100">Ingest</button>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Ask</h2>
        <div className="flex gap-2">
          <input
            placeholder="Ask a question…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="flex-1 p-3 border rounded-md focus:outline-none"
          />
          <button onClick={ask} className="px-3 py-2 rounded-md border hover:bg-gray-100">Ask</button>
        </div>
        {loading && <div className="text-sm text-gray-500">Thinking…</div>}
        {a && (
          <div className="p-3 border rounded-md">
            <div className="font-medium">Answer</div>
            <div className="mt-1 whitespace-pre-wrap">{a}</div>
          </div>
        )}
      </section>
    </main>
  );
}
