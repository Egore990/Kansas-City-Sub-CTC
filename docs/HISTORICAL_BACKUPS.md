# Historical backup discovery and comparison plan

Status updated 17 November 2026: local OneDrive files are accessible and the two CTC project trees have been inspected and compared read-only. See the [completed backup comparison](BACKUP_COMPARISON.md) for verified paths, hashes, source differences, executable/dependency metadata and Git findings. This register preserves the earlier discovery reports and comparison procedure; its historical reported observations are superseded by that file-level evidence. The broad Windows-software backup has been inventoried, not content-audited in full.

## Evidence labels

| Label | Meaning in this update |
|---|---|
| Source-confirmed | Directly inspected GitHub baseline source or Git metadata, with references in the existing audit |
| Owner-confirmed context | The owner's authoritative description of system boundaries or reported history; not an independent electrical inspection |
| Owner recollection | Remembered startup/operating behavior, including the name Start Layout |
| Reported screenshot observation | The owner's description of filenames, sizes or dates shown in screenshots; Codex has not independently inspected those screenshots or files |
| Hypothesis / unknown | A possible explanation requiring file contents, hashes, metadata, history or wiring evidence |

Reported sizes are approximate. Explorer may hide extensions and timestamps can reflect copying, extraction, synchronization or metadata changes. Neither a later timestamp nor a larger file proves later functionality or operational use.

## Owner update and download status — 17 November 2026

The owner confirms that the supplied backup represents the last working system before moisture damage took out the computer power supply. This is **owner-confirmed operational provenance**, not yet a verified identification of a particular source tree or executable within the backup. Earlier project background also reported lightning damage; the sequence and relationship of those incidents remain unresolved. Do not infer that the power supply was the only affected component.

The owner has authorized read-only inspection and comparison against the GitHub source once downloads finish. This includes source, project/configuration files, compiled artifacts and archived Git history. It does not authorize execution, compilation, installation, hardware access, merging or publication of archive contents.

Earlier, two ZIP downloads were observed as incomplete `.crdownload` files. The owner subsequently supplied `C:\Users\ljwmm\OneDrive\CTC`, synced directly to OneDrive. The comparison used that folder, not the incomplete ZIPs. Two project trees were found under `CTC machine backup`; all 274 enumerated project-file hashes were ultimately readable, including twelve images that initially returned cloud errors. Local presence and ongoing synchronization are not an independently preserved, atomic archival snapshot.

The reported last-working provenance makes these archives priority evidence for restoration. It does not establish that every included project was deployed, that source matches the operational executable, or that the existing GitHub baseline should be replaced before review.

## Original archive register — reports before access

The following table and reported-source/build sections record the initial evidence, not the current comparison results. Actual nesting and contents are now established in [BACKUP_COMPARISON.md](BACKUP_COMPARISON.md).

| Folder as reported | Approximate size | Reported contents / relevance | Verification status |
|---|---:|---|---|
| `CTC` | 5 GB | Broad backup of original Windows 7 PC material, projects, installed software and development environment files | Owner report only; root/nesting, exact count and hashes unknown |
| `Kansas-City-Sub-CTC` | 1.9 MB | Project/build material, `bin/Debug`, `.git`, `.vs` and `obj` | Reported observations; relationship to the other folders unknown |
| `KCSubCTC` | 2.7 MB | VB source/project including logic, main panel, simulation and maintenance components | Owner report only; no file-level comparison |

The approximate 5 GB describes the substantial overall backup and the large CTC folder; do not add these figures as if independent, non-overlapping archives. Actual containment must be established from paths.

### Reported source evidence

`KCSubCTC` reportedly includes names `CTCLogic`, `CMRI`, `MainPanel`, `CMRISimulator`, `CTCSimulator`, `DlgSigMaint`, `SignalTest`, `TestCMRI` and `KCSubCTCV3.vbproj`. Exact filenames/extensions remain to be inventoried. `CTCLogic` is reportedly approximately126 KB, modified22 April2018; other source dates reportedly include August2016. These overlap the GitHub component names and may represent later or different revisions. Content identity, build completeness and functional differences are unknown.

### Reported compiled evidence

The backup `Kansas-City-Sub-CTC/bin/Debug` reportedly shows:

| Displayed name | Approximate size/date reported | Interpretation requiring verification |
|---|---|---|
| `KCSubCTCV3` application | 235 KB;23 April2018 | Candidate historical executable; exact extension, hash, assembly identity and source relationship unknown |
| Additional `KCSubCTCV3` artifacts | Dates apparently23 April2018 | Could include symbols/configuration/documentation; exact files unknown |
| `Microsoft.VisualBasic.PowerPacks` | 264 KB | Candidate dependency; filename/size cannot establish assembly version12, compatibility or provenance |
| `KCSubCTCV3.vshost` | Present in reported listing | Development hosting artifact; not proof of an installed production executable |

The initial screenshot report did not establish a final operational build. Inspection now places the available EXE and PowerPacks DLL in the nested `KCSubCTC/Kansas-City-Sub-CTC` copy; they are absent from the other project copy. The owner confirms last-working provenance for the backup, but an exact deployed executable/source pairing remains unverified. No archived application has been launched or tested.

### Other reported material

The larger backup reportedly includes JMRI folders/backups/installers (versions4.4 and4.12), Visual Studio environment files, PowerPacks material and historical `Program Files` / `Program Files (x86)` directories. These may reveal toolchain/dependency versions. Installed-program folders alone do not guarantee a reconstructable installation: installers, runtimes, registration and licenses may also be needed. No historical installer is to be executed merely to inspect it.

JMRI's presence does **not** establish that it controlled or was integrated with operational CTC. Evidence would require relevant profiles, scripts, connection definitions and corroborating operating history. JMRI evaluation remains separate from the initial restoration baseline; no DCC integration is planned.

## Read-only comparison procedure and repeatability

The first comparison is documented in [BACKUP_COMPARISON.md](BACKUP_COMPARISON.md). Preserve supplied backups unchanged when repeating or extending it. No checkout, reset, merge, repair, cleanup, dependency installation, application execution or synchronization back into the archive is part of this procedure. Any derived files belong in a separate analysis directory outside the archive and original source.

1. Record supplied root paths, provenance and whether every file is fully downloaded rather than an online-only placeholder. Preserve hidden files, exact names, hierarchy, dates and original archives. Identify junctions/symlinks without following them into unrelated data.
2. Generate a manifest of relative paths, sizes, timestamps and SHA-256 hashes. Identify identical duplicates by content, not names. Report unreadable, encrypted, absent or placeholder files explicitly. Do not upload private archives or include credentials from Git configuration in a report.
3. Inventory all projects/solutions, source/designers/resources, configuration, binaries and dependency files. Compare project targets, assembly references, startup forms, build options, required assets and deployment metadata against GitHub baseline `0a561b3f8de459a787795a16da4c987868d4ae79`.
4. Compare raw file hashes first. Separately classify encoding/line-ending-only changes and substantive source differences. Produce line/function references for C/MRI framing/parameters, node/bit assignments, route predicates, locks, timers, train-ID logic, startup actions, maintenance modes and simulators. Do not normalize or save over originals.
5. Inspect any `.git` read-only: record refs, branches, tags, remotes, reachable commit IDs/parents/dates, object completeness and local uncommitted changes. Compare ancestry/object IDs with the GitHub baseline and distinguish unpublished commits from uncommitted files or separate repositories. If history is shallow/incomplete, state that limitation. Avoid operations that refresh/write the archive index or run hooks/filters; use read-only plumbing or a separately preserved analysis copy. Do not fetch into the archive or automatically fetch unknown remotes.
6. Inspect executable/dependency hashes, PE/managed metadata, target/runtime, assembly references, version resources, signatures where present, and PDB/source-path evidence **without loading or running the application**. Compare bytes with binaries reachable in GitHub history. Fixed assembly versions and build timestamps are not sufficient proof of source identity. Any later build/decompilation experiment requires a separately defined and approved scope.
7. Identify configuration files, embedded defaults, user settings, publish/install artifacts and evidence of actual deployment paths. Separate IDE caches and hosting artifacts from operational requirements. Do not assume `bin/Debug` was the deployed installation.
8. Produce a comparison report and candidate ranking: unique/identical/older/newer by recorded evidence, functionally changed, build-complete, dependency-complete, history-complete, and closest supported relationship to known railway operation. Record unresolved contradictions instead of forcing a single winner.

## Selection criteria and current conclusion

Prefer a baseline with complete source/resources, traceable source-to-binary relationship, suitable dependencies, reproducible build evidence and corroborated operational history. Git ancestry is useful but cannot replace uncommitted deployed files; installed binaries are useful but cannot replace source. A combination of preserved evidence sets may be the most complete archive, without merging their code.

**Current recommendation:** the nested `KCSubCTC/Kansas-City-Sub-CTC` copy is the most complete recovered candidate. Both archived source trees contain the same two uncommitted communications changes against the GitHub2016 baseline. The nested copy also supplies the application EXE, corresponding-identity symbols, PowerPacks12 DLL and icon. Git history contains no later commits. Source-to-build identity and operational fitness remain unproven. Do not merge historical code or replace the baseline until the comparison and proposed selection have been reviewed and approved.

## Information requested when the owner is ready

- Local root/nesting and hidden `.git` are now inspected. Preserve a separate archival copy outside the live sync tree and retain all project/resource/build files; the broad backup has not been fully hashed or independently authenticated.
- Which material was copied directly from the original PC, when/how it was collected, and whether any has been edited since recovery.
- Any evidence of the last operational executable path, desktop shortcut target, version, last successful running date and startup screenshot/manual showing Start Layout.
- Whether a complete disk image or installer archive exists in addition to selected folders. Avoid running archived applications or installers to answer this.

Access/comparison readiness is separate from approval to compile, execute or test software. See the [proposed Phase 2 plan](PHASE_2_BUILD_SIMULATION_PLAN.md).
