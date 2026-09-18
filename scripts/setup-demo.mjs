import { writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
try {
  await writeFile(
    '.env.local',
    `DEMO_MODE=true\nADMIN_TOKEN=${randomBytes(32).toString('hex')}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  console.log(
    'Demo configuration created. The authority token is in your ignored .env.local file. Run npm run dev.',
  );
} catch (error) {
  if (error.code === 'EEXIST') console.log('.env.local already exists; preserved without changes.');
  else throw error;
}
