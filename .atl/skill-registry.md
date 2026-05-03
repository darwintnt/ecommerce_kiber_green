# Skill Registry - laboratory-microservices

**Generated**: 2026-04-24
**Source**: Auto-scanned from skill directories

---

## SDD Skills (System)

These are loaded automatically by the SDD orchestrator for SDD phases. Do NOT load manually.

| Skill | Trigger | Location |
|-------|---------|----------|
| sdd-init | `sdd-init`, "iniciar sdd" | `~/.config/opencode/skills/sdd-init/SKILL.md` |
| sdd-explore | `/sdd-explore <topic>` | `~/.config/opencode/skills/sdd-explore/SKILL.md` |
| sdd-propose | `/sdd-propose <change>`, `/sdd-new <change>` | `~/.config/opencode/skills/sdd-propose/SKILL.md` |
| sdd-spec | `/sdd-spec <change>` | `~/.config/opencode/skills/sdd-spec/SKILL.md` |
| sdd-design | `/sdd-design <change>` | `~/.config/opencode/skills/sdd-design/SKILL.md` |
| sdd-tasks | `/sdd-tasks <change>` | `~/.config/opencode/skills/sdd-tasks/SKILL.md` |
| sdd-apply | Orchestrator launches for implementation | `~/.config/opencode/skills/sdd-apply/SKILL.md` |
| sdd-verify | `/sdd-verify <change>` | `~/.config/opencode/skills/sdd-verify/SKILL.md` |
| sdd-archive | `/sdd-archive <change>` | `~/.config/opencode/skills/sdd-archive/SKILL.md` |
| sdd-onboard | `/sdd-onboard` | `~/.config/opencode/skills/sdd-onboard/SKILL.md` |

---

## Project Skills

Loaded automatically when working with relevant code.

### NestJS Best Practices (v1.1.0)

**Trigger**: NestJS code (modules, controllers, services, providers, guards, pipes, interceptors, etc.)

**Location**: `.agents/skills/nestjs-best-practices/`

**Compact Rules** (auto-injected to sub-agents):
- Use `@nestjs/config` for environment-based configuration
- Use feature modules architecture (one module per domain)
- Use DTOs with class-validator for input validation
- Use response DTOs with `@Exclude()` for output serialization
- Implement health checks with `@nestjs/terminus`
- Use `@nestjs/event-emitter` for intra-service events
- Use BullMQ for background job processing
- Never use `synchronize: true` in production
- Use transactions for multi-entity operations
- Implement graceful shutdown handlers
- Use guards for authentication/authorization
- Use interceptors for cross-cutting concerns
- Use pipes for validation/transformation
- Implement rate limiting with `@nestjs/throttler`

**Sections**: api, arch, db, devops, di, error, micro, perf, security, test

### Node.js Backend Patterns

**Trigger**: Express/Fastify servers, REST APIs, middleware patterns, authentication

**Location**: `.agents/skills/nodejs-backend-patterns/`

### Node.js Best Practices

**Trigger**: General Node.js development, async patterns, security

**Location**: `.agents/skills/nodejs-best-practices/`

### TypeScript Advanced Types

**Trigger**: Complex type logic, generics, utility types, type safety

**Location**: `.agents/skills/typescript-advanced-types/`

---

## User-Level Skills (Available)

| Skill | Trigger | Location |
|-------|---------|----------|
| skill-registry | "update skills", "skill registry" | `~/.config/opencode/skills/skill-registry/SKILL.md` |
| find-skills | "find a skill for X", "how do I do X" | `~/.config/opencode/skills/find-skills/SKILL.md` |
| issue-creation | "create issue", "report bug" | `~/.config/opencode/skills/issue-creation/SKILL.md` |
| branch-pr | "create PR", "open PR" | `~/.config/opencode/skills/branch-pr/SKILL.md` |
| skill-creator | "create a new skill", "add agent instructions" | `~/.config/opencode/skills/skill-creator/SKILL.md` |
| judgment-day | "judgment day", "dual review", "juzgar" | `~/.config/opencode/skills/judgment-day/SKILL.md` |

---

## Skill Resolution Priority

1. **SDD System Skills** (sdd-*) - Always loaded by orchestrator, no manual trigger needed
2. **Project Skills** - Auto-resolved based on file extension and code context
3. **User Skills** - Triggered explicitly by user request

---

## Notes

- Skill triggers are case-insensitive
- Multiple skills can be active simultaneously
- SDD sub-agents receive compact rules auto-injected by the orchestrator
- Project-level skills (`.agents/skills/`) are scanned first and take priority over user-level skills with the same name