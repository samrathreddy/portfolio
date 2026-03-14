# Samrath Portfolio

A modern, responsive portfolio website built with **Next.js**, **React**, and **TailwindCSS** — featuring meeting scheduling with Google Calendar, session recording, analytics dashboards, and a clean UI.

[![Live Demo](https://img.shields.io/badge/Live-samrath.bio-blue?style=for-the-badge)](https://samrath.bio/)

---

## Table of Contents

- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/samrathreddy/portfolio
cd portfolio

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in the values (see below)

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

---

## Environment Variables

Rename `.env.example` to `.env` and configure:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_DISCORD_WEBHOOK_URL` | Discord webhook for notifications |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL (`http://localhost:3000/api/auth/google/callback`) |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth refresh token (generate via `/admin/google-auth`) |
| `MONGODB_URI` | MongoDB connection string |
| `ADMIN_TIMEZONE` | Admin timezone (e.g., `Asia/Kolkata`) |
| `EMAIL_ADDRESS` | Admin email address |
| `ADMIN_ALLOWED_IPS` | Comma-separated IPs for admin access |
| `NEXT_PUBLIC_RESUME_EMBED_URL` | Google Drive resume embed URL |
| `NEXT_PUBLIC_RESUME_DOWNLOAD_URL` | Google Drive resume download URL |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) |
| `NEXT_PUBLIC_APP_URL` | Application base URL |

> Generate Google OAuth tokens by visiting `/admin/google-auth` after setting up client credentials.

---

## Features

- **Responsive Design** — Looks great on desktop, tablet, and mobile
- **Meeting Scheduling** — Book, reschedule, and cancel meetings with Google Calendar + Meet integration
- **Session Recording** — PostHog-powered session replays and event tracking
- **Admin Dashboard** — Analytics for meetings, resume views, and downloads (IP-restricted)
- **Video Project Previews** — Lazy-loaded videos with IntersectionObserver for smooth playback
- **Animations** — Smooth transitions with Framer Motion
- **SSR & SEO** — Server-side rendering with optimized meta tags and Open Graph
- **Analytics** — Vercel Analytics + PostHog + Google Analytics

---

## Tech Stack

| Category | Technologies |
|---|---|
| **Framework** | Next.js 14 |
| **UI** | React 18, TailwindCSS, Framer Motion |
| **Language** | TypeScript |
| **Database** | MongoDB (Mongoose) |
| **Auth** | Google OAuth 2.0 |
| **APIs** | Google Calendar API, Google Meet |
| **Analytics** | PostHog, Vercel Analytics, Google Analytics |
| **Email** | Nodemailer |
| **Components** | Radix UI, Lucide React |
| **State** | TanStack Query |

---

## Project Structure

```
portfolio/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Google OAuth flow
│   │   ├── admin/        # Admin endpoints
│   │   ├── meetings/     # Meeting CRUD
│   │   └── ...           # Slots, tracking, resume
│   ├── admin/            # Admin dashboard pages
│   ├── meet/             # Meeting scheduling page
│   ├── resume/           # Resume page
│   ├── providers.tsx     # PostHog provider
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
├── config/               # Project & site configuration
├── lib/                  # Utilities (DB, Google, CORS)
├── public/               # Static assets & tech logos
└── middleware.ts         # CORS middleware
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, projects, tech stack, about |
| `/resume` | Resume viewer with download tracking |
| `/meet` | Meeting scheduler with available time slots |
| `/admin` | Dashboard with analytics overview |
| `/admin/meet-analytics` | Meeting scheduling analytics |
| `/admin/resume-analytics` | Resume view & download analytics |
| `/admin/meetings` | All scheduled meetings |
| `/admin/meetings/[id]` | Individual meeting details |
| `/admin/google-auth` | Google OAuth setup & token generation |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/google` | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | OAuth callback handler |

### Meetings
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/meetings` | List all meetings |
| `GET` | `/api/meetings/[id]` | Get meeting by ID |
| `POST` | `/api/book-meeting` | Book a new meeting |
| `POST` | `/api/reschedule-meeting` | Reschedule a meeting |
| `POST` | `/api/cancel-meeting` | Cancel a meeting |
| `POST` | `/api/available-slots` | Get available time slots |

### Analytics (Admin — IP restricted)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/meet-tracking` | Track meeting page events |
| `POST` | `/api/resume-click` | Track resume button clicks |
| `POST` | `/api/resume-download` | Track resume downloads |

---

## Contributing

Contributions are welcome! If you have a suggestion, fork the repo and create a pull request, or open an issue tagged `enhancement`.

1. Fork the project
2. Create your branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
