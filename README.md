# Trading

Static trading analysis tools.

## Current Page

- `index.html` - Stock analysis dashboard for TSLA, NVDA, and AMD with quote refresh, chart switching, current and last-week volume comparison, manual support/resistance levels, risk snapshot, checklist, and separate trade journals.
- `api/volume.js` - Optional serverless API proxy for daily chart volume data. It keeps the market-data API key out of the browser.

## Live Volume Setup

GitHub Pages can serve the static page, but it cannot run `api/volume.js`. For reliable daily chart volume, deploy this repo to a serverless host such as Vercel and set this environment variable:

```text
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

The page calls:

```text
/api/volume?symbols=TSLA,NVDA,AMD
```

The proxy uses Alpha Vantage daily candles, so the displayed volume is the latest available daily chart volume rather than true real-time intraday volume. If the API proxy is unavailable, the page falls back to browser-side data sources and then to the manual CSV input.

## Local Path

```text
/Users/paulsi/codex/trading/git_repo
```

## Notes

This is a personal analysis tool, not financial advice. Confirm live market prices and news through a broker or trusted market data source before trading.
