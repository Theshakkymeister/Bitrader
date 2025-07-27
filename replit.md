# Bitrader Trading Platform

## Overview

This is a full-stack AI-powered trading platform built with modern web technologies. The application provides users with automated trading algorithms for various financial markets including forex, gold, stocks, and cryptocurrencies. The platform features a React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and Replit's authentication system for user management.

**Recent Update (January 2025)**: Added comprehensive admin backend system with Ken.attwood@yahoo.com as super admin. Admin can manage crypto deposit addresses, website settings, user accounts, and monitor all platform activities.

**Latest Update (July 2025)**: 
- Completely redesigned authentication system from OAuth to traditional email/password login
- Enhanced developer portal with modern UI, animations, and organized navigation
- Fixed all authentication issues with case-insensitive email handling
- Added user-friendly admin dashboard with 6 detailed sections and Framer Motion animations
- **NEW: Live Trading System**: Implemented Robinhood-style trading interface with admin approval workflow
- Users start with $0 balances - deposits via wallets require admin approval before trading
- All trade orders (stocks, crypto, ETFs, options) require admin approval before execution
- **LATEST: Enhanced Order History**: Redesigned with detailed professional layout, smart decimal formatting
- **LATEST: Admin-Managed Crypto Addresses**: Wallet modals now properly handle admin-controlled deposit addresses
- Fixed text visibility issues in all wallet modals (Send, Receive, QR Code)
- System fully tested and ready for deployment

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit's OpenID Connect (OIDC) authentication system
- **Session Management**: Express sessions with PostgreSQL store

### Database Design
- **Primary Database**: PostgreSQL (using Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Tables**:
  - `users` - User profiles and authentication data
  - `portfolios` - User portfolio information and balances
  - `algorithms` - Available trading algorithms (forex, gold, stocks, crypto)
  - `trades` - Trading history and transaction records
  - `performance_metrics` - Algorithm performance data
  - `sessions` - User session storage
  - `admin_users` - Admin user accounts with roles and permissions
  - `website_settings` - Configurable platform settings
  - `crypto_addresses` - Cryptocurrency deposit addresses managed by admin
  - `admin_logs` - Complete audit trail of admin activities

## Key Components

### Authentication System
The application uses dual authentication systems:
- **User Authentication**: Traditional email/password system with bcrypt hashing
- **Admin Authentication**: Separate bcrypt-based system for administrators
- Session management with express-session
- Middleware for protecting both user and admin routes
- Role-based access control for admin functions

#### User Authentication Flow
- Users can register and login at `/auth` with username, email, and password
- Passwords are securely hashed using bcrypt
- Sessions are managed server-side with express-session
- Protected routes require authentication middleware

### Admin System (Ken.attwood@yahoo.com)
Complete backend control system with:
- **Login**: `/admin/login` - Secure admin authentication
- **Dashboard**: `/admin/dashboard` - Full system management interface
- **Crypto Address Management**: Add/edit/delete deposit addresses for all cryptocurrencies
- **Website Settings**: Configure global platform parameters
- **User Management**: View and manage user accounts
- **Activity Logging**: Complete audit trail of all admin actions
- **Default Password**: `AdminPass2025!` (should be changed immediately)

### Trading Dashboard
The main dashboard provides:
- Portfolio overview with balance and P&L information
- Crypto Holdings section (Bitcoin, Ethereum, Solana)
- Stock Portfolio section (Apple, Tesla, Google, Microsoft)
- Robinhood-style live charts with real-time updates
- Performance metrics display
- Buying power display with green glow effect

### Wallets System
The wallets page includes:
- 5 cryptocurrency wallets (BTC, USDT, ETH, SOL, USDC)
- Real-time balance and USD value calculations
- Wallet connection features for Trust Wallet and Coinbase
- Individual wallet addresses with show/hide functionality
- Send, Receive, and QR code generation features
- Total portfolio value aggregation

### Settings & Account Management
The settings page provides:
- **Bitraders.net Account Connection**: API key and secret integration
- **Notification Preferences**: Trade alerts, portfolio updates, security notifications
- **App Preferences**: Currency selection, timezone settings
- **Wallet Management**: External wallet connection setup

### Navigation Structure
The application uses a clean navigation with:
- **Dashboard**: Main portfolio overview with crypto and stock holdings
- **Wallets**: Individual cryptocurrency wallet management
- **Portfolio**: Dedicated portfolio analysis (coming soon)
- **Settings**: Account connection and preferences management

## Data Flow

1. **User Authentication**: Users authenticate via Replit's OIDC system
2. **Portfolio Initialization**: New users get an automatically created portfolio
3. **Algorithm Selection**: Users can browse and activate trading algorithms
4. **Trade Execution**: Algorithms generate trades that are stored in the database
5. **Performance Tracking**: Metrics are calculated and stored for analysis
6. **Real-time Updates**: Frontend uses React Query to keep data synchronized

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Support**: For real-time database connections

### Authentication
- **Replit OIDC**: OpenID Connect authentication provider
- **Express Session**: Session management with PostgreSQL persistence

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Vite**: Development server with hot module replacement

## Deployment Strategy

### Development Environment
- Frontend and backend run concurrently during development
- Vite development server with proxy to Express API
- Hot reloading for both client and server code
- TypeScript compilation checking

### Production Build
- Frontend builds to static assets using Vite
- Backend bundles with ESBuild for Node.js deployment
- Environment variables for database connections and secrets
- Session storage persisted in PostgreSQL

### Database Management
- Schema definitions in shared TypeScript files
- Migrations generated and applied via Drizzle Kit
- Connection pooling for efficient database usage
- Automatic table creation for session storage

The architecture emphasizes type safety, developer experience, and scalability while maintaining a clean separation between frontend presentation, backend business logic, and data persistence layers.