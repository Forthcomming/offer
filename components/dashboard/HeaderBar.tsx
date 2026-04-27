"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { GlassButton } from "@/components/ui/GlassButton";

type HeaderBarProps = {
  onNew: () => void;
};

const MAX_PULL = 78;
const TRIGGER_PULL = 52;
const OFFER_TOWER_IMAGE = "/offer-tower.png";

export function HeaderBar({ onNew }: HeaderBarProps) {
  const [pullOffset, setPullOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showOfferImage, setShowOfferImage] = useState(false);
  const [offerImagePos, setOfferImagePos] = useState<{ left: number; top: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);

  const startYRef = useRef(0);
  const ringWrapRef = useRef<HTMLDivElement | null>(null);
  const imageTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (imageTimerRef.current) window.clearTimeout(imageTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showOfferImage) return;
    const el = ringWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setOfferImagePos({
      left: rect.left + rect.width / 2,
      top: rect.bottom + 10,
    });
  }, [showOfferImage]);

  const computeOfferImagePos = () => {
    const el = ringWrapRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + rect.width / 2,
      top: rect.bottom + 10,
    };
  };

  const triggerRingReward = () => {
    if (isTriggered) return;
    setIsTriggered(true);
    const pos = computeOfferImagePos();
    if (pos) setOfferImagePos(pos);
    setShowOfferImage(true);
    setShowToast(true);

    if (imageTimerRef.current) window.clearTimeout(imageTimerRef.current);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);

    imageTimerRef.current = window.setTimeout(() => {
      setShowOfferImage(false);
    }, 1300);
    toastTimerRef.current = window.setTimeout(() => {
      setShowToast(false);
    }, 2200);
  };

  const onRingPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (isTriggered) return;
    setIsDragging(true);
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onRingPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || isTriggered) return;
    const delta = Math.max(0, e.clientY - startYRef.current);
    setPullOffset(Math.min(MAX_PULL, delta));
  };

  const onRingPointerEnd = () => {
    if (!isTriggered && pullOffset >= TRIGGER_PULL) {
      triggerRingReward();
    }
    setIsDragging(false);
    setPullOffset(0);
  };

  return (
    <div className="rounded-2xl border border-white/25 bg-[var(--glass-bg)] shadow-[var(--glass-shadow)] backdrop-blur-2xl backdrop-saturate-150">
      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            今天你拿offer了吗？
          </p>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            今天你拿offer了吗？
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div ref={ringWrapRef} className="relative mr-1 h-[58px] w-16 shrink-0">
            {!isTriggered ? (
              <div
                className={`offer-ring-float-wrap pointer-events-none absolute inset-0 flex flex-col items-center justify-start pt-0.5 ${
                  isDragging || pullOffset > 0 ? "offer-ring-float-wrap--paused" : ""
                }`}
              >
                <div
                  className="offer-ring-line w-[3px] shrink-0 rounded-full"
                  style={{
                    height: `${24 + Math.round(pullOffset * 0.45)}px`,
                  }}
                />
                <button
                  type="button"
                  onPointerDown={onRingPointerDown}
                  onPointerMove={onRingPointerMove}
                  onPointerUp={onRingPointerEnd}
                  onPointerCancel={onRingPointerEnd}
                  className="offer-ring-handle offer-ring-metal pointer-events-auto relative -mt-[3px] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-indigo-900 shadow-lg transition-transform"
                  style={{ transform: `translateY(${pullOffset}px)` }}
                  title="向下拉试试"
                  aria-label="下拉互动拉环"
                >
                  <span className="offer-ring-hole h-4 w-4 rounded-full border border-slate-400/50 bg-slate-100/90" />
                </button>
              </div>
            ) : null}
          </div>
          <GlassButton type="button" variant="primary" onClick={onNew}>
            添加申请
          </GlassButton>
        </div>
      </div>
      {mounted && showOfferImage && offerImagePos
        ? createPortal(
            <div
              className="pointer-events-none fixed z-50"
              style={{
                left: offerImagePos.left,
                top: offerImagePos.top,
                transform: "translateX(-50%)",
              }}
            >
              <div className="offer-image-pop rounded-xl border border-white/45 bg-white/55 p-1 shadow-xl backdrop-blur-md">
                <img
                  src={OFFER_TOWER_IMAGE}
                  alt="offer大楼"
                  className="h-auto w-auto rounded-lg"
                />
              </div>
            </div>,
            document.body,
          )
        : null}
      {showToast ? (
        <div className="offer-toast pointer-events-none fixed right-4 top-20 z-50 rounded-xl border border-white/45 bg-white/70 px-4 py-2 text-sm font-medium text-indigo-950 shadow-xl backdrop-blur-lg sm:right-6">
          今天offer大楼镇楼，offer马上到！
        </div>
      ) : null}
    </div>
  );
}
