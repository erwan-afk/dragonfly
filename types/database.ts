import { Prisma } from '@prisma/client';

// Types principaux depuis Prisma
export type User = Prisma.userGetPayload<{
  include: {
    boats: true;
    payments: true;
    customer: true;
  };
}>;

export type Boat = Prisma.boatGetPayload<{
  include: {
    user: true;
    payments: true;
  };
}>;

export type Payment = Prisma.paymentGetPayload<{
  include: {
    user: true;
    boat: true;
  };
}>;

export type Customer = Prisma.customerGetPayload<{
  include: {
    user: true;
  };
}>;

export type Product = Prisma.productGetPayload<{
  include: {
    prices: true;
  };
}>;

export type Price = Prisma.priceGetPayload<{
  include: {
    product: true;
  };
}>;

// Types pour les composants Stripe (compatibilité)
export type StripePrice = Prisma.priceGetPayload<{}>;
export type StripeProduct = Prisma.productGetPayload<{}>;

export type ProductWithPrices = Prisma.productGetPayload<{
  include: {
    prices: true;
  };
}>;

// Types pour les relations
export type UserWithBoats = Prisma.userGetPayload<{
  include: { boats: true };
}>;

export type UserSimple = Prisma.userGetPayload<{}>;

// Types pour les formulaires/inputs
export type UserCreateInput = Prisma.userCreateInput;
export type UserUpdateInput = Prisma.userUpdateInput;
export type BoatCreateInput = Prisma.boatCreateInput;
export type BoatUpdateInput = Prisma.boatUpdateInput;

// Enums
export { Role, PricingType, PricingInterval } from '@prisma/client';

// Type générique pour le JSON
export type Json = Prisma.JsonValue; 