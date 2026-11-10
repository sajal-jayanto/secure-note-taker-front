# Secure Notes — Frontend

A React frontend for the Secure Notes API. Users sign in, manage their own notes, browse other users' posts and see who shares their interests. Admins also get an all-notes view and user management.

Built with **React 19**, **TypeScript**, **Vite**, **React Router** and **Zustand**.

## Getting started

**Requirements:** Node.js 20+ and a running Secure Notes backend.

```bash
npm install
cp .env.example .env   # then set the API URL (see below)
npm run dev            # http://localhost:5173
```

### Configuration

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, including `/api` | `http://localhost:3000/api` |

Vite reads `.env` at startup, so restart `npm run dev` after changing it.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with Oxlint |

## Features

| Page | Path | Admin | User | What it does |
|---|---|:-:|:-:|---|
| Login | `/login` | ✅ | ✅ | Email/password sign-in, with one-click demo accounts |
| Notes | `/notes` | ✅ | ✅ | Users: create, edit and delete their notes. Admins: view every user's notes |
| Posts | `/posts` | ✅ | ✅ | Pick a user from a dropdown to see their posts |
| Profile | `/profile` | ✅ | ✅ | Your account details and the people who share your interests |
| Admin Settings | `/admin-settings` | ✅ | — | List, create, edit and delete user accounts |

Lists are paginated (10 per page). Forms open in a modal and show the server's validation messages.

## How it works

### Authentication

- `POST /auth/login` returns a user and a JWT. Both are kept in a Zustand store persisted to **`sessionStorage`**, so a session ends when the tab closes.
- The token's `exp` claim is read on login and on page load; the user is logged out automatically when it expires.
- Every API request sends `Authorization: Bearer <token>`.

### Role-based access

Which role can see which page is defined in one place: [`src/config/nav.ts`](src/config/nav.ts). The sidebar and the route guard (`RequireRole` in [`src/App.tsx`](src/App.tsx)) both read from it, so a user who types an admin URL is redirected to `/notes`.

To add a page: add an entry to `NAV_ITEMS` and a matching `<Route>` in `App.tsx`.

> Hiding pages in the UI is a convenience, not security. The backend must enforce permissions on every endpoint.

### API endpoints used

All calls live in [`src/lib/api.ts`](src/lib/api.ts).

| Method | Endpoint | Used for |
|---|---|---|
| `POST` | `/auth/login` | Sign in |
| `GET` | `/users/me` | Profile |
| `GET` | `/users/interests` | Users who share your interests |
| `GET` | `/users` | User dropdown on Posts |
| `GET` | `/users/:id/posts` | A user's posts (paginated) |
| `GET` | `/notes` | Your notes (paginated) |
| `POST` | `/notes` | Create a note |
| `PATCH` | `/notes/:id` | Edit a note |
| `DELETE` | `/notes/:id` | Delete a note |
| `GET` | `/admin/notes` | All notes — admin (paginated) |
| `GET` | `/admin/users` | All users — admin (paginated) |
| `POST` | `/admin/user` | Create a user — admin |
| `PATCH` | `/admin/user/:id` | Update a user — admin |
| `DELETE` | `/admin/user/:id` | Delete a user — admin |

Paginated endpoints accept `?page=&limit=` (max `limit` is 100) and return a `pagination` object with `page`, `limit`, `total`, `totalPages`, `hasNextPage` and `hasPrevPage`.

## Project structure

```
src/
├── App.tsx               Routes and auth/role guards
├── main.tsx              Entry point
├── index.css             Theme (CSS variables) and all styles
├── config/nav.ts         Pages, sidebar items and which roles can see them
├── lib/api.ts            API client, types and endpoint functions
├── store/
│   ├── authStore.ts      Logged-in user, token, login/logout, auto-expiry
│   └── notesStore.ts     Notes list, pagination, create/edit/delete
├── components/
│   ├── AppLayout.tsx     Top bar + role-based sidebar
│   ├── Modal.tsx         Reusable modal built on <dialog>
│   ├── Pagination.tsx    Prev / page numbers / Next
│   └── icons.tsx         Inline SVG icons
└── pages/
    ├── Login.tsx
    ├── Notes.tsx
    ├── Posts.tsx
    ├── Profile.tsx
    └── AdminSettings.tsx
```

## Theming

The light-cream theme is defined as CSS variables at the top of [`src/index.css`](src/index.css) (`--cream-*`, `--brown-*`, `--text`, `--danger`). Change them there to restyle the whole app.

## Known limitations

These depend on backend support:

- **Admins can't edit or delete other users' notes.** `/notes/:id` only matches the caller's own notes, and `/admin/notes` is read-only.
- **No server-side note search.** The API doesn't accept a search parameter.
- **Profiles are read-only.** There is no `PATCH /users/me`.
- **The admin's own notes aren't listed separately.** Admins only see the combined `/admin/notes` list.

Things to address before production:

- **Remove the demo accounts from the login page.** They're listed in `DEMO_ACCOUNTS` in [`src/pages/Login.tsx`](src/pages/Login.tsx), and anyone who opens the page can see their passwords.
- **Serve the API over HTTPS.** Browsers block calls from an `https://` site to an `http://` API, and plain HTTP sends passwords unencrypted.
- **Consider httpOnly cookies for the token.** The JWT is in `sessionStorage`, so any injected script could read it.
