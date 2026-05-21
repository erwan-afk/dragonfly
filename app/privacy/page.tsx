import LegalLayout, {
  Section,
  Placeholder
} from '@/components/ui/LegalLayout/LegalLayout';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How Dragonfly Trimarans Marketplace collects, uses and protects your personal data.'
};

const sections = [
  { id: 'controller', title: 'Data controller' },
  { id: 'data', title: 'What data we collect' },
  { id: 'purposes', title: 'Purposes and legal basis' },
  { id: 'retention', title: 'Retention periods' },
  { id: 'recipients', title: 'Recipients and processors' },
  { id: 'transfers', title: 'International transfers' },
  { id: 'rights', title: 'Your rights' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'security', title: 'Security' },
  { id: 'changes', title: 'Changes to this policy' }
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="2026-05-20"
      sections={sections}
      intro={
        <p>
          This Privacy Policy explains how Dragonfly Trimarans Marketplace
          collects, uses, shares and protects your personal data in accordance
          with Regulation (EU) 2016/679 (GDPR) and the French Data Protection
          Act.
        </p>
      }
    >
      <Section id="controller" title="1. Data controller">
        <p>
          The data controller is <Placeholder>Legal entity name</Placeholder>,
          located at <Placeholder>full postal address</Placeholder>. You can
          contact us at <Placeholder>privacy contact email</Placeholder> or via
          our <a href="/contact">contact form</a>.
        </p>
        <p>
          We have not appointed a Data Protection Officer (DPO) as we are not
          legally required to do so. <Placeholder>Adjust if you have a DPO</Placeholder>
        </p>
      </Section>

      <Section id="data" title="2. What data we collect">
        <h3>Account data</h3>
        <ul>
          <li>Name, email address, hashed password</li>
          <li>OAuth identifiers (Google) if you sign in with a social provider</li>
          <li>Account role (user, admin) and billing data if applicable</li>
        </ul>
        <h3>Listing data</h3>
        <ul>
          <li>
            Information you publish in your boat listings: model, year, price,
            country, description, specifications, photos
          </li>
          <li>Contact preferences associated with the listing</li>
        </ul>
        <h3>Payment data</h3>
        <ul>
          <li>
            Payment metadata (amount, currency, plan, transaction ID). Card
            details are collected and processed directly by Stripe and are{' '}
            <strong>never stored on our servers</strong>.
          </li>
        </ul>
        <h3>Technical and usage data</h3>
        <ul>
          <li>
            IP address, browser, device type, pages viewed, listing view
            counts
          </li>
          <li>Logs needed for security and abuse prevention</li>
        </ul>
        <h3>Communication data</h3>
        <ul>
          <li>
            Messages you send through the contact form or by email
          </li>
        </ul>
      </Section>

      <Section id="purposes" title="3. Purposes and legal basis">
        <ul>
          <li>
            <strong>Provide the service</strong> (account, listings, payments) —{' '}
            <em>performance of a contract</em>
          </li>
          <li>
            <strong>Security, fraud and abuse prevention</strong> (rate
            limiting, reCAPTCHA, logs) — <em>legitimate interest</em>
          </li>
          <li>
            <strong>Comply with legal obligations</strong> (accounting,
            responses to law-enforcement requests) — <em>legal obligation</em>
          </li>
          <li>
            <strong>Audience measurement and product improvement</strong>{' '}
            (Google Analytics) — <em>consent</em>
          </li>
          <li>
            <strong>Transactional emails</strong> (account, renewal reminders) —{' '}
            <em>performance of a contract</em>
          </li>
        </ul>
      </Section>

      <Section id="retention" title="4. Retention periods">
        <ul>
          <li>
            <strong>Account data:</strong> for the duration of the account, plus
            up to 3 years of inactivity, then deleted or anonymized
          </li>
          <li>
            <strong>Listings:</strong> until expiry or deletion by the user;
            archived for up to 12 months for moderation history
          </li>
          <li>
            <strong>Payment records:</strong> 10 years (accounting obligation)
          </li>
          <li>
            <strong>Server logs:</strong> up to 12 months
          </li>
          <li>
            <strong>Analytics:</strong> up to 14 months (Google Analytics
            default)
          </li>
        </ul>
      </Section>

      <Section id="recipients" title="5. Recipients and processors">
        <p>
          Your data may be processed by the following sub-processors, each
          bound by a data processing agreement:
        </p>
        <ul>
          <li>
            <strong>Neon</strong> — database hosting (EU region)
          </li>
          <li>
            <strong>Cloudflare R2</strong> — image storage and CDN
          </li>
          <li>
            <strong>Stripe Payments Europe, Limited</strong> — payment processing
          </li>
          <li>
            <strong>Resend</strong> and/or SMTP provider — transactional emails
          </li>
          <li>
            <strong>Google LLC</strong> — Google Analytics, Google reCAPTCHA,
            Google OAuth sign-in
          </li>
          <li>
            <strong>
              <Placeholder>hosting provider, e.g. Hostinger</Placeholder>
            </strong>{' '}
            — VM hosting via Coolify
          </li>
        </ul>
      </Section>

      <Section id="transfers" title="6. International transfers">
        <p>
          Some of our processors (Google, Cloudflare) may transfer data outside
          the European Economic Area. Such transfers are framed by the European
          Commission's Standard Contractual Clauses and additional safeguards
          where required.
        </p>
      </Section>

      <Section id="rights" title="7. Your rights">
        <p>Under GDPR you have the right to:</p>
        <ul>
          <li>access your personal data</li>
          <li>rectify inaccurate data</li>
          <li>request erasure ("right to be forgotten")</li>
          <li>request restriction of processing</li>
          <li>data portability</li>
          <li>object to processing based on legitimate interest</li>
          <li>
            withdraw your consent at any time (for analytics: through the{' '}
            <a href="/policies">Cookie Policy</a> or the "Cookie settings" link
            in the footer)
          </li>
        </ul>
        <p>
          To exercise these rights, contact us via the{' '}
          <a href="/contact">contact form</a>. We will reply within one month.
        </p>
        <p>
          If you believe we are not complying with the GDPR, you have the right
          to lodge a complaint with the French data protection authority (CNIL,{' '}
          <a
            href="https://www.cnil.fr/en/plaintes"
            target="_blank"
            rel="noopener noreferrer"
          >
            cnil.fr
          </a>
          ) or the supervisory authority in your country of residence.
        </p>
      </Section>

      <Section id="cookies" title="8. Cookies">
        <p>
          We use cookies and similar technologies. See our dedicated{' '}
          <a href="/policies">Cookie Policy</a> for the full list and to manage
          your preferences.
        </p>
      </Section>

      <Section id="security" title="9. Security">
        <p>
          We implement industry-standard technical and organizational measures
          (TLS encryption, hashed passwords, access controls, regular backups,
          security monitoring) to protect your data against unauthorized
          access, alteration or loss.
        </p>
      </Section>

      <Section id="changes" title="10. Changes to this policy">
        <p>
          We may update this policy. Material changes will be notified through
          the site or by email when appropriate. The "Last updated" date at the
          top reflects the latest version.
        </p>
      </Section>

      <p className="text-13 text-darkgrey italic">
        Note: this document is a template provided for compliance purposes. It
        must be reviewed and completed by a qualified professional before being
        published.
      </p>
    </LegalLayout>
  );
}
