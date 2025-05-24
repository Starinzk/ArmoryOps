/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { db } from "~/server/db";
// Attempt to import UserRole directly from $Enums, and User type as well
import type { User, $Enums } from "@prisma/client";
type UserRole = $Enums.UserRole; // Define UserRole type alias

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return opts.headers.get('cookie')?.split('; ').find(c => c.startsWith(`${name}=`))?.split('=')[1];
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is a simplified stub. In a real Next.js API route/server action that
          // constructs a Response, you would use the Response object to set cookies.
          // console.log(`tRPC context: Would set cookie ${name}=${value}`, options);
        },
        remove(name: string, options: CookieOptions) {
          // Similar to set, this is a stub in the tRPC context.
          // console.log(`tRPC context: Would remove cookie ${name}`, options);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  let dbUser: User | null = null; 
  if (session?.user) {
    // Ensure we fetch the complete User object as defined by Prisma
    dbUser = await db.user.findUnique({
      where: { id: session.user.id },
    }) as User | null; // Explicit cast to ensure full User type
  }

  return {
    db,
    session, // Supabase session, still useful for some things
    dbUser,  // Full user record from our database, including role
    headers: opts.headers,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */

// Define a more specific context type for procedures after authentication
interface AuthedContext extends Awaited<ReturnType<typeof createTRPCContext>> {
  session: NonNullable<Awaited<ReturnType<typeof createTRPCContext>>['session']>;
  dbUser: User; // dbUser here must be the full Prisma User type
}

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user || !ctx.dbUser) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    // Explicitly cast the context for the next middleware
    return next({
      ctx: ctx as AuthedContext,
    });
  });

/**
 * Middleware for role-based access control.
 * Takes an array of allowed roles and checks if the current user's role is included.
 */
export const createRoleProtectedMiddleware = (allowedRoles: UserRole[]) => {
  return t.middleware(async ({ ctx, next }) => {
    // ctx is AuthedContext due to the cast in protectedProcedure
    // ctx.dbUser should be the full Prisma User object, including 'role'
    if (!ctx.dbUser.role || !allowedRoles.includes(ctx.dbUser.role)) { 
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: `User role (${ctx.dbUser.role ?? 'undefined'}) is not authorized for this procedure. Allowed roles: ${allowedRoles.join(", ")}` 
      });
    }
    return next({
      ctx: ctx, 
    });
  });
};

// Example of how you might create a procedure that requires ADMIN role:
// export const adminProcedure = protectedProcedure.use(createRoleProtectedMiddleware(["ADMIN" as UserRole]));
// Note: Prisma enum types might not be directly usable as string literals for arrays in some TS configs.
// Explicitly casting or ensuring UserRole is imported and used might be necessary if issues arise.
// For now, let UserRole be inferred from the Prisma client types in the calling router. 
// We will need to import UserRole from "@prisma/client" where this middleware is used.
