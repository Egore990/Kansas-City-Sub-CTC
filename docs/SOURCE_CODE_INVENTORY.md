# Source code inventory and completeness

Baseline: [overview](SYSTEM_OVERVIEW.md). Paths below are relative to the repository root. The audited baseline contains **104 tracked files**, excluding `.git` and the subsequently added audit documentation. The file-by-file appendix lists every baseline file; generated files and assets are not omitted simply because they contain no control logic.

## Build system and dependencies

| Item | Confirmed finding | Evidence |
|---|---|---|
| Solution | One Visual Basic project; solution format11, Visual Basic Express2010 header | `KCSubCTCV3.sln:2–5` |
| Application | WinExe, Windows Forms, root namespace/assembly KCSubCTCV3 | `KCSubCTCV3.vbproj:9–15` |
| Target | .NET Framework **4.0**, MSBuild ToolsVersion4.0 | `KCSubCTCV3.vbproj:2,15` |
| Prior tooling | ProductVersion9.0.30729 and OldToolsVersion3.5 suggest VS2008-era project origin | `KCSubCTCV3.vbproj:6,22`; inference, not exact original target proof |
| Upgrade record | Converted successfully on29 October2010 | `UpgradeLog.XML:2–13` |
| Later editing | `.vs/.../v14/.suo` in deleted history and PowerPacks12 reference suggest later IDE use | Git deletion history; does not change current solution header |
| Language options | Explicit On, Strict Off, Infer On; numerous warnings suppressed | project:16–19,40–56 |
| Platforms | Debug and Release, AnyCPU | project:40–57; solution configurations |
| Startup | VB application framework starts MainPanel | `My Project/Application.Designer.vb:34–35` |
| Non-framework dependency | Microsoft.VisualBasic.PowerPacks, assembly12.0.0.0, strong-named reference | project:62; MainPanel designer uses LineShape/ShapeContainer |
| Framework assemblies | System,Data,Deployment,Drawing,Windows.Forms,Xml,Core,Xml.Linq,DataSetExtensions | project:63–77 |
| Communications | Framework System.IO.Ports.SerialPort plus local CMRI implementation | `CMRI.vb:1–3`; no active MSComm reference |
| Configuration | Constants/hardware assignments embedded in CTCLogic; Settings.settings empty | `CTCLogic.vb:276–614`; settings XML |
| Deployment | ClickOnce-style local publish metadata; no updater enabled | project:25–38; `.vbproj.user` |

The initial reachable Git revision also targets v4.0. An earlier .NET Framework target cannot be determined from the old tooling field or CLR2-generated comments alone. The exact IDE/compiler that built the **last working installed executable** is unknown. PowerPacks12 and later VB syntax may make a stock Express2010 reconstruction insufficient even though that is the solution's header.

## Behavioral component inventory

| Component | Purpose and key entry points |
|---|---|
| `CTCLogic.vb` | Entire railway control module: globals1–209; cycle210; constants276; defaults479; hardware initialization577; inputs650; traffic sticks768; control codes918; point control1208/1249; east/west routes1322/1450; time locking1560/1580; locks1625/1648/1713; indications1789/2110; train movement2234; timer2532; outputs2591/2842/2923/2990/3045; logs3109; simulated failure3134 |
| `CMRI.vb` | Real serial transport: InitializePort12,INIT84,INPUTS272,OUTPUTS375,iReceiveByte402,TransmitPackage476 |
| `ICMRI.vb` | Four-method transport abstraction shared by real and simulated backends |
| `MainPanel.vb` | Mode/run/pause/exit and maintenance menus22–107; diagram refresh111; train labels127; flashing206; turnouts367; occupancy648; signal indicators676; direction display843; train-entry line handlers1329; colored block graphics1357; InputTrainID1713 |
| `TestCMRI.vb` | In-memory backend implementing interface; forms created in INIT15, bit reads/writes37/43 |
| `CMRISimulator.vb` | Bit UI, defaults, and node labels; Inputs13,Outputs25,CreateOutputsAndInputs55; node labels75/147/219/291 |
| `CTCSimulator.vb` | Empty unfinished host class; designer's hidden tab/MDI container has no populated simulation workflow |
| `ButtonArray.vb`, `CheckBoxArray.vb` | CollectionBase wrappers dynamically creating simulator controls; output button click handler does nothing |
| `DlgSigMaint.vb` | Simulated signal4-left failure flag only; dialog advertises more than implemented |
| `SignalTest.vb` | Direct manual color fields for24R/26R, A/B heads only |
| `DlgSysParam.vb` | Class is named DlgSystemParams; loads timing fields; MainPanel applies values |
| `DlgAddTrain.vb` | Train/loco ID dialog; MainPanel reads text/direction and writes global state |

MainPanel pictures are schematic white/green/red route/occupancy states, with white/green flashing for pending/time-running indications; they are not a literal multiaspect field lamp display. The code contains no DCC locomotive-command layer, database, remote client/server, or automatic railway train-motion model.

## Source completeness assessment

**Likely sufficient to attempt a controlled build, but not demonstrated buildable as supplied.** All project Compile and EmbeddedResource paths resolve on Windows (including case-only CMRISimulator designer spelling). All62 file-backed entries in `My Project/Resources.resx` resolve. Seven .resx XML documents parse; six form resources plus the central resource file are present. Source counterparts, designers and generated My files exist. No NuGet package restoration is specified.

One project `None` entry, `Resources/TurnoutBlank1.png`, is missing (`KCSubCTCV3.vbproj:388`); it is not a current ResXFileRef. This may affect project display/publishing more than compilation, but a build is needed to establish the impact. `TurnoutBlankDown.png` exists but is not thereby proven to be the intended replacement.

The PowerPacks12 DLL is absent from the current tree and no HintPath/package acquisition instruction is supplied. Actual compiler/runtime binding and designer compatibility need validation. Empty per-user settings provide no saved layout port/wiring overrides. Missing software prerequisites must not be confused with missing hardware documentation.

No tests, formal route truth tables, deployment runbook, hardware schematics, license file, installed-machine backup or known-good release tag are present in the current tree. No app.config is present. A public repository is not itself a redistribution license; recover provenance/permission before distributing a replacement or bundled historical DLL.

## Historical evidence

There are47 reachable commits, from `aa3f062` (9 February2016) through `0a561b3` (17 July2016), one fetched branch master and no tags. The clone includes full reachable history, not just a ZIP snapshot. It is a fork of kloyd/Kansas-City-Sub-CTC; the parent repository and private archives have not been separately audited, and may contain further evidence.

| Revision(s) | Relevance |
|---|---|
| `aa3f062` | Initial import already contains older2010 upgrade record and v4.0 project; history is not the whole development lifetime |
| `dc4f110`, `af0a2e1`, `f9c977e` | Removed build/IDE outputs. Historical `bin/Debug/KCSubCTCV3.exe`, PDB, XML, host files and PowerPacks.dll/XML remain reachable in Git; not executed/extracted as operational artifacts |
| `1dbad91` through later traffic-stick changes | Significant directional/train tracking work; history includes work-in-progress revisions |
| `9831bc2`, `26fbc17`, `0ac86f2`, `86ef00a` | Commit messages identify crossover and FS2/FS5/FS7 release fixes; useful regression scenario sources, not proof of exhaustive testing |
| `a6d69cf` | Added BLMA true-yellow26L path and commented road-light output. Diff explains current incomplete OB6 assignment |
| `8f6493d` | Attempted tabbed simulator container; current empty CTCSimulator is consistent with incomplete work |
| `442896b`, `0a561b3` | Coburg East/train movement fixes; final commit adds TrainID gates to several signals and moves Broadway handling to block10 |

Old EXEs precede current logic and cannot be assumed to match this HEAD or the damaged PC. Compare file versions/hashes and dates if an installed backup is recovered. No restoration of deleted artifacts or checkout of a different revision was performed.

## File-by-file appendix

The following table is generated from the tracked tree. “Resource” refers to static presentation material, not hardware configuration. Binary image contents were inventoried by role/name/reference; IDE `.suo` and compiled `.resources` were not decompiled.

| File | Lines (text) / bytes | Purpose |
|---|---:|---|
| `ButtonArray.vb` | 61 lines | Dynamic simulator output-button collection; click handler is empty. |
| `CMRI.vb` | 549 lines | Real SerialPort initialization, SMINI framing, polling, byte reception and output transmission. |
| `CMRISimulator.Designer.vb` | 66 lines | Simulator form layout and constructors initializing the three dynamic control collections. |
| `CMRISimulator.resources` | 180 bytes | Legacy compiled form resource blob; not listed as an EmbeddedResource in current project. |
| `CMRISimulator.vb` | 369 lines | 24 checkbox inputs, 48 output indicators per node; labels and defaults. |
| `CTCLogic.vb` | 3152 lines | Railway globals, code handling, routes, locks, train tracking, timers and I/O packing. |
| `CTCSimulator.Designer.vb` | 52 lines | MDI form with an empty hidden TabControl; no populated simulation pages. |
| `CTCSimulator.resx` | 120 lines | Form resource XML for CTCSimulator; 1 data entries (layout/localization or tray metadata), no route configuration. |
| `CTCSimulator.vb` | 3 lines | Empty form class; unfinished tabbed simulation host. |
| `CheckBoxArray.vb` | 43 lines | Dynamic simulator input-checkbox collection. |
| `DlgAddTrain.Designer.vb` | 223 lines | Windows Forms layout, controls, event fields and disposal for DlgAddTrain. |
| `DlgAddTrain.resx` | 120 lines | Form resource XML for DlgAddTrain; 1 data entries (layout/localization or tray metadata), no route configuration. |
| `DlgAddTrain.vb` | 16 lines | Train ID/loco entry dialog OK, Cancel and focus handlers. |
| `DlgSigMaint.Designer.vb` | 231 lines | Windows Forms layout, controls, event fields and disposal for DlgSigMaint. |
| `DlgSigMaint.resx` | 120 lines | Form resource XML for DlgSigMaint; 1 data entries (layout/localization or tray metadata), no route configuration. |
| `DlgSigMaint.vb` | 27 lines | Reads and writes only simulated signal4-left failure flag through CheckBox2. |
| `DlgSysParam.Designer.vb` | 175 lines | Windows Forms layout, controls, event fields and disposal for DlgSysParam. |
| `DlgSysParam.resx` | 579 lines | Form resource XML for DlgSysParam; 151 data entries (layout/localization or tray metadata), no route configuration. |
| `DlgSysParam.vb` | 24 lines | DlgSystemParams form loads four timing values; MainPanel applies OK results. |
| `ICMRI.vb` | 6 lines | InterfaceCMRI contract for real and simulated transports. |
| `KCSubCTCV3.sln` | 20 lines | Single-project solution, format11, Visual Basic Express2010 header. |
| `KCSubCTCV3.suo` | 23552 bytes | Binary per-user IDE state; not source/configuration authority; not decompiled. |
| `KCSubCTCV3.vbproj` | 410 lines | Legacy MSBuild VB WinForms project, Framework4.0, PowerPacks12 and publish metadata. |
| `KCSubCTCV3.vbproj.user` | 13 lines | Per-user publish URL history and culture/verification settings; no railway map. |
| `MainPanel.Designer.vb` | 1929 lines | Windows Forms layout, controls, event fields and disposal for MainPanel. |
| `MainPanel.resx` | 590 lines | Form resource XML for MainPanel; 1 data entries (layout/localization or tray metadata), no route configuration. |
| `MainPanel.vb` | 1782 lines | Dispatcher diagram, mode selection, maintenance menus, run loop and train entry. |
| `My Project/Application.Designer.vb` | 38 lines | Generated MyApplication constructor and startup form selection. |
| `My Project/Application.myapp` | 10 lines | VB application framework metadata, MainPanel startup and shutdown/settings policy. |
| `My Project/AssemblyInfo.vb` | 35 lines | Assembly identity,2010 copyright, GUID and fixed1.0.0.0 versions. |
| `My Project/Resources.Designer.vb` | 683 lines | Generated strongly typed bitmap accessors and resource manager. |
| `My Project/Resources.resx` | 307 lines | 62 file-backed bitmap resources; all referenced files resolve. |
| `My Project/Settings.Designer.vb` | 73 lines | Generated settings singleton/accessor; no custom settings properties. |
| `My Project/Settings.settings` | 7 lines | Empty application settings schema; no saved railway parameters. |
| `Resources/GreenLeft.png` | 253 bytes | Dispatcher signal-direction/status bitmap: GreenLeft. |
| `Resources/GreenRight.png` | 230 bytes | Dispatcher signal-direction/status bitmap: GreenRight. |
| `Resources/KCSubCTC.ico` | 1214 bytes | KCSubCTC application icon. |
| `Resources/LockLeftDownGreen.png` | 201 bytes | Dispatcher electric-lock diagram bitmap: LockLeftDownGreen. |
| `Resources/LockLeftDownLocked.png` | 204 bytes | Dispatcher electric-lock diagram bitmap: LockLeftDownLocked. |
| `Resources/LockLeftDownOccupied.png` | 202 bytes | Dispatcher electric-lock diagram bitmap: LockLeftDownOccupied. |
| `Resources/LockLeftDownUnlocked.png` | 205 bytes | Dispatcher electric-lock diagram bitmap: LockLeftDownUnlocked. |
| `Resources/LockLeftUpGreen.png` | 225 bytes | Dispatcher electric-lock diagram bitmap: LockLeftUpGreen. |
| `Resources/LockLeftUpLocked.png` | 227 bytes | Dispatcher electric-lock diagram bitmap: LockLeftUpLocked. |
| `Resources/LockLeftUpOccupied.png` | 227 bytes | Dispatcher electric-lock diagram bitmap: LockLeftUpOccupied. |
| `Resources/LockLeftUpUnlocked.png` | 231 bytes | Dispatcher electric-lock diagram bitmap: LockLeftUpUnlocked. |
| `Resources/LockRightDownGreen.png` | 205 bytes | Dispatcher electric-lock diagram bitmap: LockRightDownGreen. |
| `Resources/LockRightDownLocked.png` | 208 bytes | Dispatcher electric-lock diagram bitmap: LockRightDownLocked. |
| `Resources/LockRightDownOccupied.png` | 206 bytes | Dispatcher electric-lock diagram bitmap: LockRightDownOccupied. |
| `Resources/LockRightDownUnlocked.png` | 206 bytes | Dispatcher electric-lock diagram bitmap: LockRightDownUnlocked. |
| `Resources/LockRightUpGreen.png` | 224 bytes | Dispatcher electric-lock diagram bitmap: LockRightUpGreen. |
| `Resources/LockRightUpLocked.png` | 225 bytes | Dispatcher electric-lock diagram bitmap: LockRightUpLocked. |
| `Resources/LockRightUpOccupied.png` | 227 bytes | Dispatcher electric-lock diagram bitmap: LockRightUpOccupied. |
| `Resources/LockRightUpUnlocked.png` | 231 bytes | Dispatcher electric-lock diagram bitmap: LockRightUpUnlocked. |
| `Resources/RedLeft.png` | 245 bytes | Dispatcher signal-direction/status bitmap: RedLeft. |
| `Resources/RedRight.png` | 236 bytes | Dispatcher signal-direction/status bitmap: RedRight. |
| `Resources/TrafficClearedEast.png` | 168 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficClearedEast. |
| `Resources/TrafficClearedEastEnd.png` | 123 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficClearedEastEnd. |
| `Resources/TrafficClearedWest.png` | 164 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficClearedWest. |
| `Resources/TrafficClearedWestEnd.png` | 125 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficClearedWestEnd. |
| `Resources/TrafficNoneEast.png` | 125 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficNoneEast. |
| `Resources/TrafficNoneWest.png` | 122 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficNoneWest. |
| `Resources/TrafficOccupiedEast.png` | 168 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficOccupiedEast. |
| `Resources/TrafficOccupiedEastEnd.png` | 123 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficOccupiedEastEnd. |
| `Resources/TrafficOccupiedWest.png` | 165 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficOccupiedWest. |
| `Resources/TrafficOccupiedWestEnd.png` | 125 bytes | Dispatcher traffic-direction/occupancy arrow bitmap: TrafficOccupiedWestEnd. |
| `Resources/TurnoutBlank.png` | 148 bytes | Dispatcher turnout diagram bitmap: TurnoutBlank; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutBlankDown.png` | 202 bytes | Dispatcher turnout diagram bitmap: TurnoutBlankDown; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftDownBlank.png` | 206 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftDownBlank; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftDownNormal.png` | 177 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftDownNormal; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftDownNormalGreen.png` | 182 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftDownNormalGreen; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftDownNormalRed.png` | 183 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftDownNormalRed; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftDownReverse.png` | 218 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftDownReverse; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftDownReverseGreen.png` | 208 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftDownReverseGreen; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftDownReverseRed.png` | 210 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftDownReverseRed; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftUpBlank.png` | 202 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftUpBlank; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftUpNormal.png` | 189 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftUpNormal; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftUpNormalGreen.png` | 189 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftUpNormalGreen; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftUpNormalRed.png` | 191 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftUpNormalRed; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftUpReverse.png` | 210 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftUpReverse; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftUpReverseGreen.png` | 211 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftUpReverseGreen; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutLeftUpReverseRed.png` | 212 bytes | Dispatcher turnout diagram bitmap: TurnoutLeftUpReverseRed; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightDownBlank.png` | 199 bytes | Dispatcher turnout diagram bitmap: TurnoutRightDownBlank; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightDownNormal.png` | 180 bytes | Dispatcher turnout diagram bitmap: TurnoutRightDownNormal; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightDownNormalGreen.png` | 179 bytes | Dispatcher turnout diagram bitmap: TurnoutRightDownNormalGreen; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightDownNormalRed.png` | 181 bytes | Dispatcher turnout diagram bitmap: TurnoutRightDownNormalRed; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightDownReverse.png` | 201 bytes | Dispatcher turnout diagram bitmap: TurnoutRightDownReverse; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightDownReverseGreen.png` | 203 bytes | Dispatcher turnout diagram bitmap: TurnoutRightDownReverseGreen; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightDownReverseRed.png` | 205 bytes | Dispatcher turnout diagram bitmap: TurnoutRightDownReverseRed; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightUpBlank.png` | 210 bytes | Dispatcher turnout diagram bitmap: TurnoutRightUpBlank; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightUpNormal.png` | 204 bytes | Dispatcher turnout diagram bitmap: TurnoutRightUpNormal; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightUpNormalGreen.png` | 203 bytes | Dispatcher turnout diagram bitmap: TurnoutRightUpNormalGreen; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightUpNormalRed.png` | 206 bytes | Dispatcher turnout diagram bitmap: TurnoutRightUpNormalRed; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightUpReverse.png` | 228 bytes | Dispatcher turnout diagram bitmap: TurnoutRightUpReverse; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightUpReverseGreen.png` | 222 bytes | Dispatcher turnout diagram bitmap: TurnoutRightUpReverseGreen; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/TurnoutRightUpReverseRed.png` | 222 bytes | Dispatcher turnout diagram bitmap: TurnoutRightUpReverseRed; orientation/alignment/color or blank state, not a field assignment. |
| `Resources/WhiteLeft.png` | 244 bytes | Dispatcher signal-direction/status bitmap: WhiteLeft. |
| `Resources/WhiteRight.png` | 220 bytes | Dispatcher signal-direction/status bitmap: WhiteRight. |
| `SignalTest.Designer.vb` | 147 lines | Windows Forms layout, controls, event fields and disposal for SignalTest. |
| `SignalTest.resx` | 120 lines | Form resource XML for SignalTest; 1 data entries (layout/localization or tray metadata), no route configuration. |
| `SignalTest.vb` | 68 lines | Manual red/yellow/green overrides for signal24R and26R A/B fields. |
| `TestCMRI.vb` | 48 lines | In-memory transport test double creating per-node forms; no physical serial testing. |
| `UpgradeLog.XML` | 11 lines | Successful project/solution conversion record dated29 October2010; referenced XSL report not present. |
| `developers notes.txt` | 10 lines | Version3 concept, handbook chapter25 basis, code-button panel modifications and warning to recheck I/O labels. |
| `traffic lights.txt` | 49 lines | Historical road-light declarations and sample timing routines; not compiled, not day/night lighting. |
