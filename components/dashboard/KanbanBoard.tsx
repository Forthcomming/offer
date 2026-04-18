"use client";

import type { Application, Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { StageColumn } from "./StageColumn";

type KanbanBoardProps = {
  apps: Application[];
  resumeNameById: Record<string, string>;
  onEdit: (id: string) => void;
  onStageChange: (id: string, stage: Stage) => void;
};

export function KanbanBoard({
  apps,
  resumeNameById,
  onEdit,
  onStageChange,
}: KanbanBoardProps) {
  return (
    <section className="pb-8">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {STAGES.map((col) => (
            <StageColumn
              key={col.id}
              label={col.label}
              columnClass={col.columnClass}
              apps={apps.filter((a) => a.stage === col.id)}
              resumeNameById={resumeNameById}
              onEdit={onEdit}
              onStageChange={onStageChange}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
