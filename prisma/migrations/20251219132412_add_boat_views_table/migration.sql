-- AlterTable
ALTER TABLE "boats" ADD COLUMN     "expires_at" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "boat_views" (
    "id" TEXT NOT NULL,
    "boat_id" TEXT NOT NULL,
    "user_id" TEXT,
    "viewed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "session_id" TEXT,

    CONSTRAINT "boat_views_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "boat_views" ADD CONSTRAINT "boat_views_boat_id_fkey" FOREIGN KEY ("boat_id") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "boat_views" ADD CONSTRAINT "boat_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
