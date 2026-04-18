import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export function GlassCard({ children, className, ...rest }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/25 bg-[var(--glass-bg)] shadow-[var(--glass-shadow)] backdrop-blur-2xl backdrop-saturate-150",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
