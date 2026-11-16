# Signal logic in step-by-step English

Written 17 November 2026 from the inspected GitHub source, commit `0a561b3f8de459a787795a16da4c987868d4ae79`. Main source: `CTCLogic.vb`. This is a description of what the program calculates, not a tested operating rulebook or permission to run trains. No software was modified or executed to prepare it.

The reported 2018 backups remain unavailable. Their signal rules, startup command and deployed behavior may differ. This document covers all 15 wayside signal variables in the audited source. It describes active code; commented-out alternatives are not operating rules.

## How to read these instructions

- **Left and right** mean the dispatcher's signal-lever requests and the signal names in the code. They do not mean a train turns left or right at the points. The program calculates L signals in `RouteCheckEast` and R signals in `RouteCheckWest`; physical orientation still needs confirmation against the layout.
- **Points normal or reverse** mean the position the software believes it has commanded. They are not verified physical blade positions. A normal setting is not necessarily the straight route.
- **Points in transition** means the software point indication is dark/zero, normally during its movement timer. The code is not detecting physical movement continuously.
- **A remembered traffic direction** is an internal record that a section has been assigned eastbound or westbound traffic. The code calls it a traffic stick. It can remain set when track is clear or after a signal returns to red.
- **A route held for left or right** means the program's time-lock memory still holds that direction. It may represent a cleared signal or a cancelled signal whose release time has not expired. It is not simply the current lever position.
- **Red/red** means two red heads; **red/red/red** means three red heads. **Green/red** means the program's green-over-red aspect, and similarly for the other combinations. These are named software aspects; mast wiring must still be verified.
- **Train identity entered** means a nonempty train-ID entry in the program, not electronic detection of a locomotive or a command from EasyDCC.

For each signal, begin at step 1. If a step says to leave the signal at stop, do not continue to its clearance steps in that calculation. The program revisits these rules on later control cycles, so a pending request can eventually clear when the blocking condition disappears.

The descriptions below assume valid normal/reverse inputs. Some code checks are weaker than an explicit normal/reverse validation; the exact exceptions are identified at the end. No extra protective check has been added to make the rules look symmetrical.

## The usual sequence from dispatcher request to signal indication

1. The dispatcher sets the point and signal levers.
2. The dispatcher presses the appropriate code button. Moving a lever alone does not normally update the accepted request.
3. The program queues code buttons in station order. It waits while an indication code is being processed and applies the control-code delay.
4. When that delay finishes, the program reads the lever values then present and decides which requests it can accept. An occupied interlocking area can prevent acceptance; moving a lever does not guarantee its request has been accepted.
5. Point requests have additional occupancy and route-lock checks. A signal request can be accepted even though the route cannot yet clear. This distinction is important: **accepted request does not mean green signal**.
6. For an ordinary point change, the program blanks the point indication, issues the motor command and starts the movement timer. Relevant signals remain at stop while their point indications are in transition.
7. The program starts each signal calculation at its red aspect, then applies the particular checks listed below. Only a successful clearance branch changes that signal away from red.
8. It updates time-lock memories and calculates the dispatcher indication. Some indication updates deliberately wait for an indication-code delay.
9. It packs the calculated aspects into output bytes and sends them to the C/MRI nodes.
10. It repeats. If occupancy, route selection, permissions or other checked conditions change, the next calculation can return a signal to stop.

Sources: `DoOneControlCycle:210–274`, `DoControls:918–1207`, `PSCTRL:1249–1321`, `Indications:1789–2109`, `WriteRailroad:2591–2596`.

| Signal request | Code button | Occupancy condition for accepting that signal request |
|---|---|---|
| Signal 4 left/right | CB4 | Block 9 clear |
| Signal 8 left/right | CB8 | Block 7 clear |
| Signal 10 left/right | CB10 | Block 8 clear |
| Signal 12 right | CB12 | Block 8 clear |
| Signal 24 left/right | CB24 | Block 3 clear |
| Signal 26 left/right | CB26 | Block 4 clear |

This table covers signal-request acceptance, not all point-request guards or later route checks. The separate [technical interlocking document](CTC_INTERLOCKING.md#dispatcher-operation-and-request-acceptance) lists those guards. Gate 1 has no direct signal-aspect calculation in the route routines.

## Timing and the startup exception

The active values in this snapshot are 2 seconds for control codes, 2 seconds for indication codes, 10 seconds for ordinary point movement, 10 seconds for a cancelled signal's running time and 10 seconds for the generic lock-release timer. Earlier longer values in comments/assignments are overwritten. Queues and other work can add waiting time; these are not guaranteed end-to-end response times.

On fresh startup the program sets point requests, motor commands and indications to normal and all wayside aspects to red. Because those point variables already agree, startup does **not** start the ordinary 10-second movement timer. A physical point might still be travelling while software already considers it normal. See [startup investigation](STARTUP_INITIALIZATION.md). Sources: `InitializeConstants:385–396`, `InitializeControls:479–576`, `PSCTRL:1288–1318`.

## Signal 4 left — two heads (`SIG4LAB`)

Source: `RouteCheckEast`, `CTCLogic.vb:1331–1342`.

1. Begin with **red/red**.
2. Leave it at red/red unless the accepted signal 4 request is **left**.
3. Leave it at red/red if points 3 are in transition.
4. Leave it at red/red if block 9 is occupied.
5. Leave it at red/red if section 9 remembers **westbound** traffic.
6. If those checks pass and points 3 are normal, display **green/red**.
7. Otherwise display **red/green**. For valid positions this is the points 3 reverse route; the literal source test is “not normal”.

## Signal 4 right A and B — separate single-head signals (`SIG4RA`, `SIG4RB`)

Source: `RouteCheckWest`, `CTCLogic.vb:1451–1473`.

1. Begin with **both signals red**.
2. Leave both red if points 3 are in transition.
3. Leave both red unless the accepted signal 4 request is **right**.
4. Leave both red if block 9 is occupied.
5. Leave both red if signal 4's route is still held for **left**.
6. Also leave both red if all three conditions apply: signal 8's route is held for left, points 7 are reverse, and points 9 are normal.
7. For the normal points 3 route, require a train identity in logical block 14. If present, make **4RA green** and keep 4RB red. Otherwise both stay red. The code literally selects this branch when points 3 are “not reverse”.
8. For points 3 reverse, require a train identity in logical block 13. If present, make **4RB green** and keep 4RA red. Otherwise both stay red.
9. Clearing 4RA clears the Bensenville request annunciators; clearing 4RB clears the Centropolis request annunciators.

Current executable entry handlers identify logical14 as Ottumwa and 13 as Centropolis. The Bensenville annunciator name and older comments do not resolve every physical place-name relationship; this is a documentation question, not a reason to change the train-ID indices.

## Signal 8 left A/B/C — three heads (`SIG8LABC`)

Source: `RouteCheckEast`, `CTCLogic.vb:1344–1359`.

1. Begin with **red/red/red**.
2. Leave it there unless the accepted signal 8 request is **left**.
3. Leave it there if any of points 7, 9 or 15 are in transition.
4. Leave it there if block 7 is occupied.
5. Leave it there if signal 8's route is still held for **right**.
6. If points 7 are reverse, leave it there when section 9 remembers westbound traffic.
7. Leave it there if points 15 are reverse. For valid positions this signal uses points 15 normal; the separate 8LD signal handles the other setting.
8. If points 7 and 9 are both normal, leave it there when section 5 remembers westbound traffic.
9. If points 9 are reverse, leave it there if block 8 is occupied or section 6 remembers westbound traffic.
10. If the checks pass, choose the aspect from the point settings:

| Point settings | Aspect |
|---|---|
| Points 9 normal and 7 normal | **Green/red/red** |
| Points 9 reverse | **Red/green/red** |
| Points 9 normal and 7 reverse | **Red/red/green** |

This routine does not apply a universal “every block beyond the junction must be clear” test. It checks the specific occupied blocks and remembered traffic directions written above.

## Signal 8 left D — separate single head (`SIG8LD`)

Source: `RouteCheckEast`, `CTCLogic.vb:1361–1376`.

1. Begin with **red**.
2. Leave it red unless the accepted signal 8 request is **left**.
3. Leave it red if any of points 7, 9 or 15 are in transition.
4. Leave it red if block 7 is occupied or signal 8's route is held for **right**.
5. Leave it red if points 15 are normal. With valid position values, points 15 must therefore be reverse.
6. Leave it red if the software indication for controlled lock 17 is unlocked/reverse.
7. If points 9 are normal, leave it red when section 5 remembers westbound traffic.
8. If points 9 are reverse, leave it red when section 6 remembers westbound traffic or block 8 is occupied.
9. If points 7 are reverse, leave it red when section 9 remembers westbound traffic.
10. Require a train identity entered for block 10, the Broadway approach. Without one, leave it red.
11. If all those checks pass, display **green** and clear the Broadway request annunciators.

The train-ID check is an additional software requirement. A clear detector by itself does not satisfy it.

## Signal 8 right A/B and C (`SIG8RAB`, `SIG8RC`)

Source: `RouteCheckWest`, `CTCLogic.vb:1475–1487`.

1. Begin with **8RAB red/red** and **8RC red**.
2. Leave both at stop unless the accepted signal 8 request is **right**.
3. Leave both at stop if any of points 7, 9 or 15 are in transition.
4. Leave both at stop if block 7 is occupied.
5. Leave both at stop if points 9 are reverse. For valid positions this requires points 9 normal.
6. Leave both at stop if signal 8's route is held for **left**.
7. If points 15 are normal, leave both at stop when section 1 remembers **eastbound** traffic.
8. If the checks pass, select the signal/aspect below. The unselected signal remains at stop.

| Point settings | 8RAB | 8RC |
|---|---|---|
| Points 7 reverse | Red/red | **Green** |
| Points 7 normal and 15 normal | **Green/red** | Red |
| Points 7 normal and 15 reverse | **Red/green** | Red |

The eastbound section 1 check applies whenever points 15 are normal, including the points 7 reverse case. It must not be omitted just because another route appears to be selected.

## Signal 10 left — two heads (`SIG10LAB`)

Source: `RouteCheckEast`, `CTCLogic.vb:1378–1401`.

1. Begin with **red/red**.
2. Leave it at stop unless the accepted signal 10 request is **left**.
3. Leave it at stop if points 11 or 9 are in transition.
4. Update the yard-arrival record when applicable: points 11 reverse with block 8 occupied means a train is in the block; after it clears, the record can return to clear.
5. Leave the signal at stop if block 8 is occupied.
6. Leave it at stop if points 9 are reverse while points 11 are normal.
7. Leave it at stop if signal 10's route is held for **right**.
8. Leave it at stop if section 6 remembers **westbound** traffic. This check applies to both remaining points 11 routes.
9. If points 11 are normal and the previous checks pass, display **green/red**.
10. If points 11 are reverse, also require the recorded Coburg West state to be **YardAccept**. Only then display **red/green**; otherwise remain red/red.

The yardmaster acceptance sequence is explained later. Setting the dispatcher lever alone does not grant yard acceptance.

## Signal 10 right — three heads (`SIG10RABC`)

Source: `RouteCheckWest`, `CTCLogic.vb:1489–1503`.

1. Begin with **red/red/red**.
2. Leave it there unless the accepted signal 10 request is **right**.
3. Leave it there if block 8 is occupied.
4. Leave it there if any of points 11, 9 or 15 are in transition. All three are checked, even where a particular route appears not to use one of them.
5. Leave it there if points 9 are normal and points 11 are reverse.
6. For points 9 normal, apply all of these restrictions: signal 10's route must not be held for left; section 2 must not remember eastbound traffic; and lock 19 must not be indicated unlocked/reverse.
7. For points 9 reverse, leave the signal at stop if signal 8's route is held for left.
8. For points 9 reverse with points 15 normal, also leave it at stop if section 1 remembers eastbound traffic.
9. When the checks pass, select the aspect:

| Point settings | Aspect |
|---|---|
| Points 9 normal and 11 normal | **Green/red/red** |
| Points 9 reverse and 15 normal | **Red/green/red** |
| Points 9 reverse and 15 reverse | **Red/red/green** |

Do not add the lock 19 check to every branch when describing this code: its explicit restriction here applies when points 9 are normal.

## Signal 12 right — single head (`SIG12RA`)

Source: `RouteCheckWest`, `CTCLogic.vb:1505–1522`.

1. Begin with **red**.
2. Leave it red unless the accepted signal 12 request is **right**.
3. Leave it red if block 8 is occupied.
4. Leave it red if points 11 are in transition.
5. Leave it red if signal 10's route is held for **left**. This explicitly checks signal 10's memory, not signal 12's own memory.
6. Leave it red if section 2 remembers **eastbound** traffic.
7. Leave it red if lock 19 is indicated unlocked/reverse.
8. Require points 11 to be **reverse**.
9. Require a train identity in logical block 11, Coburg West.
10. If all checks pass, display **green** and clear the Coburg West request annunciators.

The physical signal 12 request is right/stop only in the input mapping; there is no corresponding left signal calculation here.

## Signal 24 left — single head (`SIG24LA`)

Source: `RouteCheckEast`, `CTCLogic.vb:1404–1412`.

1. Begin with **red**.
2. Leave it red unless the accepted signal 24 request is **left**.
3. Leave it red if points 23 are in transition.
4. Leave it red if block 3 is occupied.
5. Require points 23 to be **normal**; otherwise remain red.
6. Leave it red if signal 24's route is held for **right**.
7. Leave it red if section 1 remembers **westbound** traffic.
8. If all checks pass, display **green**.

## Signal 24 right — two heads (`SIG24RAB`)

Source: `RouteCheckWest`, `CTCLogic.vb:1524–1537`.

1. Begin with **red/red**.
2. Leave it there unless the accepted signal 24 request is **right**.
3. Leave it there if block 3 is occupied.
4. Leave it there if points 23 are in transition.
5. If points 23 are normal, leave it at stop if signal 24's route is held for left or section 5 remembers eastbound traffic.
6. If points 23 are reverse, leave it at stop if signal 26's route is held for left **and points 25 are normal**.
7. Also for points 23 reverse, leave it at stop if section 6 remembers eastbound traffic.
8. If the checks pass with points 23 normal, display **green/red**.
9. Otherwise display **red/green**. With valid positions this is points 23 reverse; the literal aspect-selection branch is “otherwise”.

## Signal 26 left A/B — two heads (`SIG26LAB`)

Source: `RouteCheckEast`, `CTCLogic.vb:1414–1428`.

1. Begin with **red/red**.
2. Leave it there unless the accepted signal 26 request is **left**.
3. Leave it there if points 23 or 25 are in transition.
4. Leave it there if block 4 is occupied.
5. If points 23 are normal, leave it at stop if signal 26's route is held for right or section 2 remembers westbound traffic.
6. If points 23 are reverse, leave it at stop if signal 24's route is held for right or section 1 remembers westbound traffic.
7. Leave it at stop if points 25 are reverse. With valid positions this requires points 25 normal; the separate 26LC signal handles the other setting.
8. If the checks pass with points 23 normal, display **green/red**.
9. Otherwise display **red/green**. With valid positions this is the points 23 reverse branch; the source literally says “otherwise”.

## Signal 26 left C — separate single head (`SIG26LC`)

Source: `RouteCheckEast`, `CTCLogic.vb:1431–1445`.

1. Begin with **red**.
2. Leave it red unless the accepted signal 26 request is **left**.
3. Leave it red if points 25 are in transition.
4. Leave it red if block 4 is occupied.
5. Leave it red if signal 26's route is held for **right**.
6. Require points 25 to be **reverse**.
7. Require a train identity in logical block 12, Coburg East. Without one, remain red.
8. If all checks pass, inspect block 2: if occupied, display **yellow**; otherwise display **green**.
9. Clear the Coburg East request annunciators when this non-red aspect is selected.

This is the explicit normal-route use of yellow found in these calculation routines. Do not replace step 8 with “block 2 occupied means red”: that is not what this source does. The rule's operational meaning needs the original signal rules and layout context. The physical true-yellow output also has a packing issue documented in [I/O discrepancies](HARDWARE_IO_MAPPING.md); this checklist describes the requested aspect, not proof of the displayed color.

## Signal 26 right — two heads (`SIG26RAB`)

Source: `RouteCheckWest`, `CTCLogic.vb:1540–1555`.

1. Begin with **red/red**.
2. Leave it there unless the accepted signal 26 request is **right**.
3. Leave it there if block 4 is occupied.
4. Leave it there if signal 26's route is held for **left**.
5. Leave it there if points 25 are in transition.
6. If points 25 are normal, leave it at stop when section 6 remembers **eastbound** traffic.
7. If points 25 and 23 are **both normal**, display **green/red**.
8. For any other combination reaching this point, require the local yard switch input associated with25 to be active. If active, display **red/green**; otherwise remain red/red.

The exact step 8 is important: it is **not** written as “only when points 25 are reverse”. The other branch includes points 25 normal with points 23 not normal. This routine also does not explicitly reject a zero/in-transition indication for points 23. Those are source findings to investigate, not assumptions that the physical route is safe.

## How the yardmaster permissions affect the signals

### Coburg West — acceptance for the reverse 11 route of 10L

Sources: `DoControls:948–973`, `RouteCheckEast:1384–1400`, `OfficeIndications:2131–2133`.

1. With an accepted signal 10 left request and motor 11 commanded reverse, a clear yard-status record becomes **TrainWaiting**.
2. The train-waiting indication flashes while the request is waiting.
3. If the yardmaster's west acceptance input is active while the recorded state is TrainWaiting, the program changes that state to **YardAccept**.
4. Acceptance makes the waiting indication steady. It does not bypass the occupancy, point, opposing-lock or traffic-direction checks for 10L.
5. Only when 10L's other checks pass and points 11 are indicated reverse can 10L display red/green using YardAccept.
6. With points 11 reverse and block 8 occupied, the route routine records **TrainInBlock** and holds 10L at stop.
7. Clearing the block can return the recorded state to clear. A coded cancellation also has a clear-state path when its signal/point/block conditions are met.

The acceptance input is a permission; it is not a decoded instruction to drive motor 11 or a verified point-position contact.

### Coburg East — local switch permission for 26R

Sources: `DoControls:974–979`, `RouteCheckWest:1540–1555`, `WriteNode3:3045–3066`.

1. An accepted signal 26 right request with motor 25 commanded reverse makes the east train-waiting indicator flash.
2. The local 25 switch input being active clears that waiting indication.
3. The same input is required by the alternate 26R clearance branch described above.
4. Output packing changes the 25/25B circuit between normal holding and local-toggle operation, according to the source comments. Exact circuit operation requires the wiring diagram.

This permission is distinct from the train-ID requirement for 26LC. Do not substitute one for the other.

## How a signal returns to stop and how a cancelled route releases

Sources: `TimeLocking/TLVPRO:1560–1624`; per-signal route routines above.

1. On every ordinary scan, start each signal calculation at red/all-red again.
2. Reapply that signal's checks. If its request is absent or a checked condition now blocks clearance, keep it at red.
3. When the software signal indication shows left or right and its route-memory value is empty, remember that direction for locking purposes.
4. If its protected interlocking block is occupied, clear that route-memory value, cancel its running-time timer, set the accepted signal request to stop and set its signal-lever indication to stop. The next route calculation also sees the occupied block and holds its signal at red.
5. If the dispatcher codes a stop request while a directional route memory remains, start the signal's running-time delay. The directional memory remains during the delay, continuing to restrict incompatible requests and routes wherever it is checked.
6. After that delay expires, release that directional route memory. This does not automatically clear every traffic stick: their separate route/block-dependent release rules still apply.
7. Do not automatically reclear after train passage. The fleet-switch input code is commented out; another accepted request is normally needed.

| Signal lever | Protected block used for this occupancy reset |
|---|---|
| 4 | Block 9 |
| 8 | Block 7 |
| 10 | Block 8 |
| 12 | Block 8 |
| 24 | Block 3 |
| 26 | Block 4 |

The routines execute in order, not simultaneously. Time-lock updates use signal indications that can come from an earlier scan, and the next routines/scans then use the changed state. A panel stop lamp, a physical red lamp, a cleared route-memory value and a released traffic direction are not all the same event.

## Why clear track can still produce a red signal

Traffic sticks are direction memories. Once assigned, they can keep an opposing signal at stop after a train leaves a particular detector. The program releases them only under specific combinations of block clearance, route-memory release and point settings. It does not simply clear every direction memory whenever its own block is unoccupied.

| Name in code | Section represented in the source |
|---|---|
| FS1 / FS2 | North/south mains between Rock Creek and Freight Line |
| FS3 / FS4 | Freight Line blocks 3/4 and crossover 23 relationships |
| FS5 / FS6 | North/south mains between Sheffield and Freight Line |
| FS7 / FS8 | Blocks 7/8 and crossover 9 relationships |
| FS9 | Southwest/block 9 |
| FS10 | Broadway/block 10 branch |

For example, section 1's eastbound memory on the points 23 normal path releases only when signal 24's route memory is no longer left **and blocks 1 and 3 are clear**. The crossover path has a different release involving signal 26 and blocks 1, 3 and 4. Seeing block 1 clear alone is insufficient. Sources: `SetTrafficSticks:768–917`, `ClearTrafficSticks:2597–2841`.

The per-signal steps deliberately say which memory must not oppose a clearance; they do not claim that other memories are always irrelevant to the complete system. For exhaustive state-machine work, retain the full technical source and scan order. These instructions are the signal-clearance rules plus their supporting explanation, not a substitute for every train-tracking and direction-memory assignment.

## Controlled locks 17 and 19

Sources: `SwitchLock:1625–1645`, `CNTLELOCK:1713–1788`, route checks above.

1. The dispatcher requests lock 17 through CB18 or lock 19 through CB20. Separate request guards can refuse a new lock request while relevant routes are held.
2. For lock 17, the release calculation denies a new release while signal 8 has a direction held and motor 15 is reverse.
3. For lock 19, it denies a new release while signal 10 has either direction held. Signal 12 also has a request-acceptance relationship; it is not an extra input to this particular lock 19 release calculation.
4. An unlocked/reverse indication for 17 holds 8LD at red. An unlocked/reverse indication for 19 holds 12RA and the normal-points 9 branch of 10R at red.
5. The lock helper also contains generic occupancy-timed/local-key/feedback features, but this layout's callers pass a clear block and zero feedback and reuse dispatcher requests. Do not describe those generic features as installed local sensing.
6. Field lock outputs are derived from delayed lock-indication values. A calculated lock state does not prove physical engagement, nor does it command a measured position for a manual point.

An already unlocked helper state has its own early-exit behavior. These descriptions of denying a **new** release must not be read as a guarantee that a later conflict automatically re-locks hardware. Exact physical/manual operation remains to be verified.

## Dispatcher indications are not physical aspect proof

Sources: `Indications:1789–2109`; `MainPanel.UpdateSignals:676–842`.

1. The program looks at its calculated signal aspects to decide whether a left or right indication should be shown.
2. If it is processing a code request, waiting for an accepted request to clear, or running time, it can make the signal-lever indication dark instead of displaying stop.
3. It snapshots station values, waits the indication-code delay and then changes the delayed panel values.
4. The screen schematic uses selected signal images and flashing indications; it is not reading actual lamp colors or currents from the railway.

Thus an operator can see a pending/dark indication while the field command remains red. A green diagram indication establishes what the software calculated, not that points moved or lamps illuminated.

## Important limits of this English translation

1. **Only conditions checked by the code are listed.** Some signal branches check different points, blocks or locks from their apparent opposite. Do not silently add symmetry or assume a universal downstream-clear rule.
2. **Invalid positions are not comprehensively rejected.**4L treats non-normal as its other route; 4R treats non-reverse as its normal route; 24R and 26LAB have otherwise branches. 8LD rejects normal rather than explicitly requiring reverse; 8LABC and 8R reject a particular 15/9 setting rather than proving every input valid. The initial nonzero checks do not necessarily reject both contacts active. The normal/reverse language above describes valid states; it does not strengthen these source tests.
3. **Physical feedback is not used for powered-point correspondence.** Six TFB inputs are decoded but unused for that purpose. Commanded alignment can disagree with actual alignment, particularly at startup or after a stall/manual action.
4. **Red-first calculation is not communications failsafety.** If serial output fails, a physical signal may retain an earlier command. The code ignores important input/initialization error returns. Software-calculated red does not prove hardware received it.
5. **Maintenance overrides this normal calculation.** While SignalTest is visible, the loop skips route calculations, time locking and several other protection/indication routines while still processing inputs, point commands and outputs. Its dropdowns directly change 24R/26R aspects. Lamp test drives all output bits on the two panel nodes. Pause/Exit do not send a restrictive output transaction.
6. **A simulated failure can change an aspect after route calculation.** The partial signal 4-left failure feature can request darkness periodically; this is not genuine lamp-failure detection. See [maintenance tools](MAINTENANCE_TOOLS.md).
7. **Aspects are described, not assigned new operating meanings.** The source names green/red/yellow combinations but does not supply a complete crew rulebook or speed table. Do not infer additional movement authority from a color name in this document.
8. **Scope stays unchanged.** EasyDCC is independent, the turntable stays manual and later day/night lighting is excluded. The 2018 source may change these signal rules once compared. No modernization, hardware action or logic rewrite is authorized here.
