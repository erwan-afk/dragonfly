import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StripePaymentForm from '@/components/ui/StripePaymentForm/StripePaymentForm';

// Mock the LoadingProvider context used inside the component.
vi.mock('../../../components/ui/LoadingProvider', () => ({
  useLoading: () => ({ startLoading: vi.fn(), stopLoading: vi.fn() })
}));

vi.mock('../../../components/ui/PaymentProgress', () => ({
  default: () => null
}));

// confirmPayment is the one under test; useElements just needs to return a truthy value.
const confirmPaymentMock = vi.fn();
vi.mock('@stripe/react-stripe-js', () => ({
  PaymentElement: () => null,
  useStripe: () => ({ confirmPayment: confirmPaymentMock }),
  useElements: () => ({})
}));

global.fetch = vi.fn(async () => ({
  ok: true,
  json: async () => ({ success: true })
})) as any;

describe('StripePaymentForm — purchase tracking must follow real payment status', () => {
  beforeEach(() => {
    confirmPaymentMock.mockReset();
    (global.fetch as any).mockClear();
  });

  const baseProps = {
    onError: vi.fn(),
    onBeforePayment: vi.fn(async () => ({ success: true, boatId: 'boat_1' })),
    amount: 25000,
    currency: 'eur',
    priceId: 'price_1',
    productId: 'prod_1',
    userId: 'user_1',
    paymentIntentId: 'pi_test_123',
    returnUrl: 'http://localhost/account'
  };

  it('does NOT call onSuccess when confirmPayment returns no error but the PaymentIntent did not actually succeed', async () => {
    // Real-world case: card declined asynchronously / requires further action.
    // stripe.confirmPayment({redirect: 'if_required'}) resolves with no `error`
    // but `paymentIntent.status` is not 'succeeded'.
    confirmPaymentMock.mockResolvedValue({
      paymentIntent: { id: 'pi_test_123', status: 'requires_action' }
    });

    const onSuccess = vi.fn();
    render(<StripePaymentForm {...baseProps} onSuccess={onSuccess} />);

    fireEvent.submit(screen.getByRole('button', { name: /pay now/i }).closest('form')!);

    await waitFor(() => {
      expect(confirmPaymentMock).toHaveBeenCalled();
    });

    // This is the bug: the current implementation only checks `error` and
    // ignores `paymentIntent.status`, so it calls onSuccess() (and therefore
    // fires the GA4 'purchase' event) even though the payment never succeeded.
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('DOES call onSuccess when the PaymentIntent actually succeeded', async () => {
    confirmPaymentMock.mockResolvedValue({
      paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
    });

    const onSuccess = vi.fn();
    render(<StripePaymentForm {...baseProps} onSuccess={onSuccess} />);

    fireEvent.submit(screen.getByRole('button', { name: /pay now/i }).closest('form')!);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
