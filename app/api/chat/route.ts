  import { NextRequest, NextResponse } from "next/server";
  import OpenAI from "openai";
  import { vectorStore } from "../../../lib/vectorStore";

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  export async function POST(req: NextRequest) {
    try {
      const { question }:{question:string} = await req.json();
      if (!question) return NextResponse.json({ error:"No question" }, { status: 400 });

      const qEmb = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question
      });

      const top = vectorStore.topK(qEmb.data[0].embedding, 4);
      const context = top.map(d => `- ${d.text}`).join("\n");

      const prompt = `You are an assistant. Use ONLY the context if relevant.
Context:
${context}

Question: ${question}
Answer concisely:`;

      const chat = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      });

      return NextResponse.json({
        answer: chat.choices[0].message.content,
        sources: top.map(d => ({ id: d.id, preview: d.text.slice(0,120) }))
      });
    } catch (e:any) {
      return NextResponse.json({ error: e.message || "chat failed" }, { status: 500 });
    }
  }
