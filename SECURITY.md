# Security Policy

## Supported Versions

We currently support the latest major version of Insight Loop. Older versions may not receive security updates unless explicitly stated.

| Version         | Supported |
| --------------- | --------- |
| Latest (main)   | ✅        |
| Previous (<1.x) | ❌        |

---

## Reporting a Vulnerability

If you discover a security vulnerability within Insight Loop, **please do not open a public issue**.  
Instead, report it directly to the core team so we can investigate and patch it responsibly.

### 📫 Contact:

- Email: **security@insightloop.ai**
- PGP: [coming soon]

We aim to respond within **48 hours**, and resolve validated vulnerabilities within **7 business days**.

---

## Scope of Concern

Due to the nature of dynamic agent orchestration, we consider the following areas high-risk and high-priority for responsible disclosure:

- **Tool execution**: misuse or privilege escalation
- **Prompt injection attacks**
- **LLM misalignment or output manipulation**
- **CLI code injection or unsafe shell commands**
- **Resource indexing vulnerabilities**
- **Unauthorized agent access to sensitive context**

---

## Third-party Tools and Extensions

If your vulnerability report involves third-party packages or tools plugged into Insight Loop (via CLI, tools, or prompt systems), we will collaborate with those maintainers where possible, but cannot always guarantee a patch ourselves.

---

## Responsible Disclosure Philosophy

We follow [Coordinated Vulnerability Disclosure (CVD)](https://www.cisa.gov/coordinated-vulnerability-disclosure-process).  
We value the security researcher community and publicly credit all validated, responsibly reported issues unless anonymity is requested.

---

## Rewards / Bug Bounties

We currently do **not offer financial bounties**, but exceptional contributors may receive:

- Public credit in security changelogs
- Early access to new features
- Priority consideration for partnerships or collaborations

---

Thank you for helping make Insight Loop safer for everyone.
