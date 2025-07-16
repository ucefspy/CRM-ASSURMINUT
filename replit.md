# replit.md

## Overview

This is a CRM (Customer Relationship Management) application for insurance brokers, specifically designed for health insurance (mutuelle santé). The system is built as a full-stack TypeScript application with Express.js backend and React frontend, using PostgreSQL as the database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **File Storage**: Local file system for document uploads
- **PDF Generation**: jsPDF for generating quote PDFs

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and building
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Data Storage
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **File Storage**: Local filesystem in `uploads/` directory
- **Session Storage**: Express sessions with PostgreSQL store
- **Migrations**: Drizzle migrations in `migrations/` directory

## Key Components

### Database Schema
- **Users**: 3-level user management system with role-based access control (Admin, Superviseur, Agent)
- **Clients**: Customer information and status tracking
- **Devis**: Insurance quotes with guarantees and pricing
- **Documents**: File attachments linked to clients
- **Rappels**: Reminder/appointment system
- **Appels**: Call log tracking

### User Role System
- **Admin**: Full system access, can manage all users and see system statistics
- **Superviseur**: Can manage agents and access administration features
- **Agent**: Standard CRM functionality, cannot access administration
- **Permissions**: Role-based middleware controls access to routes and features
- **Default Accounts**: Automatically created on first startup (see UTILISATEURS.md)

### API Routes
- Authentication endpoints (`/api/login`, `/api/logout`, `/api/me`)
- CRUD operations for clients, quotes, documents, reminders, and calls
- File upload and import functionality
- PDF generation for quotes
- Statistics and dashboard data

### Frontend Pages
- **Dashboard**: Overview with statistics and quick actions
- **Clients**: Client management with search and filtering
- **Devis**: Quote creation and management
- **Documents**: File upload and document management
- **Agenda**: Appointment and reminder system
- **Appels**: Call log and tracking

## Data Flow

1. **Authentication**: Session-based authentication validates users on protected routes
2. **Client Management**: CRUD operations for client data with validation
3. **Quote Generation**: Create quotes linked to clients with PDF export capability
4. **Document Management**: File uploads associated with clients
5. **Activity Tracking**: Call logs and reminders for follow-up actions

## External Dependencies

### Backend Dependencies
- `@neondatabase/serverless`: PostgreSQL connection for Neon
- `drizzle-orm`: Type-safe ORM
- `bcryptjs`: Password hashing
- `multer`: File upload handling
- `jspdf`: PDF generation
- `express-session`: Session management

### Frontend Dependencies
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: UI component primitives
- `react-hook-form`: Form management
- `zod`: Schema validation
- `tailwindcss`: Styling framework
- `wouter`: Routing library

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- Database migrations via Drizzle Kit

### Production
- Frontend built to static files via Vite
- Backend bundled with esbuild
- Database provisioned via DATABASE_URL environment variable
- Static file serving for uploads and assets

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment setting (development/production)

### Build Process
1. `npm run build`: Builds frontend and bundles backend
2. `npm run start`: Runs production server
3. `npm run db:push`: Applies database schema changes

### Recent Changes
- **2025-07-16**: Implemented comprehensive 3-level user session system with role-based access control
- **2025-07-16**: Created complete authentication infrastructure with Admin, Superviseur, and Agent roles
- **2025-07-16**: Added user management page with ability to create, view, and delete users based on permissions
- **2025-07-16**: Implemented middleware system for role-based route protection
- **2025-07-16**: Created automatic user seeding system that initializes default accounts on first startup
- **2025-07-16**: Added administration section to sidebar (visible only to admin/superviseur roles)
- **2025-07-16**: Updated all user login passwords with secure bcrypt hashing (12 rounds)
- **2025-07-16**: Created UTILISATEURS.md file with all login credentials for easy reference
- **2025-07-16**: Fixed Supabase database connection issue - Replit's DATABASE_URL environment variable was overriding .env file, causing app to connect to wrong database
- **2025-07-16**: Implemented comprehensive notifications system with real-time data from rappels and clients
- **2025-07-16**: Updated database connection logic to force use of Supabase URL from .env file
- **2025-01-16**: Updated @vitejs/plugin-react from 4.3.2 to 4.6.0 to resolve dependency conflict with vite 6.3.5 during deployment
- **2025-01-16**: Fixed Replit deployment by creating missing server/routes.js and server/db.js files
- **2025-01-16**: Fixed admin login issues by disabling secure cookies in session configuration for Replit compatibility

The application follows a modular architecture with clear separation between client and server code, shared TypeScript types, and a consistent API design pattern.