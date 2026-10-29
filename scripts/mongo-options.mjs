import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Reuse an installed executable, but always let the caller choose an isolated
// data directory. This never connects to or changes an existing MongoDB service.
export function mongoBinaryOptions() {
  const options = { downloadDir: fileURLToPath(new URL('../.cache/mongodb', import.meta.url)) };
  const candidates = [];
  if (process.env.MONGOMS_SYSTEM_BINARY) candidates.push(process.env.MONGOMS_SYSTEM_BINARY);
  if (process.platform === 'win32') {
    const directory = join(process.env.ProgramFiles || 'C:/Program Files', 'MongoDB', 'Server');
    if (existsSync(directory)) {
      const versions = readdirSync(directory).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      candidates.push(...versions.map(version => join(directory, version, 'bin', 'mongod.exe')));
    }
  }
  for (const executable of candidates) {
    if (!existsSync(executable)) continue;
    try {
      const output = execFileSync(executable, ['--version'], { encoding: 'utf8', timeout: 10000, windowsHide: true });
      const version = output.match(/db version v(\d+\.\d+\.\d+)/)?.[1];
      if (version) return { ...options, systemBinary: executable, version };
    } catch { /* Fall back to the official cached/downloaded MongoDB binary. */ }
  }
  return options;
}
