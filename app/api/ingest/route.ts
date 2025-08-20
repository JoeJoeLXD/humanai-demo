// app/api/ingest/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { vectorStore } from "../../../lib/vectorStore";
import { randomUUID } from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// tweak as you like
const MAX_LINES_PER_REQ = Number(process.env.MAX_LINES_PER_REQ ?? 500);
const EMBED_BATCH_SIZE   = Number(process.env.EMBED_BATCH_SIZE   ?? 128);

function normalizeToLines(payload: unknown): string[] {
  // allow: { texts: "a\nb\nc" } OR { texts: ["a", "b", "c"] }
  if (typeof payload === "string") {
    return payload.split(/\r?\n/).map(s => s.trim());
  }
  if (Array.isArray(payload)) {
    return payload.map(v => (typeof v === "string" ? v.trim() : "") );
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = normalizeToLines(body?.texts);

    // filter blanks
    const nonEmpty = raw.filter(Boolean);

    if (nonEmpty.length === 0) {
      return NextResponse.json({ ok: false, error: "No texts" }, { status: 400 });
    }

    // de-duplicate by text value
    const unique = Array.from(new Set(nonEmpty));

    if (unique.length > MAX_LINES_PER_REQ) {
      return NextResponse.json(
        { ok: false, error: `Too many lines. Max ${MAX_LINES_PER_REQ}.` },
        { status: 400 }
      );
    }

    // embed in batches
    const addedIds: string[] = [];
    let processed = 0;

    for (let i = 0; i < unique.length; i += EMBED_BATCH_SIZE) {
      const batch = unique.slice(i, i + EMBED_BATCH_SIZE);

      const emb = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
      });

      emb.data.forEach((row, j) => {
        const text = batch[j];
        const id = randomUUID();
        vectorStore.add({ id, text, embedding: row.embedding });
        addedIds.push(id);
      });

      processed += batch.length;
    }

    return NextResponse.json({
      ok: true,
      count_ingested: processed,
      duplicates_skipped: nonEmpty.length - unique.length,
      ids: addedIds,
      // optional: expose current store size if you add a size() method
      // store_size: vectorStore.size?.(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ingest failed" },
      { status: 500 }
    );
  }
}

