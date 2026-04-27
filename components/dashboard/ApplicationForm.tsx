"use client";

import { useEffect, useState } from "react";
import type { Application, Channel, ResumeVersion, Stage } from "@/lib/types";
import { CHANNELS, STAGES } from "@/lib/types";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";

type ApplicationFormProps = {
  open: boolean;
  application: Application | null;
  /** 新建时合并到默认草稿（如从邮箱中心带入） */
  createPrefill?: Partial<Application> | null;
  materials: ResumeVersion[];
  onClose: () => void;
  onSave: (app: Application) => void;
  onDelete?: (id: string) => void;
};

function newDraft(): Application {
  return {
    id: "",
    company: "",
    position: "",
    channel: "官网",
    stage: "todo",
    deadline: null,
    followUpDate: null,
    writtenAt: null,
    assessmentAt: null,
    interviewAt: null,
    notes: "",
    jobUrl: null,
    resumeVersionId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function ApplicationForm({
  open,
  application,
  createPrefill,
  materials,
  onClose,
  onSave,
  onDelete,
}: ApplicationFormProps) {
  const [draft, setDraft] = useState<Application>(newDraft());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (application) {
      setDraft({
        ...application,
        resumeVersionId: application.resumeVersionId ?? null,
      });
    } else {
      const base = newDraft();
      setDraft(
        createPrefill
          ? {
              ...base,
              ...createPrefill,
              resumeVersionId:
                createPrefill.resumeVersionId ?? base.resumeVersionId,
            }
          : base,
      );
    }
  }, [open, application, createPrefill]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.company.trim() || !draft.position.trim()) {
      setError("请填写公司与岗位");
      return;
    }
    const now = new Date().toISOString();
    const resumeOk =
      draft.resumeVersionId &&
      materials.some((m) => m.id === draft.resumeVersionId)
        ? draft.resumeVersionId
        : null;
    const saved: Application = {
      ...draft,
      id: application?.id ?? crypto.randomUUID(),
      company: draft.company.trim(),
      position: draft.position.trim(),
      notes: draft.notes.trim(),
      jobUrl: draft.jobUrl?.trim() ? draft.jobUrl.trim() : null,
      deadline: draft.deadline || null,
      followUpDate: draft.followUpDate || null,
      writtenAt: draft.writtenAt?.trim() ? draft.writtenAt.trim() : null,
      assessmentAt: draft.assessmentAt?.trim() ? draft.assessmentAt.trim() : null,
      interviewAt: draft.interviewAt?.trim() ? draft.interviewAt.trim() : null,
      resumeVersionId: resumeOk,
      updatedAt: now,
    };
    onSave(saved);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassCard
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-white/35 sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-form-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/20 px-5 py-4">
          <div>
            <h2
              id="application-form-title"
              className="text-lg font-semibold text-slate-900"
            >
              {application ? "编辑申请" : "新建申请"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              信息仅保存在本机浏览器
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-white/25 hover:text-slate-900"
            aria-label="关闭"
          >
            <span aria-hidden className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>
        <form
          onSubmit={submit}
          className="flex flex-1 flex-col overflow-y-auto px-5 py-4"
        >
          {error ? (
            <p className="mb-3 rounded-xl border border-rose-300/45 bg-rose-400/15 px-3 py-2 text-sm text-rose-950 backdrop-blur-sm">
              {error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">公司</span>
              <input
                required
                value={draft.company}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, company: e.target.value }))
                }
                className="glass-field mt-1 w-full"
                placeholder="例如：某某科技"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">岗位</span>
              <input
                required
                value={draft.position}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, position: e.target.value }))
                }
                className="glass-field mt-1 w-full"
                placeholder="例如：前端开发实习生"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">
                简历材料版本
              </span>
              <select
                value={draft.resumeVersionId ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    resumeVersionId: e.target.value || null,
                  }))
                }
                className="glass-select mt-1 w-full"
              >
                <option value="">不关联</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.focusTag ? `（${m.focusTag}）` : ""}
                  </option>
                ))}
              </select>
              {materials.length === 0 ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  暂无材料版本，请先到「材料中心」新建。
                </p>
              ) : null}
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">
                投递方式
              </span>
              <select
                value={draft.channel}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    channel: e.target.value as Channel,
                  }))
                }
                className="glass-select mt-1 w-full"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">阶段</span>
              <select
                value={draft.stage}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    stage: e.target.value as Stage,
                  }))
                }
                className="glass-select mt-1 w-full"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">
                截止日期（DDL）
              </span>
              <input
                type="date"
                value={draft.deadline ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    deadline: e.target.value || null,
                  }))
                }
                className="glass-field mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">
                跟进日（可选）
              </span>
              <input
                type="date"
                value={draft.followUpDate ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    followUpDate: e.target.value || null,
                  }))
                }
                className="glass-field mt-1 w-full"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">笔试时间（可选）</span>
              <input
                type="datetime-local"
                value={draft.writtenAt ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    writtenAt: e.target.value || null,
                  }))
                }
                className="glass-field mt-1 w-full"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">测评时间（可选）</span>
              <input
                type="datetime-local"
                value={draft.assessmentAt ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    assessmentAt: e.target.value || null,
                  }))
                }
                className="glass-field mt-1 w-full"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">面试时间（可选）</span>
              <input
                type="datetime-local"
                value={draft.interviewAt ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    interviewAt: e.target.value || null,
                  }))
                }
                className="glass-field mt-1 w-full"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">
                岗位链接（可选）
              </span>
              <input
                value={draft.jobUrl ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    jobUrl: e.target.value.trim() ? e.target.value : null,
                  }))
                }
                className="glass-field mt-1 w-full"
                placeholder="https://"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">备注</span>
              <textarea
                value={draft.notes}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: e.target.value }))
                }
                rows={3}
                className="glass-field mt-1 w-full resize-y"
                placeholder="笔试时间、联系人、内推码等"
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/20 pt-4">
            <div>
              {application && onDelete ? (
                <GlassButton
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        `确定删除「${application.company} · ${application.position}」？`,
                      )
                    ) {
                      onDelete(application.id);
                    }
                  }}
                >
                  删除
                </GlassButton>
              ) : (
                <span />
              )}
            </div>
            <div className="flex gap-2">
              <GlassButton type="button" variant="secondary" onClick={onClose}>
                取消
              </GlassButton>
              <GlassButton type="submit" variant="primary">
                保存
              </GlassButton>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
