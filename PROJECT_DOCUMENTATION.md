# NextRound AI (NexPrep) - Comprehensive Project Documentation

## 1. Project Purpose & Overview
**NextRound AI** is an advanced, AI-powered interview preparation platform designed to bridge the gap between a candidate's resume and their live interview performance. 

The primary goal of the project is to simulate real-world technical and HR interviews. By uploading a resume and a target Job Description (JD), the platform uses semantic AI search to analyze the candidate's skills, generate highly relevant, challenging interview questions, and instantly evaluate the user's answers. It provides quantitative scores, identifies strengths and weaknesses, and offers benchmark "ideal" answers to help software engineers and professionals practice effectively.

---

## 2. Technologies Used

### Frontend (Client-Side)
*   **Framework:** React.js (Bootstrapped with Vite for fast performance).
*   **Styling:** Modern CSS (likely Tailwind CSS or similar utility-based styling) for responsive UI.
*   **HTTP Client:** Axios for making REST API calls to the backend.
*   **Deployment:** **Vercel** (Provides fast, global CDN hosting with automatic SSL and continuous integration).

### Backend (Server-Side)
*   **Core Framework:** **FastAPI** (Python). Chosen for its incredibly high performance, asynchronous capabilities, and automatic Swagger UI documentation.
*   **Database ORM:** **SQLAlchemy 2.0** for object-relational mapping, paired with **Alembic** for database migrations.
*   **Authentication:** Custom JWT (JSON Web Tokens) implementation using `PyJWT` and `passlib/bcrypt` for secure, salted password hashing. Also supports Google OAuth login.
*   **Deployment:** **Hugging Face Spaces (Docker)**. Upgraded from Render to HF Spaces to utilize the free 16GB RAM tier, which is mandatory for heavy Machine Learning workloads.

### Artificial Intelligence & Machine Learning (The Core Engine)
*   **Vector Embeddings:** **Sentence-Transformers** (`all-MiniLM-L6-v2` model) converts text from resumes into dense numerical vectors.
*   **Vector Database (Semantic Search):** **FAISS** (Facebook AI Similarity Search). Used to perform high-speed Retrieval-Augmented Generation (RAG). It matches the user's resume chunks against the Job Description chunks to find exact skill overlaps.
*   **Document Parsing:** **PyMuPDF (`fitz`)** for extracting clean text from uploaded PDF resumes.
*   **Large Language Models (LLMs):** Integrated with **Ollama Cloud** (e.g., `gemma4:31b-cloud`), Groq, and Google Gemini APIs. These LLMs act as the "Interviewer," generating dynamic questions and mathematically scoring the user's responses based on the STAR method (Situation, Task, Action, Result).

### Database Layer
*   **Database Engine:** **PostgreSQL**
*   **Hosting:** **Supabase**. A powerful, scalable cloud database provider that securely stores user profiles, encrypted passwords, resume metadata, and historical interview scores.

---

## 3. Core Features & Workflow

1.  **Resume Parsing & ATS Scoring:** Users upload a PDF resume. The backend parses the text, calculates an ATS (Applicant Tracking System) score, and extracts key skills.
2.  **Job Description (JD) Matching:** If a JD is provided, FAISS vector search analyzes how closely the resume aligns with the job requirements, outputting a match percentage and missing keywords.
3.  **Dynamic Interview Generation:** Based on the resume/JD context, the AI Engine generates a customized set of Technical or HR behavioral questions.
4.  **AI Evaluation Engine:** After the user submits their answers, the AI grades them on technical depth, communication, and confidence. It returns a detailed report card including:
    *   Overall Score
    *   Strengths & Weaknesses
    *   Mistakes made
    *   An "Ideal Benchmark Answer" for comparison.
5.  **History Tracking:** All past interviews and resume reports are saved securely in the Supabase PostgreSQL database for the user to review later.

---

## 4. Deployment Architecture (From Scratch to Production)

The deployment architecture is specifically decoupled to handle heavy AI workloads without crashing.

### Step 1: Database (Supabase)
*   A PostgreSQL instance was spun up on Supabase.
*   SQLAlchemy models were migrated to create tables for `users`, `resume_analysis`, `interview_history`, etc.
*   The connection string (`DATABASE_URL`) was generated for the backend to connect.

### Step 2: Backend (Hugging Face Spaces)
*   *Initial Attempt:* Deployed to Render's Free Tier (512MB RAM). The server instantly crashed (OOM) because loading PyTorch and SentenceTransformers requires more memory.
*   *Final Architecture:* Migrated to **Hugging Face Spaces** using a custom `Dockerfile`.
*   **Environment Variables:** Configured securely in Hugging Face settings (Secrets) so they aren't exposed in the code:
    *   `DATABASE_URL`
    *   `SECRET_KEY`
    *   `OLLAMA_API_KEY`
    *   `ALLOWED_ORIGINS` (To prevent CORS errors).
*   **Git Push:** Code was deployed via Git using a Personal Access Token (Write permissions) directly to the Hugging Face repository.

### Step 3: Frontend (Vercel)
*   The Vite/React frontend was deployed to Vercel via GitHub integration.
*   **API Connection:** The Vercel Environment Variables (`VITE_API_URL` or similar) were updated to point directly to the running Hugging Face Space URL (`https://anji7-nexprep.hf.space`).
*   This setup ensures the frontend is incredibly fast (hosted on Vercel's CDN), while the heavy Python AI lifting is isolated on Hugging Face's 16GB RAM servers.

---
*Document generated for project handover and architecture review.*
