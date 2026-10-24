import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defaultDestination, installSkill } from './install.mjs';

async function fixture(t) {
  const temporary = await fs.mkdtemp(path.join(process.env.LANDING_FROM_IMAGES_TEST_TMP || os.tmpdir(), 'landing installer test '));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, 'repository', 'landing-from-images');
  const destination = path.join(temporary, 'personal', 'skills');
  await fs.mkdir(path.join(source, 'agents'), { recursive: true });
  await fs.writeFile(path.join(source, 'SKILL.md'), '---\nname: landing-from-images\ndescription: fixture\n---\nVersion one\n');
  await fs.writeFile(path.join(source, 'agents', 'openai.yaml'), 'interface:\n  display_name: "Fixture"\n');
  return { temporary, source, destination, target: path.join(destination, 'landing-from-images') };
}

async function linkForTest(t, target, link) {
  try { await fs.symlink(target, link, process.platform === 'win32' ? 'junction' : 'dir'); return true; }
  catch (error) {
    if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
    t.skip(`Este ambiente não permite criar links/junctions (${error.code}).`);
    return false;
  }
}

test('default resolves the current real user home and the current personal skill scope', () => {
  assert.equal(defaultDestination(), path.join(os.homedir(), '.agents', 'skills'));
});

test('installs only the variant and omits dependencies, secrets and test output', async (t) => {
  const { source, destination, target } = await fixture(t);
  const other = path.join(destination, 'other-skill');
  await fs.mkdir(other, { recursive: true });
  await fs.writeFile(path.join(other, 'keep.txt'), 'unchanged');
  for (const name of ['node_modules', '.test-output', 'test-results', 'playwright-report']) {
    await fs.mkdir(path.join(source, name));
    await fs.writeFile(path.join(source, name, 'ignore.txt'), 'omit');
  }
  await fs.writeFile(path.join(source, '.env.local'), 'do not copy');
  await fs.writeFile(path.join(source, 'README.md'), 'install instructions');
  const result = await installSkill({ source, destination });
  assert.deepEqual(result, { destination: target, backup: null });
  assert.equal(await fs.readFile(path.join(other, 'keep.txt'), 'utf8'), 'unchanged');
  assert.deepEqual((await fs.readdir(target)).sort(), ['README.md', 'SKILL.md', 'agents']);
  assert.deepEqual((await fs.readdir(destination)).sort(), ['landing-from-images', 'other-skill']);
});

test('refuses replacement without --update and preserves custom files in a separate backup', async (t) => {
  const { source, destination, target } = await fixture(t);
  await installSkill({ source, destination });
  await fs.writeFile(path.join(target, 'custom.txt'), 'personal customization');
  await fs.writeFile(path.join(source, 'README.md'), 'version two');
  await assert.rejects(installSkill({ source, destination }), /--update/);
  assert.equal(await fs.readFile(path.join(target, 'custom.txt'), 'utf8'), 'personal customization');
  const result = await installSkill({ source, destination, update: true });
  assert.equal(await fs.readFile(path.join(result.backup, 'custom.txt'), 'utf8'), 'personal customization');
  assert.equal(await fs.readFile(path.join(target, 'README.md'), 'utf8'), 'version two');
  await assert.rejects(fs.access(path.join(target, 'custom.txt')));
  assert.equal(path.dirname(path.dirname(result.backup)), path.dirname(destination));
  assert.notEqual(path.dirname(result.backup), destination);
  assert.deepEqual(await fs.readdir(destination), ['landing-from-images']);
});

test('refuses a same-source target, a nested destination, roots and unrelated existing folders', async (t) => {
  const { source, destination, target } = await fixture(t);
  for (const root of [path.dirname(source), path.join(source, 'nested'), path.parse(source).root, os.homedir()]) {
    await assert.rejects(installSkill({ source, destination: root, update: true }));
  }
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, 'keep.txt'), 'unrelated');
  await assert.rejects(installSkill({ source, destination, update: true }));
  assert.equal(await fs.readFile(path.join(target, 'keep.txt'), 'utf8'), 'unrelated');
});

test('rejects junctions in the destination and source without changing the linked directory', async (t) => {
  const { temporary, source, destination } = await fixture(t);
  const external = path.join(temporary, 'external');
  await fs.mkdir(external);
  await fs.writeFile(path.join(external, 'keep.txt'), 'external data');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  if (!(await linkForTest(t, external, destination))) return;
  await assert.rejects(installSkill({ source, destination }), /junction/);
  await fs.unlink(destination);
  if (!(await linkForTest(t, external, path.join(source, 'linked')))) return;
  await assert.rejects(installSkill({ source, destination }), /junction/);
  assert.deepEqual(await fs.readdir(external), ['keep.txt']);
});

test('rejects junctions inside an existing skill before moving it to backup', async (t) => {
  const { temporary, source, destination, target } = await fixture(t);
  await installSkill({ source, destination });
  const external = path.join(temporary, 'external');
  await fs.mkdir(external);
  if (!(await linkForTest(t, external, path.join(target, 'linked')))) return;
  await assert.rejects(installSkill({ source, destination, update: true }), /junction/);
  assert.ok((await fs.lstat(target)).isDirectory());
  await assert.rejects(fs.access(path.join(path.dirname(destination), '.landing-from-images-backups')));
});

test('does not remove a pre-existing installation lock or modify an installed skill', async (t) => {
  const { source, destination, target } = await fixture(t);
  await installSkill({ source, destination });
  const lock = path.join(destination, '.landing-from-images.install.lock');
  await fs.writeFile(lock, 'another installer');
  await assert.rejects(installSkill({ source, destination, update: true }), /lock/);
  assert.equal(await fs.readFile(lock, 'utf8'), 'another installer');
  assert.match(await fs.readFile(path.join(target, 'SKILL.md'), 'utf8'), /Version one/);
});

test('CLI handles paths with spaces and refuses unknown options', async (t) => {
  const { source, destination, target } = await fixture(t);
  await fs.mkdir(path.join(source, 'scripts'));
  const executable = path.join(source, 'scripts', 'install.mjs');
  await fs.copyFile(fileURLToPath(new URL('./install.mjs', import.meta.url)), executable);
  const run = (...args) => spawnSync(process.execPath, [executable, ...args], { encoding: 'utf8', windowsHide: true });
  const help = run('--help');
  assert.equal(help.status, 0, help.stderr);
  const first = run('--dest', destination);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /Skill instalada:/);
  assert.ok((await fs.lstat(target)).isDirectory());
  assert.equal(run('--dest', destination).status, 1);
  assert.equal(run('--dest', destination, '--update').status, 0);
  assert.equal(run('--unknown').status, 1);
  assert.equal(run('--dest', '').status, 1);
});
