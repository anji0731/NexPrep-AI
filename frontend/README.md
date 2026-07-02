# NexPrep AI — Responsive React Web App

Welcome to the frontend interface of **NexPrep AI**, a state-of-the-art web application that helps software engineers prepare for technical and behavioral interviews. 

Featuring a modern, high-fidelity UI/UX design with vibrant glassmorphism, responsive dashboards, and interactive mascot integrations, this codebase is built using React, TypeScript, and Vite.

---

## 🚀 Key Highlights & Purpose
The client interface is designed to provide candidates with a highly engaging and seamless user experience:
*   **Interactive Login Mascot**: Features a custom-designed **3D-shaded White Chibi Robot Mascot** built with responsive SVGs and **Framer Motion**. It reacts dynamically to form state, covering its eyes during password entry.
*   **Candidate Analytics Dashboard**: Aggregates resume ATS scores, interview histories, and category strengths in clean, scannable data views.
*   **Modular Assessment Arenas**: Interactive interfaces for multi-question technical and HR interview rounds with step-by-step navigation, timers, and detailed evaluation dashboards.
*   **JWT Token Handlers**: Fully integrated Axios interceptors that automatically attach JWT credentials to request headers, handling authentication states seamlessly.

---

## 🛠️ Tech Stack & Libraries
*   **Core UI Library**: [React 19](https://react.dev/) — functional components with hooks.
*   **Type Safety**: [TypeScript](https://www.typescriptlang.org/) — strict type enforcement for clean, bug-free components.
*   **Bundling tool**: [Vite](https://vite.dev/) — extremely fast bundler and hot-module replacement (HMR).
*   **Styling & Themes**: [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS framework coupled with clean, custom styling tokens.
*   **Animations**: [Framer Motion](https://www.framer.com/motion/) — smooth micro-animations, collapsible lists, and state-driven vector path morphing.
*   **Routing**: [React Router DOM v7](https://reactrouter.com/) — client-side routing.
*   **Network layer**: [Axios](https://axios-http.com/) — promise-based HTTP client for API interactions.
*   **Icons**: [Lucide React](https://lucide.dev/) — clean SVG icon pack.

---

## 💻 Pages & Features Overview

### 🎨 Home / Landing Page
Features glassmorphic pricing grids, interactive FAQ cards, product value propositions, and direct CTA buttons with smooth hover and transition states.

### 📊 Candidate Dashboard
The primary user portal displaying:
*   Aggregated ATS Resume Score.
*   Interactive links to start **Technical Practice** and **HR Practice** interviews.
*   Historical report cards with drill-down review drawers.

### 📝 Resume Analyzer
File drop-zone for resume PDFs. Displays a loading progression screen while the AI calculates the ATS score, extracts skills, and highlights missing capabilities.

### 🤖 Interactive Mascot Components
Located on the Authentication screens (`Login.tsx` & `Register.tsx`). The mascot is built using inline vector paths:
*   Its arms are morphing motion paths that flex naturally from the shoulder pivot points.
*   Its circular cyan eyes scale down to closed slits when the password field gains focus.

---

## ⚙️ Quick Local Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in the frontend root directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
5. Build the production package (compiles TypeScript via `tsc -b` and bundles Vite):
   ```bash
   npm run build
   ```
