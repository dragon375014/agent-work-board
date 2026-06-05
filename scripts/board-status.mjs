#!/usr/bin/env node
/**
 * board-status.mjs — the "git truth" companion for WORK-BOARD.md
 *
 * Why this exists: the board's "🔵 In progress" notes are hand-written and drift.
 * The truth always lives in git. This script pulls, from git, every feature branch
 * + how long since its last commit + ahead/behind the base branch, and cross-checks
 * whether the board has it claimed. It adds three things:
 *   - git truth: a non-lying branch-status table next to the hand-written progress
 *   - stale detection by *branch last-commit time*, not board edit time (more honest)
 *   - hook reminder: pushing a feature branch the board doesn't list → print a nudge (never blocks)
 *
 * Usage:
 *   node scripts/board-status.mjs            # print the branch-status table (npm run board)
 *   node scripts/board-status.mjs --hook     # for pre-push: only nudge when "unclaimed", always exit 0
 *
 * Config (optional):
 *   BOARD_FILE=path/to/WORK-BOARD.md   # default: WORK-BOARD.md at repo root
 *   BASE_BRANCH=main                   # default: auto-detect (main → master)
 *   STALE_DAYS=7                       # default: 7
 */
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim()
const shSafe = (cmd) => {
  try {
    return sh(cmd)
  } catch {
    return ''
  }
}

const BOARD = join(ROOT, process.env.BOARD_FILE || 'WORK-BOARD.md')
const STALE_DAYS = Number(process.env.STALE_DAYS || 7)
const isHook = process.argv.includes('--hook')

// Auto-detect base branch: env override → origin/HEAD → main → master
function detectBase() {
  if (process.env.BASE_BRANCH) return process.env.BASE_BRANCH
  const head = shSafe('git symbolic-ref --quiet --short refs/remotes/origin/HEAD')
  if (head) return head.replace(/^origin\//, '')
  if (shSafe('git rev-parse --verify --quiet main')) return 'main'
  return 'master'
}
const BASE = detectBase()

function featureBranches() {
  const out = shSafe(`git for-each-ref --format="%(refname:short)" refs/heads/`)
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter((b) => b && b !== BASE)
}

function branchInfo(branch) {
  const lastUnix = Number(shSafe(`git log -1 --format=%ct ${branch}`)) || 0
  const rel = shSafe(`git log -1 --format=%cr ${branch}`)
  let ahead = 0
  let behind = 0
  const counts = shSafe(`git rev-list --left-right --count ${BASE}...${branch}`)
  if (counts) {
    const [b, a] = counts.split(/\s+/).map(Number)
    behind = b || 0
    ahead = a || 0
  }
  const ageDays = lastUnix ? Math.floor((Date.now() / 1000 - lastUnix) / 86400) : 999
  return { branch, rel, ahead, behind, ageDays, stale: ageDays >= STALE_DAYS }
}

function boardText() {
  if (!existsSync(BOARD)) return ''
  return readFileSync(BOARD, 'utf8')
}

function currentBranch() {
  return shSafe('git rev-parse --abbrev-ref HEAD')
}

// ---- hook mode: pushing a feature branch the board doesn't mention → nudge, always exit 0 ----
if (isHook) {
  const cur = currentBranch()
  if (!cur || cur === BASE || cur === 'HEAD') process.exit(0)
  const listed = boardText().includes(cur)
  if (!listed) {
    console.log('')
    console.log(`📋 Board reminder: you're pushing "${cur}", but ${process.env.BOARD_FILE || 'WORK-BOARD.md'} "In progress" doesn't list it.`)
    console.log('   → For cross-file / feature work, add a row to claim it (prevents multi-session collisions). Throwaway branches: ignore.')
    console.log('')
  }
  process.exit(0)
}

// ---- default mode: print the branch-status table ----
const text = boardText()
const branches = featureBranches().map(branchInfo).sort((x, y) => x.ageDays - y.ageDays)

console.log('')
console.log(`🗂️  Branch status (git truth — cross-check vs hand-written board) · base=${BASE}`)
console.log('─'.repeat(78))
if (branches.length === 0) {
  console.log(`(no feature branches — only ${BASE})`)
} else {
  console.log(['branch'.padEnd(34), 'last activity'.padEnd(16), 'ahead/behind'.padEnd(13), 'board'].join(' '))
  console.log('─'.repeat(78))
  for (const b of branches) {
    const listed = text.includes(b.branch)
    const staleMark = b.stale ? ' ⚠stale' : ''
    console.log(
      [
        b.branch.padEnd(34).slice(0, 34),
        (b.rel + staleMark).padEnd(16).slice(0, 16),
        `+${b.ahead}/-${b.behind}`.padEnd(13),
        listed ? '✅ claimed' : '❓ unclaimed',
      ].join(' '),
    )
  }
}
console.log('─'.repeat(78))
console.log(`Rule: ⚠stale = branch last commit ≥ ${STALE_DAYS} days (possibly abandoned).`)
console.log('Before reclaiming a stale row, re-verify on the spot with `git log -1 <branch>` — never trust this snapshot alone.')
console.log('')
