import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, RefreshCw, Sparkles, Activity, Globe, Info } from 'lucide-react';
import { fetchWithAuth } from '../api/config';

export interface MarketDataSnapshot {
  nifty_50: {
    symbol: string;
    name: string;
    current_price: number;
    change_pct_1y: number;
    pe_ratio: number;
    status: string;
  };
  sensex: {
    symbol: string;
    name: string;
    current_price: number;
    change_pct_1y: number;
    pe_ratio: number;
    status: string;
  };
  gold: {
    symbol: string;
    name: string;
    current_price: number;
    change_pct_1y: number;
    status: string;
  };
  india_10y_bond: {
    symbol: string;
    name: string;
    yield_pct: number;
    status: string;
  };
  regime: {
    status: string;
    pe_level: number;
    description: string;
    lumpsum_recommendation: string;
    lumpsum_badge: string;
    actionable_advice: string;
    tactical_tilts: {
      equity_tilt: number;
      debt_tilt: number;
      recommended_focus: string;
    };
  };
  last_synced: string;
  is_live: boolean;
}

interface LiveMarketCardProps {
  onOpenShellyChat?: (initialMessage?: string) => void;
  compact?: boolean;
}

export const LiveMarketCard: React.FC<LiveMarketCardProps> = ({ onOpenShellyChat, compact = false }) => {
  const [marketData, setMarketData] = useState<MarketDataSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async (force: boolean = false) => {
    try {
      if (force) setRefreshing(true);
      const res = await fetchWithAuth(`/api/engine/market-intelligence?force_refresh=${force}`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          setMarketData(json.market_data);
        }
      }
    } catch (err) {
      console.error('Failed to load live market intelligence', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse flex items-center justify-between">
        <div className="h-6 w-48 bg-muted rounded"></div>
        <div className="h-6 w-24 bg-muted rounded"></div>
      </div>
    );
  }

  if (!marketData) return null;

  const regime = marketData.regime;
  const isHighPE = regime.status === 'HIGH_VALUATION';

  if (compact) {
    return (
      <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-foreground">
                Nifty 50 Live P/E: {marketData.nifty_50.pe_ratio}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                (NSE: ^NSEI)
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                isHighPE ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}>
                {regime.lumpsum_badge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-1">
              Live Source: National Stock Exchange (NSE India) • 1Y Momentum: +{marketData.nifty_50.change_pct_1y}%
            </p>
          </div>
        </div>

        {onOpenShellyChat && (
          <button
            onClick={() => onOpenShellyChat("Is it a good time for lump sum investment right now?")}
            className="text-xs text-primary hover:underline font-bold flex items-center space-x-1 ml-auto"
          >
            <span>Ask Shelly AI</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card to-card/90 border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all space-y-5">
      {/* Top Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-base font-extrabold text-foreground tracking-tight">
                Live Financial Market Feed & Source Attribution
              </h3>
              <span className="flex items-center space-x-1 text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE MARKET DATA • SYNCED TODAY</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time valuation metrics, official market sources, and dynamic Lump Sum vs. SIP recommendations
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border transition-colors flex items-center space-x-1.5 shadow-xs"
          title="Refresh Live Data Feeds"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync Live Feeds'}</span>
        </button>
      </div>

      {/* 4 Detailed Live Market Ticker Cards with Explicit Sources & Percentages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Nifty 50 */}
        <div className="bg-background/80 border border-border rounded-xl p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-foreground">Nifty 50 Index</span>
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">^NSEI</span>
          </div>
          
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-base font-extrabold font-mono text-foreground">₹{marketData.nifty_50.current_price.toLocaleString()}</span>
            <span className={`text-xs font-extrabold flex items-center ${marketData.nifty_50.change_pct_1y >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {marketData.nifty_50.change_pct_1y >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              +{marketData.nifty_50.change_pct_1y}% 1Y
            </span>
          </div>

          <div className="pt-1.5 border-t border-border/40 text-[10px] space-y-0.5 text-muted-foreground">
            <div>Valuation P/E: <strong className="text-foreground font-bold">{marketData.nifty_50.pe_ratio}</strong> (Fair: 18-22)</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              📡 Source: National Stock Exchange (NSE India)
            </div>
          </div>
        </div>

        {/* Sensex */}
        <div className="bg-background/80 border border-border rounded-xl p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-foreground">BSE Sensex</span>
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">^BSESN</span>
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-base font-extrabold font-mono text-foreground">₹{marketData.sensex.current_price.toLocaleString()}</span>
            <span className={`text-xs font-extrabold flex items-center ${marketData.sensex.change_pct_1y >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {marketData.sensex.change_pct_1y >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              +{marketData.sensex.change_pct_1y}% 1Y
            </span>
          </div>

          <div className="pt-1.5 border-t border-border/40 text-[10px] space-y-0.5 text-muted-foreground">
            <div>Market Status: <strong className="text-amber-600 dark:text-amber-400 font-bold">Elevated Regime</strong></div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              📡 Source: Bombay Stock Exchange (BSE)
            </div>
          </div>
        </div>

        {/* Gold */}
        <div className="bg-background/80 border border-border rounded-xl p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-foreground">Gold ETF (India)</span>
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">GOLDBEES</span>
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-base font-extrabold font-mono text-foreground">₹{marketData.gold.current_price}</span>
            <span className="text-xs font-extrabold text-amber-500 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +{marketData.gold.change_pct_1y}% 1Y
            </span>
          </div>

          <div className="pt-1.5 border-t border-border/40 text-[10px] space-y-0.5 text-muted-foreground">
            <div>Inflation Hedge: <strong className="text-amber-600 dark:text-amber-400 font-bold">Strong Hedge</strong></div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              📡 Source: Nippon India Gold ETF (NSE)
            </div>
          </div>
        </div>

        {/* India 10Y Bond */}
        <div className="bg-background/80 border border-border rounded-xl p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-foreground">India 10Y Govt Bond</span>
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">IN10Y</span>
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-base font-extrabold font-mono text-foreground">{marketData.india_10y_bond.yield_pct}% p.a.</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>

          <div className="pt-1.5 border-t border-border/40 text-[10px] space-y-0.5 text-muted-foreground">
            <div>Capital Safety: <strong className="text-blue-600 dark:text-blue-400 font-bold">100% Guaranteed</strong></div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              📡 Source: Reserve Bank of India (RBI) / CCIL
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Live Market Research Diversification Recommendation */}
      <div className="bg-surface/80 border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-extrabold text-foreground uppercase tracking-wider">
          <Info className="w-4 h-4 text-primary" />
          <span>Based on Today's Live Market Research & 1-Year Performance:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-background p-3 rounded-lg border border-border/60 space-y-1">
            <span className="text-[11px] font-extrabold text-primary block">1. Equity Index Funds</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Nifty 50 1-Year growth is <strong className="text-foreground">+{marketData.nifty_50.change_pct_1y}%</strong>. 
              Due to P/E ratio ({marketData.nifty_50.pe_ratio}), deploy capital via <strong className="text-foreground">monthly SIPs</strong> rather than lump sum.
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block pt-0.5">
              Source: NSE India (^NSEI)
            </span>
          </div>

          <div className="bg-background p-3 rounded-lg border border-border/60 space-y-1">
            <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 block">2. Short-Duration Bonds</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Offering guaranteed yield of <strong className="text-foreground">{marketData.india_10y_bond.yield_pct}% p.a.</strong> 
              Ideal defensive allocation for lump sum capital while equity P/E is high.
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block pt-0.5">
              Source: RBI G-Sec Benchmark
            </span>
          </div>

          <div className="bg-background p-3 rounded-lg border border-border/60 space-y-1">
            <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 block">3. Gold ETFs / SGBs</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Gold spot growth is <strong className="text-foreground">+{marketData.gold.change_pct_1y}%</strong> over the past year. 
              Provides essential inflation hedging and portfolio stability.
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block pt-0.5">
              Source: Gold BeES ETF (GOLDBEES)
            </span>
          </div>
        </div>
      </div>

      {/* Tactical Strategy Banner */}
      <div className={`rounded-xl p-4 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isHighPE
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg mt-0.5 ${isHighPE ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
            {isHighPE ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold">{regime.lumpsum_badge}</span>
              <span className="text-xs opacity-80">(Nifty 50 P/E: {regime.pe_level})</span>
            </div>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {regime.actionable_advice}
            </p>
          </div>
        </div>

        {onOpenShellyChat && (
          <button
            onClick={() => onOpenShellyChat("Shelly, explain why lump sum is bad when market P/E is high.")}
            className="whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Ask Shelly AI</span>
          </button>
        )}
      </div>
    </div>
  );
};
