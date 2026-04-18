import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type GlassButtonVariant = "primary" | "secondary" | "danger";

type GlassButtonProps = {
  children: ReactNode;
  variant?: GlassButtonVariant;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClass: Record<GlassButtonVariant, string> = {
  primary:
    "border-white/30 bg-indigo-500/80 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-600/90",
  secondary:
    "border-white/30 bg-white/15 text-slate-800 hover:bg-white/25 shadow-md shadow-slate-900/5",
  danger:
    "border-rose-300/40 bg-rose-500/20 text-rose-950 hover:bg-rose-500/30 shadow-md shadow-rose-900/10",
};

export function GlassButton({
  children,
  variant = "secondary",
  className,
  type = "button",
  ...rest
}: GlassButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
