# Alpha 01.2 — Preserved Baseline

This branch preserves the source snapshot supplied as `DealFlow_Alpha_01_2.zip` (uploaded 2026-11-06). It is the reference point for the P0 engineering work.

## Snapshot identity
- Product version: Alpha 01.2
- Prototype: static, mobile-friendly browser app
- Decision engine: JavaScript and Python reference implementations
- Scenario set: eight synthetic Dubai real-estate opportunities
- Maximum candidate actions: 20
- Probability convention: percentage points, 0–100, in both engines
- Objective: maximize assumption-based expected incremental agent commission subject to time, dependency, and deadline constraints

## Baseline verification
Executed against the recovered archive before GitHub migration:
- Python: 15 tests passed
- JavaScript: 12 tests passed
- Demo data is synthetic

## Integrity note
The preserved snapshot is not to be edited during P0 work. Fixes are developed on a separate branch and submitted for review. The baseline tests prove only the tested code behavior; they do not prove decision quality or financial impact.
