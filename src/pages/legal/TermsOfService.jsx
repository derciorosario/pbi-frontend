import React from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../contexts/DataContext";

/** ---------------------------
 * Quick config (edit these)
 * --------------------------- */
const ORG = {
  name: "55Links",
  email: "privacy@55Links.example", // update if you have a real address
  address: "Maputo, Mozambique",
  dpoEmail: "dpo@55Links.example",  // optional; remove if unused
};

const BRAND = "#034ea2";

/** Simple heading & section helpers */
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

export default function TermsOfServicePage() {
  const nav = useNavigate();
  const lastUpdated = "September 6, 2025";
  const data=useData()

  return (
    <div id="top"  className="min-h-screen bg-gray-50">
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
              <div className="font-semibold text-gray-900">Terms of Service</div>
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
        {/* Intro card */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">
            These Terms of Service (“Terms”) govern your access to and use of {ORG.name}’s
            website, apps, and related services (collectively, the “Platform”). By creating an
            account, accessing, or using the Platform, you agree to these Terms.
          </p>
          <p className="text-sm text-gray-600 mt-3">
            If you do not agree, do not use the Platform. For how we handle personal data, please
            also see our <Anchor href="/privacy">Privacy Policy</Anchor>.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Table of Contents
          </div>
          <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            {[
              ["introduction", "1. Introduction"],
              ["acceptance", "2. Acceptance of Terms"],
              ["eligibility", "3. Eligibility & Accounts"],
              ["registration", "4. Registration & Onboarding"],
              ["matching", "5. Profile Types & Matching"],
              ["conduct", "6. User Content & Conduct"],
              ["sections", "7. Core Platform Sections"],
              ["engagement", "8. Communications & Engagement Tools"],
              ["payments", "9. Payments, Boosting & Premium"],
              ["verification", "10. Company Verification"],
              ["privacy", "11. Privacy"],
              ["ip", "12. Intellectual Property"],
              ["warranties", "13. Disclaimers & Limitation of Liability"],
              ["indemnity", "14. Indemnification"],
              ["suspension", "15. Suspension & Termination"],
              ["admin", "16. Administration & Moderation"],
              ["changes", "17. Changes to Service & Terms"],
              ["law", "18. Governing Law & Disputes"],
              ["contact", "19. Contact"],
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
            <H2 id="introduction">1. Introduction</H2>
            <p>
              {ORG.name} is a pan-African business matching network that connects professionals,
              entrepreneurs, and organizations across Africa, supporting collaboration and
              economic integration aligned with the AfCFTA agenda.
            </p>
          </Section>

          <Section>
            <H2 id="acceptance">2. Acceptance of Terms</H2>
            <p>
              By accessing or using the Platform, you agree to be bound by these Terms and any
              additional policies referenced here, including our{" "}
              <Anchor href="/privacy">Privacy Policy</Anchor>. If you use the Platform on behalf
              of a company, you represent that you have authority to bind that company.
            </p>
          </Section>

          <Section>
            <H2 id="eligibility">3. Eligibility & Accounts</H2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Individuals must be at least the age of majority in their country of residence.</li>
              <li>
                Account types may include Individual and Company accounts (Individual currently
                active). You are responsible for all activity under your account.
              </li>
              <li>Keep your credentials secure and notify us of any suspected unauthorized use.</li>
            </ul>
          </Section>

          <Section>
            <H2 id="registration">4. Registration & Onboarding</H2>
            <p>
              During registration you may provide your name, email, phone, biography, nationality,
              country of residence, and a password. You must verify your email to activate your
              account. After login, you will be prompted to select your primary profile type,
              categories/subcategories, and up to three goals. A guided progress flow may help you
              complete your profile.
            </p>
          </Section>

          <Section>
            <H2 id="matching">5. Profile Types & Matching</H2>
            <p>
              The Platform uses your profile type and goals to suggest matches (e.g., Seller →
              Service, Buyer → Partnership). Results and rankings may be AI-assisted and can change
              over time. We do not guarantee any specific results, outcomes, or opportunities.
            </p>
          </Section>

          <Section>
            <H2 id="conduct">6. User Content & Conduct</H2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                You retain ownership of content you submit, but grant {ORG.name} a worldwide,
                non-exclusive, royalty-free license to host, use, reproduce, modify, and display it
                to operate and improve the Platform.
              </li>
              <li>
                Prohibited conduct includes harassment, hate speech, spam, fraud, illegal
                activities, IP infringement, and attempts to disrupt or scrape the service.
              </li>
              <li>
                You are responsible for ensuring your postings (jobs, events, services, products,
                etc.) are accurate, lawful, and comply with applicable regulations.
              </li>
            </ul>
          </Section>

          <Section>
            <H2 id="sections">7. Core Platform Sections</H2>
            <p>
              Dedicated spaces include Business, Jobs, Events & Trainings, Networking, and Tourism &
              Culture. Each section displays content relevant to that area and may provide specific
              search and filter tools (e.g., country, industry, availability, event type).
            </p>
          </Section>

          <Section>
            <H2 id="engagement">8. Communications & Engagement Tools</H2>
            <p>
              The Platform may provide direct messaging, meeting scheduling, and Connect/Follow
              options. You agree to use these features respectfully and in accordance with these
              Terms and applicable laws.
            </p>
          </Section>

          <Section>
            <H2 id="payments">9. Payments, Boosting & Premium</H2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                We may offer paid features such as profile/post boosting and premium memberships
                (e.g., analytics, expanded messaging, exclusive content). Prices, taxes, fees, and
                availability may change.
              </li>
              <li>
                Payments may be processed by third-party providers. Except where required by law,
                fees are non-refundable once services are rendered.
              </li>
            </ul>
          </Section>

          <Section>
            <H2 id="verification">10. Company Verification</H2>
            <p>
              Companies may verify their status via corporate email. Verified companies receive a
              badge. We may revoke verification if we suspect misuse.
            </p>
          </Section>

          <Section>
            <H2 id="privacy">11. Privacy</H2>
            <p>
              Our handling of personal data is described in our{" "}
              <Anchor href="/privacy">Privacy Policy</Anchor>. By using the Platform, you consent
              to those practices.
            </p>
          </Section>

          <Section>
            <H2 id="ip">12. Intellectual Property</H2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                The Platform, including software, designs, and trademarks, is owned by {ORG.name} or
                its licensors and is protected by law.
              </li>
              <li>You may not copy, modify, or create derivative works except as permitted here.</li>
            </ul>
          </Section>

          <Section>
            <H2 id="warranties">13. Disclaimers & Limitation of Liability</H2>
            <p>
              THE PLATFORM IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND.
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {ORG.name} SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS, DATA, OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE PLATFORM.
            </p>
          </Section>

          <Section>
            <H2 id="indemnity">14. Indemnification</H2>
            <p>
              You agree to defend, indemnify, and hold harmless {ORG.name} from any claims,
              liabilities, damages, losses, and expenses (including legal fees) arising from your
              use of the Platform or your violation of these Terms.
            </p>
          </Section>

          <Section>
            <H2 id="suspension">15. Suspension & Termination</H2>
            <p>
              We may suspend or terminate access for violations of these Terms or applicable law,
              including for spam, harassment, or illegal postings. Upon termination, your right to
              use the Platform ceases immediately.
            </p>
          </Section>

          <Section>
            <H2 id="admin">16. Administration & Moderation</H2>
            <p>
              Authorized administrators may review, moderate, or remove reported content; manage
              user accounts; configure features; and send platform-wide notices in accordance with
              our policies and applicable law.
            </p>
          </Section>

          <Section>
            <H2 id="changes">17. Changes to Service & Terms</H2>
            <p>
              We may modify the Platform or these Terms. Material changes will be communicated by
              reasonable means. Continued use after changes constitutes acceptance.
            </p>
          </Section>

          <Section>
            <H2 id="law">18. Governing Law & Disputes</H2>
            <p>
              These Terms are governed by the laws of the {ORG.jurisdiction}, without regard to
              conflicts of law rules. Disputes shall be resolved in the courts located in the{" "}
              {ORG.jurisdiction}, unless otherwise required by mandatory law.
            </p>
          </Section>

          <Section>
            <H2 id="contact">19. Contact</H2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a className="text-[#0a66c2] hover:underline" href={`mailto:${ORG.email}`}>
                {ORG.email}
              </a>{" "}
              or write to {ORG.address}.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
