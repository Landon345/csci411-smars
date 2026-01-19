-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('patient', 'doctor');

-- CreateTable
CREATE TABLE "User" (
    "UserID" TEXT NOT NULL,
    "Email" VARCHAR(255) NOT NULL,
    "Password" VARCHAR(255),
    "FirstName" VARCHAR(255) NOT NULL,
    "LastName" VARCHAR(255) NOT NULL,
    "Phone" VARCHAR(23),
    "SSN" VARCHAR(11) NOT NULL,
    "Role" "Roles" NOT NULL DEFAULT 'patient',
    "CreatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "Session" (
    "SessionID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "Expires" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + '02:00:00'::interval),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("SessionID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "User_SSN_key" ON "User"("SSN");

-- CreateIndex
CREATE INDEX "User_FirstName_CreatedAt_idx" ON "User"("FirstName", "CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "User_LastName_CreatedAt_idx" ON "User"("LastName", "CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "User_Password_CreatedAt_idx" ON "User"("Password", "CreatedAt" DESC);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;
