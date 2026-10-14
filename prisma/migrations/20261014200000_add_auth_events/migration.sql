-- CreateTable
CREATE TABLE "auth_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "detail" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "origin" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_events_user_id_created_at_idx" ON "auth_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "auth_events_email_created_at_idx" ON "auth_events"("email", "created_at");

-- CreateIndex
CREATE INDEX "auth_events_created_at_idx" ON "auth_events"("created_at");
