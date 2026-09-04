import { UA, isPrivate, isHttp, json, ysmmFrom, metaRefreshFrom, paramFrom } from "../_shared/extractors.js";

export async function onRequestPost({request}){
  let body; try{ body=await request.json(); }catch{ return json({success:false, error:"json"},400); }
  const src=(body.url||"").trim();
  if(!isHttp(src)) return json({success:false, error:"url harus http(s)"},400);
  let host; try{ host=new URL(src).hostname; }catch{ return json({success:false, error:"url tidak valid"},400); }
  if(isPrivate(host)) return json({success:false, error:"host ditolak (SSRF)"},403);

  let res;
  try{
    res = await fetch(src, {redirect:"follow", headers:{"user-agent":UA,"accept-language":"id,en"}, signal: AbortSignal.timeout(12000)});
  }catch(e){
    return json({success:false, error:"fetch gagal/timeout — coba userscript (butuh browser asli)"});
  }
  const html=(await res.text()).slice(0,300000);
  const finalUrl=res.url || src;

  // priority: ysmm > meta > param
  const byYsmm=ysmmFrom(html);
  if(byYsmm) return json({success:true, resolved: byYsmm, url: byYsmm, service:"adf.ly", steps:2});
  const byMeta=metaRefreshFrom(html);
  if(byMeta) return json({success:true, resolved: byMeta, url: byMeta, service:"meta-refresh", steps:2});
  const byParam=paramFrom(finalUrl);
  if(byParam) return json({success:true, resolved: byParam, url: byParam, service:"param", steps:1});

  // no match → hint userscript (needs DOM)
  return json({success:false, error:"tidak ketemu pola — kemungkinan butuh klik/timer JS. Pakai userscript."});
}
export async function onRequestGet({request}){
  const url=(new URL(request.url).searchParams.get("url")||"").trim();
  return onRequestPost({request: new Request(request.url, {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({url})})});
}
