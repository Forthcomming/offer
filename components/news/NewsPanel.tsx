"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatTodayYmd } from "@/lib/date";

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
};

type ApiPayload = {
  fetchedAt: string;
  items: NewsItem[];
  partial?: boolean;
  errors?: string[];
};

export function NewsPanel() {
  const [today] = useState(() => formatTodayYmd());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ApiPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ApiPayload;
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "加载失败");
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-[1600px] px-4 pb-6 sm:px-6">
      <GlassCard className="border-white/30 p-5 shadow-lg">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">每日 AI 资讯</h2>
          <span className="text-xs text-slate-600">
            今日 {today} · 中文信源 · RSS 聚合
          </span>
        </div>
        {payload?.partial && payload.errors?.length ? (
          <p className="mt-2 text-xs text-amber-900/90">
            部分来源未加载：{payload.errors.join("；")}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">正在拉取资讯…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-rose-800">
            无法加载资讯：{error}。请检查网络或稍后重试。
          </p>
        ) : !payload?.items.length ? (
          <p className="mt-4 text-sm text-slate-600">
            暂无条目（可能所有 RSS 源暂时不可用）。
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/20">
            {payload.items.map((item) => (
              <li key={item.id} className="py-3 first:pt-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  <span className="text-sm font-medium text-indigo-950 group-hover:underline">
                    {item.title}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-600">
                    <span>{item.source}</span>
                    {item.publishedAt ? (
                      <span>{item.publishedAt}</span>
                    ) : null}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </section>
  );
}
