# Dev Collaboration Platform

Starter MERN stack project structure for a developer collaboration platform.

## Stack

- React frontend with Vite
- Node.js + Express backend
- MongoDB with Mongoose

## Project Structure

```text
CodeMate/
  client/
  server/
```

## Getting Started

### 1. Install dependencies

```bash
npm install
npm run install:all
```

### 2. Configure environment variables

Copy the example file:

```bash
cp server/.env.example server/.env
```

Update `MONGODB_URI` as needed.

### 3. Run the app

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Available Scripts

- `npm run dev` starts frontend and backend together
- `npm run dev:client` starts the React app
- `npm run dev:server` starts the Express API
- `npm run install:all` installs dependencies in root, client, and server
