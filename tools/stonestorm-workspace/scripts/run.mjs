import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] || 'start';
const options = {start: ['.'], probe: ['.', '--workspace-probe'], runtime: ['tests/runtime.cjs'], 'live-four': ['tests/live-four.cjs'], modes:['tests/modes-runtime.cjs'], 'live-modes':['tests/live-modes.cjs']};
if (!options[mode]) throw Error('Unknown local launch mode.');
const env = {...process.env};
// Coding tools may themselves run on Electron and export these variables.
// Clean only this child process; never change the user's environment settings.
delete env.ELECTRON_RUN_AS_NODE;
delete env.NODE_OPTIONS;
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(electron, args, {cwd: root, env, stdio: 'inherit'});
    child.on('error', reject);child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}
async function withTestProfile(prefix, test) {
  const directory=path.join(root,'.test-profile');
  fs.mkdirSync(directory,{recursive:true});
  const profile=fs.mkdtempSync(path.join(directory,prefix));
  try{return await test(profile);}
  finally{fs.rmSync(profile,{recursive:true,force:true});}
}
if(mode==='modes')process.exitCode=await withTestProfile('modes-',profile=>run([...options.modes,'--test-profile='+profile]));
else if (mode === 'runtime') {
  process.exitCode=await withTestProfile('run-',async profile=>{
    let result=await run([...options.runtime,'--test-profile='+profile]);
    if(result===0)result=await run([...options.runtime,'--test-profile='+profile,'--readback']);
    return result;
  });
} else process.exitCode = await run(options[mode]);
