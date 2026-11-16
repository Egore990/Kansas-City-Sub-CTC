# Proposed automated simulation tests

Status: test assets prepared for review; **not compiled or executed**. The owner's request to turn the guides into automated cases authorizes preparing a separate harness/catalog. It does not waive the earlier requirement to explain requirements and obtain approval before compilation experiments or execution. No original CTC software is edited, upgraded or rewritten.

## Approach

Compile the original `CTCLogic.vb` and `ICMRI.vb` into a separate component-test executable with memory-only replacements for logging, diagram refresh, SignalTest visibility and C/MRI transport. Exclude the actual serial driver and GUI entirely. Test the real routines, not a translated implementation of their algorithms. See [test-host files and proposed commands](../audit-tests/README.md).

This is a narrower alternative to the proposed full WinForms build/simulator experiment. It does not reproduce the physical panel screen or replace the need to recover the original application/dependencies later. The original checkbox simulator architecture remains documented but is not the automated host.

## Guide-to-case traceability

| Guide / area | Prepared cases exercise | Explicit limitations |
|---|---|---|
| [Signals](SIGNAL_LOGIC_PLAIN_ENGLISH.md) | All 15 wayside variables; normal/alternate aspect branches; request/occupancy/transition guards; conditional opposing traffic/time locks; identities, permissions and yellow 26LC | Component fixtures; no proof of every simultaneous route/interleaving |
| [Points and locks](POINT_LOGIC_PLAIN_ENGLISH.md) | All eight configured motor/gate channels; request acceptance/refusal; separate motor occupancy guards; active/expired movement; output pairs; locks 17/19 and the point 23 exception | Command/indication state only; no physical endpoint verification |
| [Blocks](BLOCK_LOGIC_PLAIN_ENGLISH.md) | FS1–FS10 direction assignments and retention, every documented direction-release branch with selected hold cases, documented ID transfer edges, no overwrite, detector-ID clearing and boundary 11–14 cleanup; retained slot15 | Block logic, not rendered line/arrow/bitmap assertions |
| I/O | Ten occupancy-bit mappings, power/return gating, six decoded contact bits, field motor pairs, lamp test, true-yellow output and shared-byte concern | In-memory bytes and error returns; excludes original serial protocol |
| Lifecycle/yard | Fresh assumed correspondence, repeated initialization, maintenance visibility bypass, six TLV helpers, cancellation/occupancy release and Coburg West wait/accept sequence | Injected timer states; no real elapsed-time or actual GUI tests |
| Original GUI and transport | Excluded from compilation; no screen rendering/menu execution, port connection, physical input/output or real protocol timing |

The catalog includes source/guide references for review. Counts in `audit-tests/coverage.json` are authored-case counts only; they are not proof of comprehensive state coverage or passed results. None has an observed outcome yet. Detailed UI line/arrow drawing rules remain outside this component harness even though block state logic is covered.

Prepared counts: 711 total —235 signal, 126 point/lock, 296 block/boundary, 24 I/O, 29 lifecycle and one baseline. The catalog authoring utility has been used to write data; no CTC code has been compiled, loaded or executed. Static checks validate references/schema, not behavior.

## Independent expectations and known issues

Expected constants/aspects and fixture outcomes are explicitly transcribed from the operating guides. The catalog generator does not execute or derive an alternative model from the CTC source. A constants case checks actual initialized constants against catalog literals, so expectations do not simply resolve to whatever value the module currently contains.

Most cases characterize documented behavior. Separate known-issue cases record such concerns as node3 inheriting node2's output byte, startup lacking a settling phase, retained restart state, ignored INPUTS errors, an unproved23 path at26R and maintenance bypass. Expected observations of these concerns are reported separately from passes. This preserves evidence of the original behavior without endorsing it or modifying its logic.

A successful suite would establish selected fixture behavior on the chosen runtime. It would not certify conflict-free interlocking, physical point position, detector correctness, real communications recovery or fitness to recommission. Owner-reviewed operating requirements and independent conflict invariants remain separate future work.

## Preparation and environment evidence

Read-only inspection found the installed 64-bit Framework compiler at `C:/Windows/Microsoft.NET/Framework64/v4.0.30319/vbc.exe`, version 14.8.9221.0; MSBuild file version 4.8.9221.0. The original Framework4.0 reference pack path was absent. No compiler, MSBuild experiment or application was launched during that inspection.

The proposed first experiment directly compiles only the five listed sources using the installed CLR4 runtime assemblies. This is a compatibility host on the existing 4.8.1 environment, **not a claim that the original v4.0 WinForms project builds**. No PowerPacks, package installation, framework upgrade or original-project edits are needed by the proposed host. Whether it compiles successfully is still unverified.

The wrapper records source/catalog/compiler/executable hashes and compiler arguments. Each selected case gets a fresh process, a bounded deadline and recorded assertions. Existing timer fields are injected to exercise active/expiry branches; wall-clock accuracy is not tested. Build output and results are local under ignored `audit-tests/.artifacts/`.

## Approval requested before the first experiment

The concrete proposed scope is:

1. Compile the separate component host on this computer with the identified installed compiler and runtime references, using the command in the test README; do not compile/change the original project or install dependencies.
2. If compilation succeeds and execution is approved, run the **baseline category only** first. Review errors before moving to the signal category and then point/block/I/O/lifecycle batches.
3. Use only memory I/O and stand-ins. Never include `CMRI.vb`, original GUI menus or any historical executable, and never open/query physical serial devices.
4. Record results and stop for review if compiler incompatibility, harness errors or unexpected behavior require changes. No original-source fix, backup merge or live railway test is authorized.

The approval flag in the script is an administrative guard, not proof that approval has been given. Do not execute these commands until the owner approves the scope. A separate approval is required for the full original-application build/UI experiment or hardware work.
