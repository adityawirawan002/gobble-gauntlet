// Gobble Gauntlet v3 entry packager for make.fun's turkey-run-game-01 bounty.
// Stages the offline HTML5 game/ directory and screenshots/ into the target output
// folder, enforces PNG/JPEG dimension & byte caps, and writes canonical dossier.json.

import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import type { Stats } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath as uriToPath } from 'node:url';
import { buildDossier as compileEntryDossier } from './vendor/makefun-game.ts';
import type { DossierCaps } from './vendor/makefun-game.ts';

interface BundleLocations {
  repoRoot: string;
  gameSourceDir: string;
  screenshotsSourceDir: string;
  outputRoot: string;
}

interface ImageDims {
  format: 'PNG' | 'JPEG';
  width: number;
  height: number;
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

const MAX_LONG_SIDE = 1280;
const MIN_SHORT_SIDE = 360;

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

function parseImageDimensions(bytes: Uint8Array, name: string): ImageDims {
  // PNG signature + IHDR chunk.
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { format: 'PNG', width: view.getUint32(16, false), height: view.getUint32(20, false) };
  }

  // JPEG SOI + SOF0/SOF1/SOF2 marker scan.
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      if (offset >= bytes.length) break;
      const marker = bytes[offset];
      offset += 1;
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const segLen = (bytes[offset] << 8) | bytes[offset + 1];
      if (segLen < 2 || offset + segLen > bytes.length) break;
      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isSof && segLen >= 7) {
        const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
        const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
        return { format: 'JPEG', width, height };
      }
      offset += segLen;
    }
  }
  throw new Error(`Gobble Gauntlet packaging failed: unreadable PNG/JPEG header for ${name}`);
}

function verifyAssets(paths: BundleLocations): Array<{ name: string; bytes: number; dims: ImageDims }> {
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

  const shotFiles = readdirSync(paths.screenshotsSourceDir)
    .filter((name) => ['.jpg', '.jpeg', '.png'].includes(extname(name).toLowerCase()))
    .sort();
  if (shotFiles.length < 3 || shotFiles.length > GOBBLE_GATE_CAPS.screenshots.max) {
    throw new Error(
      `Gobble Gauntlet packaging failed: expected 3..${GOBBLE_GATE_CAPS.screenshots.max} screenshots, found ${shotFiles.length}`,
    );
  }

  const verifiedShots: Array<{ name: string; bytes: number; dims: ImageDims }> = [];
  for (const name of shotFiles) {
    const filePath = resolve(paths.screenshotsSourceDir, name);
    const bytes = new Uint8Array(readFileSync(filePath));
    if (bytes.length <= 0 || bytes.length > GOBBLE_GATE_CAPS.screenshots.max_bytes) {
      throw new Error(
        `Gobble Gauntlet packaging failed: screenshot ${name} size (${bytes.length} B) exceeds ${GOBBLE_GATE_CAPS.screenshots.max_bytes} B`,
      );
    }
    const dims = parseImageDimensions(bytes, name);
    const longSide = Math.max(dims.width, dims.height);
    const shortSide = Math.min(dims.width, dims.height);
    if (longSide > MAX_LONG_SIDE || shortSide < MIN_SHORT_SIDE) {
      throw new Error(
        `Gobble Gauntlet packaging failed: screenshot ${name} dimensions ${dims.width}x${dims.height} violate longSide<=${MAX_LONG_SIDE} && shortSide>=${MIN_SHORT_SIDE}`,
      );
    }
    verifiedShots.push({ name, bytes: bytes.length, dims });
  }
  return verifiedShots;
}

function exportGameBundle(paths: BundleLocations): { dossierBytes: Uint8Array; textBytes: number; truncated: boolean } {
  mkdirSync(paths.outputRoot, { recursive: true });

  const stagedGameDir = resolve(paths.outputRoot, 'game');
  const stagedShotsDir = resolve(paths.outputRoot, 'screenshots');

  cpSync(paths.gameSourceDir, stagedGameDir, { recursive: true });
  cpSync(paths.screenshotsSourceDir, stagedShotsDir, { recursive: true });

  const dossierBytes = compileEntryDossier(paths.outputRoot, GOBBLE_GATE_CAPS);
  const dossierPath = resolve(paths.outputRoot, 'dossier.json');
  writeFileSync(dossierPath, dossierBytes);

  const parsed = JSON.parse(Buffer.from(dossierBytes).toString('utf8')) as { text: string };
  const textBytes = Buffer.byteLength(parsed.text, 'utf8');
  const truncated = parsed.text.includes('[Cut at ');
  return { dossierBytes, textBytes, truncated };
}

function runGobblePackager(): void {
  const locations = resolveBundleLocations();
  const shots = verifyAssets(locations);
  const { dossierBytes, textBytes, truncated } = exportGameBundle(locations);
  const shotLog = shots
    .map((s) => `${s.name}(${s.dims.format} ${s.dims.width}x${s.dims.height}, ${s.bytes}B)`)
    .join(', ');
  console.log(
    `Gobble Gauntlet v3 packaged -> ${locations.outputRoot} | dossier=${dossierBytes.length}B | text=${textBytes}B | truncated=${truncated ? 'YES' : '0'} | shots=[${shotLog}]`,
  );
}

runGobblePackager();
