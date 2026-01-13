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
  if (!year) return NextResponse.json({ makes: [] });

  const url = `https://www.carqueryapi.com/api/0.3/?cmd=getMakes&year=${encodeURIComponent(
    year
  )}&sold_in_us=1`;

  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  const data = parseCarQuery(text);

  const makes: string[] = Array.isArray(data?.Makes)
    ? data.Makes.map((m: any) => m?.make_display).filter(Boolean).sort()
    : [];

  return NextResponse.json({ makes: Array.from(new Set(makes)) });
}