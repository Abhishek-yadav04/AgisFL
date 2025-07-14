
# AgiesFL Security Platform - Teacher Demo

## Quick Start Guide

### Prerequisites
- Node.js installed
- PostgreSQL database running

### Setup Instructions

1. **Clone/Download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   - Edit `.env` file with your database credentials
   - Update `DATABASE_PASSWORD` with actual password

4. **Initialize Database:**
   ```bash
   npm run db:push
   ```

5. **Start Application:**
   ```bash
   npm run dev
   ```

6. **Access Application:**
   - Open browser to: `http://localhost:5000`
   - Default login: admin/password

### Features Demonstrated

- ✅ Real-time threat monitoring dashboard
- ✅ PostgreSQL database integration
- ✅ Federated learning simulation
- ✅ WebSocket real-time updates
- ✅ AI-powered security insights
- ✅ Incident management system

### Technical Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Real-time:** WebSocket connections
- **Security:** JWT authentication, rate limiting

### Production Features

- Production-ready database configuration
- Environment variable management
- CORS configuration for external access
- Comprehensive logging system
- Error handling and recovery

## Troubleshooting

If database connection fails:
1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Run `npm run db:push` to ensure schema exists

## Demo Highlights

This application showcases:
- Modern full-stack development practices
- Database design and integration
- Real-time web technologies
- Security-focused architecture
- Production deployment readiness
