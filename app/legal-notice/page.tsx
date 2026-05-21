import LegalLayout, {
  Section,
  Placeholder
} from '@/components/ui/LegalLayout/LegalLayout';

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
          The website is published by <Placeholder>Legal entity name</Placeholder>,
          a <Placeholder>company form, e.g. SAS / SARL / sole proprietor</Placeholder>{' '}
          with a share capital of <Placeholder>amount</Placeholder>, registered
          under SIRET <Placeholder>SIRET number</Placeholder>, with its
          registered office located at{' '}
          <Placeholder>full postal address</Placeholder>.
        </p>
        <ul>
          <li>
            <strong>Director of publication:</strong>{' '}
            <Placeholder>Full name</Placeholder>
          </li>
          <li>
            <strong>Email:</strong> <Placeholder>contact email</Placeholder>
          </li>
          <li>
            <strong>VAT number:</strong>{' '}
            <Placeholder>intra-EU VAT number if applicable</Placeholder>
          </li>
        </ul>
      </Section>

      <Section id="host" title="2. Hosting provider">
        <p>
          The website is hosted by <Placeholder>hosting company name</Placeholder>,
          located at <Placeholder>full address of host</Placeholder>. Contact:{' '}
          <Placeholder>support contact / website</Placeholder>.
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
          <Placeholder>Legal entity name</Placeholder> or its licensors.
          Reproduction, even partial, is prohibited without prior written
          permission.
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

      <p className="text-13 text-darkgrey italic">
        Note: this document is a template provided for compliance purposes. It
        must be reviewed and completed by a qualified professional before being
        published.
      </p>
    </LegalLayout>
  );
}
