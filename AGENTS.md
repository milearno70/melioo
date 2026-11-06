<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The shared store is a view adapter: books and notes remain local prototypes; tasks, subjects, sessions, settings, rewards and pet state come from authenticated Lovable Cloud commands so device-local data cannot award rewards.
- Pomodoro timer stores an end timestamp and recomputes remaining time — keeps it accurate in inactive tabs.
- Library and Notes have separate TanStack content routes and use the existing mock store actions for every edit, preserving the prototype's API-compatible data boundary.
- Cloud study commands serialize edits under a per-user database row lock; reward totals and timer completion are computed in the database, never accepted from the browser.
- Public study routes render an inline sign-in screen when signed out; private data is fetched only after Cloud authentication and every command revalidates the bearer token.
