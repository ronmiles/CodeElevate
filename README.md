# CodeElevate

CodeElevate is an AI-powered learning platform that helps developers master programming concepts through personalized learning paths and interactive exercises.

## Features

- 🎯 Personalized Learning Goals
- 🗺️ AI-Generated Learning Roadmaps
- 💻 Interactive Coding Exercises
- 🤖 AI-Powered Exercise Generation
- 📊 Progress Tracking
- 🎨 Modern, Responsive UI

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Material-UI
  - TanStack Query (React Query)
  - Tailwind CSS
  - Vite

- **Backend**:
  - NestJS
  - Prisma ORM
  - PostgreSQL
  - Groq AI
  - JWT Authentication

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- pnpm (v8 or higher)
- PostgreSQL (v14 or higher)
- Git

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CodeElevate.git
cd CodeElevate
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment files:

Create `server/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/codeelevate"

# JWT
JWT_SECRET="your-jwt-secret"

# AI Providers
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="mixtral-8x7b-32768"
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=2000

# Optional Fallback
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-3.5-turbo"
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000
```

Create `apps/CodeElevate/.env`:
```env
VITE_API_URL="http://localhost:3333/api"
```

4. Set up the database:
```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database (if available)
npx prisma db seed
```

## Development

1. Start the development servers:

```bash
# Start the backend server
npx nx serve server

# Start the frontend application (in a new terminal)
npx nx serve CodeElevate

# Or use the Nx Console extension in VS Code to run the tasks
```

2. Access the application:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3333/api

## Project Structure

```
CodeElevate/
├── apps/
│   └── CodeElevate/        # Frontend React application
│       ├── src/
│       ├── public/
│       └── index.html
├── server/                 # Backend NestJS application
│   ├── src/
│   ├── prisma/
│   └── test/
├── package.json
└── nx.json                 # Nx workspace configuration
```

## Available Scripts

- `npx nx serve server` - Start the backend development server
- `npx nx serve CodeElevate` - Start the frontend development server
- `npx nx build server` - Build the backend
- `npx nx build CodeElevate` - Build the frontend
- `npx nx test server` - Run backend tests
- `npx nx test CodeElevate` - Run frontend tests
- `npx nx lint server` - Lint backend code
- `npx nx lint CodeElevate` - Lint frontend code
- `npx nx format:write` - Format code with Prettier

## Database Management

- Generate Prisma client: `npx prisma generate`
- Create a migration: `npx prisma migrate dev --name migration_name`
- Reset database: `npx prisma migrate reset`
- View database: `npx prisma studio`

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in `server/.env`
   - Ensure database exists

2. **Prisma Issues**
   - Run `npx prisma generate` after schema changes
   - Run `npx prisma migrate reset` to reset database
   - Check migration history with `npx prisma migrate status`

3. **API Connection Issues**
   - Verify API URL in `apps/CodeElevate/.env`
   - Check if backend server is running
   - Look for CORS issues in browser console

### Getting Help

If you encounter any issues:
1. Check the [Issues](https://github.com/yourusername/CodeElevate/issues) page
2. Search for similar problems in closed issues
3. Create a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Error messages
   - Environment details

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
