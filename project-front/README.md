# Dental Jewelry Preview - Frontend

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Features](#features)
- [Architecture](#architecture)
- [Key Components](#key-components)
- [State Management](#state-management)

---

## Overview

This application provides an interactive canvas where users can:

- Capture a photo using their device camera (front-facing by default)
- Upload an existing photo from their gallery
- Browse available jewelry items fetched from the backend API
- Drag jewelry onto the canvas and position them on the photo
- Resize and rotate placed items
- Undo and redo changes
- Save compositions to their profile
- Download the final image

The interface is fully responsive, working on both desktop and mobile devices.

---

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix primitives)
- **Data Fetching**: TanStack Query (React Query) 5
- **Canvas Rendering**: react-konva (Konva.js)
- **Drag and Drop**: dnd-kit
- **Camera**: react-webcam
- **Image Cropping**: react-easy-crop
- **Authentication**: NextAuth.js 5 (Auth.js)
- **State Management**: Zustand (for UI state)
- **Forms**: React Hook Form with Zod validation

---

## Project Structure

```
project-front/
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with header/footer
│   │   ├── providers.tsx      # Client providers (React Query, Auth)
│   │   ├── globals.css        # Global styles and Tailwind config
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── ...
│   │   ├── (home)/            # Landing page
│   │   │   └── page.tsx
│   │   └── canvas/            # Main editor page
│   │       ├── page.tsx       # Canvas editor logic
│   │       └── components/    # Editor-specific components
│   │           ├── camera/    # Camera capture components
│   │           └── canvas/    # Canvas and palette components
│   ├── components/            # Shared components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── auth/              # Auth forms
│   │   ├── home/              # Landing page sections
│   │   └── layouts/           # Header, Footer
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useHistory.ts      # Undo/redo functionality
│   ├── lib/                   # Utilities and API functions
│   │   ├── api.ts             # API client functions
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── utils.ts           # Helper functions
│   │   └── queries/           # TanStack Query hooks
│   ├── schemas/               # Zod validation schemas
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript type definitions
├── components.json            # shadcn/ui configuration
├── next.config.ts             # Next.js configuration
├── postcss.config.mjs         # PostCSS configuration
├── tailwind.config.ts         # Tailwind configuration (if present)
└── tsconfig.json              # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, or pnpm
- The backend API running (see backend README)

### Installation

1. Navigate to the frontend directory:

```bash
cd project-front
```

2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
cp .env.example .env.local
```

4. Configure the environment variables (see next section).

5. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Environment Variables

Create a `.env.local` file with these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL of the backend API | `http://localhost:4050` |
| `AUTH_SECRET` | Secret for NextAuth session encryption | `random-32-character-string` |
| `AUTH_TRUST_HOST` | Trust the host header (needed for some deployments) | `true` |

Example `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4050
AUTH_SECRET=your-auth-secret-change-in-production
AUTH_TRUST_HOST=true
```

---

## Features

### Camera Capture

The camera module uses the front-facing camera by default, which is appropriate for taking smile photos. Users can:

- Switch between front and back cameras on mobile
- See a guide overlay to help position their smile
- Retake photos if not satisfied
- Import existing photos from their device

If camera access is denied, the app shows a friendly message and offers the option to import a photo instead.

### Image Cropping

After capturing or importing a photo, users can crop the image to focus on the area they want to decorate. The cropper maintains a consistent aspect ratio to match the canvas.

### Canvas Editor

The main editing interface uses Konva.js for rendering. Features include:

- Photo displayed as background with cover fit
- Jewelry items rendered as draggable, resizable images
- Multi-select with shift-click or marquee selection
- Transform handles for resize and rotation
- Bounds checking to keep items on canvas
- Touch support for mobile devices

### Jewelry Palette

Items are fetched from the API and displayed in a categorized palette. On desktop, the palette appears as a sidebar. On mobile, it becomes a horizontal scrollable strip at the bottom.

### Undo/Redo

The editor tracks all changes to placed items. Users can undo and redo using:

- Ctrl+Z / Cmd+Z for undo
- Ctrl+Y / Cmd+Y for redo
- Or the toolbar buttons

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C | Copy selected item |
| Ctrl+X | Cut selected item |
| Ctrl+V | Paste |
| Ctrl+A | Select all items |
| Delete/Backspace | Delete selected items |
| Escape | Deselect all |

### Save and Export

Authenticated users can save their compositions to their profile. Anyone can download the final image as a PNG file.

---

## Architecture

### Data Flow

1. User authenticates via NextAuth (credentials provider calling backend)
2. JWT token stored in session
3. TanStack Query fetches items from backend API
4. User interacts with canvas (local state)
5. On save, canvas is rendered to image and uploaded to backend

### Rendering Strategy

- Pages use the App Router with server and client components
- The canvas page is entirely client-side due to Konva requirements
- Data fetching uses TanStack Query for caching and background updates
- Authentication state managed by NextAuth provider

### Styling Approach

The project uses Tailwind CSS 4 with the new CSS-based configuration. Custom colors and design tokens are defined in `globals.css` using CSS variables. The shadcn/ui component library provides accessible, unstyled primitives that are customized with Tailwind classes.

---

## Key Components

### CameraCapture

Orchestrates the camera flow: live view, capture, crop, and error states. Located at `src/app/canvas/components/canvas/CameraCapture.tsx`.

### CameraLiveView

Displays the webcam feed with capture controls. Handles camera permissions and provides fallback for permission errors.

### CanvasStage

The main Konva stage component. Renders the photo background and all placed jewelry items. Handles selection, transformation, and drag operations.

### PlacedJewel

Individual jewelry item on the canvas. Includes the image, transform handles when selected, and drag behavior.

### ItemsPalette

Displays available jewelry items grouped by category. Each item is draggable onto the canvas using dnd-kit.

### useHistory Hook

Generic hook that tracks state changes and provides undo/redo functionality. Used to track placed items array.

### useStageSize Hook

Observes container size changes and provides current dimensions for the Konva stage. Ensures the canvas resizes responsively.

---

## State Management

### Server State (TanStack Query)

Used for data fetched from the API:

- `useItemsQuery` - Fetches jewelry items
- `useSavedImagesQuery` - Fetches user's saved compositions
- `useSaveImageMutation` - Saves new composition
- `useDeleteImageMutation` - Deletes saved composition

### Local State (React useState)

The canvas page manages placed items, selection state, and drag previews with React state. This keeps the state close to where it is used and avoids unnecessary re-renders.

### UI State (Zustand)

Global UI state like modals or toasts can be managed with Zustand stores in `src/stores/`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Troubleshooting

**API connection errors**

Make sure the backend is running and `NEXT_PUBLIC_API_URL` points to it.

**Camera not working**

- Check browser permissions for camera access
- HTTPS may be required on some browsers (localhost is usually exempt)
- Try a different browser if issues persist

**Build errors**

Clear the Next.js cache and rebuild:

```bash
rm -rf .next
npm run build
```

**Authentication issues**

Make sure `AUTH_SECRET` is set and the backend is reachable for credential validation.
