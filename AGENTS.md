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

- MELIO is a React design prototype; all data goes through src/lib/mock/store.ts (localStorage) whose shapes mirror the planned ASP.NET Core REST API in src/lib/mock/api-contract.ts — so the team can swap in real endpoints later.
- Pomodoro timer stores an end timestamp and recomputes remaining time — keeps it accurate in inactive tabs.
- Library and Notes have separate TanStack content routes and use the existing mock store actions for every edit, preserving the prototype's API-compatible data boundary.
