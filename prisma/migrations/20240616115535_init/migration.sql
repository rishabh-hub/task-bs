-- CreateEnum
CREATE TYPE "LinkPrecedence" AS ENUM ('secondary', 'primary');

-- CreateTable
CREATE TABLE "Contacts" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "linkedId" INTEGER,
    "linkPrecedence" "LinkPrecedence" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contacts_id_key" ON "Contacts"("id");

-- CreateIndex
CREATE INDEX "idx_phoneNumber" ON "Contacts"("phoneNumber");

-- CreateIndex
CREATE INDEX "idx_email" ON "Contacts"("email");
