# AGENTS.md

## Project Context

This is the CivicFix application repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

CivicFix is a cloud-based civic issue reporting and resolution platform built using React, Vite, and Supabase.

Start with `README.md` for local setup, environment variables, and project information.

## Key Files

- `src/`: frontend application source.
- `src/lib/supabase.js`: Supabase client configuration.
- `vite.config.js`: Vite configuration.
- `.env.local`: local-only environment values; never commit secrets.
- `package.json`: project dependencies and available npm scripts.

## Backend

Supabase is used for:

- Authentication
- PostgreSQL database
- Row Level Security (RLS)
- Storage for complaint photos
- Complaint status history
- User profiles, workers, departments, and complaints

## Working Notes

- Use `npm run dev` to start the local development server.
- Use `npm run build` to verify that the production build works.
- Reuse the existing Supabase client from `src/lib/supabase.js` instead of creating additional Supabase clients.
- Keep Supabase credentials in environment variables and never hardcode secrets.
- Preserve the existing authentication, role-based access control, database structure, and RLS policies unless the requested change requires modifying them.
- Keep changes focused on the user's request.
- Run the relevant checks from `package.json` before finishing code changes.

## Application Roles

CivicFix currently supports three main roles:

- Citizen
- Worker
- Admin / Authority

Respect the existing role-based route protection and permissions when modifying the application.

## Complaint Workflow

The main complaint workflow is:

1. Pending Review
2. Approved / Rejected
3. Assigned
4. In Progress
5. Proof Submitted
6. Completed / Resolved

Complaint status history should be preserved when making changes to the complaint workflow.

## Security

- Never hardcode passwords, API secrets, service-role keys, or other credentials.
- Use environment variables for sensitive configuration.
- Do not expose private worker or citizen information unnecessarily.
- Preserve Supabase Row Level Security policies.