

# Stack Draw Simulation Engine Enhancement Plan

## Overview

This plan enhances the existing simulation engine to implement the mathematical formulas and advanced analytics specified in your game mathematics document. The current implementation provides a solid foundation, but needs updates to properly calculate **Pot Structure**, **House Edge**, **Volatility Index**, **HT Expected Value**, and **Exploit Detection**.

---

## Current State Analysis

The simulation engine already has:
- Core game loop with HT decision engine (15+ Hold Types)
- Tube-based payout system with refill mechanics
- Basic statistics tracking (wins, losses, busts, tube hits)
- Resolution engine for hand comparison

**Gaps to Address:**
1. Pot formula doesn't include dealer ante contribution in tracking
2. House Edge formula needs correction (currently simplified)
3. No Volatility Index calculation
4. No per-HT Expected Value calculation
5. No Exploit Detection system
6. Round-by-round delta tracking missing

---

## Implementation Plan

### Phase 1: Update Types and Configuration

**File: `src/simulation/types.ts`**

Add new interfaces for advanced metrics:

```text
┌─────────────────────────────────────────────────────────┐
│  NEW TYPES                                              │
├─────────────────────────────────────────────────────────┤
│  RoundDelta: Tracks per-round net outcomes              │
│  VolatilityMetrics: Standard deviation tracking         │
│  ExploitAlert: Flags for HT strategies > 2% EV          │
│  AdvancedHTMetrics: Win/Loss/Bust probabilities + EV    │
└─────────────────────────────────────────────────────────┘
```

New fields in `SimulationStats`:
- `roundDeltas: number[]` - Net outcome per round for volatility
- `volatilityIndex: number` - σ(Δround)
- `exploitAlerts: ExploitAlert[]` - HTs exceeding EV threshold
- `dealerAnteContribution: number` - Track dealer's pot input

---

### Phase 2: Implement Mathematical Formulas

**File: `src/simulation/mathEngine.ts` (NEW)**

Create dedicated module for economic calculations:

```text
FORMULA IMPLEMENTATIONS:

1. POT STRUCTURE
   potRound = A × (P + 1)
   
2. HOUSE EDGE
   HouseEdge = (TotalAnte - TotalPayout) / TotalAnte
   Where: TotalPayout = PlayPotPayout + TubePayout - BustPenalties
   Target: 3% ≤ HouseEdge ≤ 7%

3. VOLATILITY INDEX
   Volatility = σ(Δround)
   - Standard deviation of net round outcomes
   - Track each round's delta
   - Calculate running σ

4. HOLD TYPE EV
   EV_HT = (Pwin × AvgWin) - (Ploss × AvgLoss) - (Pbust × BustPenalty)
   - Track per-HT: wins, losses, busts, amounts

5. EXPLOIT FLAG
   Trigger when: EV_HT > 0.02 × Ante
```

Key functions:
- `calculatePotPerRound(config: SimulationConfig): number`
- `calculateHouseEdge(stats: SimulationStats): number`
- `calculateVolatility(roundDeltas: number[]): number`
- `calculateHTExpectedValue(htPerf: HTPerformance, ante: number): number`
- `detectExploits(htPerformance: Record<string, HTPerformance>, ante: number): ExploitAlert[]`

---

### Phase 3: Enhanced Statistics Engine

**File: `src/simulation/statsEngine.ts`**

Update to properly track:

1. **Dealer Ante Tracking**
   - Add dealer's ante contribution to `totalHouseInputs`
   - Use formula: `potRound = A × (P + 1)`

2. **Round Delta Collection**
   - After each round, calculate: `Δ = playerNet - playerAnte`
   - Store in array for volatility calculation

3. **Correct House Edge Calculation**
   ```
   houseEdge = (totalAnte - totalPayout) / totalAnte
   ```
   Where:
   - `totalAnte` = All antes collected (players + dealer)
   - `totalPayout` = playPotPayouts + tubePayouts - bustPenalties

4. **HT Performance Enhancement**
   Add to `HTPerformance`:
   - `avgWinAmount: number`
   - `avgLossAmount: number`
   - `bustPenaltyTotal: number`
   - `calculatedEV: number`

---

### Phase 4: Simulation Runner Updates

**File: `src/simulation/simulationRunner.ts`**

Modify `executeRound` to:
1. Track round delta (net change)
2. Include dealer ante in pot calculation
3. Call math functions after each round

Add post-simulation analysis:
```
afterSimulation:
  - Calculate final volatility
  - Compute all HT EVs
  - Run exploit detection
  - Generate risk assessment
```

---

### Phase 5: Enhanced Reporting

**File: `src/simulation/statsEngine.ts`**

New report sections:

```text
┌─────────────────────────────────────────────────────────┐
│  ECONOMIC ANALYSIS                                      │
├─────────────────────────────────────────────────────────┤
│  House Edge:        5.42%                               │
│  Target Range:      3% - 7%    ✓ IN RANGE               │
│  Volatility Index:  12.34                               │
│  Risk Level:        MODERATE                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  EXPLOIT DETECTION                                      │
├─────────────────────────────────────────────────────────┤
│  HT_H4F:  EV = +2.3% (⚠ ABOVE THRESHOLD)               │
│  HT_H2P:  EV = +1.1% (OK)                              │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  HT PERFORMANCE MATRIX                                  │
├─────────────────────────────────────────────────────────┤
│  HT_ID   │ Uses   │ Win%  │ Loss% │ Bust% │ EV       │
│  H2.1P   │ 45,231 │ 48.2% │ 51.1% │ 0.7%  │ -0.34%   │
│  H4.4FL  │ 3,892  │ 52.1% │ 42.3% │ 5.6%  │ +1.23%   │
│  ...     │        │       │       │       │          │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 6: UI Dashboard Updates

**File: `src/components/SimulationPanel.tsx`**

Add new display cards:

1. **Economic Health Card**
   - House Edge with target indicator (green if 3-7%)
   - Volatility gauge
   - Risk classification badge

2. **Exploit Alerts Card**
   - List any HTs flagging above 2% EV
   - Severity indicators
   - Recommendation text

3. **HT EV Matrix**
   - Sortable table showing all HT performance
   - Color-coded EV (red if exploitable)

---

## Technical Details

### New Type Definitions

```typescript
interface RoundDelta {
  roundNumber: number;
  totalAnte: number;      // A × (P + 1)
  totalPayout: number;    // playPot + tube - bust
  netDelta: number;       // ante - payout (house perspective)
  playerNetDelta: number; // payout - ante (player perspective)
}

interface VolatilityMetrics {
  roundDeltas: number[];
  mean: number;
  variance: number;
  standardDeviation: number;  // This is the Volatility Index
  riskLevel: 'low' | 'moderate' | 'high';
}

interface ExploitAlert {
  htId: string;
  calculatedEV: number;
  threshold: number;
  exceededBy: number;
  severity: 'warning' | 'critical';
  recommendation: string;
}

interface AdvancedHTMetrics extends HTPerformance {
  avgWinAmount: number;
  avgLossAmount: number;
  avgBustPenalty: number;
  winProbability: number;    // P_win
  lossProbability: number;   // P_loss
  bustProbability: number;   // P_bust
  calculatedEV: number;      // Full EV formula result
  isExploitable: boolean;
}
```

### Formula Implementation Examples

```typescript
// Volatility Index (σ of round deltas)
function calculateVolatility(deltas: number[]): number {
  const n = deltas.length;
  if (n === 0) return 0;
  
  const mean = deltas.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = deltas.map(d => Math.pow(d - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  
  return Math.sqrt(variance);
}

// HT Expected Value
function calculateHTEV(ht: HTPerformance, ante: number): number {
  const total = ht.timesUsed;
  if (total === 0) return 0;
  
  const pWin = ht.wins / total;
  const pLoss = ht.losses / total;
  const pBust = ht.busts / total;
  
  const avgWin = ht.wins > 0 ? ht.totalWon / ht.wins : 0;
  const avgLoss = ante; // Standard loss is ante
  const bustPenalty = ante; // Bust loses ante
  
  return (pWin * avgWin) - (pLoss * avgLoss) - (pBust * bustPenalty);
}

// Exploit Detection
function detectExploits(
  htPerformance: Record<string, HTPerformance>, 
  ante: number
): ExploitAlert[] {
  const threshold = 0.02 * ante;
  const alerts: ExploitAlert[] = [];
  
  for (const [htId, perf] of Object.entries(htPerformance)) {
    const ev = calculateHTEV(perf, ante);
    if (ev > threshold) {
      alerts.push({
        htId,
        calculatedEV: ev,
        threshold,
        exceededBy: ev - threshold,
        severity: ev > threshold * 2 ? 'critical' : 'warning',
        recommendation: `Consider adjusting ${htId} hold logic or bust exposure`
      });
    }
  }
  
  return alerts;
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/simulation/types.ts` | MODIFY | Add new interfaces for volatility, exploits, advanced metrics |
| `src/simulation/mathEngine.ts` | CREATE | New module with all formula implementations |
| `src/simulation/statsEngine.ts` | MODIFY | Update tracking to use correct formulas |
| `src/simulation/simulationRunner.ts` | MODIFY | Integrate delta tracking and post-analysis |
| `src/components/SimulationPanel.tsx` | MODIFY | Add economic health and exploit UI sections |

---

## Expected Outcomes

After implementation:

1. **Accurate House Edge** - Properly calculated using the formula with all components
2. **Volatility Tracking** - Real-time σ calculation across all rounds
3. **EV per HT** - Each Hold Type will have a calculated Expected Value
4. **Exploit Alerts** - Automatic flagging when any HT exceeds 2% EV threshold
5. **Risk Assessment** - Clear indicators of economic health of the game

The simulation will provide data suitable for:
- Balancing tube initial values
- Adjusting HT priority rules
- Targeting specific house edge percentages
- Identifying exploitable strategies before deployment

