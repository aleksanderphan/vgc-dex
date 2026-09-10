# Project skills

Claude Code automatically discovers skills in this directory. Each skill is a
folder containing a `SKILL.md` file:

```
.claude/skills/
  <skill-name>/
    SKILL.md          # required — frontmatter + instructions
    <anything else>   # optional supporting files the skill can reference
```

`SKILL.md` frontmatter:

```markdown
---
name: <kebab-case, matches the folder name>
description: <one line — when Claude should reach for this skill and what it does>
---

# Human-readable title

Step-by-step instructions Claude follows when the skill is invoked.
```

- These skills are committed to the repo, so anyone who clones `vgc-dex` and
  runs Claude Code gets them.
- Invoke one explicitly with `/<skill-name>`, or let Claude pick it up from the
  `description` when a matching task comes up.
- Personal (non-shared) skills live in `~/.claude/skills/` instead. Scaffold one
  with `claude plugin new <name>`.
- Validate a skill folder with `claude plugin validate .claude/skills/<name>`.

`commit-and-release/` is a working example.
