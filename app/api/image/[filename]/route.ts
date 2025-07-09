import { NextRequest, NextResponse } from "next/server";
import { getImageFromR2, validateR2Config } from "@/utils/cloudflare/r2";

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  const { filename } = params;

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }

  // Valider la configuration R2
  const configValidation = validateR2Config();
  if (!configValidation.valid) {
    console.error('Missing R2 configuration:', configValidation.missing);
    return NextResponse.json(
      { error: `R2 configuration error` },
      { status: 500 }
    );
  }

  try {
    // Le filename peut être soit juste un nom de fichier, soit une clé complète
    // On va essayer de le traiter comme une clé complète d'abord
    let imageKey = filename;
    
    // Si ce n'est pas une clé complète (ne contient pas de slash), 
    // on va chercher dans tous les dossiers boats/*/images/
    if (!filename.includes('/')) {
      // Pour l'instant, on retourne une erreur car on ne peut pas deviner le boat ID
      // Dans une vraie implémentation, on pourrait avoir une API séparée ou 
      // restructurer pour toujours utiliser des clés complètes
      return NextResponse.json({ 
        error: "Please use full image path including boat ID" 
      }, { status: 400 });
    }

    console.log(`📥 Fetching image: ${imageKey}`);

    // Récupérer l'image depuis R2
    const result = await getImageFromR2(imageKey);

    if (!result.success || !result.data) {
      console.log(`❌ Image not found: ${imageKey}`);
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    console.log(`✅ Image served: ${imageKey}`);

    // Déterminer le type de contenu basé sur l'extension si pas fourni
    let contentType = result.contentType || 'image/jpeg';
    if (!result.contentType) {
      const extension = filename.toLowerCase().split('.').pop();
      switch (extension) {
        case 'png':
          contentType = 'image/png';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'jpg':
        case 'jpeg':
        default:
          contentType = 'image/jpeg';
          break;
      }
    }

    return new NextResponse(result.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache 1 an
        "ETag": `"${filename}"`,
      },
    });

  } catch (error) {
    console.error("R2 Image fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
