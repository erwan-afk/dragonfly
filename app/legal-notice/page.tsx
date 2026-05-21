import LegalLayout, { Section } from '@/components/ui/LegalLayout/LegalLayout';
import { legalConfig as c } from '@/utils/legal-config';

export const metadata = {
  title: 'Legal Notice',
  description: 'Legal information about the Dragonfly Trimarans Marketplace.'
};

const sections = [
  { id: 'publisher', title: 'Publisher of the website' },
  { id: 'host', title: 'Hosting provider' },
  { id: 'subprocessors', title: 'Third-party services' },
  { id: 'ip', title: 'Intellectual property' },
  { id: 'liability', title: 'Liability' },
  { id: 'contact', title: 'Contact' }
];

export default function LegalNoticePage() {
  return (
    <LegalLayout
      title="Legal Notice"
      lastUpdated="2026-05-20"
      sections={sections}
      intro={
        <p>
          This page provides legal information about the publisher and host of
          the Dragonfly Trimarans Marketplace website, in compliance with the
          French Law for Confidence in the Digital Economy (LCEN) of June 21,
          2004.
        </p>
      }
    >
      <Section id="publisher" title="1. Publisher of the website">
        <p>
          The website is published by <strong>{c.entityName}</strong>, a{' '}
          {c.companyForm} with a share capital of {c.shareCapital}, registered
          under SIRET <strong>{c.siret}</strong>, with its registered office
          located at {c.address}.
        </p>
        <ul>
          <li>
            <strong>Director of publication:</strong> {c.publicationDirector}
          </li>
          <li>
            <strong>Email:</strong> {c.contactEmail}
          </li>
          <li>
            <strong>VAT number:</strong> {c.vatNumber}
          </li>
        </ul>
      </Section>

      <Section id="host" title="2. Hosting provider">
        <p>
          The website is hosted by <strong>{c.hostName}</strong>, located at{' '}
          {c.hostAddress}. Contact: {c.hostContact}.
        </p>
      </Section>

      <Section id="subprocessors" title="3. Third-party services">
        <p>
          The site relies on the following third-party providers for technical
          operation:
        </p>
        <ul>
          <li>
            <strong>Database:</strong> Neon (PostgreSQL hosting)
          </li>
          <li>
            <strong>Image storage and delivery:</strong> Cloudflare R2
          </li>
          <li>
            <strong>Payments:</strong> Stripe Payments Europe, Limited
          </li>
          <li>
            <strong>Transactional email:</strong> Resend / Nodemailer SMTP
          </li>
          <li>
            <strong>Audience measurement:</strong> Google Analytics (only when
            consent has been given)
          </li>
          <li>
            <strong>Anti-spam:</strong> Google reCAPTCHA v3
          </li>
        </ul>
        <p>
          See our <a href="/privacy">Privacy Policy</a> for the role of each
          provider in personal data processing.
        </p>
      </Section>

      <Section id="ip" title="4. Intellectual property">
        <p>
          The structure, design, graphics, logos, and content of the site (apart
          from user-submitted content) are the exclusive property of{' '}
          <strong>{c.entityName}</strong> or its licensors. Reproduction, even
          partial, is prohibited without prior written permission.
        </p>
        <p>
          Listings published by users (text, photos, videos) remain the property
          of their respective authors, who grant the site a non-exclusive
          license to display them for the duration of the listing.
        </p>
      </Section>

      <Section id="liability" title="5. Liability">
        <p>
          The publisher acts as a hosting provider for user-submitted listings
          within the meaning of article 6 of the LCEN. Listings are published
          under the responsibility of their authors. We may remove any content
          reported as illicit upon receipt of a compliant notification.
        </p>
        <p>
          The publisher makes its best effort to keep the site available and
          accurate but offers no guarantee of uninterrupted service.
        </p>
      </Section>

      <Section id="contact" title="6. Contact">
        <p>
          For any question regarding this notice, please use the{' '}
          <a href="/contact">contact form</a>.
        </p>
      </Section>
    </LegalLayout>
  );
}
