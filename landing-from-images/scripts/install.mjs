#!/usr/bin/env node
import { constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';

const NAME = 'landing-from-images';
const SOURCE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const EXCLUDED = new Set([
  'node_modules', '.git', '.cache', '.work', '.tmp', '.test-output', 'coverage',
  'test-results', 'playwright-report', 'blob-report', 'Thumbs.db', '.DS_Store',
]);

export function defaultDestination() {
  return path.join(os.homedir(), '.agents', 'skills');
}

async function statIfExists(filename) {
  try { return await fs.lstat(filename); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function rejectLinkedAncestors(filename) {
  let current = path.resolve(filename);
  while (true) {
    const stat = await statIfExists(current);
    if (stat?.isSymbolicLink()) throw new Error(`Link simbólico ou junction não permitido: ${current}`);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function excluded(name) {
  return EXCLUDED.has(name) || name === '.env' || name.startsWith('.env.')
    || name.startsWith(`.${NAME}-install-`);
}

async function checkTree(directory, skipExcluded = false) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (skipExcluded && excluded(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    const stat = await fs.lstat(filename);
    if (stat.isSymbolicLink()) throw new Error(`Link simbólico ou junction não permitido: ${filename}`);
    if (stat.isDirectory()) await checkTree(filename, skipExcluded);
    else if (!stat.isFile()) throw new Error(`Tipo de arquivo não suportado: ${filename}`);
  }
}

async function checkSkill(directory, requireMetadata) {
  await rejectLinkedAncestors(directory);
  const stat = await statIfExists(directory);
  if (!stat?.isDirectory()) throw new Error(`A pasta da skill não é um diretório: ${directory}`);
  const skill = path.join(directory, 'SKILL.md');
  await rejectLinkedAncestors(skill);
  const markdown = await fs.readFile(skill, 'utf8');
  const frontmatter = markdown.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!frontmatter || !/^name:\s*['"]?landing-from-images['"]?\s*$/m.test(frontmatter)) {
    throw new Error(`O SKILL.md não identifica ${NAME}: ${skill}`);
  }
  if (requireMetadata) {
    const metadata = path.join(directory, 'agents', 'openai.yaml');
    await rejectLinkedAncestors(metadata);
    if (!(await statIfExists(metadata))?.isFile()) throw new Error(`Metadados ausentes: ${metadata}`);
  }
}

function checkDestination(source, root) {
  if (root === path.parse(root).root || path.relative(os.homedir(), root) === '') {
    throw new Error('Use uma pasta de skills; a raiz do disco e a pasta pessoal não são destinos válidos.');
  }
  if (process.platform === 'win32') {
    if (/^\\\\/.test(root) || root.slice(path.parse(root).root.length).split(path.sep)
      .some((part) => /[:<>"|?*]|[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) {
      throw new Error('Use um caminho local Windows comum, sem dispositivos, ADS ou nomes reservados.');
    }
    for (const systemRoot of [process.env.SystemRoot, process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean)) {
      if (within(path.resolve(systemRoot), root)) throw new Error(`Pasta de sistema não permitida: ${root}`);
    }
  }
  const target = path.join(root, NAME);
  if (within(source, root) || within(source, target) || within(target, source)) {
    throw new Error('Origem e destino não podem coincidir nem conter um ao outro.');
  }
  return target;
}

async function copySkill(source, destination) {
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (excluded(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    const stat = await fs.lstat(from);
    if (stat.isSymbolicLink()) throw new Error(`Link simbólico ou junction não permitido: ${from}`);
    if (stat.isDirectory()) {
      await fs.mkdir(to);
      await copySkill(from, to);
    } else if (stat.isFile()) {
      await fs.copyFile(from, to, constants.COPYFILE_EXCL);
    } else throw new Error(`Tipo de arquivo não suportado: ${from}`);
  }
}

/** Install only this skill; every update retains the complete previous directory. */
export async function installSkill({ destination = defaultDestination(), update = false, source = SOURCE } = {}) {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22 ou superior é necessário.');
  source = path.resolve(source);
  const root = path.resolve(destination);
  const target = checkDestination(source, root);
  const backupRoot = path.join(path.dirname(root), `.${NAME}-backups`);
  if (within(root, backupRoot)) throw new Error('A pasta de backups deve ficar fora da raiz de skills.');
  await rejectLinkedAncestors(root);
  await checkSkill(source, true);
  await checkTree(source, true);
  const previous = await statIfExists(target);
  if (previous) {
    if (!update) throw new Error(`A skill já existe. Use --update para criar um backup e atualizar: ${target}`);
    await checkSkill(target, false);
    await checkTree(target);
    await rejectLinkedAncestors(backupRoot);
  }

  await fs.mkdir(root, { recursive: true });
  await rejectLinkedAncestors(root);
  const lockPath = path.join(root, `.${NAME}.install.lock`);
  let lock;
  try { lock = await fs.open(lockPath, 'wx'); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Instalação em andamento ou lock antigo: ${lockPath}. Verifique antes de remover o lock.`);
    throw error;
  }
  let staging;
  let backup = null;
  try {
    await lock.writeFile(`pid=${process.pid}\n`);
    // Stage beside the skills root: partial copies cannot appear as installed skills.
    staging = await fs.mkdtemp(path.join(path.dirname(root), `.${NAME}-install-`));
    await copySkill(source, staging);
    await checkSkill(staging, true);
    await rejectLinkedAncestors(target);
    const current = await statIfExists(target);
    if (Boolean(current) !== Boolean(previous)) throw new Error('O destino mudou durante a preparação. Execute novamente.');
    if (current) {
      await checkSkill(target, false);
      await checkTree(target);
      await rejectLinkedAncestors(backupRoot);
      await fs.mkdir(backupRoot, { recursive: true });
      backup = path.join(backupRoot, `${NAME}-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`);
      await fs.rename(target, backup);
    }
    try { await fs.rename(staging, target); staging = undefined; }
    catch (error) {
      if (backup && !(await statIfExists(target))) {
        try { await fs.rename(backup, target); backup = null; }
        catch (restoreError) { throw new Error(`Falha ao instalar e restaurar. Sua versão anterior está em ${backup}. ${restoreError.message}`, { cause: error }); }
      }
      throw error;
    }
    return { destination: target, backup };
  } finally {
    try {
      if (staging) {
        const parent = path.dirname(root);
        if (path.dirname(staging) !== parent || !path.basename(staging).startsWith(`.${NAME}-install-`)) {
          throw new Error('Limpeza recusada: pasta temporária fora do local esperado.');
        }
        await rejectLinkedAncestors(staging);
        await checkTree(staging);
        await fs.rm(staging, { recursive: true });
      }
    } finally {
      await lock.close();
      await fs.unlink(lockPath);
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: { dest: { type: 'string' }, update: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
    allowPositionals: false,
  });
  if (values.help) {
    console.log(`Instala apenas ${NAME}, sem pacotes globais. Requer Node.js >=22.

node landing-from-images/scripts/install.mjs
node landing-from-images/scripts/install.mjs --update
node landing-from-images/scripts/install.mjs --dest "C:\\caminho\\skills"

Padrão: ${defaultDestination()}
--dest é a raiz que receberá a pasta ${NAME}; também permite CODEX_HOME/skills legado.
--update preserva a pasta anterior completa em .${NAME}-backups, ao lado da raiz de skills.
As dependências de desenvolvimento são instaladas separadamente no projeto, conforme README.`);
    return;
  }
  if (values.dest !== undefined && !values.dest.trim()) throw new Error('--dest exige um caminho não vazio.');
  const result = await installSkill({ destination: values.dest, update: values.update });
  console.log(`Skill instalada: ${result.destination}`);
  if (result.backup) console.log(`Backup completo da versão anterior: ${result.backup}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`Falha na instalação: ${error.message}`); process.exitCode = 1; });
}
