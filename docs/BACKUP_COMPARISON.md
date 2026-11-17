# Original-PC backup comparison — 17 November 2026

**Result:** the nested `KCSubCTC/Kansas-City-Sub-CTC` folder is the strongest recovered restoration candidate. It contains the same source as the other archived project, plus the application EXE, matching-identity debug symbols, PowerPacks 12 DLL and application icon. Preserve it separately from the GitHub baseline; adopting it, building it or running it still requires review and approval.

The owner identifies the backup as the last working system before moisture damaged the computer power supply. That is owner-confirmed provenance for the backup as a whole. It does not independently identify the executable actually launched on the railway, or prove that every archived source file produced that executable.

## Scope and evidence

Inspection was read-only against `C:\Users\ljwmm\OneDrive\CTC\CTC machine backup`. Reports, manifests and analysis copies of Git objects were written outside OneDrive, in the workspace's `backup-analysis` directory. No historical application, installer, compiler, simulator or railway logic was executed. No serial port was accessed. No source was changed, merged, installed or published.

| Identifier | Inspected location / meaning |
|---|---|
| GitHub baseline | `Egore990/Kansas-City-Sub-CTC`, `master` = `0a561b3f8de459a787795a16da4c987868d4ae79` |
| A | `CTC machine backup/Kansas-City-Sub-CTC` |
| B | `CTC machine backup/KCSubCTC/Kansas-City-Sub-CTC` |
| Owner-confirmed | Operational history supplied by the owner, not independently tested |
| File-confirmed | Direct enumeration, content/hash comparison, source reading or metadata inspection |
| Inference | A conclusion supported by those observations, with its limitations stated |

Live, read-only `git ls-remote` confirmed the baseline `master` commit above on 17 November 2026. The remote audit branch was `b39c8d8d7c2099cf0064c4c039b084bb5fafb39a`. Local audit documentation and the prepared, unexecuted test harness are later additions, not differences in the original application.

Line references prefixed **B** below refer to the recovered files in B, counted from one. The existing Phase 1 guides retain their original GitHub-baseline line references.

## Inventory and completeness

The broad backup enumerated **33,730 files, 5,406,436,879 logical bytes** (about 5.04 GiB), with no directory-enumeration errors. This is a metadata inventory of the broad backup, not a hash or integrity verification of all 5 GB. Installed-software folders, installers, JMRI profiles and two CTC project trees are present. It has not been established as a complete, bootable Windows disk image or reproducible development environment.

Both CTC project trees were hashed in full, including hidden Git files and available build artifacts:

| Measure | A | B |
|---|---:|---:|
| Files | 133 | 141 |
| Logical bytes | 2,008,675 | 2,811,937 |
| GitHub baseline tracked files present, out of 104 | 103 | 104 |
| Baseline files byte-identical to audited working copy | 101 | 102 |
| Baseline files changed | 2 | 2 |
| Baseline files absent | 1: `Resources/KCSubCTC.ico` | 0 |
| `bin/Debug/KCSubCTCV3.exe` | Absent | Present, 240,640 bytes |
| `bin/Debug/Microsoft.VisualBasic.PowerPacks.dll` | Absent | Present, 269,568 bytes |

Twelve B image reads initially failed with OneDrive cloud errors. All twelve succeeded on retry and matched their baseline hashes. They are **not** remaining missing or changed files. A synced directory entry alone did not establish that its bytes were immediately readable.

A final full rehash of all274 project files found no changed or unreadable files, and re-enumeration retained the same133/141 counts. This is stability evidence across the two inspections, not a guarantee against future OneDrive synchronization changes.

All common application source, designers, project/solution files, resources, user settings and maintenance/simulation components are byte-identical between A and B. The only changes from GitHub application files are `CTCLogic.vb` and `CMRI.vb`; these changes are identical in A and B. Of the project's 24 VB Compile items, 22 are unchanged from GitHub.

Both projects still reference the absent `Resources/TurnoutBlank1.png` as a `None` item. This was already absent from GitHub and is not supplied by either backup. All 24 Compile and seven EmbeddedResource item paths exist in B; A additionally lacks the icon used by `ApplicationIcon`. This is static path evidence, not a successful build. B's file-backed resources match the audited baseline, whose referenced resource files resolve.

### Differences between the two backups

There are eight B-only files and five differing common files; there are no A-only files.

| B-only files | Significance |
|---|---|
| `bin/Debug/KCSubCTCV3.exe` | Recovered application |
| `bin/Debug/KCSubCTCV3.vshost.exe` and `.vshost.exe.manifest` | Visual Studio hosting artifacts, not the standalone application's normal entry point |
| `bin/Debug/Microsoft.VisualBasic.PowerPacks.dll` | Required referenced dependency |
| `obj/Debug/KCSubCTCV3.exe` | Byte-identical to B's bin EXE |
| `obj/Debug/DesignTimeResolveAssemblyReferences.cache` | IDE/build cache |
| `obj/Debug/TempPE/My Project.Resources.Designer.vb.dll` | Design-time resource assembly |
| `Resources/KCSubCTC.ico` | Icon required by the unchanged project configuration |

Differing common files are `.vs/KCSubCTCV3/v14/.suo`, bin and obj copies of `KCSubCTCV3.pdb`, `obj/Debug/DesignTimeResolveAssemblyReferencesInput.cache`, and `obj/Debug/KCSubCTCV3.vbproj.FileListAbsolute.txt`. These are IDE, symbol or build-history differences, not additional source revisions.

## Source differences and their meaning

### C/MRI port ownership and configuration

| Behavior | GitHub baseline | Recovered A and B |
|---|---|---|
| Serial object | Designer-owned `MainPanel.CommPort` | Module-level `CTCLogic.comPort`, newly constructed in `InitializeNodes` |
| Port | COM4 | COM2 |
| Baud | 9,600 | 19,200 |
| Framing | 8 data bits, no parity, one stop bit, no handshake | Unchanged |
| Node addresses | 0, 1, 2, 3 | Unchanged |
| Input/output size per node | Three input bytes, six output bytes | Unchanged |
| INIT argument `MAXTRIES` | 2,000 | 5,000 |
| Input-call `iMaxTries` | 2,000 | Unchanged |

References: B `CTCLogic.vb:203`, `InitializeNodes:589–623`, especially `598–605`; B `CMRI.vb:68–83`. A commented-out COM2/9,600 call remains at B `CTCLogic.vb:600`; the active call at `601` specifies 19,200. No hardware setting was changed by this audit.

The increased INIT argument does not establish a longer successful initialization/retry handshake: `MAXTRIES` is not used by the body of `CMRI.INIT` (B `CMRI.vb:88–275`). Initialization still sends the existing packets without proof that each node accepted them.

Every `ReadRailroad` input call and each `WriteNode0` through `WriteNode3` output call now receives the module-level serial object. The packet framing, node types, CT configuration bytes, bit assignments and output packing have not otherwise changed.

**Lifecycle risk inferred from source:** repeating real-hardware initialization replaces `comPort` with a new object without first explicitly closing the previous object. `InitializePort` only closes the object it receives if that object is already open. The previous object may therefore retain the port until disposal/collection, causing a later open to fail. This has not been reproduced. The source has no newly added exception recovery or orderly restrictive shutdown.

### Failed input reads

B `CTCLogic.vb`, `ReadRailroad:658–780`, now unpacks a node's bytes only when `INPUTS(...) = 0`. The guards are at `663`, `692`, `728` and `745`.

1. Poll a node using the existing protocol.
2. If the call returns success, unpack that node's inputs as before.
3. If it returns an error, skip that node's decoding and retain the previous decoded lever, detector, request or power state.
4. Continue the existing control cycle; there is no added general communications alarm, inhibit, forced occupied state, restrictive signal write or reconnect sequence.

This addresses an important GitHub-baseline defect: decoding partial/stale shared input bytes after a reported failure. It does **not** make a stale clear detector value safe or prove current turnout position. The shared byte buffer can still be partly overwritten inside `CMRI.INPUTS` before an error; the new guard prevents that failed call's decoding, rather than making the underlying read atomic.

Node 0's existing `IB(1) <> 0` decoding condition remains. The node 3 occupancy update still additionally requires `PWRIND = LTON` and expiration of `TD(19)`. No new freshness timer was added. Exceptions from serial operations are separate from returned error codes and are not caught by these guards.

### Poll timing and buffer handling

B `CMRI.vb:299–312` additionally:

- Assigns the supplied port to a shared `_serialPort` field.
- Discards the output buffer before transmitting a poll, in addition to the existing input-buffer discard.
- Sleeps for 50 milliseconds after sending each poll.

Four sequential successful polls therefore add at least approximately 200 ms of intentional waiting per complete read pass, before other processing or retries. This runs in the existing GUI control loop; its nominal 100 ms timer interval is not a guaranteed full scan period. The added wait is a communications delay, **not** a turnout-settling or feedback-confirmation delay.

Thread-start/join lines are comments. `ReadReady` at B `CMRI.vb:384–388` performs no useful waiting and has no active call. These edits do not implement background polling. Discarding pending transmit bytes warrants later protocol testing; whether any actual command was lost cannot be established without an approved disconnected communications experiment or capture.

Other `CMRI.vb` edits remove explicit VB line-continuation underscores from multi-line signatures. The public interface file is unchanged.

## Signals, points, blocks and startup

Procedure-level comparison found **39 existing CTCLogic routines: 33 unchanged and six changed**. The changed routines are `InitializeNodes`, `ReadRailroad` and `WriteNode0`–`WriteNode3`. The latter four change only the serial-object argument. The new global serial declaration is outside those routine counts.

| Area | Recovered-source finding |
|---|---|
| Signal aspects / route conflict predicates | Unchanged from the documented GitHub rules |
| Turnout alignment, software locks and time locking | Unchanged |
| Block/traffic-stick/train-ID algorithms | Unchanged; input acquisition now has success guards |
| Motor/indication timers and debug overrides | Unchanged |
| Input/output board mapping | Unchanged |
| Feedback-labelled inputs `TFB3/7/9/11/15/23` | Still read, with no new effective use to prove motor correspondence |
| Node 3 output-byte carryover concern | Still present; no fix in recovered source |
| Initialization defaults | Same normal point commands/indications, restrictive signal defaults and locked initial state |
| “Start Layout” command | No new literal command found; the same Run with CMRI handler remains |
| Startup movement wait / initialization-complete proof | No new mechanism |

Examples of unchanged routines in B: `DoOneControlCycle:213`, `InitializeConstants:279`, `InitializeOSSections:466`, `InitializeControls:482`, `InitializeRailroad:580`, `PSCTRL:1262`, `RouteCheckEast:1335`, `RouteCheckWest:1463`, `CNTLELOCK:1726` and `ClearTrafficSticks:2610`.

B `MainPanel.vb:47–55` still selects the real backend, initializes the railway, performs a control cycle and enables the timer. `InitializeRailroad:580–588` preserves the initialization sequence. The owner-recalled startup action is therefore consistent with the same initialization behavior, but its remembered name remains unverified. Port setup/input-error behavior differs as described above.

The existing plain-English guides remain applicable to the aspect/route/point/block algorithms. Their GitHub line references and descriptions of unsuccessful input reads must be read alongside this supplement; error-path behavior is version-specific. Neither version establishes that commanded and physical turnout positions agree.

## Maintenance and simulation

`DlgSigMaint.vb`, `SignalTest.vb`, `TestCMRI.vb`, `CMRISimulator.vb`, `CTCSimulator.vb` and their present designer/resource files match GitHub. No additional standalone VB maintenance project or full CTCSimulator implementation was identified in the backup project trees. The earlier maintenance limitations and signal-test bypass behavior remain.

The simulator menu still uses `TestCMRI` (B `MainPanel.vb:39–45`). Its `InitializePort` is empty; its input/output methods delegate to the simulated SMINI forms (B `TestCMRI.vb:31–48`). Recovered `InitializeNodes` constructs a SerialPort object, but this simulated backend does not open it. Offline use remains supported by static source evidence, not an executed demonstration.

The separately prepared 711-case harness is pinned to the **2016 GitHub source**, not this recovered version. Its hash gate must not be bypassed. Its memory backend also requires a null port argument, which the recovered `InitializeNodes` would violate by constructing a port object. Future adoption requires a reviewed, separately scoped test-host proposal; no harness, baseline manifest, scenario expectation or railway source was changed during this comparison. Failure/read-retention scenarios would need version-specific expectations. The updated guide introductions also change the documentation hashes, so even a GitHub-only experiment remains gated pending review and an explicit guide-hash refresh; no build/run was attempted.

## Compiled application and dependencies

B's application is a managed Windows executable, assembly/file version `1.0.0.0`, metadata runtime `v4.0.30319`, target framework `.NETFramework,Version=v4.0`. PE machine is I386 with `ILOnly` and without `Requires32Bit`; this does not establish a mandatory x86-only native application. No application or dependency was loaded as executable code to obtain these facts: the PE/CLI metadata was read as data.

Assembly references include `mscorlib`, `System`, `System.Windows.Forms`, `System.Drawing` version 4.0; `Microsoft.VisualBasic` version 10.0; and **Microsoft.VisualBasic.PowerPacks version 12.0.0.0**, public-key token `b03f5f7f11d50a3a`. The supplied PowerPacks DLL identifies itself as assembly version 12.0.0.0. Its older CLR2 metadata and framework references are recorded; compatibility has not been established by launch or build.

| Item | SHA-256 |
|---|---|
| Recovered `CTCLogic.vb` (A = B) | `DE0F17F7889E7B4803E0F593DB267640EC9F87F42610E720E66F2B88FC11B469` |
| GitHub working-copy `CTCLogic.vb` | `29F6BECED6C0C2F8A041674B4FF7AED300C5710E0AB10B096F2FB8F919EE2CB2` |
| Recovered `CMRI.vb` (A = B) | `0AC922CD48172BDE42B9CFA9325DE1FF3249FA7D7B5E38AAE86F95DC1AA7EB14` |
| GitHub working-copy `CMRI.vb` | `B71A21DA7195E753875D066118EE4D8A50094422471BC6F33794B73C113B5BB1` |
| B `bin/Debug/KCSubCTCV3.exe` = B obj EXE | `C59C3E9AE236CCDA3DD38FE33591D08B1269A217A10AC945FFD9F6E11186352A` |
| B `bin/Debug/Microsoft.VisualBasic.PowerPacks.dll` | `F52A5B0E1D13B197D4CC0632F71C2A3BC44A62A5A6DF1EE2116D6547893DD2F6` |
| B `bin/Debug/KCSubCTCV3.pdb` | `6FD3DF8DD1FAF5B778612442F90895E57B0193722F09BC969AC6D2B80DABC320` |

Raw working-copy source hashes include encoding and line endings; they are not Git blob IDs.

### Source/build relationship

- B EXE filesystem modification time is `2018-04-22T17:13:13Z`; its COFF timestamp decodes to `2018-04-22T17:13:12Z`. These agree closely, but timestamps are not authentication or proof of deployment.
- Its CodeView record names `C:\Users\kelly\Documents\KCSubCTC\Kansas-City-Sub-CTC\obj\Debug\KCSubCTCV3.pdb`, GUID `9c7764dd-eb7e-4360-abb2-9f35e6fc96fb`, age 1.
- B's native PDB information stream has the same GUID and age. It records CTC source document paths under that Documents project. This supports an EXE/PDB pairing and the historical project location.
- The inspected PDB C13 file-checksum entries identify 28 source documents but have checksum kind 0 and no checksum bytes. They do not prove byte identity with the recovered source. This limited metadata inspection is not a full PDB forensic validation.
- A's PDB has a different identity (`1ff661fa-3c5a-4608-954b-fe6580519e3f`, age 1); no corresponding A EXE is present. Keep both symbol sets; do not substitute A symbols for B's executable.
- A and B `CTCLogic.vb` hashes are identical despite recorded source modification dates in 2016 and 2018 respectively. This is direct evidence that later timestamps alone do not establish changed functionality.

B's EXE Git blob identity is `95843fc0297685461e6748870e62802efcc025ee`; it is absent from the local repository object database and differs from application binaries reachable in the 2016 history. Its source-to-build identity remains unproven without additional evidence or a separately approved experiment. No decompilation was performed.

The PowerPacks DLL Git blob identity is `6b179a956ea5fc266d73e79b254ffa584ba8f0a5`, matching the DLL already reachable in GitHub history. This resolves the identity of a candidate dependency; it does not grant redistribution rights or establish current Windows compatibility.

### Configuration and toolchain

`KCSubCTCV3.vbproj`, `.vbproj.user`, `.sln`, `My Project/Settings.settings` and application metadata/source are unchanged from GitHub. The project still targets .NET Framework 4.0 with a PowerPacks 12 reference. No project-local `KCSubCTCV3.exe.config` was found in either bin directory. Serial parameters remain source constants, not newly recovered user configuration.

The unchanged solution header is the earlier Visual Basic Express format; `.vs/.../v14` data and Visual Studio 12.0/2015 folders also exist. These do not conclusively identify the compiler that produced B's EXE. The broad metadata inventory did not locate a `vbc.exe` or a v4.0 reference-pack `mscorlib.dll`; installed-software copies and web installers are not a proven reconstructable build environment. No installer was run.

## Archived Git history

Both `.git` trees have the same content hashes. Read-only analysis used **copies of objects, refs, logs, HEAD and index**, with a newly written minimal local Git configuration; archived hooks/configuration were not activated. Git could not directly access the cloud worktree through `-C`, so all subsequent Git-history operations used those local analysis copies.

| Evidence | A and B result |
|---|---|
| HEAD | `refs/heads/master` |
| Local master and origin/master | Both `0a561b3f8de459a787795a16da4c987868d4ae79` |
| Reachable commits | 47; same set as the original GitHub baseline |
| Additional branches/tags | None found |
| Reflogs | Clone records from `kloyd/Kansas-City-Sub-CTC`, no later recorded commits |
| Object check | `git fsck --full --no-reflogs --unreachable` reported no errors or unreachable objects |
| Archived index vs HEAD | No staged differences |

The two source edits are therefore **unstaged working-tree changes**, not unpublished 2018 commits. There is no recovered later committed history in these two repositories. This does not exclude other archives outside the supplied material.

## JMRI evidence and limits

More than installers are present. `JMRI/My_JMRI_Railroad/profile/profile.xml:4–41` contains a C/MRI connection on **COM2 at 9,600 baud**, with nodes 0–3. The same profile also lists a SPROG programmer at `43`; `JMRI/Mark_2/profile/profile.xml:4` describes a separate SPROG connection. These are saved configurations, not proof of connected hardware or last operational settings.

`JMRI/My_JMRI_Railroad/kcsub.xml:9–32` includes sensors `CS1`, `CS2` (user name `SWL1N`) and turnout `CT3001` (user name `SM23`, two bits, feedback attribute `DIRECT`). The inspected file contains no populated equivalent of the complete VB signal/interlocking system. The JMRI feedback attribute does not prove Tortoise endpoint contacts exist.

This supports historical C/MRI configuration/testing work in JMRI. It does not establish that JMRI replaced or integrated with the working VB CTC application. The saved JMRI baud rate conflicts with the active recovered VB value, 19,200. Resolve actual board/adapter settings from physical documentation and an approved isolated test; do not silently select either rate.

The standalone EasyDCC boundary remains owner-confirmed. A SPROG programmer profile is not evidence of EasyDCC command integration. No DCC, turntable or day/night integration is added to restoration scope.

## Recommendation and next milestone

**Prefer B as the candidate historical application evidence set.** It supplies complete baseline source paths plus identical recovered communications edits, the icon, the distinct application build, its corresponding-identity PDB and the referenced dependency. A remains worth preserving for its different symbols and build records. GitHub remains the immutable, audited comparison baseline and source of traceable history.

Confidence is high in the recorded file differences and the relative completeness of B; confidence that B is the exact deployed source/build pair remains provisional. The owner-confirmed last-working provenance strengthens B's relevance but does not identify a launch target within the archive.

The next practical milestone is to review this comparison, designate a preserved candidate snapshot and approve a **hardware-disconnected** software characterization plan. Retain the GitHub and recovered variants separately; include failed-read retention, serial-object lifecycle and scan-timing differences in the future test proposal. Do not rewrite the proven route/aspect algorithms or introduce integrations to obtain a first baseline.

Still needed: the actual old desktop shortcut/launch path or operating records; confirmation of board/adapter baud settings; clarification of the moisture/lightning failure chronology; and an independently preserved copy outside the live sync tree. A full executable-to-source proof, successful build, successful simulator run, hardware condition assessment and field I/O validation remain outstanding.

## Local evidence artifacts

The workspace `backup-analysis` directory contains `backup-file-inventory.csv`, `project-manifests.csv`, `baseline-versus-A.csv`, `baseline-versus-B.csv`, `A-versus-B.csv`, source diff files, routine/path comparison JSON, PE metadata JSON and PDB metadata JSON. The two baseline comparison CSVs enumerate **every one of the 104 original tracked paths**. These local artifacts and analysis Git copies have not been published. The broad backup's unrelated personal/application files were not content-audited.
