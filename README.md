# CarbonTrack

CarbonTrack is a full-stack web application designed to help users understand, track, and reduce their carbon footprint through simple actions and personalized insights. Built for a hackathon.

## Features

- **Authentication**: Email/password signup & login with JWT. Protected routes.
- **Onboarding Questionnaire**: Set a baseline footprint based on transport, diet, electricity, and travel habits.
- **Dashboard**: View your footprint summary, streak tracker, 30-day savings trend chart, and category breakdown.
- **Carbon Calculator**: Input usage data to get an estimated CO2 output breakdown.
- **What-if Simulator**: Adjust habits virtually and see the projected impact on your footprint.
- **Log Activity**: Log preset or custom eco-actions with CO2 saved. Updates your dashboard and streak.
- **Personalized Tips**: Get recommendations based on your highest-emission category.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts, React Router
- **Backend**: Node.js, Express, sql.js (SQLite WebAssembly), jsonwebtoken, bcryptjs

## Setup Instructions

### 1. Prerequisites

- Node.js (v18+ recommended)
- npm

### 2. Backend Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (you can copy `.env.example`):
   ```bash
   cp ../.env.example .env
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`. The database `carbontrack.db` will be created automatically.

### 3. Frontend Setup

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## Usage

1. Open `http://localhost:5173` in your browser.
2. Sign up for a new account.
3. Complete the onboarding questionnaire to set your baseline.
4. Explore the dashboard, log an eco-action, try the calculator, and use the simulator!
