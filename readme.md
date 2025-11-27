# Dental Jewelry Preview

## Project Overview

The application consists of two parts:

- **Frontend**: A Next.js web application with an interactive canvas editor
- **Backend**: A NestJS REST API that handles authentication, item management, and image storage

---

## Features

**Photo Capture**
- Use your device camera (front-facing by default for selfies)
- Import existing photos from your gallery
- Crop and adjust the image before editing

**Interactive Canvas**
- Drag jewelry items from the palette onto your photo
- Resize items by dragging corner handles
- Rotate items to match your tooth angle
- Move items around to find the perfect position
- Select multiple items for group operations

**User Accounts**
- Register and log in to save your work
- View your previously saved designs
- Load saved designs to continue editing

**Export Options**
- Download the final composition as a PNG image
- Save to your profile for later access

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| TanStack Query | Server state management |
| react-konva | Canvas rendering |
| dnd-kit | Drag and drop |
| NextAuth.js | Authentication |

### Backend

| Technology | Purpose |
|------------|---------|
| NestJS 11 | Node.js framework |
| TypeScript | Type safety |
| Prisma | Database ORM |
| PostgreSQL | Database |
| JWT | Authentication tokens |
| Multer | File uploads |

---

## Project Structure

```
tech_assessment/
├── project-front/          # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Pages and routes
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API client
│   │   └── types/          # TypeScript definitions
│   └── ...
│
├── project-back/           # NestJS backend API
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── items/          # Jewelry items module
│   │   ├── saved-images/   # User saved canvases
│   │   └── prisma/         # Database service
│   ├── prisma/             # Database schema and migrations
│   └── uploads/            # Stored images
│
└── readme.md               # This file
```

Each project has its own detailed README with specific documentation:

- [Frontend Documentation](./project-front/README.md)
- [Backend Documentation](./project-back/README.md)

---

## Getting Started

### Prerequisites

Before you begin, make sure you have installed:

- Node.js 20 or higher
- PostgreSQL database
- npm or yarn

### Quick Start

Follow these steps to get the application running locally.

**1. Clone the repository**

```bash
git clone https://github.com/Fares-Frini/tech_assessment.git
cd tech_assessment
```

**2. Set up the backend**

```bash
cd project-back
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your database connection:

```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/dental_jewelry"
JWT_SECRET="a-long-random-secret-string"
PORT=4050
```

Run database migrations and seed data:

```bash
npx prisma migrate dev
npx prisma db seed
```

Start the backend server:

```bash
npm run start:dev
```

The API will be running at `http://localhost:4050`.

**3. Set up the frontend**

Open a new terminal:

```bash
cd project-front
npm install
```

Create the environment file:

```bash
cp .env.example .env.local
```

The default settings should work for local development:

```
NEXT_PUBLIC_API_URL=http://localhost:4050
AUTH_SECRET=your-auth-secret
AUTH_TRUST_HOST=true
```

Start the frontend server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

**4. Test the application**

Open your browser to `http://localhost:3000`. You can log in with the seeded test account:

- Email: `test@test.com`
- Password: `Test123!`

---

## Architecture Overview

### How It Works

1. **User visits the application** and is presented with the landing page
2. **User logs in or registers** to access the canvas editor
3. **User captures a photo** using their camera or uploads an existing image
4. **Frontend fetches jewelry items** from the backend API using TanStack Query
5. **User drags items onto the canvas** where they are rendered with Konva.js
6. **User adjusts item positions** using the transform handles
7. **User saves or downloads** the final composition

### Data Flow

```
┌─────────────┐     HTTP/REST      ┌─────────────┐     Prisma     ┌────────────┐
│   Browser   │ ←───────────────→  │   NestJS    │ ←───────────→  │ PostgreSQL │
│  (Next.js)  │                    │    API      │                │            │
└─────────────┘                    └─────────────┘                └────────────┘
      │                                   │
      │ TanStack Query                    │ Multer
      │ for caching                       │ for file uploads
      ↓                                   ↓
┌─────────────┐                    ┌─────────────┐
│ Local State │                    │  File       │
│ (Canvas)    │                    │  Storage    │
└─────────────┘                    └─────────────┘
```

### Authentication Flow

1. User submits credentials to `/auth/login`
2. Backend validates credentials against the database
3. Backend returns a JWT token
4. Frontend stores the token via NextAuth.js session
5. Subsequent requests include the token in the Authorization header
6. Protected routes validate the token before processing

### Canvas Rendering

The canvas uses a layered approach:

- **Layer 1**: Background photo (scaled to cover the canvas)
- **Layer 2**: Placed jewelry items (each with individual transform controls)

Konva.js handles the rendering and provides built-in support for transformations like scaling and rotation. The dnd-kit library manages the drag-and-drop from the palette to the canvas.

---

## Development

### Running Both Services

For development, you need both the frontend and backend running simultaneously. Use two terminal windows:

Terminal 1 (Backend):
```bash
cd project-back
npm run start:dev
```

Terminal 2 (Frontend):
```bash
cd project-front
npm run dev
```

### Database Management

View your data with Prisma Studio:

```bash
cd project-back
npx prisma studio
```

Reset the database if needed:

```bash
npx prisma migrate reset
```

### Adding New Jewelry Items

Items are stored in the database. You can add them through:

1. Prisma Studio (manual entry)
2. API endpoint `POST /items` with an image file
3. Modifying the seed script and re-running it

---

## Deployment

### Frontend (Vercel)

The frontend can be deployed to Vercel:

1. Push your code to GitHub
2. Connect the repository to Vercel
3. Set the root directory to `project-front`
4. Add environment variables in Vercel dashboard
5. Deploy

### Backend (Railway, Render, or VPS)

The backend needs a Node.js runtime and PostgreSQL:

1. Set up a PostgreSQL database (Railway, Supabase, or self-hosted)
2. Deploy the NestJS application
3. Set environment variables
4. Run migrations: `npx prisma migrate deploy`

Make sure to update CORS settings in `main.ts` to allow your frontend domain.

---

## License

This project was created as a technical assessment.
