# ArmoryOps

A modern web application for managing firearm assembly batches and serialized items, built with the T3 Stack.

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Supabase Auth
- **API Layer:** tRPC
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS

## Features

- 🔐 Secure authentication with Supabase
- 📦 Batch management system for firearm assembly
- 🔢 Serial number tracking
- 📊 Progress tracking and visualization
- 🎨 Modern, responsive UI with shadcn/ui
- 🔒 Protected API routes with tRPC

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (via Docker)
- Supabase account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/armoryops"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
AUTH_SECRET="your-auth-secret"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Starinzk/ArmoryOps.git
   cd ArmoryOps
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the database:**
   ```bash
   ./start-database.sh
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Seed the database (optional):**
   ```bash
   npx prisma db seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
armoryops/
├── prisma/              # Database schema and migrations
├── public/             # Static assets
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── server/        # tRPC API routes and procedures
│   ├── styles/        # Global styles
│   └── utils/         # Utility functions
└── docs/              # Project documentation
```

## Authentication

The application uses Supabase for authentication with the following features:
- Email/password authentication
- Email verification
- Password reset functionality
- Protected routes and API endpoints

## Batch System

The batch system allows tracking of firearm assembly with the following features:
- Create batches with multiple serialized items
- Track assembly progress
- View batch status and completion percentage
- Prevent duplicate serial numbers

## API Documentation

### Batch Endpoints

- `batch.createBatch`: Create a new batch with serialized items
- `batch.getAllBatches`: Get all batches with their items and progress

### Authentication Endpoints

- `auth.signIn`: Sign in with email/password
- `auth.signUp`: Create a new account
- `auth.resetPassword`: Reset password via email

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT License - see LICENSE file for details
