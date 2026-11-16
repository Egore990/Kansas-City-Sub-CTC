# Hardware I/O mapping

This is a **software address map**, not a certified wiring schedule. Baseline: [overview](SYSTEM_OVERVIEW.md). The executable statements in `CTCLogic.vb:650–766,2842–3107` are authoritative for this snapshot. Simulator labels are secondary evidence and sometimes disagree. Unknown terminals, cable cores, driver polarity, voltage ratings and physical board addresses must be surveyed, not inferred.

Authoritative owner clarification (16 November 2026): some points have manual control, while others have software interlocking. Their overlap must be established, not assumed. The local turnout 25 switch and controlled-lock paths below are source-confirmed examples; this table is not an exhaustive inventory of physical manual controls. See the [point-by-point findings](CTC_INTERLOCKING.md#point-by-point-source-findings) for control, monitoring and restrictions. Record each manual switch, affected point, software permission/lock and feedback path during the wiring survey. EasyDCC is standalone with detector occupancy supplied to CTC; no DCC command integration is planned. Turntable control remains a manual layout-side switch. Later owner-installed day/night lighting is excluded from initial software restoration. No additional C/MRI assignments or automation are inferred.

## Conventions and nodes

All four nodes are configured as SMINI, 24 inputs and 48 outputs each: 96 input and 192 output bit positions total, many unused. Input card 2 ports A/B/C correspond to IB(1/2/3). Output card 0 A/B/C = OB(1/2/3); output card 1 A/B/C = OB(4/5/6). Bit ranges are low-to-high numbers, zero based. A pair `0–1` means bit 0 is the low-order bit of the packed value. These card names follow this application's terminology.

| UA | Initialization description | Oscillation |
|---|---|---|
| 0 | CTC panel turnout controller | None |
| 1 | CTC panel signal controller | None |
| 2 | Sheffield/Rock Creek | None |
| 3 | Freight Line Junction | 8 two-lead signal pairs; OB4/OB5 masks FF |

Source: `InitializeNodes`, `CTCLogic.vb:586–614`. UA+65 wire address bytes are 41/42/43/44 hexadecimal, not physical switch settings confirmed by inspection.

## Inputs

| UA | Card/port.bits | Variable / software meaning | Source line(s) |
|---|---|---|---|
| 0 | 2/A.0–1,2–3,4–5,6–7 | SWL1, SWL3, SWL7, SWL9 | 663–666 |
| 0 | 2/B.0–1,2–3,4–5,6–7 | SWL11, SWL15, CLL17, CLL19 | 668–671 |
| 0 | 2/C.0–1,2–3 | SWL23, SWL25 | 673–674 |
| 1 | 2/A.0–1,2–3,4–5,6–7 | SGL26, SGL24, SGL10, SGL8 | 686–689 |
| 1 | 2/B.0–1 | SGL4 | 691 |
| 1 | 2/B.2 | SGL12, right only | 692 |
| 1 | 2/B.3 | ANRESET, annunciator reset | 695 |
| 1 | 2/B.6,7 | CB2, CB4 | 699–700 |
| 1 | 2/C.0,1,2,3,4,5,6,7 | CB8,10,12,16,18,20,24,26 | 702–709 |
| 2 | 2/A.0,1,2,3,4,5 | TFB3,7,9,11,15,23 turnout contact inputs | 719–724 |
| 2 | 2/B entire byte | PWRIND; exactly 1 enables delayed detector update; 0 restarts return delay | 726–729 |
| 3 | 2/A.0,1,2,3,4,5,6,7 | BK1–BK8, occupancy | 738–745 |
| 3 | 2/B.0,1 | BK9, BK10 | 747–748 |
| 3 | 2/B.3 | SWI25, yardmaster's switch 25 open/permission input | 764 |
| 3 | 2/B.4 | SWICW, Coburg West acceptance | 765 |
| 3 | 2/C.0,1,2,3,4 | ANRBV, ANRCT, ANRCE, ANRCW, ANRBT departure requests | 757–761 |

SWL/CLL: 1=normal, 2=reverse; 0 is not accepted as a new request. Value 3 (both contacts) is not comprehensively rejected. SGL: 0=stop,1=right,2=left; SGL12 only has right/stop. BK: 0=clear,1=occupied. Code buttons and requests use 1=active. Input assignments not listed have no active decoding here, except the entire-byte power indicator caveat. Fleet inputs in `CTCLogic.vb:710–714` are commented out.

Node 0 only unpacks its three bytes when IB(1) is nonzero (`657–675`); that is a coarse validity heuristic, not frame validation. TFB inputs are read but are not used to prove point correspondence by `PSCTRL`. No TFB25 read exists. Do not equate a timer-expired panel indication with a measured point position.

## Panel outputs — UA 0

Source: `WriteNode0`, `CTCLogic.vb:2842–2922`. `K` suffixes indicate values after simulated indication code delay.

| Card/port.bits | Packed value / function |
|---|---|
| 0/A.0–1,2–3,4–5,6–7 | SWL1LTK,3LTK,7LTK,9LTK |
| 0/B.0–1,2–3,4–5,6–7 | CLL19LTK,CLL17LTK,SWL15LTK,SWL11LTK |
| 0/C.0–1,2–3,4 | SWL23LTK,SWL25LTK,TL10K |
| 1/A.0,1,2,3,4,5,6,7 | SWLI25,23,19,17,15,11,9,7 lock indications |
| 1/B.0 | SWLI3 lock indication |
| 1/B.1–2 | CDEIND (0 idle,1 indication,2 control) |
| 1/B.5–6 | CPULSE code-sound output; 1 indication,2 control |
| 1/C.0–1,2–3,4–5,6–7 | FK1,FK2,FK5,FK6 traffic direction indicators |

Switch/lock lamp pair values: 1=normal lamp,2=reverse lamp,0=dark. `LAMPTEST` replaces **all six** bytes with FF, including sound/control and unused bit positions, not just known LEDs. The comment about B4 as bell does not correspond to an active bell assignment.

## Panel outputs — UA 1

Source: `WriteNode1`, `CTCLogic.vb:2923–2989`.

| Card/port.bits | Packed value / function |
|---|---|
| 0/A.0,1,2,3,4,5,6,7 | TL5K,TL6K,TL3K,TL4K,TL1K,TL2K,TL7K,TL8K |
| 0/B.0,1,2 | TL5K,TL6K,TL9K (5/6 repeated) |
| 0/B.3,4,5,6,7 | ADBV,ADCT,ADCW,ADCE,ADBT dispatcher annunciators |
| 0/C.0–1,2–3 | FK5,FK6 traffic direction (duplicates) |
| 1/A.0–2,3–5 | SGL26LTK,SGL24LTK |
| 1/B.0–2,3–5,6–7 | SGL10LTK,SGL8LTK,SGL12LTK |
| 1/C.0–2 | SGL4LTK |
| 1/C.3 | Power-off lamp if PWRIND=0 |

Signal lamp group: 1=right,2=stop,4=left; 0=dark. SGL12 only needs right/stop in its two-bit field. `WriteNode1` also sets every byte to FF under lamp test. The misleading comment labeling the SGL24 insertion “Card 1 Port B” is superseded by its actual use of OB(4), card 1/A.

## Field outputs — UA 2

Source: `WriteNode2`, `CTCLogic.vb:2990–3044`.

| Card/port.bits | Packed value / function |
|---|---|
| 0/A.0–1,2–3,4–5,6–7 | SM1 (Centropolis gate),SM3,SM7,SM9 |
| 0/B.0–1,2–3 | SM11,SM15 |
| 0/B.4–5,6–7 | CLL17LTK,CLL19LTK (delayed lock indication/drive pair) |
| 0/C.0,1 | Electric lock 17/19: 0 if corresponding CLLxxLTK=1, else 1 |
| 0/C.2–3 | SIG8RC |
| 0/C.4–7 | SIG8RAB: B head bits 4–5, A head 6–7 |
| 1/A.0–1 | SIG12RA (old simulator label calls it 10 right D) |
| 1/A.2–7 | SIG10RABC: C=2–3,B=4–5,A=6–7 |
| 1/B.0–1 | SIG8LD |
| 1/B.2–7 | SIG8LABC: C=2–3,B=4–5,A=6–7 |
| 1/C.0–1,2–3 | SIG4RB,SIG4RA |
| 1/C.4–7 | SIG4LAB: B=4–5,A=6–7 |

Each normal motor pair has low bit normal, high bit reverse. Signal head fields use 00=dark,01=green,10=red,11=yellow under configured driver/oscillation assumptions. The 17/19 physical command is derived from delayed `CLLxxLTK`, not directly from `UL17/19`; it is high for a dark/transitional indication too. Wiring and actual lock behavior require particular verification.

## Field outputs — UA 3

Source: `WriteNode3`, `CTCLogic.vb:3045–3107`.

| Card/port.bits | Packed value / function |
|---|---|
| 0/A.0–1 | SM23 |
| 0/A.2–3 | SM25 |
| 0/A.4–5 | Duplicate SM23 for crossover motors |
| 0/A.6–7 | SM25 only while TUN; both bits 0 while reverse, allowing local toggle per comment |
| 0/B.0–1 | Both 0 with SM25 normal; both 1 otherwise (25 unlock LED/local switch power per comment/labels) |
| 0/B.2,3,4,5,6 | ANBV,ANCT,ANCW,ANCE,ANBT field annunciators |
| 0/C.0–3 | SIG10LAB: B=0–1,A=2–3 |
| 0/C.6,7 | TrainWaitingCoburgEast,TrainWaitingCoburgWest |
| 1/A.0–3 | SIG24RAB: B=0–1,A=2–3 |
| 1/A.4–7 | SIG26RAB: B=4–5,A=6–7 |
| 1/B.0–1 | SIG24LA |
| 1/B.2–5 | SIG26LAB: B=2–3,A=4–5 |
| 1/B.6–7 | SIG26LC when not yellow; both 0 when yellow |
| 1/C.0 | Set by `OB(6)=1` when SIG26LC=YEL; intended separate true-yellow output |

**Important discrepancies:**

- Simulator label UA3 card0/A bit4 says “25 Lock Open”; code writes SM23 there and bit5. Do not use that label as wiring truth.
- `WriteNode3` comments refer to a killed output transistor and substitution using card0/B (`3068–3069`); the affected original circuit and present repair state are unknown.
- UA3 OB(6) is **not initialized on the non-yellow path**. Since `WriteNode2` immediately preceded it and wrote OB(6), UA3 output byte 6 inherits that node's packed signal4 value when SIG26LC is not yellow. This is a static dataflow finding, not just a possible retained yellow bit. When yellow, the entire byte becomes 1. No other bits of UA3 card1/C can be assumed safely unused.
- Road traffic-light output packing in OB(6) is commented out (`3102–3104`). Simulator labels for six road lights do not establish active road-light control.
- The node3 oscillation mask marks all of OB(5), including SIG26LC. Confirm compatibility of the later BLMA/true-yellow wiring with that setup.

Unlisted positions are unassigned by explicit statements here; this is **not evidence that nothing is wired to them**. Photo records, continuity checks with power removed, board manuals and driver circuit tracing must resolve their real function.
