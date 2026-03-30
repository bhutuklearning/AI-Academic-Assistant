# Backend

The backend is a RESTful API server that powers the Academic Help Buddy academic assistant platform. It handles authentication, AI-driven content generation, file management, community features, and all core business logic for the application.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v22+ |
| Framework | Express.js v5 |
| Database | MongoDB via Mongoose |
| AI Orchestration | OpenRouter (Google Gemini, etc.) |
| File Storage | Cloudinary |
| File Handling | Multer + Sharp (image compression) |
| Authentication | JWT — Access Token + Refresh Token |
| Rate Limiting | express-rate-limit |
| Process Manager | Nodemon (development) |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinaryConfig.js    # Multer setup, MIME whitelist, per-type size limits
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, refresh token
│   │   ├── cloudinary.js          # Upload, delete, compress (sharp)
│   │   ├── communityController.js # Posts, comments, votes, clone, report
│   │   ├── contentController.js   # AI notes, reports, PPT generation
│   │   ├── contextController.js   # Subject context / document ingestion
│   │   ├── examController.js      # Blueprints, planners, mock papers
│   │   ├── quizController.js      # Quiz creation, attempts, analytics
│   │   ├── sessionController.js   # Study session tracking
│   │   ├── styleController.js     # Output style management
│   │   ├── subjectController.js   # Subject CRUD
│   │   └── userController.js      # Profile, progress, recent content
│   ├── middleware/
│   │   └── auth.js                # JWT access + refresh token middleware
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # Express routers (one per domain)
│   ├── services/
│   │   └── aiOrchestrator.js      # OpenRouter API integration
│   ├── utils/                     # Shared helper utilities
│   └── server.js                  # Express app entry point
├── .env                           # Environment configuration (not committed)
├── .env.sample                    # Environment variable template
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A running MongoDB instance (local or Atlas)
- A Cloudinary account
- An OpenRouter API key

### Installation

```bash
# From the project root
cd backend
npm install
```

### Environment Configuration

Copy the sample file and fill in all required values:

```bash
cp .env.sample .env
```

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port the server listens on | No (default: 8000) |
| `NODE_ENV` | `development` or `production` | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for signing access tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Yes |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) | No (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) | No (default: 7d) |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI calls | Yes |
| `OPENROUTER_MODEL` | Model identifier (e.g. `google/gemini-3-flash-preview`) | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `BACKEND_URL` | Public URL of this server (used for self-ping) | Yes |
| `FRONTEND_URL` | Allowed CORS origin for the frontend | Yes |

### Running the Server

```bash
# Development (with hot reload via nodemon)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:<PORT>` (default: 7000).

---

## API Reference

All routes are prefixed with `/api`. Protected routes require a `Bearer` token in the `Authorization` header.

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user account |
| POST | `/login` | No | Login and receive access + refresh tokens |
| POST | `/refresh` | Refresh token | Exchange a refresh token for a new access token |
| GET | `/me` | Yes | Get the currently authenticated user |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/profile` | Yes | Get user profile |
| PUT | `/profile` | Yes | Update user profile |
| GET | `/progress` | Yes | Get learning progress statistics |
| GET | `/recent-content` | Yes | Get recently accessed content |

### Subjects — `/api/subjects`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List all subjects for the user |
| GET | `/:id` | Yes | Get a specific subject |
| POST | `/` | Yes | Create a new subject |
| PUT | `/:id` | Yes | Update a subject |
| DELETE | `/:id` | Yes | Delete a subject |

### Content (AI Generation) — `/api/content`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:subjectId` | Yes | Get all content for a subject |
| GET | `/item/:id` | Yes | Get a specific content item |
| POST | `/notes` | Yes | Generate AI-powered study notes |
| POST | `/report` | Yes | Generate an AI-powered report |
| POST | `/ppt` | Yes | Generate AI-powered presentation content |
| PUT | `/:id` | Yes | Update a content item |
| DELETE | `/:id` | Yes | Delete a content item |

### Context (Document Ingestion) — `/api/context`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:subjectId` | Yes | Get all context documents for a subject |
| GET | `/:subjectId/search` | Yes | Search within context documents |
| POST | `/` | Yes | Upload a document to add as context (multipart) |
| PUT | `/:id` | Yes | Update a context entry |
| DELETE | `/:id` | Yes | Delete a context entry |

### Exam Tools — `/api/exam`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/blueprint` | Yes | Generate an exam blueprint |
| POST | `/planner` | Yes | Generate a revision planner |
| POST | `/rapid-sheets` | Yes | Generate rapid revision sheets |
| POST | `/mock-paper` | Yes | Generate a mock exam paper |
| GET | `/plans/:subjectId` | Yes | Get saved exam plans for a subject |

### Quiz — `/api/quiz`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:subjectId` | Yes | Get all quizzes for a subject |
| POST | `/` | Yes | Create a new quiz |
| POST | `/attempt` | Yes | Submit a quiz attempt |
| GET | `/analytics/:subjectId` | Yes | Get quiz analytics for a subject |

### Study Sessions — `/api/sessions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get all study sessions for the user |
| POST | `/start` | Yes | Start a new study session |
| PUT | `/:id/end` | Yes | End an active study session |

### Output Styles — `/api/styles`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get user-created styles |
| GET | `/defaults` | Yes | Get system default styles |
| POST | `/` | Yes | Create a custom style |
| PUT | `/:id` | Yes | Update a style |
| DELETE | `/:id` | Yes | Delete a style |
| PUT | `/:id/activate` | Yes | Set a style as active |

### Community — `/api/community`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/posts` | No | List all community posts |
| GET | `/posts/:id` | No | Get a specific post |
| POST | `/posts` | Yes | Create a community post (multipart) |
| POST | `/posts/:id/vote` | Yes | Upvote or downvote a post |
| POST | `/posts/:id/comment` | Yes | Comment on a post |
| GET | `/posts/:id/comments` | No | Get all comments for a post |
| POST | `/posts/:id/clone` | Yes | Clone a post to your own subjects |
| POST | `/posts/:id/report` | Yes | Report a post |
| DELETE | `/posts/:id` | Yes | Delete a post |

### File Upload — `/api/cloudinary`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/config` | No | Check Cloudinary configuration status |
| POST | `/upload` | Yes | Upload a single file |
| POST | `/upload-multiple` | Yes | Upload multiple files (max 10) |
| DELETE | `/delete/:public_id` | Yes | Delete a file by its Cloudinary public ID |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | API welcome message |
| GET | `/api/health` | No | Health check |
| GET | `/ping` | No | Server keep-alive ping endpoint |
| GET | `/api/test-ai-key` | No | Test and diagnose the OpenRouter API key |

---

## File Upload Limits

Files are validated by MIME type before reaching the controller. Unsupported types are rejected immediately with a `400` error.

| File Type | Allowed Extensions | Size Limit |
|---|---|---|
| Images | `.jpg` `.png` `.gif` `.webp` `.svg` | 5 MB |
| PDF | `.pdf` | 20 MB |
| Video | `.mp4` `.mov` `.avi` `.mkv` `.webm` | 100 MB |
| Audio | `.mp3` `.wav` `.ogg` `.aac` `.flac` | 25 MB |
| Documents | `.docx` `.pptx` `.xlsx` `.txt` `.csv` | 10 MB |

### Image Compression

All uploaded images (except SVG) are automatically compressed on the server using **Sharp** before being sent to Cloudinary:

- Converted to **WebP** format at 82% quality
- Resized to a maximum of **2048 x 2048** pixels (aspect ratio preserved, never upscaled)
- Typically reduces file size by **40 to 60%** with no visible quality loss

Cloudinary is also configured with `quality: auto` and `fetch_format: auto` to adaptively serve the optimal format and quality to each client.

---

## Authentication Model

The API uses a dual-token authentication strategy:

- **Access Token** — Short-lived (default 15 minutes). Sent in the `Authorization: Bearer <token>` header on every protected request.
- **Refresh Token** — Long-lived (default 7 days). Used exclusively at `POST /api/auth/refresh` to obtain a new access token. Never sent on regular API calls.

---

## Rate Limiting

All `/api/*` routes are rate-limited to **70 requests per minute** per IP address. Requests that exceed this limit receive a `429 Too Many Requests` response.

---

## Error Response Format

All error responses follow a consistent JSON structure:

```json
{
  "error": "Short error identifier",
  "message": "Human-readable description of the error"
}
```

File size and type errors return `400` or `413` with this same structure, including the specific filename and limit that was breached.

---

## Deployment

The server is designed for deployment on platforms such as **Render**. Key production considerations:

- Set `NODE_ENV=production` to suppress development-only logging.
- Set `FRONTEND_URL` to your deployed frontend origin for correct CORS configuration. All `*.vercel.app` origins are also automatically allowed.
- The server includes a self-ping mechanism (every 10 minutes) using the `BACKEND_URL` environment variable to prevent the instance from sleeping on free-tier hosting plans.
