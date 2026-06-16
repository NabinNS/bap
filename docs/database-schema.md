# Database Schema

Initial phase schema design for the BAP platform.

---

## Tables

### `users`
Platform-level user accounts.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | |
| `email` | string | unique |
| `phone` | string | nullable |
| `password` | string | hashed |
| `status` | enum | `active`, `inactive`, `suspended` |
| `email_verified_at` | timestamp | nullable |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `tenants`
A business entity on the platform (shop, supplier, customer, etc.).

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | |
| `slug` | string | unique, used in URLs |
| `email` | string | nullable |
| `phone` | string | nullable |
| `address` | text | nullable |
| `map_url` | string | nullable |
| `longitude` | decimal | nullable |
| `latitude` | decimal | nullable |
| `status` | enum | `active`, `inactive` |
| `created_by` | FK → users.id | who registered this tenant |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `tenant_users`
Membership — links a user to a tenant. One row per user per tenant regardless of how many roles they have.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `tenant_id` | FK → tenants.id | |
| `user_id` | FK → users.id | |
| `status` | enum | `active`, `invited`, `suspended` |
| `invited_by` | FK → users.id | nullable |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `roles`
Global role definitions shared across all tenants.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | e.g. `Owner`, `Manager`, `Staff`, `Viewer` |
| `slug` | string | unique, e.g. `owner`, `manager` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `tenant_user_roles`
Role assignments — a user can hold multiple roles within a tenant.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `tenant_id` | FK → tenants.id | |
| `user_id` | FK → users.id | |
| `role_id` | FK → roles.id | |
| `created_at` | timestamp | |

> A user who is both `owner` and `manager` of a tenant gets two rows here, but only one row in `tenant_users`.

---

### `tenant_contacts`
A user affiliated with a tenant as a contact person. Reuses the `users` table for name, phone, and email.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `tenant_id` | FK → tenants.id | |
| `user_id` | FK → users.id | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `tenant_types`
Classification types for tenants (e.g. supplier, customer, business).

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | e.g. `Supplier`, `Customer`, `Business` |
| `slug` | string | unique |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `tenant_tenant_type`
Pivot — a tenant can belong to multiple types.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `tenant_id` | FK → tenants.id | |
| `tenant_type_id` | FK → tenant_types.id | |
| `created_at` | timestamp | |

---

## Relationships

```
users ──< tenant_users >── tenants
users ──< tenant_user_roles >── roles
              │
           tenants
tenants ──< tenant_contacts >── users
tenants ──< tenant_tenant_type >── tenant_types
```

---

## Open Questions

- **Custom roles per tenant?** Currently roles are global. If tenants need to define their own roles, `roles` will need a nullable `tenant_id` column.
- **Contact vs Member?** A contact (`tenant_contacts`) is an affiliated person not necessarily a platform member. A member (`tenant_users`) has an account and can log in.
