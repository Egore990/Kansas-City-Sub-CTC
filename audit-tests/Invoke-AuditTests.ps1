#requires -Version 7.0
param(
    [switch]$Approved,
    [switch]$Build,
    [switch]$Run,
    [string]$Category = 'signals',
    [string]$CaseId,
    [string]$BuildDirectory,
    [string]$CompilerPath = "$env:WINDIR/Microsoft.NET/Framework64/v4.0.30319/vbc.exe"
)

$ErrorActionPreference = 'Stop'
if (-not $Approved) { throw 'Build/execution requires explicit owner approval. No work performed.' }
if (-not $Build -and -not $Run) { throw 'Choose -Build and/or -Run explicitly.' }

$testRoot = $PSScriptRoot
$repoRoot = Split-Path -Parent $testRoot
$artifactRoot = Join-Path $testRoot '.artifacts'
$catalogPath = Join-Path $testRoot 'cases.xml'
$manifestPath = Join-Path $testRoot 'baseline-manifest.json'
$sourceNames = @('../CTCLogic.vb', '../ICMRI.vb', 'HostStubs.vb', 'MemoryCmri.vb', 'AutomationRunner.vb')

function Get-InputHashes {
    $result = [ordered]@{}
    foreach ($name in ($sourceNames + @('cases.xml', 'fixtures.json', 'generate_cases.mjs', 'baseline-manifest.json'))) {
        $path = Join-Path $testRoot $name
        $result[$name] = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    }
    return $result
}

function Assert-Baseline {
    $baseline = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    foreach ($entry in $baseline.original_sources) {
        $actual = (Get-FileHash -LiteralPath (Join-Path $repoRoot $entry.path) -Algorithm SHA256).Hash
        if ($actual -ne $entry.sha256) { throw "Audited source changed: $($entry.path). Stop for review." }
    }
    foreach ($entry in $baseline.guides) {
        $actual = (Get-FileHash -LiteralPath (Join-Path $repoRoot $entry.path) -Algorithm SHA256).Hash
        if ($actual -ne $entry.sha256) { throw "Operating guide changed: $($entry.path). Review catalog traceability before execution." }
    }
}

Assert-Baseline
$inputs = Get-InputHashes
if ($Build) {
    if ($BuildDirectory) { throw '-BuildDirectory is only for running an existing build.' }
    if (-not (Test-Path -LiteralPath $CompilerPath -PathType Leaf)) { throw 'Approved compiler was not found.' }
    $frameworkDirectory = Split-Path -Parent $CompilerPath
    $references = @('System.dll', 'System.Core.dll', 'System.Xml.dll', 'System.Xml.Linq.dll')
    foreach ($name in ($references + @('mscorlib.dll', 'Microsoft.VisualBasic.dll'))) {
        if (-not (Test-Path -LiteralPath (Join-Path $frameworkDirectory $name) -PathType Leaf)) {
            throw "Missing runtime reference $name. Do not install or substitute automatically."
        }
    }
    # Direct compiler experiment against the installed CLR4 runtime assemblies.
    # This is NOT a build of the original WinForms project/Framework4 target.
    $BuildDirectory = Join-Path $artifactRoot ([guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $BuildDirectory | Out-Null
    $exe = Join-Path $BuildDirectory 'AutomationRunner.exe'
    $compilerArgs = @('/nologo', '/noconfig', '/target:exe', '/optionexplicit+', '/optioninfer+', '/optionstrict-',
        '/rootnamespace:KCSubCTCV3', '/main:KCSubCTCV3.AutomationRunner',
        '/imports:Microsoft.VisualBasic,System,System.Collections,System.Collections.Generic,System.Diagnostics,System.Linq,System.Xml.Linq',
        ('/sdkpath:' + $frameworkDirectory),
        ('/vbruntime:' + (Join-Path $frameworkDirectory 'Microsoft.VisualBasic.dll')),
        ('/out:' + $exe))
    foreach ($name in $references) { $compilerArgs += '/reference:' + (Join-Path $frameworkDirectory $name) }
    foreach ($name in $sourceNames) { $compilerArgs += [IO.Path]::GetFullPath((Join-Path $testRoot $name)) }
    $compilerOutput = & $CompilerPath @compilerArgs 2>&1
    $compilerExit = $LASTEXITCODE
    $compilerOutput | Set-Content -LiteralPath (Join-Path $BuildDirectory 'compiler.log') -Encoding utf8
    if ($compilerExit -ne 0 -or -not (Test-Path -LiteralPath $exe -PathType Leaf)) {
        throw "Compilation failed. Review compiler.log in $BuildDirectory. No automatic repair is authorized."
    }
    $record = [ordered]@{
        baseline = '0a561b3f8de459a787795a16da4c987868d4ae79'
        scope = 'unchanged CTCLogic component, memory transport and UI stand-ins; installed CLR4 compatibility experiment'
        compiler = $CompilerPath
        compiler_version = (Get-Item -LiteralPath $CompilerPath).VersionInfo.FileVersion
        compiler_sha256 = (Get-FileHash -LiteralPath $CompilerPath -Algorithm SHA256).Hash
        powershell_version = $PSVersionTable.PSVersion.ToString()
        runtime_references = @(
            foreach ($name in ($references + @('mscorlib.dll', 'Microsoft.VisualBasic.dll'))) {
                $referencePath = Join-Path $frameworkDirectory $name
                [ordered]@{
                    path = $referencePath
                    file_version = (Get-Item -LiteralPath $referencePath).VersionInfo.FileVersion
                    sha256 = (Get-FileHash -LiteralPath $referencePath -Algorithm SHA256).Hash
                }
            }
        )
        arguments = $compilerArgs
        inputs = $inputs
        executable_sha256 = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash
    }
    $record | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $BuildDirectory 'build.json') -Encoding utf8
    Write-Output "Build recorded at $BuildDirectory"
}

if ($Run) {
    if (-not $BuildDirectory) { throw 'Provide the reviewed -BuildDirectory, or combine with an approved -Build.' }
    $resolvedBuild = [IO.Path]::GetFullPath($BuildDirectory)
    $allowedPrefix = [IO.Path]::GetFullPath($artifactRoot).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $resolvedBuild.StartsWith($allowedPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Only a recorded build inside audit-tests/.artifacts may be executed.'
    }
    $record = Get-Content -LiteralPath (Join-Path $resolvedBuild 'build.json') -Raw | ConvertFrom-Json
    foreach ($name in $inputs.Keys) {
        $recorded = $record.inputs.PSObject.Properties[$name]
        if (-not $recorded -or $recorded.Value -ne $inputs[$name]) { throw "Build/case inputs changed: $name. Stop for review." }
    }
    foreach ($reference in $record.runtime_references) {
        if ((Get-FileHash -LiteralPath $reference.path -Algorithm SHA256).Hash -ne $reference.sha256) {
            throw "Recorded runtime reference changed: $($reference.path). Stop for review."
        }
    }
    $exe = Join-Path $resolvedBuild 'AutomationRunner.exe'
    if ((Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash -ne $record.executable_sha256) {
        throw 'The executable does not match the recorded build.'
    }
    [xml]$catalog = Get-Content -LiteralPath $catalogPath -Raw
    $selected = @($catalog.catalog.cases.case | Where-Object {
        if ($CaseId) { $_.id -eq $CaseId } else { $Category -eq 'all' -or $_.category -eq $Category }
    })
    if ($selected.Count -eq 0) { throw 'No cases selected.' }
    $runDirectory = Join-Path $resolvedBuild ('run-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $runDirectory | Out-Null
    $results = [Collections.Generic.List[object]]::new()
    foreach ($case in $selected) {
        if ($case.id -notmatch '^[A-Za-z0-9_.-]+$') { throw 'Unexpected case identifier.' }
        $start = [Diagnostics.ProcessStartInfo]::new()
        $start.FileName = $exe
        $start.ArgumentList.Add($catalogPath)
        $start.ArgumentList.Add([string]$case.id)
        $start.UseShellExecute = $false
        $start.CreateNoWindow = $true
        $start.RedirectStandardOutput = $true
        $start.RedirectStandardError = $true
        $process = [Diagnostics.Process]::new()
        $process.StartInfo = $start
        try {
            [void]$process.Start()
            $stdoutTask = $process.StandardOutput.ReadToEndAsync()
            $stderrTask = $process.StandardError.ReadToEndAsync()
            if (-not $process.WaitForExit(20000)) {
                $process.Kill($true)
                $process.WaitForExit()
                $results.Add([pscustomobject]@{ id = $case.id; status = 'error'; detail = '20-second process deadline exceeded' })
                break
            }
            $stdout = $stdoutTask.GetAwaiter().GetResult()
            $stderr = $stderrTask.GetAwaiter().GetResult()
            $stdout | Set-Content -LiteralPath (Join-Path $runDirectory ($case.id + '.xml')) -Encoding utf8
            if ($stderr) { $stderr | Set-Content -LiteralPath (Join-Path $runDirectory ($case.id + '.stderr.txt')) -Encoding utf8 }
            try {
                [xml]$result = $stdout
                $status = [string]$result.result.status
                if ($status -notin @('pass', 'fail', 'observed-known-issue', 'error')) { throw 'Invalid result status.' }
                $expectedExit = if ($status -eq 'fail') { 1 } elseif ($status -eq 'error') { 2 } else { 0 }
                if ($process.ExitCode -ne $expectedExit) { throw 'Exit code and result disagree.' }
                $results.Add([pscustomobject]@{ id = $case.id; status = $status; exit_code = $process.ExitCode })
            } catch {
                $results.Add([pscustomobject]@{ id = $case.id; status = 'error'; detail = $_.Exception.Message })
                break
            }
            if ($status -eq 'error') { break }
        } finally {
            $process.Dispose()
        }
    }
    $completed = @($results | ForEach-Object id)
    $counts = [ordered]@{}
    foreach ($status in @('pass', 'fail', 'observed-known-issue', 'error')) {
        $counts[$status] = @($results | Where-Object status -eq $status).Count
    }
    $summary = [ordered]@{
        scope = $record.scope
        safety_acceptance = $false
        counts = $counts
        results = $results.ToArray()
        not_run = @($selected | Where-Object { $_.id -notin $completed } | ForEach-Object id)
        warning = 'Matching characterization assertions is not proof of safe interlocking, real serial recovery or physical position.'
    }
    $summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $runDirectory 'summary.json') -Encoding utf8
    Write-Output "Results recorded at $runDirectory"
    if ($counts.fail -gt 0 -or $counts.error -gt 0 -or $summary.not_run.Count -gt 0) { exit 1 }
}
