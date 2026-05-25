# 💊 Pharma GMP Validator

**Pharmaceutical Batch Validation & GMP Compliance System**

21 CFR Part 11 | Electronic Batch Records (EBR) | EU GMP Annex 11 | ICH Q7

## Features

- **Batch Lifecycle Management** — From raw materials check through QA release
- **GMP Rule Validation** — Automated checks against 21 CFR 211, EU GMP Annex 11, ICH Q7
- **Electronic Batch Records (EBR)** — Tamper-evident with SHA-256 integrity hashes
- **21 CFR Part 11 Audit Trails** — Every action logged with user ID, timestamp, and hash
- **Deviation & CAPA Tracking** — Automatic flagging of out-of-spec parameters
- **Certificate of Analysis (COA)** — Auto-generated per batch
- **Compliance Reports** — Risk scoring and violation summaries

## Project Structure

```
pharma-gmp-validator/
├── app.py                      # Flask entry point
├── pharma/
│   ├── __init__.py
│   ├── batch_manager.py         # Batch lifecycle & EBR
│   ├── compliance_engine.py     # GMP validation & COA
│   └── database.py              # SQLite with audit trails
├── templates/
│   ├── index.html              # Dashboard
│   ├── batch.html              # Batch detail
│   ├── ebr.html                # Electronic Batch Record
│   └── reports.html            # Compliance reports
├── static/
│   ├── css/style.css           # Dark theme
│   └── js/                     # Frontend logic
├── data/                       # SQLite database
└── requirements.txt
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the application
python app.py

# 3. Open browser
http://localhost:5000
```

## How to Use

1. **Generate Demo Data** — Click "Generate Demo Data" to create 5 sample batches
2. **View Batch** — Click "View" on any batch to see parameters, deviations, audit trail
3. **Validate GMP** — Click "Validate GMP" to run automated compliance checks
4. **View EBR** — Click "EBR" to see the full Electronic Batch Record with integrity hash
5. **QA Release** — Approve or reject batches with comments

## GMP Rules Checked

| Rule | Description |
|------|-------------|
| 21 CFR 211.100 | Written procedures; deviations |
| 21 CFR 211.101 | Charge-in of components |
| 21 CFR 211.110 | In-process testing |
| 21 CFR 211.113 | Microbiological contamination control |
| EU GMP Annex 11.4.1 | Computerized system validation |
| ICH Q7 5.4 | Equipment calibration |

## Compliance Scoring

| Risk Score | Status | Action |
|------------|--------|--------|
| 0-20 | Compliant | Release approved |
| 21-50 | Conditional | Review required |
| 51-100 | Non-Compliant | Stop release, initiate CAPA |

## License

MIT License — For pharmaceutical QC, GMP training, and regulatory compliance prototyping.
