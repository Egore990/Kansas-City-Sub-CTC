# Maintenance and diagnostic tools

Baseline: [overview](SYSTEM_OVERVIEW.md). All named tools are compiled into the **same WinExe**. There are no separate utility projects/entry points. No tool was executed during this audit.

| File/tool | What it actually does | Independent use / limits |
|---|---|---|
| `DlgSigMaint.vb:5–27` | Reads/writes only `SIGF4L` through CheckBox2 | Depends on CTC globals; not a standalone repair/reset program |
| `SignalTest.vb:9–68` | Four dropdowns directly change A/B head fields in SIG24RAB and SIG26RAB, offering red/yellow/green | Same application/backend; no independent serial engine; dangerous in live mode because route protection is suspended |
| `TestCMRI.vb:1–49` | In-memory `InterfaceCMRI` backend; creates four simulator forms; inputs read checkboxes, outputs color buttons | Test double, **not a hardware communication tester** |
| `CMRISimulator.vb:13–73` | Per-node 24 checkbox inputs and 48 colored output bits with labels | Integrated form; can represent bits without hardware, but not a protocol emulator |
| `CTCSimulator.vb:1–3` | Empty class; designer contains hidden TabControl, MDI host | Unfinished UI container; not a functioning second simulator |
| `DlgSysParam.vb:16–23` | Displays four delay parameters | MainPanel copies text back to global Integers after OK; no validation/persistence |
| `MainPanel.vb:99–107` Lamp Test | Toggles LAMPTEST; WriteNode0/1 replace six bytes each with FF | Panel output test, including non-lamp lines on those nodes; not a wayside-only lamp test |
| `MainPanel.vb:57–77` Pause/Resume | Stops/restarts control-loop timer | Not an emergency stop; outputs are not commanded restrictive |
| `CTCLogic.vb:3109–3121` logs | Appends PC-time diagnostics and fast-clock OS movement messages to textboxes | No file-based durable logging/export implementation found |

## “Repair Signals” is simulated failure control

The designer shows ten signal failure checkboxes and instructs the operator to clear them to repair lamps (`DlgSigMaint.Designer.vb:83–183`), but code only handles signal4 left. The other nine boxes have no implementation in this dialog. Setting CheckBox2 sets the failure flag; clearing resets it. It does not measure lamp current, identify broken wiring or physically repair/reset a signal driver.

`SimSignalFailure` (`CTCLogic.vb:3134–3153`) checks every nominal minute. It generates an integer from 1 through100 then asks whether it is >100, so its random failure trigger is effectively disabled. If SIGF4L is already on, it assigns SIG4LAB=DRK at the periodic check. Route calculation overwrites the aspect each cycle before this check, so sustained darkness is not established. This is incomplete simulated failure behavior, not real lamp monitoring.

## Signal test mode

Opening the SignalTest form activates a visibility-based mode switch in `DoOneControlCycle` (`CTCLogic.vb:232–260`). SignalTest changes only 24R A/B and26R A/B fields, despite the broad title. Closing it restores normal route calculations on following cycles; there is no explicit save/restore transaction or all-red action in its OK handler (`SignalTest.vb:3–7`). Inputs and turnout processing continue while the form is open. It must not be assumed safe for live troubleshooting merely because “maintenance” appears in the menu.

## Existing troubleshooting capability

- Simulator bit displays let a maintainer trace panel inputs to motor/signal/panel outputs without serial traffic.
- The real CMRI backend logs bad addresses, malformed messages, input retries and buffer overruns (`CMRI.vb:305–370,402–473`). It lacks a robust health summary and callers ignore errors.
- `PSCTRL` logs out-of-correspondence and starts a delay; this reports logical mismatch, not proven motor failure (`CTCLogic.vb:1293–1318`).
- A special block10 state-change log comments that recommended RC filters eliminated observed detector messages (`CTCLogic.vb:750–754`). This is evidence of past noise mitigation, not confirmation filters remain intact.
- Code sound, traffic directions, field/dispatcher annunciators and power-off lamp have explicit output paths useful for future bench verification.

## Reset/testing gaps

The owner recalls an operator “Start Layout” startup command. This snapshot exposes “Run with CMRI…”; the [startup supplement](STARTUP_INITIALIZATION.md) traces that action and records the name/version discrepancy without assuming identity. It sets commanded/default states, not measured physical point positions, and does not start a fresh-start settling timer.

No dedicated safe all-signals-stop-and-lock command, per-node communications reset utility, automated turnout exercise, board loopback test, fault localization suite or retained fault history was found. Reinitialization sets software defaults and sends I packets; its next live scan can command all motors normal. It is not a substitute for a controlled reset procedure. Lamp test drives all panel node bits high. The existing tools require review against actual wiring before live use.

For future approved work, first validate these tools in a disconnected simulator, then define explicit limited bench procedures. The proposed procedures in the [roadmap](RESTORATION_ROADMAP.md) are future work, not actions performed or approved here.
