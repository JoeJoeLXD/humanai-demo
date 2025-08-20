// app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { vectorStore } from "../../../lib/vectorStore";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// tune these
const TOP_K = Number(process.env.RAG_TOP_K ?? 4);
// require a reasonably good match; 0.82–0.88 works well for short facts
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE ?? 0.82);
// set STRICT_RAG=true to force "Not in context." instead of fallback
const STRICT_RAG = process.env.STRICT_RAG === "true";

export async function POST(req: NextRequest) {
  try {
    const { question }: { question: string } = await req.json();
    if (!question?.trim()) return NextResponse.json({ error: "No question" }, { status: 400 });

    // 1) embed query
    const qEmb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    const queryEmbedding = qEmb.data[0].embedding;

    // 2) retrieve (hybrid scoring)
    const ranked = vectorStore.topKWithScores(queryEmbedding, question, TOP_K);
    const strong = ranked.filter(r => r.score >= MIN_SCORE);

    // 3a) strong context → grounded answer
    if (strong.length > 0) {
      const context = strong.map(r => `- ${r.doc.text}`).join("\n");
      const prompt = `Answer the question ONLY using the Context.
If the Context doesn't contain the answer, reply exactly: "Not in context."

Context:
${context}

Question: ${question}
Answer:`;

      const chat = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.0,
      });

      return NextResponse.json({
        answer: chat.choices[0].message.content,
        usedContext: true,
        hits: strong.map(({ doc, score, cos, lex }) => ({
          id: doc.id, score: +score.toFixed(3), cos: +cos.toFixed(3), lex: +lex.toFixed(3),
          preview: doc.text.slice(0, 120)
        })),
      });
    }

    // 3b) no strong match → fallback or strict RAG
    if (STRICT_RAG) {
      return NextResponse.json({ answer: "Not in context.", usedContext: false, hits: ranked });
    }

    // general LLM fallback
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: question }],
      temperature: 0.2,
    });

    return NextResponse.json({
      answer: chat.choices[0].message.content,
      usedContext: false,
      hits: ranked.map(({ doc, score, cos, lex }) => ({
        id: doc.id, score: +score.toFixed(3), cos: +cos.toFixed(3), lex: +lex.toFixed(3),
        preview: doc.text.slice(0, 120)
      })),
    });
  } catch (e: any) {
    console.error("CHAT ERROR", e?.response?.data || e);
    return NextResponse.json({ error: e?.message || "chat failed" }, { status: 500 });
  }
}


