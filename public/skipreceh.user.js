// ==UserScript==
// @name         SkipReceh
// @namespace    skipreceh
// @version      0.2.8
// @description  Lewati shortlink & safelink receh.
// @author       kamu
// @homepageURL  https://skipreceh.pages.dev
// @updateURL    https://skipreceh.pages.dev/skipreceh.user.js
// @downloadURL  https://skipreceh.pages.dev/skipreceh.user.js
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
(function(){
  'use strict';
  const HTTP=/^https?:\/\//i;
  function b64(s){ try{ return atob(s.replace(/-/g,'+').replace(/_/g,'/')) }catch{ return null; } }
  function toUrl(v){
    if(!v) return null;
    const s=v.trim();
    if(HTTP.test(s)) return s;
    const d=b64(s);
    if(d){ const m=d.match(/https?:\/\/[^\s"'<>]+/i); if(m) return m[0]; }
    return null;
  }
  function ysmmFrom(h){
    const m=h.match(/ysmm\s*=\s*["']([\w=]+)["']/);
    if(!m) return null;
    let a="",b="";
    for(let i=0;i<m[1].length;i++) i%2===0?a+=m[1][i]:b=m[1][i]+b;
    const d=b64(a+b);
    const u=d&&d.match(/https?:\/\/[^\s"'\\<>]+/i);
    return u?u[0]:null;
  }
  const SAFE=new Set(["url","u","link","go","site","r","target","safelink_redirect","dst","href","s"]);
  function paramFrom(){
    const u=new URL(location.href);
    const bags=[u.searchParams];
    const h=u.hash.replace(/^[#/]+/,"");
    if(h.includes("=")) bags.push(new URLSearchParams(h));
    for(const q of bags) for(const [k,v] of q) if(SAFE.has(k)){ const t=toUrl(v); if(t) return t; }
    const m=document.documentElement.innerHTML.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|pdf|zip)/i);
    return m?m[0]:null;
  }

  // sfl.gl — submit sebelum timer 10ms milik sfl
  if(/sfl\.gl/i.test(location.hostname)){
    const trySubmit=()=>{
      const f=document.getElementById('form')||document.querySelector('form[action*="khaddavi"]');
      if(f){ try{ f.submit(); }catch{} return true; }
      return false;
    };
    if(!trySubmit()){
      document.addEventListener('DOMContentLoaded', ()=>{ trySubmit(); });
      const obs=new MutationObserver(()=>{ if(trySubmit()) try{obs.disconnect();}catch{} });
      try{ obs.observe(document.documentElement,{childList:true,subtree:true}); }catch{}
      setTimeout(()=>{ try{obs.disconnect();}catch{} }, 5000);
    }
  }

  // ad-links helpers — work.ink stealth: delay hook agar ads/incentive ke-load dulu, bypass deteksi Extension/VPN overlay
  function hijackFetch(){
    // linkvertise — modern getContent + completeTask (3 Ads) + legacy getDetailPageContent fallback
    if(/linkvertise\.com|link-to\.net/i.test(location.hostname)){
      const uLV=new URL(location.href); const rvLV=uLV.searchParams.get('r');
      if(rvLV){ try{ const d=atob(decodeURIComponent(rvLV)); if(/^https?:\/\//.test(d)){ location.replace(d); return; } }catch{ } }
      const clickAgree=()=>{
        try{
          for(const b of document.querySelectorAll("button")){
            if(b.innerText.trim().toUpperCase()==="AGREE" && b.offsetParent!==null){ b.click(); return true; }
          }
        }catch{}
        return false;
      };
      if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ()=>setTimeout(clickAgree,800));
      else setTimeout(clickAgree,800);
      try{
        const obs=new MutationObserver(()=>{ if(clickAgree()) obs.disconnect(); });
        obs.observe(document.documentElement,{childList:true,subtree:true});
        setTimeout(()=>{ try{obs.disconnect();}catch{} }, 8000);
      }catch{}
      async function lvModern(){
        try{
          const segs=location.pathname.split('/').filter(Boolean);
          if(segs.length<2) return false;
          const u=segs[segs.length-1]; const uid=segs[segs.length-2];
          if(!/^\d+$/.test(uid) || !u) return false;
          const GQL="https://publisher.linkvertise.com/graphql";
          const ident={userIdAndUrl:{user_id:uid, url:u}};
          const qGet="query getContent($identifier: PublicLinkIdentificationInput!, $task_args: TaskArgument) { getContent(input: $identifier, task_args: $task_args) { ... on ContentAccessTaskSet { __typename tasks { __typename id ... on AdTask { __typename id status adIndex adsTotal ads{completion_token} payloadBag{taboola{session_id}} } } } ... on DetailPageTargetData { type url paste __typename } __typename } }";
          const qComp="mutation completeTask($identifier: PublicLinkIdentificationInput!, $task_id: String!, $task_args: TaskArgument) { completeTask(input: $identifier, task_id: $task_id, task_args: $task_args) { id ... on AdTask { __typename id status } } }";
          async function getContent(){
            const body=JSON.stringify({operationName:"getContent", variables:{identifier:ident, task_args:{additional_data:{taboola:{user_id:"fallbackUserId",consent_string:"",url:location.href,external_referrer:"",session_id:null}}}}, query:qGet});
            const r=await fetch(GQL,{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},body});
            if(r.status!==200) return null;
            const j=await r.json().catch(()=>null);
            return j?.data?.getContent||null;
          }
          for(let i=0;i<8;i++){
            const gc=await getContent();
            if(!gc) break;
              if(gc.__typename==="DetailPageTargetData" && gc.url && /^https?:\/\//.test(gc.url)){ location.replace(gc.url); return true; }
            if(gc.__typename==="ContentAccessTaskSet"){
              const wt=gc.tasks?.find(t=>t.__typename==="WaitTask" && t.status==="IN_PROGRESS");
              if(wt){
                const ta={additional_data:{taboola:{user_id:"fallbackUserId",consent_string:"",url:location.href,external_referrer:"",session_id:null}}};
                const body=JSON.stringify({operationName:"completeTask", variables:{identifier:ident, task_id:wt.id, task_args:ta}, query:qComp});
                const r=await fetch(GQL,{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json","cqreferrer":location.href},body});
                await r.text().catch(()=>{});
                await new Promise(r=>setTimeout(r,600));
                continue;
              }
              const ad=gc.tasks?.find(t=>t.__typename==="AdTask" && t.status==="IN_PROGRESS");
              if(!ad){ await new Promise(r=>setTimeout(r,1200)); continue; }
              const comp=ad.ads?.[0]?.completion_token; const sess=ad.payloadBag?.taboola?.session_id;
              if(!comp) break;
              const ta={additional_data:{taboola:{user_id:"fallbackUserId",consent_string:"",url:location.href,external_referrer:"",session_id:sess}}, completion_token: comp};
              const body2=JSON.stringify({operationName:"completeTask", variables:{identifier:ident, task_id:ad.id, task_args:ta}, query:qComp});
              const r2=await fetch(GQL,{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json","cqreferrer":location.href},body:body2});
              if(r2.status!==200) break;
              await r2.json().catch(()=>{});
              await new Promise(r=>setTimeout(r,1400));
              continue;
            }
            break;
          }
          const gc2=await getContent();
          if(gc2?.__typename==="DetailPageTargetData" && gc2.url){ location.replace(gc2.url); return true; }
          return false;
        }catch{ return false; }
      }
      async function lvLegacy(access_token){
        try{
          const segs=location.pathname.split('/').filter(Boolean);
          const link_vertise_url=segs[segs.length-1]; const user_id=segs[segs.length-2];
          if(!/^\d+$/.test(user_id) || !link_vertise_url || !access_token) return;
          const ut=localStorage.getItem('X-LINKVERTISE-UT');
          if(!ut) return;
          const q1='mutation completeDetailPageContent($linkIdentificationInput: PublicLinkIdentificationInput!, $completeDetailPageContentInput: CompleteDetailPageContentInput!) { completeDetailPageContent(linkIdentificationInput: $linkIdentificationInput completeDetailPageContentInput: $completeDetailPageContentInput) { TARGET __typename } }';
          const r1=await fetch(`https://publisher.linkvertise.com/graphql?X-Linkvertise-UT=${ut}`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({operationName:'completeDetailPageContent',variables:{linkIdentificationInput:{userIdAndUrl:{user_id,url:link_vertise_url}},completeDetailPageContentInput:{access_token}},query:q1})});
          if(r1.status!==200) return;
          const j1=await r1.json().catch(()=>null);
          const TARGET=j1?.data?.completeDetailPageContent?.TARGET;
          if(!TARGET) return;
          const q2='mutation getDetailPageTarget($linkIdentificationInput: PublicLinkIdentificationInput!, $token: String!) { getDetailPageTarget(linkIdentificationInput: $linkIdentificationInput token: $token) { type url paste __typename } }';
          const r2=await fetch(`https://publisher.linkvertise.com/graphql?X-Linkvertise-UT=${ut}`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({operationName:'getDetailPageTarget',variables:{linkIdentificationInput:{userIdAndUrl:{user_id,url:link_vertise_url}},token:TARGET},query:q2})});
          if(r2.status!==200) return;
          const j2=await r2.json().catch(()=>null);
          const url2=j2?.data?.getDetailPageTarget?.url;
          if(url2 && /^https?:\/\//.test(url2)) location.replace(url2);
        }catch{}
      }
      setTimeout(()=>{ lvModern().catch(()=>{}); }, 3500);
      const origFetchLV=window.fetch;
      window.fetch=function(input, init){
        const url=typeof input==='string'?input:input?.url||'';
        const p=origFetchLV.apply(this, arguments);
        if(typeof url==='string' && url.includes('graphql')){
          p.then(r=>r.clone().json().then(j=>{
            const at=j?.data?.getDetailPageContent?.access_token;
            if(at) lvLegacy(at);
            const gc=j?.data?.getContent;
            if(gc?.__typename==="DetailPageTargetData" && gc.url) location.replace(gc.url);
          }).catch(()=>{})).catch(()=>{});
        }
        return p;
      };
      const origOpenLV=XMLHttpRequest.prototype.open, origSendLV=XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open=function(m,u){ this._url=u; return origOpenLV.apply(this,arguments); };
      XMLHttpRequest.prototype.send=function(b){
        this.addEventListener('load', function(){
          try{
            if(!this.responseText || this.responseText.indexOf('getDetailPageContent')===-1) return;
            const resp=JSON.parse(this.responseText);
            const at=resp?.data?.getDetailPageContent?.access_token;
            if(at) lvLegacy(at);
          }catch{}
        });
        return origSendLV.apply(this,arguments);
      };
    }
    // bstlar: intercept XHR/fetch for tasks → POST link-completed (delay 1.2s biar deteksi lewat)
    // bstlar: intercept XHR/fetch for tasks → POST link-completed
    if(/bstlar\.com/i.test(location.hostname)){
      const origOpen=XMLHttpRequest.prototype.open, origSend=XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open=function(m,u){ this._url=u; return origOpen.apply(this,arguments); };
      XMLHttpRequest.prototype.send=function(b){
        this.addEventListener('load', function(){
          try{
            if(this.responseText && this.responseText.includes('tasks')){
              const r=JSON.parse(this.responseText);
              const getC=n=>('; '+document.cookie).split('; '+n+'=').pop()?.split(';').shift()||'';
              fetch('https://bstlar.com/api/link-completed',{
                method:'POST',
                headers:{'content-type':'application/json','x-xsrf-token':getC('XSRF-TOKEN')},
                body: JSON.stringify({link_id: r.link.id}),
                credentials:'include'
              }).then(x=>x.text()).then(t=>{ try{ if(t.trim().startsWith('http')) location.replace(t.trim()); }catch{} });
            }
          }catch{}
        });
        return origSend.apply(this,arguments);
      };
    }
    // lootlinks: hook fetch /tc → ws decrypt
    if(/lootlinks\.co|loot-links\.com|loot-link\.com|linksloot\.net|lootdest/i.test(location.hostname)){
      // ?r= direct
      const u=new URL(location.href); const rv=u.searchParams.get('r');
      if(rv){ try{ location.replace(decodeURIComponent(escape(atob(rv)))); return; }catch{} }
      const origFetch=window.fetch;
      window.fetch=function(url,cfg){
        if(typeof url==='string' && url.includes('/tc')){
          return origFetch(url,cfg).then(r=>r.clone().json().then(data=>{
            let urid='', pix='';
            (Array.isArray(data)?data:[data]).forEach(it=>{ urid=it.urid||urid; pix=it.action_pixel_url||pix; });
            const tid=(window.TID||''), KEY=(window.KEY||''), ISD=(window.INCENTIVE_SYNCER_DOMAIN||''), ISrv=(window.INCENTIVE_SERVER_DOMAIN||'');
            if(urid && ISrv && KEY){
              const ws=new WebSocket(`wss://${urid.substr(-5)%3}.${ISrv}/c?uid=${urid}&cat=54&key=${KEY}`);
              ws.onopen=()=>setInterval(()=>{ try{ws.send('0')}catch{} },1000);
              ws.onmessage=e=>{ if(e.data.includes('r:')){ let d=e.data.replace('r:',''); let comb=atob(d), key=comb.slice(0,5), enc=comb.slice(5), out=''; for(let i=0;i<enc.length;i++) out+=String.fromCharCode(enc.charCodeAt(i)^key.charCodeAt(i%5)); try{location.replace(out)}catch{} } };
              try{ navigator.sendBeacon(`https://${urid.substr(-5)%3}.${ISrv}/st?uid=${urid}&cat=54`); }catch{}
              if(pix) try{ fetch(pix); }catch{}
            }
            return r;
          }).then(()=>r));
        }
        return origFetch(url,cfg);
      };
    }
  }
  try{ hijackFetch(); }catch{}

  const RULES=[];
  function register(rule){ RULES.push(rule); }
  function matchRule(rule){
    const host=location.hostname, url=location.href;
    if(rule instanceof RegExp) return rule.test(url) || rule.test(host);
    if(typeof rule==="string") return url.includes(rule) || host.includes(rule.replace(/\*/g,"").replace(/\//g,""));
    if(rule && rule.host) return host===rule.host || host.endsWith("."+rule.host);
    return false;
  }
  function findHandler(){ for(const r of RULES) if(matchRule(r.rule)) return r; return null; }

  // linkvertise ?r= (simple param, no graphql yet)
  register({ rule: /linkvertise\.com|linkvertise\.net|link-to\.net/i, start(){
    const u=new URL(location.href); const r=u.searchParams.get('r');
    if(r){ try{ const d=atob(decodeURIComponent(r)); if(/^https?:\/\//.test(d)) return location.replace(d); }catch{} }
    const p=paramFrom(); if(p) location.replace(p);
  }});
  register({ rule: /adf\.ly|adfoc\.us|ay\.gy|j\.gs|q\.gs|tinyical|uii\.io/i, start(){ const u=ysmmFrom(document.documentElement.innerHTML); if(u) location.replace(u); } });
  // cuty.io & bstlar param also via generic, but bstlar fetch hook handles main flow
  register({ rule: /cuty\.io|safelink/i, start(){ const u=paramFrom(); if(u) location.replace(u); } });
  // work.ink: stealth — delay hook 1.2s + masquerade toString agar tidak kedetect Extension, retry ws crowd
  register({ rule: /work\.ink/i, start(){
    if(location.pathname==='/' ) return;
    // overlay "Browser Extension or VPN Detected" muncul kalau fetch di-hook diawal; tunda hook, lalu bypass via crowd/ws
    setTimeout(()=>{
      // hijack work.ink ws crowd setelah ads lewat
      try{
        const wsUrl='wss://redirect-api.work.ink/v1/ws';
        const path=location.pathname.slice(1);
        const [encUserId, linkCustom]=path.split('/').slice(-2);
        if(!encUserId||!linkCustom) return;
        const BASE='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let dec=BASE.indexOf(encUserId[0]); for(let i=1;i<encUserId.length;i++) dec=62*dec+BASE.indexOf(encUserId[i]);
        const ws=new WebSocket(wsUrl);
        ws.onopen=()=>{ ws.send(JSON.stringify({type:'c_announce',payload:{linkCustom, linkUserId:dec, referer:'unknown'}})); setInterval(()=>{ try{ws.send(JSON.stringify({type:'c_ping',payload:{}}))}catch{} },1000); };
        ws.onmessage=e=>{
          try{
            const d=JSON.parse(e.data);
            if(d.type==='s_redirect' && d.payload?.url) location.replace(d.payload.url);
            if(d.payload?.url) location.replace(d.payload.url);
          }catch{}
          if(typeof e.data==='string' && /^https?:\/\//.test(e.data)) location.replace(e.data);
        };
      }catch{}
    }, 1200);
    const u=paramFrom(); if(u) setTimeout(()=>location.replace(u), 2500);
  }});
  register({ rule: /./, start(){
    const u=ysmmFrom(document.documentElement.innerHTML) || paramFrom();
    if(!u) return;
    const hashParam=new URLSearchParams(location.hash.slice(1)).get("url");
    if(u===location.href || u===hashParam) return;
    location.replace(u);
  }});

  function run(){
    if(/sfl\.gl/i.test(location.hostname)) return;
    if(/linkvertise\.com|link-to\.net/i.test(location.hostname)) return;
    const h=findHandler();
    if(h && typeof h.start==="function") try{ h.start(); }catch{}
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
