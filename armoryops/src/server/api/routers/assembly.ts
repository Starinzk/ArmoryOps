import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AssemblyStageSchema } from "~/schemas/assembly"; // We'll create this schema file next
import type { AssemblyStage, ItemStatus, Prisma } from "@prisma/client"; // Added Prisma for explicit types
import { TRPCError } from "@trpc/server"; // Added TRPCError

export const assemblyRouter = createTRPCRouter({
  getUnitAssemblyProgressBySerial: protectedProcedure
    .input(z.object({ serialNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      const unit = await ctx.db.serializedItem.findUnique({
        where: { serialNumber: input.serialNumber },
        include: {
          batch: { // Include the batch
            include: {
              product: { select: { name: true } } // Then include the product from the batch
            }
          },
          unitStageLogs: { orderBy: { timestamp: 'asc' } },
        },
      });

      if (!unit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Unit with serial number '${input.serialNumber}' not found.`,
        });
      }

      const allPossibleStages = Object.values(AssemblyStageSchema.enum);
      const stageStatuses: Record<AssemblyStage, 'not_started' | 'in_progress' | 'complete'> = {} as any;

      for (const stage of allPossibleStages) {
        const completedLog = unit.unitStageLogs.find(
          (log) => log.stage === stage && log.status === 'COMPLETE'
        );
        if (completedLog) {
          stageStatuses[stage] = 'complete';
        } else if (unit.currentStage === stage) {
          stageStatuses[stage] = 'in_progress';
        } else {
          stageStatuses[stage] = 'not_started';
        }
      }

      return {
        id: unit.id,
        serialNumber: unit.serialNumber,
        productName: unit.batch.product?.name ?? 'N/A', // Access product name via batch
        currentStage: unit.currentStage as AssemblyStage, // Assuming currentStage on SerializedItem is AssemblyStage type
        stages: stageStatuses, // This will be the [key: string]: { status: ... } like structure for the frontend
      };
    }),

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
          newOverallStatus = 'IN_PROGRESS'; // Set to IN_PROGRESS for any other stage completion
        } else {
          // This case implies currentStageIndex is the last stage, but not PACKAGE_AND_SERIALIZE
          // This means it's an intermediate stage, and completing it should also set status to IN_PROGRESS
          // (unless it was already IN_PROGRESS or COMPLETE).
          // If it's the last stage before PACKAGE_AND_SERIALIZE, newCurrentStage would be PACKAGE_AND_SERIALIZE
          // and status should still be IN_PROGRESS.
          // If newCurrentStage is already correctly set to the next stage or remains the current (if it's the actual last before PACKAGE_AND_SERIALIZE),
          // we just need to ensure status is IN_PROGRESS.
          const unit = await prisma.serializedItem.findUnique({ where: { id: unitId }, select: { status: true } });
          if (unit && unit.status !== 'COMPLETE') { // Don't override if already complete for some reason
             newOverallStatus = 'IN_PROGRESS';
          }
        }

        // Ensure status is IN_PROGRESS if we start the first stage
        const previousUnitState = await prisma.serializedItem.findUnique({ where: { id: unitId } });
        if (previousUnitState && previousUnitState.status === 'NOT_STARTED') {
            newOverallStatus = 'IN_PROGRESS';
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