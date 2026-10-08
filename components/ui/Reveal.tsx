"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Architectural reveals: lines rise out of a mask, rules extend, diagrams draw.
 * Children marked with data-rv="line" | "fade" | "rule" | "draw" | "img" are animated when the block enters.
 * Without JS (or with reduced motion) everything is simply visible.
 */
export default function Reveal({ children, className, as: Tag = "div", stagger = 0.08 }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "header"; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el?.querySelectorAll(".draw").forEach((d) => d.classList.add("is-drawn"));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const lines = el.querySelectorAll("[data-rv=line] > span");
      const fades = el.querySelectorAll("[data-rv=fade]");
      const rules = el.querySelectorAll("[data-rv=rule]");
      const imgs = el.querySelectorAll("[data-rv=img]");
      const draws = el.querySelectorAll(".draw");
      gsap.set(lines, { yPercent: 105 });
      gsap.set(fades, { opacity: 0, y: 18 });
      gsap.set(rules, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(imgs, { clipPath: "inset(0 0 100% 0)" });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 82%", once: true } });
      tl.to(rules, { scaleX: 1, duration: 1.2, ease: "power3.inOut", stagger: 0.06 }, 0)
        .to(lines, { yPercent: 0, duration: 1.15, ease: "power4.out", stagger }, 0.05)
        .to(imgs, { clipPath: "inset(0 0 0% 0)", duration: 1.4, ease: "power3.inOut", stagger: 0.12 }, 0.1)
        .to(fades, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.07 }, 0.25)
        .add(() => draws.forEach((d, i) => window.setTimeout(() => d.classList.add("is-drawn"), i * 120)), 0.2);
    }, el);
    return () => ctx.revert();
  }, [stagger]);
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}

/** Splits text lines into masked spans for the line reveal. */
export function Lines({ lines, className, as: Tag = "span" }: { lines: React.ReactNode[]; className?: string; as?: "span" | "h2" | "h1" | "p" }) {
  return (
    <Tag className={className}>
      {lines.map((l, i) => (
        <span key={i} className="rv-line" data-rv="line">
          <span>{l}</span>
        </span>
      ))}
    </Tag>
  );
}
