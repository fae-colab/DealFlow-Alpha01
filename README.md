# DealFlow Alpha 01.2

A static, mobile-friendly prototype for testing opportunity-action prioritization for real-estate agents. The Python and JavaScript engines use the same probability scale (0–100) and the same commission-accounting and scheduling rules.

## Run locally

Open `index.html` in a modern browser. No build step, login, paid service, server, or external API is required.

## Automated checks

```bash
python -m unittest -v test_engine.py
node test_engine.js
node --check app.js
node --check engine.js
python python_engine.py
```

All demo data is synthetic. Passing software tests does not establish decision quality, market demand, superiority, or causal financial impact. See `README.txt` and `FOUNDING_PRINCIPLES.md` for assumptions and evidence standards.
