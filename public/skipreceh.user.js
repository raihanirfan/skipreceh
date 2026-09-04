// ==UserScript==
// @name         SkipReceh
// @namespace    skipreceh
// @version      0.2.1
// @description  Lewati shortlink & safelink receh.
// @author       kamu
// @homepageURL  https://skipreceh.pages.dev
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

  // sfl.gl is handled synchronously at document-start (before DOMContentLoaded 10ms timer)
  if(/sfl\.gl/i.test(location.hostname) || /sfl\.gl/i.test(location.href)){
    // form exists in raw HTML even before DOM ready — poll 5x20ms then submit
    let tries=0;
    const iv=setInterval(()=>{
      const f=document.getElementById('form') || document.querySelector('form[action*="khaddavi"]');
      if(f){ clearInterval(iv); f.submit(); }
      if(++tries>10) clearInterval(iv);
    }, 20);
    // fallback: if form not found, follow meta
    const m=document.documentElement.innerHTML.match(/https?:\/\/app\.khaddavi\.net\/redirect\.php[^\s"'<>]+/i);
    if(m) setTimeout(()=>location.replace(m[0]), 50);
  }

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

  register({ rule: /adf\.ly|adfoc\.us|ay\.gy|j\.gs|q\.gs|tinyical|uii\.io/i, start(){ const u=ysmmFrom(document.documentElement.innerHTML); if(u) location.replace(u); } });
  register({ rule: /safelink/i, start(){ const u=paramFrom(); if(u) location.replace(u); } });
  register({ rule: /./, start(){
    const u=ysmmFrom(document.documentElement.innerHTML) || paramFrom();
    if(!u) return;
    const hashParam=new URLSearchParams(location.hash.slice(1)).get("url");
    if(u===location.href || u===hashParam) return;
    location.replace(u);
  }});

  function run(){
    // skip sfl.gl — already handled above
    if(/sfl\.gl/i.test(location.href)) return;
    const h=findHandler();
    if(h && typeof h.start==="function") try{ h.start(); }catch{}
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
