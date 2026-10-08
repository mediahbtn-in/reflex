import Link from "next/link";

export default function NotFound() {
  return (
    <section className="phero" style={{ minHeight: "80vh" }}>
      <div className="phero__grid" aria-hidden="true" />
      <div className="wrap phero__inner">
        <h1 className="display phero__title">This room <strong>isn&apos;t built yet.</strong></h1>
        <p className="lead phero__lead">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn btn--primary" style={{ marginTop: 40 }}>Back to home <span className="btn__arrow">→</span></Link>
      </div>
    </section>
  );
}
