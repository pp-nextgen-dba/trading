const DEFAULT_SYMBOLS = ["TSLA", "NVDA", "AMD"];
const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: "Missing ALPHA_VANTAGE_API_KEY environment variable" });
    return;
  }

  const symbols = getSymbols(request.query.symbols);

  try {
    const quotes = await Promise.all(symbols.map((symbol) => fetchDailySeries(symbol, apiKey)));
    response.status(200).json({
      source: "Alpha Vantage TIME_SERIES_DAILY",
      generatedAt: new Date().toISOString(),
      quotes
    });
  } catch (error) {
    response.status(502).json({ error: error.message });
  }
};

function getSymbols(value) {
  if (!value) return DEFAULT_SYMBOLS;

  return String(value)
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 10);
}

async function fetchDailySeries(symbol, apiKey) {
  const url = new URL(ALPHA_VANTAGE_URL);
  url.searchParams.set("function", "TIME_SERIES_DAILY");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("outputsize", "compact");
  url.searchParams.set("apikey", apiKey);

  const result = await fetch(url);
  if (!result.ok) {
    throw new Error(`Alpha Vantage request failed for ${symbol}`);
  }

  const json = await result.json();
  if (json.Note || json.Information) {
    throw new Error(json.Note || json.Information);
  }

  const series = json["Time Series (Daily)"];
  if (!series) {
    throw new Error(`Missing daily chart data in Alpha Vantage response for ${symbol}`);
  }

  const candles = Object.entries(series)
    .map(([date, values]) => {
      return {
        date,
        open: Number(values["1. open"]),
        high: Number(values["2. high"]),
        low: Number(values["3. low"]),
        close: Number(values["4. close"]),
        volume: Number(values["5. volume"])
      };
    })
    .filter((candle) => candle.date && Number.isFinite(candle.volume) && candle.volume > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5);

  if (!candles.length) {
    throw new Error(`Missing daily volume in Alpha Vantage response for ${symbol}`);
  }

  const latest = candles[candles.length - 1];

  return {
    symbol,
    price: latest.close,
    volume: latest.volume,
    latestTradingDay: latest.date,
    candles
  };
}
