---
nav: Threads
order: 3
toc: content
description: OAuth 2.0 and OpenID Connect — how authorization delegation works, key security patterns (PKCE, state, nonce), and two working demos with GitHub and Google.
keywords:
  [
    oauth2,
    openid connect,
    pkce,
    state,
    nonce,
    github,
    google,
    authentication,
    authorization,
    jwt,
    jwks,
  ]
---

# OAuth 2.0 & OpenID Connect

In practice, most developers reach for OAuth 2.0 for one reason: **"Login with GitHub / Google / Facebook"**. Instead of building your own auth system — storing passwords, handling resets, worrying about breaches — you delegate identity verification to a provider the user already trusts. Your app gets a verified identity back and stays out of the credential business entirely.

OAuth 2.0 was originally designed as an **authorization** protocol (granting a third-party app limited access to act on a user's behalf). But its most common real-world use is authentication — just signing users in. The distinction matters: OAuth 2.0 alone only tells you that a user authorized your app; it doesn't formally tell you _who_ that user is. **OpenID Connect (OIDC)** fills that gap — it's a thin identity layer on top of OAuth 2.0 that adds a signed JWT (`id_token`) containing verified claims about the user's identity.

:::info{title="Further reading"}

[oauth.com](https://www.oauth.com/) is the most practical and comprehensive guide to everything OAuth 2.0. It covers every grant type, security consideration, and real-world implementation pattern with concrete examples. If you want to go deeper on any topic in this thread, that's the place to start.

:::

## OAuth 2.0 vs OpenID Connect

|                       | OAuth 2.0                           | OpenID Connect                    |
| --------------------- | ----------------------------------- | --------------------------------- |
| **Purpose**           | Authorization (access delegation)   | Authentication (identity)         |
| **What you get**      | `access_token`                      | `access_token` + `id_token` (JWT) |
| **Who are you?**      | Unknown — must call `/userinfo` API | Known — read JWT claims directly  |
| **Spec**              | RFC 6749                            | Built on top of OAuth 2.0         |
| **Example providers** | GitHub OAuth App                    | Google, Microsoft, Auth0          |

## Demo 1 — GitHub OAuth 2.0

GitHub's OAuth App follows the Authorization Code + PKCE flow. It does **not** implement OpenID Connect — identity is obtained by calling `GET /user` with the `access_token` after login.

**[github.com/thinh-kieu/learn-oauth-2](https://github.com/thinh-kieu/learn-oauth-2)**

---

## Demo 2 — Google OpenID Connect

Google implements the full OIDC spec. After the code exchange, Google returns an `id_token` — a signed JWT whose claims contain the user's identity. No extra API call needed; signature is verified against Google's public JWKS.

**[github.com/thinh-kieu/learn-oauth-2](https://github.com/thinh-kieu/learn-oauth-2)**

---

## GitHub vs Google — Side by Side

|                                | GitHub OAuth 2.0          | Google OpenID Connect               |
| ------------------------------ | ------------------------- | ----------------------------------- |
| **Protocol**                   | OAuth 2.0                 | OAuth 2.0 + OIDC                    |
| **Identity source**            | `GET /user` API call      | `id_token` JWT claims               |
| **PKCE**                       | Yes                       | Yes                                 |
| **Nonce**                      | No                        | Yes                                 |
| **Access token expiry**        | Never (server-side)       | ~1 hour                             |
| **Refresh token**              | Not used                  | Yes (30-day cookie)                 |
| **Session keepalive**          | Cookie TTL reset on timer | Silent token exchange before expiry |
| **Cryptographic verification** | No                        | Yes (JWKS signature check)          |
