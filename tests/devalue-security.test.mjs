import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

// Resolve the actual transitive dependency used by the Svelte toolchain.
const appRequire = createRequire(new URL('../apps/svelte5/package.json', import.meta.url));
const svelteRequire = createRequire(appRequire.resolve('svelte/package.json'));
const moduleUrl = pathToFileURL(svelteRequire.resolve('devalue')).href;
const { stringify, stringifyAsync, parse, uneval } = await import(moduleUrl);

test('GHSA-x5rw-q4pp-hg5g: caught serialization failures do not terminate Node', () => {
  const child = spawnSync(process.execPath, [
    '--unhandled-rejections=strict', '--input-type=module', '--eval', `
      import assert from 'node:assert/strict';
      import { setTimeout as delay } from 'node:timers/promises';
      import { stringifyAsync } from ${JSON.stringify(moduleUrl)};
      const error = new Error('synthetic rejection');
      await assert.rejects(
        stringifyAsync({ slow: delay(50, 42), failing: Promise.reject(error) }),
        e => e === error
      );
      await delay(50);
    `
  ], { timeout: 5000, encoding: 'utf8' });
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
});

const serializers = [
  ['stringify', stringify, parse],
  ['stringifyAsync', stringifyAsync, parse],
  ['uneval', uneval, source => (0, eval)(`(${source})`)]
];

for (const [name, serialize, deserialize] of serializers) {
  test(`GHSA-j22f-vq7h-c4qm: ${name} isolates Buffer views`, async () => {
    // Initialize only our allocation; never print serialized pool contents.
    const allocation = Buffer.allocUnsafe(128).fill(255);
    const view = allocation.subarray(8, 11);
    view.set([1, 2, 3]);
    const result = deserialize(await serialize({ view, again: view }));
    assert.equal(result.view, result.again);
    assert.equal(result.view.byteOffset, 0);
    assert.equal(result.view.buffer.byteLength, 3);
    assert.deepEqual([...result.view], [1, 2, 3]);
  });
}

test('ordinary typed arrays retain their shared backing store and offsets', async () => {
  const buffer = new Uint8Array([0, 1, 2, 3, 4]).buffer;
  const view = new Uint8Array(buffer, 1, 3);
  for (const [, serialize, deserialize] of serializers) {
    const result = deserialize(await serialize({ buffer, view }));
    assert.equal(result.view.buffer, result.buffer);
    assert.equal(result.view.byteOffset, 1);
    assert.deepEqual([...result.view], [1, 2, 3]);
  }
});
