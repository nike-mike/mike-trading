// Crypto Dashboard Script
// Live prices, converter, trending coins, charts

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const PRICE_IDS = ["bitcoin", "ethereum", "tether"];
const PRICE_SYMBOLS = { BTC: "bitcoin", ETH: "ethereum", USDT: "tether" };
const KES = "kes";
const REFRESH_INTERVAL = 10000; // 10 seconds

let prices = { BTC: 0, ETH: 0, USDT: 0 };
let lastUpdated = null;

// DOM Elements
const ticker = document.getElementById("ticker");
const btcPriceEl = document.getElementById("btc-price");
const ethPriceEl = document.getElementById("eth-price");
const usdtPriceEl = document.getElementById("usdt-price");
const lastUpdatedEl = document.getElementById("last-updated");
const kesInput = document.getElementById("kes-amount");
const cryptoSelect = document.getElementById("crypto-select");
const convertedAmountEl = document.getElementById("converted-amount");
const copyButton = document.getElementById("copy-button");
const trendList = document.getElementById("trend-list");

// Fetch prices from CoinGecko
async function fetchPrices() {
  try {
    const url = `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=kes&include_24hr_change=true&include_last_updated_at=true`;
    const res = await fetch(url);
    const data = await res.json();

    prices.BTC = data.bitcoin.kes;
    prices.ETH = data.ethereum.kes;
    prices.USDT = data.tether.kes;

    // 24h change
    prices.BTC_CHANGE = data.bitcoin.kes_24h_change;
    prices.ETH_CHANGE = data.ethereum.kes_24h_change;
    prices.USDT_CHANGE = data.tether.kes_24h_change;

    // Last updated
    lastUpdated = data.bitcoin.last_updated_at || Math.floor(Date.now() / 1000);

    updatePricesUI();
    updateTicker();
    updateConverter();
    updateLastUpdated();
  } catch (e) {
    ticker.textContent = "Failed to load prices. Retrying...";
  }
}

// Update price section
function updatePricesUI() {
  btcPriceEl.textContent = `BTC: KES ${prices.BTC.toLocaleString()} (${formatChange(prices.BTC_CHANGE)})`;
  ethPriceEl.textContent = `ETH: KES ${prices.ETH.toLocaleString()} (${formatChange(prices.ETH_CHANGE)})`;
  usdtPriceEl.textContent = `USDT: KES ${prices.USDT.toLocaleString()} (${formatChange(prices.USDT_CHANGE)})`;
}

// Format 24h change
function formatChange(change) {
  if (typeof change !== "number") return "";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

// Update live ticker
function updateTicker() {
  ticker.textContent =
    `BTC: KES ${prices.BTC.toLocaleString()} | ETH: KES ${prices.ETH.toLocaleString()} | USDT: KES ${prices.USDT.toLocaleString()} | 24h: BTC ${formatChange(prices.BTC_CHANGE)}, ETH ${formatChange(prices.ETH_CHANGE)}, USDT ${formatChange(prices.USDT_CHANGE)}`;
}

// Converter tool
function updateConverter() {
  const kes = parseFloat(kesInput.value) || 0;
  const crypto = cryptoSelect.value;
  const price = prices[crypto];
  if (!price || !kes) {
    convertedAmountEl.textContent = "0.00000000";
    return;
  }
  const converted = kes / price;
  convertedAmountEl.textContent = converted.toFixed(8);
}

// Last updated time
function updateLastUpdated() {
  if (!lastUpdated) {
    lastUpdatedEl.textContent = "Last updated: --";
    return;
  }
  const d = new Date(lastUpdated * 1000);
  lastUpdatedEl.textContent = `Last updated: ${d.toLocaleTimeString()}`;
}

// Copy to clipboard
copyButton.onclick = () => {
  const val = convertedAmountEl.textContent;
  navigator.clipboard.writeText(val);
  copyButton.textContent = "Copied!";
  setTimeout(() => (copyButton.textContent = "Copy"), 1200);
};

// Converter auto-update
kesInput.oninput = updateConverter;
cryptoSelect.onchange = updateConverter;

// Trending coins
async function fetchTrending() {
  try {
    const url = `${COINGECKO_API}/search/trending`;
    const res = await fetch(url);
    const data = await res.json();
    const coins = data.coins.slice(0, 5);
    trendList.innerHTML = "";
    coins.forEach((c) => {
      const coin = c.item;
      const el = document.createElement("div");
      el.className = "trend-coin";
      el.innerHTML = `
        <img src="${coin.small}" alt="${coin.name}">
        <div class="trend-info">
          <div class="trend-name">${coin.name}</div>
          <div class="trend-symbol">${coin.symbol}</div>
          <div class="trend-rank">Rank: ${coin.market_cap_rank || "?"}</div>
        </div>
      `;
      trendList.appendChild(el);
    });
  } catch (e) {
    trendList.innerHTML = "<div>Failed to load trending coins.</div>";
  }
}

// TradingView widgets
function loadTradingView() {
  if (window.TradingView) {
    new window.TradingView.widget({
      autosize: true,
      symbol: "BINANCE:BTCUSDT",
      interval: "30",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      container_id: "btc-chart"
    });
    new window.TradingView.widget({
      autosize: true,
      symbol: "BINANCE:ETHUSDT",
      interval: "30",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      container_id: "eth-chart"
    });
    new window.TradingView.widget({
      autosize: true,
      symbol: "USDTUSD",
      interval: "30",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      container_id: "usdt-chart"
    });
  }
}

// Initial load
fetchPrices();
fetchTrending();
loadTradingView();

// Polling for live updates
setInterval(fetchPrices, REFRESH_INTERVAL);
setInterval(fetchTrending, 60000);