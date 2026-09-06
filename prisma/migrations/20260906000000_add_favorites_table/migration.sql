-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "boat_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_boat_id_key" ON "favorites"("user_id", "boat_id");

-- CreateIndex
CREATE INDEX "favorites_boat_id_idx" ON "favorites"("boat_id");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_boat_id_fkey" FOREIGN KEY ("boat_id") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
