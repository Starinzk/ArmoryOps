import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { type ItemStatus } from "@prisma/client";

export const batchRouter = createTRPCRouter({
  createBatch: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        serialNumbers: z.array(z.string().min(1)).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let itemsToCreate: { serialNumber: string; status: ItemStatus }[] = [];

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
          status: "NOT_STARTED" as ItemStatus,
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
          productId: input.productId,
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
      include: { serializedItems: true, product: true },
      orderBy: { createdAt: 'desc' },
    });

    return batches.map((batch) => {
      const totalItems = batch.quantity;
      const completedItems = batch.serializedItems.filter(item => item.status === "COMPLETE").length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      
      return {
        id: batch.id,
        name: batch.name,
        productName: batch.product.name,
        productModel: batch.product.modelNumber,
        quantity: batch.quantity,
        status: batch.status,
        serializedItems: batch.serializedItems.map(item => ({
          id: item.id,
          serialNumber: item.serialNumber,
          status: item.status,
          currentStage: item.currentStage,
        })),
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        completedCount: completedItems,
        progressPercent: progress,
      };
    });
  }),

  getBatchById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.findUnique({
        where: { id: input.id },
        include: {
          serializedItems: {
            orderBy: { serialNumber: 'asc' }, // Or by creation order if preferred
          },
          product: true,
        },
      });

      if (!batch) {
        throw new Error("Batch not found"); // Or handle as a TRPCError
      }

      // You can add the same progress calculation here if needed on the detail page
      const totalItems = batch.quantity;
      const completedItems = batch.serializedItems.filter(item => item.status === "COMPLETE").length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        ...batch,
        productModel: batch.product.modelNumber,
        serializedItems: batch.serializedItems.map(item => ({
          id: item.id,
          serialNumber: item.serialNumber,
          status: item.status,
          currentStage: item.currentStage,
          // Add any other fields from SerializedItem you need for the detail view
        })),
        completedCount: completedItems,
        progressPercent: progress,
      };
    }),
}); 