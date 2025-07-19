# replit.md

## Overview

This is a cybersecurity command center application built with modern web technologies. The system provides real-time monitoring and visualization of network security metrics, threat detection, system performance, and federated learning capabilities. It features a React frontend with a dark cybersecurity theme and an Express.js backend with WebSocket support for live data streaming.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The application follows a monorepo pattern with shared code between client and server:
- **Client**: React-based frontend with TypeScript
- **Server**: Express.js backend with TypeScript
- **Shared**: Common schema definitions and types

### Technology Stack
- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket connections
- **Styling**: TailwindCSS with custom cybersecurity theme
- **Build**: Vite for frontend, esbuild for backend

## Key Components

### Frontend Architecture
- **Component System**: Modular dashboard components using shadcn/ui
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Custom cybersecurity theme with dark mode, CSS variables for colors
- **Real-time Updates**: WebSocket hooks for live data streaming

### Backend Architecture
- **API Structure**: RESTful endpoints with Express.js
- **Real-time Communication**: WebSocket server for live dashboard updates
- **Data Access**: Storage abstraction layer with Drizzle ORM
- **Monitoring Services**: Modular services for network, system, threat detection, and federated learning

### Database Schema
The database uses PostgreSQL with the following main entities:
- **Users**: Authentication and user management
- **Network Metrics**: Real-time network traffic data
- **System Metrics**: CPU, memory, disk, and performance monitoring
- **Threats**: Security threat detection and tracking
- **Packets**: Network packet analysis data
- **FL (Federated Learning)**: Client and model management
- **Alerts**: System notifications and warnings

## Data Flow

### Real-time Data Pipeline
1. **Data Collection**: Background services simulate and collect metrics
2. **Storage**: Data is persisted to PostgreSQL via Drizzle ORM
3. **API Endpoints**: REST endpoints serve historical and current data
4. **WebSocket Streaming**: Live updates pushed to connected clients
5. **Frontend Updates**: React components update automatically via hooks

### Service Integration
- **Network Monitor**: Collects traffic metrics and packet data every 2 seconds
- **System Monitor**: Gathers CPU, memory, and performance data every 5 seconds
- **Threat Detector**: Analyzes for security threats every 10 seconds
- **FL Coordinator**: Manages federated learning clients and models every 30 seconds

## External Dependencies

### Database
- **PostgreSQL**: Primary database with Neon serverless integration
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connection**: Environment variable `DATABASE_URL` required

### UI Components
- **Radix UI**: Accessible primitive components
- **Lucide React**: Icon library
- **TailwindCSS**: Utility-first styling framework

### Real-time Features
- **WebSocket**: Native WebSocket API for live updates
- **TanStack Query**: Server state management with caching

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR and error overlay
- **Backend**: tsx for TypeScript execution with auto-restart
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **NODE_ENV**: Controls development vs production behavior
- **DATABASE_URL**: PostgreSQL connection string (required)
- **PORT**: Server port (defaults to framework standard)

### Replit Integration
- **Cartographer**: Development tool integration for debugging
- **Runtime Error Modal**: Enhanced error reporting in development
- **Banner**: Development mode indicator for external access