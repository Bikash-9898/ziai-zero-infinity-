ZIAI --- AI Assistant & Multi-Model Platform

ZIAI is a full-stack web-based AI assistant platform that provides a
unified interface for conversational AI, image generation, file
management, usage tracking, model routing, administration,
subscriptions, and payment workflows.

🚀 Features

🤖 Conversational AI chat

🧠 Multiple AI providers

⚡ Automatic AI model routing

🎨 AI image generation

📁 Personal file library

👤 User authentication and guest access

💳 Plans, subscriptions, wallet and payments

📊 Usage tracking and analytics

🛠️ Admin dashboard

🔎 Configurable search integrations

🧠 AI Models & Providers

The backend supports provider integrations for:

OpenAI

Anthropic

Google Gemini

Hugging Face

NVIDIA-compatible APIs

Image-generation providers include:

Hugging Face

fal.ai

Pollinations AI

The model registry stores provider metadata, model identifiers, pricing,
tiers, image capability, and active status.

⚡ Automatic Model Routing

ZIAI can automatically select an eligible AI model based on message
difficulty.

The routing service considers factors such as:

Message length

Code blocks

Complexity keywords

Question count

Conversation depth

Messages are classified into:

Simple → Medium → Complex

These map to capability tiers:

Fast → Balanced → Flagship

The user's plan also acts as a tier limit.

🖥️ Frontend

Technologies

Technology                    Purpose

React                         UI development
TypeScript                    Type-safe development
React Router                  Routing
Vite-oriented configuration   Development/build setup
React Markdown                Markdown rendering
Framer Motion                 Animations
Lucide React                  Icons
React Hot Toast               Notifications
CSS                           Responsive styling

Main Pages

Home

Guest Page

Chat Page

Image Page

Library Page

Billing Page

Plans Page

Usage Statistics

Client Dashboard

Admin Dashboard

⚙️ Backend

Technologies

Technology          Purpose

Python              Backend development
FastAPI             REST API
Starlette           ASGI foundation
Pydantic            Data validation
SQLAlchemy          ORM
PostgreSQL          Database
asyncpg             Async PostgreSQL driver
JWT / python-jose   Authentication
bcrypt              Password security
slowapi             Rate limiting
CORS                Cross-origin control
StaticFiles         Local file serving

Payment integrations:

eSewa

Khalti

Stripe

🏗️ Architecture

User
  │
  ▼
React + TypeScript Frontend
  │
  │ HTTP / WebSocket
  ▼
FastAPI + Python Backend
  │
  ├── Authentication
  ├── AI Service
  ├── Model Routing
  ├── Image Service
  ├── Billing
  ├── Usage Tracking
  ├── File Library
  └── Administration
       │
       ├── PostgreSQL
       ├── AI Providers
       ├── Image Providers
       └── Payment Gateways

🗄️ Database

The project uses PostgreSQL-oriented asynchronous database access with
SQLAlchemy.

Main entities include:

User

Conversation

Message

File

Usage Record

Model

Plan

Subscription

Payment

📡 API Modules

Module           Main Functions

Authentication   Login, guest access, current user, admin login
Chat             Messages, conversations, models
Image            Generation, history, credits
Library          Upload, list, delete
Billing          Wallet, subscriptions, payments
Plans            Plans and comparison
Usage            Usage and analytics
Administration   Users, models, pricing, API keys
Payments         eSewa, Khalti, Stripe
Voice            WebSocket status/connection

🔐 Security

The application includes:

JWT bearer authentication

Protected routes

Admin authorization

CORS controls

Rate limiting

Environment-based secrets

Active-user validation

Provider-specific payment verification

Production Recommendations

Before production deployment:

Replace development fallback secrets

Never commit API keys

Use HTTPS

Restrict CORS origins

Use secure secret management

Add database migrations

Validate uploaded files

Use object storage for scalable deployments

Add audit logging

Pin dependencies and scan for vulnerabilities

📂 Project Structure

ZIAI/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── api/
│       ├── contexts/
│       ├── hooks/
│       ├── assets/
│       ├── config.ts
│       └── App.tsx
│
├── backend/
│   └── app/
│       ├── routers/
│       ├── services/
│       ├── models/
│       ├── middleware/
│       ├── auth_jwt.py
│       ├── database.py
│       └── main.py
│
└── README.md

⚙️ Environment Variables

Frontend

VITE_API_URL=http://localhost:8000

Backend

DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/ziai
JWT_SECRET_KEY=your_strong_secret_key
JWT_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173

OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
HUGGINGFACE_API_KEY=your_huggingface_key

Never commit real API keys or secrets to GitHub.

🚀 Installation

The supplied source archive did not contain the exact dependency
lock/configuration files, so use the project's actual package.json,
requirements.txt, or pyproject.toml when available.

Backend

cd backend
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend

cd frontend
npm install
npm run dev

Typical development URLs:

Frontend: http://localhost:5173
Backend:  http://localhost:8000

💰 Estimated Development Cost

The project report estimates the one-time development cost at
approximately:

NPR 1,50,000

Cost Component                                      Estimated Cost

Frontend Development                                    NPR 20,000
Backend & Database Development                          NPR 20,000
AI Model & Provider Integration                         NPR 10,000
Testing, Integration & Deployment Preparation           NPR 10,000
Documentation & Project Report                          NPR 10,000
Total Estimated Development Cost              NPR 1,50,000

This is an academic/project development estimate, not an official
commercial quotation.

Recurring costs such as AI API usage, hosting, domain registration,
database hosting, storage, and payment-gateway charges are not included.

⚠️ Current Limitations

A production-ready RAG pipeline was not verified in the supplied
active backend source.

The voice WebSocket is currently a connection/status scaffold rather
than a complete speech-to-speech pipeline.

Production deployment configuration and dependency lockfiles were
not included.

Local file storage may not be ideal for horizontally scaled
production deployment.

A dedicated database migration system would improve production
schema management.

🔮 Future Enhancements

Complete RAG pipeline

Document ingestion and chunking

Embeddings and vector search

Citation-aware responses

Persistent conversation memory

Real-time voice transcription

Speech synthesis

Full-duplex voice conversation

Streaming AI responses

S3-compatible object storage

Background processing

Automated testing and CI/CD

Monitoring and observability

Multimodal document understanding

Richer file previews

🧪 Testing

Recommended testing areas include:

Authentication and guest flows

AI provider requests

Automatic model routing

Image generation

File upload and deletion

Subscription and payment verification

Usage-limit enforcement

Admin operations

Responsive UI

Protected routes

Error and loading states

📋 Demo Flow

Open the ZIAI home page.

Continue as Guest.

Send a limited chat request.

Sign in and open the Client Dashboard.

Select an AI model and send a message.

Select Auto mode and demonstrate model routing.

Generate an image.

Upload a PDF/TXT/CSV/image to the Library.

Review Usage Statistics.

Demonstrate Billing/Plans in test mode.

Open the Admin Dashboard.

📚 Documentation

The project report contains:

System architecture

Data Flow Diagram

ER Diagram

UML Use Case Diagram

UML Sequence Diagram

UML Class Diagram

Technology Stack

Frontend and Backend Design

AI Model Integration

Image Generation

File Library

Authentication

Billing and Payments

Usage Tracking

Database Design

API Overview

Security

Testing

Limitations and Future Enhancements

📄 License

Add the license that applies to your project before making the
repository public.

👨‍💻 Project

Project: ZIAI --- AI Assistant & Multi-Model Platform
Frontend: React + TypeScript
Backend: Python + FastAPI
Database: PostgreSQL
AI: Multiple AI Provider Integrations
Payments: eSewa, Khalti, Stripe
