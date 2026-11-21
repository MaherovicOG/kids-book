import { hashPassword } from '../lib/password.mjs';
process.stdout.write('Enter the admin password (input hidden):\n');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
const password=await new Promise(resolve=>{
  let value='';
  function read(chunk){value+=chunk;if(/[\r\n]/.test(value)){process.stdin.off('data',read);resolve(value.split(/[\r\n]/)[0]);}}
  process.stdin.on('data',read);process.stdin.resume();
});
if(process.stdin.isTTY)process.stdin.setRawMode(false);
process.stdin.pause();
if(password.length<12)throw new Error('Use at least 12 characters.');
process.stdout.write(hashPassword(password)+'\n');
