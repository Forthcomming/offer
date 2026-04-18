"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { countApplicationsUsingResume } from "@/lib/materials-usage";
import type { ResumeVersion } from "@/lib/types";
import {
  loadApplications,
  loadMaterials,
  saveMaterials,
} from "@/lib/storage";

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

function emptyVersion(): ResumeVersion {
  const now = new Date().toISOString();
  return {
    id: "",
    name: "",
    note: "",
    focusTag: null,
    attachmentName: null,
    attachmentDataUrl: null,
    syncStatus: "idle",
    syncUpdatedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function MaterialsClient() {
  const [materials, setMaterials] = useState<ResumeVersion[]>([]);
  const [apps, setApps] = useState(() => loadApplications());
  const [hydrated, setHydrated] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ResumeVersion | null>(null);
  const [draft, setDraft] = useState<ResumeVersion>(emptyVersion());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMaterials(loadMaterials());
    setApps(loadApplications());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveMaterials(materials);
  }, [materials, hydrated]);

  useEffect(() => {
    const onFocus = () => setApps(loadApplications());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyVersion());
    setFormOpen(true);
  };

  const openEdit = (m: ResumeVersion) => {
    setEditing(m);
    setDraft({ ...m });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const saveDraft = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      window.alert("请填写版本名称");
      return;
    }
    const now = new Date().toISOString();
       const row: ResumeVersion = {
      ...draft,
      id: editing?.id ?? crypto.randomUUID(),
      name: draft.name.trim(),
      note: draft.note.trim(),
      focusTag: draft.focusTag?.trim() ? draft.focusTag.trim() : null,
      attachmentName: draft.attachmentName,
      attachmentDataUrl: draft.attachmentDataUrl,
      syncStatus: "idle",
      syncUpdatedAt: null,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    setMaterials((prev) => {
      const i = prev.findIndex((x) => x.id === row.id);
      if (i === -1) return [...prev, row];
      const next = [...prev];
      next[i] = row;
      return next;
    });
    closeForm();
  };

  const remove = (m: ResumeVersion) => {
    const n = countApplicationsUsingResume(apps, m.id);
    if (n > 0) {
      window.alert(`有 ${n} 条申请正在使用该版本，无法删除。`);
      return;
    }
    if (!window.confirm(`确定删除材料版本「${m.name}」？`)) return;
    setMaterials((prev) => prev.filter((x) => x.id !== m.id));
  };

  const pickAttachmentFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      window.alert(
        "文件超过 4MB，请选择较小的文件（浏览器本地存储容量有限）。",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setDraft((d) => ({
        ...d,
        attachmentName: file.name,
        attachmentDataUrl: url,
        ...(!d.name.trim()
          ? { name: file.name.replace(/\.[^.]+$/, "") || file.name }
          : {}),
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearAttachment = () => {
    setDraft((d) => ({
      ...d,
      attachmentName: null,
      attachmentDataUrl: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const mockSync = (m: ResumeVersion) => {
    const now = new Date().toISOString();
    setMaterials((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              syncStatus: "mock_done",
              syncUpdatedAt: now,
            }
          : x,
      ),
    );
  };

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-white/25 bg-[var(--glass-bg)] shadow-[var(--glass-shadow)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Materials
            </p>
            <h1 className="text-xl font-semibold text-slate-900">材料管理中心</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-medium text-slate-800 shadow-md transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              返回看板
            </Link>
            <GlassButton type="button" variant="primary" onClick={openCreate}>
              新建版本
            </GlassButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] px-4 py-6 sm:px-6">
        {materials.length === 0 ? (
          <GlassCard className="border-dashed border-white/40 p-8 text-center shadow-lg">
            <p className="text-sm font-medium text-slate-900">暂无简历版本</p>
            <p className="mt-1 text-xs text-slate-600">
              创建版本后，可在看板申请里关联对应简历材料。
            </p>
            <GlassButton
              type="button"
              variant="primary"
              className="mt-4"
              onClick={openCreate}
            >
              新建第一个版本
            </GlassButton>
          </GlassCard>
        ) : (
          <ul className="space-y-3">
            {materials.map((m) => (
              <li key={m.id}>
                <GlassCard className="flex flex-col gap-3 border-white/30 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{m.name}</p>
                    {m.focusTag ? (
                      <p className="mt-0.5 text-xs text-indigo-900/80">
                        方向：{m.focusTag}
                      </p>
                    ) : null}
                    {m.note ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {m.note}
                      </p>
                    ) : null}
                    {m.attachmentDataUrl && m.attachmentName ? (
                      <a
                        href={m.attachmentDataUrl}
                        download={m.attachmentName}
                        className="mt-2 inline-flex text-xs font-medium text-indigo-700 underline decoration-indigo-400/60 underline-offset-2 hover:text-indigo-900"
                      >
                        下载材料：{m.attachmentName}
                      </a>
                    ) : null}
                    <p className="mt-2 text-[10px] text-slate-500">
                      更新 {new Date(m.updatedAt).toLocaleString("zh-CN")}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      同步状态：
                      {m.syncStatus === "mock_done"
                        ? "已模拟同步（开发中）"
                        : "待同步（开发中）"}
                    </p>
                    {m.syncUpdatedAt ? (
                      <p className="mt-1 text-[10px] text-slate-500">
                        模拟同步时间{" "}
                        {new Date(m.syncUpdatedAt).toLocaleString("zh-CN")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <GlassButton
                      type="button"
                      variant="secondary"
                      onClick={() => mockSync(m)}
                    >
                      同步到招聘网站
                    </GlassButton>
                    <GlassButton
                      type="button"
                      variant="secondary"
                      onClick={() => openEdit(m)}
                    >
                      编辑
                    </GlassButton>
                    <GlassButton
                      type="button"
                      variant="danger"
                      onClick={() => remove(m)}
                    >
                      删除
                    </GlassButton>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ul>
        )}
      </main>

      {formOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <GlassCard
            className="w-full max-w-md rounded-t-3xl border-white/35 sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="material-form-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/20 px-5 py-4">
              <h2
                id="material-form-title"
                className="text-lg font-semibold text-slate-900"
              >
                {editing ? "编辑材料版本" : "新建材料版本"}
              </h2>
            </div>
            <form onSubmit={saveDraft} className="space-y-3 px-5 py-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  版本名称
                </span>
                <input
                  required
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  className="glass-field mt-1 w-full"
                  placeholder="例如：Java后端-精简版"
                />
              </label>
              <div className="block">
                <span className="text-xs font-medium text-slate-600">
                  材料文件
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  onChange={(e) =>
                    pickAttachmentFile(e.target.files?.[0] ?? null)
                  }
                />
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    pickAttachmentFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-field mt-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl py-6 text-center text-xs text-slate-600"
                >
                  <span>点击选择或拖放文件到此处</span>
                  {draft.attachmentName ? (
                    <span className="font-medium text-slate-900">
                      {draft.attachmentName}
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      PDF、Word 等（建议 ≤4MB）
                    </span>
                  )}
                </div>
                {draft.attachmentName ? (
                  <GlassButton
                    type="button"
                    variant="secondary"
                    className="mt-2"
                    onClick={(ev) => {
                      ev.preventDefault();
                      clearAttachment();
                    }}
                  >
                    移除文件
                  </GlassButton>
                ) : null}
              </div>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  方向标签（可选）
                </span>
                <input
                  value={draft.focusTag ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      focusTag: e.target.value || null,
                    }))
                  }
                  className="glass-field mt-1 w-full"
                  placeholder="例如：前端 / 后端 / 产品"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">备注</span>
                <textarea
                  value={draft.note}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, note: e.target.value }))
                  }
                  rows={3}
                  className="glass-field mt-1 w-full resize-y"
                  placeholder="存放路径、文件名、亮点摘要等"
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-white/20 pt-4">
                <GlassButton type="button" variant="secondary" onClick={closeForm}>
                  取消
                </GlassButton>
                <GlassButton type="submit" variant="primary">
                  保存
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
