# Block logic in step-by-step English

Written 17 November 2026 from GitHub baseline `0a561b3f8de459a787795a16da4c987868d4ae79`. Static source explanation only: no software/hardware operation, code change or verified running result. The [backup comparison](BACKUP_COMPARISON.md) confirms unchanged traffic-stick/train-ID/block algorithms and bit assignments; recovered source skips decoding a node after a reported failed read, retaining previous decoded states. References and baseline error-path explanations below remain version-specific. Read with [signal rules](SIGNAL_LOGIC_PLAIN_ENGLISH.md), [point rules](POINT_LOGIC_PLAIN_ENGLISH.md) and [I/O mapping](HARDWARE_IO_MAPPING.md).

This guide covers all ten detected blocks, the four active undetected boundary records 11–14, and unused/legacy slot 15. It explains occupancy, direction assignment/release, train-ID transfer and block presentation. It is not proof of physical detector boundaries, track authority or safe running.

## Five different things that must not be confused

1. **Detected occupancy** (`BK`) is the bit read for a track section: 0 clear, 1 occupied. The electrical detector type/polarity and exactly which rails it covers still need verification.
2. **Remembered direction** (`FS`, called a traffic stick in the code) is east, west or no direction. It is an internal reservation/movement memory, not proof that a train is present. The first matching assignment can set it while the detector is clear.
3. **Signal route memory** (`TLV`) holds left, right or nothing. It can remain after a signal is coded to stop while running time expires. In this source left and east share value 2; right and west share value 1. A rule saying “empty” is stricter than “not held left”: the latter also permits right.
4. **Train identity** is manually entered text copied between records using occupancy and direction. It is not DCC identification or an instruction to move a real train.
5. **Displayed block state** (`Block`) can be clear/white, occupied/red or routed/green. Routed is a screen state; it is not another detector value. Physical panel occupancy lamps use separately delayed values (`TL...K`).

**Delayed point indication** below means the panel-return value ending `K`. Unless explicitly marked immediate, all point settings in the direction-assignment and train-ID rules use those delayed values. Several release rules mix immediate and delayed values, so they are identified individually. None is measured point proof.

“Signal is away from stop” means its calculated aspect differs from its all-red value. The source uses that comparison, not verification that a real lamp shows green. “Hold” and “release” describe software memories, not guaranteed hardware locking. Directions are those encoded by the source; do not derive extra geography from a label.

## Common occupancy read and display procedure

Sources: `CTCLogic.ReadRailroad:650–767`, `Indications:1789–2109`, `OfficeIndications:2110–2233`; `MainPanel.UpdateBlocksFromRead:648–675` and block drawing routines 1357–1712.

1. Read the power-status byte from node 2. If it is zero, restart the 2-second return delay.
2. Poll node 3 for occupancy. Only unpack its detector bits when the **whole power-status byte equals 1** and the return timer has expired. Other values do not satisfy this exact test.
3. Otherwise retain the previous occupancies. This does not force all blocks occupied or mark them unknown. Fresh unread Integer values start zero/clear.
4. Use the accepted BK values in point/signal, direction and train-tracking calculations. Input errors are not reliably made restrictive because callers ignore the transport's error return and reuse a shared input buffer.
5. Copy detector values into the immediate panel occupancy variables, then schedule station indication codes. After the indication delay, copy the stored station snapshot into the delayed panel lamp values. A displayed snapshot can lag the latest detector state.
6. For the screen, normally copy BK values into display block states, then promote clear sections to routed where the per-block drawing conditions allow it. During an indication code these refresh routines can return early and retain old display values.
7. Recalculate directions, releases, identifiers and drawings in their defined scan order. These are not simultaneous equations. Maintenance SignalTest visibility skips several normal updates.

| Block | Node 3 input card 2 bit | Delayed occupancy indication returned with |
|---|---|---|
| 1 | A0 | CB8 station |
| 2 | A1 | CB10 station |
| 3 | A2 | CB24 station |
| 4 | A3 | CB26 station |
| 5 | A4 | CB24 station |
| 6 | A5 | CB26 station |
| 7 | A6 | CB8 station |
| 8 | A7 | CB10 station |
| 9 | B0 | CB4 station |
| 10 | B1 | CB20 station, with lock 19 indication |

There is no decoded BK11–BK15 detector. The station grouping is the program's indication scheduling, not a claim that the code button is itself the detector.

## Common direction and train-ID procedure

Sources: `SetTrafficSticks:768–917`, `ClearTrafficSticks:2597–2841`, `UpdateTrainIDs:2234–2456`, `CheckTrainClear:2457–2486`, `MoveTrain:2487–2512`.

1. At initialization set all FS1–FS10 memories to no direction.
2. When a particular memory is empty, try its assignment conditions in source order. Most test east before west; block 9 tests west first and block 10 tests west first. Once set, it does not change merely because an opposite assignment condition becomes true.
3. Later in the scan, try its release conditions. A newly assigned direction can release in the same scan if those conditions already hold. A later scan may assign it again.
4. The office/train-tracking calculation, when not skipped by indication-code processing, uses the resulting direction and point settings to attempt the transfers listed below.
5. A transfer succeeds only if the source train ID is nonempty and the destination train ID is empty. Copy both train and locomotive IDs; never overwrite a populated destination through this helper.
6. **For detected source blocks, copying does not clear the source.** Both can show the ID while detectors overlap. A later clear detector clears that source record. For undetected source records 11–15, a successful transfer clears the source immediately.
7. A transfer into 3, 4, 7, 8 or 9 writes an OS movement log with the configured junction name. This logs a software inference; it does not read a physical train ID.
8. After attempting transfers, clear every detected record whose BK is clear. Also clear eligible boundary records using the separate rules below. A destination occupied by an old ID or a missing source ID can therefore prevent tracking even when trains move physically.

Train tracking processes detected blocks 1 through 10, then boundary entries11–14, in order. Several transfer attempts can occur during one scan. Do not interpret this as an atomic train-location handover or automatic train movement.

The train-entry dialog can explicitly set direction for blocks 1, 2, 5 and 6 using its east/west selection (`MainPanel.InputTrainID:1713–1757`). That assignment is not restricted to an empty FS value. It does not set direction in the interlocking blocks. A newly entered ID on a detector-clear record may be erased by the next normal CheckTrainClear update.

## Block 1 — north-main direction memory (`FS1`)

### Assign direction while empty

1. Set east if signal 24 is held left and delayed points 23 are normal.
2. Otherwise it can set east if signal 26 is held left, delayed points 23 reverse and delayed points 25 normal.
3. If still empty, set west if signal 8 is held right and delayed points 15 normal.
4. If still empty, set west if signal 10 is held right, delayed points 9 reverse and delayed points 15 normal.

### Release the remembered direction

For an east memory, release if either row matches:

| Conditions required together |
|---|
| Immediate points 23 normal; signal 24 no longer held left; blocks 1 and 3 clear |
| Immediate points 23 reverse; signal 26 no longer held left; blocks 1, 3 and 4 clear |

For a west memory, release if any row matches:

| Conditions required together |
|---|
| Immediate points 9 normal; delayed points 15 normal; signal 8 no longer held right; blocks 7 and 1 clear |
| Delayed points 15 reverse; block 1 clear — no TLV or adjoining occupancy test in this branch |
| Immediate points 9 reverse; signal 10 no longer held right; blocks 8, 7 and 1 clear |

### Identifier and indications

1. With east memory and blocks 1 and 7 occupied, attempt to copy ID1 into 7.
2. With west memory and blocks 1 and 3 occupied, attempt to copy ID1 into 3.
3. Other block rules can copy 7 into 1 westbound, and 3 into 1 eastbound. Each transfer uses the source block's own direction memory; they need not be assumed identical automatically.
4. Clear ID1 when BK1 becomes clear.
5. Show block 1 routed/green if its display state is clear and FS1 is east or west. Occupied remains red; otherwise white. Office direction lights derive from FS1.

Block 1 is not directly tested as an occupied-block stop condition in the two signal route routines; its direction memory supplies opposing-route restrictions. Do not turn that observation into an assumption that occupancy is irrelevant to the full state machine. Sources: common routines above; `MainPanel.UpdateBlock1:1372–1387`.

## Block 2 — south-main direction memory (`FS2`)

### Assign direction while empty

1. Set east if signal 26 is held left with delayed points 23 normal and 25 normal.
2. Also set east if signal 26 is held left with delayed points 25 reverse; that condition does not additionally require points 23 normal.
3. If still empty, set west if10R's triple-head aspect is away from stop with delayed points 9 and 11 normal.
4. If still empty, set west if12R is away from stop with delayed points 11 reverse.
5. If still empty, set west if signal 10 is held right with delayed points 9 normal, or signal 12 is held right.

### Release direction

1. For east: with delayed points 23 reverse, release when blocks 4 and 2 are clear; this branch does not test signal 26's memory.
2. For east with delayed points 23 normal: require blocks 4 and 2 clear and signal 26 no longer held left.
3. For west: first require block 2 clear. If delayed points 9 are normal, also require block 8 clear and **neither signal 10 nor12 held right**.
4. Otherwise, when delayed points 9 are not normal, block 2 clear alone releases the west memory. This literal otherwise includes invalid/dark values; do not strengthen it to an explicit reverse test.

### Identifier and indications

1. East with blocks 2 and 8 occupied: attempt 2→8. West with blocks 2 and 4 occupied: attempt 2→4.
2. Other rules attempt 4→2 eastbound and 8→2 westbound, with their additional point conditions below.
3. Clear ID2 when BK2 is clear. Draw clear block 2 green if FS2 is east/west, red if occupied, otherwise white; direction lights derive from FS2.
4. In26LC's signal rule, block 2 occupied selects yellow after its other conditions pass; it is not an unconditional red condition there.

Sources: common routines; `MainPanel.UpdateBlock2:1388–1400`; signal 26LC at `CTCLogic.vb:1431–1445`.

## Block 3 — OS name Airline Jct (`FS3`)

The OS name is confirmed from `InitializeOSSections:463–478`. Detector boundaries and apparently differing geographic labels elsewhere still need a physical plan.

### Assign direction while empty

1. Set east if24L is away from red with delayed points 23 normal.
2. Set east if26LAB is away from red/red with delayed points 23 reverse.
3. If still empty, set west if24R is away from red/red.

### Release direction

1. East with delayed points 23 normal: require signal 24 no longer held left and block 3 clear.
2. East with delayed points 23 **not normal**: require signal 26 no longer held left and blocks 3 and 4 clear.
3. West: require signal 24 no longer held right and block 3 clear.

### Identifier, restrictions and display

1. East with blocks 3 and 1 occupied: attempt 3→1.
2. West with delayed points 23 normal and blocks 3 and 5 occupied: attempt 3→5.
3. West with delayed points 23 reverse and blocks 3 and 4 occupied: attempt 3→4.
4. Source rules also permit 1→3 westbound, 5→3 eastbound and 4→3 eastbound through their respective conditions.
5. Clear ID3 when BK3 clears. Each successful transfer into 3 logs OS at Airline Jct.
6. Occupied block 3 directly holds 24L/24R at stop, prevents acceptance of a 23 point request and guards its subsequent motor change. Points 23 request acceptance also requires block 4 clear.
7. For a detector-clear screen block 3, show routed if signal 24 has any direction held, **or** signal 26 is held left with delayed points 23 reverse, **or** display block 4 is occupied with delayed points 23 reverse and FS3 east. Occupied block 3 stays red. Shape details are in the drawing appendix.

Sources: common routines; `MainPanel.UpdateBlock3:1401–1435`.

## Block 4 — OS name Freight Line Jct (`FS4`)

### Assign direction while empty

1. Set east when delayed points 25 are normal and 26LAB is away from red/red.
2. Set east when delayed points 25 are reverse and 26LC is away from red.
3. If still empty, set west when 26R is away from red/red.
4. If still empty, also set west when delayed points 23 are reverse and 24R is away from red/red.

### Release direction

1. For east with delayed points 23 normal: require signal 26 no longer held left and block 4 clear.
2. For east with delayed points 23 **not normal**: also require block 3 clear.
3. For west with delayed points 23 normal and points 25 either normal or reverse: require signal 26 no longer held right and block 4 clear. The source has two explicit normal/reverse cases for 25, not a universal otherwise.
4. For west with delayed points 23 reverse and 25 normal: require signal 24 no longer held right and blocks 3 and 4 clear.
5. For west with delayed points 23 and 25 both reverse: require **both** signal 24 and 26 no longer held right, and blocks 3 and 4 clear.

### Identifier, restrictions and display

For east memory, the routine attempts these in this order:

1. With delayed points 23 normal and blocks 4 and 2 occupied, attempt 4→2.
2. With block 4 occupied and delayed points 25 reverse, attempt boundary 12→4.
3. With delayed points 23 reverse and blocks 4 and 3 occupied, attempt 4→3.

For west memory:

1. Delayed points 25 normal and blocks 4 and 6 occupied: attempt 4→6.
2. Delayed points 25 reverse with block 4 occupied: attempt 4→boundary 12 and mark boundary 12 eligible for later clearing, even if the transfer helper did not copy anything.

Additional effects:

1. Source rules can supply ID4 from 2 westbound, 6 eastbound, 3 westbound or boundary 12 eastbound, subject to those rules. There is another12→4 attempt after the detected-block cases.
2. Clear ID4 when BK4 clears; transfers into 4 log Freight Line Jct.
3. Occupancy holds 26LAB/26LC/26R at stop, blocks new point 25 requests/movements, and blocks new point 23 requests. Point 23's later motor guard itself only tests block 3.
4. A clear screen block 4 becomes routed if signal 26 has any direction held, or signal 24 is held right with delayed points 23 reverse, or display block 3 is occupied with delayed points 23 reverse and **FS6 west**. That last predicate uses FS6, not FS4; it is recorded as written.

Sources: common routines; `MainPanel.UpdateBlock4:1436–1490`. Direction/point conditions are independent statements where stated; do not infer mutual exclusivity beyond valid point settings.

## Block 5 — north main between Sheffield and Freight Line (`FS5`)

### Assign direction while empty

1. Set east when 8LABC is away from all-red with delayed points 9, 15 and 7 all normal.
2. Set east when 8LD is away from red with delayed points 9 normal, 15 reverse and 7 normal.
3. If still empty, set west when 24R is away from red/red with delayed points 23 normal.

### Release direction

For east, release if **any** one of these is true:

1. Signal 8 no longer held left and blocks 7 and 5 clear.
2. Delayed points 9 reverse and block 5 clear.
3. Delayed points 7 reverse and block 5 clear.

For west:

1. If delayed points 23 are normal, require signal 24 no longer held right and blocks 3 and 5 clear.
2. Otherwise, with delayed points 23 not normal, block 5 clear alone releases it.

### Identifier and indications

1. East with blocks 5 and 3 occupied: attempt 5→3. West with blocks 5 and 7 occupied: attempt 5→7.
2. Other cases attempt 7→5 eastbound and 3→5 westbound.
3. Clear ID5 when BK5 clears. A clear display block 5 is routed if FS5 is nonzero; both drawn sections use red for occupied, green for routed, otherwise white. Office traffic lights derive from FS5.
4. Block 5 occupancy is not a direct stop predicate in the route routines; the direction memory participates in the signal checks. Manual train entry can also set this direction.

Sources: common routines; `MainPanel.UpdateBlock5:1498–1514`.

## Block 6 — south main between Sheffield and Freight Line (`FS6`)

### Assign direction while empty

1. Set east when 10LAB is away from red/red and delayed points 11 normal.
2. Set east when 8LABC is away from all-red and delayed points 9 reverse.
3. Set east when 8LD is away from red, delayed points 9 reverse and 15 reverse.
4. If still empty, set west when 26R is away from red/red with delayed points 25 normal.
5. If still empty, set west when 24R is away from red/red with delayed points 23 reverse.

### Release direction

For east, release if any row matches:

| Conditions required together |
|---|
| Delayed points 9 normal; signal 10 no longer held left; blocks 8 and 6 clear |
| Delayed points 9 reverse; signal 8 no longer held left; blocks 8, 7 and 6 clear |
| Delayed points 11 reverse and 9 normal; blocks 6 and 8 clear — no TLV test in this branch |

For west:

1. With delayed points 23 normal, require signal 26 no longer held right and blocks 4 and 6 clear.
2. With delayed points 23 reverse, require signal 24 no longer held right and blocks 3, 4 and 6 clear.

### Identifier and indications

1. East: require blocks 6 and 4 occupied **and delayed points 25 normal**, then attempt 6→4.
2. West: require blocks 6 and 8 occupied, then attempt 6→8.
3. Other cases attempt 8→6 eastbound and 4→6 westbound.
4. Clear ID6 when BK6 clears. A clear display block 6 becomes routed when FS6 is nonzero; both drawn sections use red/green/white for occupied/routed/clear. Office direction lamps derive from FS6.
5. Block 6 occupancy is not itself a direct stop predicate in the route routines. FS6 supplies opposing-direction checks, and manual train entry can set it.

Sources: common routines; `MainPanel.UpdateBlock6:1515–1531`.

## Block 7 — OS name Rock Creek Jct (`FS7`)

### Assign direction while empty

1. Set east when signal 8's route memory is left. The source compares it with the numerically equivalent EAST constant.
2. If still empty, set west when signal 8's route memory is right.
3. If still empty, set west when signal 10 is held right and delayed points 9 reverse.

### Release direction

1. East: require signal 8's memory **empty** and block 7 clear.
2. West with delayed points 9 normal: require signal 8's memory empty and block 7 clear.
3. West with delayed points 9 reverse: require signal 10's memory empty and blocks 8 and 7 clear.

### Identifier and restrictions

With east memory, attempt the following independently where their conditions match:

1. Delayed points 7 and 9 normal, blocks 7 and 5 occupied: 7→5.
2. Delayed points 9 reverse, blocks 7 and 8 occupied: 7→8.
3. Delayed points 9 normal and 7 reverse, blocks 7 and 9 occupied: 7→9.

With west memory:

1. Delayed points 15 normal, blocks 7 and 1 occupied: 7→1.
2. Delayed points 15 reverse, blocks 7 and 10 occupied: 7→10.

Other cases can supply 7 from 1 eastbound, 5 westbound, 8 westbound, 9 westbound or 10 eastbound. Clear ID7 when BK7 clears; successful transfers into 7 log Rock Creek Jct.

Block 7 occupied holds all signal 8 calculated routes at stop. It also causes signal 8's occupancy-based route-memory/request reset, prevents new point 7/15 requests, and guards needed motor changes for 7/9/15. Point 9 request acceptance separately checks block 8. Office lock lamps7/9/15 light for this occupancy. A clear display block 7 becomes routed when FS7 is nonzero; see shape selections below.

Sources: common routines; `CTCSwitch:1231–1241`; `TimeLocking:1573`; `MainPanel.UpdateBlock7:1532–1602`.

## Block 8 — OS name Sheffield Jct (`FS8`)

### Assign direction while empty

1. Set east when signal 10's route memory is left.
2. Set east when signal 8 is held left and delayed points 9 reverse.
3. If still empty, set west when signal 10 is held right.
4. If still empty, set west when signal 12 is held right.

### Release direction

1. East with delayed points 9 normal: require signal 10's memory empty and block 8 clear.
2. East with delayed points 9 reverse: require signal 8's memory empty and blocks 8 and 7 clear.
3. West with delayed points 11 normal: require signal 10's memory empty and block 8 clear.
4. West with delayed points 11 reverse and 9 normal: require signal 12's memory empty and block 8 clear. No extra universal release case is supplied for every other combination.

### Identifier and restrictions

For east:

1. With delayed points 11 normal and blocks 8 and 6 occupied, attempt 8→6.
2. With delayed points 11 reverse and block 8 occupied, attempt 8→boundary 11, then mark11 eligible for later clearing even if the helper did not copy anything.

For west:

1. With **delayed points 15 normal** and blocks 8 and 2 occupied, attempt 8→2. The source explicitly checks15 here, not 9 or 11; do not silently correct this predicate.
2. Independently, with delayed points 9 reverse and blocks 8 and 7 occupied, attempt 8→7.

Other cases can supply 8 from 2 eastbound, 6 westbound, 7 eastbound or boundary 11 westbound. Clear ID8 when BK8 clears; successful transfers into 8 log Sheffield Jct.

Block 8 occupancy holds 10L, 10R and 12R at stop; it also blocks 8L routes using reverse9. It resets the 10/12 route memories through their occupancy processing. It prevents new point 9/11 requests and guards motor 11; motor 9's separate guard uses block 7. Office lock lamps9/11 light for this occupancy. Block 8 also controls Coburg West arrival/acceptance state.

For display, a clear block 8 becomes routed if FS8 is nonzero with BK8 clear, or signal 10 has any direction held, or signal 12 has any direction held. The source tests TLV10 against CLR, whose value is zero, rather than naming NV. Shape selections are below.

Sources: common routines; `TimeLocking:1574–1575`; `RouteCheckEast:1353,1372,1384–1390`; `MainPanel.UpdateBlock8:1603–1667`.

## Block 9 — OS name Southwest Jct (`FS9`)

### Assign and release direction

1. While empty, first set west when signal 4 is held right.
2. If still empty, set east when signal 4 is held left. A commented-out alternative involving signal 8 does not operate.
3. Release east when signal 4 is no longer held left and block 9 clear.
4. Release west when signal 4 is no longer held right and block 9 clear.

### Identifier and restrictions

1. East with delayed points 3 normal and block 9 occupied: attempt 9→boundary 14 and mark14 eligible for later clearing.
2. East with delayed points 3 reverse and block 9 occupied: attempt 9→boundary 13 and mark13 eligible.
3. West with blocks 9 and 7 occupied: attempt 9→7.
4. Sources can supply 9 from 7 eastbound, boundary 13 westbound with 3 reverse or boundary 14 westbound with 3 normal.
5. Clear ID9 when BK9 clears. Each successful transfer into 9 logs Southwest Jct.
6. Occupancy holds all signal 4 routes at stop, resets signal 4's route memory, prevents new point 3 requests and guards a needed motor 3 change. Its office lock lamp lights.
7. A clear display block 9 becomes routed when FS9 is nonzero. Draw the chosen points 3 branch plus common sections in the occupied/routed color; details below.

Sources: common routines; `TimeLocking:1572`; `MainPanel.UpdateBlock9:1668–1703`.

## Block 10 — Broadway approach (`FS10`)

### Assign and release direction

1. While empty, first set west when signal 8 is held right and delayed points 15 reverse.
2. If still empty, set east when signal 8 is **not held right** and a train identity exists in block 10. This does not require a left-held route or an occupied detector in that assignment line.
3. Release east whenever block 10 is clear. A direction set from an ID can therefore release again during the same scan.
4. Release west only when signal 8 is no longer held right, blocks 7 and 10 are clear, and delayed points 15 are **normal**. The normal setting is required as written; do not change it to reverse merely because this is the branch route.

### Identifier and indications

1. East with blocks 10 and 7 occupied: attempt 10→7.
2. The block 10 west case has no outgoing ID-transfer action. The source has removed older transfers involving slot 15.
3. The block 7 west rule supplies 10 when blocks 7 and 10 are occupied and delayed points 15 reverse.
4. The operator can enter a train ID by clicking the block 10 line (`MainPanel.vb:1491–1497`). Clear ID10 when BK10 clears in a normal train-tracking update.
5. Signal 8LD requires a nonempty ID10. This is an indirect relationship to block 10 detection/tracking, not an explicit “BK10 clear” clearance predicate for that signal.
6. Occupancy is returned through the CB20 station. A debug log records detector state changes; a comment reports historical RC filtering, not a current electrical test.
7. The line drawing shows only occupied/red or clear/white. It does **not** turn green just because FS10 has a direction.

Sources: `SetTrafficSticks:890–899`, `ClearTrafficSticks:2828–2840`, `UpdateTrainIDs:2417–2429`, `ReadRailroad:749–754`; `MainPanel.UpdateBlock10:1704–1712`. The old declaration comment naming logical15 Broadway is not the active workflow.

## Boundary record 11 — Coburg West, no detector

Sources: `CTCLogic.UpdateTrainIDs:2377–2381,2428–2432`, `CheckTrainClear:2469–2472`; `MainPanel.lineCoburgWest_Click:1336–1341`.

1. The operator enters the departing train/loco ID using the Coburg West track-line handler. This writes TrainID(11); there is no BK11 occupancy sensor or FS11 traffic stick.
2. Signal 12R requires that ID, alongside its own point, occupancy, lock and traffic restrictions.
3. For a train entering the boundary from block 8, block 8's east rule with delayed 11 reverse and BK8 occupied attempts 8→11 and marks11 eligible for clearing.
4. For a train departing the boundary, delayed points 11 reverse, FS8 west and BK8 occupied attempt 11→8. A successful copy immediately clears the boundary source; the eligibility flag is set whether or not the copy succeeded.
5. If eligible and block 8 clear, erase the boundary ID and reset its eligibility flag.
6. Do not confuse ID11 with CWSTATUS yardmaster acceptance. They are separate states used by different signal paths.

The older clickable label handler at `MainPanel.vb:795–802` edits only a label/log. It does not write the actual TrainID array and cannot satisfy the 12R ID condition by itself.

## Boundary record 12 — Coburg East, no detector

Sources: `UpdateTrainIDs:2288–2294,2304–2310,2434–2438`, `CheckTrainClear:2473–2476`; `MainPanel.lineCoburgEast_Click:1343–1348`.

1. Enter the train/loco ID through the Coburg East track-line handler; this fills record 12, not a detector or FS12 value.
2. Signal 26LC requires ID12, but26R's alternate permission is SWI25; these are not interchangeable.
3. With FS4 west, delayed points 25 reverse and block 4 occupied, attempt 4→12 and mark12 eligible for clearing.
4. With FS4 east, delayed points 25 reverse and block 4 occupied, attempt 12→4. The program attempts this both in the block 4 east case and later in its boundary section; the destination-empty condition prevents unconditional overwriting.
5. A successful12→4 clears the source record immediately. The later boundary branch marks it eligible even if no ID was copied.
6. If eligible and block 4 clear, clear ID12 and reset the eligibility flag.

## Boundary record 13 — Centropolis, no detector

Sources: `UpdateTrainIDs:2405–2409,2440–2444`, `CheckTrainClear:2477–2480`; `MainPanel.lineCentropolis_Click:1329–1334`.

1. Enter the train/loco ID through the Centropolis line handler; no BK13 or FS13 is read or calculated.
2. Signal 4RB requires ID13, with points 3 reverse and its other clearance conditions.
3. With FS9 east, delayed points 3 reverse and block 9 occupied, attempt 9→13 and mark13 eligible for later clearing.
4. With FS9 west, delayed points 3 reverse and block 9 occupied, attempt 13→9, clearing the source immediately on success and setting the eligibility flag regardless of success.
5. If eligible and block 9 clear, clear ID13 and reset its eligibility flag.

## Boundary record 14 — Ottumwa in the active handlers, no detector

Sources: `UpdateTrainIDs:2399–2403,2446–2450`, `CheckTrainClear:2481–2484`; `MainPanel.lineOttumwa_Click:1350–1355`.

1. Enter the train/loco ID through the Ottumwa line handler; there is no BK14 or FS14.
2. Signal 4RA requires ID14, normally with points 3 normal and its other restrictions.
3. With FS9 east, delayed points 3 normal and block 9 occupied, attempt 9→14 and mark14 eligible.
4. With FS9 west, delayed points 3 normal and block 9 occupied, attempt 14→9, clearing the source on success and setting eligibility regardless.
5. If eligible and block 9 clear, erase ID14 and reset eligibility.

The signal 4RA path clears an annunciator named Bensenville. Older declaration comments identify boundary indices differently. Preserve the executable indices above and record the place-name inconsistency for owner/diagram verification; do not relabel or remap software from an assumption.

## Record 15 — retained array slot, no active comparable block workflow

1. The global train/loco arrays include index15, and startup clears it along with the other records.
2. No BK15 read, FS15 assignment, normal track-line entry handler or current train-ID movement case establishes an active boundary 15 workflow.
3. MoveTrain still has a generic “clear source 15 after a successful copy” case, but current automatic movement does not provide a corresponding active transfer to/from 15.
4. CheckTrainClear has no specific eligibility-clear branch for 15. Do not claim a complete retained operational block merely because its array slot/comment exists.
5. Final GitHub changes moved Broadway handling to detected block 10. Check the 2018 history before deciding whether slot 15 was later reused.

Sources: global arrays around `CTCLogic.vb:195–205`, initialization `450–455`, movement/clearing `2417–2512`, final baseline commit history described in [inventory](SOURCE_CODE_INVENTORY.md).

## Screen drawing details for the detected blocks

This appendix describes the block **line segments**, not every direction-arrow bitmap or point image. Screen segment suffixes are drawing names, not separate occupancy detectors or C/MRI terminals. Directions and signal/point icons are additional presentation layers. Block coloring is not permission for a train to move.

1. Normally seed each display Block value from BK; then apply the routed promotions described above. During an indication code, these drawing routines can be skipped and keep previous colors.
2. For occupied sections use red; for routed sections use green; clear uses white. Block 10 has no green/routed branch.
3. Apply the per-block choices below. Where the source writes only selected segments in the occupied/routed case, it does not universally reset the other segments to white on that same pass. Retained visual fragments are therefore possible; do not infer an extra detection section from them.

| Block | Drawing rule after choosing red/green/white |
|---|---|
| 1 | Line 1A takes the whole display state color |
| 2 | Line 2A takes the whole display state color |
| 3 | Occupied/routed colors3A and either3B for delayed 23 normal or 3R otherwise; the unselected3B/3R is explicitly white. Clear resets3A/3B/3R white |
| 4 | Occupied: delayed 23 normal colors4A; 23 normal with 25 normal colors4B/4C; 23 reverse colors4R/4C; 25 reverse colors4A/4D/YardInterchange. Routed: 23 normal colors4A; 23 normal with 25 normal colors4B/4C; 23 reverse colors4R/4C; 25 reverse colors4D/YardInterchange **only if26R is away from red/red**. Clear resets all these segments white |
| 5 | Both 5A and 5B use the state color |
| 6 | Both 6A and 6B use the state color |
| 7 | Occupied/routed always colors7B. Delayed 7 and 9 normal colors7A; 7 reverse and 9 normal colors7D/7E; 9 reverse colors7R; 15 reverse colors7F/7G/7H; 15 normal colors7C. Clear resets all listed segments white |
| 8 | Occupied/routed: delayed 11 normal colors8A; 9 normal colors8B/8C, otherwise colors8R; 9 reverse also colors8A; 9 normal with 11 reverse colors8D/8E. Clear resets8A–8E and 8R white |
| 9 | Occupied/routed: delayed 3 normal colors9A; otherwise 9B/9C. Always colors9D/9E/9F in those states. Clear resets9A–9F white |
| 10 | Its single line is white when clear and red when occupied; no routed-green calculation |

Source: `MainPanel.UpdateBlock1` through `UpdateBlock10`, 1372–1712. Graphic promoters for 3/4 use the currently calculated display values as stated above, so call order matters; they are not simply additional physical occupancy bits.

## A worked example: tracking across points 9

1. Suppose the program remembers block 7 eastbound, delayed points 9 reverse, blocks 7 and 8 occupied, ID7 set and ID8 empty.
2. Block 7's east case attempts 7→8. The helper copies train and loco IDs to 8 and logs OS at Sheffield Jct.
3. ID7 remains while BK7 is occupied. This is expected copying during overlap, not necessarily a duplicate real train.
4. Subsequent tracking in this same scan depends on FS8 and its point/occupancy conditions. The program does not freeze all other transfers after7→8.
5. When BK7 clears, CheckTrainClear erases ID7. Separately, FS7 east only releases when signal 8's memory is empty and block 7 clear.
6. A green/white/red diagram change and a traffic-memory release can occur on different updates. None verifies actual point position or locomotive identity.

## What remains uncertain or outside these rules

- Exact block boundaries, place names, detector reliability and installed contact/manual-point wiring need layout evidence. Do not derive them from bitmap suffixes or unused declarations.
- “No explicit occupancy guard here” does not mean the complete route has none. Signal, request-acceptance, motor, direction and time-lock routines interact sequentially.
- Immediate/delayed point indications are assumed valid normal/reverse for ordinary reading. Literal otherwise/nonzero cases can include invalid values, and the source does not comprehensively reject them.
- Manual train entry can change direction1/2/5/6, and failed/partial serial reads can leave stale block values. This state machine is not a demonstrated fail-safe detector system.
- SignalTest can suspend normal indication/office/direction-clearing work while point/output work continues. An apparently frozen diagram is not evidence that hardware outputs are stopped.
- No EasyDCC commands, turntable automation or day/night integration are introduced. The guides describe the original source; they do not authorize a rewrite, compilation experiment, hardware test or merge of2018 material.
