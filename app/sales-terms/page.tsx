import LegalLayout, { Section } from '@/components/ui/LegalLayout/LegalLayout';
import { legalConfig as c } from '@/utils/legal-config';

export const metadata = {
  title: 'Sales Terms',
  description:
    'Terms of sale for advertising plans on Dragonfly Trimarans Marketplace.'
};

const sections = [
  { id: 'purpose', title: 'Purpose' },
  { id: 'seller', title: 'Seller identification' },
  { id: 'offers', title: 'Offers and prices' },
  { id: 'order', title: 'Order process' },
  { id: 'payment', title: 'Payment' },
  { id: 'delivery', title: 'Delivery of the service' },
  { id: 'withdrawal', title: 'Right of withdrawal' },
  { id: 'invoice', title: 'Invoicing' },
  { id: 'complaints', title: 'Complaints and mediation' },
  { id: 'law', title: 'Governing law' }
];

export default function SalesTermsPage() {
  return (
    <LegalLayout
      title="Sales Terms"
      lastUpdated="2026-05-20"
      sections={sections}
      intro={
        <p>
          These Sales Terms govern the purchase of paid advertising plans on
          the Dragonfly Trimarans Marketplace. They are accepted by the buyer
          upon confirmation of the order. They complete, without replacing,
          our <a href="/terms">Terms of Use</a>.
        </p>
      }
    >
      <Section id="purpose" title="1. Purpose">
        <p>
          The seller offers paid advertising plans (Start Line, Mid-Course,
          Podium, Renewal) and complementary options (e.g. Boost 48h) allowing
          users to publish and promote boat listings on the Service.
        </p>
      </Section>

      <Section id="seller" title="2. Seller identification">
        <p>
          Seller: <strong>{c.entityName}</strong>, SIRET <strong>{c.siret}</strong>,
          registered office at {c.address}. Contact: {c.contactEmail}.
        </p>
      </Section>

      <Section id="offers" title="3. Offers and prices">
        <p>
          Plan features and prices are described on the{' '}
          <a href="/pricing">Pricing</a> page. Prices are displayed in the
          chosen currency and include VAT where applicable. Prices may change
          at any time but the price applicable to an order is the one shown at
          the moment of validation.
        </p>
      </Section>

      <Section id="order" title="4. Order process">
        <ol>
          <li>Selection of a plan from the Pricing page</li>
          <li>Completion of the listing details and choice of options</li>
          <li>Review of the order summary and total price</li>
          <li>Payment through Stripe</li>
          <li>
            Order confirmation by email upon successful payment; the listing
            is published immediately
          </li>
        </ol>
      </Section>

      <Section id="payment" title="5. Payment">
        <p>
          Payment is processed by Stripe Payments Europe, Limited. Accepted
          payment methods are displayed at checkout (credit/debit cards and
          any other method enabled by Stripe). Card data is collected and
          stored by Stripe and never by the seller.
        </p>
      </Section>

      <Section id="delivery" title="6. Delivery of the service">
        <p>
          The service (publication of the listing) is provided immediately
          after payment confirmation, for the duration described in the
          chosen plan. The seller takes reasonable measures to keep the
          Service available but offers no guarantee of uninterrupted service.
        </p>
      </Section>

      <Section id="withdrawal" title="7. Right of withdrawal">
        <p>
          In application of article L.221-28, 1° of the French Consumer Code,
          consumers expressly acknowledge that, by requesting immediate
          publication of their listing upon payment, they{' '}
          <strong>
            waive their right of withdrawal once the service has been fully
            performed
          </strong>
          .
        </p>
        <p>
          If you have not yet been able to publish your listing or use the
          paid feature, please contact us via the{' '}
          <a href="/contact">contact form</a> to discuss a possible refund on
          a case-by-case basis.
        </p>
      </Section>

      <Section id="invoice" title="8. Invoicing">
        <p>
          An electronic invoice is issued for every paid order and made
          available in your account dashboard or by email. {c.invoiceNote}.
        </p>
      </Section>

      <Section id="complaints" title="9. Complaints and mediation">
        <p>
          For any complaint, please first contact us at {c.contactEmail} or
          via the <a href="/contact">contact form</a>. If no satisfactory
          solution is found within 60 days, consumers domiciled in the
          European Union may refer the dispute to a consumer mediator:
        </p>
        <p>
          <a href={c.mediatorUrl} target="_blank" rel="noopener noreferrer">
            {c.mediatorName}
          </a>
        </p>
        <p>
          Consumers may also use the European Online Dispute Resolution
          platform:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Section>

      <Section id="law" title="10. Governing law">
        <p>
          These Sales Terms are governed by French law. Subject to mandatory
          consumer protection provisions, French courts shall have exclusive
          jurisdiction.
        </p>
      </Section>
    </LegalLayout>
  );
}
