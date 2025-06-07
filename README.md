# Samrath Portfolio

A modern, responsive portfolio website built with Next.js, React, and TailwindCSS, featuring a robust meeting scheduling system, detailed analytics, and a clean, user-friendly interface.

## Table of Contents

- [Live Demo](#live-demo)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

## Live Demo

Visit my [portfolio](https://samrath.bio/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/samrathreddy/portfolio
    cd portfolio
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    Rename `.env.example` file in the root of project to `.env` and add the necessary environment variables.
4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

You will need to rename `.env.example` file in the root of the project to `.env` and add the following environment variables:

```
# App
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

GOOGLE_CLIENT_ID = xxxxxxxx-xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = xxxxxxxx-jQjxxxxxxxxxxxxxx0Nh7AW
GOOGLE_REDIRECT_URI = http://localhost:3000/api/auth/google/callback
# Google Calendar API settings



#Create Oauth client and access the page to generate the Google tokens -  /admin/google-auth
GOOGLE_ACCESS_TOKEN =
GOOGLE_REFRESH_TOKEN =
GOOGLE_TOKEN_EXPIRY =

# MongoDB connection
MONGODB_URI=mongodb+srv://xxxxxxxxx/meeting

ADMIN_TIMEZONE = Asia/Kolkata
EMAIL_ADDRESS = xxxxxxxx@gmail.com


# Make sure to remove localhost in prod environment - It might be a security vulnerable
ADMIN_ALLOWED_IPS=Your_PUBLIC_IP,localhost

#Resume
NEXT_PUBLIC_RESUME_EMBED_URL = https://drive.google.com/file/d/{id}/preview
NEXT_PUBLIC_RESUME_DOWNLOAD_URL = https://drive.google.com/uc?export=download&id={id}


# Frontend/CORS Configuration
# Allowed origins for CORS (comma-separated list)
# Example: https://your-domain.com,https://www.your-domain.com,http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# Primary frontend URL
# Example: https://your-domain.com
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Application base URL (for links in emails, etc.)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Features

- **Modern & Responsive Design**: Fully responsive layout that looks great on all devices.
- **Meeting Scheduling**: Integrated meeting booking system with Google Calendar.
- **Admin Dashboard**: A comprehensive admin panel to view analytics and manage meetings.
- **Analytics**: Tracking for page views, resume downloads, and meeting clicks.
- **Server-Side Rendering (SSR)**: Fast initial page loads with Next.js.
- **Animations**: Smooth and subtle animations using Framer Motion.
- **Customizable**: Easily customizable with TailwindCSS.
- **TypeScript Support**: Strongly typed codebase for better developer experience.
- **SEO Optimized**: Built with SEO best practices in mind.
- **Google Analytics**: Integrated with Vercel Analytics.

## Technologies Used

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **UI Components**: Radix UI, Hero Icons, Lucide React
- **State Management**: TanStack Query
- **Database**: MongoDB with Mongoose
- **API**: Next.js API Routes
- **Authentication**: Google OAuth
- **Email**: Nodemailer
- **Date & Time**: date-fns, date-fns-tz
- **Analytics**: Vercel Analytics

## Project Structure

```
portfolio/
├── app/                  # App router pages and layouts
│   ├── api/              # API routes
│   ├── admin/            # Admin dashboard pages
│   ├── meet/             # Meeting scheduling page
│   ├── resume/           # Resume page
│   ├── page.tsx          # Home page
│   └── layout.tsx        # Root layout
├── components/           # Reusable React components
├── config/               # Configuration files
├── lib/                  # Library functions (e.g., database connection)
├── public/               # Static assets
├── styles/               # Global styles and Tailwind config
├── .env.local.example    # Example environment variables
└── next.config.js        # Next.js configuration
```

## Pages

- **Home (`/`)**: The main landing page of the portfolio.
- **Resume (`/resume`)**: A dedicated page to display the resume.
- **Meet (`/meet`)**: A page for visitors to schedule a meeting.
- **Admin (`/admin`)**: The admin dashboard with analytics and meeting management.
  - **Meet Analytics (`/admin/meet-analytics`)**: Analytics for meeting scheduling.
  - **UTM Analytics (`/admin/utm-analytics`)**: Analytics for UTM campaigns. (Pending)
  - **Resume Analytics (`/admin/resume-analytics`)**: Analytics for resume views and downloads.
  - **Meetings (`/admin/meetings`)**: A list of all scheduled meetings.
  - **Meeting Details (`/admin/meetings/[id]`)**: Details of a specific meeting.

## API Endpoints

- **Authentication**
  - `GET /api/auth/google`: Initiates Google OAuth login.
  - `GET /api/auth/google/callback`: Handles the callback from Google after authentication.
- **Meetings**
  - `GET /api/meetings`: Fetches all meetings.
  - `GET /api/meetings/[id]`: Fetches a specific meeting by ID.
  - `POST /api/book-meeting`: Creates a new meeting.
  - `POST /api/reschedule-meeting`: Reschedules an existing meeting.
  - `POST /api/cancel-meeting`: Cancels an existing meeting.
- **Availability**
  - `POST /api/available-slots`: Fetches available time slots for meetings.
- **Analytics** (Admin : Private (IP based access))
  - `POST /api/meet-tracking`: Tracks events related to meeting scheduling.
  - `POST /api/resume-click`: Tracks clicks on the resume button.
  - `POST /api/resume-download`: Tracks resume downloads.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
