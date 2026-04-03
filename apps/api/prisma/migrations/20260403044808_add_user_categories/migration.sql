-- DropIndex
DROP INDEX "expense_categories_name_key";

-- AlterTable
ALTER TABLE "expense_categories" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
