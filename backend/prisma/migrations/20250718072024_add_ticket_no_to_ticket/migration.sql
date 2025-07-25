/*
  Warnings:

  - A unique constraint covering the columns `[ticketNo]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ticketNo` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "ticketNo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "extraEmails" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNo_key" ON "Ticket"("ticketNo");
