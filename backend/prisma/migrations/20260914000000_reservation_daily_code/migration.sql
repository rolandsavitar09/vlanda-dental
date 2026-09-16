-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "code" TEXT;

-- Backfill existing reservations with daily codes.
WITH numbered AS (
    SELECT
        "id",
        'RSV' || LPAD(ROW_NUMBER() OVER (
            PARTITION BY DATE("date")
            ORDER BY "createdAt", "id"
        )::TEXT, 4, '0') AS "nextCode"
    FROM "Reservation"
)
UPDATE "Reservation"
SET "code" = numbered."nextCode"
FROM numbered
WHERE "Reservation"."id" = numbered."id";

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_date_code_key" ON "Reservation"("date", "code");
