import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
// your relative import is fine; keep it if "@/..." alias is troublesome
import { vectorStore } from "../../../lib/vectorStore";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const { question }: { question: string } = await req.json();
    if (!question) return NextResponse.json({ error: "No question" }, { status: 400 });

    // 1) Embed query
    const qEmb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    // 2) Retrieve context
    const top = vectorStore.topK(qEmb.data[0].embedding, 4);
    const context = top.map((d) => `- ${d.text}`).join("\n");

    // 3) Ask model (valid model name)
    const prompt = `You must answer ONLY using the Context below.
If the Context doesn't contain the answer, reply exactly: "Not in context."

Context:
${context || "(empty)"}

Question: ${question}
Answer:`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    return NextResponse.json({
      answer: chat.choices[0].message.content,
      sources: top.map((d) => ({ id: d.id, preview: d.text.slice(0, 120) })),
    });
  } catch (e: any) {
    console.error("CHAT ROUTE ERROR:", e?.response?.data || e?.message || e);
    return NextResponse.json({ error: e.message || "chat failed" }, { status: 500 });
  }
}

