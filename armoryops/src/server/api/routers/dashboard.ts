import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AssemblyStageSchema } from "~/schemas/assembly";
import type { AssemblyStage, ItemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const TimePeriodSchema = z.enum(['today', 'this_week', 'all_time']).default('all_time');
export type TimePeriod = z.infer<typeof TimePeriodSchema>;

// Helper function to get date ranges for time periods
const getDateRange = (timePeriod: TimePeriod) => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now);
  endDate.setHours(23, 59, 59, 999); // End of current day

  switch (timePeriod) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0); // Start of current day
      break;
    case 'this_week':
      startDate = new Date(now);
      const dayOfWeek = startDate.getDay(); // Sunday - 0, Monday - 1, ...
      const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday or Sunday as week start
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0); // Start of the week (assuming Monday start)
      
      endDate = new Date(startDate); // End of the week is 6 days after start of week
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'all_time':
    default:
      // For 'all_time', we don't need a specific start date for some queries,
      // or a very old date if filtering is mandatory.
      // Prisma queries will handle this by not applying a date filter where it's not needed.
      startDate = new Date(0); // Epoch, effectively all time for 'createdAt' or 'updatedAt'
      endDate = new Date(); // Present moment for all_time upper bound
      break;
  }
  return { startDate, endDate };
};

export const dashboardRouter = createTRPCRouter({
  // Procedures will be added here
  getProductionSummary: protectedProcedure
    .input(z.object({ timePeriod: TimePeriodSchema }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = getDateRange(input.timePeriod);

      const unitsCompleted = await ctx.db.serializedItem.count({
        where: {
          status: 'COMPLETE',
          ...(input.timePeriod !== 'all_time' && { updatedAt: { gte: startDate, lte: endDate } }),
        },
      });

      const unitsInProgress = await ctx.db.serializedItem.count({
        where: { status: 'IN_PROGRESS' }, // Always current for in-progress
      });

      return {
        unitsCompleted,
        unitsInProgress,
      };
    }),

  getRejectionSummary: protectedProcedure
    .input(z.object({ timePeriod: TimePeriodSchema }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = getDateRange(input.timePeriod);

      const totalRejections = await ctx.db.unitStageLog.count({
        where: {
          status: 'REJECTED',
          ...(input.timePeriod !== 'all_time' && { timestamp: { gte: startDate, lte: endDate } }),
        },
      });

      const rejectionsByStageData = await ctx.db.unitStageLog.groupBy({
        by: ['stage'],
        where: {
          status: 'REJECTED',
          ...(input.timePeriod !== 'all_time' && { timestamp: { gte: startDate, lte: endDate } }),
        },
        _count: {
          stage: true,
        },
      });

      const rejectionsByStage = Object.values(AssemblyStageSchema.enum).map(stage => ({
        stage,
        count: rejectionsByStageData.find(d => d.stage === stage)?._count.stage || 0,
      }));

      return {
        totalRejections,
        rejectionsByStage, // Array of { stage: AssemblyStage, count: number }
      };
    }),

  getWipByStage: protectedProcedure
    .query(async ({ ctx }) => {
      const wipData = await ctx.db.serializedItem.groupBy({
        by: ['currentStage'],
        where: {
          status: 'IN_PROGRESS',
          currentStage: { not: null },
        },
        _count: {
          currentStage: true,
        },
      });
      
      const allStages = Object.values(AssemblyStageSchema.enum);
      const wipByStage = allStages.map(stage => ({
        stage: stage as AssemblyStage, // Cast needed here
        count: wipData.find(d => d.currentStage === stage)?._count.currentStage || 0,
      }));

      return {
        wipByStage, // Array of { stage: AssemblyStage, count: number }
      };
    }),
}); 