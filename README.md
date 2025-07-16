

# AgisFL - Federated Learning Intrusion Detection System

## Project Overview
AgisFL is a real-time, enterprise-grade Federated Learning Intrusion Detection System (FL-IDS) with persistent storage, live analytics, and a modern dashboard. Built for final year projects and beyond, it leverages federated learning and AI to provide advanced threat detection and incident response for security operations centers (SOCs), research, and education.

## Architecture

### Core Technologies
- **Frontend**: React 18 (Vite, TypeScript, Tailwind CSS, shadcn/ui)
- **Backend**: Flask (Python), REST API, WebSocket real-time communication
- **AI/ML**: Federated Learning, privacy-preserving algorithms
- **Database**: PostgreSQL (Neon)
- **Desktop**: Electron (for pure desktop packaging)
- **Security**: JWT authentication, rate limiting, audit logging

### System Diagram
```
┌────────────┐      ┌────────────┐      ┌────────────┐
│  Electron  │─────▶│  React UI  │─────▶│  Flask API │
└────────────┘      └────────────┘      └────────────┘
        │                │                   │
        ▼                ▼                   ▼
   WebSocket        REST API           PostgreSQL
```

### Screenshots
<p align="center">
  <img src="client/public/agiesfl-logo.png" alt="AgisFL Logo" width="120" />
</p>
<p align="center">
  <img src="attached_assets/Screenshot 2025-07-13 131618_1752476871237.png" alt="Dashboard Screenshot" width="600" />
</p>

### Key Features
1. **Real-time Threat Detection**: AI-powered, live threat identification
2. **Incident Management**: Full incident lifecycle, severity classification
3. **Federated Learning**: Distributed ML training across nodes
4. **Attack Path Visualization**: Network topology and attack vector mapping
5. **Compliance Reporting**: Automated security compliance and audit trails
6. **Modern Dashboard**: React, Tailwind, dark/light mode, accessibility, onboarding, and more
7. **Desktop App**: Runs as a pure desktop application via Electron

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- PostgreSQL (or Neon cloud DB)

### 1. Clone the Repository
```sh
git clone https://github.com/Abhishek-yadav04/AgisFL.git
cd AgisFL-1
```

### 2. Install Dependencies
#### Backend (Flask)
```sh
pip install -r requirements.txt
```
#### Frontend (React)
```sh
cd client
npm install
```

### 3. Configure Environment
- Set up your PostgreSQL database and update connection strings in backend config.

### 4. Run the App (Web)
#### Backend
```sh
python app.py
```
#### Frontend
```sh
cd client
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173)

### 5. Build as Desktop App (Electron)
```sh
npm run build
cd ..
npm install --prefix electron
npm run build --prefix electron
npm run start --prefix electron
```
This will launch AgisFL as a pure desktop application.

---

## Usage Instructions

1. **Login or access dashboard as guest**
2. **Monitor real-time threats, system health, and analytics**
3. **Load Demo Data**: Use the "Load Demo Data" button for instant demo
4. **Download Reports**: Click "Download Report" for CSV/PDF
5. **Help & Docs**: Access via floating button for API and usage info
6. **Profile & Theme**: Switch dark/light mode, view user profile
7. **Onboarding**: New users see onboarding tooltip for quick start

---

## Implementation Highlights

### Security Features
- Multi-factor authentication, RBAC
- Byzantine fault tolerance in FL nodes
- Differential privacy, anomaly detection

### Performance
- WebSocket real-time updates
- Query caching, state management
- Responsive, accessible UI

---

## Research & Impact
This project demonstrates:
1. Practical federated learning in cybersecurity
2. Privacy-preserving ML techniques
3. Real-time distributed threat detection
4. Enterprise-grade security automation

## Support & Documentation
- For questions, contact [Abhishek Yadav](mailto:abhishek@example.com)
- [GitHub Repo](https://github.com/Abhishek-yadav04/AgisFL)
- See `/client/src/pages/dashboard.tsx` for main dashboard code

---
