---
title: NexPrep AI Backend
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# NexPrep AI — Advanced Backend API
Welcome to the backend engine of **NexPrep AI**, an intelligent, AI-powered interview preparation platform designed to help software engineers bridge the gap between their resumes and live interview performance. 

This API acts as the core orchestration layer, processing resume PDFs, matching skills semantically, and streaming interactive AI interview evaluations.

---

## 🚀 Key Highlights & Purpose
Designed with clean architecture, high scalability, and robust security, this backend showcases production-ready backend engineering patterns that recruiters look for:
*   **AI-Generated Assessments**: Integrates with **Ollama Cloud** (`gemma4:31b-cloud`) to formulate challenging, topic-specific coding and behavioral questions.
*   **Semantic Vector Search & RAG**: Employs **FAISS** (Facebook AI Similarity Search) and Hugging Face **Sentence-Transformers** (`all-MiniLM-L6-v2`) to turn resume items into dense vector embeddings for semantic skills matching.
*   **Quantitative Feedback Pipelines**: Generates structured evaluation metrics assessing candidates on communication, confidence, grammar, and alignment with the **STAR** method (Situation, Task, Action, Result).
*   **Security & Authentication**: Implements JWT-based stateless user authorization with cryptographically salted passwords (bcrypt).

---

## 🛠️ Tech Stack & Libraries
*   **Core Framework**: [FastAPI](https://fastapi.tiangolo.com/) — high-performance Python ASGI framework for building asynchronous APIs.
*   **Database ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) — asynchronous object-relational mapping.
*   **Database System**: [PostgreSQL](https://www.postgresql.org/) (Hosted on **Supabase** cloud for production).
*   **Vector Embeddings & Search**: [FAISS-CPU](https://github.com/facebookresearch/faiss) & [Sentence-Transformers](https://sbert.net/).
*   **PDF Extraction**: [PyMuPDF](https://pymupdf.readthedocs.io/en/latest/) & [PyPDF](https://pypdf.readthedocs.io/en/stable/).
*   **AI Orchestration**: [Ollama Python SDK](https://github.com/ollama/ollama-python).
*   **Auth & Security**: [PyJWT](https://pyjwt.readthedocs.io/) & [Passlib](https://passlib.readthedocs.io/) (Bcrypt).
*   **Environment Configuration**: `python-dotenv`.

---

## 🏗️ Architectural Overview
```mermaid
graph TD
    A[Vite/React Frontend] -->|HTTPS REST / JSON| B[FastAPI API Gateway]
    B -->|JWT Auth Middleware| C[Auth Router]
    B -->|PDF Parsing & FAISS Embeddings| D[Resume Analyzer]
    B -->|Ollama Client offloader| E[AI Evaluation Engine]
    B -->|SQLAlchemy ORM| F[PostgreSQL / Supabase]
```

---

## 🔌 API Endpoint Highlights

### 🔐 Authentication (`/api/auth`)
*   `POST /api/auth/register` — User signup.
*   `POST /api/auth/login` — Login flow generating short-lived JWT tokens.
*   `GET /api/auth/me` — Fetches current user profile based on JWT headers.

### 📄 Resume Analysis (`/api/resume`)
*   `POST /api/resume/analyze` — Multipart PDF upload parser. Extracts skills and triggers FAISS semantic vector search.
*   `GET /api/resume/history` — Retrieves historical resume reports and ATS evaluations.

### 💬 Technical & HR Interviews (`/api/interview`)
*   `POST /api/interview/technical/start` — Requests AI-curated practice questions based on framework/language.
*   `POST /api/interview/technical/submit-batch` — Evaluates candidate answers, returning strengths, weaknesses, benchmark answers, and tips.
*   `POST /api/interview/hr/submit-batch` — Evaluates behavioral answers based on communication and confidence scoring matrices.

---

## ⚙️ Quick Local Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/Scripts/activate # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` file (copy `.env.example` if available):
   ```env
   SECRET_KEY=your_jwt_signing_secret
   DATABASE_URL=postgresql://user:password@host:port/dbname
   OLLAMA_API_KEY=your_ollama_cloud_key
   OLLAMA_HOST=https://ollama.com
   ```
5. Run migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
