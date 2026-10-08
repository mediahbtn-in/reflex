import { pageMeta } from "@/lib/meta";
import { site } from "@/lib/site";
import { PageHero } from "@/components/ui/Page";
import ContactForm from "./ContactForm";

export const metadata = pageMeta(
  "/contact/",
  "Contact & Quote",
  "Start your project with Reflex Interior and Construction. Tell us about your space and request a quote for design, construction or interiors.",
);

export default function Contact() {
  return (
    <>
      <PageHero
        crumb="Contact"
        title={["Let's build", <strong key="s">something better.</strong>]}
        lead="Have a space in mind? Tell us a little about it and we'll come back within two working days with a clear next step."
      />
      <section className="section" id="quote">
        <div className="wrap split">
          <div>
            <h2 className="h2" style={{ marginBottom: 48 }}>Tell us about <strong>your space.</strong></h2>
            <div className="contact-list">
              <a href={`mailto:${site.email}`}><span className="eyebrow">Email</span>{site.email}</a>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`}><span className="eyebrow">Phone</span>{site.phone}</a>
              <div><span className="eyebrow">Studio</span>{site.address}</div>
              <div><span className="eyebrow">Hours</span>{site.hours}</div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
