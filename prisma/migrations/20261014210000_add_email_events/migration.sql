-- CreateTable
CREATE TABLE "email_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "user_id" TEXT,
    "boat_id" TEXT,
    "subject" TEXT,
    "message_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_events_user_id_created_at_idx" ON "email_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "email_events_to_email_created_at_idx" ON "email_events"("to_email", "created_at");

-- CreateIndex
CREATE INDEX "email_events_created_at_idx" ON "email_events"("created_at");
