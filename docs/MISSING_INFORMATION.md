# Missing information and unresolved questions

Baseline: [overview](SYSTEM_OVERVIEW.md). The following evidence is needed to move from code recovery to trustworthy railway operation. No hardware assignment should be filled by guesswork. Priorities refer to future work, not permission to perform it.

## System boundaries clarified by the owner

The owner's authoritative clarification on 16 November 2026 supersedes earlier assumptions: day/night lighting was installed after purchase and is excluded from initial software restoration; EasyDCC operates independently of C/MRI and CTC, with detectors providing occupancy to CTC; the turntable is manually operated by a layout-side switch; and some points have manual control while others have software interlocking. Their overlap is to be established, not presumed. Missing DCC integration, turntable software or original day/night code is **not** an unresolved completeness issue. Do not plan DCC commands or turntable software integration; new automation/integrations require explicit approval.

## Highest priority: preserve and identify the real baseline

The owner has now located substantial original-PC backups, but they are not yet available to Codex. The immediate missing inputs are complete local paths/provenance and access to the actual files, including hidden `.git`; the existence of reported folders must not be confused with completed recovery or comparison. The [backup register](HISTORICAL_BACKUPS.md) records approximate sizes,2018 observations and read-only comparison requirements. The [Phase 2 proposal](PHASE_2_BUILD_SIMULATION_PLAN.md#information-needed-from-the-owner-before-gate-a) lists environment/operating inputs needed before any approved build or execution.

| Needed evidence | Why it matters | Possible source |
|---|---|---|
| Damaged PC disk image, backups, installed EXE/DLL/PDB/config files and dates | HEAD is2016 development history, not authenticated last-working deployment | Disk recovery or original archives, without running the railway software |
| Original developer's manuals, wiring spreadsheets, diagrams, operating instructions | Source comments cite handbook chapters but do not reproduce installation circuits | C/MRI application handbook vol2/ch25; chapters7/23 and figures7-15/7-23 referenced in code; personal archives |
| Exact physical panel, board/driver and terminal photographs | Reconcile node addresses, labels and modifications | De-energized inspection, labelled photographs |
| History of layout changes since2016 | Last source map may predate rewiring or repaired electronics | Owner, builder, operating crew notes |
| Known-good toolchain and dependency provenance | .NET4/PowerPacks12 mismatch with2010 solution header | Original installer/media, Git historical DLL metadata, developer records |
| Ownership/license permission | No license file in audited tree | Author/owner permission before redistribution |

## Electrical and mechanical unknowns

- Which equipment was actually struck by lightning or affected by moisture; damage extent cannot be diagnosed from source.
- Owner reports water beneath flooring/carpet for a prolonged period and visible warping of CTC-support timber. Board/electronics condition remains unknown and comprehensive recent electrical testing has not been reported. Identify the previously replaced failed electrical unit and any repair records; no inspection or power-up is authorized here.
- Power supply models, 5 V/12 V polarity, current limits, protection, fusing, grounding, isolation and actual common connections. A12 V comment is not a circuit design.
- Serial interface electrical standard, converter model, isolation, adapter driver, bus topology, termination/bias and cable continuity. COM4 is a software setting, not the required identity of a future adapter.
- SMINI revision/firmware, address-switch positions, oscillator setup, output sourcing/sinking configuration and driver boards. Confirm UA0–3 physically.
- Signal type per head (two-lead, three-lead, separate yellow), polarity, series resistors and every driver pin. Resolve node3 CT(5)=FF versus comment and BLMA26LC added output.
- Which transistor failed in2007 and whether node3 card0/B substitution remains. Establish what is actually wired to node3 card1/C before any output is sent; stale OB6 is a concrete concern.
- Turnout driver circuits, motor condition, travel times, contact conventions and whether feedback really proves both endpoints. Source reads six contacts but does not use them for motor correspondence.
- Physical action/current polarity of17/19 electric locks, local key arrangements, turnout25B local toggle/LED circuit and any independent interlocking relays.
- Detector model, sensitivity, input polarity, block boundaries, isolation gaps, resistor-wheel coverage and RC filter condition. Identify what `PWRIND` measures and why its whole byte should equal1.
- The detector interface between standalone track operation and CTC still needs physical documentation. Turntable and day/night lighting circuits are outside initial software restoration and are not software dependencies or missing components of this project.
- A point-by-point schedule of manual controls and software interlocking: which points, local switch positions, motor/lock circuits, permission signals and position feedback. Turnout 25 and locks 17/19 provide source evidence for some paths, but do not define every manual control on the layout.

## Operational information needed

Additional startup evidence: the owner recalls a “Start Layout” command, while this snapshot/history exposes “Run with CMRI…”. Recover the actual installed release/menu or operating manual to reconcile the name. Determine whether startup instructions required a visual check or settling wait, and whether the six position-labelled inputs were connected to Tortoise auxiliary contacts. Their use for physical point verification is absent from this code, but their wiring cannot be inferred. See [startup findings](STARTUP_INITIALIZATION.md).

| Question | Specific source ambiguity |
|---|---|
| Was this revision ever run successfully on the installed layout? | Latest commits change TrainID gates and Broadway handling; no release tag or commissioning record |
| Which timings are authentic? | 5/10/12/60/90 comments overwritten by2/2/10/10/10 active settings |
| What are the intended route/conflict truth tables? | Asymmetric route predicates, sequential updates and mixed delayed states cannot be certified by comments alone |
| What is required on communications loss/power loss? | No restrictive fallback policy or timestamped valid data; detectors freeze on power condition |
| What happens on emergency stop or PC crash? | No explicit software stop/reset transaction; actual output retention/watchdog and independent power cut unknown |
| How should failed/moving points inhibit clearance? | PSCTRL uses time/command rather than TFB feedback |
| How are crews authorized into dark territory? | Boundary IDs and annunciators exist, but full operating rules/limits are absent |
| How do crew request, dispatcher acceptance and yardmaster coordination work physically? | Need panel labels and intended CWSTATUS/SWI25 sequence |
| Which track labels are authoritative? | Old global comment conflicts with actual11/12/13/14 handlers; Bensenville annunciator and Ottumwa boundary terminology need reconciliation |
| What should train IDs mean on reversing, splitting/combining or detector dropout? | IDs copied between occupied blocks, never overwrite populated destination; no consist identity telemetry |
| Which maintenance tools were really used? | Dialog advertises ten failure flags but implements one; standalone utilities may exist outside this repository |

## Repository/build uncertainties

All current Compile/EmbeddedResource paths and central file-backed resource references resolve. `Resources/TurnoutBlank1.png` is missing as a project None item. PowerPacks12 is absent from HEAD but recoverable as an older Git object; its exact suitability and permission to redistribute are not established. No build has established compiler errors, resource generation, binding behavior or Windows rendering correctness. No exact earliest framework version before the imported v4.0 project can be proven.

Git history was reviewed for current architecture, relevant changes, deletion provenance and snapshot chronology. It does not include a complete pre2016 development archive. Parent-fork divergence, other branches not advertised by this remote, original removable media and any uncommitted last-working changes remain outside the audit. Additional archives should be compared read-only and recorded by hash before selecting any baseline.

Reported local `.git`, `.vs`, `obj` and `bin/Debug` directories may supply missing ancestry, source/binary relationships and development-environment evidence. Their contents/completeness are unverified. JMRI folders/installers4.4 and4.12 do not prove operational integration. Later timestamps do not resolve which revision was actually deployed.

## Acceptance evidence still absent

There are no executed build results, simulator scenario results, protocol captures, exhaustive interlocking conflict matrix, field I/O verification, electrical test results or operational acceptance record from this phase. The [roadmap](RESTORATION_ROADMAP.md) defines how to obtain these incrementally after review and authorization.
