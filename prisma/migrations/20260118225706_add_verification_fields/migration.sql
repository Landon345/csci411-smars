-- AlterTable
ALTER TABLE "User" ADD COLUMN     "EmailVerified" TIMESTAMP(3),
ADD COLUMN     "VerifyCode" VARCHAR(6),
ADD COLUMN     "VerifyExpires" TIMESTAMP(3);
