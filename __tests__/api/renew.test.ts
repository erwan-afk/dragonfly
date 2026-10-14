import { describe, expect, it, vi, beforeEach } from 'vitest';

const getSession = vi.fn();
const retrieve = vi.fn();
const paymentFindFirst = vi.fn();
const paymentCreate = vi.fn((args: any) => ({ __op: 'payment.create', args }));
const boatFindFirst = vi.fn();
const boatUpdate = vi.fn((args: any) => ({ __op: 'boat.update', args }));
const transaction = vi.fn();

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
vi.mock('@/utils/auth/auth', () => ({
  auth: { api: { getSession: (...a: any[]) => getSession(...a) } }
}));
vi.mock('@/utils/stripe/config', () => ({
  stripe: { paymentIntents: { retrieve: (...a: any[]) => retrieve(...a) } }
}));
vi.mock('@/utils/prisma/client', () => ({
  default: {
    payment: {
      findFirst: (...a: any[]) => paymentFindFirst(...a),
      create: (a: any) => paymentCreate(a)
    },
    boat: {
      findFirst: (...a: any[]) => boatFindFirst(...a),
      update: (a: any) => boatUpdate(a)
    },
    $transaction: (...a: any[]) => transaction(...a)
  }
}));

import { POST } from '@/app/api/boats/renew/route';

const call = (body: any) =>
  POST(
    new Request('http://localhost/api/boats/renew', {
      method: 'POST',
      body: JSON.stringify(body)
    }) as any
  );

const succeededIntent = (metadata: Record<string, string> = {}) => ({
  status: 'succeeded',
  amount: 4900,
  metadata
});

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({ user: { id: 'user-1' } });
  retrieve.mockResolvedValue(succeededIntent({ boat_id: 'boat-1', product_id: 'prod-renewal' }));
  paymentFindFirst.mockResolvedValue(null);
  transaction.mockImplementation(async (ops: any[]) =>
    ops.map((op) => (op.__op === 'boat.update' ? { id: 'boat-1', price: { toString: () => '1' } } : { id: 'pay-1' }))
  );
});

describe('POST /api/boats/renew', () => {
  it('rejects anonymous users', async () => {
    getSession.mockResolvedValue(null);
    const res = await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });
    expect(res.status).toBe(401);
  });

  it('requires a payment', async () => {
    const res = await call({ boatId: 'boat-1' });
    expect(res.status).toBe(402);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('refuses an unpaid PaymentIntent', async () => {
    retrieve.mockResolvedValue({ ...succeededIntent(), status: 'requires_payment_method' });
    const res = await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });
    expect(res.status).toBe(402);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('refuses a payment made for another listing', async () => {
    retrieve.mockResolvedValue(succeededIntent({ boat_id: 'other-boat' }));
    const res = await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });
    expect(res.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("does not renew somebody else's listing", async () => {
    boatFindFirst.mockResolvedValue(null);
    const res = await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });
    expect(res.status).toBe(404);
    expect(boatFindFirst.mock.calls[0][0].where).toMatchObject({ id: 'boat-1', userId: 'user-1' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('accepts expired (inactive) listings and extends the real expiry date', async () => {
    boatFindFirst.mockResolvedValue({ id: 'boat-1', expiresAt: new Date('2026-08-04T00:00:00Z') });
    const res = await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });

    expect(res.status).toBe(200);
    expect(boatFindFirst.mock.calls[0][0].where.status).toEqual({ in: ['active', 'inactive'] });

    const update = boatUpdate.mock.calls[0][0];
    expect(update.data.status).toBe('active');
    expect(update.data.expiresAt).toBeInstanceOf(Date);
    // an expired listing restarts from today: strictly in the future, about 3 months ahead
    const days = (update.data.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(85);
    expect(days).toBeLessThan(95);
    // createdAt is no longer touched
    expect(update.data.createdAt).toBeUndefined();
  });

  it('adds the 3 months on top of a running expiry', async () => {
    const current = new Date(Date.now() + 10 * 86_400_000);
    boatFindFirst.mockResolvedValue({ id: 'boat-1', expiresAt: current });
    await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });

    const days = (boatUpdate.mock.calls[0][0].data.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(10 + 85);
  });

  it('records the payment in the same transaction', async () => {
    boatFindFirst.mockResolvedValue({ id: 'boat-1', expiresAt: null });
    await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(paymentCreate.mock.calls[0][0].data).toMatchObject({
      userId: 'user-1',
      boatId: 'boat-1',
      productId: 'prod-renewal',
      amount: 49,
      status: 'completed',
      stripeSessionId: 'pi_1'
    });
  });

  it('never extends twice for the same payment', async () => {
    paymentFindFirst.mockResolvedValue({ id: 'pay-1' });
    const res = await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });
    const json = await res.json();

    expect(json).toMatchObject({ success: true, alreadyRenewed: true });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('survives a concurrent duplicate (unique constraint) without extending twice', async () => {
    boatFindFirst.mockResolvedValue({ id: 'boat-1', expiresAt: null });
    transaction.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    const res = await call({ boatId: 'boat-1', paymentIntentId: 'pi_1' });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ alreadyRenewed: true });
  });
});
