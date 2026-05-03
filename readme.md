# Bookshop Backend

A full-stack bookshop application built on **SAP Cloud Application Programming Model (CAP)** with a **SAP Fiori Elements (UI5)** frontend, **SAP HANA Cloud** persistence, **XSUAA** authentication, and **Destinations** service. Production-ready for deployment to **SAP BTP Cloud Foundry** as a multi-target application (MTA).

## Features

- 📚 **Book catalog** — manage books with authors, categories, pricing, stock, and ISBN
- ✍️ **Author management** — track authors with one-to-many book associations
- 🛒 **Order management** — orders with composition of order items (parent-child)
- 📝 **Draft handling** — `@odata.draft.enabled` on Books and Orders for safe edits
- 🔄 **Custom actions** — submit orders to transition status; query top books by stock
- 📦 **Auto-generated order numbers** — `ORD-<timestamp>` if not provided
- 🛡️ **Validation hooks** — non-negative price/stock, required title
- 📊 **Computed fields** — `inStock` flag derived after read
- 🌍 **i18n support** — English, German, French message bundles
- 🔐 **Role-based access** — `Bookshop_Admin` and `Bookshop_Viewer` role collections
- 🎨 **SAP Fiori Elements UI** — generated metadata-driven UI with value helps and field groups
- ☁️ **Cloud-ready** — full MTA descriptor for BTP Cloud Foundry

## Architecture

```
┌──────────────────┐     ┌────────────────┐     ┌──────────────┐     ┌────────────┐
│  Fiori Elements  │────▶│ HTML5 Repo +   │────▶│ CAP Service  │────▶│ HANA Cloud │
│  UI5 (com.       │     │ Approuter      │     │  (Node.js)   │     │   (HDI)    │
│  example.books)  │     │ (XSUAA auth)   │     │              │     │            │
└──────────────────┘     └────────────────┘     └──────────────┘     └────────────┘
                                 │                       │
                                 ▼                       ▼
                          ┌────────────┐         ┌──────────────┐
                          │   XSUAA    │         │ Destination  │
                          │  (OAuth)   │         │   Service    │
                          └────────────┘         └──────────────┘
```

- **Fiori Elements UI** (`app/books/`) — UI5 List Report + Object Page for Books
- **CAP Service** (`srv/`) — exposes the `CatalogService` OData V4 API at `/catalog`
- **Database Layer** (`db/`) — schema with Authors, Books, Orders, OrderItems
- **Security** (`xs-security.json`) — XSUAA scopes and role collections
- **i18n** (`_i18n/`) — translations for EN/DE/FR

## Project structure

```
bookshop-backend/
├── _i18n/                       # Translations (EN, DE, FR)
│   ├── i18n_*.properties
│   └── messages_*.properties
├── app/
│   ├── books/                   # SAP Fiori Elements UI5 app
│   │   ├── webapp/
│   │   ├── annotations.cds      # UI annotations (FieldGroup, LineItem, ValueList)
│   │   ├── package.json
│   │   ├── ui5.yaml
│   │   ├── ui5-deploy.yaml
│   │   └── xs-app.json
│   └── services.cds             # Aggregates UI annotations
├── db/
│   ├── data/                    # CSV seed data
│   │   ├── com.example-Authors.csv
│   │   ├── com.example-Books.csv
│   │   ├── com.example-Orders.csv
│   │   └── com.example-OrderItems.csv
│   ├── schema.cds               # Domain model
│   └── undeploy.json
├── srv/
│   ├── catalog-service.cds      # Service definition
│   └── catalog-service.js       # Custom handlers (validation, actions, hooks)
├── mta.yaml                     # Multi-target application descriptor
├── xs-security.json             # XSUAA configuration
└── package.json                 # CAP project manifest
```

## Data model

### Authors (cuid, managed)

| Field | Type | Notes |
|-------|------|-------|
| ID | UUID | Primary key |
| name | String(100) | Required |
| country | String(50) | |
| books | Association → many Books | Backref by `books.author = $self` |

### Books (cuid, managed)

| Field | Type | Notes |
|-------|------|-------|
| ID | UUID | Primary key |
| title | String(200) | Required |
| description | String(1000) | |
| price | Decimal(10,2) | Validated ≥ 0 |
| stock | Integer | Defaults to 0, validated ≥ 0 |
| category | String(50) | |
| isbn | String(20) | |
| author | Association → Authors | |

### Orders (cuid, managed)

| Field | Type | Notes |
|-------|------|-------|
| ID | UUID | Primary key |
| orderNumber | String(20) | Auto-generated if missing (`ORD-<timestamp>`) |
| customer | String(100) | |
| status | String(20) | Default `'NEW'` |
| totalAmount | Decimal(10,2) | |
| items | Composition of many OrderItems | Cascade lifecycle |

### OrderItems (cuid)

| Field | Type | Notes |
|-------|------|-------|
| ID | UUID | Primary key |
| order | Association → Orders | |
| book | Association → Books | |
| quantity | Integer | |
| price | Decimal(10,2) | |

## Service API

Exposed at **`/catalog`** as OData V4:

### Entities

- `GET /catalog/Books` — list books (`@odata.draft.enabled`)
- `GET /catalog/Authors` — `@readonly`
- `GET /catalog/Orders` — list orders (`@odata.draft.enabled`)
- `GET /catalog/OrderItems` — order line items
- Standard CRUD on Books, Orders, OrderItems
- After-read hook adds a derived `inStock: stock > 0` flag

### Custom action — submitOrder

Transitions an order from `NEW` → `SUBMITTED`:

```http
POST /catalog/submitOrder
Content-Type: application/json

{
  "orderId": "o0000000-0000-0000-0000-000000000002"
}
```

Returns the updated `Orders` entity.

### Custom function — topBooks

Returns the books with the highest stock:

```http
GET /catalog/topBooks(limit=5)
```

If `limit` is omitted, defaults to 5.

## Validation rules (server-side)

Implemented in `srv/catalog-service.js`:

- **Books `before CREATE`** — title required, price ≥ 0, stock ≥ 0 (returns HTTP 400 on violation)
- **Orders `before CREATE`** — auto-generates `orderNumber` if missing
- **submitOrder** — verifies order exists; returns HTTP 404 otherwise

## Sample data

The project ships with CSV seed data for local development:

**Authors** — Robert C. Martin (USA), Martin Fowler (UK), and others
**Books** — Clean Code, Clean Architecture, Refactoring, and more (Programming category)
**Orders** — Two sample orders (`ORD-1001` SUBMITTED, `ORD-1002` NEW) with line items

Data is auto-loaded into SQLite on each `cds watch` start.

## Prerequisites

- **Node.js** 18 or newer
- **npm** (bundled with Node.js)
- **SAP CDS CLI** — `npm i -g @sap/cds-dk`
- For deployment:
  - **Cloud Foundry CLI** — `cf install-plugin multiapps`
  - **MBT** — bundled as a dev dependency, no global install needed
  - SAP BTP subaccount with entitlements for HANA Cloud, XSUAA, HTML5 Apps Repository, and Destination

## Local development

### 1. Install dependencies

The root `package.json` uses npm workspaces (`"workspaces": ["app/*"]`), so a single install handles everything:

```bash
npm install
```

### 2. Run the CAP service with SQLite

```bash
npx cds watch
```

The service starts at **http://localhost:4004**. The service index links to the `/catalog` endpoint and Fiori preview.

### 3. Run with the UI

The package script `watch-books` opens the Fiori Elements UI directly:

```bash
npm run watch-books
```

This runs `cds watch --open com.example.books/index.html?sap-ui-xx-viewCache=false --livereload false`, opening the Fiori app in your browser against the live CAP backend.

## Build & deploy to SAP BTP Cloud Foundry

The project includes ready-to-go npm scripts:

### 1. Build the MTA archive

```bash
npm run build
```

This runs `rimraf resources mta_archives && mbt build --mtar archive`, producing `mta_archives/archive.mtar`.

### 2. Log in to Cloud Foundry

```bash
cf login -a https://api.cf.<region>.hana.ondemand.com
```

### 3. Deploy

```bash
npm run deploy
```

This runs `cf deploy mta_archives/archive.mtar --retries 1`, provisioning:

| Module | Type | Purpose |
|--------|------|---------|
| `bookshop-backend-srv` | nodejs | CAP service |
| `bookshop-backend-db-deployer` | hdb | HANA HDI deployment |
| `bookshop-backend-app-content` | application content | Uploads UI to HTML5 repo |
| `comexamplebooks` | html5 | UI5 Fiori app build |

| Resource | Service | Plan |
|----------|---------|------|
| `bookshop-backend-auth` | xsuaa | application |
| `bookshop-backend-db` | hana | hdi-shared |
| `bookshop-backend-destination` | destination | lite |
| `bookshop-backend-repo-host` | html5-apps-repo | app-host |
| `bookshop-backend-repo-runtime` | html5-apps-repo | app-runtime |

### 4. Assign role collections

In the BTP cockpit:

1. Navigate to your subaccount → **Security → Role Collections**
2. Add **Bookshop_Admin** or **Bookshop_Viewer** to your user
3. Log out / log in to refresh the OAuth token

### 5. Undeploy (cleanup)

```bash
npm run undeploy
```

This removes the app along with all bound services and service keys.

## Security model

Defined in `xs-security.json`:

| Scope | Role Template | Role Collection | Description |
|-------|--------------|-----------------|-------------|
| `admin` | `Admin` | `Bookshop_Admin` | Full read/write access |
| `viewer` | `Viewer` | `Bookshop_Viewer` | Read-only access |

The `mta.yaml` also defines a runtime role collection `admin (bookshop-backend ${org}-${space})` scoped to the deployment org/space.

## Tech stack

- [SAP CAP](https://cap.cloud.sap/) `^9` — service framework
- [@cap-js/hana](https://www.npmjs.com/package/@cap-js/hana) `^2` — HANA driver
- [@cap-js/sqlite](https://www.npmjs.com/package/@cap-js/sqlite) `^2` — local dev DB
- [@sap/xssec](https://www.npmjs.com/package/@sap/xssec) `^4` — XSUAA security
- [SAP UI5](https://sapui5.hana.ondemand.com/) — Fiori Elements frontend
- [@sap-ux/eslint-plugin-fiori-tools](https://www.npmjs.com/package/@sap-ux/eslint-plugin-fiori-tools) — Fiori linting
- [cds-plugin-ui5](https://www.npmjs.com/package/cds-plugin-ui5) `^0.13.0` — UI5 dev integration
- [mbt](https://www.npmjs.com/package/mbt) `^1.2.29` — multi-target build tool
- [ui5-task-zipper](https://www.npmjs.com/package/ui5-task-zipper) — packages UI for HTML5 repo

## Troubleshooting

**`cds watch` fails with module errors**
Run `npm install` at the project root. The workspace setup pulls in UI dependencies automatically.

**UI doesn't load via `npm run watch-books`**
Make sure `app/books/webapp/index.html` exists. If it's missing, run the UI build first: `cd app/books && npm run build`.

**`cf deploy` fails on `bookshop-backend-db-deployer`**
HANA HDI container quota exhausted in your subaccount. Free an unused container or request additional entitlements.

**403 Forbidden on the deployed app**
Your user is missing the `Bookshop_Admin` or `Bookshop_Viewer` role collection. Assign it in the BTP cockpit and re-authenticate.

**Draft handling not working as expected**
Drafts require the `@odata.draft.enabled` annotation (already set on Books and Orders). Check that the client uses `OData V4` and supports draft-enabled entities (Fiori Elements does this automatically).

## Learn more

- [SAP CAP documentation](https://cap.cloud.sap/)
- [Deploying to Cloud Foundry](https://cap.cloud.sap/docs/guides/deployment/to-cf)
- [Fiori Elements](https://sapui5.hana.ondemand.com/sdk/#/topic/03265b0408e2432c9571d6b3feb6b1fd)
- [Draft-enabled entities](https://cap.cloud.sap/docs/advanced/fiori#draft-support)

## License

MIT — adapt freely for your own projects.
