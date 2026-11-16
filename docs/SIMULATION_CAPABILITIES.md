# Simulation and offline validation

Baseline: [overview](SYSTEM_OVERVIEW.md). **The source supports exercising the actual CTC logic without a physical C/MRI connection.** This is an architectural finding; no build or simulator run was performed.

The owner-requested next step is preparation, not execution. See the [unapproved Phase 2 plan](PHASE_2_BUILD_SIMULATION_PLAN.md) for isolated-environment prerequisites, build/launch approval gates, characterization scenarios and evidence requirements. Reported2018 simulator files remain unavailable and unverified; do not assume their behavior matches this source. Serial failure recovery cannot be certified with the existing checkbox backend.

The owner has since requested automated tests based on the operating guides. A separate [component test host/catalog](AUTOMATED_SIMULATION_TESTS.md) is now prepared: 711 cases against the original control module with memory transport and UI stand-ins. It avoids checkbox automation, real serial code and PowerPacks, but does not exercise the actual rendered panel or serial driver. No compilation/test execution has occurred; the proposed first experiment is pending approval.

## How it works

`MainPanel.RunWithCMRISimulatorToolStripMenuItem_Click` (`MainPanel.vb:39–45`) selects `New TestCMRI`, calls the normal `InitializeRailroad` and control loop and sets a 10 ms timer. The live menu instead selects `New CMRI` with a100 ms timer. Both use `InterfaceCMRI` (`ICMRI.vb:1–6`).

`TestCMRI.InitializePort` is empty and does not open the passed SerialPort (`TestCMRI.vb:30–35`). Its INIT creates a CMRISimulator form per address and shows it (`15–28`). INPUTS/OUTPUTS look up the collection element at UA+1 and transfer arrays (`37–48`). Implicit function returns yield default Integer zero; they do not validate protocol or node parameters. Nodes are assumed initialized in ascending contiguous order. Collection-key conversion is implicit with Option Strict Off; arbitrary sparse/reordered nodes are not demonstrated.

Each node form has three groups of eight input checkboxes and two groups of24 output buttons (`CMRISimulator.vb:13–42,55–73`). Checked means input bit1; output bit1 is colored green. The button handler is empty (`ButtonArray.vb:57–59`): clicking an output does not toggle railway state. The form constructors instantiate collections in `CMRISimulator.Designer.vb:39–68`; their absence from the main .vb file is not a missing initialization defect.

Node0 normal lever contacts default checked (`CMRISimulator.vb:75–105`). Signal inputs initially stop, code buttons unpressed. Power indication at node2 starts unchecked; a future operator must check its power input and permit the return timer to expire for node3 detector checkboxes to be consumed. The label “Power Off Indicator” is misleading relative to the actual `PWRIND=1` enable test.

## Capabilities versus limits

| Can exercise logically | Does not establish |
|---|---|
| Physical panel contact patterns, code button scheduling and delayed indications | Real contact bounce, voltages or exact field wiring |
| Block occupancy and train movement/ID propagation | Detector noise/filter behavior, rolling-stock detection reliability |
| Route acceptance, conflicting requests, traffic-stick retention, cancellation/time locking | Exhaustive conflict safety or hardware-independent protection |
| Yardmaster acceptance and local turnout25 permission | Actual local interlocking circuitry |
| Signal head packed outputs and maintenance bypass | LED current/polarity, SMINI oscillator behavior, burned-out lamps |
| Commanded turnout state and software transit delay | Real point position, motor stall, mechanical travel time |
| Fast clock and OS messages | Timing accuracy under real serial load |

It is an in-process bit-level test double. It does **not** feed serial bytes, verify framing/DLE, model bad packets/timeouts or exercise CMRI.vb. It does not automatically move trains, propagate occupancy, actuate feedback contacts or assert expected outputs. Manual checkbox manipulation is required. Multiple contradictory contacts can be checked simultaneously. Simulator labels include stale assignments; use [executable mapping](HARDWARE_IO_MAPPING.md).

`CTCSimulator.vb` is empty; its designer creates only a hidden empty TabControl and MDI host (`CTCSimulator.Designer.vb:24–50`). History commit `8f6493d` describes an attempt to put the simulator into tabs; current TestCMRI still opens separate forms. It is not a complete autonomous railway simulator.

## Proposed first validation set — requires later approval

No scenarios below have been run. Build prerequisites and approval boundary are in [restoration options](RESTORATION_OPTIONS.md).

| Scenario | Expected behavior to check against source |
|---|---|
| Clean simulator startup | Four forms; normal turnout requests, red wayside aspects, no unintended live port access |
| Startup timing versus ordinary movement | Fresh startup assumes normal correspondence without SMDL; distinguish from a later change that blanks indication and runs SMDL. Record command/indication behavior without treating it as physical point proof |
| Code button for signal4 | Delay, accepted request, occupied BK9 refusal, proper branch selection with switch3 |
| Turnout transition | Indication dark during SMDL; motor bits valid; route held red during transition |
| Opposing mainline requests | FS/TLV prevent conflicting directions through both normal and crossover alignments |
| Signal cancellation | Coded stop returns red, incompatible point request held until run time expires |
| OS occupied | Signal request/TLV reset, occupancy indications and train IDs advance as intended |
| Crossovers9 and23 | Both affected blocks and all combinations of neighboring requests tested |
| Coburg West | Reverse11 route held until SWICW accept; train passes and status clears |
| Coburg East | SWI25 permit and TrainID(12) prerequisites; 26LC red/green/yellow bytes inspected |
| Local permissions and controlled locks | Exercise SWI25, SWICW and dispatcher lock17/19 paths separately; do not treat generic unused HAND handling as a configured local-point interface |
| Undetected boundary entries | Correct TrainID index; labels alone do not count as state entry |
| Power indication off/return | Detectors freeze then update only after exactly-one power byte and return delay |
| Signal test / lamp test / pause | Document bypass and output retention; no assumption of safe stop |
| Restart Run in same process | Identify stale scheduling/TLV/timer/simulator-window state |

The simulator cannot verify disconnected/bad serial behavior. A separately approved mocked-serial or isolated loopback harness would be needed, without loading operational outputs. Any future comparison with modernization/replacement should capture output/state traces from the preserved baseline and independently defined conflict expectations; matching existing behavior alone would preserve existing defects too.
