"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const TYPES = ["Architecture", "Construction", "Interior design", "Renovation", "Turnkey", "Not sure yet"];

/**
 * No backend is wired yet: submitting opens the visitor's email client with the
 * brief pre-filled. TODO(client): point this at a form endpoint / CRM when ready.
 */
export default function ContactForm() {
  const [sent, setSent] = useState(false);
  return sent ? (
    <div className="form__ok" role="status">
      <p className="eyebrow">Thank you</p>
      <p style={{ marginTop: 12, fontSize: 20, color: "var(--navy)" }}>Your email app should have opened with your brief. We&apos;ll be in touch shortly.</p>
    </div>
  ) : (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = [
          `Name: ${f.get("name")}`,
          `Email: ${f.get("email")}`,
          `Phone: ${f.get("phone") || "-"}`,
          `Services: ${f.getAll("type").join(", ") || "-"}`,
          `Location: ${f.get("location") || "-"}`,
          `Budget: ${f.get("budget") || "-"}`,
          "",
          String(f.get("message") || ""),
        ].join("\n");
        window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("Project enquiry — " + f.get("name"))}&body=${encodeURIComponent(body)}`;
        setSent(true);
      }}
    >
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div className="field">
        <label htmlFor="location">Project location</label>
        <input id="location" name="location" />
      </div>
      <fieldset className="field field--full" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="eyebrow" style={{ marginBottom: 12, fontSize: 10.5 }}>What do you need?</legend>
        <div className="chips">
          {TYPES.map((t) => (
            <label key={t} className="chip">
              <input type="checkbox" name="type" value={t} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field field--full">
        <label htmlFor="budget">Project scale</label>
        <select id="budget" name="budget" defaultValue="">
          <option value="" disabled>Select a range</option>
          <option>Single room / interior refresh</option>
          <option>Full interior or renovation</option>
          <option>New build</option>
          <option>Large / commercial project</option>
          <option>Prefer to discuss</option>
        </select>
      </div>
      <div className="field field--full">
        <label htmlFor="message">Tell us about the space</label>
        <textarea id="message" name="message" required placeholder="Site, size, timeline, what you'd love it to feel like…" />
      </div>
      <div className="field--full" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn--primary">Send enquiry <span className="btn__arrow" aria-hidden="true">→</span></button>
        <span className="form__note">We reply within two working days.</span>
      </div>
    </form>
  );
}
