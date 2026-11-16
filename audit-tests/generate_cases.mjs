// Catalog authoring only. Never loads, compiles, or executes railway software.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const f = JSON.parse(await readFile(path.join(root, 'fixtures.json'), 'utf8'));
const cases = [];
const ids = new Set();
const coverage = new Map();
const symbolic = name => '@' + name;
const text = value => 'text:' + value;
function add(id, category, device, setup = {}, summary = 'Documented source behavior', classification = 'characterization', guide) {
  if (ids.has(id)) throw Error('Duplicate case ' + id);
  ids.add(id);
  const guides = { signals: 'SIGNAL_LOGIC_PLAIN_ENGLISH.md', points: 'POINT_LOGIC_PLAIN_ENGLISH.md', blocks: 'BLOCK_LOGIC_PLAIN_ENGLISH.md', io: 'HARDWARE_IO_MAPPING.md' };
  const c = { id, category, device: String(device), summary, classification,
    guide: guide ?? guides[category] ?? 'STARTUP_INITIALIZATION.md', source: 'CTCLogic.vb', steps: [] };
  for (const [name, value] of Object.entries(setup)) set(c, name, value);
  cases.push(c);
  const key = category + ':' + device;
  coverage.set(key, (coverage.get(key) ?? 0) + 1);
  return c;
}
const set = (c, name, value) => c.steps.push({ op: 'set', name, value });
const call = (c, name) => c.steps.push({ op: 'call', name });
const expect = (c, name, value, attributes = {}) => c.steps.push({ op: 'expect', name, value, ...attributes });
const input = (c, node, bytes, error = 0) => c.steps.push({ op: 'input', node, bytes: bytes.join(','), error });
function scenario(id, category, device, setup, method, expected, classification = 'characterization') {
  const c = add(id, category, device, setup, 'Documented source behavior', classification);
  c.source += '::' + (method === 'Reinitialize' ? 'InitializeRailroad' : method);
  call(c, method);
  for (const [name, value] of Object.entries(expected)) expect(c, name, value);
  return c;
}

const baseline = add('baseline.constants', 'baseline', 'constants', {}, 'Baseline encodings and active delays', 'characterization', 'CTC_INTERLOCKING.md');
baseline.source = 'CTCLogic.vb:276-461';
for (const name of Object.keys(f.constants)) expect(baseline, name, symbolic(name));
expect(baseline, 'Fake.InitCount', 4); expect(baseline, 'Fake.PortInitCount', 1);

for (const r of f.routes) {
  const method = r.field.slice(3).includes('L') ? 'RouteCheckEast' : 'RouteCheckWest';
  scenario(`signal.${r.device}.${r.variant}.clear`, 'signals', r.device, r.setup, method, { [r.field]: symbolic(r.expected) }, r.classification);
  const positive = cases.at(-1);
  const siblings = { SIG4RA: ['SIG4RB', '@RED'], SIG4RB: ['SIG4RA', '@RED'],
    SIG8RAB: ['SIG8RC', '@RED'], SIG8RC: ['SIG8RAB', '@REDRED'],
    SIG8LABC: ['SIG8LD', '@RED'], SIG8LD: ['SIG8LABC', '@REDREDRED'],
    SIG26LAB: ['SIG26LC', '@RED'], SIG26LC: ['SIG26LAB', '@REDRED'] };
  if (siblings[r.field]) expect(positive, ...siblings[r.field]);
  const stop = ['SIG8LABC', 'SIG10RABC'].includes(r.field) ? 'REDREDRED' :
    ['SIG4LAB', 'SIG8RAB', 'SIG10LAB', 'SIG24RAB', 'SIG26LAB', 'SIG26RAB'].includes(r.field) ? 'REDRED' : 'RED';
  for (const [label, change] of r.guards) {
    scenario(`signal.${r.device}.${r.variant}.blocked.${label}`, 'signals', r.device, { ...r.setup, ...change }, method, { [r.field]: symbolic(stop) });
  }
}

for (const [number, details] of Object.entries(f.points)) {
  const point = Number(number), [button, block, timer, locks, node, byte, shift] = details;
  const request = `SWL${point}R`, indication = `SWL${point}LT`, motor = `SM${point}`;
  const setup = { [`CB${button}`]: '@PP', [`SWL${point}`]: '@LREV', 'TD[1]': -1 };
  scenario(`point.${point}.accept`, 'points', point, setup, 'DoControls', { [request]: '@LREV', [`CB${button}L`]: 0 });
  const rejects = [['invalid-zero', { [`SWL${point}`]: 0 }]];
  if (block) rejects.push([`occupied-${block}`, { [`BK${block}`]: '@OCC' }]);
  if (point === 23) rejects.push(['occupied-4', { BK4: '@OCC' }]);
  for (const signal of locks) rejects.push([`lock-${signal}`, { [`TLV${signal}`]: '@RIGHT' }]);
  for (const [label, change] of rejects) scenario(`point.${point}.reject.${label}`, 'points', point, { ...setup, ...change }, 'DoControls', { [request]: '@LNOR', [`CB${button}L`]: 0 });
  const moved = scenario(`point.${point}.throw-reverse`, 'points', point, { [request]: '@LREV' }, 'CTCSwitch', { [motor]: '@TUR', [indication]: '@DARKLT', [`TD[${timer}]`]: '@SMDL' });
  call(moved, 'WriteRailroad'); expect(moved, `Output[${node},${byte}]`, '@TUR', { mask: 3, shift });
  if (point === 23) expect(moved, 'Output[3,1]', '@TUR', { mask: 3, shift: 4 });
  if (point === 25) { expect(moved, 'Output[3,1]', 0, { mask: 3, shift: 6 }); expect(moved, 'Output[3,2]', 3, { mask: 3, shift: 0 }); }
  const motorBlock = point === 9 ? 7 : block;
  if (motorBlock) scenario(`point.${point}.motor-occupied`, 'points', point, { [request]: '@LREV', [`BK${motorBlock}`]: '@OCC' }, 'CTCSwitch', { [motor]: '@TUN', [indication]: '@NORLT', [`TD[${timer}]`]: 0 });
  scenario(`point.${point}.in-transit`, 'points', point, { [request]: '@LNOR', [motor]: '@TUR', [indication]: 0, [`TD[${timer}]`]: 3 }, 'CTCSwitch', { [motor]: '@TUR', [indication]: 0, [`TD[${timer}]`]: 3 });
  scenario(`point.${point}.timer-expiry`, 'points', point, { [request]: '@LREV', [motor]: '@TUR', [indication]: 0, [`TD[${timer}]`]: -1 }, 'CTCSwitch', { [motor]: '@TUR', [indication]: '@REVLT', [`TD[${timer}]`]: 0 });
  scenario(`point.${point}.accept-normal`, 'points', point, { ...setup, [request]: '@LREV', [`SWL${point}`]: '@LNOR' }, 'DoControls', { [request]: '@LNOR' });
  const normal = scenario(`point.${point}.throw-normal`, 'points', point, { [request]: '@LNOR', [motor]: '@TUR', [indication]: '@REVLT' }, 'CTCSwitch', { [motor]: '@TUN', [indication]: '@DARKLT', [`TD[${timer}]`]: '@SMDL' });
  call(normal, 'WriteRailroad'); expect(normal, `Output[${node},${byte}]`, '@TUN', { mask: 3, shift });
  scenario(`point.${point}.normal-expiry`, 'points', point, { [request]: '@LNOR', [motor]: '@TUN', [indication]: 0, [`TD[${timer}]`]: -1 }, 'CTCSwitch', { [motor]: '@TUN', [indication]: '@NORLT', [`TD[${timer}]`]: 0 });
}
scenario('point.23.time26-exception', 'points', 23, { CB24: 1, SWL23: 2, 'TD[1]': -1, TLV26: '@RIGHT', SWL25LT: '@REVLT' }, 'DoControls', { SWL23R: '@LREV' });
const held9 = scenario('point.9.accepted-but-motor-held', 'points', 9, { CB10: 1, SWL9: 2, 'TD[1]': -1, BK7: '@OCC' }, 'DoControls', { SWL9R: '@LREV' });
call(held9, 'CTCSwitch'); expect(held9, 'SM9', '@TUN');
const coding = scenario('point.3.code-delay-latches-later-lever', 'points', 3, { CB4: 1, SWL3: '@LNOR' }, 'DoControls', { SWL3R: '@LNOR', 'TD[1]': '@CCDL', CB4L: 1 });
set(coding, 'SWL3', '@LREV'); set(coding, 'TD[1]', -1); call(coding, 'DoControls'); expect(coding, 'SWL3R', '@LREV'); expect(coding, 'CB4L', 0);
for (const [lock, button, guards] of [[17, 18, [8]], [19, 20, [10, 12]]]) {
  const setup = { [`CB${button}`]: 1, [`CLL${lock}`]: '@LREV', 'TD[1]': -1 };
  scenario(`lock.${lock}.accept`, 'points', lock, setup, 'DoControls', { [`CLL${lock}R`]: '@LREV' });
  for (const signal of guards) scenario(`lock.${lock}.reject-${signal}`, 'points', lock, { ...setup, [`TLV${signal}`]: '@RIGHT' }, 'DoControls', { [`CLL${lock}R`]: '@LNOR' });
  scenario(`lock.${lock}.quick-release`, 'points', lock, { [`CLL${lock}R`]: '@LREV' }, 'SwitchLock', { [`UL${lock}`]: '@UNLOCKED', [`CLL${lock}LT`]: '@REVLT' });
  const conflict = lock === 17 ? { TLV8: '@RIGHT', SM15: '@TUR' } : { TLV10: '@RIGHT' };
  scenario(`lock.${lock}.deny-new-release`, 'points', lock, { [`CLL${lock}R`]: '@LREV', ...conflict }, 'SwitchLock', { [`UL${lock}`]: '@LOCKED' });
  scenario(`lock.${lock}.denial-retains-indication`, 'points', lock, { [`CLL${lock}R`]: '@LREV', [`CLL${lock}LT`]: '@REVLT', ...conflict }, 'SwitchLock', { [`UL${lock}`]: '@LOCKED', [`CLL${lock}LT`]: '@REVLT' }, 'known-issue');
  scenario(`lock.${lock}.already-unlocked`, 'points', lock, { [`CLL${lock}R`]: '@LREV', [`UL${lock}`]: '@UNLOCKED', [`CLL${lock}LT`]: '@REVLT', ...conflict }, 'SwitchLock', { [`UL${lock}`]: '@UNLOCKED' }, 'known-issue');
  scenario(`lock.${lock}.relock`, 'points', lock, { [`CLL${lock}R`]: '@LNOR', [`UL${lock}`]: '@UNLOCKED', [`CLL${lock}LT`]: '@REVLT' }, 'SwitchLock', { [`UL${lock}`]: '@LOCKED', [`CLL${lock}LT`]: '@NORLT' });
}
const officeFixtures = [
  ['occupied9', { BK9: 1 }, [3]], ['occupied7', { BK7: 1 }, [7, 9, 15]],
  ['occupied8', { BK8: 1 }, [9, 11]], ['occupied3', { BK3: 1 }, [23]], ['occupied4', { BK4: 1 }, [23, 25]],
  ['held4', { TLV4: '@RIGHT' }, [3]], ['held8', { TLV8: '@RIGHT' }, [7, 9, 15]],
  ['held8-branch15', { TLV8: '@LEFT', SWL15LTK: 2 }, [7, 9, 15, 17]],
  ['held10-right', { TLV10: '@RIGHT' }, [9, 11, 19]],
  ['held10-cross9', { TLV10: '@RIGHT', SWL9LTK: 2 }, [7, 9, 15]],
  ['held10-cross9-branch15', { TLV10: '@RIGHT', SWL9LTK: 2, SWL15LTK: 2 }, [7, 9, 15, 17]],
  ['held10-left-normal11', { TLV10: '@LEFT' }, [9, 11, 19]],
  ['held10-left-reverse11', { TLV10: '@LEFT', SWL11LT: 2 }, [11, 19]],
  ['held12', { TLV12: '@RIGHT' }, [11, 19]],
  ['held24-left', { TLV24: '@LEFT' }, [23]], ['held24-right', { TLV24: '@RIGHT' }, [23]],
  ['held26', { TLV26: '@RIGHT' }, [23, 25]], ['held26-reverse25', { TLV26: '@LEFT', SWL25LTK: 2 }, [25]],
];
for (const [label, setup, lit] of officeFixtures) {
  const c = scenario(`point-lamps.${label}`, 'points', 'office-lamps', setup, 'OfficeIndications', {});
  for (const point of [3, 7, 9, 11, 15, 17, 19, 23, 25]) expect(c, `SWLI${point}`, lit.includes(point) ? 1 : 0);
}
scenario('point-lamps.indication-code-retains', 'points', 'office-lamps', { CDEIND: 1, SWLI3: 1 }, 'OfficeIndications', { SWLI3: 1 });

for (const [block, branches] of Object.entries(f.direction_assignments)) for (const [label, direction, setup] of branches) {
  scenario(`block.${block}.set.${label}`, 'blocks', block, setup, 'SetTrafficSticks', { [`FS${block}`]: symbolic(direction) });
  const opposite = direction === 'EAST' ? 'WEST' : 'EAST';
  scenario(`block.${block}.retain.${label}`, 'blocks', block, { ...setup, [`FS${block}`]: symbolic(opposite) }, 'SetTrafficSticks', { [`FS${block}`]: symbolic(opposite) });
}
for (const r of f.direction_releases) {
  const setup = { [`FS${r.block}`]: symbolic(r.direction), ...r.setup };
  scenario(`block.${r.block}.release.${r.label}`, 'blocks', r.block, setup, 'ClearTrafficSticks', { [`FS${r.block}`]: '@NDT' });
  for (const [name, value] of Object.entries(r.blockers)) {
    const slug = name.replaceAll('[', '-').replaceAll(']', '');
    scenario(`block.${r.block}.hold.${r.label}.${slug}`, 'blocks', r.block, { ...setup, [name]: value }, 'ClearTrafficSticks', { [`FS${r.block}`]: symbolic(r.direction) });
  }
}
for (const [src, dest, block, direction, points] of f.id_edges) {
  const setup = { [`FS${block}`]: symbolic(direction), [`TrainID[${src}]`]: text('TRAIN'), [`LocoID[${src}]`]: text('LOCO'), ...points };
  for (const occupied of new Set([src, dest])) if (occupied <= 10) setup[`BK${occupied}`] = 1;
  scenario(`block.${block}.id.${src}-to-${dest}`, 'blocks', block, setup, 'UpdateTrainIDs', { [`TrainID[${dest}]`]: text('TRAIN'), [`LocoID[${dest}]`]: text('LOCO'), [`TrainID[${src}]`]: text(src >= 11 ? '' : 'TRAIN') });
  scenario(`block.${block}.id-no-overwrite.${src}-to-${dest}`, 'blocks', block, { ...setup, [`TrainID[${dest}]`]: text('OTHER') }, 'UpdateTrainIDs', { [`TrainID[${dest}]`]: text('OTHER') });
}
for (let block = 1; block <= 10; block++) scenario(`block.${block}.clear-id`, 'blocks', block, { [`TrainID[${block}]`]: text('TRAIN'), [`LocoID[${block}]`]: text('LOCO') }, 'CheckTrainClear', { [`TrainID[${block}]`]: text(''), [`LocoID[${block}]`]: text('') });
for (const [boundary, adjacent] of [[11, 8], [12, 4], [13, 9], [14, 9]]) {
  for (const occupied of [0, 1]) scenario(`boundary.${boundary}.cleanup.occupied-${occupied}`, 'blocks', boundary, { [`TrainID[${boundary}]`]: text('TRAIN'), [`OkToClearTrain[${boundary}]`]: true, [`BK${adjacent}`]: occupied }, 'CheckTrainClear', { [`TrainID[${boundary}]`]: text(occupied ? 'TRAIN' : ''), [`OkToClearTrain[${boundary}]`]: Boolean(occupied) });
  scenario(`boundary.${boundary}.not-eligible`, 'blocks', boundary, { [`TrainID[${boundary}]`]: text('TRAIN') }, 'CheckTrainClear', { [`TrainID[${boundary}]`]: text('TRAIN') });
}
scenario('boundary.15.legacy-unused', 'blocks', 15, { 'TrainID[15]': text('LEGACY') }, 'UpdateTrainIDs', { 'TrainID[15]': text('LEGACY') });

for (let block = 1; block <= 10; block++) {
  const bytes = [0, 0, 0]; bytes[block <= 8 ? 0 : 1] = 1 << ((block - 1) % 8);
  const c = add(`io.block-${block}.input`, 'io', block, {}, 'Single occupancy-bit decoding');
  c.source = 'CTCLogic.vb::ReadRailroad'; input(c, 3, bytes); call(c, 'ReadRailroad');
  for (let other = 1; other <= 10; other++) expect(c, `BK${other}`, other === block ? 1 : 0);
}
for (const [power, timer, update] of [[0, -1, false], [2, -1, false], [1, 1, false], [1, -1, true]]) {
  const c = add(`io.power-${power}.timer-${timer}`, 'io', 'power', { BK1: 1, 'TD[19]': timer }, 'Power gating retains or updates occupancy');
  c.source = 'CTCLogic.vb:726-755'; input(c, 2, [0, power, 0]); input(c, 3, [0, 0, 0]); call(c, 'ReadRailroad'); expect(c, 'BK1', update ? 0 : 1);
}
const failedPoll = add('known.io.failed-poll-reuses-panel-bytes', 'io', 'comms', {}, 'Ignored INPUTS error permits shared-buffer reuse', 'known-issue', 'CMRI_COMMUNICATIONS.md');
failedPoll.source = 'CTCLogic.vb::ReadRailroad'; input(failedPoll, 1, [], 1); call(failedPoll, 'ReadRailroad'); expect(failedPoll, 'SGL26', '@RIGHT');
for (const [index, point] of [3, 7, 9, 11, 15, 23].entries()) {
  const c = add(`io.feedback-${point}.decoded-unused`, 'io', point, {}, 'Contact decoding does not establish physical correspondence');
  c.source = 'CTCLogic.vb:719-724; CTCSwitch'; input(c, 2, [1 << index, 1, 0]); call(c, 'ReadRailroad'); expect(c, `TFB${point}`, 1); call(c, 'CTCSwitch'); expect(c, `SWL${point}LT`, '@NORLT');
  set(c, `TFB${point}`, 0); call(c, 'CTCSwitch'); expect(c, `SWL${point}LT`, '@NORLT');
}
scenario('known.output.node3-inherits-node2', 'io', 'outputs', {}, 'WriteRailroad', { 'Output[3,6]': 170 }, 'known-issue');
const yellow = scenario('io.output.true-yellow', 'io', 'outputs', { SIG26LC: '@YEL' }, 'WriteRailroad', { 'Output[3,6]': 1 }); expect(yellow, 'Output[3,5]', 0, { mask: 3, shift: 6 });
const lamp = scenario('io.output.lamp-test', 'io', 'panel', { LAMPTEST: true }, 'WriteRailroad', {});
for (const node of [0, 1]) for (let byte = 1; byte <= 6; byte++) expect(lamp, `Output[${node},${byte}]`, 255);

const startup = scenario('known.startup.no-settling-phase', 'lifecycle', 'startup', {}, 'CTCSwitch', {}, 'known-issue');
for (const [point, details] of Object.entries(f.points)) { expect(startup, `SM${point}`, '@TUN'); expect(startup, `SWL${point}LT`, '@NORLT'); expect(startup, `TD[${details[2]}]`, 0); }
const freshCycle = scenario('lifecycle.fresh-memory-cycle', 'lifecycle', 'startup', {}, 'DoOneControlCycle', { 'MainPanel.UpdateCount': 1 });
for (const [name, red] of Object.entries({ SIG4RA: 'RED', SIG4RB: 'RED', SIG4LAB: 'REDRED', SIG8RAB: 'REDRED', SIG8RC: 'RED', SIG8LABC: 'REDREDRED', SIG8LD: 'RED', SIG10LAB: 'REDRED', SIG10RABC: 'REDREDRED', SIG12RA: 'RED', SIG24LA: 'RED', SIG24RAB: 'REDRED', SIG26LAB: 'REDRED', SIG26LC: 'RED', SIG26RAB: 'REDRED' })) expect(freshCycle, name, symbolic(red));
for (const node of [0, 1, 2, 3]) expect(freshCycle, `WriteCount[${node}]`, 1);
scenario('known.restart.retains-tlv-and-timer', 'lifecycle', 'restart', { TLV8: '@RIGHT', 'TD[5]': 7, IC: 3 }, 'Reinitialize', { TLV8: '@RIGHT', 'TD[5]': 7, IC: 3 }, 'known-issue');
for (const visible of [false, true]) scenario(`lifecycle.signal-test-visible-${visible}`, 'lifecycle', 'maintenance', { 'SignalTest.Visible': visible, SIG4RA: '@GRN' }, 'DoOneControlCycle', { SIG4RA: visible ? '@GRN' : '@RED' }, visible ? 'known-issue' : 'characterization');
for (const [signal, block, timer] of [[4, 9, 11], [8, 7, 12], [10, 8, 13], [12, 8, 21], [24, 3, 14], [26, 4, 15]]) {
  for (const direction of (signal === 12 ? ['RIGHT'] : ['LEFT', 'RIGHT'])) scenario(`time-lock.${signal}.establish-${direction}`, 'lifecycle', signal, { [`SGL${signal}LT`]: symbolic(direction + 'LT'), [`SGL${signal}R`]: symbolic(direction) }, 'TimeLocking', { [`TLV${signal}`]: symbolic(direction) });
  const c = scenario(`time-lock.${signal}.cancel`, 'lifecycle', signal, { [`TLV${signal}`]: '@RIGHT' }, 'TimeLocking', { [`TD[${timer}]`]: '@RTDL', [`TLV${signal}`]: '@RIGHT' });
  set(c, `TD[${timer}]`, -1); call(c, 'TimeLocking'); expect(c, `TLV${signal}`, 0);
  scenario(`time-lock.${signal}.occupied-reset`, 'lifecycle', signal, { [`TLV${signal}`]: '@RIGHT', [`SGL${signal}R`]: '@RIGHT', [`BK${block}`]: 1 }, 'TimeLocking', { [`TLV${signal}`]: 0, [`SGL${signal}R`]: '@LSTOP', [`SGL${signal}LT`]: '@STOPLT' });
}
const yard = scenario('yard.west.wait-and-accept', 'lifecycle', 'yard', { SGL10R: '@LEFT', SM11: '@TUR' }, 'DoControls', { CWSTATUS: '@TrainWaiting' });
set(yard, 'SWICW', 1); call(yard, 'DoControls'); expect(yard, 'CWSTATUS', '@YardAccept'); set(yard, 'SWL11LT', '@REVLT'); call(yard, 'RouteCheckEast'); expect(yard, 'SIG10LAB', '@REDGRN'); set(yard, 'BK8', 1); call(yard, 'RouteCheckEast'); expect(yard, 'SIG10LAB', '@REDRED'); expect(yard, 'CWSTATUS', '@TrainInBlock');

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const attributes = object => Object.entries(object).map(([key, value]) => `${key}="${escape(value)}"`).join(' ');
const lines = ['<?xml version="1.0" encoding="utf-8"?>', `<catalog schema="1" baseline="${f.baseline}" status="prepared-not-executed">`, '  <constants>'];
for (const [name, value] of Object.entries(f.constants)) lines.push('    <constant ' + attributes({ name, value }) + ' />');
lines.push('  </constants>', '  <cases>');
for (const c of cases) {
  const { steps, ...meta } = c; lines.push('    <case ' + attributes(meta) + '>');
  for (const step of steps) { const { op, ...data } = step; lines.push(`      <${op} ${attributes(data)} />`); }
  lines.push('    </case>');
}
lines.push('  </cases>', '</catalog>');
await writeFile(path.join(root, 'cases.xml'), lines.join('\n') + '\n', 'utf8');
const count = key => Object.fromEntries([...new Set(cases.map(c => c[key]))].sort().map(value => [value, cases.filter(c => c[key] === value).length]));
const summary = { status: 'prepared-not-executed', total_cases: cases.length, executed_cases: 0,
  classification_counts: count('classification'), categories: count('category'),
  devices: [...coverage].sort(([a], [b]) => a.localeCompare(b)).map(([key, number]) => { const [category, device] = key.split(':'); return { category, device, cases: number }; }),
  excluded: ['physical hardware', 'real CMRI serial driver', 'original WinForms rendering/menus', 'wall-clock accuracy', '2018 backups', 'exhaustive state-space proof'] };
await writeFile(path.join(root, 'coverage.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ authored_cases: cases.length, categories: summary.categories, executed_cases: 0 }));
