import { isPrivate, isHttp, json } from "../_shared/extractors.js";

const MAP=[
  {re:/adf\.ly|adfoc\.us|ay\.gy|j\.gs|q\.gs|tinyical\.com|uii\.io/i, name:"Adf.ly"},
  {re:/ouo\.io|ouo\.press/i, name:"Ouo.io"},
  {re:/safelink/i, name:"Safelink"},
  {re:/shorte\.st|sh\.st/i, name:"Shorte.st"},
  {re:/linkvertise|link-to\.net/i, name:"Linkvertise"},
  {re:/work\.ink|bstlar\.com|lootlinks|loot-link|cuty\.io|paster\.so/i, name:"AdLink"},
  {re:/bit\.ly|cutt\.ly|rebrand\.ly|shorter\.me|t\.co|t\.ly|tiny\.cc|tinylink\.onl|tinyurl\.com|shorturl\.at|6x\.work|v\.gd/i, name:"Shortener"},
];
export async function onRequestPost({request}){
  let body; try{ body=await request.json(); }catch{ return json({valid:false, error:"json"},400); }
  const url=(body.url||"").trim();
  if(!isHttp(url)) return json({valid:false, error:"url harus http(s)"});
  let host; try{ host=new URL(url).hostname; }catch{ return json({valid:false}); }
  if(isPrivate(host)) return json({valid:false, error:"host ditolak"});
  for(const m of MAP) if(m.re.test(url)) return json({valid:true, service:m.name});
  return json({valid:true, service:"Generic"});
}
export async function onRequestGet({request}){
  const url=(new URL(request.url).searchParams.get("url")||"").trim();
  return onRequestPost({request: new Request(request.url, {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({url})})});
}
