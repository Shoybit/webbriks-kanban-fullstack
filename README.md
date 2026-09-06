# Web Briks Mini Kanban Board

A full-stack Mini Kanban Board application built as a technical assessment.

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- dnd-kit

### Backend
- Node.js
- Express.js
- TypeScript
- JWT Authentication
- bcrypt

### Database
- PostgreSQL
- Prisma ORM

### DevOps
- Docker
- Docker Compose

## Features

- User registration and login
- JWT-based authentication
- Create, view, update and delete boards
- Share boards with registered users
- Board access control
- Create, view, update and delete columns
- Create, view, update and delete tasks
- Drag and drop tasks between columns
- Reorder tasks within a column
- Persistent task ordering
- Protected board, column and task operations
- Success and error feedback

## Project Structure

```text
webbriks-kanban/
├── frontend/
├── backend/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Requirements

- Node.js 20+
- PostgreSQL
- npm

Docker is also supported through Docker Compose.

## Environment Variables

### Backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kanban_db
JWT_SECRET=your-secret-key
```

A sample environment file is available at:

```text
backend/.env.example
```

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Run Locally

### 1. Start the Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Backend runs on:

```text
http://localhost:5000
```

### 2. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## Database

Make sure PostgreSQL is running and the `DATABASE_URL` in `backend/.env` points to the correct database.

Prisma migrations are included in:

```text
backend/prisma/migrations/
```

To apply pending migrations:

```bash
npx prisma migrate deploy
```

## Docker Compose

The project includes a `docker-compose.yml` for running the PostgreSQL database, backend, and frontend together.

```bash
docker compose up --build
```

## Production Build

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
npm run build
```

## Authentication

Users register with a name, email and password. Passwords are securely hashed using bcrypt.

After login, the backend returns a JWT token which is used to authorize protected API requests.

## Access Control

Boards can be accessed by their owner and explicitly shared registered users.

Protected APIs validate the authenticated user before allowing board, column or task operations.

Users cannot access or modify boards, columns, or tasks that they do not have permission to access.

## Task Ordering

Tasks maintain a numeric position within their column.

The task movement API supports:

- Reordering within the same column
- Moving tasks between columns
- Moving a task to a specific position

The backend reindexes affected tasks inside a database transaction to keep ordering consistent.

## Original Repository Links

The final submission is a combined full-stack repository containing both frontend and backend.

Add the original repositories used during development below:

- Frontend: [Add original frontend repository link]
- Backend: [Add original backend repository link]

## Submission Repository

The final repository contains:

```text
webbriks-kanban-fullstack/
├── frontend/
├── backend/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Notes

This project was developed as a full-stack technical assessment focusing on functionality, authorization, task movement, data persistence, and clean project structure.
