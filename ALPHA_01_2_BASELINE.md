# Alpha 01.2 — Preserved Baseline

This branch is a byte-for-byte source import of the recovered Library archive `DealFlow_Alpha_01_2.zip`, uploaded 2026-11-06. Generated Python cache files are excluded. No P0 candidate changes are included.

## Snapshot identity

- Product version: Alpha 01.2
- Prototype: static, mobile-friendly browser app
- Decision engine: JavaScript and Python reference implementations
- Scenario set: eight synthetic Dubai real-estate opportunities
- Maximum candidate actions: 20
- Probability convention: percentage points, 0–100, in both engines
- Objective: maximize assumption-based expected incremental agent commission subject to time, dependency, and deadline constraints
- Original archive size: 37,815 bytes
- Original archive SHA-256: `129c5e0f4e488cdb8e4401e615bd5a5d73c29b4a8a8952dc86f6bcdd05125dad`

## Source import

- Migration branch: `migration/alpha-01.2-source`
- Byte-exact source-import commit: `03294be31fb2d6fab43284a2076ac11a1693ecb7`
- Source files: 11 (including `.nojekyll`)
- All 11 Git blob SHAs were independently checked against the recovered archive's Git blob hashes; all matched.
- Generated `__pycache__` and `.pyc` files are excluded.
- `README.md` and `FOUNDING_PRINCIPLES.md` match the archive exactly; no documentation rewrite was retained.

## Source SHA-256 checksums

| File | SHA-256 |
|---|---|
| `.nojekyll` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `FOUNDING_PRINCIPLES.md` | `0139875b20abea690de30f4fe4484468bc41715a3bc55080d7ec2e93b8fde2c6` |
| `README.md` | `6119d70d007e3c6fed94d1e2867439b9d6fb20609125ea91754391eef3c3d7bf` |
| `README.txt` | `753402c0083f0925628a6b6972e58d6288f464f7943d9879dc0a42805d9372cc` |
| `app.js` | `96895d48e0e48ef98b243e3d8cfa8e7e6bf4a45c739b66469e0f4f71a0255d7f` |
| `engine.js` | `bec53abc57deeb54f0733aeb01fec0f60744171e0391175bc0838e58f0587471` |
| `index.html` | `d5846e2846abb4304bb2246e26b9a377e579d966e08900a2f405df031f96b705` |
| `python_engine.py` | `1024662f449da0e30507d9983ea7ceaceb77eb7ca99919d8dad20e9130e5753a` |
| `styles.css` | `cfd6569590e8a4dc14559d023e04a46a745feb5d2b7c711027716bbf1586825b` |
| `test_engine.js` | `78985ab9ef8fe5c449b36ad3dfdf2a958f8a2e5ff88c96be8fa77f9a0e79b65a` |
| `test_engine.py` | `124958fde5e4d534261bce4f567de4ef1328b0555fc624536c278f392a882730` |

## Baseline verification

Executed from the extracted original archive's project root:

| Check | Result |
|---|---:|
| `python -m unittest -v test_engine.py` | 15 passed |
| `node test_engine.js` | 12 passed |
| `node --check app.js` | Passed |
| `node --check engine.js` | Passed |
| `python -m py_compile python_engine.py` | Passed |
| `python python_engine.py` | Passed; expected incremental commission AED 21,840 |

All demo data is synthetic. Passing software tests verifies only the tested code behavior; it does not prove decision quality, market demand, superiority, or causal financial impact.

## Preservation control

This import is proposed for `baseline/alpha-01.2` review. The baseline branch has not been modified by this migration branch. After the source-import PR is reviewed and merged, freeze the baseline. All P0 engineering changes remain separate and must be reviewed against this exact snapshot.
