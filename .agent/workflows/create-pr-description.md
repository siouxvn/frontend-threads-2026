---
agent: agent
description: Create PR description
---

Example reference: `./examples/create-pr-description.md`

The user input will be provided in the following format: `<latest commit from base branch>...<latest commit from current branch>`

Use `git diff` to review all changes introduced by the current branch compared to the base branch commit. Based on these differences, generate a Pull Request description following the format defined in the example above.

Export the result as a Markdown file at the following location: `specs/<current-branch-name>/pr-description.md`
