# Pharma GMP Validator

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](#quick-start)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-black.svg)](#architecture)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Compliance](https://img.shields.io/badge/Compliance-21%20CFR%20Part%2011-purple.svg)](#compliance--data-integrity)

A lightweight Flask-based validation platform for GMP workflows, audit-ready records, and pharmaceutical data integrity.

## Features & Regulatory Alignment

| Capability | Why It Matters | Regulation Alignment |
|---|---|---|
| Electronic records & signatures | Supports traceable approvals and review checkpoints | FDA 21 CFR Part 11 |
| Audit trail visibility | Preserves who changed what and when | EU GMP Annex 11 |
| Validation workflow controls | Enforces repeatable GMP process checks | ICH Q10 |
| Data integrity checks | Protects raw/processed record trustworthiness | ALCOA+ principles |

## Quick Start

```bash
git clone https://github.com/howardcelt/pharma-gmp-validator.git
cd pharma-gmp-validator
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
flask --app app run
```

## Architecture

```text
┌──────────────────────────────────────────┐
│              Flask Web App               │
│  (UI, API, Validation Rule Orchestration)│
└───────────────┬──────────────────────────┘
                │
     ┌──────────▼──────────┐
     │ Validation Services │
     │ - Rule Engine       │
     │ - Audit Logger      │
     │ - Signature Checks  │
     └──────────┬──────────┘
                │
     ┌──────────▼──────────┐
     │ SQLite Data Layer   │
     │ - Batches           │
     │ - Events            │
     │ - Audit Trail       │
     └─────────────────────┘
```

## Project Structure

```text
pharma-gmp-validator/
├── README.md
└── docs/
    ├── compliance/
    │   └── README.md
    └── screenshots/
        └── .gitkeep
```

## Screenshots

> Add your application screenshots to `docs/screenshots/` using these names.

![Dashboard Overview](docs/screenshots/dashboard-overview.png)
![Batch Validation Detail](docs/screenshots/batch-validation-detail.png)
![Audit Trail Explorer](docs/screenshots/audit-trail-explorer.png)

## Compliance & Data Integrity

### ALCOA+ Mapping

| Principle | Implementation Intent |
|---|---|
| Attributable | User-linked actions and signature identity |
| Legible | Human-readable and structured records |
| Contemporaneous | Time-stamped transaction capture |
| Original | Preserved source records with controlled edits |
| Accurate | Rule-based checks and exception logging |
| Complete | Full event history with no hidden deletes |
| Consistent | Standardized validation sequence |
| Enduring | Durable retention of audit evidence |
| Available | Fast retrieval for audits and inspections |

Compliance references live in [`docs/compliance/`](docs/compliance/README.md).

## API Documentation (12 Endpoints)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Service health check |
| GET | `/api/versions` | API and schema version info |
| POST | `/api/batches` | Create validation batch |
| GET | `/api/batches` | List validation batches |
| GET | `/api/batches/{batch_id}` | Get batch details |
| PATCH | `/api/batches/{batch_id}` | Update batch metadata/state |
| POST | `/api/batches/{batch_id}/validate` | Execute validation checks |
| GET | `/api/batches/{batch_id}/results` | Retrieve validation results |
| GET | `/api/audit-trail` | Query audit events |
| GET | `/api/audit-trail/{event_id}` | Retrieve specific audit event |
| POST | `/api/signatures` | Create electronic signature record |
| GET | `/api/compliance/report` | Generate compliance summary |

## Use Cases

- Quality Control (QC) labs
- GMP training and simulation
- Regulatory audit readiness
- Digital twin process validation

## Repository Discovery Tips

For better discoverability, use repository topics such as:
`pharmaceutical`, `gmp`, `21-cfr-part-11`, `flask`, `quality-control`, `compliance`.
