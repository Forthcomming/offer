"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { parseEmail } from "@/lib/email/parseEmail";
import { APPLICATION_PREFILL_SESSION_KEY } from "@/lib/email/prefill";
import type {
  Application,
  EmailDraft,
  EmailHub,
  EmailParseKind,
  EmailParseSuggestion,
  InboxMessage,
} from "@/lib/types";
import { STAGES } from "@/lib/types";
import {
  imapHostForPreset,
  loadApplications,
  loadEmailDrafts,
  loadEmailHub,
  saveApplications,
  saveEmailDrafts,
  saveEmailHub,
} from "@/lib/storage";

const KIND_LABEL: Record<EmailParseKind, string> = {
  interview_invite: "面试邀请",
  written_test: "笔试/测评",
  rejection: "拒信/未通过",
  ack: "投递确认",
  offer_letter: "录用/Offer",
  unknown: "待确认",
};

const ACTION_LABEL: Record<EmailDraft["actionType"], string> = {
  followup_status_check: "进度跟进",
  followup_written_result: "测评结果跟进",
  followup_interview_next_step: "面试后续跟进",
};

function buildDemoMessages(): InboxMessage[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      subject: "【云帆智能】面试邀请",
      from: "recruit@demo-mail.local",
      receivedAt: now,
      source: "demo",
      bodyText:
        "您好，感谢投递云帆智能-后端开发岗位。邀请您于本周四15:00 参加视频面试，会议链接将稍后发送。",
    },
    {
      id: crypto.randomUUID(),
      subject: "在线测评通知",
      from: "hr@demo-mail.local",
      receivedAt: now,
      source: "demo",
      bodyText:
        "请在48 小时内完成在线测评，链接如下（演示数据）。测评结果将作为笔试环节参考。",
    },
    {
      id: crypto.randomUUID(),
      subject: "应聘进度提醒",
      from: "noreply@demo-mail.local",
      receivedAt: now,
      source: "demo",
      bodyText:
        "非常感谢您对灵犀科技的关注，很遗憾您未能通过本次筛选，祝您求职顺利。",
    },
  ];
}

function suggestionFromParse(
  messageId: string,
  parsed: ReturnType<typeof parseEmail>,
): EmailParseSuggestion {
  return {
    id: crypto.randomUUID(),
    messageId,
    kind: parsed.kind,
    suggestedStage: parsed.suggestedStage,
    companyGuess: parsed.companyGuess,
    confidence: parsed.confidence,
    evidence: parsed.evidence,
    createdAt: new Date().toISOString(),
    appliedAt: null,
  };
}

export function EmailCenterClient() {
  const router = useRouter();
  const [hub, setHub] = useState<EmailHub>(() => loadEmailHub());
  const [hydrated, setHydrated] = useState(false);
  const [apps, setApps] = useState<Application[]>([]);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [pasteSubject, setPasteSubject] = useState("");
  const [applyForId, setApplyForId] = useState<Record<string, string>>({});

  useEffect(() => {
    setHub(loadEmailHub());
    setApps(loadApplications());
    setDrafts(loadEmailDrafts());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveEmailHub(hub);
  }, [hub, hydrated]);

  useEffect(() => {
    const onFocus = () => setApps(loadApplications());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const pendingSuggestions = useMemo(
    () => hub.suggestions.filter((s) => !s.appliedAt),
    [hub.suggestions],
  );

  const stageLabel = (id: EmailParseSuggestion["suggestedStage"]) =>
    STAGES.find((s) => s.id === id)?.label ?? id;

  const updateSettings = (patch: Partial<EmailHub["settings"]>) => {
    setHub((h) => ({
      ...h,
      settings: {
        ...h.settings,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const onProviderChange = (preset: EmailHub["settings"]["providerPreset"]) => {
    setHub((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        providerPreset: preset,
        imapHost:
          preset === "custom"
            ? prev.settings.imapHost
            : imapHostForPreset(preset),
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const syncDemo = () => {
    const incoming = buildDemoMessages();
    setHub((prev) => {
      const messages = [...incoming, ...prev.messages];
      const newSugs = incoming.map((m) =>
        suggestionFromParse(m.id, parseEmail({ subject: m.subject, bodyText: m.bodyText })),
      );
      const suggestionIds = new Set(newSugs.map((s) => s.messageId));
      const rest = prev.suggestions.filter((s) => !suggestionIds.has(s.messageId));
      return {
        ...prev,
        messages,
        suggestions: [...newSugs, ...rest],
      };
    });
  };

  const parsePasted = () => {
    const body = pasteText.trim();
    if (!body) {
      window.alert("请粘贴邮件正文");
      return;
    }
    const subject = pasteSubject.trim() || "（无主题）";
    const msg: InboxMessage = {
      id: crypto.randomUUID(),
      subject,
      from: "（粘贴）",
      receivedAt: new Date().toISOString(),
      bodyText: body,
      source: "paste",
    };
    const parsed = parseEmail({ subject, bodyText: body });
    const sug = suggestionFromParse(msg.id, parsed);
    setHub((prev) => ({
      ...prev,
      messages: [msg, ...prev.messages],
      suggestions: [
        sug,
        ...prev.suggestions.filter((s) => s.messageId !== msg.id),
      ],
    }));
    setPasteText("");
    setPasteSubject("");
  };

  const parseOneMessage = (m: InboxMessage) => {
    const parsed = parseEmail({ subject: m.subject, bodyText: m.bodyText });
    const sug = suggestionFromParse(m.id, parsed);
    setHub((prev) => ({
      ...prev,
      suggestions: [
        sug,
        ...prev.suggestions.filter((s) => s.messageId !== m.id),
      ],
    }));
  };

  const applyToApplication = (s: EmailParseSuggestion) => {
    const appId = applyForId[s.id];
    if (!appId) {
      window.alert("请先选择要更新的申请");
      return;
    }
    const list = loadApplications();
    const line = `\n[邮箱解析 ${new Date().toLocaleString("zh-CN")}] ${s.evidence}`;
    const next = list.map((a) =>
      a.id === appId
        ? {
            ...a,
            stage: s.suggestedStage,
            notes: `${a.notes}${line}`.trim(),
            updatedAt: new Date().toISOString(),
          }
        : a,
    );
    saveApplications(next);
    setApps(next);
    setHub((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((x) =>
        x.id === s.id ? { ...x, appliedAt: new Date().toISOString() } : x,
      ),
    }));
  };

  const createFromSuggestion = (s: EmailParseSuggestion) => {
    const prefill: Partial<Application> = {
      company: s.companyGuess ?? "",
      position: "",
      channel: "邮箱",
      stage: s.suggestedStage,
      notes: `[邮箱解析] ${s.evidence}`,
    };
    sessionStorage.setItem(APPLICATION_PREFILL_SESSION_KEY, JSON.stringify(prefill));
    setHub((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((x) =>
        x.id === s.id ? { ...x, appliedAt: new Date().toISOString() } : x,
      ),
    }));
    router.push("/");
  };

  const updateDraft = (
    id: string,
    patch: Partial<Pick<EmailDraft, "toEmail" | "subject" | "body" | "status" | "sentAt">>,
  ) => {
    setDrafts((prev) => {
      const next = prev.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
      );
      saveEmailDrafts(next);
      return next;
    });
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveEmailDrafts(next);
      return next;
    });
  };

  const sendDraft = (d: EmailDraft) => {
    const to = d.toEmail.trim();
    const subject = d.subject.trim();
    const body = d.body.trim();
    if (!to) {
      window.alert("请先填写收件人邮箱");
      return;
    }
    if (!subject || !body) {
      window.alert("请先完善邮件主题和正文");
      return;
    }
    const href =
      `mailto:${encodeURIComponent(to)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    updateDraft(d.id, {
      status: "sent",
      sentAt: new Date().toISOString(),
    });
  };

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-white/25 bg-[var(--glass-bg)] shadow-[var(--glass-shadow)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Email Center
            </p>
            <h1 className="text-xl font-semibold text-slate-900">邮箱中心</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-medium text-slate-800 shadow-md transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          >
            返回看板
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] space-y-6 px-4 py-6 sm:px-6">
        <GlassCard className="border-amber-300/40 bg-amber-400/15 p-4 text-sm text-amber-950 shadow-lg">
          <strong className="font-semibold">演示说明：</strong>
          当前未连接真实邮箱 IMAP/API。可使用「同步演示邮件」或「粘贴邮件」体验解析与应用到看板流程；连接真实邮箱需后续服务端接入。
        </GlassCard>

        <GlassCard className="border-white/30 p-5 shadow-lg">
          <h2 className="text-base font-semibold text-slate-900">连接配置（展示）</h2>
          <p className="mt-1 text-xs text-slate-600">
            不保存密码。IMAP 主机可随预设自动填充，「自定义」需手动填写。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">邮箱类型</span>
              <select
                value={hub.settings.providerPreset}
                onChange={(e) =>
                  onProviderChange(e.target.value as EmailHub["settings"]["providerPreset"])
                }
                className="glass-select mt-1 w-full"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook / Microsoft 365</option>
                <option value="qq">QQ 邮箱</option>
                <option value="custom">自定义 IMAP</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">IMAP 主机</span>
              <input
                value={hub.settings.imapHost}
                onChange={(e) =>
                  updateSettings({
                    imapHost: e.target.value,
                    providerPreset: "custom",
                  })
                }
                className="glass-field mt-1 w-full"
                placeholder="imap.example.com"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">邮箱账号（展示）</span>
              <input
                value={hub.settings.emailDisplay}
                onChange={(e) => updateSettings({ emailDisplay: e.target.value })}
                className="glass-field mt-1 w-full"
                placeholder="you@example.com"
              />
            </label>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            密码 / OAuth 令牌：接入 API 后启用（当前为占位）。
          </p>
        </GlassCard>

        <GlassCard className="border-white/30 p-5 shadow-lg">
          <h2 className="text-base font-semibold text-slate-900">跟进邮件草稿</h2>
          <p className="mt-1 text-xs text-slate-600">
            来自看板「一键生成草稿」。可在此继续编辑与整理。
          </p>
          {drafts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">暂无草稿。</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {drafts.map((d) => (
                <li key={d.id}>
                  <GlassCard className="border-emerald-200/40 bg-emerald-400/10 p-4 shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {d.company} · {d.position}
                        </p>
                        <p className="text-xs text-slate-600">
                          {ACTION_LABEL[d.actionType]} ·{" "}
                          {new Date(d.createdAt).toLocaleString("zh-CN")}
                        </p>
                        <p className="text-xs text-slate-600">
                          状态：{d.status === "sent" ? "已发起发送" : "草稿"}
                          {d.sentAt
                            ? ` · ${new Date(d.sentAt).toLocaleString("zh-CN")}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <GlassButton
                          type="button"
                          variant="primary"
                          className="!py-1.5 !text-xs"
                          onClick={() => sendDraft(d)}
                        >
                          发送
                        </GlassButton>
                        <GlassButton
                          type="button"
                          variant="secondary"
                          className="!py-1.5 !text-xs"
                          onClick={() => removeDraft(d.id)}
                        >
                          删除
                        </GlassButton>
                      </div>
                    </div>
                    <label className="mt-3 block">
                      <span className="text-xs text-slate-600">收件人邮箱</span>
                      <input
                        type="email"
                        value={d.toEmail}
                        onChange={(e) => updateDraft(d.id, { toEmail: e.target.value })}
                        className="glass-field mt-1 w-full"
                        placeholder="hr@example.com"
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="text-xs text-slate-600">主题</span>
                      <input
                        value={d.subject}
                        onChange={(e) => updateDraft(d.id, { subject: e.target.value })}
                        className="glass-field mt-1 w-full"
                      />
                    </label>
                    <label className="mt-2 block">
                      <span className="text-xs text-slate-600">正文</span>
                      <textarea
                        rows={5}
                        value={d.body}
                        onChange={(e) => updateDraft(d.id, { body: e.target.value })}
                        className="glass-field mt-1 w-full resize-y"
                      />
                    </label>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="border-white/30 p-5 shadow-lg">
          <h2 className="text-base font-semibold text-slate-900">同步与收件</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <GlassButton type="button" variant="primary" onClick={syncDemo}>
              同步演示邮件
            </GlassButton>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            将追加 3 条演示邮件并自动生成解析建议。
          </p>

          <div className="mt-6 border-t border-white/20 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">粘贴邮件解析</h3>
            <label className="mt-2 block">
              <span className="text-xs text-slate-600">主题（可选）</span>
              <input
                value={pasteSubject}
                onChange={(e) => setPasteSubject(e.target.value)}
                className="glass-field mt-1 w-full"
                placeholder="邮件主题"
              />
            </label>
            <label className="mt-2 block">
              <span className="text-xs text-slate-600">正文</span>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                className="glass-field mt-1 w-full resize-y"
                placeholder="粘贴完整邮件文本…"
              />
            </label>
            <GlassButton
              type="button"
              variant="secondary"
              className="mt-2"
              onClick={parsePasted}
            >
              解析并生成建议
            </GlassButton>
          </div>

          <div className="mt-6 border-t border-white/20 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">收件列表</h3>
            {hub.messages.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">暂无邮件，请先同步演示或粘贴。</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {hub.messages.map((m) => (
                  <li key={m.id}>
                    <GlassCard className="border-white/25 bg-white/15 p-3 text-sm shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{m.subject}</p>
                          <p className="text-xs text-slate-600">
                            {m.from} · {new Date(m.receivedAt).toLocaleString("zh-CN")} ·{" "}
                            {m.source === "demo" ? "演示" : "粘贴"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                            {m.bodyText}
                          </p>
                        </div>
                        <GlassButton
                          type="button"
                          variant="secondary"
                          className="shrink-0 !py-1 !text-xs"
                          onClick={() => parseOneMessage(m)}
                        >
                          重新解析
                        </GlassButton>
                      </div>
                    </GlassCard>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>

        <GlassCard className="border-white/30 p-5 shadow-lg">
          <h2 className="text-base font-semibold text-slate-900">待确认解析建议</h2>
          {pendingSuggestions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">暂无待处理建议。</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {pendingSuggestions.map((s) => (
                <li key={s.id}>
                  <GlassCard className="border-indigo-200/40 bg-indigo-400/10 p-4 shadow-md">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {KIND_LABEL[s.kind]}
                      </span>
                      <span className="text-xs text-slate-600">
                        建议阶段：{stageLabel(s.suggestedStage)} · 置信度：
                        {s.confidence === "medium" ? "中" : "低"}
                      </span>
                    </div>
                    {s.companyGuess ? (
                      <p className="mt-1 text-sm text-slate-800">
                        推测公司：{s.companyGuess}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-600">{s.evidence}</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                      <label className="block flex-1 min-w-[200px]">
                        <span className="text-xs text-slate-600">应用到已有申请</span>
                        <select
                          value={applyForId[s.id] ?? ""}
                          onChange={(e) =>
                            setApplyForId((prev) => ({
                              ...prev,
                              [s.id]: e.target.value,
                            }))
                          }
                          className="glass-select mt-1 w-full"
                        >
                          <option value="">选择申请…</option>
                          {apps.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.company} · {a.position}
                            </option>
                          ))}
                        </select>
                      </label>
                      <GlassButton
                        type="button"
                        variant="primary"
                        onClick={() => applyToApplication(s)}
                      >
                        应用更新
                      </GlassButton>
                      <GlassButton
                        type="button"
                        variant="secondary"
                        onClick={() => createFromSuggestion(s)}
                      >
                        新建申请草稿
                      </GlassButton>
                    </div>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
