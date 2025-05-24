import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const productRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        modelNumber: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.create({
        data: {
          name: input.name,
          modelNumber: input.modelNumber,
          description: input.description,
          imageUrl: input.imageUrl,
        },
      });
      return product;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findUnique({
        where: { id: input.id },
      });
    }),

  getAllProducts: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({
      select: {
        id: true,
        name: true,
        modelNumber: true,
      },
      orderBy: {
        name: 'asc',
      }
    });
  }),
}); 