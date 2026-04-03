-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('CASH', 'CREDIT');

-- AlterTable
ALTER TABLE "personal_debts" ADD COLUMN     "debtType" "DebtType" NOT NULL DEFAULT 'CASH';
