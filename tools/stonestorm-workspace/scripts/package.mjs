import {packager} from '@electron/packager';
import {flipFuses, FuseVersion, FuseV1Options, getCurrentFuseWire} from '@electron/fuses';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw Error('Invalid build version.');
const output = path.join(root, 'dist', pkg.version);
const target = path.resolve(output, pkg.productName + '-win32-x64');
if (!target.startsWith(path.resolve(output) + path.sep) || !/^[A-Za-z0-9 -]+$/.test(pkg.productName)) throw Error('Unsafe build target.');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw Error('Build output may not be a symlink.');
if (fs.existsSync(target) && (fs.lstatSync(target).isSymbolicLink() || !fs.existsSync(path.join(target, 'resources/app.asar')))) throw Error('Refusing to overwrite an unrecognized directory.');
const targets = await packager({dir: root, out: output, platform: 'win32', arch: 'x64',
  name: pkg.productName, executableName: pkg.productName, appVersion: pkg.version,
  electronVersion: pkg.devDependencies.electron, asar: true, prune: true, overwrite: true,
  ignore: [/^\/(?:node_modules|dist|reports|tests|scripts|\.test-profile|\.probe-profile)(?:\/|$)/,
    /^\/(?:\.gitignore|\.nvmrc|package-lock\.json|START_WORKSPACE\.cmd)$/],
  win32metadata: {ProductName: pkg.productName, FileDescription: 'StoneStorm game and four-panel mining workspace'}});
for (const directory of targets) {
  const executable = path.join(directory, pkg.productName + '.exe');
  await flipFuses(executable, {version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false, [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false, [FuseV1Options.OnlyLoadAppFromAsar]: true});
  const asar = path.join(directory, 'resources/app.asar');
  const metadata = {schema: 1, at: new Date().toISOString(), version: pkg.version, electron: pkg.devDependencies.electron,
    executable: path.relative(root, executable), executableBytes: fs.statSync(executable).size,
    executableSha256: crypto.createHash('sha256').update(fs.readFileSync(executable)).digest('hex'),
    appAsarSha256: crypto.createHash('sha256').update(fs.readFileSync(asar)).digest('hex'),
    fuses: await getCurrentFuseWire(executable), signed: false, containsUserSession: false};
  fs.mkdirSync(path.join(root, 'reports'), {recursive: true});
  fs.writeFileSync(path.join(root, 'reports/windows-build.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(JSON.stringify(metadata, null, 2));
}
