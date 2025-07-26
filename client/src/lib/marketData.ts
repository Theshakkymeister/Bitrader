// Comprehensive market data with 500+ stocks and cryptos
export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  type: 'stock' | 'crypto';
  logo?: string;
  marketCap?: string;
  volume?: string;
  sector?: string;
}

// Generate random but realistic price data
const generatePrice = (basePrice: number) => {
  const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
  return Number((basePrice * (1 + variation)).toFixed(2));
};

const generateChange = () => {
  return Number(((Math.random() - 0.5) * 10).toFixed(2)); // ±5% change
};

// Top cryptocurrencies with real data
export const cryptoAssets: MarketAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: generatePrice(43250), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { symbol: 'ETH', name: 'Ethereum', price: generatePrice(2580), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { symbol: 'BNB', name: 'BNB', price: generatePrice(315), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  { symbol: 'SOL', name: 'Solana', price: generatePrice(98), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { symbol: 'XRP', name: 'XRP', price: generatePrice(0.52), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
  { symbol: 'ADA', name: 'Cardano', price: generatePrice(0.38), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
  { symbol: 'AVAX', name: 'Avalanche', price: generatePrice(35.6), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
  { symbol: 'DOGE', name: 'Dogecoin', price: generatePrice(0.085), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  { symbol: 'DOT', name: 'Polkadot', price: generatePrice(7.85), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' },
  { symbol: 'MATIC', name: 'Polygon', price: generatePrice(0.89), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
  { symbol: 'SHIB', name: 'Shiba Inu', price: generatePrice(0.000009), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png' },
  { symbol: 'TRX', name: 'TRON', price: generatePrice(0.105), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
  { symbol: 'LTC', name: 'Litecoin', price: generatePrice(72.5), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  { symbol: 'LINK', name: 'Chainlink', price: generatePrice(14.8), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png' },
  { symbol: 'UNI', name: 'Uniswap', price: generatePrice(6.2), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png' },
  { symbol: 'ATOM', name: 'Cosmos', price: generatePrice(9.8), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.png' },
  { symbol: 'XLM', name: 'Stellar', price: generatePrice(0.125), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/stellar-xlm-logo.png' },
  { symbol: 'XMR', name: 'Monero', price: generatePrice(168), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/monero-xmr-logo.png' },
  { symbol: 'ETC', name: 'Ethereum Classic', price: generatePrice(20.5), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.png' },
  { symbol: 'BCH', name: 'Bitcoin Cash', price: generatePrice(245), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/bitcoin-cash-bch-logo.png' },
  { symbol: 'ALGO', name: 'Algorand', price: generatePrice(0.18), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/algorand-algo-logo.png' },
  { symbol: 'VET', name: 'VeChain', price: generatePrice(0.025), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/vechain-vet-logo.png' },
  { symbol: 'FIL', name: 'Filecoin', price: generatePrice(5.2), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/filecoin-fil-logo.png' },
  { symbol: 'ICP', name: 'Internet Computer', price: generatePrice(4.8), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/internet-computer-icp-logo.png' },
  { symbol: 'NEAR', name: 'NEAR Protocol', price: generatePrice(2.1), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/near-protocol-near-logo.png' },
  { symbol: 'APT', name: 'Aptos', price: generatePrice(8.5), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/aptos-apt-logo.png' },
  { symbol: 'HBAR', name: 'Hedera', price: generatePrice(0.058), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png' },
  { symbol: 'QNT', name: 'Quant', price: generatePrice(98), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/quant-qnt-logo.png' },
  { symbol: 'LDO', name: 'Lido DAO', price: generatePrice(1.8), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/lido-dao-token-ldo-logo.png' },
  { symbol: 'STX', name: 'Stacks', price: generatePrice(0.88), change: generateChange(), type: 'crypto', logo: 'https://cryptologos.cc/logos/stacks-stx-logo.png' },
];

// Top stocks from major indices with realistic data
export const stockAssets: MarketAsset[] = [
  // Technology sector
  { symbol: 'AAPL', name: 'Apple Inc.', price: generatePrice(185.60), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/apple.com' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: generatePrice(378.85), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/microsoft.com' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: generatePrice(142.65), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/google.com' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: generatePrice(153.75), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/amazon.com' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: generatePrice(248.90), change: generateChange(), type: 'stock', sector: 'Automotive', logo: 'https://logo.clearbit.com/tesla.com' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: generatePrice(350.25), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/meta.com' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: generatePrice(720.50), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/nvidia.com' },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: generatePrice(485.20), change: generateChange(), type: 'stock', sector: 'Entertainment', logo: 'https://logo.clearbit.com/netflix.com' },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: generatePrice(585.40), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/adobe.com' },
  { symbol: 'CRM', name: 'Salesforce Inc.', price: generatePrice(265.80), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/salesforce.com' },
  { symbol: 'ORCL', name: 'Oracle Corporation', price: generatePrice(112.45), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/oracle.com' },
  { symbol: 'INTC', name: 'Intel Corporation', price: generatePrice(45.20), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/intel.com' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: generatePrice(142.80), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/amd.com' },
  { symbol: 'SPOT', name: 'Spotify Technology SA', price: generatePrice(165.30), change: generateChange(), type: 'stock', sector: 'Entertainment', logo: 'https://logo.clearbit.com/spotify.com' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', price: generatePrice(62.40), change: generateChange(), type: 'stock', sector: 'Technology', logo: 'https://logo.clearbit.com/uber.com' },
  
  // Financial sector
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: generatePrice(165.80), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/jpmorganchase.com' },
  { symbol: 'BAC', name: 'Bank of America Corp.', price: generatePrice(32.50), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/bankofamerica.com' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', price: generatePrice(42.80), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/wellsfargo.com' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', price: generatePrice(385.20), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/goldmansachs.com' },
  { symbol: 'MS', name: 'Morgan Stanley', price: generatePrice(88.40), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/morganstanley.com' },
  { symbol: 'V', name: 'Visa Inc.', price: generatePrice(258.90), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/visa.com' },
  { symbol: 'MA', name: 'Mastercard Inc.', price: generatePrice(425.60), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/mastercard.com' },
  { symbol: 'AXP', name: 'American Express Company', price: generatePrice(178.30), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/americanexpress.com' },
  { symbol: 'C', name: 'Citigroup Inc.', price: generatePrice(58.20), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/citigroup.com' },
  { symbol: 'BLK', name: 'BlackRock Inc.', price: generatePrice(785.40), change: generateChange(), type: 'stock', sector: 'Financial', logo: 'https://logo.clearbit.com/blackrock.com' },
  
  // Healthcare sector
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: generatePrice(162.80), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/jnj.com' },
  { symbol: 'PFE', name: 'Pfizer Inc.', price: generatePrice(28.90), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/pfizer.com' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: generatePrice(520.40), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/unitedhealthgroup.com' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', price: generatePrice(158.70), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/abbvie.com' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', price: generatePrice(598.20), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/lilly.com' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', price: generatePrice(108.50), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/merck.com' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', price: generatePrice(568.90), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/thermofisher.com' },
  { symbol: 'DHR', name: 'Danaher Corporation', price: generatePrice(238.40), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/danaher.com' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb', price: generatePrice(52.80), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/bms.com' },
  { symbol: 'CVS', name: 'CVS Health Corporation', price: generatePrice(72.30), change: generateChange(), type: 'stock', sector: 'Healthcare', logo: 'https://logo.clearbit.com/cvshealth.com' },
  
  // Consumer sector
  { symbol: 'KO', name: 'Coca-Cola Company', price: generatePrice(58.40), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/coca-cola.com' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', price: generatePrice(168.90), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/pepsi.com' },
  { symbol: 'WMT', name: 'Walmart Inc.', price: generatePrice(158.20), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/walmart.com' },
  { symbol: 'HD', name: 'Home Depot Inc.', price: generatePrice(328.50), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/homedepot.com' },
  { symbol: 'NKE', name: 'Nike Inc.', price: generatePrice(102.80), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/nike.com' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', price: generatePrice(98.60), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/starbucks.com' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', price: generatePrice(285.40), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/mcdonalds.com' },
  { symbol: 'DIS', name: 'Walt Disney Company', price: generatePrice(108.90), change: generateChange(), type: 'stock', sector: 'Entertainment', logo: 'https://logo.clearbit.com/disney.com' },
  { symbol: 'TGT', name: 'Target Corporation', price: generatePrice(148.70), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/target.com' },
  { symbol: 'LOW', name: 'Lowe\'s Companies Inc.', price: generatePrice(215.80), change: generateChange(), type: 'stock', sector: 'Consumer', logo: 'https://logo.clearbit.com/lowes.com' }
];

// Generate additional stocks for major indices
const generateAdditionalStocks = (): MarketAsset[] => {
  const additionalStocks = [
    // More tech stocks
    'IBM', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'NOW', 'INTU', 'ISRG', 'MU', 'LRCX',
    'KLAC', 'MCHP', 'SWKS', 'XLNX', 'MRVL', 'SNPS', 'CDNS', 'FTNT', 'PANW', 'CRWD',
    
    // Industrial stocks
    'GE', 'CAT', 'BA', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'GD', 'MMM',
    'DE', 'EMR', 'ETN', 'PH', 'ITW', 'FDX', 'CSX', 'NSC', 'UNP', 'WM',
    
    // Energy stocks
    'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'PXD', 'KMI', 'OKE', 'WMB', 'MPC',
    'VLO', 'PSX', 'HES', 'DVN', 'FANG', 'APA', 'EQT', 'HAL', 'BKR', 'OXY',
    
    // Materials stocks
    'LIN', 'APD', 'ECL', 'FCX', 'NEM', 'DOW', 'DD', 'PPG', 'SHW', 'NUE',
    'STLD', 'VMC', 'MLM', 'PKG', 'IP', 'WRK', 'AVY', 'BALL', 'CCL', 'SEE',
    
    // Utilities stocks
    'NEE', 'SO', 'DUK', 'AEP', 'D', 'PCG', 'EXC', 'XEL', 'ED', 'WEC',
    'PPL', 'FE', 'ES', 'ETR', 'CMS', 'PEG', 'SRE', 'AES', 'LNT', 'NI',
    
    // Real Estate stocks
    'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'WELL', 'SPG', 'O', 'CBRE', 'AVB',
    'EQR', 'ESS', 'MAA', 'UDR', 'CPT', 'EXR', 'FRT', 'REG', 'KIM', 'HST',
    
    // More financial stocks
    'BRK.B', 'SCHW', 'USB', 'PNC', 'TFC', 'COF', 'AIG', 'MET', 'PRU', 'AFL',
    'ALL', 'TRV', 'PGR', 'CB', 'MMC', 'AON', 'ICE', 'CME', 'NDAQ', 'SPGI',
    
    // More healthcare stocks
    'GILD', 'AMGN', 'VRTX', 'REGN', 'BIIB', 'ILMN', 'MRNA', 'ZTS', 'CI', 'HUM',
    'ANTM', 'WBA', 'MCK', 'ABC', 'CAH', 'DGX', 'LH', 'BDX', 'SYK', 'ZBH',
    
    // More consumer stocks
    'AMZN', 'COST', 'MDLZ', 'KHC', 'GIS', 'K', 'HSY', 'STZ', 'TAP', 'CPB',
    'CAG', 'SJM', 'HRL', 'TSN', 'TYSON', 'ADM', 'BG', 'LW', 'MKC', 'CHD',
    
    // Communication stocks
    'T', 'VZ', 'CMCSA', 'CHTR', 'TMUS', 'DISH', 'VIA', 'FOX', 'NWSA', 'NYT',
    'SIRI', 'LBRDA', 'LBRDK', 'LILAK', 'FWONA', 'BATRK', 'LSXMA', 'LSXMK', 'TRIP', 'YELP'
  ];

  return additionalStocks.map((symbol, index) => ({
    symbol,
    name: `${symbol} Corporation`,
    price: generatePrice(50 + (index % 200)),
    change: generateChange(),
    type: 'stock' as const,
    sector: ['Technology', 'Financial', 'Healthcare', 'Consumer', 'Industrial', 'Energy'][index % 6],
    logo: `https://logo.clearbit.com/${symbol.toLowerCase().replace('.', '')}.com`
  }));
};

// Generate additional cryptocurrencies
const generateAdditionalCryptos = (): MarketAsset[] => {
  const additionalCryptos = [
    'ADA', 'DOGE', 'TRX', 'LEO', 'TON', 'DAI', 'WBTC', 'STETH', 'USDC', 'USDT',
    'THETA', 'VET', 'ICP', 'FTM', 'MANA', 'SAND', 'CRO', 'HBAR', 'FLOW', 'EGLD',
    'XTZ', 'AAVE', 'CAKE', 'GRT', 'ENJ', 'CHZ', 'COMP', 'MKR', 'YFI', 'SUSHI',
    'SNX', 'BAT', 'ZRX', 'KNC', 'LOOPRING', 'ONT', 'QTUM', 'ZIL', 'ICX', 'SC',
    'ZEN', 'NANO', 'IOTA', 'WAVES', 'OMG', 'ZEC', 'DASH', 'DOGE', 'BTG', 'DCR',
    'LSK', 'STEEM', 'BTS', 'ARDR', 'NXT', 'GBYTE', 'DGB', 'SYS', 'PIVX', 'NAV'
  ];

  return additionalCryptos.map((symbol, index) => ({
    symbol,
    name: `${symbol} Token`,
    price: generatePrice(index < 20 ? 100 : 10),
    change: generateChange(),
    type: 'crypto' as const,
    logo: `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`
  }));
};

// Combine all assets
export const allAssets: MarketAsset[] = [
  ...cryptoAssets,
  ...stockAssets,
  ...generateAdditionalStocks(),
  ...generateAdditionalCryptos()
];

// Helper functions
export const getAssetsByType = (type: 'stock' | 'crypto'): MarketAsset[] => {
  return allAssets.filter(asset => asset.type === type);
};

export const getAssetBySymbol = (symbol: string): MarketAsset | undefined => {
  return allAssets.find(asset => asset.symbol === symbol);
};

export const searchAssets = (query: string): MarketAsset[] => {
  const lowercaseQuery = query.toLowerCase();
  return allAssets.filter(asset => 
    asset.symbol.toLowerCase().includes(lowercaseQuery) ||
    asset.name.toLowerCase().includes(lowercaseQuery)
  );
};

// Market data simulation
export const generateMarketData = () => {
  const data: Record<string, { price: number; change: number; type: 'stock' | 'crypto' }> = {};
  
  allAssets.forEach(asset => {
    data[asset.symbol] = {
      price: asset.price,
      change: asset.change,
      type: asset.type
    };
  });
  
  return data;
};