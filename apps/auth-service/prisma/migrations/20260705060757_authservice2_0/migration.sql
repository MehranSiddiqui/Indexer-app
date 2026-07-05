/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `RefresToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RefresToken_token_key" ON "RefresToken"("token");
