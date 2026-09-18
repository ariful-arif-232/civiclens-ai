import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { neonEndpoint, neonRequest, neonJson, neonTransaction } from '../lib/integrations/neon-http.mjs';
import { cloudinaryConfig, cloudinarySignature, reportImageId, isReportImageUrl, uploadImage, destroyImage } from '../lib/integrations/cloudinary-http.mjs';
import { geminiConfig, analyzeWithGemini } from '../lib/integrations/gemini-http.mjs';
// Deliberately non-functional, synthetic fixtures. No live credentials or provider calls.
const connection = 'postgresql://fixture:fixture@ep-example-test.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const id='20000000-0000-4000-8000-000000000001';
const cloud={cloudName:'fixture',apiKey:'fixture-key',apiSecret:'fixture-secret'};
const imageUrl=`https://res.cloudinary.com/fixture/image/upload/v1/civiclens-ai/reports/${id}.webp`;
const ai={key:'fixture-key',model:'gemini-2.5-flash-lite'};
const input={description:'A deep pothole near the main gate.',imageData:'data:image/webp;base64,YWJjZA=='};
const json=x=>Response.json(x);

test('Neon endpoint uses only the validated hostname, never the password',()=>{
  assert.equal(neonEndpoint(connection),'https://ep-example-test.ap-southeast-1.aws.neon.tech/sql');
});
for (const bad of ['http://localhost','postgresql://u:p@evil.test/db','postgresql://u:p@neon.tech.evil.test/db',
  'postgresql://u:p@127.0.0.1/db','postgresql://u:p@ep-test.region.neon.tech:8080/db','not-a-url']) {
  test(`Neon rejects unsafe database endpoint ${bad}`,()=>assert.throws(()=>neonEndpoint(bad)));
}
test('Neon parameters are separate from SQL, null preserved, TLS redirect disabled',async()=>{
  await neonRequest(connection,'SELECT $1,$2',["x'; DROP TABLE reports;--",null],async(url,opts)=>{
    assert.equal(url.includes('fixture'),false); assert.equal(opts.redirect,'error');
    const data=JSON.parse(opts.body); assert.equal(data.query,'SELECT $1,$2');
    assert.deepEqual(data.params,["x'; DROP TABLE reports;--",null]);
    assert.equal(opts.headers['Neon-Connection-String'],connection);
    return json({rows:[],fields:[]});
  });
});
test('Neon decodes database-generated JSON without losing timestamps/booleans/numbers',async()=>{
  const record={score:65,is_demo:false,created_at:'2026-09-18T00:00:00+00:00'};
  const result=await neonJson(connection,'SELECT to_jsonb(r) FROM reports r',[],async()=>json({rows:[[JSON.stringify(record)]],fields:[{name:'to_jsonb'}]}));
  assert.deepEqual(result,[record]);
});
test('Neon drops raw database failure content',async()=>{
  await assert.rejects(()=>neonRequest(connection,'query',[],async()=>new Response(connection,{status:500})),e=>e.message==='Database request failed.');
});
test('Neon drops thrown transport secrets',async()=>{
  await assert.rejects(()=>neonRequest(connection,'query',[],async()=>{throw new Error(connection)}),e=>!e.message.includes('fixture'));
});
test('Neon rejects malformed transport results',async()=>{
  await assert.rejects(()=>neonRequest(connection,'query',[],async()=>json({rows:'bad'})));
  await assert.rejects(()=>neonJson(connection,'query',[],async()=>json({rows:[['not-json']],fields:[]})));
});
test('Neon batch transaction keeps all statements in one request',async()=>{
  const result=await neonTransaction(connection,[{query:'SELECT $1',params:[1]},{query:'SELECT $1',params:[null]}],async(url,opts)=>{
    assert.equal(new URL(url).protocol,'https:');
    assert.deepEqual(JSON.parse(opts.body).queries,[{query:'SELECT $1',params:['1']},{query:'SELECT $1',params:[null]}]);
    return json({results:[{rows:[]},{rows:[]}]});
  }); assert.equal(result.length,2);
});
test('Cloudinary missing config fails closed',()=>assert.throws(()=>cloudinaryConfig({})));
test('Cloudinary signature sorts parameters and never transmits the secret',()=>{
  assert.equal(cloudinarySignature({timestamp:'1',public_id:'sample'},'fixture'),createHash('sha256').update('public_id=sample&timestamp=1fixture').digest('hex'));
});
test('Cloudinary namespace rejects arbitrary paths',()=>{
  assert.equal(reportImageId(id),`civiclens-ai/reports/${id}`);
  assert.throws(()=>reportImageId('../unrelated-asset'));
});
test('Cloudinary result URL checks host, account, asset, version, and format',()=>{
  assert.equal(isReportImageUrl(imageUrl,'fixture',reportImageId(id)),true);
  for(const url of [imageUrl.replace('https:','http:'),imageUrl.replace('res.cloudinary.com','evil.test'),imageUrl+'?x=y',imageUrl.replace(id,'foreign'),imageUrl.replace('/fixture/','/other/')]) {
    assert.equal(isReportImageUrl(url,'fixture',reportImageId(id)),false);
  }
});
test('Cloudinary uploads normalized bytes via signed server-side multipart',async()=>{
  const uploaded=await uploadImage(id,Buffer.from('normalized-photo'),cloud,async(url,opts)=>{
    assert.equal(url,'https://api.cloudinary.com/v1_1/fixture/image/upload');
    assert.equal(opts.redirect,'error'); assert.equal(opts.body.get('public_id'),reportImageId(id));
    assert.equal(opts.body.get('overwrite'),'false'); assert.equal(opts.body.get('api_secret'),null);
    assert.equal(opts.body.get('file').type,'image/webp');
    assert.equal(opts.body.get('file').name,'photo.webp');
    return json({public_id:reportImageId(id),resource_type:'image',secure_url:imageUrl});
  }); assert.deepEqual(uploaded,{path:reportImageId(id),url:imageUrl});
});
test('Cloudinary rejects an unexpected returned asset',async()=>{
  await assert.rejects(()=>uploadImage(id,Buffer.from('x'),cloud,async()=>json({public_id:'foreign',resource_type:'image',secure_url:imageUrl})));
});
test('Cloudinary sanitizes failed upload responses',async()=>{
  await assert.rejects(()=>uploadImage(id,Buffer.from('x'),cloud,async()=>new Response(cloud.apiSecret,{status:401})),e=>!e.message.includes(cloud.apiSecret));
});
test('Cloudinary cleanup restricted to this report and accepts already absent asset',async()=>{
  await destroyImage(id,cloud,async(url,opts)=>{
    assert.ok(url.endsWith('/image/destroy')); assert.equal(opts.body.get('public_id'),reportImageId(id));
    return json({result:'not found'});
  });
  await assert.rejects(()=>destroyImage('../foreign',cloud,async()=>{throw new Error('must not execute')}));
});
test('Gemini missing credentials and unsafe model identifiers rejected',()=>{
  assert.throws(()=>geminiConfig({})); assert.throws(()=>geminiConfig({GEMINI_API_KEY:'fixture',GEMINI_MODEL:'../../anything'}));
  assert.equal(geminiConfig({GEMINI_API_KEY:'fixture'}).model,'gemini-2.5-flash-lite');
});
test('Gemini sends real image bytes + description and JSON schema, with key in header only',async()=>{
  const analysis={category:'road_damage',severity:'high',summary:'A pothole is visible.',reasoning:'On-site review is needed.'};
  const result=await analyzeWithGemini(input,{type:'object'},ai,async(url,opts)=>{
    assert.equal(url.includes('fixture-key'),false);assert.equal(opts.headers['x-goog-api-key'],'fixture-key');
    assert.equal(opts.redirect,'error');const body=JSON.parse(opts.body);
    assert.equal(body.contents[0].parts[0].text,input.description);
    assert.equal(body.contents[0].parts[1].inlineData.data,'YWJjZA==');
    assert.equal(body.generationConfig.responseMimeType,'application/json');
    assert.deepEqual(body.generationConfig.responseJsonSchema,{type:'object'});
    assert.equal(body.tools,undefined);
    return json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(analysis)}]}}]});
  }); assert.deepEqual(result,analysis);
});
test('Gemini ignores thought parts rather than mixing them with the JSON answer',async()=>{
  const result=await analyzeWithGemini(input,{},ai,async()=>json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'not returned'},{text:'{"category":"other"}'}]}}]}));
  assert.deepEqual(result,{category:'other'});
});
for(const response of [{promptFeedback:{blockReason:'SAFETY'}},{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{}'}]}}]},
  {candidates:[{finishReason:'STOP',content:{parts:[{text:'not-json'}]}}]},{}]) {
  test('Gemini blocks incomplete, unsafe or malformed response '+JSON.stringify(response).slice(0,65),async()=>{
    await assert.rejects(()=>analyzeWithGemini(input,{},ai,async()=>json(response)));
  });
}
test('Gemini rejects arbitrary image URLs and sanitizes upstream errors',async()=>{
  await assert.rejects(()=>analyzeWithGemini({...input,imageData:'https://localhost/private'}, {},ai));
  await assert.rejects(()=>analyzeWithGemini(input,{},ai,async()=>new Response(ai.key,{status:429})),e=>!e.message.includes(ai.key));
});
