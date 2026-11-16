# Software restoration options

Baseline: [overview](SYSTEM_OVERVIEW.md). Evaluation follows the source audit; none of these approaches has been implemented or tested. Exact current support statements below were checked against official sources on16 November2026.

## Comparative assessment

| Approach | Feasibility | Complexity | Main risks | Maintainability / authentic operation |
|---|---|---|---|---|
| **A: restore original** | Most direct path to a reference application; substantial source present, dependencies unresolved | Low–medium software work; hardware recovery remains separate and potentially substantial | PowerPacks12/toolchain, old binaries mismatch, communications and output defects, debug timing; VM serial behavior | Excellent behavioral reference and preserves panel experience; poor long-term support if frozen on obsolete environment |
| **B: modernize existing** | Plausible because transport is abstracted and CTC logic is in VB; tightly coupled UI/globals complicate isolation | Medium–high, staged | Changed timer/order/conversion/resource behavior; PowerPacks replacement; accidentally preserving defects or changing authentic code timing | Best potential balance of retained behavior and maintainability, provided output/state regressions and independent safety requirements are established |
| **C: replacement** | Technically feasible from recovered route/I/O reference; not a turnkey rewrite | High–very high | Losing subtle code-button, yard, stick-release and train-ID behavior; discovering wiring differences late; full commissioning burden | Potentially strong maintenance benefits; authenticity must be explicitly specified and validated |

Hardware damage, adapter replacement, detector faults and mechanical point condition affect **all** options. None is solved by changing programming language.

## Option A — original application as a reference

Preserve HEAD and historical artifacts. In a disconnected environment, establish compatible VB/MSBuild tools, .NET Framework4 reference assemblies and the **correct PowerPacks12 assembly**. The solution says Express2010, while later dependencies/syntax indicate a later compatible compiler may be necessary. Do not let an IDE silently upgrade the preserved source. A separate approved working copy would be required for any fixes.

An isolated legacy Windows VM may help reproduce the old toolchain; it adds serial passthrough/driver/timing variables and is not a demonstrated live operating solution. A compatibility-mode checkbox alone will not provide missing framework reference assemblies, DLLs or serial drivers. A newer .NET4.x runtime may run old-target applications, but this exact application must be tested with its dependency and behavior assumptions.

Microsoft documents that .NET Framework4 support ended12 January2016. Newer Framework support follows the host Windows lifecycle; select and verify a supported host/runtime pairing for a maintained installation. Modern Visual Studio support for old targets is constrained: VS2022 and later cannot build projects targeting Framework4.0–4.5.1 directly. See [Microsoft lifecycle FAQ](https://learn.microsoft.com/en-us/lifecycle/faq/dotnet-framework) and [developer installation guidance](https://learn.microsoft.com/en-us/dotnet/framework/install/guide-for-developers).

The first build may establish syntactic completeness, not operational readiness. Before live use, resolve ignored comms errors, stale buffers, point confirmation policy, shortened delays, safe shutdown/startup and maintenance bypass behavior through reviewed requirements and approved changes.

## Option B — preserve behavior, improve support incrementally

A practical intermediate target is a supported .NET Framework4.8/4.8.1 environment appropriate to its host, before considering a larger migration to current .NET Windows Forms. These are different migration sizes. The PowerPacks line/shape controls are a significant legacy UI dependency; replacing their rendering is separate from translating signalling logic. Current .NET would also require reviewing SerialPort packaging, VB application framework behavior and all old project/resource assumptions.

The valuable asset is the **verified railway behavior**, not an obligation to retain every defect. First capture representative baseline traces and independently specify forbidden conflicts. Then consider explicit I/O validity, bounded communication recovery, complete per-node output buffers, measured correspondence, safe stop/restart and deterministic time accounting. Separate UI presentation from the control engine gradually. Such changes are proposals for post-review engineering, not authorized fixes in Phase1.

Maintain original lever/code-button operation, code light/sound, indication delays, yard acceptance and crew annunciators. Document any necessary intentional behavioral changes, especially true-yellow26LC and response to hardware failure, before commissioning.

## Option C — new application or JMRI-based system

A replacement can retain the actual dispatcher panel and SMINI hardware if its electrical interface is serviceable. It needs an explicit mapping, route/state specification, testing infrastructure and independent field acceptance. The original software remains the engineering reference, including the distinction between requested, calculated and delayed indicated states. Train IDs, pseudo blocks and yard permissions are part of the operating contract.

JMRI is a credible candidate: its official C/MRI documentation describes SMINI, serial links, input sensors, output objects and configurable node sizes. Its signal documentation includes two-lead oscillating-signal setup. That supports retaining C/MRI I/O; it does not demonstrate that a stock panel reproduces this railway. See [JMRI C/MRI hardware support](https://www.jmri.org/help/en/html/hardware/cmri/CMRI.shtml) and [C/MRI signals](https://www.jmri.org/help/en/html/hardware/cmri/Signals.shtml).

Custom JMRI configuration/logic, scripts or extensions would still be needed for this railway's routes and conflicts, paired motor drives, code-button queues and sounds, delayed panel indications, exact FS/TLV release behavior, Sugar Creek/Independence locks, Coburg permissions, turnout25 local interface, train-ID-gated signals, OS reporting and special26LC output. JMRI's turnout terminology for individual C/MRI output bits must not be mistaken for automatically driving the correct motor pair. Its general CTC features require a separate gap analysis against this state machine.

The owner's authoritative boundaries apply to all three options: EasyDCC is standalone, detectors provide occupancy to CTC, and no DCC command integration is to be planned. The turntable remains manually switch-operated with no software integration required. Day/night lighting was installed by the current owner after purchase and is excluded from initial software restoration. Some points have manual control while others have software interlocking; establish which overlap through the source and wiring survey, then preserve those specific arrangements. No new automation or integrations may be introduced without explicit approval. Only one application should own a given serial control bus during any eventual test; concurrent masters are not a migration strategy.

## Recommendation and decision gates

Use **A to recover a disconnected behavioral baseline, then select a staged B** if that baseline and electrical survey support it. This follows from the amount of custom, recoverable logic and the desire to preserve the physical panel's authentic operation. It is a provisional engineering recommendation, not a commitment before results exist. C/JMRI becomes more attractive if dependency recovery fails, the current logic proves unsuitable to isolate/validate, or maintainers have stronger JMRI capability and accept its configuration/testing cost.

Decide after answering: can a reproducible disconnected build run; does it match recovered last-operating behavior; can remaining circuit documentation be reconstructed; which maintainers can support it; what failure behavior must be corrected; and what commissioning resources are available? Do not select a replacement merely because the original PC failed, or deploy the original merely because it compiles.

## Requirements before any compile/test — approval not yet requested

The next approved work package should specify the exact isolated Windows host/VM, VB/MSBuild toolchain, reference assemblies, PowerPacks source/version/license, copied working tree and intended simulator-only commands. Disconnect all physical control adapters and disable passthrough; confirm the selected backend before launch. Explain whether installing prerequisites or altering a copy is needed and obtain explicit approval before any build, test or application launch. A separate later authorization is required for electrical/physical bench operations. Phase1 has done none of these actions.
