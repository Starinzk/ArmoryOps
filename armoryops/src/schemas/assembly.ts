import { z } from 'zod';
import { AssemblyStage } from '@prisma/client'; // Import Prisma enum

// Create a Zod enum from the Prisma AssemblyStage enum
export const AssemblyStageSchema = z.nativeEnum(AssemblyStage);

// You can add other assembly-related schemas here later, for example:
// export const MarkCompleteInputSchema = z.object({
//   unitId: z.string(),
//   stage: AssemblyStageSchema,
//   // any other checklist items or data for this stage
// });

// export const RejectStageInputSchema = z.object({
//   unitId: z.string(),
//   stage: AssemblyStageSchema,
//   notes: z.string().min(1, { message: "Rejection notes are required" }),
// }); 