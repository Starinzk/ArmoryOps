# ArmoryOps

A modern web application for managing firearm assembly, batch tracking, and serialized item lifecycles. Built with Next.js, Prisma, tRPC, and Material UI.

See full project overview and specs here https://www.notion.so/ArmoryOps-201a50c2d49f80699037e71089021417

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
    - **Unit Assembly Checklist Page
