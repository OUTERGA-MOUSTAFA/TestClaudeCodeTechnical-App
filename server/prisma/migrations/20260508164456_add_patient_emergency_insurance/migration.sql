-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "emergency_contact_name" TEXT,
ADD COLUMN     "emergency_contact_phone" TEXT,
ADD COLUMN     "insurance_number" TEXT,
ADD COLUMN     "insurance_provider" TEXT;
