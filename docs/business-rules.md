# Reglas de negocio

## Roles

- ADMIN: full access to administrative operations.
- PROJECT_MANAGER: can manage projects and their related media.

## Project lifecycle

- DRAFT: internal only
- PUBLISHED: public
- ARCHIVED: hidden from main public lists

## Leads

- Public lead creation only, no public read access.
- Administrative users may review and update status.

## Security

- Sessions are validated via JWT cookies and server-side checks.
- Passwords are hashed with Argon2id before persistence.
- Public content never exposes admin-only fields.
