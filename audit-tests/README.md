# Automated CTC component tests — prepared, not executed

This separate test host exercises the **unchanged** audited `CTCLogic.vb` through explicit, guide-derived scenarios. It is not a replacement CTC engine. No compilation or test execution has been approved/performed as part of preparation. The original WinForms project, serial driver, signalling and initialization files remain unchanged.

See [automated test proposal](../docs/AUTOMATED_SIMULATION_TESTS.md) for scope, limitations and approval requirements. Preparing these test assets does not authorize executing them or adopting a different application/runtime baseline.

## What is compiled after approval

Only these five source files:

| File | Role |
|---|---|
| `../CTCLogic.vb` | Original calculations/control loop, linked without editing |
| `../ICMRI.vb` | Original transport contract |
| `HostStubs.vb` | Memory-only logs and refresh counter; a Boolean stands in for SignalTest visibility |
| `MemoryCmri.vb` | Fake input bytes, error returns and captured output bytes; no port is constructed/opened |
| `AutomationRunner.vb` | Applies a named XML fixture, invokes allowlisted original routines and compares explicit expectations |

**Excluded:** original `CMRI.vb`, `MainPanel.vb`, form designers, application startup framework, serial menus, real TestCMRI/checkbox forms, PowerPacks and historical executables. `SerialPort` appears only as the original interface's parameter type; the host passes Nothing and the fake rejects any non-Nothing port. There is no real driver or original GUI menu to activate accidentally in this executable.

One child process runs one case. Original global state cannot leak between cases. An explicit `Reinitialize` case deliberately repeats initialization within its own process to characterize retained state. The wrapper imposes a 20-second deadline per process and records unexecuted remainder cases after infrastructure errors.

## Test catalog and evidence

`fixtures.json` contains the explicitly transcribed route, point, direction and transfer fixtures. The dependency-free Node authoring utility `generate_cases.mjs` expands them into `cases.xml` and `coverage.json`. **Generating the catalog does not execute test cases.** The generator does not read/translate/evaluate CTCLogic or compute a parallel interlocking model. Expected constants are literal values from the guides; a baseline case separately asserts the original module's actual constants against those values. XML expectations are not computed by rerunning the same expression being tested.

The prepared catalog currently contains 711 cases: 235 signals, 126 point/lock, 296 block/boundary, 24 I/O, 29 lifecycle and one baseline. No case has run against the CTC logic. Authoring and static schema/reference checks are separate from compilation or simulation execution.

Each case records an ID, category, device, plain-English summary, source reference and guide. Steps are state assignments, fake input bytes, allowlisted calls and expected values; selected output assertions extract fields using the documented bit mapping. A guard-denial case changes one logical condition where possible; multi-input conflict predicates use the necessary combined fixture.

`coverage.json` counts **authored scenarios**, not executed/passed tests, statement coverage or exhaustive state combinations. Categories are baseline, signals, points/locks, blocks/boundaries, I/O and lifecycle/yard/time locking. The code's rendered diagrams and pixel/resource choices are not covered by this host. A full WinForms build/UI run would be a separate approval.

Case classifications:

- `characterization`: expected behavior transcribed from the audited source guides. A match demonstrates that fixture's behavior, not that the rules themselves are safe.
- `known-issue`: deliberately observes a documented weakness or incomplete behavior. A match is reported **observed-known-issue**, separately from passes. It is never a safety acceptance result. A mismatch is reported for review rather than silently updating the expected value.

Future independent operating/safety requirements should be reviewed separately with the owner. Do not convert inherited behavior into an approved safety requirement merely because a test matches it.

## Proposed build environment

The wrapper directly invokes the installed Windows Framework64 `vbc.exe` using that directory's runtime assemblies. File metadata inspection found compiler version 14.8.9221.0 and MSBuild4.8.9221.0, but no Framework4.0 targeting pack. The compiler has **not** been invoked. This proposes a CLR4 compatibility experiment on the installed 4.8.1 environment; it is **not** a reproduction/build of the original application's v4.0 project. No dependency downloads, installations, project conversion or retargeting are included.

This component host removes the PowerPacks/WinForms prerequisite for logic characterization. It does not resolve that prerequisite for restoring the original application. Compiler/runtime compatibility is unverified until an approved build attempt. Stop on compilation failures and report them; do not automatically edit the original source to make it build.

## Proposed commands — do not run before owner approval

Run from the repository root using PowerShell 7. The `-Approved` switch records approval obtained outside the script; it does not grant approval itself. Approval must explicitly cover this host/runtime and compilation and/or execution. The initial suggested execution batch is baseline, followed by signals after reviewing its result, not an implicit full-suite run.

```powershell
# Build only, after approval of compilation on this host.
./audit-tests/Invoke-AuditTests.ps1 -Approved -Build

# Use the exact generated build directory reported by the approved build.
# Separate execution approval is needed if the original approval was build-only.
./audit-tests/Invoke-AuditTests.ps1 -Approved -Run -BuildDirectory '<recorded directory>' -Category baseline
./audit-tests/Invoke-AuditTests.ps1 -Approved -Run -BuildDirectory '<recorded directory>' -Category signals

# Later approved batches: points, blocks, io, lifecycle (or explicitly approved all).
```

The wrapper validates pinned original-source hashes, hashes all compiled source/catalog inputs, records compiler version/hash/arguments and executable hash, and refuses to run mismatched artifacts. Only recorded binaries under this folder's ignored `.artifacts/` directory may be launched. It does not delete any files or change the original project.

The baseline and guide pins are byte hashes from this reviewed workspace. A fresh checkout with different line endings can require a deliberate manifest review even if a text diff is empty; do not bypass the pin automatically. Runtime-reference hashes and authoring provenance are also recorded for each approved build.

Each case produces an assertion XML result. A run summary records pass/fail/observed-known-issue/error and not-run cases; `safety_acceptance` is always false. Compiler failures, process timeout or invalid result output do not become passes. Results stay local; do not publish archive material, binaries or reports without authorization.

## Limits requiring separate work

- Actual serial framing, corruption, adapter disconnect/reconnect and `CMRI.vb` recovery are excluded. Fake INPUTS errors only test how the control module consumes error returns/shared data.
- Motor delays are tested by setting existing timer values to active/expired states and calling the unchanged routines. No clock replacement or timer rewrite is introduced; real elapsed timing/jitter is not tested.
- No physical motor travel, contact polarity, point correspondence, current, detector reliability or hardware watchdog is established.
- Not all reachable scan interleavings or simultaneous route combinations are enumerated. Direct state fixtures can also represent component states whose physical reachability requires separate validation.
- Actual UI rendering, menu guards, pause/exit handlers and the Resume-before-Run GUI path are excluded. The Boolean maintenance stand-in tests the control-loop visibility branch only.
- The unreceived2018 backup is not tested. A different source requires a reviewed comparison and deliberately updated manifest/catalog, not a silent hash bypass.
