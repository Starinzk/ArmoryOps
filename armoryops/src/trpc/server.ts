import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
// import { headers } from "next/headers"; // Original problematic import location
import { cache } from "react";

import { createCaller, type AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const { headers: getNextHeaders } = await import("next/headers"); // Dynamically import inside
  const heads = new Headers(await getNextHeaders());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

// Use rscApi to avoid potential conflict, and export HydrateClient
export const { trpc: rscApi, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
