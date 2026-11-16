# Proposed restoration roadmap

This is a proposal for work **after Phase1 review**, not implementation authorization. Phase1 has changed no existing source or configuration and has not compiled, run, deployed or connected to hardware. Baseline: [overview](SYSTEM_OVERVIEW.md).

**Current direction:** preserve and behaviorally verify the original system before modernization. The existing GitHub source is the immediate reference while the reported2018 backups are unavailable. [Phase 2 software planning](PHASE_2_BUILD_SIMULATION_PLAN.md) expands Stage1 below; the stage numbers are restoration milestones, not permission to start subsequent phases. No Phase 2 implementation, build or execution is approved.

## Stage0 — review and preserve

Review the ten requested documents and the startup supplement with the owner and, if possible, original developer/experienced operators. Preserve the baseline commit and full Git history, damaged-PC disk image and all original media. Record hashes, dates, provenance and discrepancies. Apply the owner's authoritative boundaries: EasyDCC is standalone, track detectors provide occupancy to CTC, the turntable remains manually switch-operated, and later owner-installed day/night lighting is excluded from initial software restoration. Some points are manually controlled and some software-interlocked; establish the overlap from evidence. Do not plan DCC command integration or turntable software integration. New automation or integrations require explicit approval.

**Exit evidence:** agreed source baseline, list of missing archives, named technical custodian, preserved originals and approved scope for the next stage. Do not merge/deploy source changes as part of accepting an audit.

## Stage0B — preserve and compare the reported2018 backups when available

The owner has located approximately5 GB of original Windows7 PC backup material, with reported `CTC`, `Kansas-City-Sub-CTC` and `KCSubCTC` folders. Reported evidence includes source dated22 April2018, application artifacts dated23 April2018, PowerPacks, local `.git` and historical development/installed-software folders. Codex has not received or inspected these files; see [evidence register and comparison procedure](HISTORICAL_BACKUPS.md).

Once complete local copies are available, preserve them unchanged and create read-only path/hash manifests. Compare source, project/resources/configuration, binaries/dependencies, Git refs/ancestry and uncommitted differences. Prioritize C/MRI mappings, route/turnout logic, Start Layout/initialization, timers, maintenance and simulation changes. Check byte identity and source-to-binary evidence rather than ranking by date. JMRI installations/backups are evidence to inventory, not proof of operational integration.

**Exit evidence:** file/function comparison report, history divergence record, candidate completeness/build/dependency assessment, and recommendation with uncertainties. No merge, checkout into an original backup, historical EXE launch or code replacement. Review and approval are required before adopting historical code. This comparison may occur before or after an approved GitHub-only simulator baseline; lack of archive access does not authorize switching candidates or prevent preparation of Stage1. Operational baseline selection remains provisional until comparison is reviewed.

## Stage1 — disconnected software baseline: recommended first practical milestone

Prepare a concrete build/test proposal identifying toolchain, isolated host/VM, .NET reference assemblies, PowerPacks12 acquisition and a disposable working copy. Explain any prerequisite installations, expected changes to that copy and simulator-only launch steps. **Obtain approval before compiling or testing.**

The [Phase 2 proposal](PHASE_2_BUILD_SIMULATION_PLAN.md) now defines the preparation packages and scenario matrix. Select the exact host/tool versions and commands for review before approval; none has been installed, built or run as part of this update. Keep recovered2018 source and dependencies distinct until their contents/provenance are assessed. Source modifications and automatic retargeting are outside the initial experiment.

With all control adapters physically disconnected and VM passthrough absent, attempt the original build without automatic upgrades. Record compiler warnings/errors and resource/dependency versions. Resolve build blockers only in a separately approved copy with a small change record; preserve original code. Start only TestCMRI mode and validate four node forms, initialization, panel operation, representative routes, conflicts, cancellation and yard acceptance.

**Exit evidence:** reproducible isolated build recipe, dependency provenance/hashes, screenshot/state/output records and observed results against [simulation scenarios](SIMULATION_CAPABILITIES.md). Failures are findings; a running UI alone is not acceptance.

## Stage2 — electrical inventory and damage assessment

Seek separate authorization for physical inspection/testing. Owner reports lightning damage to the PC, prolonged water/moisture beneath flooring/carpet, warped CTC-support timber, separate5 V/12 V distribution and a previously replaced failed unit. Electronics condition is unknown; comprehensive recent electrical testing is not reported. Have a competent electronics maintainer inspect de-energized CTC supplies, boards, connectors and drivers before isolated supply tests and individual C/MRI board tests with operational loads disconnected. Photograph labels, identify the replaced unit, trace terminals and reconcile every connected I/O bit with [mapping](HARDWARE_IO_MAPPING.md). Survey manual point switches and determine whether each has software permission/lock/feedback paths; do not assume such paths exist. Verify the detector interface while preserving standalone EasyDCC. Turntable and day/night lighting work is outside initial software restoration; their presence is not a reason to add integrations or expand this scope.

Do not power suspect electronics until supply/circuit inspection supports doing so. Any later bench power-up should use an agreed isolated setup, appropriate protection and disconnected operational loads. Explicitly resolve transistor substitution, node3 OB6 loads, signal26LC, lock17/19 and turnout25 local control.

**Exit evidence:** signed-off actual wiring schedule and power/driver documentation, damage report, board/adapter identity and list of serviceable/repaired/replaced components. Physical testing itself is outside Phase1 authorization.

## Stage3 — choose maintained software path and define failure behavior

Use Stage0B/1/2 evidence to review the baseline and A/B/C with the [options comparison](RESTORATION_OPTIONS.md). Original-system restoration and behavioral verification remain the priority; do not automatically proceed to modernization. Agree permitted conflicts, point-proof requirements or documented commanded-state assumptions, loss-of-comms response, startup/pause/exit outputs, input validation and faithful operating delays before proposing any change. Later diagnostics/error recovery improvements require separate approval and may not expand operational boundaries without explicit consent.

Prepare proposed source changes for review. Highest-priority candidates are atomic valid input frames and bounded retries, complete independent node output buffers, explicit restrictive failure states, verified point correspondence or documented alternative, safe initialization/shutdown and a maintenance mode that cannot silently bypass protection. These are requirements to design, not instructions already executed. Do not silently “fix” a predicate based on presumed symmetry.

**Exit evidence:** approved behavior specification and route/conflict matrix; selected maintenance target; reviewed change plan and regression approach, including intentional differences from the original.

## Stage4 — isolated protocol and driver bench validation

After specific approval, validate framing/escaping, correct-node replies, malformed/truncated packets, absent nodes, adapter disconnection, timeouts and recovery against an isolated simulator/test harness. Then test one proven board with safe dummy loads and outputs disconnected from railway actuators. Compare intended and measured behavior, including oscillator masks and power-return cases.

**Exit evidence:** repeatable protocol/fault tests, measured output polarity, no unexplained writes, documented hardware retention/watchdog behavior and all critical software findings resolved or explicitly mitigated. A good reply does not establish electrical or interlocking correctness.

## Stage5 — incremental field commissioning

Obtain authorization for each bounded live commissioning phase. Start one verified node/circuit group at a time with traction disabled and the affected railway clear. Confirm detector boundaries, every panel contact/lamp, normal/reverse point command and proof, signal head colors and default states, local locks and yard permissions. Test interruption and recovery under controlled conditions before expanding territory.

Progress from individual devices to one interlocking, both crossovers, complete mainline and yard boundaries. Include manual point-control scenarios and any software permissions/locks established for those specific points. Retain a physically effective stop/isolation method independent of the UI. Verify the detector interface while retaining standalone EasyDCC and manual turntable operation; exclude day/night lighting from initial software restoration.

**Exit evidence:** actual I/O verification record, route/conflict acceptance results, startup/shutdown/power/communication interruption results, residual issues list and owner/operator acceptance. No deployment is implied by Phase1 or by a successful bench test.

## Stage6 — operational recovery and maintainability

Run supervised multioperator sessions with dispatcher, yardmaster and crews using written operating/maintenance procedures. Record discrepancies in authentic code timing, route release and manual train tracking. Establish versioned releases, repeatable builds, dependency archives, known-good system image, wiring records, fault logs and verified restore procedures on spare media/hardware.

**Exit evidence:** accepted complete operational scope, maintainers able to reproduce and recover the installation, backup restoration rehearsal and documented remaining hardware limitations. Avoid relying on one irreplaceable PC or undocumented individual knowledge again.

## Phase1 completion criteria and limitations

The ten requested documents and supplements provide the architecture, inventory, communications trace, known I/O, route predicates, startup findings, maintenance/simulation limits, backup evidence register, option comparison, missing evidence and proposed Phase 2 plan. All findings are static; no claim of tested buildability, fault-free logic, electrical serviceability or safe live operation is made. Next action is owner review, provision of preparation inputs when ready and explicit approval of an environment-specific software experiment. No source edits, compilation experiments, archive merge or hardware tests are authorized by this documentation update.
