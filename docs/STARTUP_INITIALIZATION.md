# Startup initialization and turnout position tracking

Supplement to the Phase 1 audit, 16 November 2026. Baseline: commit `0a561b3f8de459a787795a16da4c987868d4ae79`; see [overview](SYSTEM_OVERVIEW.md). Static investigation only. No application execution, hardware communication or initialization/interlocking changes.

**Backup update:** the owner reports2018 source and compiled application candidates that Codex has not yet received. The command names, defaults, feedback use and timing conclusions here apply to the inspected2016 GitHub baseline, not automatically to those backups or the last operational installation. The [future comparison](HISTORICAL_BACKUPS.md) must explicitly check startup routines and any changed Start Layout action. The [Phase 2 proposal](PHASE_2_BUILD_SIMULATION_PLAN.md) requires characterization before any approved behavior change.

## Identifying “Start Layout”

The owner reports that operators used **Start Layout** to establish starting turnout and signal states, and believes Tortoise motors did not provide real-time position feedback. The operating recollection is recorded; the physical feedback arrangement remains unverified.

No literal Start Layout menu text, handler or routine was found in this snapshot. A case-insensitive current-text search and Git content-change search across reachable VB, ResX and text history found no Start Layout/StartLayout command. This does not exclude another release, external launcher, uncommitted changes or a different operator name. No historical binary was executed or decompiled.

The source-confirmed startup action is **File → Run with CMRI…** (`MainPanel.Designer.vb:241,258–262`), handled by `RunWithCMRIToolStripMenuItem_Click` (`MainPanel.vb:47–55`). It matches the reported purpose, but its historical identity with Start Layout is **not established**. A manual, photograph or last-installed release is needed to reconcile the name. The simulator Run action shares initialization but uses TestCMRI (`MainPanel.vb:39–45`).

## Exact available startup sequence

1. Create `New CMRI()` (`MainPanel.vb:48`).
2. Call `InitializeRailroad` (`49`; implementation `CTCLogic.vb:577–585`), which calls, in order:
   - `InitializeConstants` (`276–461`): encodings, timing, failure flags, fast clock, empty train/loco IDs and OS metadata.
   - `InitializeControls` (`479–576`): requested/default motor, signal, lamp, lock and traffic states.
   - `InitializeTrafficLights` (`616–641`): historical road traffic-light state, whose output packing is commented out. This is unrelated to later owner-installed day/night lighting.
   - `InitializeNodes` (`586–614`): assign the module transport, open COM4 at 9600 8N1 and send SMINI I packets to UA0–3, each configured for three input/six output bytes; UA3 has eight oscillating pairs with CT4/CT5=FF.
3. Enable Pause and disable Resume (`MainPanel.vb:50–51`).
4. Execute `DoOneControlCycle` immediately (`52`): inputs, dispatcher controls, traffic sticks, point control, locks, routes, time locks, indications, timers and all four node writes (`CTCLogic.vb:210–274,2591–2596`). SignalTest visibility can skip normal protection calculations as described below.
5. Set the timer interval to100 ms and enable it (`MainPanel.vb:53–54`); each tick runs another cycle (`63–68`).

`InitializeControls` only changes variables. Node initialization sends I configuration packets, **not a verified point-homing sequence**. Actual motor/signal T outputs are packed at the end of the first cycle, after input reads and calculations. Startup is not an atomic all-red/points-normal transaction, and physical completion is not acknowledged.

On a fresh process, absent a completed code request, signals remain stop and motor commands normal through that first output write. Physical panel levers are read but are not automatically adopted as requests without code-button processing. An already pressed code button can start processing in that first scan, and subsequent scans can alter defaults.

## Turnout and lock defaults

Normal means the software/wiring convention; it does not prove a straight physical route. All listed powered objects start with `SWLxxR=LNOR`, `SMxx=TUN`, and both immediate/delayed indications `SWLxxLT/SWLxxLTK=NORLT`. TUN=1 and TUR=2 are paired output encodings, not measured positions.

| Object | Default | Field output |
|---|---|---|
| 1 — Centropolis gate | Normal | UA2 card0/A bits0–1; identified as a gate, not necessarily a turnout |
| Point3 | Normal | UA2 card0/A bits2–3 |
| Point7 | Normal | UA2 card0/A bits4–5 |
| Point9 | Normal | UA2 card0/A bits6–7 |
| Point11 | Normal | UA2 card0/B bits0–1 |
| Point15 | Normal | UA2 card0/B bits2–3 |
| Point23 | Normal | UA3 card0/A bits0–1 plus duplicate4–5 for crossover motors |
| Point25 interface | Normal | UA3 card0/A bits2–3 and6–7; card0/B bits0–1 initially zero; exact25/25B circuit unverified |
| Controlled locks17/19 | Requested normal, normal immediate/delayed indications; UL17/19=LOCKED | Delayed CLL indication drives UA2 card0/B bits4–7 and card0/C bits0–1; these are lock outputs, not SM17/SM19 position commands |

Sources: `CTCLogic.vb:481–533`; packers `2990–3017,3045–3066`. The [full I/O map](HARDWARE_IO_MAPPING.md) explains lock-drive and local-switch details.

## Signal defaults

| Variables | Initialized aspect |
|---|---|
| SIG4RA, SIG4RB | Red each |
| SIG4LAB | Red/red |
| SIG8RAB | Red/red |
| SIG8RC, SIG8LD | Red each |
| SIG8LABC | Red/red/red |
| SIG10LAB | Red/red |
| SIG10RABC | Red/red/red |
| SIG12RA | Red |
| SIG24LA | Red |
| SIG24RAB | Red/red |
| SIG26LAB, SIG26RAB | Red/red each |
| SIG26LC | Red |

All signal lever requests4/8/10/12/24/26 start LSTOP and their immediate/delayed panel indicators STOPLT (`CTCLogic.vb:493–501,521–523`); aspect assignments are at `554–568`. These are software defaults with no lamp-current/color verification. The existing UA3 OB6 contamination finding also affects startup output; see the I/O map.

Other resets include FS1–FS10=NDT, annunciators/waiting indicators off and CWSTATUS=TrainClear (`539,569–574`); train/loco IDs empty and fast clock07:00 (`446–455`). This action does not initialize a complete yard ladder, manual turntable or standalone EasyDCC. Day/night lighting remains excluded from initial software restoration.

## Position model and Tortoise auxiliary contacts

`PSCTRL` has no physical point-feedback parameter (`CTCLogic.vb:1249`). Its correspondence test compares requested lever SWLR, indication SWLLT and motor command SM (`1292–1297`). On completion it sets the indication directly from SM (`1303–1305`). Signal route checks use the resulting software indications, not the TFB inputs.

Nevertheless, `ReadRailroad` polls UA2 and decodes six position-labelled inputs:

| Input card2/A bit | Variable | Subsequent use found |
|---|---|---|
| 0 | TFB3 | None |
| 1 | TFB7 | None |
| 2 | TFB9 | None |
| 3 | TFB11 | None |
| 4 | TFB15 | None |
| 5 | TFB23 | None |
| No decoded input | TFB25 | Declaration only |

Source: `CTCLogic.vb:167,719–724`. Searching all current VB files found no other uses of these named variables. Simulator labels also call these turnout positions (`CMRISimulator.vb:219–225`). **The source does not prove these inputs were physically connected to Tortoise auxiliary contacts**, another contact mechanism, or anything at all. Even if connected, they are not used to establish powered-point correspondence or signal clearance here.

Thus **absence of effective physical-position verification is confirmed in this code; absence of installed feedback wiring is not confirmed**. The generic `CNTLELOCK` feedback parameter is not a hidden connection: both configured callers pass zero (`1639,1644`). One bit per named point also must not be assumed to prove both endpoints or both crossover motors.

SWI25 and SWICW are separate local permission/status inputs used for turnout25-related route permission and Coburg West acceptance (`764–765,948–950,1552–1554`). Neither is established as physical endpoint proof. All actual powered-point callers select MOTOR and pass zero hand/padlock arguments; generic HAND logic is not configured for them. Physical manual-control overlap remains point-specific and uncertain; see [point-by-point findings](CTC_INTERLOCKING.md#point-by-point-source-findings).

## Movement delay and the fresh-start exception

For an ordinary change, `PSCTRL` checks its occupancy guard, blanks the indication, changes SM and starts TD(DI)=SMDL (`CTCLogic.vb:1310–1318`). It waits while TD>0, then restores indication from the command after expiry (`1288–1305`). Route calculations reject relevant dark/in-transit point indications (`1322–1559`). Effective SMDL is **10 seconds**, overriding the earlier12-second assignment (`385–396`). This is a time assumption, not a measurement; counters do not catch up all missed seconds (`2532–2590`).

**A fresh startup does not initiate that motor delay.** Requested state, motor command and indications already agree at normal, with fresh global motor timers zero. `PSCTRL` therefore takes its in-correspondence path. There is no separate all-points-settled timer or measured startup proving phase. A physically reversed motor can start moving only when normal output is first written, although software already reports normal. The active2-second control-code delay is not a startup motor-settling gate.

An occupied block can inhibit a later change inside PSCTRL; it does not undo the already initialized normal SM value. Therefore startup can write normal motor commands despite occupancy. This behavior must be distinguished from the normal occupancy-guarded change path.

## Initialization failures, communication loss and operation gating

| Question | Finding |
|---|---|
| Does launch automatically initialize CTC? | MainPanel_Load is empty (`MainPanel.vb:108–110`); the timer is not initially enabled in the designer. Intended operation starts through Run |
| Is successful initialization mandatory in code? | No initialized/ready flag, per-node success gate or all-points-proven gate was found |
| Can Resume bypass Run? | Resume unconditionally enables the timer (`73–77`); designer does not initially disable Resume (`MainPanel.Designer.vb:271–275`). Static inference: using it before Run can reach an uninitialized transport; not runtime-tested |
| Are initialization returns checked? | InitializePort result is assigned but ignored (`CTCLogic.vb:596`); all INIT return values are discarded (`599–613`). An output write is not an acknowledgement |
| What if a poll fails? | ReadRailroad ignores INPUTS errors and unpacks shared IB. Stale/partial/other-node bytes may be consumed. No restrictive failure state or automatic recovery policy |
| What if a serial operation throws? | No local catch/recovery around startup/loop. Startup may stop after partial software/node initialization; successful completion cannot be assumed |
| Does power-return timing prove points? | No. TD19 gates detector updates, not all route clearance or motor completion. Initially unread BK values are zero/clear |
| Is another Run a complete reset? | No comprehensive clearing of TLVs, scheduling/button latches and all global timers. InitializeConstants declares a local TD shadow; only selected global timers are explicitly set. Repeated Run is not established equivalent to a fresh process |
| Can maintenance affect startup? | If SignalTest is visible, the first cycle skips normal locks/routes/time-lock/indication processing while continuing input/point/output work (`CTCLogic.vb:232–260`); Run does not close the form |

See [communications](CMRI_COMMUNICATIONS.md) for detailed error paths. Pause and Exit send no restrictive output transaction. The normal UI workflow calls initialization before running, but it does not enforce **verified successful** initialization as a prerequisite for operation.

## Commanded/physical discrepancies and evidence still needed

- A point left reverse can be displayed normal immediately at startup, before movement finishes.
- A stalled motor, failed driver, missing supply or obstruction can leave it wrong even after an ordinary timer expires; the indication is still derived from the command.
- A crossover motor can disagree with its paired motor without independent usable proof.
- A physical manual action may change alignment without updating the software model; affected circuits must be traced, not presumed.
- A lost command can leave hardware unchanged while software state advances; stale inputs can also affect route decisions.
- Software defaults do not prove that red lamps illuminate, locks physically engage or points are safe to move on occupied track.

These are static implications, not observed railway failures. Recover the actual Start Layout interface/release, startup instructions and contact/driver wiring. Establish whether operators waited or visually checked points before coding routes, whether contact inputs were installed, and which local actions software can see. Future approved simulator validation should separately examine fresh startup, repeated Run and ordinary point changes. No logic modifications are made or authorized by this supplement.
