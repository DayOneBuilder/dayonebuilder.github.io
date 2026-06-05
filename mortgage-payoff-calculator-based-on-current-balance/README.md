# Mortgage payoff calculator based on current balance

## What this module does

Estimate mortgage payoff time and total cost from the exact inputs users search for:

1. Current balance
2. APR
3. Scheduled payment
4. Optional extra payment

This is a fixed-rate, fixed-payment estimator with:

- copyable result summary
- CSV export for downstream templates
- explicit save intent for install/re-use tracking
- a paid export/template upgrade path

## Install / call path

- Resolver path: `https://dayonebuilder.online/collections/index.json` → `collections/mortgage-payoff-calculator-based-on-current-balance.json`.
- Human path: `https://dayonebuilder.online/mortgage-payoff-calculator-based-on-current-balance/`.
- No login is required for basic use.

## Trusted sources used

- CFPB: payoff amount vs current balance
- CFPB: how paying down a mortgage works
- CFPB: prepayment penalties
- Bank calculator references for benchmark parity

## Smoke test

```bash
curl -fsS https://dayonebuilder.online/mortgage-payoff-calculator-based-on-current-balance/ \
  | rg -i "Calculate payoff"
```

If output contains the page shell text, the page loads.

## CSV + install intent evidence

1. Fill in inputs and click **Calculate payoff**.
2. Confirm `mortgage_payoff_calculation_completed` is emitted.
3. Click **Download CSV** (qualifies as export intent) or **Save plan intent** (local save intent).
4. Validate fixture:

```bash
cat site/mortgage-payoff-calculator-based-on-current-balance/fixture.json
```

