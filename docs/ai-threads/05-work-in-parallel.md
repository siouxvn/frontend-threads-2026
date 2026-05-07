---
nav:
  title: AI
  order: 2
group:
  title: Work in parallel with AI
  order: 5
title: Introduction
order: 1
toc: content
description: Why running multiple AI coding agents across multiple repos surfaces unique failure modes — and what this series covers.
keywords: [ai, parallel, workflow, claude code, multi-repo]
---

# Work in parallel with AI

Running one agent on one repo is easy. Running several agents across several repos at once — your day job, your side project, an experimental fork, a colleague's checkout — is where the cheap mistakes start hiding.

Each agent works correctly _in isolation_. The damage is in the seams between them: state they share without realizing, defaults they fall back to without asking, decisions they make on your behalf because no one is watching.

These pages are a running list of tips, in the order I hit them.
