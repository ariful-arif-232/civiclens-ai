import { neonEndpoint } from '../lib/integrations/neon-http.mjs';
import { cloudinaryConfig } from '../lib/integrations/cloudinary-http.mjs';
import { geminiConfig } from '../lib/integrations/gemini-http.mjs';
const checks = [
  ['DEMO_MODE must be false for Vercel', () => process.env.DEMO_MODE !== 'true'],
  ['DATABASE_URL configured for Neon', () => !!neonEndpoint(process.env.DATABASE_URL)],
  ['Cloudinary server credentials configured', () => !!cloudinaryConfig()],
  ['Gemini key/model configured', () => !!geminiConfig()],
  ['Strong authority token configured', () => (process.env.ADMIN_TOKEN?.length || 0) >= 24],
  ['Free tier explicitly confirmed', () => process.env.FREE_TIER_CONFIRMED === 'true'],
];
let failed=0;
for(const [name,check] of checks){let ok=false;try{ok=check()}catch{}console.log(`${ok?'PASS':'MISSING'}: ${name}`);if(!ok)failed++;}
console.log('No credential values printed; no network calls or charges made.');
if(failed)process.exitCode=1;
