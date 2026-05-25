# 📈 Trading App (Angular)

A modern single-page trading dashboard built with Angular, designed to simulate a simplified financial trading platform. The application demonstrates frontend architecture, market data integration, authentication, portfolio management, and database persistence using Supabase.

This project was developed for educational and demonstration purposes, focusing on scalable Angular architecture, service-oriented design, and third-party API integrations.

---

## 📖 Overview

The Trading App provides users with a simulated trading experience where they can:

- Monitor market information
- Manage investment portfolios
- Track stocks through watchlists
- Simulate trade/order functionality
- Receive notifications
- Authenticate users securely
- Persist data through Supabase

The project emphasizes modular frontend architecture, reusable services, and clean Angular development practices.

---

## ✨ Features

### 📊 Dashboard
- Portfolio overview
- Market summary
- Real-time or near real-time stock information
- Quick statistics and insights

### 💹 Market Data
- Integration with **Finnhub API**
- Stock price tracking
- Market data fetching service
- Configurable market-data provider architecture

### 💼 Portfolio Management
- Portfolio tracking
- Asset overview
- Holdings management
- Order scaffolding for future trading implementation

### ⭐ Watchlist
- Save favorite stocks
- Quick access to tracked assets
- Persistent user watchlists

### 🔔 Notifications
- User notifications service
- Trading and portfolio-related alerts
- Extendable event system

### 🔐 Authentication
- Login and authentication service
- Route guards
- Protected pages
- Supabase authentication integration

### 🗄️ Database Integration
- Supabase backend support
- PostgreSQL database
- SQL schema and seed files included

---

## 🛠️ Tech Stack

### Frontend
- **Angular 21**
- **TypeScript**
- HTML5
- CSS3

### Backend / Persistence
- **Supabase**
- PostgreSQL

### APIs
- **Finnhub API** (Market Data Provider)

### Testing
- **Vitest**
- Angular testing utilities

### Development Tools
- Angular CLI
- Node.js
- npm

---

## 🏗️ Project Architecture

The project follows a modular Angular structure to separate concerns and improve maintainability.

```txt
project-root/
│
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   ├── guards/
│   │   │   └── interceptors/
│   │   │
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── portfolio/
│   │   │   ├── trade/
│   │   │   ├── watchlist/
│   │   │   └── notifications/
│   │   │
│   │   ├── shared/
│   │   └── app.routes.ts
│   │
│   ├── environments/
│   └── main.ts
│
├── supabase/
│   ├── schema.sql
│   └── seed.sql
│
├── public/
├── angular.json
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Before running the project, ensure you have installed:

- Node.js (recommended LTS version)
- npm
- Angular CLI

Install Angular CLI globally:

```bash
npm install -g @angular/cli
```

Verify installation:

```bash
ng version
```

---

## ⚙️ Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Navigate to the project folder:

```bash
cd Trading-App
```

Install dependencies:

```bash
npm install
```

---

## 🔑 Environment Configuration

Create your environment configuration and provide API credentials.

Example environment variables:

```env
FINNHUB_API_KEY=your_api_key

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Required Services

#### Finnhub
Used for market data and stock information.

Create an account and get an API key:

https://finnhub.io/

#### Supabase
Used for authentication and database persistence.

Create a project:

https://supabase.com/

---

## ▶️ Running the Application

Start the development server:

```bash
npm start
```

or

```bash
ng serve
```

Open:

```txt
http://localhost:4200
```

The application automatically reloads whenever source files are modified.

---

## 🧪 Testing

Run unit tests:

```bash
npm test
```

or

```bash
ng test
```

The project uses **Vitest** for testing Angular services and components.

Look for test files:

```txt
*.spec.ts
```

---

## 🗄️ Database Setup

The `supabase/` directory contains SQL scripts required to initialize the database.

### Schema

```txt
supabase/schema.sql
```

Contains:
- Database tables
- Relationships
- Constraints

### Seed Data

```txt
supabase/seed.sql
```

Contains:
- Sample records
- Initial test data

Run these scripts inside your Supabase/PostgreSQL instance.

---

## 🔒 Authentication

Authentication is handled using **Supabase Auth**.

Implemented features include:

- Login
- Session handling
- Route guards
- Protected routes
- Authentication services

Authentication logic can be found inside:

```txt
src/app/core/services
```

---

## 📂 Important Project Files

| File | Description |
|------|-------------|
| `main.ts` | Angular application entry point |
| `main.server.ts` | Server-side rendering entry |
| `server.ts` | Server integration file |
| `schema.sql` | Database schema |
| `seed.sql` | Initial database data |
| `angular.json` | Angular configuration |
| `package.json` | Dependencies and scripts |

---

## 🧩 Available Scripts

### Development

```bash
npm start
```

Runs development server.

### Build

```bash
npm run build
```

Builds production assets.

### Test

```bash
npm test
```

Runs test suite.

### Angular Generate

Generate components/services:

```bash
ng generate component component-name
```

Example:

```bash
ng generate component dashboard
```

---

## 📈 Future Improvements

Potential enhancements for the project:

- Real trading simulation
- Buy/sell order execution
- Advanced analytics dashboard
- Portfolio performance charts
- Dark/light theme support
- Push notifications
- WebSocket live market updates
- E2E testing
- CI/CD pipeline integration

---

## 🎓 Educational Objectives

This project demonstrates:

- Angular architecture
- Service-oriented frontend development
- State and feature modularization
- Authentication and route guards
- Third-party API integration
- Database persistence using Supabase
- Component-based UI development
- Testing practices using Vitest

---

## 👨‍🏫 Notes for Instructors

This repository was developed as an academic project to demonstrate:

- Clean Angular architecture
- Modular frontend development
- Service abstraction
- Third-party integrations
- Authentication flows
- Database persistence patterns
- Maintainable and scalable project organization

For a formal academic explanation and evaluation, see:

```txt
Teacher_Report.md
```

---

## 📄 License

This project is intended for educational purposes.

---

## 👤 Author

Developed as an educational trading platform project using Angular and Supabase.