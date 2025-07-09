import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Récupérer les métadonnées pour trouver les informations du bateau
    const metadata = session.metadata;
    if (!metadata) {
      return NextResponse.json({ error: "No metadata found" }, { status: 404 });
    }

    // Rechercher le bateau créé pour cette session de paiement
    // Note: En production, vous devriez stocker le boatId dans les métadonnées Stripe
    // ou avoir une table de mapping session_id -> boat_id
    
    return NextResponse.json({
      success: true,
      session_id: sessionId,
      payment_status: session.payment_status,
      metadata: metadata,
      // Le boatId sera généré côté serveur dans le webhook
      // On retourne les métadonnées pour que le client puisse identifier l'annonce
      images_metadata: metadata.images_metadata
    });

  } catch (error) {
    console.error('Error retrieving payment session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve session" },
      { status: 500 }
    );
  }
} 