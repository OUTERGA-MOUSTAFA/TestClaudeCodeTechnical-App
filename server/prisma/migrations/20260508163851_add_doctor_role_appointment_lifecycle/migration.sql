-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DOCTOR';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "rejection_reason" TEXT;
