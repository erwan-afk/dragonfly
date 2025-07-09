export interface Boat {
  id: string;
  model: string;
  price: number;
  country: string;
  description: string;
  photos: string[];
  user_id: string;
  createdAt: Date;
  currency: string;
  specifications: string[];
  vat_paid: boolean;
  user?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
} 