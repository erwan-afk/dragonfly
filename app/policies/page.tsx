import LegalLayout, { Section } from '@/components/ui/LegalLayout/LegalLayout';
import CookieSettingsButton from '@/components/ui/CookieConsent/CookieSettingsButton';

export const metadata = {
  title: 'Cookie Policy',
  description:
    'How Dragonfly Trimarans Marketplace uses cookies and how you can manage them.'
};

const sections = [
  { id: 'what', title: 'What is a cookie?' },
  { id: 'categories', title: 'Cookie categories we use' },
  { id: 'list', title: 'List of cookies' },
  { id: 'manage', title: 'Managing your preferences' },
  { id: 'third-party', title: 'Third-party services' },
  { id: 'changes', title: 'Changes' }
];

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      lastUpdated="2026-05-20"
      sections={sections}
      intro={
        <p>
          This Cookie Policy explains what cookies are, which ones we use on
          the Dragonfly Trimarans Marketplace, and how you can manage them.
          See our <a href="/privacy">Privacy Policy</a> for more on personal
          data processing.
        </p>
      }
    >
      <Section id="what" title="1. What is a cookie?">
        <p>
          A cookie is a small text file stored on your device by your browser
          when you visit a website. It allows the site to remember your
          actions or preferences over time. We also use similar technologies
          such as local storage.
        </p>
      </Section>

      <Section id="categories" title="2. Cookie categories we use">
        <ul>
          <li>
            <strong>Essential cookies</strong> — required for the site to
            work: authentication session, security (CSRF protection,
            anti-spam), and storing your cookie choices. These cannot be
            disabled.
          </li>
          <li>
            <strong>Analytics cookies</strong> — measure audience and improve
            the site. Loaded only with your consent.
          </li>
          <li>
            <strong>Marketing cookies</strong> — reserved for future
            advertising features. None are currently set.
          </li>
        </ul>
      </Section>

      <Section id="list" title="3. List of cookies">
        <div className="overflow-x-auto">
          <table className="w-full text-14 border-collapse">
            <thead>
              <tr className="bg-lightgrey/60 text-oceanblue">
                <th className="text-left p-8 border border-stonegrey/20">
                  Name
                </th>
                <th className="text-left p-8 border border-stonegrey/20">
                  Category
                </th>
                <th className="text-left p-8 border border-stonegrey/20">
                  Purpose
                </th>
                <th className="text-left p-8 border border-stonegrey/20">
                  Duration
                </th>
                <th className="text-left p-8 border border-stonegrey/20">
                  Issuer
                </th>
              </tr>
            </thead>
            <tbody className="text-darkgrey">
              <tr>
                <td className="p-8 border border-stonegrey/20 font-mono">
                  better-auth.session_token
                </td>
                <td className="p-8 border border-stonegrey/20">Essential</td>
                <td className="p-8 border border-stonegrey/20">
                  Authentication session
                </td>
                <td className="p-8 border border-stonegrey/20">7 days</td>
                <td className="p-8 border border-stonegrey/20">Dragonfly</td>
              </tr>
              <tr>
                <td className="p-8 border border-stonegrey/20 font-mono">
                  cookie-consent
                </td>
                <td className="p-8 border border-stonegrey/20">Essential</td>
                <td className="p-8 border border-stonegrey/20">
                  Stores your cookie preferences (local storage)
                </td>
                <td className="p-8 border border-stonegrey/20">12 months</td>
                <td className="p-8 border border-stonegrey/20">Dragonfly</td>
              </tr>
              <tr>
                <td className="p-8 border border-stonegrey/20 font-mono">
                  _GRECAPTCHA
                </td>
                <td className="p-8 border border-stonegrey/20">Essential</td>
                <td className="p-8 border border-stonegrey/20">
                  Bot and abuse protection on forms
                </td>
                <td className="p-8 border border-stonegrey/20">6 months</td>
                <td className="p-8 border border-stonegrey/20">Google</td>
              </tr>
              <tr>
                <td className="p-8 border border-stonegrey/20 font-mono">
                  _ga, _ga_*
                </td>
                <td className="p-8 border border-stonegrey/20">Analytics</td>
                <td className="p-8 border border-stonegrey/20">
                  Audience measurement (Google Analytics 4)
                </td>
                <td className="p-8 border border-stonegrey/20">13 months</td>
                <td className="p-8 border border-stonegrey/20">Google</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-13 text-darkgrey italic">
          Stripe may set its own cookies on payment pages when you proceed to
          checkout. See Stripe's cookie policy for details.
        </p>
      </Section>

      <Section id="manage" title="4. Managing your preferences">
        <p>
          When you first visit the site, a banner lets you accept, reject or
          customize non-essential cookies. You can change your choices at any
          time:
        </p>
        <div className="flex flex-row items-center gap-12 my-12">
          <CookieSettingsButton />
          <span className="text-13 text-darkgrey">
            ← click to reopen the preferences panel
          </span>
        </div>
        <p>
          You can also block or delete cookies directly in your browser
          settings. Doing so may affect certain features of the Service.
        </p>
      </Section>

      <Section id="third-party" title="5. Third-party services">
        <p>The following third parties may set cookies on our site:</p>
        <ul>
          <li>
            <strong>Google Analytics</strong> — audience measurement, loaded
            only with consent.{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google privacy policy
            </a>
          </li>
          <li>
            <strong>Google reCAPTCHA</strong> — bot protection, treated as
            essential for security. Same policy as above.
          </li>
          <li>
            <strong>Stripe</strong> — payment fraud detection on checkout
            pages.{' '}
            <a
              href="https://stripe.com/cookies-policy/legal"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stripe cookie policy
            </a>
          </li>
        </ul>
      </Section>

      <Section id="changes" title="6. Changes">
        <p>
          We may update this Cookie Policy as cookies on the site evolve. The
          "Last updated" date reflects the latest version.
        </p>
      </Section>
    </LegalLayout>
  );
}
