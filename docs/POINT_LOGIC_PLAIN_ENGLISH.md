# Point and lock logic in step-by-step English

Written 17 November 2026 from GitHub baseline `0a561b3f8de459a787795a16da4c987868d4ae79`. This explains the program; it is not a tested operating instruction. No software or hardware was operated or changed. The [backup comparison](BACKUP_COMPARISON.md) confirms unchanged point/interlocking algorithms, feedback use and movement timers; recovered communications and failed-read handling differ. References below retain baseline line numbers.

Read alongside [signal rules](SIGNAL_LOGIC_PLAIN_ENGLISH.md), [block rules](BLOCK_LOGIC_PLAIN_ENGLISH.md) and the [I/O map](HARDWARE_IO_MAPPING.md). This guide covers every configured powered-point/gate channel and controlled lock: 1, 3, 7, 9, 11, 15, 17, 19, 23 and 25. It cannot invent a complete list of physical manual points not represented in source.

## What the program knows

1. **Lever position** is the contact value read from the dispatcher panel.
2. **Accepted request** is the lever value copied after a code button has been processed and its acceptance checks passed. A rejected request leaves the previous accepted value in place; the code-button latch is still cleared. Changing the lever alone does not retry a rejected request. A code button still physically held down can be latched again on a later scan.
3. **Motor command** is the value sent toward the output driver. Normal=1 and reverse=2 use two output bits.
4. **Immediate indication** is what the program currently considers the point's correspondence state. It is blank during an ordinary movement delay.
5. **Delayed indication** is the indication returned to the panel after an indication-code cycle. Source names ending `K` refer to this delayed value.
6. **Route held** means the relevant signal's time-lock memory is not empty. The signal can have returned to red while this memory still restricts point changes.

None of these is proof that the blades physically reached an endpoint. Six contact-labelled TFB inputs are decoded but unused for powered-point correspondence. Their actual wiring, including whether they came from Tortoise auxiliary contacts, remains unverified.

## Common procedure for an ordinary powered-point change

Sources: `CTCLogic.DoControls:918–1207`, `CTCSwitch:1208–1248`, `PSCTRL:1249–1321`.

1. Read the dispatcher lever. Valid ordinary positions are normal or reverse. Zero is not accepted as a new point request; the code does not comprehensively reject both contacts active.
2. Latch the appropriate code button and process it in station order, after the control-code delay. Active default delay is 2 seconds; other queued codes can add waiting time.
3. Apply the individual request checks below. If any fails, keep the previous request and consume that button cycle. Acceptance of a signal request on the same button does not imply acceptance of its point request.
4. When the motor routine runs, first leave a currently active movement timer alone. While its timer is positive it skips the rest of this routine.
5. When a movement timer has expired, set the indication from the existing motor command and clear the timer. This branch does not first prove position or immediately compare a newly changed request; a mismatch may be processed on a later scan.
6. Otherwise compare the accepted request, indication and motor command. If all agree normal, or all agree reverse, retain correspondence.
7. If they disagree, check the particular motor's occupancy guard. If occupied, leave the command/indication unchanged this scan. A previously accepted request can therefore remain pending for this guard to clear.
8. If the guard permits, blank the immediate indication, change the motor command to normal or reverse and start the movement delay. Effective default is 10 seconds, not the earlier 12-second value in the comments.
9. At expiry, assume correspondence from the command, without using the TFB inputs. Relevant signal checks reject a blank point indication, but each signal checks only its particular listed points.
10. Return the changed point indication through the indication-code mechanism, whose active default delay is 2 seconds. Then the panel shows the delayed value.

Output commands are packed later in the scan. The software timer begins before the physical transmission completes. A lost output, motor stall or slow travel does not generate verified wrong-position detection here. If an accepted request changes during movement, the existing transition completes before subsequent mismatch processing; it is not a continuously monitored physical reversal.

## Startup is different

Initialization sets requests, motor commands and both point indications to normal. Since these already agree, a fresh process does not start the normal movement-delay path. The first output scan can command normal while the program already shows normal, even if a physical point was left reverse. The normal occupancy guard does not undo this initial normal assignment. See [startup investigation](STARTUP_INITIALIZATION.md).

## Gate 1 — commanded like a point, but identified as a gate

Sources: `DoControls:1074–1079`, `CTCSwitch:1225–1226`, `WriteNode2:2990–2997`.

1. Read lever1 and press CB2.
2. After the control-code process, accept its nonzero value. There is no block or signal-time-lock test in this acceptance branch.
3. Use the common motor routine with its occupancy argument fixed to clear/zero. No detector guards this motor path.
4. Send SM1 on node 2, output card 0/A bits 0–1; normal and reverse follow the ordinary two-bit convention.
5. Return its indication through the panel's gate station.

One motor comment calls it Centropolis gate and a code-button comment calls it a Southwest gate. The physical location/function needs confirmation. Do not assume this channel is a track turnout or that an unlisted signal protects it.

## Points 3 — Southwest connection

Sources: `DoControls:1080–1096`, `CTCSwitch:1228–1229`; signal 4 rules.

1. Set lever3 and press CB4.
2. Require block 9 clear before this button can accept its point request.
3. Require signal 4's route memory to be empty and lever3 nonzero.
4. If accepted, the motor routine separately checks block 9 again when it needs to change its command.
5. Command SM3 through node 2, card 0/A bits 2–3, using the common movement timer.
6. A normal indication selects the normal signal 4 route; reverse selects its alternate. Signal 4 has separate request, occupancy, direction-memory and train-ID rules; moving3 alone does not clear it.
7. TFB3 is read at node 2 input card 2/A bit 0 but does not prove completion.

## Points 7 — Sheffield/Rock Creek route selection

Sources: `DoControls:1097–1115`, `CTCSwitch:1231–1232`; signal 8 rules.

1. Set lever7 and press CB8.
2. Require block 7 clear.
3. Require signal 8's route memory empty and lever7 nonzero.
4. If accepted, the motor routine separately guards movement with block 7.
5. Command SM7 through node 2, card 0/A bits 4–5, using the common movement timer.
6. Its indication helps select among signal 8 heads/routes, together with points 9 and 15. Signal 8 can remain at stop for other reasons.
7. TFB7 is decoded at node 2 input card 2/A bit 1 but unused for position proof.

## Points 9 — crossover between blocks 7 and 8

Sources: `DoControls:1116–1135`, `CTCSwitch:1234–1235`; signal 8/10 rules.

1. Set lever9 and press CB10.
2. Require block 8 clear for request acceptance.
3. Require both signal 10 and signal 8 route memories empty.
4. Require lever9 nonzero; then update its accepted request.
5. The motor routine guards a needed command change with **block 7**, not block 8. These are different checks at different times; do not reduce them to one block test.
6. Command SM9 through node 2, card 0/A bits 6–7, using the common movement timer.
7. Reverse connects the crossover relationships used by signal 8/10 and the block 7/8 direction and train-ID logic. It does not make every combination permissible.
8. TFB9 is decoded at node 2 input card 2/A bit 2 but unused for correspondence.

## Points 11 — Coburg West connection

Sources: `DoControls:1136–1147`, `CTCSwitch:1237–1238`; signal 10L/12R rules.

1. Set lever11 and press CB12.
2. Require block 8 clear.
3. Require both signal 10 and signal 12 route memories empty.
4. Require lever11 nonzero, then accept it.
5. The motor routine separately guards movement with block 8.
6. Command SM11 through node 2, card 0/B bits 0–1, using the common movement timer.
7. On its reverse route, 10L additionally requires Coburg West yard acceptance; 12R additionally requires a Coburg West train ID. These are different signal directions and permissions.
8. The SWICW yardmaster input grants acceptance; it is not a decoded instruction to throw motor 11 or proof of its position.
9. TFB11 is read at node 2 input card 2/A bit 3 but unused for correspondence.

## Points 15 — Broadway branch

Sources: `DoControls:1148–1156`, `CTCSwitch:1240–1241`; signal 8/10 and lock 17 rules.

1. Set lever15 and press CB16.
2. Require block 7 clear, signal 8's route memory empty and lever15 nonzero.
3. The motor routine separately guards movement with block 7.
4. Command SM15 through node 2, card 0/B bits 2–3, using the common movement timer.
5. Normal/reverse changes the signal 8 branch selection, some signal 10 crossover choices and the Broadway/block 10 relationship. Follow the individual signal rules rather than assuming15 alone clears a route.
6. Motor 15 reverse also forms part of the condition preventing a new lock 17 release while signal 8 has a direction held.
7. TFB15 is decoded at node 2 input card 2/A bit 4 but unused for correspondence.

## Points 23 — Freight Line crossover

Sources: `DoControls:1173–1185`, `CTCSwitch:1243–1244`, `WriteNode3:3050–3055`; signal 24/26 rules.

1. Set lever23 and press CB24.
2. Require block 3 clear.
3. Require signal 24's route memory empty.
4. Also require either signal 26's route memory empty **or the immediate points 25 indication reverse**. This exception is written explicitly; do not replace it with an unconditional signal 26 lock test.
5. Require block 4 clear and lever23 nonzero, then accept the request.
6. The motor routine separately guards a needed movement using **block 3 only**. Its later movement check is not a repeated check of both crossover blocks.
7. Command SM23 on node 3 card 0/A bits 0–1 and duplicate that pair on bits 4–5 for the crossover motors. This is one software command, not two independently proved motor positions.
8. Signal 24/26, block 3/4 train IDs and several traffic memories depend on this alignment. Use the common movement delay.
9. TFB23 is read at node 2 input card 2/A bit 5, but unused. Even installed, this one bit cannot be assumed to prove both motors independently.

## Points 25 /25B — Coburg East and local control

Sources: `DoControls:1186–1201`, `CTCSwitch:1246–1247`, `WriteNode3:3050–3069`, `ReadRailroad:764`, signal 26 rules.

1. Set lever25 and press CB26.
2. Require block 4 clear, signal 26's route memory empty and lever25 nonzero; then accept its request.
3. The motor routine separately guards a needed movement with block 4 and applies the ordinary movement timer.
4. Send SM25 on node 3 card 0/A bits 2–3.
5. When SM25 is normal, also put its normal command on card 0/A bits 6–7. Set card 0/B bits 0–1 to zero. The comments say this holds 25B normal.
6. Otherwise leave card 0/A bits 6–7 zero and set card 0/B bits 0–1 to one. The comments describe allowing the local toggle/yard-switch circuit and unlock LED; actual voltages/circuit operation require tracing. Do not equate zero driver bits with a known physical motor position.
7. Read the local switch status/permission SWI25 at node 3 input card 2/B bit 3. Its active state is used by the alternate26R clearance branch and clears the east waiting indicator.
8. SWI25 does not replace the accepted dispatcher request with a local normal/reverse command in the code. The degree of local physical control is a hardware question.
9. Signal 26LC uses points 25 reverse and a Coburg East train ID. 26R's alternate branch requires SWI25, but is broader than a simple points 25-reverse test; follow the signal guide.
10. TFB25 is declared but never read. No continuous endpoint verification for 25/25B is established.

The source notes a failed output transistor and a substitute card 0/B circuit. Do not assume the wiring still matches either its original design or an older simulator label.

## Lock 17 — Sugar Creek manual-point permission

Sources: `DoControls:1157–1164`, `SwitchLock:1634–1639`, `CNTLELOCK:1713–1788`, `WriteNode2:3003–3017`.

1. Read dispatcher lock lever17 and press CB18.
2. Require signal 8's route memory empty and the lever nonzero before accepting a new lock request. The branch does not impose an additional actual block-occupancy input check.
3. A normal accepted request invokes locking: clear its helper timer, set calculated UL17 locked and its immediate lock indication normal. Actual callers pass zero feedback, so the optional feedback refusal cannot apply.
4. For a release request, the helper first leaves an already unlocked result alone; this occurs before the new-release conflict test.
5. For a **new** release, deny it if signal 8 is held left or right **and motor 15 is commanded reverse**. Otherwise the configured clear-block argument permits the quick-release path.
6. The helper's local request is the dispatcher request again, not an actual local key contact. A valid reverse request therefore permits its quick-release branch to set UL17 unlocked and its indication reverse.
7. Return the lock indication through the indication-code delay. Field outputs use that delayed value, not directly UL17: node 2 card 0/B bits 4–5 carry the indication pair; card 0/C bit 0 is zero only when the delayed indication is normal, and one otherwise.
8. The immediate unlocked/reverse indication holds signal 8LD at red. It does not command or verify a manual point's physical alignment.

If a new release is denied, the helper sets UL17 locked and clears its timer but does not explicitly refresh the immediate lock indication in that denial branch. Do not assume every representation changes simultaneously. An already-unlocked early exit also means a later conflict does not prove an automatic physical relock.

## Lock 19 — Independence manual-point permission

Sources: `DoControls:1165–1172`, `SwitchLock:1641–1644`, `CNTLELOCK:1713–1788`, `WriteNode2:3004–3017`.

1. Read dispatcher lock lever19 and press CB20.
2. Require **both signal 10 and signal 12 route memories empty**, and lever19 nonzero, before accepting a new request.
3. Normal request locks calculated UL19 and sets normal indication, as for 17.
4. An already-unlocked result returns early in the helper.
5. For a new release, deny it while signal 10 has either direction held. Signal 12 is checked at request acceptance, but is not part of this particular helper's calculated denial condition.
6. Otherwise use the configured quick-release path: no actual occupied-block, local-key or point-feedback inputs are supplied by the caller.
7. Return the changed indication after its code delay. Node 2 card 0/B bits 6–7 carry delayed CLL19 indication; card 0/C bit 1 is zero when that delayed indication is normal and one otherwise.
8. An immediate unlocked/reverse indication keeps12R and the normal-points 9 branch of10R at red. It is not a measured point position.

The same early-exit and stale-indication caveats as17 apply. The generic helper contains a 10-second timed-release branch, but its actual callers supply a permanently clear block; do not claim this branch proves a working occupancy-based manual release on the railway. The separate AUTOELOCK routine has no configured caller.

## What the point “lock” lamps mean

These are office-calculated SWLI indications (`OfficeIndications:2151–2229`), not independent motor inhibit relays and not confirmation of a physical lock. When office indications run, start them off and turn each on for **any** listed condition. “Delayed” below refers to `K` indications; otherwise the indicated point value is immediate.

| Lamp | Conditions that light it |
|---|---|
| 3 | Block 9 occupied; or signal 4 route memory not empty |
| 7 | Block 7 occupied; or signal 8 route memory not empty; or signal 10 held right with delayed points 9 reverse |
| 9 | Block 7 or 8 occupied; or signal 8 route memory not empty; or signal 10 held right; or signal 10 held left with immediate points 11 normal |
| 11 | Block 8 occupied; or signal 10 held right with delayed points 9 **not reverse**; or signal 10 held left; or signal 12 held right |
| 15 | Block 7 occupied; or signal 8 route memory not empty; or signal 10 held right with delayed points 9 reverse |
| 17 | Signal 8 route memory not empty with delayed points 15 reverse; or signal 10 held right with delayed points 9 reverse and delayed points 15 reverse |
| 19 | Signal 10 held right with delayed points 9 **not reverse**; or signal 10 held left; or signal 12 held right |
| 23 | Block 3 or 4 occupied; or signal 24 route memory not empty; or signal 26 route memory not empty with delayed points 25 normal |
| 25 | Block 4 occupied; or signal 26 route memory not empty |

There is no equivalent configured SWLI1 lamp calculation. When an indication code is active, OfficeIndications returns before recalculating these lamps; their previous values can remain. MainPanel's lock 17/19 pictures also use calculated UL values, route/occupancy color and delayed point settings (`MainPanel.vb:541–564`), so the diagram is not physical feedback either.

## Manual-control and failure limits

1. Every powered-object PSCTRL caller selects MOTOR and supplies zero hand/padlock arguments. Its generic HAND logic and unused 27/31 placeholders do not establish installed dual-control points.
2. Local control is source-evident at 25/25B and the controlled-lock paths17/19; physical manual points elsewhere may exist without a software motor channel. Their identities and interactions remain unknown until wiring evidence is available.
3. A timed normal/reverse indication can disagree with a stalled, manually moved or unpowered mechanism. No feedback-based recovery is implemented in the powered-point algorithm.
4. Communications failures can lose commands or supply stale inputs; Pause/Exit do not send a verified safe transaction. The individual guards describe calculated behavior, not hardware failsafety.
5. SignalTest bypasses locks and signal/time-lock routines but still runs point control/output work. Do not treat that maintenance mode as a separate safe test bench.
6. Normal/reverse routes, place names, detector boundaries and output polarity require physical verification. Some source comments and simulator labels disagree. Do not install additional automation or reinterpret an uncertain manual circuit from equipment names.
