// backward compat: /api/bypass?url= → same as /api/organic
import { onRequestPost as organicPost } from "./organic.js";
import { json } from "../_shared/extractors.js";
export async function onRequestGet({request}){
  const url=(new URL(request.url).searchParams.get("url")||"").trim();
  const r = await organicPost({request: new Request(request.url, {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({url})})});
  // remap {resolved} → {url, ok} for old client
  try{
    const j=await r.json();
    if(j.success) return json({ok:true, url: j.resolved || j.url});
    return json({ok:false, error: j.error}, r.status);
  }catch{ return r; }
}
