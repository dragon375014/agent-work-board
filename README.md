# 🗂️ agent-work-board

**A one-file coordination board so your parallel AI coding sessions don't collide.**

> 一個純文字看板，讓你同時開的多個 AI 對話視窗 / worktree 不會互相打架。

When you code with AI agents, you naturally open **several chat windows at once** — one refactoring checkout, one editing the admin page, one writing docs. Every AI session is *amnesiac*: it has no idea what the other windows are touching. So they collide on the same file, redo each other's work, or break something the other depended on.

`agent-work-board` is a sticky note on the wall: **who is doing what, how far along, and which files they'll touch.** Glance before you start, claim before you act, and you stop crashing into yourself.

It's deliberately tiny: **one Markdown file + one optional script + one line in your agent's rules.** No service, no database, no lock server.

```text
   Window A                WORK-BOARD.md                Window B
  (checkout)            (shared, lives in git)           (admin)
      │                         │                           │
      │ 1. scan ───────────────▶│  CHECKOUT: free           │
      │ 2. add claim row ──────▶│  CHECKOUT → A 🔒          │
      │ 3. push immediately ───▶│  (git = the lock)         │
      │                         │◀─────────────── scan   1. │
      │                         │  ADMIN: free              │
      │                         │  sees A on CHECKOUT ─────▶ │  no clash →
      │                         │                           │  claims ADMIN
      ▼                         ▼                           ▼
  edits useCheckout       one source of truth        edits pages/admin
   + orders table          everyone reads first      (knows to avoid checkout)


   Window C wants checkout too:
      scan ──▶ board shows "CHECKOUT → A 🔒, refactoring"
            └▶ C does NOT barge in. Picks other work / waits / coordinates.
               ✅ collision avoided BEFORE editing — not at merge time.
```

---

## Why not just use the agent's built-in todo list?

Tools like Claude Code's `TodoWrite` track steps **within one session** — in-memory, gone when the session ends, invisible to your other windows. That's a different layer:

| | Built-in todo (e.g. TodoWrite) | agent-work-board |
|---|---|---|
| Scope | **within one session** | **across sessions / windows** |
| Lifetime | gone when the session ends | committed to git, permanent |
| Shared? | only the current window sees it | everyone / every window shares one |
| Answers | "what are my next steps here" | "which area/task is claimed by whom" |

They **stack**: each session uses its todo list internally, while the board coordinates *between* sessions. No conflict — the board fills the gap the harness leaves open.

---

## How this fits with the rest of your harness

The board is **not** another mechanism competing with your agent runtime. It sits *above* all of them. Everything below works **within one orchestrated run**; the board works **across the runs you launched by hand**.

| Tool | Layer | The board's relation |
|---|---|---|
| subagents / Agent tool / Workflows | intra-run (one orchestrator fans out helpers) | orthogonal — the board coordinates the *separate* runs you started, which no single orchestrator sees |
| git worktrees | filesystem isolation | complements — worktrees stop *file* clobber; the board stops *whom-does-what* clobber (two windows both deciding to refactor checkout) |
| native task / agent-team features | intra-run step tracking | same as the built-in todo above: within-session, invisible to your other windows |
| file-lock + handoff tools (e.g. mclaude) | mechanism (atomic locks, handoff notes) | the board is convention-only (git *is* the lock) and adds the two things a lock doesn't: a **territory map** and **footprint awareness** |

**Two genuine differentiators** — neither the native harness nor a lock tool gives you these:

1. **A territory map (WHERE).** The repo is pre-split into 5–8 named areas; a claim reads "I'm in CHECKOUT", not "I locked 12 files". Humans coordinate on areas, not file lists.
2. **Footprint awareness (WHAT KIND).** Before you parallelize, classify the shared state you're about to *write*: a disjoint leaf / a hot shared file / a discrete allocator (e.g. migration numbers) / a singleton mutable service / a function others depend on. Each class has a different safe move — not every same-area overlap is equally dangerous. (See [`docs/methodology.md`](docs/methodology.md).)

Run one window and you need none of this. Run two, and the harness coordinates *inside* each while nothing coordinates *between* them. That gap is the board.

---

## Quick start (5 minutes)

1. **Copy the board file** into your repo at a fixed path on your **main branch**:
   ```bash
   cp WORK-BOARD.template.md WORK-BOARD.md
   ```
2. **Draw your area map** — split the project into 5–8 areas, each with its main files (see the template). This is the one step worth real thought.
3. **Wire it into your agent's opening ritual** so it actually gets read (see `ritual-snippets.md`). Without this, the board is dead — nobody remembers to look.
4. *(optional)* **Add the git-truth script** for branch status + a non-blocking push reminder:
   ```jsonc
   // package.json
   "scripts": { "board": "node scripts/board-status.mjs" }
   ```
   ```bash
   npm run board          # print branch status (last commit, ahead/behind, claimed?)
   ```

That's it. Start small (just the "In progress" table + the ritual); grow the area map and scripts only when collisions actually start happening.

---

## The protocol (the whole thing)

**① Before you start (3 steps)**
1. Check the **area map** + **🔵 In progress** — confirm nobody is in your area.
2. **Add a row** to "In progress": area / task / branch / start date / today / one-line note.
3. **Commit + push that claim immediately** (not when you finish) → then start.

> **Why push the claim right away (the "grab the lock" rule):** between "check nobody's there" and "add a row" there's a gap — two sessions can both read *empty* and claim the same area (a race). Pushing the row instantly uses git as the lock: whoever pushes first wins; the second push fails and is forced to rebase, discovering the collision **at claim time** instead of at merge time.

**② While working**
- On each meaningful step, update **your own row**'s "last updated" + note "where I am / what I'm stuck on".
- ⚠️ **Edit only your own row.** The board is a single file everyone writes to → it's its own merge-conflict hotspot. Touch only your row.

**③ Done**
- Move the row to **✅ Recently done** with a commit SHA / PR link.

**④ Stale-claim recovery**
- A row not updated for **N days** (default 7) = that session probably died.
- Judge staleness by the **branch's last-commit time**, not the board edit time (`npm run board` flags `⚠stale`).
- ⚠️ **Before reclaiming, re-verify on the spot with `git log -1 <branch>`.** Never trust the old snapshot — it may be wrong and you'll delete an active branch.
- Only reclaim if the branch truly has no new commits; note "reclaimed from stale".

**⑤ Auto-nudge (non-blocking)**
- A pre-push hook can run `node scripts/board-status.mjs --hook`: if you push a feature branch not listed on the board, it prints one reminder line. Reminder only — never blocks.

---

## Keep it separate from everything else (the #1 failure mode)

The board holds **one kind of thing: live work state ("who's doing what right now")**. Everything else has its own home — don't merge them, or it rots into an unmaintained dump:

| Doc | Holds | Trait |
|---|---|---|
| **WORK-BOARD** (this) | live work state | changes constantly |
| FEATURE-BACKLOG | future ideas | slow accretion |
| TECH-DEBT | known debt | slow accretion |
| handoff | one-shot "pass to next session" note | use-once |
| agent memory | permanent facts (who you are, design intent) | rarely changes |

**Why progress must NOT go in agent memory:** memory auto-loads every session — putting "task 60% done" there bloats context and goes stale fast. Memory = things that never change; the board = the thing that does.

---

## ⚠️ CI / auto-deploy cost (read this if you use Netlify / Vercel / Cloud Build)

If the board lives on your production branch and your CI builds on **every** push to it, then **every claim = a push = a build** — even though a plain-text board change can't affect build output, it still burns build minutes (e.g. Netlify's free monthly cap).

Two fixes:
- `[skip ci]` in the board commit message (Netlify and most CIs skip the build), or
- a path filter so only real frontend changes trigger a build, e.g. Netlify:
  ```toml
  [build]
    ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."
  ```

Sort this out **before** adopting the board, or you'll mysteriously burn deploy quota.

---

## When you *don't* need this

It has a maintenance cost — not every project should adopt it. Skip it if you only ever run **one** window, work linearly, or it's a tiny solo project you hold in your head. Adopt it when you start running **2+ windows / worktrees on the same repo in parallel**, or have ever hit "we both edited the same file" / "we both did the same thing".

---

## Going further

This is the **entry-level** coordination primitive. If you grow into a larger, more complex governance setup (single-source-of-truth registries, cross-layer trace locks, automated guard rules), this board is the on-ramp to that philosophy — start here, graduate later.

- 📖 Full methodology (with a worked three-window walkthrough): [English](docs/methodology.md) · [繁體中文](docs/methodology.zh-TW.md)
- 🧩 Opening-ritual snippets for CLAUDE.md / .cursorrules / generic agents: [`ritual-snippets.md`](ritual-snippets.md)
- 📋 Copy-paste board: [`WORK-BOARD.template.md`](WORK-BOARD.template.md)

---

## Ecosystem

This board is the **coordination layer** of a five-repo AI-dev toolchain — full map: [ai-dev-toolkit/ECOSYSTEM.md](https://github.com/dragon375014/ai-dev-toolkit/blob/main/ECOSYSTEM.md).

[`spec-sonar`](https://github.com/dragon375014/spec-sonar) (private) turns ideas into specs and goal graphs; [`goal-workflow-designer`](https://github.com/dragon375014/goal-workflow-designer) shapes tasks into precise prompts; [`claude-skills-governance-meta`](https://github.com/dragon375014/claude-skills-governance-meta) governs what each session writes — and this board keeps the sessions running all of the above from colliding. The "larger governance setup" mentioned in *Going further* is that governance repo.

---

## License

MIT — see [`LICENSE`](LICENSE). Use it anywhere, no attribution required.
