import { UA, isPrivate, isHttp, json, ysmmFrom, metaRefreshFrom, paramFrom, formAutoUrl, isShortener } from "../_shared/extractors.js";

export async function onRequestPost({request}){
  try{
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

  // shorteners: pure 301/302 — res.url is final after fetch follow
  if(isShortener(host) && finalUrl !== src && isHttp(finalUrl)) return json({success:true, resolved: finalUrl, url: finalUrl, service:"shortener", steps:1});


  // generic follow fallback: any 301 chain resolved by fetch
  if(finalUrl !== src && isHttp(finalUrl)) return json({success:true, resolved: finalUrl, url: finalUrl, service:"redirect", steps:1});

  // linkvertise server bypass: WaitTask -> 3x AdTask -> DetailPageTargetData (same as userscript 0.2.8 proven E2E)
  // ponytail: 8-loop sequential, add when perlu parallel or retry backoff
  if(/linkvertise\.com|link-to\.net/i.test(src)){
    try{
      const u=new URL(src); const segs=u.pathname.split('/').filter(Boolean);
      const slug=segs[segs.length-1], uid=segs[segs.length-2];
      if(/^\d+$/.test(uid||'') && slug){
        const GQL="https://publisher.linkvertise.com/graphql";
        const ident={userIdAndUrl:{user_id:uid, url:slug}};
        const qGet="query getContent($identifier: PublicLinkIdentificationInput!, $task_args: TaskArgument) { getContent(input: $identifier, task_args: $task_args) { ... on ContentAccessTaskSet { __typename tasks { __typename id ... on PremiumTask { __typename status id } ... on WaitTask { __typename id remainingWaitingTime status adsTotal } ... on AdTask { __typename id status adIndex adsTotal ads{completion_token} payloadBag{taboola{session_id}} } } } ... on DetailPageTargetData { type url paste __typename } __typename } }";
        const qComp="mutation completeTask($identifier: PublicLinkIdentificationInput!, $task_id: String!, $task_args: TaskArgument) { completeTask(input: $identifier, task_id: $task_id, task_args: $task_args) { id ... on AdTask { __typename id status } ... on WaitTask { __typename id status remainingWaitingTime adsTotal } ... on PremiumTask { __typename status id } } }";
        async function gql(body, extraHeaders={}){
          const r=await fetch(GQL,{method:"POST",headers:{"user-agent":UA,"accept":"application/json","content-type":"application/json",...extraHeaders},body,signal:AbortSignal.timeout(8000)});
          if(!r.ok) return null; return r.json().catch(()=>null);
        }
        async function getContent(){
          const body=JSON.stringify({operationName:"getContent",variables:{identifier:ident,task_args:{additional_data:{taboola:{user_id:"fallbackUserId",consent_string:"",url:src,external_referrer:"",session_id:null}}}},query:qGet});
          const j=await gql(body); return j?.data?.getContent||null;
        }
        for(let i=0;i<8;i++){
          const gc=await getContent(); if(!gc) break;
          if(gc.__typename==="DetailPageTargetData"){ if(gc.url && isHttp(gc.url)) return json({success:true,resolved:gc.url,url:gc.url,service:"linkvertise",steps:4}); if(gc.paste) return json({success:true,resolved:gc.paste,url:gc.paste,service:"linkvertise-paste",steps:4}); }
          if(gc.__typename==="ContentAccessTaskSet"){
            const wt=gc.tasks?.find(t=>t.__typename==="WaitTask" && t.status==="IN_PROGRESS");
            if(wt){
              const ta={additional_data:{taboola:{user_id:"fallbackUserId",consent_string:"",url:src,external_referrer:"",session_id:null}}};
              const body=JSON.stringify({operationName:"completeTask",variables:{identifier:ident,task_id:wt.id,task_args:ta},query:qComp});
              await gql(body,{"cqreferrer":src}); continue;
            }
            const ad=gc.tasks?.find(t=>t.__typename==="AdTask" && t.status==="IN_PROGRESS");
            if(!ad) continue;
            const comp=ad.ads?.[0]?.completion_token, sess=ad.payloadBag?.taboola?.session_id;
            if(!comp) break;
            const ta={additional_data:{taboola:{user_id:"fallbackUserId",consent_string:"",url:src,external_referrer:"",session_id:sess}},completion_token:comp};
            const body=JSON.stringify({operationName:"completeTask",variables:{identifier:ident,task_id:ad.id,task_args:ta},query:qComp});
            const jr=await gql(body,{"cqreferrer":src}); if(!jr) break;
          } else break;
        }
        const gc2=await getContent();
        if(gc2?.__typename==="DetailPageTargetData"){ if(gc2.url && isHttp(gc2.url)) return json({success:true,resolved:gc2.url,url:gc2.url,service:"linkvertise",steps:4}); if(gc2.paste) return json({success:true,resolved:gc2.paste,url:gc2.paste,service:"linkvertise-paste",steps:4}); }
      }
    }catch{}
  }

  // no match → butuh browser asli
  return json({success:false, error:"Link ini butuh klik/timer di browser — server tidak bisa bypass.", code:"NEEDS_BROWSER", hint:"Install userscript lalu buka link aslinya, bypass jalan otomatis."});
  }catch(e){ return json({success:false, error:"Server error: "+(e?.message||e), code:"SERVER_ERROR"},500); }
}
export async function onRequestGet({request}){
  const url=(new URL(request.url).searchParams.get("url")||"").trim();
  return onRequestPost({request: new Request(request.url, {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({url})})});
}
