# ArmoryOps

A modern web application for managing firearm assembly, batch tracking, and serialized item lifecycles. Built with Next.js, Prisma, tRPC, and Material UI.

## Overview

ArmoryOps is designed to streamline the firearm assembly process, providing tools for:
- Managing production batches.
- Tracking individual serialized items through multiple assembly stages.
- Offering a dedicated interface for assemblers to quickly update unit status.
- Displaying key performance indicators (KPIs) on an assembly dashboard.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **API Layer:** tRPC (for type-safe client-server communication)
- **Authentication:** Supabase Auth (Email/Password, Email Verification, Password Reset)
- **UI Components:**
    - Material UI (MUI) & MUI X (for core layout, components, icons, and advanced components like Data Grid if used)
    - `@mui/lab` (for components like `LoadingButton`)
    - shadcn/ui (potentially for specific components, if still in use alongside MUI)
- **Styling:** Tailwind CSS (if still primary, or alongside MUI's styling solutions like Emotion/Styled Components)
- **State Management:** React Context/Hooks, tRPC query caching

## Key Features

- 🔐 **Secure User Authentication:** Role-based access control can be layered on Supabase auth.
- 🏭 **Product Management:** Define product models that batches are based on.
- 📦 **Batch Management:**
    - Create and manage production batches with associated product models and quantities.
    - View a list of all batches with progress summaries.
    - Detailed batch view showing all serialized items, their status, and current assembly stage.
- 🔩 **Serialized Item Tracking:**
    - Automatic generation and tracking of unique serial numbers (or manual input).
    - Prevention of duplicate serial numbers.
- ✨ **Assembly Workflow:**
    - **Unit Assembly Checklist Page (`/unit/[unitId]/assembly`):**
        - Interactive checklist for each assembly stage.
        - Visual progress bar for the unit's assembly.
        - Ability to mark stages complete or reject a stage with notes.
        - Logs all stage transitions with user and timestamp.
    - **Assembly Station Panel (`/assembly-station`):**
        - Optimized for rapid data entry on tablets/desktops.
        - Load units by serial number (manual or QR scan) or by Batch-ItemIndex format (e.g., "BatchName-ItemIndex").
        - MUI Stepper for visual progress through predefined assembly stages.
        - Stage-specific checklists (using MUI Checkbox).
        - One-button stage completion with auto-advance.
        - Snackbar notifications for user feedback.
- 📈 **Assembly Dashboard (`/dashboard`):**
    - **Key Metrics:**
        - Units Completed
        - Units In Progress
        - Total Rejections
    - **Visualizations:**
        - Work In Progress (WIP) by current assembly stage (Bar Chart).
        - Rejections by assembly stage (Bar Chart).
    - **Filtering:** Time period filters (Today, This Week, All Time) for relevant metrics.
- 🎨 **Modern & Responsive UI:** Built with Material UI for a consistent and professional look and feel.
- 🔒 **Type-Safe API:** End-to-end type safety with tRPC.

## Prerequisites

- Node.js (v18 or later recommended)
- Docker and Docker Compose (for PostgreSQL database)
- A Supabase account (for authentication)

## Environment Variables

Create a `.env` file in the root of your project and populate it with the following:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/armoryops" # Replace with your actual DB connection string

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
AUTH_SECRET="your-secure-auth-secret" # Generate a strong secret

# NextAuth.js (if still used alongside Supabase Auth, otherwise can be removed)
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="your-nextauth-secret" # Generate a strong secret
```
**Note:** Ensure `AUTH_SECRET` (and `NEXTAUTH_SECRET` if used) are strong, unique secrets.

## Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Starinzk/ArmoryOps.git
    cd ArmoryOps
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```
    *(Or `yarn install` / `pnpm install` if you use a different package manager)*

3.  **Set up Environment Variables:**
    Copy `.env.example` (if one exists) to `.env` and fill in your actual credentials as described above.

4.  **Start the PostgreSQL Database (using Docker):**
    Ensure Docker is running, then execute:
    ```bash
    ./start-database.sh
    ```
    *(This script likely runs `docker-compose up -d` for a Postgres service defined in `docker-compose.yml`)*

5.  **Apply Database Migrations:**
    This will create the necessary tables in your database based on `prisma/schema.prisma`.
    ```bash
    npx prisma migrate dev
    ```

6.  **Seed the Database (Optional but Recommended for Initial Setup):**
    If a seed script is configured in `package.json` and `prisma/seed.ts`:
    ```bash
    npx prisma db seed
    ```

7.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application should now be running at `http://localhost:3000`.

## Project Structure Overview

```
armoryops/
├── prisma/                 # Prisma schema, migrations, and seed script
├── public/                 # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                # Next.js App Router: pages, layouts, route handlers
│   │   ├── (auth)/         # Authentication-related pages (login, signup)
│   │   ├── (main)/         # Main application pages after login
│   │   │   ├── batch/
│   │   │   ├── unit/
│   │   │   ├── assembly-station/
│   │   │   ├── dashboard/
│   │   │   └── ... (other main app routes)
│   │   └── layout.tsx      # Root layout
│   │   └── page.tsx        # Root page (e.g., landing or redirect)
│   ├── components/         # Shared React components
│   │   ├── layout/         # Layout components (NavigationDrawer, Header, etc.)
│   │   ├── ui/             # Generic UI elements (buttons, cards - potentially shadcn/ui or custom MUI)
│   │   └── ...             # Feature-specific components
│   ├── lib/                # Utility functions, helper scripts, Supabase client
│   ├── schemas/            # Zod schemas for validation (tRPC inputs, forms)
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/    # tRPC routers (batch.ts, product.ts, assembly.ts, dashboard.ts)
│   │   │   ├── root.ts     # Root tRPC app router
│   │   │   └── trpc.ts     # tRPC initialization and context
│   │   └── db.ts           # Prisma client instance
│   ├── styles/             # Global styles, Tailwind CSS base/config (if used)
│   └── types/              # Custom TypeScript type definitions
├── .env                    # Environment variables (ignored by Git)
├── next.config.js          # Next.js configuration
├── package.json
├── README.md
└── tsconfig.json
```

## API Structure (tRPC Routers)

The backend API is built using tRPC, providing type-safe communication between the client and server. Key routers include:

-   **`productRouter`:**
    -   `createProduct`: Creates a new product definition.
    -   `getAllProducts`: Fetches a list of all products.
-   **`batchRouter`:**
    -   `createBatch`: Creates a new assembly batch, linking to a product and generating serialized items.
    -   `getAllBatches`: Retrieves a summary of all batches with progress.
    -   `getBatchById`: Fetches detailed information for a specific batch, including its serialized items and their statuses.
-   **`assemblyRouter`:**
    -   `getUnitAssemblyProgressBySerial`: Fetches assembly progress for a unit by its serial number (used by Assembly Station).
    -   `getAssemblyDetailsByUnitId`: Retrieves detailed assembly logs and current stage for a unit (used by Unit Assembly Checklist).
    -   `markStageComplete`: Marks an assembly stage as complete for a unit, logs it, and advances the unit to the next stage. Updates overall unit status to `IN_PROGRESS` or `COMPLETE` as appropriate.
    -   `rejectStage`: Marks an assembly stage as rejected, logs it with user notes.
-   **`dashboardRouter`:**
    -   `getProductionSummary`: Provides counts of units completed and in progress, filterable by time period.
    -   `getRejectionSummary`: Provides total rejection counts and rejections broken down by stage, filterable by time period.
    -   `getWipByStage`: Returns a snapshot of the current number of units at each assembly stage.

Authentication is handled primarily via Supabase client libraries on the frontend and session checks in protected tRPC procedures.

## Development Workflow

- **Branching Strategy:**
    - `main`: Stable releases or production-ready code.
    - `dev`: Primary development branch for ongoing feature work and integration.
    - Feature branches (e.g., `feature/your-feature-name`): Branched from `dev` for new features or bug fixes. Merged back into `dev` via Pull Requests.
- **Commits:** Follow conventional commit message formats if possible (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
- **Linting & Formatting:** ESLint and Prettier should be configured for code consistency.

## Contributing

1.  Ensure you have forked the repository and cloned your fork.
2.  Create a new feature branch from `dev`: `git checkout -b feature/your-awesome-feature dev`
3.  Make your changes, committing frequently with clear messages.
4.  Push your feature branch to your fork: `git push origin feature/your-awesome-feature`
5.  Open a Pull Request against the main repository's `dev` branch.
6.  Ensure your PR passes any automated checks and addresses review comments.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.