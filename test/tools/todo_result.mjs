import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// The parent runner raises its stack for the checker. Keep this runtime
// small enough to catch per-character recursion on macOS and CI alike.
if (!process.argv[3]) {
  const result = spawnSync(process.execPath, [import.meta.filename, resolve(process.argv[2]), 'child'], {
    env: { ...process.env, BUN_JSC_maxPerThreadStackUsage: '1048576' },
    encoding: 'utf8',
    timeout: 30000,
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write((result.stderr ?? '').slice(0, 4000));
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `task-result child failed (${result.signal ?? 'no signal'})`);
} else {
  const lib = (await import(pathToFileURL(resolve(process.argv[2])).href)).default;
  const check = (name, fn, text, want) => {
    assert.equal(fn(text), want, name);
    console.log(`ok Todo.result ${name}`);
  };
  for (const [text, want] of [
    ['', ''], ['ok', ''], ['snapshot #123 node', ''],
    ['Task #3 created successfully: x', '3'],
    ['Task #123 created successfully: x', '123'],
    ['Task #0003 created successfully: x', '0003'],
    ['Task # created successfully', ''], ['Task #٣ created successfully', ''],
    ['Task #7 created successfully: 🤖', '7'], ['Task #42#rest', '42'],
  ]) check(`ordinary ${JSON.stringify(text)}`, lib.result, text, want);

  const digits = '1'.repeat(100000);
  check('long digit prefix', lib.digits, digits, digits);
  const long = 'x'.repeat(1000000);
  check('digits stop at the first non-digit', lib.digits, 'x' + long, '');
  check('unrelated output containing a hash', lib.result, 'Browser snapshot #node ' + long, '');
  check('unrelated output without a hash', lib.result, long, '');
  check('long TaskCreate description', lib.result, 'Task #3 created successfully: ' + long, '3');
  check('long numeric TaskCreate id', lib.result, 'Task #' + digits, digits);
  check('task id before a second hash', lib.result, 'Task #42#' + long, '42');
}
