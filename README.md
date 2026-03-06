<div align="center">
  <img src="public/vite.svg" alt="VaultX Logo" width="120" />
</div>

<h1 align="center">🛡️ VaultX</h1>
<p align="center">
  <strong>Next-Gen Vehicle Identity, Security & Incident Management System</strong>
</p>

<p align="center">
  <a href="#-about-the-project">About The Project</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-ai-integration">AI Integration</a>
</p>

---

## 📖 About The Project

**VaultX** is a unified, real-time platform that redefines how we manage vehicle identities, track ownership, verify insurance, and handle emergencies using cutting-edge tech and AI.

In today's fragmented reality, vehicle data lives in silos, making buying used cars risky and emergency response inefficient. VaultX acts as a central hub powered by **Supabase Realtime**, featuring cryptographic ownership transfer verification and a community-driven stolen vehicle network.

> 🏆 **Built for the Hackathon**

---

## ✨ Features

1. **🔐 Digital Vehicle Identity Vault**
   - A centralized profile for every vehicle tracking status, age, and AI Risk Scores.
   - Beautiful 3D identity card visualizations.

2. **⛓️ Ownership Transfer Chain**
   - Cryptographically hashed ownership transfers (SHA-256) ensuring a tamper-proof history.
   - Interactive Neo4j-inspired **Graph Database Visualization** mapping Owner ➡️ Vehicle ➡️ Block interactions.
   - AI Fraud Detection flags rapid transfers or circular loops.

3. **🛡️ Active Insurance Shield**
   - Real-time active policy tracking with an interactive 3D shield visualization (Green = Active, Red = Expired).
   - AI analyzes coverage gaps and gives expiry warnings.

4. **🆘 Emergency SOS Broadcast**
   - One-Tap SOS instantly broadcasts driver's blood type, vehicle details, and live GPS to a centralized registry.
   - Expanding 3D radar pulse animation guides rescuers.
   - AI Readiness checks to evaluate emergency profile completeness.

5. **🚨 Stolen Vehicle Alert Network**
   - Community-powered network to mark vehicles stolen, sending instant GPS location pings.
   - Users can report live sightings to track vehicles in real time.
   - AI analyzes patterns to predict theft hotspots and time-of-day risks.

---

## 🛠 Tech Stack

**Frontend**

- **React (Vite)** – Blazing fast SPA architecture.
- **Three.js & React Three Fiber** – Interactive 3D graphics (Car models, shields, radar).
- **GSAP (GreenSock)** – Smooth UI micro-animations and scroll effects.
- **Lucide React** – Clean and beautiful iconography.
- **Vanilla CSS** – Highly customized Dark Glassmorphism design system.

**Backend & Architecture**

- **Supabase (PostgreSQL)** – Real-time database updates, WebSockets, and Row Level Security (RLS).
- **Native Web Crypto API** – For SHA-256 hashing in the ownership blockchain.
- **Custom AI Engine Scripts** – Rule-based algorithms providing risk, health, and coverage analysis on the fly.

---

## 🚀 Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- A [Supabase](https://supabase.com/) Project

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Arshdeep-Pasricha12/round-2_tetherx_chickenjockey.git
   cd round-2_tetherx_chickenjockey
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Setup Supabase Environment:**
   Update the `src/config/supabase.js` file with your project credentials:

   ```javascript
   const supabaseUrl = "YOUR_SUPABASE_URL";
   const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
   ```

4. **Initialize Supabase Schema:**
   - In your Supabase Dashboard, go to the SQL Editor.
   - Paste the contents of `supabase-schema.sql` and click **Run**.
   - Make sure to enable **Row Level Security (RLS)** and **Realtime Replication** on all tables.

5. **Start the development server:**

   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173/`.

---

## 🤖 AI Integration Overview

The app features a unified `aiEngine.js` module integrated into every aspect of the project:

- **Vault / Vehicle Risk:** Grades vehicles based on age, policy validity, and past theft records.
- **Chain / Fraud Analyzer:** Detects title washing and rapid ownership transfers using graph link counts.
- **Shield / Insurance Health:** Expiry proximity warnings, comprehensive vs third-party gap checks.
- **SOS / Preparedness Engine:** Examines identity, contact, and blood type fields, generating a % score and missing-items checklist.
- **Alerts / Theft Predictor:** Maps historical stolen flags to highlight vulnerable periods and recovery rates.

---

<p align="center">
  Built with ❤️ for Innovation.
  deployed link- https://round-2tetherx.vercel.app/
</p>

