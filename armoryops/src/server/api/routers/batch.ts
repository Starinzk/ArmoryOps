import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const batchRouter = createTRPCRouter({
  createBatch: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        serialNumbers: z.array(z.string().min(1)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate serial numbers in the input
      const uniqueSerials = new Set(input.serialNumbers);
      if (uniqueSerials.size !== input.serialNumbers.length) {
        throw new Error("Duplicate serial numbers in input array");
      }

      // Check for existing serial numbers in the database
      const existing = await ctx.db.serializedItem.findMany({
        where: {
          serialNumber: { in: input.serialNumbers },
        },
        select: { serialNumber: true },
      });
      if (existing.length > 0) {
        throw new Error(
          `Serial numbers already exist: ${existing
            .map((e: { serialNumber: string }) => e.serialNumber)
            .join(", ")}`
        );
      }

      // Create the batch and linked serialized items
      const batch = await ctx.db.batch.create({
        data: {
          status: "PENDING",
          serializedItems: {
            create: input.serialNumbers.map((serial) => ({
              serialNumber: serial,
              status: "NOT_STARTED",
            })),
          },
        },
        include: { serializedItems: true },
      });

      return batch;
    }),

  getAllBatches: protectedProcedure.query(async ({ ctx }) => {
    const batches = await ctx.db.batch.findMany({
      include: { serializedItems: true },
    });

    return batches.map((batch) => {
      const total = batch.serializedItems.length;
      const completed = batch.serializedItems.filter(item => item.status === "COMPLETE").length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...batch,
        completedCount: completed,
        progressPercent: progress,
      };
    });
  }),
}); 