import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { test } from 'node:test';

test('rebuilding retained SVGs preserves artwork and applies exactly one CSS scope', () => {
  const root = mkdtempSync(join(tmpdir(), 'icon-compiler-'));
  try {
    const build = join(root, 'app', 'build'), source = join(root, 'source'), empty = join(root, 'empty');
    for (const folder of [build, source, empty]) mkdirSync(folder, { recursive: true });
    const compiler = join(build, 'compile-icon-library.mjs');
    copyFileSync(new URL('../build/compile-icon-library.mjs', import.meta.url), compiler);
    writeFileSync(join(source, 'scoped-art.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>.st0, path {fill:red}</style><path class="st0" d="M1 1h20v20H1Z"/></svg>');
    const compile = input => {
      execFileSync(process.execPath, [compiler, input], { encoding: 'utf8' });
      const sandbox = { window: { LocalApp: {} } };
      for (const file of ['icon-library-part-1.js', 'icon-library-part-2.js', 'icon-library-part-3.js', 'icon-library-part-4.js', 'icon-library.js']) {
        vm.runInNewContext(readFileSync(join(root, 'app', 'assets', 'js', file), 'utf8'), sandbox);
      }
      return sandbox.window.LocalApp.iconLibrary.icons;
    };
    const first = compile(source), second = compile(empty), third = compile(empty);
    assert.equal(first.length, 1);
    assert.equal(second.length, 1);
    assert.equal(second[0].id, first[0].id);
    assert.equal(second[0].svg, first[0].svg);
    assert.equal(third[0].svg, first[0].svg);
    assert.equal((third[0].svg.match(/<svg[^>]*data-icon-style-scope=/g) || []).length, 1);
    assert.match(third[0].svg, /\[data-icon-style-scope="[a-f0-9]+"\] \.st0/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
