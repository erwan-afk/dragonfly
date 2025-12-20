-- AlterTable
ALTER TABLE "boats" ADD COLUMN     "product_id" TEXT;

-- AddForeignKey
ALTER TABLE "boats" ADD CONSTRAINT "boats_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
