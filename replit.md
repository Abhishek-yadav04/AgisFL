# CyberShield IR - Enterprise Security Platform

## Overview

CyberShield IR is a comprehensive cybersecurity incident response platform designed for enterprise environments. It provides real-time threat detection, incident management, and security analytics through a modern web interface. The system is built using a full-stack TypeScript architecture with React frontend, Express.js backend, and PostgreSQL database with real-time WebSocket communication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: TailwindCSS with custom CyberShield theme
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Real-time Communication**: WebSocket server for live updates
- **API Design**: RESTful API with structured error handling
- **Development**: Hot module replacement via Vite integration

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle migrations with version control
- **Connection Pooling**: Connection pooling for optimal performance

## Key Components

### Security Operations Dashboard
- **Metrics Overview**: Real-time security metrics and KPIs
- **Threat Activity Feed**: Live threat detection updates
- **System Health Monitoring**: Infrastructure status tracking
- **Incident Management**: Comprehensive incident lifecycle management
- **AI-Powered Insights**: Machine learning-driven security recommendations
- **Attack Path Visualization**: Network topology and attack vector analysis

### Data Models
- **Users**: Role-based access control (analysts, administrators)
- **Incidents**: Full incident lifecycle with severity classification
- **Threats**: Threat intelligence with confidence scoring
- **System Metrics**: Performance and health monitoring data
- **AI Insights**: Automated security analysis and recommendations
- **Attack Paths**: Network topology and compromise analysis

### Real-time Features
- **WebSocket Integration**: Live updates for threats, incidents, and system metrics
- **Subscription Management**: Channel-based real-time data streaming
- **Heartbeat Monitoring**: Connection health management

## Data Flow

1. **Threat Detection**: External security tools feed threat data via API endpoints
2. **Data Processing**: Backend validates and stores threat intelligence in PostgreSQL
3. **Real-time Broadcasting**: WebSocket server pushes updates to connected clients
4. **Dashboard Updates**: React components automatically refresh with new data
5. **Incident Creation**: High-priority threats automatically generate incidents
6. **AI Analysis**: Background services analyze patterns and generate insights
7. **User Interaction**: Security analysts investigate and respond to incidents

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **ws**: WebSocket server implementation
- **wouter**: Lightweight React router

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and development experience
- **TailwindCSS**: Utility-first CSS framework
- **PostCSS**: CSS processing and optimization

## Deployment Strategy

### Development Environment
- **Hot Module Replacement**: Vite provides instant feedback during development
- **Database Migrations**: Drizzle handles schema changes automatically
- **Environment Variables**: DATABASE_URL required for database connection

### Production Build
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Static Assets**: Served through Express in production mode

### Infrastructure Requirements
- **Database**: PostgreSQL instance (Neon serverless recommended)
- **Node.js**: Runtime environment for backend services
- **Environment Variables**: DATABASE_URL for database connectivity

## Changelog

Changelog:
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.