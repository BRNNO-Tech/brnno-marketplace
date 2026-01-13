import { NextResponse } from "next/server";

function parseCarQuery(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("?(")) {
    const json = trimmed.replace(/^\?\(/, "").replace(/\);\s*$/, "");
    return JSON.parse(json);
  }
  return JSON.parse(trimmed);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const make = searchParams.get("make");

  if (!year || !make) return NextResponse.json({ models: [] });

  const url = `https://www.carqueryapi.com/api/0.3/?cmd=getModels&make=${encodeURIComponent(
    make
  )}&year=${encodeURIComponent(year)}&sold_in_us=1`;

  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  const data = parseCarQuery(text);

  const models: string[] = Array.isArray(data?.Models)
    ? data.Models.map((m: any) => m?.model_name).filter(Boolean).sort()
    : [];

  return NextResponse.json({ models });
}