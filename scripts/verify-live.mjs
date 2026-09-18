import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
try {
  if(process.env.CONFIRM_LIVE_TEST!=='true' || process.env.FREE_TIER_CONFIRMED!=='true')
    throw new Error('Set CONFIRM_LIVE_TEST=true and FREE_TIER_CONFIRMED=true to authorize one live report and up to two AI calls.');
  const base=new URL(process.env.LIVE_URL || '');
  if(base.protocol!=='https:' || base.username || base.password || base.pathname!=='/' || base.search || base.hash)
    throw new Error('Set LIVE_URL to the HTTPS origin of your CivicLens deployment.');
  if(!process.env.TEST_IMAGE_PATH || !process.env.ADMIN_TOKEN) throw new Error('Set TEST_IMAGE_PATH and ADMIN_TOKEN securely.');
  const image=await readFile(process.env.TEST_IMAGE_PATH);
  const types={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
  const type=types[path.extname(process.env.TEST_IMAGE_PATH).toLowerCase()];
  if(!type || image.length>4*1024*1024) throw new Error('Use a real permitted infrastructure image under 4 MB.');
  const request=async(route,options={})=>{
    const response=await fetch(new URL(route,base),{...options,redirect:'error',signal:AbortSignal.timeout(125_000)});
    if(!response.headers.get('content-type')?.includes('application/json'))throw new Error(`Non-JSON response (${response.status}); check deployment access.`);
    const data=await response.json();
    if(!response.ok)throw new Error(`Live endpoint returned HTTP ${response.status}. Check deployment configuration.`);
    return data;
  };
  assert.equal((await request('/api/health')).status,'ready');
  const body=new FormData();body.set('photo',new File([image],'infrastructure-photo'+path.extname(process.env.TEST_IMAGE_PATH),{type}));
  body.set('title','CivicLens authorized live verification');
  body.set('description',process.env.TEST_DESCRIPTION || 'Infrastructure shown in this photo. This is an authorized demo test; inspect the visible evidence.');
  body.set('area','Demo verification area');body.set('latitude','');body.set('longitude','');
  const {report}=await request('/api/reports',{method:'POST',body});
  assert.ok(report.id);assert.equal(report.is_demo,false);assert.equal(report.analysis_source,'vision','AI must be REAL, not fallback/mock.');
  assert.ok(report.image_url?.startsWith('https://res.cloudinary.com/'));
  assert.ok(report.risk_score>=0 && report.risk_score<=100);
  assert.equal((await request(`/api/reports/${report.id}`)).report.id,report.id);
  await request('/api/reports');await request('/api/dashboard');
  let expectedStatus='reported';
  for(const status of ['under_review','in_progress','resolved']){
    const updated=await request(`/api/reports/${report.id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.ADMIN_TOKEN}`},body:JSON.stringify({status,expectedStatus})});
    assert.equal(updated.report.status,status);expectedStatus=status;
  }
  assert.equal((await request(`/api/reports/${report.id}`)).report.status,'resolved');
  console.log(`PASS: REAL AI, Cloudinary image URL, persisted report, dashboard, protected status lifecycle. Test report ID: ${report.id}`);
  console.log('This test report remains visible and resolved. Image delivery and visual QA still need a browser check.');
}catch(error){console.error(error.message);process.exitCode=1;}
