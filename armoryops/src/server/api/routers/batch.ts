import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const batchRouter = createTRPCRouter({
  createBatch: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        productModel: z.string().min(1),
        quantity: z.number().int().positive(),
        serialNumbers: z.array(z.string().min(1)).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let itemsToCreate: { serialNumber: string; status: string }[] = [];

      if (input.serialNumbers && input.serialNumbers.length > 0) {
        if (input.serialNumbers.length !== input.quantity) {
          throw new Error(
            `The number of serial numbers (${input.serialNumbers.length}) must match the specified quantity (${input.quantity}).`
          );
        }

        const uniqueSerials = new Set(input.serialNumbers);
        if (uniqueSerials.size !== input.serialNumbers.length) {
          throw new Error("Duplicate serial numbers in input array.");
        }

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
        itemsToCreate = input.serialNumbers.map((serial) => ({
          serialNumber: serial,
          status: "NOT_STARTED",
        }));
      } else {
        // If serial numbers are NOT provided, do not create items yet.
        // The design says "Leave empty to assign serial numbers later."
        // Optionally, here you could auto-generate placeholder serials if desired,
        // but current logic will skip item creation.
      }

      const batch = await ctx.db.batch.create({
        data: {
          name: input.name,
          productModel: input.productModel,
          quantity: input.quantity,
          status: "PENDING",
          ...(itemsToCreate.length > 0 && {
            serializedItems: {
              create: itemsToCreate,
            },
          }),
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