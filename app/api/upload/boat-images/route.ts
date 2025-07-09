import { NextRequest, NextResponse } from "next/server";
import { uploadImagesForBoatWithWebP, validateR2Config } from "@/utils/cloudflare/r2";

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

    if (!boatId) {
      return NextResponse.json({ error: "boatId is required" }, { status: 400 });
    }

    // Récupérer tous les fichiers
    const files: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    });

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

    console.log(`📤 Uploading ${files.length} files for boat ID: ${boatId}`);

    // Upload tous les fichiers en parallèle avec conversion WebP
    const results = await uploadImagesForBoatWithWebP(files, boatId, 80);

    // Séparer les succès et les échecs
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);

    if (failedUploads.length > 0) {
      console.error(`❌ ${failedUploads.length} uploads failed:`, failedUploads);
      return NextResponse.json({
        success: false,
        error: `${failedUploads.length} files failed to upload`,
        successfulUploads: successfulUploads.map(r => ({ url: r.url, key: r.key })),
        errors: failedUploads.map(r => r.error)
      }, { status: 500 });
    }

    const uploadedUrls = successfulUploads.map(result => result.url!);
    
    console.log(`✅ Successfully uploaded ${uploadedUrls.length} files for boat ${boatId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedUrls.length} images`,
      urls: uploadedUrls,
      keys: successfulUploads.map(r => r.key!)
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
} 