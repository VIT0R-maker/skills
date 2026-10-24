import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { verify } from '../verify.mjs';

const fixture = fileURLToPath(new URL('../fixture/', import.meta.url));
const modalFixture = fileURLToPath(new URL('./fixtures/modal/', import.meta.url));

test('fixture: quatro viewports, imagens lazy, regiões e menu com movimento', { timeout: 120000 }, async t => {
  const out = await mkdtemp(path.join(os.tmpdir(), 'landing-browser-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  const config = JSON.parse(await readFile(path.join(fixture, 'verify-config.json'), 'utf8'));
  const report = await verify({ root: fixture, out, desktopWidth: 1200, scale: 1, config });
  assert.equal(report.automatedPassed, true, JSON.stringify(report, null, 2));
  assert.equal(report.fidelityEstablished, false);
  assert.deepEqual(report.viewports.map(item => item.width), [1200, 768, 390, 360]);
  assert.equal(report.motion.length, 3);
  for (const viewport of report.viewports) {
    const image = await sharp(path.join(out, viewport.screenshot)).metadata();
    assert.equal(image.width, viewport.width); assert.ok(image.height > 1000);
    assert.equal(viewport.regions.length, 2);
    assert.equal(viewport.inspection.forms[0].submitted, false);
  }
});

test('modal: fechar interno funciona enquanto abridor está inert, com reversão real', { timeout: 120000 }, async t => {
  const out = await mkdtemp(path.join(os.tmpdir(), 'landing-modal-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  const config = { menu: { toggle: '#open', close: '#close', panel: '#menu', breakpoint: 900, durationMs: 340 } };
  const report = await verify({ root: modalFixture, out, desktopWidth: 1200, config });
  assert.equal(report.automatedPassed, true, JSON.stringify(report, null, 2));
  for (const motion of report.motion) {
    for (const name of ['reversão começa durante a abertura', 'ativação durante abertura inicia fechamento', 'ativações rápidas por teclado preservam a última intenção', 'modal bloqueia rolagem de fundo', 'modal mantém foco dentro do painel']) {
      assert.equal(motion.checks.find(check => check.name === name)?.passed, true, `${motion.width}: ${name}`);
    }
  }
});

test('falhas reais são reportadas: rede externa bloqueada, JS, imagem e overflow', { timeout: 120000 }, async t => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'landing-broken-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  await writeFile(path.join(temp, 'index.html'), '<html><head><link rel="icon" href="data:,"></head><body><div style="width:2200px">Overflow</div><img src="missing.png"><a href="#missing">Quebrada</a><script>fetch("https://example.invalid/never-send",{method:"POST",body:"test"}).catch(()=>{}); throw new Error("fixture-error");</script></body></html>');
  const report = await verify({ root: temp, out: path.join(temp, '.captures'), desktopWidth: 1200, scale: 2 });
  assert.equal(report.automatedPassed, false);
  const types = new Set(report.viewports.flatMap(item => item.findings.map(finding => finding.type)));
  for (const type of ['blocked-request', 'javascript', 'http', 'image', 'overflow', 'anchor']) assert.ok(types.has(type), type);
  const screenshot = await sharp(path.join(temp, '.captures', 'page-390.png')).metadata();
  // Em fullPage, a largura acompanha o overflow real; o scale continua registrado.
  assert.ok(screenshot.width >= 390 * 2); assert.equal(report.scale, 2);
});
