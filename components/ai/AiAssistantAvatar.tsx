"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type AiAssistantAvatarProps = {
  className?: string;
  size?: number;
};

/** 求职助手形象：卡通小羊头像 */
export function AiAssistantAvatar({
  className,
  size = 40,
}: AiAssistantAvatarProps) {
  const uid = useId().replace(/:/g, "");
  const bgId = `sheep-bg-${uid}`;
  const faceId = `sheep-face-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
        <linearGradient id={faceId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#ffedd5" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#${bgId})`} />
      <ellipse cx="12" cy="24" rx="5.5" ry="8" fill="#f8fafc" />
      <ellipse cx="36" cy="24" rx="5.5" ry="8" fill="#f8fafc" />
      <circle cx="16" cy="14" r="6.2" fill="#f8fafc" />
      <circle cx="24" cy="12" r="6.8" fill="#ffffff" />
      <circle cx="32" cy="14" r="6.2" fill="#f8fafc" />
      <circle cx="12" cy="20" r="5.8" fill="#f8fafc" />
      <circle cx="36" cy="20" r="5.8" fill="#f8fafc" />
      <ellipse cx="24" cy="27" rx="11.5" ry="10.5" fill={`url(#${faceId})`} />
      <ellipse cx="19" cy="25.5" rx="2.2" ry="2.6" fill="#111827" />
      <ellipse cx="29" cy="25.5" rx="2.2" ry="2.6" fill="#111827" />
      <circle cx="19.6" cy="24.8" r="0.6" fill="#fff" />
      <circle cx="29.6" cy="24.8" r="0.6" fill="#fff" />
      <ellipse cx="24" cy="30" rx="2.3" ry="1.8" fill="#fb7185" opacity="0.85" />
      <path
        d="M 20 33 Q 24 36 28 33"
        stroke="#7c2d12"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="15.5" cy="30" rx="2.6" ry="1.3" fill="#fda4af" opacity="0.6" />
      <ellipse cx="32.5" cy="30" rx="2.6" ry="1.3" fill="#fda4af" opacity="0.6" />
    </svg>
  );
}
