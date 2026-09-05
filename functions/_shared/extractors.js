export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const HTTP = /^https?:\/\//i;
export const SAFE_PARAMS = new Set(["url","u","link","go","site","r","target","safelink_redirect","dst","href","s"]);

export function b64(s){ try{ return atob(s.replace(/-/g,"+").replace(/_/g,"/")); }catch{ return null; } }
export function toUrl(v){
  if(!v) return null;
  const s=v.trim();
  if(HTTP.test(s)) return s;
  const d=b64(s);
  if(d){ const m=d.match(/https?:\/\/[^\s"'<>]+/i); if(m) return m[0]; }
  return null;
}
export function ysmmFrom(html){
  const m=html.match(/ysmm\s*=\s*["']([\w=]+)["']/);
  if(!m) return null;
  let a="",b="";
  for(let i=0;i<m[1].length;i++) i%2===0?a+=m[1][i]:b=m[1][i]+b;
  const d=b64(a+b);
  const u=d && d.match(/https?:\/\/[^\s"'\\<>]+/i);
  return u?u[0]:null;
}
export function metaRefreshFrom(html){
  const m=html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*>/i);
  if(!m) return null;
  const u=m[0].match(/url\s*=\s*["']?([^"';]+)/i);
  return u?toUrl(u[1]):null;
}
export function paramFrom(finalUrl){
  try{
    const u=new URL(finalUrl);
    const bags=[u.searchParams];
    const h=u.hash.replace(/^[#/]+/,"");
    if(h.includes("=")) bags.push(new URLSearchParams(h));
    for(const q of bags) for(const [k,v] of q) if(SAFE_PARAMS.has(k)){ const t=toUrl(v); if(t) return t; }
  }catch{}
  return null;
}
export function formAutoUrl(html, base){
  const fm=html.match(/<form[^>]+action=["']([^"']+)["'][^>]*>/i);
  if(!fm) return null;
  let action=fm[1].trim();
  try{ action=new URL(action, new URL(base)).toString(); }catch{}
  // collect hidden inputs robustly (order-agnostic)
  const tags=[...html.matchAll(/<input[^>]*>/gi)].map(t=>t[0]);
  const pairs=[];
  for(const tag of tags){
    const n=tag.match(/\bname=["']([^"']+)["']/i);
    const v=tag.match(/\bvalue=["']([^"']*)["']/i);
    if(n) pairs.push([n[1], v?v[1]:""]);
  }
  if(!pairs.length) return null;
  try{
    const u=new URL(action);
    for(const [k,v] of pairs) if(k) u.searchParams.set(k,v);
    return u.searchParams.toString() ? u.toString() : null;
  }catch{ return null; }
}
// dispatcher: rule registry
export const RULES=[];
export function register(rule){ RULES.push(rule); }
export function detect(htmlOrUrl, finalUrl){
  let target = ysmmFrom(htmlOrUrl) || metaRefreshFrom(htmlOrUrl) || paramFrom(finalUrl || htmlOrUrl);
  if(target) return {service: target.includes("ysmm")?"adf.ly":target.includes("meta")?"meta": "param", url: target};
  return null;
}
export function isPrivate(host){
  const h=host.toLowerCase().replace(/^\[|\]$/g,"");
  if(h==="localhost"||h==="::1"||h.endsWith(".local")||h.endsWith(".internal")) return true;
  const m=h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if(m){ const [a,b]=m.slice(1).map(Number); if(a===0||a===10||a===127||a===169||(a===172&&b>=16&&b<=31)||(a===192&&b===168)) return true; }
  return false;
}
export function json(obj,status=200){
  return new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json","access-control-allow-origin":"*"}});
}
export function isShortener(host){
  return /^(?:bit\.ly|cutt\.ly|rebrand\.ly|shorter\.me|t\.ly|tiny\.cc|tinyurl\.com|shorturl\.at|v\.gd)$/i.test(host.toLowerCase());
}
export const isHttp=s=>HTTP.test((s||"").trim());
