/**
 * Planned REST contract for the ASP.NET Core Web API (not implemented here).
 * The prototype uses ./store.ts instead. When the backend exists, replace store
 * actions with fetch calls to these endpoints; the server validates and awards points/XP.
 */
export const API = {
  auth: { register: "POST /api/auth/register", login: "POST /api/auth/login", me: "GET /api/auth/me" },
  pet: { get: "GET /api/pet", rename: "PUT /api/pet/name", feed: "POST /api/pet/feed", play: "POST /api/pet/play" },
  subjects: "GET|POST|PUT|DELETE /api/subjects",
  tasks: "GET|POST|PUT|DELETE /api/tasks",
  sessions: { complete: "POST /api/study-sessions/complete  (server computes duration, points, XP)", list: "GET /api/study-sessions" },
  progress: "GET /api/progress/summary",
  rewards: "GET /api/rewards  |  POST /api/rewards/{id}/purchase",
} as const;
