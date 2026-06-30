# MSU Practice Tables

Desktop application for managing university tables in MS SQL Server.

## Features

- Creates the `MSUPractice` database if it does not exist.
- Creates the schema and the control-hours view.
- Seeds the database with starter reference data.
- Runs as a desktop app through Electron.
- Lets you search, add, edit, and delete records from a single interface.

## Requirements

- Node.js 18+
- SQL Server
- Windows PowerShell 5.1+ for the database bootstrap scripts

## Quick Start

1. Make sure SQL Server is running.
2. Copy `.env.example` to `.env` if you need to change connection settings.
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm start
```

You can also launch `start_app.bat`.

## Environment Variables

```text
PORT=3001
SQL_SERVER=localhost\SQLEXPRESS
SQL_DATABASE=MSUPractice
POWERSHELL_PATH=powershell.exe
```

If `SQL_SERVER` is not set, the app will try common options: `localhost\SQLEXPRESS`, `localhost`, `.\SQLEXPRESS`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Vite + Electron |
| `npm run electron` | Alias for `npm start` |
| `npm run server` | Express API only |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview the production build |
| `npm run electron:prod` | Build frontend and launch Electron |

## Stack

- React 19 + Vite
- Express
- Electron
- MS SQL Server
- Windows PowerShell for database setup
