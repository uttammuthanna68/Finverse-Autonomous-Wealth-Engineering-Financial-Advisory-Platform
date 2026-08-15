import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { GlossaryTerm } from '../components/GlossaryTerm';
import { fetchWithAuth } from '../api/config';
import {
  AlertTriangle,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Sparkles,
} from 'lucide-react';

interface CardRewardRate {
  type: 'cashback' | 'points';
  rate: number;
  point_value_inr?: number;
}

interface CardPreset {
  card_name: string;
  bank: string;
  apr: number;
  credit_limit: number;
  reward_rates: Record<string, CardRewardRate>;
}

// Indian Credit Cards Market Database
const INDIAN_CREDIT_CARDS_DB: CardPreset[] = [
  {
    card_name: 'HDFC Infinia Metal Edition',
    bank: 'HDFC Bank',
    apr: 19.5,
    credit_limit: 500000,
    reward_rates: {
      dining: { type: 'points', rate: 16.6, point_value_inr: 1.0 },
      travel: { type: 'points', rate: 33.3, point_value_inr: 1.0 },
      groceries: { type: 'points', rate: 3.3, point_value_inr: 1.0 },
      general: { type: 'points', rate: 3.3, point_value_inr: 1.0 },
    },
  },
  {
    card_name: 'HDFC Regalia Gold',
    bank: 'HDFC Bank',
    apr: 18.0,
    credit_limit: 250000,
    reward_rates: {
      dining: { type: 'points', rate: 10.0, point_value_inr: 0.25 },
      travel: { type: 'points', rate: 12.0, point_value_inr: 0.25 },
      groceries: { type: 'cashback', rate: 1.0 },
      general: { type: 'points', rate: 4.0, point_value_inr: 0.25 },
    },
  },
  {
    card_name: 'ICICI Amazon Pay',
    bank: 'ICICI Bank',
    apr: 16.0,
    credit_limit: 150000,
    reward_rates: {
      dining: { type: 'cashback', rate: 2.0 },
      travel: { type: 'cashback', rate: 2.0 },
      groceries: { type: 'cashback', rate: 5.0 },
      general: { type: 'cashback', rate: 1.0 },
    },
  },
  {
    card_name: 'Axis Bank Cashback',
    bank: 'Axis Bank',
    apr: 19.5,
    credit_limit: 100000,
    reward_rates: {
      dining: { type: 'cashback', rate: 4.0 },
      groceries: { type: 'cashback', rate: 3.0 },
      general: { type: 'cashback', rate: 1.5 },
    },
  },
  {
    card_name: 'Axis Ace Credit Card',
    bank: 'Axis Bank',
    apr: 20.0,
    credit_limit: 120000,
    reward_rates: {
      dining: { type: 'cashback', rate: 4.0 },
      groceries: { type: 'cashback', rate: 2.0 },
      general: { type: 'cashback', rate: 2.0 },
    },
  },
  {
    card_name: 'SBI Cashback Credit Card',
    bank: 'State Bank of India',
    apr: 18.5,
    credit_limit: 150000,
    reward_rates: {
      dining: { type: 'cashback', rate: 5.0 },
      travel: { type: 'cashback', rate: 5.0 },
      groceries: { type: 'cashback', rate: 5.0 },
      general: { type: 'cashback', rate: 1.0 },
    },
  },
  {
    card_name: 'Amex Platinum Travel',
    bank: 'American Express',
    apr: 21.0,
    credit_limit: 300000,
    reward_rates: {
      dining: { type: 'points', rate: 6.0, point_value_inr: 0.5 },
      travel: { type: 'points', rate: 15.0, point_value_inr: 0.5 },
      general: { type: 'points', rate: 3.0, point_value_inr: 0.5 },
    },
  },
  {
    card_name: 'IDFC First Select',
    bank: 'IDFC First Bank',
    apr: 15.0,
    credit_limit: 200000,
    reward_rates: {
      dining: { type: 'points', rate: 6.0, point_value_inr: 0.25 },
      general: { type: 'points', rate: 3.0, point_value_inr: 0.25 },
    },
  },
];

interface CardItem {
  id: string;
  card_name: string;
  apr: number;
  credit_limit: number;
  balance: number;
  due_date: string;
  reward_rates: Record<string, CardRewardRate>;
}

export const RewardsPage: React.FC = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Purchase Optimizer Form State
  const [purchaseCategory, setPurchaseCategory] = useState<string>('Dining');
  const [purchaseAmount, setPurchaseAmount] = useState<number>(5000);
  const [optimizerResult, setOptimizerResult] = useState<any>(null);

  const filteredPresetCards = INDIAN_CREDIT_CARDS_DB.filter(
    (c) =>
      c.card_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bank.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCards = INDIAN_CREDIT_CARDS_DB.filter((c) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'travel') return !!c.reward_rates.travel;
    if (selectedCategory === 'shopping') return c.card_name.includes('Cashback') || c.card_name.includes('Amazon Pay');
    if (selectedCategory === 'dining') return !!c.reward_rates.dining;
    return true;
  });

  const runOptimizer = async () => {
    if (cards.length === 0) {
      setOptimizerResult(null);
      return;
    }
    try {
      const res = await fetchWithAuth('/api/engine/optimize-rewards', {
        method: 'POST',
        body: JSON.stringify({
          purchase_category: purchaseCategory,
          purchase_amount: purchaseAmount,
          cards,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOptimizerResult(data);
      }
    } catch (err) {
      console.error('Rewards optimizer request failed:', err);
    }
  };

  useEffect(() => {
    runOptimizer();
  }, [purchaseCategory, purchaseAmount, cards]);

  const handleAddPresetCard = (preset: CardPreset) => {
    const newCardItem: CardItem = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      card_name: preset.card_name,
      apr: preset.apr,
      credit_limit: preset.credit_limit,
      balance: 0,
      due_date: '15th of month',
      reward_rates: preset.reward_rates,
    };
    setCards((prev) => [...prev, newCardItem]);
    setSearchQuery('');
  };

  const handleRemoveCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const recommendedCard = optimizerResult?.recommended_card;
  const allOptions = optimizerResult?.all_options || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="border-b border-black/5 pb-4">
        <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
          Indian Market Database & Optimization
        </span>
        <h1 className="text-3xl font-black text-main tracking-tight">Credit Card Rewards</h1>
        <p className="text-xs text-muted mt-1">
          Search top Indian credit cards, manage your wallet, and optimize reward returns with Phase 3 <GlossaryTerm term="toxic debt">toxic debt</GlossaryTerm> exclusion rules.
        </p>
      </div>

      {/* Wallet Management Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-main">Do you have any Credit Cards?</h2>
            <p className="text-xs text-muted">Search from top Indian credit cards to add to your personal wallet.</p>
          </div>
        </div>

        {/* Search Preset Cards Input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Indian cards (e.g. HDFC Infinia, ICICI Amazon Pay, Axis Cashback)..."
            className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-main focus:outline-none focus:border-primary"
          />

          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-card-bg border border-black/10 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-2 space-y-1">
              {filteredPresetCards.length > 0 ? (
                filteredPresetCards.map((preset) => (
                  <button
                    key={preset.card_name}
                    onClick={() => handleAddPresetCard(preset)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-surface flex items-center justify-between transition-colors text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-main block">{preset.card_name}</span>
                      <span className="text-[10px] text-muted">{preset.bank} • APR: {preset.apr}%</span>
                    </div>
                    <span className="text-primary font-bold text-xs flex items-center space-x-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-xs text-muted text-center">No matching cards found in database.</div>
              )}
            </div>
          )}
        </div>

        {/* Active Cards Grid or Educational Card Matcher */}
        {cards.length === 0 ? (
          <div className="space-y-6">
            {/* Educational Encouragement Card */}
            <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-black/5 pb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-main">Why Responsible Credit Card Usage Boosts Your Financial Health</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
                  <span className="text-primary font-black text-sm block">💡 1. Build 750+ CIBIL Score</span>
                  <p className="text-muted text-[11px] leading-relaxed">
                    Paying credit card statements on time builds a strong credit history, unlocking lower interest rates on future home & car loans in India.
                  </p>
                </div>

                <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
                  <span className="text-primary font-black text-sm block">🎁 2. Earn 2% - 5% Cashbacks</span>
                  <p className="text-muted text-[11px] leading-relaxed">
                    Convert everyday spending on groceries, utility bills, and food delivery into instant statement cashback or free air tickets.
                  </p>
                </div>

                <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
                  <span className="text-primary font-black text-sm block">🛡️ 3. 50-Day Interest-Free Buffer</span>
                  <p className="text-muted text-[11px] leading-relaxed">
                    Enjoy up to 50 days of interest-free bank liquidity while keeping your salary earning interest in savings accounts.
                  </p>
                </div>
              </div>
            </Card>

            {/* Interactive Preference Card Matcher */}
            <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/5 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-main">Top Recommended Indian Credit Cards</h3>
                  <p className="text-xs text-muted">Select your primary spending category to discover matching card rewards.</p>
                </div>
              </div>

              {/* Preference Filter Pills */}
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface text-main border border-black/10 hover:bg-black/5'
                  }`}
                >
                  🌟 All Top Cards
                </button>
                <button
                  onClick={() => setSelectedCategory('travel')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    selectedCategory === 'travel'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface text-main border border-black/10 hover:bg-black/5'
                  }`}
                >
                  ✈️ Travel & Flights
                </button>
                <button
                  onClick={() => setSelectedCategory('shopping')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    selectedCategory === 'shopping'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface text-main border border-black/10 hover:bg-black/5'
                  }`}
                >
                  🛒 Online Cashback
                </button>
                <button
                  onClick={() => setSelectedCategory('dining')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    selectedCategory === 'dining'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface text-main border border-black/10 hover:bg-black/5'
                  }`}
                >
                  🍔 Dining & Food Delivery
                </button>
              </div>

              {/* Recommended Cards Display Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedCards.map((preset) => (
                  <div key={preset.card_name} className="bg-surface p-4 rounded-2xl border border-black/10 space-y-3 text-xs flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-main text-sm block">{preset.card_name}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                          {preset.bank}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted font-medium">
                        Standard APR: <span className="font-mono text-main font-bold">{preset.apr}%</span> • Limit: <span className="font-mono text-main font-bold">₹{preset.credit_limit.toLocaleString('en-IN')}</span>
                      </p>
                    </div>

                    <div className="bg-card-bg p-2.5 rounded-xl border border-black/5 text-[11px] space-y-1">
                      <span className="text-[9px] font-bold text-muted uppercase block">Top Perk</span>
                      <span className="font-extrabold text-primary block">
                        {preset.reward_rates.travel ? `${preset.reward_rates.travel.rate}% Travel Value` : `${preset.reward_rates.dining?.rate || preset.reward_rates.groceries?.rate || 5}% Reward Rate`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddPresetCard(preset)}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to My Wallet</span>
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((c) => (
              <div key={c.id} className="bg-surface p-4 rounded-2xl border border-black/10 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-main text-sm block">{c.card_name}</span>
                    <span className="text-[10px] uppercase font-bold text-muted">Active Wallet Card</span>
                  </div>
                  <button
                    onClick={() => handleRemoveCard(c.id)}
                    className="text-muted hover:text-warning p-1 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-card-bg p-2.5 rounded-xl border border-black/5">
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Limit</span>
                    <span className="font-bold text-main">₹{c.credit_limit.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Balance</span>
                    <span className="font-bold text-main">₹{c.balance.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">APR</span>
                    <span className="font-bold text-main">{c.apr}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optimizer Tool */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          <Card className="lg:col-span-5 p-6 space-y-5 bg-card-bg shadow-card rounded-card border border-black/5">
            <h2 className="text-lg font-extrabold text-main flex items-center space-x-2 border-b border-black/5 pb-3">
              <Award className="w-5 h-5 text-primary" />
              <span>Purchase Reward Optimizer</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-main block mb-1">Spend Category</label>
                <select
                  value={purchaseCategory}
                  onChange={(e) => setPurchaseCategory(e.target.value)}
                  className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary"
                >
                  <option value="Dining">Dining & Food Delivery</option>
                  <option value="Travel">Travel & Flight Bookings</option>
                  <option value="Groceries">Groceries & Supermarkets</option>
                  <option value="General">General Shopping</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-main mb-1">
                  <span>Purchase Amount</span>
                  <span className="font-mono text-primary font-extrabold">₹{purchaseAmount.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            {recommendedCard && (
              <div className="bg-primary/10 border border-primary/30 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-extrabold text-primary uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Optimal Card Selection</span>
                </div>
                <div className="text-base font-black text-main">{recommendedCard.card_name}</div>
                <div className="text-xs font-semibold text-main">
                  Return Value:{' '}
                  <span className="font-extrabold text-primary font-mono text-sm">
                    ₹{recommendedCard.computed_value_inr}
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card className="lg:col-span-7 p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
            <h3 className="text-base font-extrabold text-main border-b border-black/5 pb-2">
              Calculated Value Comparison (All Wallet Cards)
            </h3>

            <div className="space-y-3">
              {allOptions.map((opt: any) => {
                const isWinner = recommendedCard && recommendedCard.card_id === opt.card_id;
                const isToxic = opt.is_toxic;

                return (
                  <div
                    key={opt.card_id}
                    className={`p-3.5 rounded-xl border ${
                      isToxic
                        ? 'border-warning/40 bg-warning/5'
                        : isWinner
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-black/5 bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-main">{opt.card_name}</span>
                      {isToxic ? (
                        <span className="text-[10px] text-warning bg-warning/20 px-2 py-0.5 rounded-full uppercase">
                          UNAVAILABLE FOR REWARDS
                        </span>
                      ) : (
                        <span className="font-mono text-primary text-sm font-extrabold">
                          ₹{opt.computed_value_inr}
                        </span>
                      )}
                    </div>

                    {isToxic ? (
                      <div className="pt-2 text-[11px] text-warning font-medium flex items-start space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{opt.exclusion_reason}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted font-mono pt-1">
                        {opt.reward_details.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
