# CivicFix

CivicFix is a cloud-based civic issue reporting and resolution platform.

It allows citizens to report civic problems, authorities to verify and assign complaints, and field workers to update the progress and submit completion proof.

## Project Context

CivicFix is built using:

- React
- Vite
- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Row Level Security (RLS)

## User Roles

The application supports three main roles:

### Citizen

Citizens can:

- Register and log in
- Report civic issues
- Add issue category and description
- Provide the issue location
- Upload complaint photos
- Track complaint status
- View complaint history

### Worker

Workers can:

- View complaints assigned to them
- Start work on assigned complaints
- Update complaint progress
- Upload completion proof
- Submit the complaint for manager verification

### Admin / Authority

Administrators can:

- View complaints
- Review new complaints
- Approve or reject complaints
- Assign workers
- Manage workers and departments
- Review submitted completion proof
- Approve completed work
- Monitor complaint progress

## Complaint Workflow

The complaint follows this workflow:

1. Pending Review
2. Approved / Rejected
3. Assigned
4. In Progress
5. Proof Submitted
6. Completed / Resolved

A status history is maintained for every important complaint status change.

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- npm installed
- A Supabase project
- Supabase environment variables configured

## Installation

Clone the repository and open the project directory.

Install the required dependencies:

```bash
npm install