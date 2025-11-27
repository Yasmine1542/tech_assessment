# Dental Jewelry Preview - Backend API

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Architecture Decisions](#architecture-decisions)

---

## Overview

This API serves as the backend for a dental jewelry preview tool. Users can browse available jewelry items, capture photos, place jewelry on their photos, and save their creations. The API provides endpoints for:

- User registration and JWT-based authentication
- CRUD operations for jewelry items
- Saving and retrieving user canvas compositions
- Serving uploaded images (jewelry assets and saved canvases)

---

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma 6
- **Authentication**: JWT with Passport.js
- **Password Hashing**: bcrypt
- **File Upload**: Multer
- **Validation**: class-validator and class-transformer

---

## Project Structure

```
project-back/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migration history
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── jwt.strategy.ts    # JWT validation strategy
│   │   ├── guards/            # Route protection guards
│   │   ├── decorators/        # Custom decorators (@CurrentUser)
│   │   └── dto/               # Request/response data structures
│   ├── items/                 # Jewelry items module
│   │   ├── items.controller.ts
│   │   ├── items.service.ts
│   │   ├── items.module.ts
│   │   └── dto/
│   ├── saved-images/          # User saved canvases module
│   │   ├── saved-images.controller.ts
│   │   ├── saved-images.service.ts
│   │   └── saved-images.module.ts
│   ├── prisma/                # Database service wrapper
│   ├── health/                # Health check endpoint
│   ├── config/                # App configuration (multer, etc.)
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── uploads/                   # File storage directory
│   └── saved-images/          # User canvas images
└── test/                      # Test files
```

---

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js version 20 or higher
- PostgreSQL database server
- npm or yarn

### Installation Steps

1. Navigate to the backend directory:

```bash
cd project-back
```

2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your database credentials (see Environment Variables section).

5. Run database migrations:

```bash
npx prisma migrate dev
```

6. Seed the database with sample data:

```bash
npx prisma db seed
```

7. Start the development server:

```bash
npm run start:dev
```

The API will be running at `http://localhost:4050`.

---

## Environment Variables

Create a `.env` file in the project root with these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/dental_jewelry` |
| `JWT_SECRET` | Secret key for signing JWT tokens (use a long random string) | `your-secret-key-min-32-characters` |
| `PORT` | Port number for the server | `4050` |

Example `.env` file:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/dental_jewelry"
JWT_SECRET="change-this-to-a-secure-random-string-in-production"
PORT=4050
```

---

## Database Setup

### Schema Overview

The database has three main tables:

**User** - Stores account information
- id, name, email, password (hashed), role, timestamps

**Item** - Jewelry pieces available for placement
- id, name, imagePath, imageMime, defaultSize, category, timestamps

**SavedImage** - User-created canvas compositions
- id, name, imagePath, placedItems (JSON), userId, timestamps

### Commands

Apply migrations to your database:

```bash
npx prisma migrate dev
```

Reset the database (deletes all data):

```bash
npx prisma migrate reset
```

Seed initial data:

```bash
npx prisma db seed
```

Open the database viewer:

```bash
npx prisma studio
```

### Test Account

After seeding, you can log in with:
- Email: `test@test.com`
- Password: `Test123!`

---

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns server status |

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Create new account | No |
| POST | `/auth/login` | Get JWT token | No |
| GET | `/auth/me` | Get current user info | Yes |

**Register request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Login request body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Items

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/items` | List all items | No |
| GET | `/items?category=gems` | Filter by category | No |
| GET | `/items/:id` | Get single item | No |
| GET | `/items/:id/image` | Get item image file | No |
| POST | `/items` | Create item (multipart form) | No |
| PATCH | `/items/:id` | Update item | No |
| DELETE | `/items/:id` | Delete item | No |

**Item response format:**
```json
{
  "id": "uuid",
  "name": "Diamond Stud",
  "imagePath": "diamond-stud.png",
  "imageMime": "image/png",
  "defaultSize": 32,
  "category": "gems",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Saved Images

All saved-images endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/saved-images` | List user's saved images |
| GET | `/saved-images?limit=4` | Limit number of results |
| GET | `/saved-images/:id` | Get specific saved image |
| POST | `/saved-images` | Save new canvas (multipart form) |
| DELETE | `/saved-images/:id` | Delete saved image |

### Static Files

Uploaded files are served at `/uploads/`:
- Item images: `/uploads/filename.png`
- Saved canvases: `/uploads/saved-images/filename.png`

---

## Authentication

The API uses JWT tokens for authentication.

### How It Works

1. User logs in with email and password
2. Server returns a JWT access token
3. Client includes token in Authorization header for protected routes
4. Server validates token and identifies the user

### Using the Token

Add this header to authenticated requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Token Payload

The JWT contains:
- `sub`: User ID
- `email`: User email
- `role`: User role (user/admin)

---

## Architecture Decisions

### Why NestJS

NestJS provides a structured, module-based architecture that keeps code organized as projects grow. The dependency injection system makes testing straightforward and promotes separation of concerns. TypeScript support is first-class, and the framework has excellent documentation.

### Why Prisma

Prisma generates TypeScript types directly from the database schema, which eliminates type mismatches between the database and application code. The query API is intuitive to use, and the migration system handles schema changes cleanly.

### Why JWT Authentication

JWT allows the API to be stateless. The server does not need to store session data, which simplifies deployment and scaling. Tokens are self-contained and can be validated without database lookups.

### File Storage

Files are currently stored on the local filesystem. For production, consider migrating to cloud storage (AWS S3, Cloudinary, etc.). The multer configuration in `src/config/multer.config.ts` can be modified to support different storage backends.

### CORS

Cross-origin requests are configured in `main.ts`. Update the `origin` array when deploying to include your frontend domain.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start the server |
| `npm run start:dev` | Start with auto-reload |
| `npm run start:prod` | Start production build |
| `npm run build` | Compile TypeScript |
| `npm run lint` | Check code style |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run integration tests |

---

## Troubleshooting

**Database connection failed**

Check that PostgreSQL is running and your DATABASE_URL is correct. Test with:
```bash
npx prisma db pull
```

**Port already in use**

Change the PORT in your .env file or stop the process using port 4050.

**Migration errors**

Try resetting the database:
```bash
npx prisma migrate reset
```
Warning: This deletes all data.

**JWT errors**

Make sure JWT_SECRET is set in your .env file and matches between restarts.
