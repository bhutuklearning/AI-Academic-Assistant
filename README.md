# Academic Help Buddy

Academic Help Buddy is an AI-powered academic assistant platform designed to help students organize their coursework, generate study materials, prepare for exams, and collaborate with peers. The platform leverages large language models to transform raw syllabi, lecture notes, and uploaded documents into structured notes, reports, quizzes, mock papers, and revision plans.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### AI-Powered Content Generation
- Generate structured study notes from topics, syllabi, or uploaded documents
- Create formatted reports and presentation outlines
- Customizable output styles to control tone, depth, and formatting

### Exam Preparation Suite
- Exam Blueprints -- AI-generated breakdown of expected question distribution by topic
- Revision Planners -- personalized daily and weekly revision schedules based on exam dates
- Rapid Revision Sheets -- condensed, high-yield study material for last-minute review
- Mock Papers -- full-length practice papers generated from your subject content

### Quizzes and Self-Assessment
- AI-generated quizzes per subject with configurable difficulty
- Quiz attempt tracking with analytics and performance trends over time

### Document Context System
- Upload PDFs, lecture slides, and notes to build per-subject context
- AI reads uploaded documents and uses them to generate more relevant, personalized content

### Community
- Share study materials, notes, and resources with other students
- Browse, upvote, comment on, and clone posts from the community feed
- Report inappropriate content for moderation

### Study Session Tracking
- Start and end timed study sessions per subject
- Track cumulative study time and frequency across subjects

### File Management
- Upload images, PDFs, videos, audio, and documents to Cloudinary
- Automatic image compression via Sharp before upload (WebP conversion, 40-60% size reduction)
- Per-file-type size limits with clear error messages
- MIME type whitelisting to block unsupported formats

### User Profiles and Progress
- Track learning progress across all subjects
- View recently accessed content
- Manage profile settings

---

## Architecture

The application follows a standard client-server architecture:

```
                  HTTPS                   HTTPS
  Browser  ------------------>  Backend  ------------------>  MongoDB Atlas
  (React)                      (Express)                     (Database)
                                  |
                                  | HTTPS
                                  |---------------->  OpenRouter API
                                  |                  (AI / LLM)
                                  |
                                  |---------------->  Cloudinary
                                                     (File Storage / CDN)
```

- **Frontend** -- React SPA served from Vercel. Communicates with the backend via RESTful API calls.
- **Backend** -- Express.js server deployed on Render. Handles all business logic, AI orchestration, authentication, and file processing.
- **Database** -- MongoDB Atlas. Stores users, subjects, content, quizzes, sessions, community posts, and all application data.
- **AI Provider** -- OpenRouter. Routes requests to models such as Google Gemini for content generation.
- **File Storage** -- Cloudinary. Stores and serves uploaded files with CDN delivery and automatic format optimization.

---

## Technology Stack

| Component | Frontend | Backend |
|---|---|---|
| Language | JavaScript (JSX) | JavaScript (ES Modules) |
| Runtime | Browser | Node.js v22+ |
| Framework | React 19 | Express.js v5 |
| Build Tool | Vite 7 | -- |
| Routing | React Router DOM v7 | Express Router |
| State | Zustand | -- |
| Styling | Tailwind CSS v3 | -- |
| HTTP Client | Axios | Axios |
| Database | -- | MongoDB via Mongoose |
| Auth | JWT (localStorage) | JWT (access + refresh tokens) |
| AI | -- | OpenRouter SDK |
| File Upload | -- | Multer + Sharp |
| File Storage | -- | Cloudinary |
| Charts | Recharts | -- |
| Rate Limiting | -- | express-rate-limit |
| Deployment | Vercel | Render |

---

## Repository Structure

```
project/
|-- backend/
|   |-- src/
|   |   |-- config/          # Database and Cloudinary configuration
|   |   |-- controllers/     # Route handlers for all API domains
|   |   |-- middleware/       # JWT authentication middleware
|   |   |-- models/          # Mongoose schemas and data models
|   |   |-- routes/          # Express route definitions
|   |   |-- services/        # AI orchestration and external API integrations
|   |   |-- utils/           # Shared utility functions
|   |   |-- server.js        # Application entry point
|   |-- .env.sample          # Backend environment variable template
|   |-- package.json
|   |-- README.md            # Backend-specific documentation
|
|-- frontend/
|   |-- public/              # Static assets
|   |-- src/
|   |   |-- components/      # Reusable UI components
|   |   |-- pages/           # Page-level components (11 pages)
|   |   |-- services/        # Axios API client with token refresh
|   |   |-- store/           # Zustand state management
|   |   |-- App.jsx          # Root component and route declarations
|   |   |-- main.jsx         # Application entry point
|   |   |-- index.css        # Global styles
|   |-- .env.sample          # Frontend environment variable template
|   |-- vite.config.js       # Vite dev server and build configuration
|   |-- vercel.json          # Vercel deployment and routing rules
|   |-- package.json
|   |-- README.md            # Frontend-specific documentation
|
|-- .gitignore
|-- README.md                # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB** instance (local or MongoDB Atlas)
- A **Cloudinary** account
- An **OpenRouter** API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Academic-AI-Assistant.git
cd Academic-AI-Assistant/project

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Environment Configuration

Both the backend and frontend require environment variables to run. Each directory contains a `.env.sample` file as a template.

### Backend (backend/.env)

```env
PORT=7000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-3-flash-preview

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

BACKEND_URL=http://localhost:7000
FRONTEND_URL=http://localhost:3000
```

### Frontend (frontend/.env)

```env
VITE_API_URL=http://localhost:7000/api
```

Refer to the README files in `/backend` and `/frontend` for the full list of variables and their descriptions.

---

## Running Locally

Open two terminals and start both servers:

**Terminal 1 -- Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 -- Frontend**
```bash
cd frontend
npm run dev
```

The frontend opens at **http://localhost:3000** and communicates with the backend at **http://localhost:7000**.

---

## Deployment

### Backend -- Render

1. Create a new Web Service on Render (https://render.com/).
2. Set the root directory to `backend`.
3. Set the build command to `npm install` and the start command to `npm start`.
4. Add all environment variables from `backend/.env` to the Render dashboard.
5. Set `FRONTEND_URL` to your deployed Vercel URL.

### Frontend -- Vercel

1. Connect the repository to Vercel (https://vercel.com/).
2. Set the root directory to `frontend`.
3. Add the environment variable `VITE_API_URL` with the value of your deployed Render backend URL followed by `/api`.
4. Deploy. Vercel runs `npm run build` automatically and serves the output.

The `vercel.json` file handles SPA routing rewrites and static asset caching automatically.

---

## API Documentation

The backend exposes a RESTful API at `/api` with the following route groups:

| Route Group | Base Path | Description |
|---|---|---|
| Authentication | /api/auth | Register, login, token refresh, current user |
| Users | /api/users | Profile management, progress tracking |
| Subjects | /api/subjects | Subject CRUD operations |
| Content | /api/content | AI-generated notes, reports, presentations |
| Context | /api/context | Document upload and subject context management |
| Exam Tools | /api/exam | Blueprints, planners, revision sheets, mock papers |
| Quizzes | /api/quiz | Quiz generation, attempts, and analytics |
| Sessions | /api/sessions | Study session tracking |
| Styles | /api/styles | Output style configuration |
| Community | /api/community | Posts, comments, votes, cloning, reporting |
| File Upload | /api/cloudinary | File upload, deletion, and configuration status |
| Admin | /api/admin | Administrative endpoints |

For the complete endpoint reference with methods, parameters, and authentication requirements, see the Backend README (./backend/README.md).

---

## Contributing

1. Fork the repository.
2. Create a feature branch from `main`.
3. Commit your changes with clear, descriptive messages.
4. Open a pull request describing the change and linking any relevant issues.

---

## License

This project was developed as part of a hackathon. Contact the repository owner for licensing details.
