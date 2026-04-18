import { NextResponse } from "next/server";
import { parseFeedXml } from "@/lib/news/parseFeedXml";

export const revalidate = 3600;

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
};

const MAX_NEWS_ITEMS = 5;

const RSS_FEEDS: { url: string; source: string }[] = [
  { url: "https://www.jiqizhixin.com/rss", source: "机器之心" },
  { url: "https://www.qbitai.com/feed", source: "量子位" },
];

async function fetchWithTimeout(
  url: string,
  ms: number,
): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "JobDashboard/1.0 (+local)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const fetchedAt = new Date().toISOString();
  const all: NewsItem[] = [];
  const errors: string[] = [];

  for (const { url, source } of RSS_FEEDS) {
    const res = await fetchWithTimeout(url, 8000);
    if (!res || !res.ok) {
      errors.push(`${source}: 请求失败`);
      continue;
    }
    try {
      const xml = await res.text();
      const items = parseFeedXml(xml);
      for (const it of items) {
        const id = `${source}:${it.url}:${it.publishedAt ?? ""}`.slice(0, 240);
        all.push({
          id,
          title: it.title,
          url: it.url,
          source,
          publishedAt: it.publishedAt,
        });
      }
    } catch {
      errors.push(`${source}: 解析失败`);
    }
  }

  const sorted = all
    .filter((x) => x.url.startsWith("http"))
    .sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    });

  const seen = new Set<string>();
  const unique: NewsItem[] = [];
  for (const item of sorted) {
    const key = item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= MAX_NEWS_ITEMS) break;
  }

  return NextResponse.json(
    {
      fetchedAt,
      items: unique,
      partial: errors.length > 0 && unique.length > 0,
      errors: errors.length ? errors : undefined,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
