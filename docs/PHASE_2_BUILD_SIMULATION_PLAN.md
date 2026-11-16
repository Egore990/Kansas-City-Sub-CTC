# Proposed Phase 2 — controlled build and simulation

**Status: original-application build/execution proposal remains unapproved and unexecuted.** This document does not authorize original-software modifications, compilation experiments, installations, application execution or hardware testing. Separate test assets have subsequently been prepared under the owner's automation request, as explained below. See [backup discovery](HISTORICAL_BACKUPS.md), [startup findings](STARTUP_INITIALIZATION.md) and [roadmap](RESTORATION_ROADMAP.md).

**Later test-preparation request:** separate automated cases and a memory-only component host have now been authored at the owner's request; see [automated test proposal](AUTOMATED_SIMULATION_TESTS.md). No compiler or CTC test has been run. That proposal offers a narrower first experiment using the existing installed CLR4 compiler/runtime, excluding the real GUI/serial backend and PowerPacks. It needs its own approval before compilation/execution and does not constitute approval of the full original-project experiment below.

## Objective and boundaries

Establish a reproducible, hardware-disconnected behavioral baseline from the existing GitHub source while preserving original code, panel operations, route/signal behavior, manual controls, occupancy interfaces and maintenance functionality. Restoration and behavioral verification precede modernization. Historical2018 candidates will be compared separately when available; they must not be silently substituted into a baseline experiment.

No physical serial ports, adapters or C/MRI hardware are to be opened or accessed. No real turnout/signal commands, DCC command integration, turntable software control or lighting integration. Day/night lighting is outside initial scope; EasyDCC remains standalone. New automation or integrations require explicit approval. No archived EXE/installer is to be launched under this plan without specifically identifying and approving that action.

## Static Phase 1 review — available conclusions

| Area | Known source finding / implication for testing |
|---|---|
| Build | Framework4.0 WinForms WinExe, AnyCPU; Express2010 solution header; later PowerPacks12 reference and syntax/tooling ambiguity |
| Dependencies | PowerPacks12 absent from current tree; historical Git DLL exists but exact suitability/provenance must be verified before use |
| Resources | Compile/EmbeddedResource paths and62 central bitmap references resolve; project-only `TurnoutBlank1.png` is missing; no build has established impact |
| Real backend | CMRI.InitializePort opens hardcoded COM4; avoid the live Run menu entirely |
| Offline backend | Run with CMRI Simulator selects TestCMRI, whose InitializePort is empty; four checkbox/input and output-display forms exercise the actual CTC loop |
| Simulation limits | No serial framing/timeout test, automatic train movement or physical motor/contact model; CTCSimulator is an unfinished host |
| Startup | Run initializes software defaults; remembered Start Layout label unresolved. Normal points/red signals are commanded, not physically proved. Fresh startup does not start the normal movement delay |
| Point state | Six position-labelled input bits are decoded but unused for correspondence; physical Tortoise auxiliary-contact wiring unknown |
| Timing | Active code/indication delays2 s; motor/run-time/lock delays10 s. Do not restore comment values or rewrite timers during baseline capture |
| Failures | Ignored communication returns, shared buffers, UA3 OB6 assignment issue, and no enforced ready/stop-on-disconnect policy need characterization, not silent fixes |
| Maintenance | SignalTest bypasses substantial normal protection; lamp test writes all panel bits; Repair Signals only implements one simulated flag |

Detailed build evidence is in [inventory](SOURCE_CODE_INVENTORY.md), transport in [communications](CMRI_COMMUNICATIONS.md), and tools/scenarios in [simulation](SIMULATION_CAPABILITIES.md) and [maintenance](MAINTENANCE_TOOLS.md).

## Approval gates and proposed work packages

### Gate A — owner approves the concrete software experiment

Before execution, provide the owner with the chosen host/VM, source commit, exact toolchain/runtime/reference assembly versions, dependencies and their provenance, intended build commands, output paths and simulator-only launch sequence. Approval must state whether prerequisite installation and execution of the newly built application are included. A report of missing tools is not permission to install them. Source edits, automatic project conversion/retargeting and package upgrades remain excluded unless separately reviewed and approved.

The user has **not** yet supplied this approval. This plan is not the final environment-specific command sheet because the target host and recovered dependency versions remain undecided. No environment, compiler or application experiment was performed while preparing it.

### Package 1 — isolated environment and immutable reference

After approval, preserve baseline `0a561b3f8de459a787795a16da4c987868d4ae79` and record source hashes. Use a disposable copy outside original source/backups, with isolated build output. Do not let an IDE upgrade/save the original project. Keep credentials and unrelated backup software out of the experiment.

Prefer a dedicated disposable Windows VM with no exposed serial devices, USB/serial passthrough or bridge to control hardware. The owner must confirm physical isolation and hypervisor settings; Codex must not inspect/open real COM ports as a test. Do not repurpose an existing operational VM merely because one is present. Define a snapshot/rollback point before tool installation or application execution.

Confirm proposed simulation backend and all possible UI entry points from source, including the unguarded Resume path. If isolation cannot be established or the only path requires live serial access, stop before launch. Do not add safety-code changes under the guise of baseline testing.

### Package 2 — resolve prerequisites without changing logic

Record candidate VB/MSBuild toolchain and Framework4 reference assemblies separately from the installed runtime. A later runtime alone does not supply build reference assemblies. The2010 solution header is not enough to select the compiler. Review a compatible pre-VS2022 toolchain candidate; Microsoft documentation cited in [options](RESTORATION_OPTIONS.md) excludes direct Framework4 targeting in VS2022+. Verify availability, licensing and support at environment selection; no installer/toolchain has been acquired for this phase.

Verify the exact strong-named PowerPacks assembly required by the project (`12.0.0.0`) using metadata/hashes, not its approximate file size. Compare Git historical and, when accessible, OneDrive candidates. Do not assume the2018 DLL matches. Ensure all assets/resources resolve and record the missing None item. If compilation requires editing references, suppressing errors, adding assets, converting the project or changing a target, stop and propose the minimal change in a separate reviewed copy. Do not solve a build blocker by altering signalling logic.

### Package 3 — original-source build attempt

Use the approved exact command/configuration and toolchain; record complete compiler diagnostics and build/dependency hashes. Do not accept a stale existing EXE as a successful build. Record warnings relevant to implicit conversions and runtime behavior. A failed build produces a blocker report; it does not authorize automatic repairs or upgrades.

**Exit evidence:** reproducible command/environment record, successful output or precise blocker list, dependency manifest and proof that original source/backups remain unchanged. Building does not authorize launching: execution must be included in Gate A or separately approved.

### Package 4 — simulator-only characterization

Launch only the newly built approved copy inside the isolated environment, select Run with CMRI Simulator and record observations/state/output bits. Never select Run with CMRI. Predefine how to stop a hung application/loop without interacting with railway hardware; retain experiment logs separately. Do not use physical adapters to “check” an error.

| Scenario group | Record / independently check |
|---|---|
| Fresh startup | Four nodes; requests/SM/indications default normal, signals red; absence of a fresh-start SMDL phase; initial power-input effect |
| Normal changes | Code-button queue, actual effective delays, dark transition indication and motor output pair; later indication derived from command |
| Contact-labelled inputs | Change simulated TFB bits independently; confirm whether any point indication/clearance responds, without claiming physical wiring conclusions |
| Routes/conflicts | Normal/reverse routes, opposing requests, occupancy restrictions, crossovers9/23 and neighboring interlockings |
| Cancellation/time locking | Coded stop, retained TLV, timed release and prevention of incompatible requests under the source predicates |
| Yard/local interfaces | SWICW acceptance, SWI25 permission, controlled locks17/19; distinguish permissions from endpoint proof |
| Train identity | Boundary indices11–14, detected Broadway10, ID-dependent signal gates, reverse/crossover moves and OS messages |
| Power indication | Simulated power absent/return, delayed detector update and retained/unread occupancy; no physical power test |
| Outputs | Red/green/yellow26LC and UA3 OB6 cross-node contamination; record unexpected behavior as a defect, not a pass |
| Maintenance | Restricted24R/26R overrides, bypass while SignalTest visible, panel-wide lamp test and simulated failure dialog limits |
| Lifecycle | Pause/Resume retention and repeated Run state; Resume-before-initialization and visible-SignalTest startup only as explicitly approved fault scenarios |

For each case capture preconditions, actions, source-predicted result, independently expected operating restriction, observed result and evidence. Label discrepancies and unsafe inherited behavior explicitly. Matching existing outputs does not prove a route safe or a point physically aligned. Original code edits remain excluded. The subsequently requested automated component harness is prepared separately; its narrower build/execution must be reviewed and approved rather than implicitly added to this original GUI experiment.

### Package 5 — results review and baseline decision

Produce build and simulation results with passed, failed, blocked and untested cases; do not mark unexecuted cases passed. Identify dependency/runtime/rendering/timing issues separately from logic defects. Record residual risks and whether source behavior matches operator recollection. Reassess baseline selection after the2018 comparison; do not merge or deploy anything. Select any later source repair/modernization work only after explicit review and approval.

## Communication failures: scope limitation

TestCMRI bypasses CMRI.vb and cannot validate the serial protocol, adapter failures, malformed frames or actual recovery. Phase 2 may document the static failure paths and simulate only logical input conditions. A mocked-serial/protocol harness would be a separate proposed and approved software work package, still without physical serial access. No claim of correct communications recovery can follow from passing checkbox-simulator tests.

## Hardware work remains a separate gate

Owner reports lightning damage, prolonged moisture beneath flooring/carpet and warped CTC-support timber. Board/electronics condition is unknown; comprehensive recent electrical tests are absent by owner report. Separate5 V/12 V distribution and a previously replaced failed unit do not establish serviceability.

Any later authorized recommissioning begins with de-energized inspection, isolated supply tests and individual C/MRI board tests with operational loads disconnected. Identification of the replaced unit, wiring, driver polarity and supply condition is required. No hardware work, electrical settings changes, serial connection or live commissioning is approved by this software plan.

## Information needed from the owner before Gate A

1. Preferred dedicated host/VM, available Windows/toolchain licenses/media, and who can confirm the required physical/VM isolation.
2. When ready, complete local backup paths and provenance, retaining hidden `.git`, resources and build artifacts; see [comparison requirements](HISTORICAL_BACKUPS.md).
3. Startup instructions/screenshots, last-working executable/shortcut evidence, any settling/visual checks and what indicated readiness to operators.
4. Expected representative route, cancellation and yardmaster workflows against which to judge simulation behavior.
5. Which unit was replaced, available hardware photographs/manuals and manual-point/contact wiring records for later analysis; no energization is requested now.

These are preparation inputs, not a request to begin testing. Await explicit approval of the environment-specific work package before implementation.
