import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { vectorStore } from "../../../lib/vectorStore";
import { randomUUID } from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { texts }:{texts:string[]} = await req.json();
    if (!texts?.length) return NextResponse.json({ ok:false, error:"No texts" }, { status: 400 });

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts
    });

    texts.forEach((text, i) => {
      vectorStore.add({
        id: randomUUID(),
        text,
        embedding: emb.data[i].embedding
      });
    });

    return NextResponse.json({ ok:true, count: texts.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || "ingest failed" }, { status: 500 });
  }
}
