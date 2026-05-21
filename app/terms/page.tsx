import LegalLayout, {
  Section,
  Placeholder
} from '@/components/ui/LegalLayout/LegalLayout';

export const metadata = {
  title: 'Terms of Use',
  description:
    'Terms governing the use of the Dragonfly Trimarans Marketplace.'
};

const sections = [
  { id: 'purpose', title: 'Purpose' },
  { id: 'acceptance', title: 'Acceptance of terms' },
  { id: 'access', title: 'Access to the service' },
  { id: 'accounts', title: 'User accounts' },
  { id: 'content', title: 'User content and prohibited content' },
  { id: 'moderation', title: 'Moderation and removal' },
  { id: 'ip', title: 'Intellectual property' },
  { id: 'liability', title: 'Liability' },
  { id: 'termination', title: 'Termination' },
  { id: 'law', title: 'Governing law and disputes' }
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Use"
      lastUpdated="2026-05-20"
      sections={sections}
      intro={
        <p>
          These Terms of Use govern the use of the Dragonfly Trimarans
          Marketplace website (the "Service"). By creating an account or using
          the Service, you accept these Terms in full. For sales of paid plans,
          see also our <a href="/sales-terms">Sales Terms</a>.
        </p>
      }
    >
      <Section id="purpose" title="1. Purpose">
        <p>
          The Service is a marketplace dedicated to the sale of Dragonfly
          trimarans. It allows users to publish boat listings, browse
          listings, contact sellers, and subscribe to paid advertising plans.
        </p>
      </Section>

      <Section id="acceptance" title="2. Acceptance of terms">
        <p>
          By accessing the Service you agree to be bound by these Terms. If you
          do not agree, do not use the Service. We may update these Terms; the
          updated version applies from the "Last updated" date shown above. If
          changes are material, we will notify registered users by email or
          through the Service.
        </p>
      </Section>

      <Section id="access" title="3. Access to the service">
        <p>
          The Service is provided free of charge for browsing. Publishing a
          listing requires a paid plan as described on the{' '}
          <a href="/pricing">Pricing</a> page. We may temporarily restrict
          access for maintenance, security or technical reasons.
        </p>
      </Section>

      <Section id="accounts" title="4. User accounts">
        <ul>
          <li>You must be at least 18 years old to create an account.</li>
          <li>
            You are responsible for the accuracy of the information you
            provide and for keeping your credentials confidential.
          </li>
          <li>One account per natural or legal person.</li>
          <li>
            You may delete your account at any time from your account settings;
            see the <a href="/privacy">Privacy Policy</a> for data retention
            after deletion.
          </li>
        </ul>
      </Section>

      <Section id="content" title="5. User content and prohibited content">
        <p>
          You are solely responsible for the content you publish (listings,
          photos, messages). You warrant that you hold all rights to it. You
          must not publish content that is:
        </p>
        <ul>
          <li>illegal, fraudulent, misleading or deceptive;</li>
          <li>
            infringing on third-party rights (trademark, copyright, image rights);
          </li>
          <li>defamatory, hateful, threatening, or harassing;</li>
          <li>
            unrelated to Dragonfly trimarans or to legitimate boat-related
            activity;
          </li>
          <li>
            duplicate of an existing active listing for the same boat.
          </li>
        </ul>
      </Section>

      <Section id="moderation" title="6. Moderation and removal">
        <p>
          We may, at our discretion, edit, suspend or remove any listing that
          breaches these Terms or applicable law, with or without prior notice.
          Reported content will be reviewed promptly upon receipt of a
          compliant notification, in accordance with article 6 of the LCEN.
        </p>
      </Section>

      <Section id="ip" title="7. Intellectual property">
        <p>
          The structure, graphics and software of the Service are the property
          of <Placeholder>Legal entity name</Placeholder>. By publishing
          content on the Service, you grant us a non-exclusive, royalty-free,
          worldwide license to host, display and promote your listing within
          the Service for as long as the listing remains online.
        </p>
      </Section>

      <Section id="liability" title="8. Liability">
        <p>
          The Service connects buyers and sellers of boats. We are not a party
          to the sales transactions and bear no responsibility for the
          accuracy of listings, the quality of boats, or the conduct of users.
          Buyers and sellers are responsible for inspecting boats, negotiating
          terms, and complying with applicable laws.
        </p>
        <p>
          To the extent permitted by law, we exclude any liability for
          indirect or consequential damages arising from the use of the
          Service.
        </p>
      </Section>

      <Section id="termination" title="9. Termination">
        <p>
          We may suspend or terminate your access in case of breach of these
          Terms, fraud, or repeated abusive behavior, without compensation. You
          may stop using the Service at any time.
        </p>
      </Section>

      <Section id="law" title="10. Governing law and disputes">
        <p>
          These Terms are governed by French law. In the event of a dispute,
          and before any legal action, we encourage you to contact us first via
          the <a href="/contact">contact form</a>. Consumers may also use the
          European Online Dispute Resolution platform at{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
          . Subject to mandatory provisions of consumer law, French courts
          shall have exclusive jurisdiction.
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
