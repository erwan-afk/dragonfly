import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2WithWebP, uploadImageToTempR2WithWebP, validateR2Config } from "@/utils/cloudflare/r2";

export async function POST(req: NextRequest) {
  // Valider la configuration R2
  const configValidation = validateR2Config();
  if (!configValidation.valid) {
    console.error('Missing R2 configuration:', configValidation.missing);
    return NextResponse.json(
      { error: `Missing R2 configuration: ${configValidation.missing.join(', ')}` },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const boatId = formData.get("boatId") as string;
    const sessionId = formData.get("sessionId") as string;

    // Valider qu'au moins un des deux identifiants est fourni
    if (!boatId && !sessionId) {
      return NextResponse.json({ 
        error: "Either boatId or sessionId is required" 
      }, { status: 400 });
    }

    // Récupérer tous les fichiers (support multiple files)
    const files: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    });

    // Support aussi pour un seul fichier avec la clé "file"
    const singleFile = formData.get("file") as File;
    if (singleFile && files.length === 0) {
      files.push(singleFile);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Valider chaque fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 3 * 1024 * 1024; // 3MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name}: Only JPEG, PNG and WebP images are allowed` },
          { status: 400 }
        );
      }

      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name}: File size must be less than 3MB` },
          { status: 400 }
        );
      }
    }

    console.log(`📤 Uploading ${files.length} file(s) for ${boatId ? `boat ID: ${boatId}` : `session ID: ${sessionId}`}`);

    // Upload des fichiers
    const results = [];

    for (const file of files) {
      let result;
      
      if (boatId) {
        // Upload direct vers le dossier du bateau avec conversion WebP
        result = await uploadImageToR2WithWebP(file, boatId, 80);
      } else {
        // Upload vers le dossier temporaire avec conversion WebP
        result = await uploadImageToTempR2WithWebP(file, sessionId, 80);
      }

      if (!result.success) {
        console.error(`R2 upload failed for ${file.name}:`, result.error);
        return NextResponse.json(
          { error: `Upload failed for ${file.name}: ${result.error}` },
          { status: 500 }
        );
      }

      results.push({
        filename: file.name,
        url: result.url,
        key: result.key
      });
    }

    console.log(`✅ Successfully uploaded ${results.length} file(s)`);

    // Retourner la réponse appropriée selon le nombre de fichiers
    if (results.length === 1) {
      // Compatibilité avec l'ancienne API pour un seul fichier
      return NextResponse.json({
        success: true,
        url: results[0].url,
        key: results[0].key,
      });
    } else {
      // Nouvelle réponse pour plusieurs fichiers
      return NextResponse.json({
        success: true,
        count: results.length,
        files: results,
        urls: results.map(r => r.url),
        keys: results.map(r => r.key)
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
