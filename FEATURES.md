# MekyraX — Feature Overview

> Multi-tenant retail / gas-station management platform built as a SaaS product.
> Stack: **Go (Gin + gqlgen + uber/fx)** backend, **Vue 3 + Element Plus + Apollo** frontend, **PostgreSQL 18** with goose migrations, **Casdoor** for identity, **Tailscale** for private networking, **Typst** for PDF reports.

---

## 1. Currently Covered

### 1.1. Identity, multi-tenancy, security
- **Casdoor SSO** with mandatory password change on first login.
- **Multi-tenant** out of the box: every entity is scoped per organization (`tenancy`) — single Postgres instance, isolated schemas/rows.
- **RBAC**: roles & groups managed in admin UI (`UserManagementPage`, `GroupManagementPage`).
- **Audit log** of every mutation — entity-bound (entity_type / entity_id) so each detail page can show its own activity tab.

### 1.2. Catalog
- Products with category, unit, sale price, cost price, stock quantity, barcode, image URL.
- Product detail page: hero, profit-per-item card, **Inventory tab** (import / sale / adjust history) + **Audit tab** (CRUD log) — both paginated.
- Inventory **import** workflow with note + auto-log.
- Sortable, filterable, paginated product list (search + status).

### 1.3. Customers
- Optional fields: phone, address, **CCCD (id_card)**, **email**, **avatar URL**, **note**.
- Detail page: avatar, contact strip (phone / email / id-card / address), debt stat card, tabs **Info / Activity**.
- Filterable list (search, phone, email, id_card, **has-debt**), sortable columns, pagination.

### 1.4. Orders
- Walk-in or named-customer orders, multi-line items, partial paid → automatic **debt accrual**.
- **Order Workspace** screen: optimized POS-style entry, hot-key friendly, recent-orders sidebar with pagination.
- Order detail: status badge, totals stat row, tabs **Items / Activity**, status editor, **Print receipt** action via device bus.
- Filterable list (status, customer, **date range**), default sort `created_at DESC`, sortable columns.
- **Email receipt with PDF**: best-effort hook after `createOrder`. If customer has email + email config enabled, `tryEmailOrderReceipt` renders the order via Typst → PDF → SMTP. **Silent no-op** if config is absent.

### 1.5. Reports & PDF
- Typst-based templating service (`ReportService.PrintReport`). Order receipts, custom report types are template-driven.
- Configurable Typst URL via `application.yaml` (no hardcode).

### 1.6. Dashboard
- KPIs (today revenue, today orders, debt orders, total debt) + bar chart.
- Recent orders list (10 per page) with paginator.

### 1.7. UI / UX foundations
- Common components (`AppDataTable`, `AppFilterBar`, `AppDetailHeader`, `AppLogsPanel`, `AppPagination`) — every list/detail follows the same pattern.
- Sidebar menu with **ellipsis + tooltip** to handle long titles in collapsed/expanded modes.
- **Dark / light** themes via Element Plus token system.
- Full **i18n** (en / vi) with namespaces `common, customers, products, orders, logs, …`.
- Network error toast (centralized in Apollo client).
- Pluggable **device bus** (`shared/devices/deviceBus.ts`):
  - `registerPrintReceiptHandler()` — drop-in driver for ESC/POS, WebUSB, system print dialog.
  - `onScan(handler)` — barcode scanner subscription used during order entry / inventory.

### 1.8. Infrastructure & DevOps
- `docker-compose` with Postgres 18.3, backend, web-client, Casdoor.
- GitHub Actions workflows: build & push images for backend and web-client; manual psql-restore workflow with Tailscale auth.
- 12-factor: every port / URL / SMTP credential is config-driven.
- Configurable backend port (`go.port` in yaml + env `APP_PORT` overrides).

---

## 2. Configuration cheatsheet (`application.yaml`)

```yaml
go:
  port: 8081

typst:
  url: http://localhost:3000

email:
  enabled: false           # toggle off → app runs unchanged
  host: smtp.gmail.com
  port: 587
  user: noreply@example.com
  pass: ""
  from_name: "MekyraX"
  from_address: noreply@example.com
  use_tls: true
```

---

## 3. Suggested next features (for the SaaS roadmap)

### 3.1. Revenue
- **Subscription billing**: per-tenant plans (Free / Pro / Business), usage limits (orders/month, storage), Stripe / VNPAY / MoMo integration.
- **Add-on store**: paid integrations (e-invoice, loyalty, BI dashboards).

### 3.2. Domain depth
- **Multi-currency** + FX, multi-warehouse stock, transfer-between-warehouse workflow.
- **Supplier management** with purchase orders, AP debt mirroring AR.
- **Inventory forecasting** (simple moving average → ML once data volume justifies).
- **Loyalty / membership program** with points, tiers, birthday vouchers.
- **Promotions engine**: rule-based discounts, coupon codes, time-bound campaigns.

### 3.3. Vietnam-market specific
- **E-invoice (HĐĐT)** integration with Tổng Cục Thuế / Misa / Viettel.
- **Cashless** integrations: VNPay QR, MoMo, ZaloPay, bank transfer auto-reconciliation via webhook.
- **Zalo OA / WhatsApp** receipt + reminder messaging (in addition to email).
- **VAT-compliant reports** (mẫu 01/GTGT, etc.).

### 3.4. Hardware & POS
- ESC/POS thermal printer driver (WebUSB) plugged into `deviceBus.printReceipt`.
- Barcode scanner profile (HID keyboard wedge + WebSerial).
- Cash drawer kick command.
- Customer-facing display screen (second monitor).

### 3.5. Mobile / offline
- React Native or Flutter app for shop floor (scan + create order).
- **Offline-first** order creation with conflict-resolution sync (CRDT or last-write-wins + audit).

### 3.6. Analytics & BI
- Daily/weekly/monthly P&L dashboards with cohort comparison.
- Embedded Metabase / Grafana per tenant (schema-scoped read-only Postgres user).
- Top-N customers by revenue / debt; ABC analysis on stock.
- Anomaly alerts (sudden stock drop, spike in returns).

### 3.7. Operations & support
- **Helpdesk / ticket** module per tenant for customer service.
- **Tasks & shift management** for staff.
- **Audit & compliance**: tamper-evident log (hash-chained), GDPR data-export / right-to-be-forgotten.

### 3.8. Platform polish
- Per-tenant custom branding (logo, color, receipt template).
- Webhook outbox so customers can subscribe to `order.created`, `customer.debt_changed`, etc.
- Public REST/GraphQL API + per-tenant API keys with rate limiting.
- Self-serve onboarding wizard (sample data, guided tour).
