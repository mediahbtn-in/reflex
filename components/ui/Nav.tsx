"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { nav } from "@/lib/site";

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      // Over dark sections the bar switches to light ink (the story manages its own theme).
      const el = document.elementFromPoint(window.innerWidth / 2, 90);
      if (!el || el.closest(".story")) return;
      document.documentElement.dataset.navTheme = el.closest(".brand, .section--dark, .final, .footer") ? "light" : "ink";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    const lenis = window.__lenis;
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <>
      <header className={`nav ${scrolled ? "nav--scrolled" : ""} ${open ? "nav--open" : ""}`}>
        <div className="nav__inner">
          <Link href="/" className="nav__logo" aria-label="Reflex — home">
            <Logo />
          </Link>
          <nav className="nav__links" aria-label="Primary">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={`nav__link ${isActive(n.href) ? "is-active" : ""}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/contact/" className="btn btn--sm btn--primary nav__cta">
            Get a quote <span className="btn__arrow" aria-hidden="true">→</span>
          </Link>
          <button
            className="nav__burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="menu__grid" aria-hidden="true" />
        <nav className="menu__links" aria-label="Mobile">
          {nav.map((n, i) => (
            <Link key={n.href} href={n.href} className="menu__link" style={{ transitionDelay: open ? `${80 + i * 55}ms` : "0ms" }} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              <span className="menu__n">0{i + 1}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/contact/" className="btn btn--primary menu__cta" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
          Get a quote <span className="btn__arrow" aria-hidden="true">→</span>
        </Link>
        <p className="menu__tag">Building Better Tomorrows</p>
      </div>
    </>
  );
}
