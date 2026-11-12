# DealFlow Alpha 01.3

A static, mobile-friendly prototype for testing opportunity-action prioritization for real-estate agents. The Python and JavaScript engines use the same probability scale (0–100) and the same commission-accounting and scheduling rules.

## Run locally

Open `index.html` in a modern browser. No build step, login, paid service, server, or external API is required.

## Automated checks

```bash
python -m unittest -v test_engine.py
node test_engine.js
node test_evidence.js
node --check evidence.js
node --check app.js
node --check engine.js
python python_engine.py
```

All demo data is synthetic. Passing software tests does not establish decision quality, market demand, superiority, or causal financial impact. See `README.txt` and `FOUNDING_PRINCIPLES.md` for assumptions and evidence standards.


## Evidence migration (Alpha 01.3)

The app migrates local Alpha 01.2/01.1 data to schema version 1.3 in the browser. Legacy evidence labels and source fields remain readable and are copied into traceable legacy evidence records; a legacy `verified` label, URL, or date is not treated as independent verification or upgraded evidence quality. Synthetic seed assumptions are explicitly marked `synthetic_demo`. Existing outcomes and optimization history are preserved unchanged in this first migration step.
