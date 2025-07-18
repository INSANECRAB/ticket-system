-- CreateTable
CREATE TABLE "InviteEmailTemplate" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteEmailTemplate_pkey" PRIMARY KEY ("id")
);
