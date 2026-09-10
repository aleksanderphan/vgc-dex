---
name: commit-and-release
description: Use before every git commit in vgc-dex. Bumps package.json to 0.0.<commit count + 1> so the commit ships with its own version, then commits.
---

# Commit and release

`vgc-dex` versions itself as `<major>.<minor>.<patch>` where **patch = total git
commit count**. The version for the commit you are about to make must be bumped
*before* you commit, so the new commit carries its own version number.

## Steps

1. Make sure the working tree has the changes you intend to ship (`git status`,
   `git diff`).
2. Bump the version:
   ```bash
   npm run version:bump
   ```
   This rewrites `package.json` `version` to `0.0.<commits + 1>`. It is a no-op
   if already bumped.
3. Stage everything including the bumped `package.json`:
   ```bash
   git add -A
   ```
4. Commit with a concise, imperative subject line.
5. Verify the invariant held:
   ```bash
   npm run version:check
   ```
   Expected: `version: ok (0.0.N === commit count N)`.

## Notes

- `major` / `minor` are hand-managed. To roll them, edit `package.json`
  directly; `version:bump` keeps writing `0.0.x` until you do.
- `npm run version:check` is also a good CI / post-commit guard.
- `node scripts/version.mjs --print` prints the current expected version without
  writing anything.
