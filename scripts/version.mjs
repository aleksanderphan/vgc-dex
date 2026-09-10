#!/usr/bin/env node
// Version tracking: <Major>.<Minor>.<Patch> where Patch = total git commit count.
//
//   node scripts/version.mjs           bump package.json to 0.0.<commits + 1>
//                                      (run right before `git commit` so the new
//                                       commit ships with its own version)
//   node scripts/version.mjs --check   assert package.json === 0.0.<commits>
//                                      (post-commit / CI guard)
//   node scripts/version.mjs --print   print 0.0.<commits> and exit
//
// Major/Minor stay hand-managed — edit package.json directly to roll them, and
// this script keeps writing 0.0.x until you do.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const PKG_URL = new URL('../package.json', import.meta.url)
const MODE = process.argv[2] ?? '--bump'

function commitCount() {
  try {
    return Number(
      execFileSync('git', ['rev-list', '--count', 'HEAD'], {
        encoding: 'utf8',
      }).trim(),
    )
  } catch {
    return null
  }
}

function readPkg() {
  return JSON.parse(readFileSync(PKG_URL, 'utf8'))
}

const count = commitCount()
if (count == null || Number.isNaN(count)) {
  console.error('version: could not read git history (not a repo / no commits)')
  process.exit(MODE === '--check' ? 0 : 1)
}

const pkg = readPkg()
const [major = '0', minor = '0'] = String(pkg.version ?? '0.0.0').split('.')

if (MODE === '--print') {
  console.log(`${major}.${minor}.${count}`)
  process.exit(0)
}

if (MODE === '--check') {
  const want = `${major}.${minor}.${count}`
  if (pkg.version === want) {
    console.log(`version: ok (${pkg.version} === commit count ${count})`)
    process.exit(0)
  }
  console.error(
    `version: package.json is ${pkg.version}, expected ${want} ` +
      `(commit count ${count}). Run \`npm run version:bump\` and commit.`,
  )
  process.exit(1)
}

// --bump (default): the commit you are about to make is #(count + 1).
const next = `${major}.${minor}.${count + 1}`
if (pkg.version === next) {
  console.log(`version: already ${next}`)
  process.exit(0)
}
const prev = pkg.version
pkg.version = next
writeFileSync(PKG_URL, JSON.stringify(pkg, null, 2) + '\n')
console.log(`version: ${prev} -> ${next}`)
