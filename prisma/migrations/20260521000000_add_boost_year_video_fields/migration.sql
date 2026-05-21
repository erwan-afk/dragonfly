-- Add year field to boats
ALTER TABLE "boats" ADD COLUMN IF NOT EXISTS "year" INTEGER;

-- Add boost fields to boats
ALTER TABLE "boats" ADD COLUMN IF NOT EXISTS "boosted_at" TIMESTAMP(6);
ALTER TABLE "boats" ADD COLUMN IF NOT EXISTS "boost_expires_at" TIMESTAMP(6);

-- Add extra photos and video URL fields
ALTER TABLE "boats" ADD COLUMN IF NOT EXISTS "has_extra_photos" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "boats" ADD COLUMN IF NOT EXISTS "video_url" VARCHAR(500);

-- Add index on boost_expires_at
CREATE INDEX IF NOT EXISTS "boats_boost_expires_at_idx" ON "boats"("boost_expires_at");
