# C/MRI communications

Baseline and confidence conventions: [system overview](SYSTEM_OVERVIEW.md). This document describes the implementation, including defects, rather than assuming every comment is accurate.

**Recovered-version supplement, 17 November2026:** [BACKUP_COMPARISON.md](BACKUP_COMPARISON.md) records identical uncommitted edits in both archived projects: a module-owned port on COM2/19,200, a50 ms post-poll wait and success-guarded input decoding. The following COM4/9,600 configuration and failure-path descriptions remain specific to the2016 baseline. Node/bit mappings and packet framing are unchanged; neither version implements demonstrated stop-on-disconnect behavior. Saved JMRI settings use COM2/9,600, requiring physical-setting verification rather than an assumed baud rate.

## Transport and configuration

`CMRI.vb` imports `System.IO.Ports` and implements `InterfaceCMRI` (`ICMRI.vb:1–6`). There is no external C/MRI communications DLL or active MSComm COM reference. Many comments still say “MSComm”; actual calls use the framework `SerialPort` owned by `MainPanel`.

| Setting | Actual configuration | Source |
|---|---|---|
| Port | Hardcoded `COM4` | `CTCLogic.vb:596` |
| Rate | `BAUD100=96`, multiplied by 100 → 9600 baud | `CMRI.vb:65–70` |
| Format | 8 data bits, no parity, one stop bit, no handshake | `CMRI.vb:68–72` |
| Buffers | Requested read/write size 128; logical maximum 128 in input calls | `CMRI.vb:76–81`; `CTCLogic.vb:596,655` |
| Retry parameter | 2000 loop iterations per received byte | `CTCLogic.vb:599–613,655–736` |
| Node type | `M` (SMINI) only in initialization | `CMRI.vb:147–152,174–183` |
| Nodes | UA 0,1,2,3; delay 0; 3 input bytes; 6 output bytes each | `CTCLogic.vb:597–613` |

`InitializePort` accepts COM1–COM6 and baud values 9600, 19200, 28800, 57600, 115200. Its error text mistakenly lists 228 rather than 288. It validates a maximum buffer of 1–262, closes an already open port, opens it and discards both buffers (`CMRI.vb:12–83`). Driver minimum buffer sizes may exceed requested sizes; 128 is not a measured hardware FIFO size.

The physical serial converter, RS-232/RS-485 arrangement, isolation, termination, adapter driver and installed board jumpers are **unknown**. The protocol code does not establish electrical compatibility.

## Packet implementation

`TransmitPackage` (`CMRI.vb:476–559`) constructs:

```text
FF FF 02 (UA + 65) TYPE [escaped payload] 03
sync  STX address   I/P/T                  ETX
```

Payload bytes 02, 03 and 10 hexadecimal are prefixed with DLE 10 hexadecimal. Thus a literal DLE is doubled. Arrays are VB arrays used from index 1; the write call starts at offset 1, intentionally skipping element 0. Address bytes for UA 0–3 are hexadecimal 41–44. There is no checksum or CRC in this implementation and no output acknowledgement check.

| Message | Payload/processing | Source |
|---|---|---|
| `I` initialize (73 decimal) | `M`, delay high byte, delay low byte, number of oscillating two-lead signals; then six CT masks if signal count >0 | `CMRI.vb:228–270` |
| `P` poll (80) | No payload | `CMRI.vb:294–303,509–513` |
| `R` receive (82) | Receiver seeks STX, verifies `UA+65`, verifies R, reads three DLE-unescaped bytes and ETX | `CMRI.vb:305–373` |
| `T` transmit (84) | Six packed output bytes | `CMRI.vb:375–401` |

Nodes 0–2 use zero oscillating signals and CT=0. Node 3 uses eight, CT(4)=FF and CT(5)=FF; other masks are zero (`CTCLogic.vb:597–613`). This marks all paired bits in output bytes 4 and 5 for oscillation, including the later 26LC encoding location. A comment says 00111111 for the second mask but the executable assignment is FF. Actual LED/driver type must be reconciled before changing masks.

Despite generic USIC/SUSIC comments, `INIT` rejects node definitions other than M and requires precisely 3/6 bytes. USIC/SUSIC support is not implemented end to end. Initialization validation logs errors but still reaches transmission; `UA<0` is not rejected, and `DL` conversion uses `CInt(DL/256)` rather than explicit integer quotient. Delay zero is unaffected. The local initialization buffer is cleared after transmission; that does **not** send zero field outputs.

## Polling and control cadence

`ReadRailroad` sequentially polls 0,1,2,3 and unpacks each reply into globals using the same `IB` array (`CTCLogic.vb:650–767`). `WriteRailroad` writes 0,1,2,3 using the same `OB` array (`2591–2596`). Every normal control cycle writes full node outputs, not only changes.

The real backend menu runs initialization and one control cycle immediately, then enables a nominal 100 ms UI timer (`MainPanel.vb:47–55`). Simulation uses 10 ms (`39–45`). The tick disables the timer during the cycle to reduce re-entry (`63–68`). Actual cadence includes blocking communications and UI work and is not a fixed 10 Hz field scan. Flash/code pulses count cycles, so their rate changes with backend/performance. Most operating delays count changes in wall-clock seconds (`TimerCount`, `CTCLogic.vb:2532–2590`), without catching up missed seconds.

## Input processing and outputs

See the [complete known mapping](HARDWARE_IO_MAPPING.md). Bit extraction uses integer division by powers of two followed by masks. Switch positions use positive normal/reverse contacts (1/2); zero is an invalid or intermediate switch state. Signal levers use right=1, left=2, stop=0. Occupied=1 and clear=0 are software meanings; electrical detector polarity upstream is not established.

Node 2 input byte 2 is read as the **whole** `PWRIND` value, not masked bit 0. If it is zero the two-second power-return timer is restarted. Detectors at node 3 are updated only when `PWRIND=1` and that timer has expired (`CTCLogic.vb:726–757`). Occupancy is retained otherwise; it is not forced to occupied or unknown. If another bit in this power byte is high, equality with 1 fails.

Turnout outputs are paired normal/reverse commands (`TUN=1`, `TUR=2`). Wayside signal aspects are packed into two-bit head fields, with a later separate true-yellow output for 26LC. These are logic-level assignments to drivers, not proof that SMINI pins may directly supply a motor or signal. No EasyDCC command or traction control is sent here.

## Error detection and recovery limits

| Mechanism present | Limit/implication |
|---|---|
| Checks for bad source address, wrong message type, missing DLE/ETX | Bad address or unescaped STX/ETX can repoll; repeated malformed replies can loop indefinitely |
| Per-byte busy-loop limit 2000; receive buffer overrun detection | CPU/UI-dependent, not a real elapsed timeout; the limit resets per byte |
| `ABORTIN`, `INTRIES`, return codes and log messages | Callers discard `INPUTS`, `OUTPUTS`, `INIT` return codes; `InitializePort` result is assigned but not acted on |
| Discard input buffer before each poll | May discard late replies; no atomic valid-frame buffer commit |
| Output error variable | `TransmitPackage` explicitly leaves it as a placeholder always zero, absent exception |
| Wait for `BytesToWrite=0` | Busy wait with `Application.DoEvents`; no explicit deadline/acknowledgement |

`iReceiveByte` (`CMRI.vb:402–473`) calls `Application.DoEvents` twice within its loop. This permits menu actions while inside serial work despite timer guarding. Serial open/read/write exceptions have no local catch/reconnect policy in this code. There is no demonstrated automatic port reopening, failed-node quarantine, last-valid sample timestamp, all-stop on timeout, hardware watchdog programming or acknowledgement that points physically moved.

**Critical inference:** a failed/partial poll can leave the shared `IB` partly updated or containing another node's bytes; the caller still unpacks it. A field loss therefore need not produce restrictive signalling. Stopping the UI timer leaves hardware output retention to the boards/electronics. See [interlocking findings](CTC_INTERLOCKING.md).

## Initialization/reset behavior

`InitializeRailroad` initializes software constants and controls, road traffic-light state and all nodes (`CTCLogic.vb:577–614`). Software starts with signals at red, requested levers at stop/normal, motors normal, locks locked and traffic directions unset (`479–575`). The first loop subsequently reads inputs and writes commands; startup can command turnouts normal. An SMINI I packet is initialization, not a verified emergency reset. Re-running the Run command repeats initialization. Pause/Resume do not reset field equipment; Exit uses VB `End`. No dedicated emergency all-stop/reset transaction was found.

The [startup supplement](STARTUP_INITIALIZATION.md) traces the exact sequence and default objects. “Start Layout” is the reported historical name; this source labels the action “Run with CMRI…”, and equivalence is unverified. Fresh startup does not start SMDL because commanded/requested/indicated positions already agree. Six contact-labelled inputs are decoded but unused for point verification; actual auxiliary-contact wiring remains unknown. Initialization success is not enforced by a readiness gate.
