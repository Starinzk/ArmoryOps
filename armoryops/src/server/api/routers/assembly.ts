import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AssemblyStageSchema } from "~/schemas/assembly"; // We'll create this schema file next
import type { AssemblyStage, ItemStatus } from "@prisma/client"; // Added explicit type imports

export const assemblyRouter = createTRPCRouter({
  getAssemblyDetailsByUnitId: protectedProcedure
    .input(z.object({ unitId: z.string() }))
    .query(async ({ ctx, input }) => {
      const unit = await ctx.db.serializedItem.findUnique({
        where: { id: input.unitId },
        include: {
          unitStageLogs: {
            orderBy: { timestamp: 'asc' },
            include: {
              completedByUser: { // Include user details for who completed/rejected
                select: { id: true, name: true, email: true }
              }
            }
          },
          batch: { // Include batch information
            select: { name: true } // Specifically select the batch name
          }
        }
      });

      if (!unit) {
        throw new Error("Unit not found");
      }
      return unit;
    }),

  markStageComplete: protectedProcedure
    .input(z.object({
      unitId: z.string(),
      stage: AssemblyStageSchema, // Use the Zod schema for validation
      // TODO: Add other stage-specific checklist data if needed, e.g., checklistItems: z.record(z.boolean())
    }))
    .mutation(async ({ ctx, input }) => {
      const { unitId, stage } = input;
      const userId = ctx.session.user.id;

      // TODO: Add logic here to validate checklist items for the given stage if they are passed in input
      // TODO: Add permission check: does this user have permission for this stage?

      const updatedUnit = await ctx.db.$transaction(async (prisma) => {
        await prisma.unitStageLog.create({
          data: {
            unitId,
            stage,
            status: 'COMPLETE',
            completedById: userId,
            // notes: null, // No notes for completion
          },
        });

        const stageValues = Object.values(AssemblyStageSchema.enum);
        const currentStageIndex = stageValues.indexOf(stage);
        let newCurrentStage: AssemblyStage | null = stage; // Default to current stage if it's the last one
        let newOverallStatus: ItemStatus | undefined = undefined;

        if (stage === AssemblyStageSchema.enum.PACKAGE_AND_SERIALIZE) {
          newOverallStatus = 'COMPLETE';
        } else if (currentStageIndex < stageValues.length - 1) {
          newCurrentStage = stageValues[currentStageIndex + 1] as AssemblyStage;
        } else {
          // This case implies currentStageIndex is the last stage, but not PACKAGE_AND_SERIALIZE (should not happen with current enum)
          // Or stage was not found in enum (should be caught by Zod validation)
        }

        return prisma.serializedItem.update({
          where: { id: unitId },
          data: {
            currentStage: newCurrentStage,
            ...(newOverallStatus && { status: newOverallStatus }),
          },
        });
      });
      return updatedUnit;
    }),

  rejectStage: protectedProcedure
    .input(z.object({
      unitId: z.string(),
      stage: AssemblyStageSchema,
      notes: z.string().min(1, { message: "Rejection notes are required." }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { unitId, stage, notes } = input;
      const userId = ctx.session.user.id;

      // TODO: Add permission check: does this user have permission for this stage/action?

      const logEntry = await ctx.db.unitStageLog.create({
        data: {
          unitId,
          stage,
          status: 'REJECTED',
          completedById: userId,
          notes,
        },
      });

      // Optionally, you might want to update the SerializedItem's currentStage 
      // or overall status here if a rejection has specific implications for them.
      // For now, we are only logging the rejection and not changing the item's stage.
      // Example: Could set item.status to something like 'NEEDS_REWORK'
      // const rejectedUnit = await ctx.db.serializedItem.update({
      //   where: { id: unitId },
      //   data: { currentStage: stage }, // Keep it on the current stage
      // });

      return { logEntry }; // Return the created log entry, or the unit if updated
    })
}); 