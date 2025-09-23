import React from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../contexts/DataContext";

/** ---------------------------
 * Quick config (edit these)
 * --------------------------- */
const ORG = {
  name: "54Links",
  email: "support@54links.com", // update if you have a real address
  address: "Maputo, Mozambique",
  dpoEmail: "support@54links.com",  // optional; remove if unused
};
const BRAND = "#034ea2";

const H2 = ({ id, children }) => (
  <h2 id={id} className="scroll-mt-28 text-xl md:text-2xl font-semibold text-gray-900 mt-10">
    {children}
  </h2>
);
const Section = ({ children }) => <section className="space-y-3">{children}</section>;
const Anchor = ({ href, children }) => (
  <a href={href} className="text-[#0a66c2] hover:underline">
    {children}
  </a>
);

export default function PrivacyPolicyPage() {
  const nav = useNavigate();
  const lastUpdated = "September 6, 2025";
  const data=useData()

  return (
    <div id="top" className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        style={{ borderColor: `${BRAND}22` }}
      >
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: BRAND }}
              aria-hidden
            >
              P
            </div>
            <div>
              <div className="font-semibold text-gray-900">Privacy Policy</div>
              <div className="text-xs text-gray-500">Last updated: {lastUpdated}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nav(-1)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND }}
            >
              Print
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">
            This Privacy Policy explains how {ORG.name} (“we”, “our”, “us”) collects, uses,
            discloses, and safeguards personal data when you use our websites, apps, and related
            services (the “Platform”). If you do not agree with this Policy, please do not use the
            Platform.
          </p>
          <p className="text-sm text-gray-600 mt-3">
            For the contract that governs your use of the Platform, please see our{" "}
            <Anchor href="/terms">Terms of Service</Anchor>.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Table of Contents
          </div>
          <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            {[
              ["scope", "1. Scope"],
              ["data-we-collect", "2. Data We Collect"],
              ["how-we-use", "3. How We Use Data"],
              ["legal-bases", "4. Legal Bases"],
              ["sharing", "5. How We Share Data"],
              ["retention", "6. Data Retention"],
              ["security", "7. Security"],
              ["transfers", "8. International Transfers"],
              ["your-rights", "9. Your Rights & Choices"],
              ["children", "10. Children"],
              ["third-parties", "11. Third-Party Links & Services"],
              ["changes", "12. Changes to this Policy"],
              ["contact", "13. Contact Us"],
              ["country-notices", "14. Country-Specific Notices"],
            ].map(([id, label]) => (
              <li key={id}>
                <Anchor href={`#${id}`}>{label}</Anchor>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm leading-7 text-gray-700">
          <Section>
            <H2 id="scope">1. Scope</H2>
            <p>
              This Policy applies to personal data processed by {ORG.name} in connection with the
              Platform, including account registration, onboarding, profile management, matching,
              messaging, posting content (e.g., jobs, events, services, products), and using
              premium features (e.g., boosting, analytics).
            </p>
          </Section>

          <Section>
            <H2 id="data-we-collect">2. Data We Collect</H2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <span className="font-medium">Account & Identity Data:</span> name, email, phone,
                password (hashed), nationality, country of residence, profile type (e.g.,
                Entrepreneur, Seller, Job Seeker, Investor).
              </li>
              <li>
                <span className="font-medium">Onboarding & Profile Data:</span> categories,
                subcategories, goals (up to three), biography, experience, services or products,
                job details, event details, portfolio items, company verification info.
              </li>
              <li>
                <span className="font-medium">Content You Provide:</span> posts, messages, comments,
                likes, media uploads, and any metadata you include.
              </li>
              <li>
                <span className="font-medium">Usage & Device Data:</span> log data, pages viewed,
                links clicked, approximate location derived from IP, device and browser information,
                crash/diagnostic data, and cookies/SDK data.
              </li>
              <li>
                <span className="font-medium">Communications:</span> in-app messages, meeting
                scheduling details, and your preferences for notifications or marketing.
              </li>
              <li>
                <span className="font-medium">Payment & Transaction Data:</span> limited billing
                details processed via payment providers (we do not store full card numbers).
              </li>
            </ul>
          </Section>

          <Section>
            <H2 id="how-we-use">3. How We Use Data</H2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Provide, secure, and maintain the Platform and core features.</li>
              <li>Enable discovery, search, and AI-assisted matching of profiles and content.</li>
              <li>Facilitate communications (e.g., messaging, meeting scheduling, notifications).</li>
              <li>Process payments for premium features and post boosting.</li>
              <li>Analyze usage and improve functionality, UX, and performance.</li>
              <li>Detect, prevent, and respond to fraud, abuse, and violations of our Terms.</li>
              <li>Comply with legal obligations and enforce our agreements.</li>
            </ul>
          </Section>

          <Section>
            <H2 id="legal-bases">4. Legal Bases</H2>
            <p>Where applicable law (e.g., GDPR) requires a lawful basis, we rely on:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><span className="font-medium">Contract:</span> to provide the Platform.</li>
              <li><span className="font-medium">Legitimate Interests:</span> to secure and improve the Platform, prevent abuse, and promote relevant content.</li>
              <li><span className="font-medium">Consent:</span> for certain marketing and optional features; you may withdraw consent at any time.</li>
              <li><span className="font-medium">Legal Obligations:</span> to comply with applicable laws and requests.</li>
            </ul>
          </Section>

          <Section>
            <H2 id="sharing">5. How We Share Data</H2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <span className="font-medium">With Other Users:</span> information you choose to
                make public (e.g., profile, posts) is visible per your privacy settings.
              </li>
              <li>
                <span className="font-medium">Service Providers:</span> hosting, analytics,
                security, payments, email, and support vendors under contractual safeguards.
              </li>
              <li>
                <span className="font-medium">Partners & Integrations:</span> when you opt-in or
                connect third-party services.
              </li>
              <li>
                <span className="font-medium">Legal, Safety, and Compliance:</span> to respond to
                lawful requests or protect rights, safety, and property.
              </li>
              <li>
                <span className="font-medium">Business Transfers:</span> in connection with a
                merger, acquisition, or asset sale.
              </li>
            </ul>
          </Section>

          <Section>
            <H2 id="retention">6. Data Retention</H2>
            <p>
              We keep personal data as long as necessary for the purposes described above, to comply
              with legal obligations, resolve disputes, and enforce agreements. Retention periods
              vary by data category and context.
            </p>
          </Section>

          <Section>
            <H2 id="security">7. Security</H2>
            <p>
              We implement organizational and technical measures designed to protect personal data.
              No system is 100% secure; please use strong passwords and safeguard your account
              credentials.
            </p>
          </Section>

          <Section>
            <H2 id="transfers">8. International Transfers</H2>
            <p>
              We may process and store data in countries outside your own. Where required, we use
              appropriate safeguards for cross-border transfers.
            </p>
          </Section>

          <Section>
            <H2 id="your-rights">9. Your Rights & Choices</H2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Access, rectify, or delete certain personal data from your account settings or by contacting us.</li>
              <li>Object to or restrict processing in certain circumstances.</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Opt-out of marketing communications by using unsubscribe links or updating preferences.</li>
              <li>Depending on your location, you may have additional rights (e.g., data portability). We will honor requests as required by law.</li>
            </ul>
          </Section>

          <Section>
            <H2 id="children">10. Children</H2>
            <p>
              The Platform is not directed to children under the age of majority. We do not
              knowingly collect personal data from such users. If you believe a child has provided
              data, contact us to request deletion.
            </p>
          </Section>

          <Section>
            <H2 id="third-parties">11. Third-Party Links & Services</H2>
            <p>
              The Platform may link to or integrate third-party websites or services. Their privacy
              practices are governed by their own policies. We are not responsible for third-party
              content or practices.
            </p>
          </Section>

          <Section>
            <H2 id="changes">12. Changes to this Policy</H2>
            <p>
              We may update this Policy from time to time. Material changes will be communicated by
              reasonable means. Your continued use after changes becomes effective means you accept
              the updated Policy.
            </p>
          </Section>

          <Section>
            <H2 id="contact">13. Contact Us</H2>
            <p>
              For questions or requests, contact{" "}
              <a className="text-[#0a66c2] hover:underline" href={`mailto:${ORG.email}`}>
                {ORG.email}
              </a>
              {" "}
              You can also write to {ORG.address}.
            </p>
          </Section>

          <Section>
            <H2 id="country-notices">14. Country-Specific Notices</H2>
            <p>
              Depending on your location, additional rights or disclosures may apply. We will
              provide country-specific notices where legally required.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
