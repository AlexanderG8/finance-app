/*
  Warnings:

  - You are about to drop the `debt_installments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "debt_installments" DROP CONSTRAINT "debt_installments_debtId_fkey";

-- DropTable
DROP TABLE "debt_installments";
