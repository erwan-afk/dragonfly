import { NextResponse } from 'next/server';
import { getProductsFromDatabase } from '@/utils/database/products';

export async function GET() {
  try {
    console.log('🔍 API: Fetching products from database...');
    
    const products = await getProductsFromDatabase();
    
    console.log('✅ API: Products fetched successfully');
    return NextResponse.json({ products });
  } catch (error) {
    console.error('❌ API: Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 