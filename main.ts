// Gobble Gauntlet entry packager for make.fun's turkey-run-game-01 bounty.
// Stages the offline HTML5 game/ directory and screenshots/ into the target output
// folder and writes the canonical dossier.json verified by the competition gate.

import { cpSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import type { Stats } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath as uriToPath } from 'node:url';
import { buildDossier as compileEntryDossier } from './vendor/makefun-game.ts';
import type { DossierCaps } from './vendor/makefun-game.ts';

interface BundleLocations {
  repoRoot: string;
  gameSourceDir: string;
  screenshotsSourceDir: string;
  outputRoot: string;
}

const GOBBLE_GATE_CAPS: DossierCaps = {
  text_max_bytes: 160 * 1024,
  screenshots: {
    max: 4,
    max_bytes: 256 * 1024,
  },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function resolveBundleLocations(): BundleLocations {
  const entryFile = uriToPath(import.meta.url);
  const repoRoot = dirname(entryFile);
  const outputRoot = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
  return {
    repoRoot,
    gameSourceDir: resolve(repoRoot, 'game'),
    screenshotsSourceDir: resolve(repoRoot, 'screenshots'),
    outputRoot,
  };
}

function assertDirectoryPresent(targetPath: string, label: string): void {
  let info: Stats;
  try {
    info = statSync(targetPath);
  } catch {
    throw new Error(`Gobble Gauntlet packaging failed: missing ${label} directory at ${targetPath}`);
  }
  if (!info.isDirectory()) {
    throw new Error(`Gobble Gauntlet packaging failed: ${label} path is not a directory (${targetPath})`);
  }
}

function verifyAssets(paths: BundleLocations): void {
  assertDirectoryPresent(paths.gameSourceDir, 'game');
  assertDirectoryPresent(paths.screenshotsSourceDir, 'screenshots');

  const indexPage = resolve(paths.gameSourceDir, 'index.html');
  let indexInfo: Stats;
  try {
    indexInfo = statSync(indexPage);
  } catch {
    throw new Error(`Gobble Gauntlet packaging failed: missing game entry page at ${indexPage}`);
  }
  if (!indexInfo.isFile()) {
    throw new Error(`Gobble Gauntlet packaging failed: ${indexPage} must be a regular file`);
  }
}

function exportGameBundle(paths: BundleLocations): Uint8Array {
  mkdirSync(paths.outputRoot, { recursive: true });

  const stagedGameDir = resolve(paths.outputRoot, 'game');
  const stagedShotsDir = resolve(paths.outputRoot, 'screenshots');

  cpSync(paths.gameSourceDir, stagedGameDir, { recursive: true });
  cpSync(paths.screenshotsSourceDir, stagedShotsDir, { recursive: true });

  const dossierBytes = compileEntryDossier(paths.outputRoot, GOBBLE_GATE_CAPS);
  const dossierPath = resolve(paths.outputRoot, 'dossier.json');
  writeFileSync(dossierPath, dossierBytes);
  return dossierBytes;
}

function runGobblePackager(): void {
  const locations = resolveBundleLocations();
  verifyAssets(locations);
  exportGameBundle(locations);
}

runGobblePackager();
