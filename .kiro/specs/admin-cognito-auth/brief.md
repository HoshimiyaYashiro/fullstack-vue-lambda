# Brief: admin-cognito-auth

## Problem
The Admin Dashboard (`admin-web`) serves two distinct administrative tiers across multiple business organizations: **System Operators** (platform super-administrators overseeing the entire ecosystem) and **Enterprise Tenant Administrators** (business admins managing operations strictly within their own enterprise boundary). The system requires robust multi-tenant data isolation and identity federation using AWS Cognito User Pools, backed by an Amazon Aurora PostgreSQL relational store, along with automated AWS CDK (Node.js/TypeScript) Infrastructure as Code.

Currently, `apps/api-lambda` relies on an in-memory mock repository without multi-tenancy support or real JWT verification, `apps/admin-web` lacks multi-tenant auth interfaces, OTP verification challenges, and tenant scoping, and no IaC stack exists to provision the multi-tenant Cognito user directory.

## Current State
- `apps/admin-web`: Lacks authentication views, Email OTP challenge handling, multi-tenant state management, and route navigation guards.
- `apps/api-lambda`: Handlers query mock data without tenant boundary checks. `users.repository.ts` has no tenant isolation or Aurora persistence.
- `packages/shared`: Contains basic user schemas and roles, but lacks multi-tenant metadata (`tenantId`), custom claims, and tenant authorization contracts.
- Infrastructure: No AWS CDK stack exists to deploy multi-tenant Cognito User Pools with custom attributes and role groups.

## Desired Outcome
- Automated AWS CDK provisioning deploys a Cognito User Pool configured with `custom:tenant_id` attribute, Email OTP multi-factor authentication, SPA App Client, and distinct role groups (`Operator` and `TenantAdmin`).
- Administrators authenticate via Email + Password followed by an Email OTP verification challenge.
- The system extracts caller identity, role group, and tenant context (`tenant_id`) from verified JWT claims.
- The backend maps and synchronizes identities to an Aurora PostgreSQL database containing `tenants` and `users` tables, strictly enforcing tenant isolation:
  - **Enterprise Tenant Admins**: Queries and operations are strictly partitioned by the administrator's assigned `tenant_id`. Cross-tenant access is blocked.
  - **System Operators**: Possess cross-tenant permissions, allowing inspection and management across all tenants with optional tenant-filtering capabilities.
- Admin Web UI preserves tenant context across sessions and enforces route protection according to role privileges.

## Approach
**AWS CDK Provisioning + Multi-Tenant Isolation + Email OTP Challenge + Hybrid API Gateway & Lambda JWT Verification with Drizzle ORM (`postgres.js`)**:
- **Infrastructure Layer**: AWS CDK construct defining Cognito User Pool with email verification, Email OTP MFA, custom attribute `custom:tenant_id`, SPA Client, and security groups (`Operator`, `TenantAdmin`).
- **Database & Multi-Tenant Layer**: Drizzle ORM with `postgres.js` for Aurora PostgreSQL. Database schema with `tenants` and `users` (with `tenant_id`, `cognito_sub`, `role`). Serverless configuration (`max: 1`, `prepare: false`, `callbackWaitsForEmptyEventLoop = false`).
- **Auth & Tenant Scoping Middleware**: `withAuth` middleware validating Cognito JWTs, resolving user tenant context, and enforcing row-level or query-level tenant isolation (Tenant Admin restricted to `where tenant_id = ?`; Operator granted global access).
- **Account & Tenant Mapping**: `AuroraUsersRepository` handling JIT sync of tenant admin or operator records.
- **Frontend Integration**: AWS Amplify v6 in `apps/admin-web`, feature-sliced auth module, login and OTP verification forms, Pinia auth/tenant store, and role/tenant-aware router navigation guards.

## Scope
- **In**:
  - AWS CDK (TypeScript / Node.js) stack provisioning Cognito User Pool with `custom:tenant_id`, Email OTP MFA, SPA Client, and groups (`Operator`, `TenantAdmin`).
  - Multi-tenant database schema (`tenants`, `users`) and migration scripts in `apps/api-lambda`.
  - JIT user synchronization mapping Cognito `sub`, `email`, role group, and `custom:tenant_id` into Aurora PostgreSQL.
  - Backend authentication and tenant-scoping middleware enforcing tenant isolation for Tenant Admins and global access for Operators.
  - Registration/invitation confirmation and sign-in flows with Email OTP verification challenge.
  - Admin Web frontend auth feature slice with login, OTP challenge, Pinia tenant-aware auth store, and route guards.
  - Environment variable schema and configuration documentation for CDK, Cognito, and Aurora.
- **Out**:
  - Customer/end-user authentication for `apps/user-web` (reserved for a dedicated spec).
  - SMS-based OTP delivery (restricted to Email OTP).
  - Social federation providers (Google/Apple).
  - External VPC or Aurora cluster infrastructure creation (connection strings supplied via environment configuration).

## Boundary Candidates
- **Seam 1: Infrastructure as Code (`infra/` or CDK package)**: Multi-tenant Cognito User Pool, custom attributes, groups, and client constructs.
- **Seam 2: Multi-Tenant Database Layer (`apps/api-lambda/src/db/`)**: Schema definitions (`tenants`, `users`), connection management, and tenant-scoped repository operations.
- **Seam 3: Authentication & Tenant Authorization Middleware (`apps/api-lambda/src/middleware/`)**: JWT verification, claim extraction, role resolution (`Operator` vs `TenantAdmin`), and tenant context injection.
- **Seam 4: Admin Web Multi-Tenant Auth Feature (`apps/admin-web/src/features/auth/`)**: Sign-in, Email OTP challenge modal, tenant context awareness, and navigation guards.

## Out of Boundary
- End-user portal authentication.
- Billing and subscription management for tenants (separate future billing feature).

## Upstream / Downstream
- **Upstream**: AWS CDK deployment, Amazon SES for Email OTP delivery, Amazon Aurora PostgreSQL database.
- **Downstream**: Back-office operational features (User Management, Tenant Management, Analytics Dashboards) consuming tenant-scoped request context.

## Existing Spec Touchpoints
- **Extends**: None (foundational feature spec).
- **Adjacent**: Future `tenant-management` and `user-cognito-auth` specifications.

## Constraints
- **Multi-Tenant Security**: Tenant Admins must never access, query, or mutate records outside their assigned `tenant_id`.
- **Infrastructure Engine**: AWS CDK v2 (TypeScript / Node.js).
- **Runtime**: Node.js 20 ESM on AWS Lambda; `tsup` bundler requires `platform: 'node'`.
- **Database Proxy**: `prepare: false` on `postgres.js` to ensure compatibility with AWS RDS Proxy.
- **Event Loop**: `context.callbackWaitsForEmptyEventLoop = false` on Lambda database handlers.
- **Monorepo Separation**: No direct imports between `admin-web` and `user-web`; shared DTOs/schemas reside in `@repo/shared`.
