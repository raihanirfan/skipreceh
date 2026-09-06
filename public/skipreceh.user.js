// ==UserScript==
// @name         SkipReceh
// @namespace    skipreceh
// @version      0.2.38
// @description  Lewati shortlink receh.
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
  // ponytail: block ad pop-up windows — keep location.replace for bypass
  try{
    const _nullOpen=()=>null;
    try{ Object.defineProperty(window,'open',{value:_nullOpen, writable:false, configurable:true}); }catch{ try{window.open=_nullOpen;}catch{} }
    try{ Object.defineProperty(Window.prototype,'open',{value:_nullOpen, writable:false, configurable:true}); }catch{}
    // also block anchor _blank hijack early
    try{
      const _aClick=HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click=function(){
        try{ const h=this.href||''; if(this.target==='_blank' && h && !h.includes(location.hostname) && /hai8g|warless|peccary|rvpaste|tpi\.li|shrinkearn|advertisingcamps/i.test(h)==false) return; }catch{}
        // allow if inside bypass flow
        return _aClick.apply(this,arguments);
      };
    }catch{}
  }catch{}
  // ponytail: WPCP copy-protect killer — restore right-click (financeehelp etc)
  try{
    const isWpcp=()=>{ try{ return document.documentElement.innerHTML.includes('wpcp_disable') || document.getElementById('wpcp_disable_selection'); }catch{ return false; } };
    function killWpcp(){
      try{
        if(!isWpcp()) return;
        try{ document.oncontextmenu=null; document.onselectstart=null; document.ondragstart=null; document.onmousedown=null; }catch{}
        try{ window.oncontextmenu=null; window.onselectstart=null; }catch{}
        try{ if(document.body) document.body.removeAttribute('unselectable'); }catch{}
        try{
          const s=document.getElementById('wpcp-error-message'); if(s) s.style.display='none';
        }catch{}
        try{
          if(document.body){
            document.body.style.setProperty('user-select','text','important');
            document.body.style.setProperty('-webkit-user-select','text','important');
            document.body.style.setProperty('-moz-user-select','text','important');
            document.body.style.removeProperty('cursor');
            document.body.style.setProperty('cursor','auto','important');
          }
          document.documentElement.style.setProperty('user-select','text','important');
        }catch{}
        // undo MozUserSelect none set by disableSelection()
        try{
          const all=document.querySelectorAll('body *');
          for(const el of all){
            try{ if(el.style.MozUserSelect==='none') el.style.MozUserSelect='text'; }catch{}
            try{ if(el.style.userSelect==='none') el.style.userSelect='text'; }catch{}
            try{ if(el.style.webkitUserSelect==='none') el.style.webkitUserSelect='text'; }catch{}
          }
        }catch{}
      }catch{}
    }
    // capture-phase: keep contextmenu/selectstart from being cancelled by WPCP's return false
    try{
      document.addEventListener('contextmenu', e=>{ if(isWpcp()){ e.stopImmediatePropagation(); } }, true);
      document.addEventListener('selectstart', e=>{ if(isWpcp()){ e.stopImmediatePropagation(); } }, true);
    }catch{}
    setInterval(killWpcp, 600);
    document.addEventListener('DOMContentLoaded', killWpcp);
    setTimeout(killWpcp, 900);
    setTimeout(killWpcp, 2600);
  }catch{}
  // ponytail: financeehelp.com 15s bypass — auto-click startButton/getmylink if markup exists (currently missing)
  if(/financeehelp\.com/i.test(location.hostname)){
    setInterval(()=>{
      try{
        const sb=document.getElementById('startButton');
        if(sb && sb.offsetParent!==null && getComputedStyle(sb).display!=='none') try{ sb.click(); }catch{}
        for(const id of ['getmylink','getnewlink','wp2continue']){
          const el=document.getElementById(id);
          if(el && !el._srClicked && el.offsetParent!==null && getComputedStyle(el).display!=='none'){ el._srClicked=true; try{ el.click(); }catch{} }
        }
      }catch{}
    }, 800);
  }
  // ponytail: CHP Ads Blocker preempt+kill (financeehelp.com etc) — fake adsbygoogle + bait offsetHeight + block znro class + text fallback
  (function(){
    const ZNRO='znrozeohzeoxncqteqklkvkd_cnxjtcestfjovyaujwdftehod';
    const BODYCLS='ndhvdcraxpnvlratszelbtiu_ktlvybnvlnvfdmnjdlnqrrmd';
    try{
      // 1) fake adsbygoogle before site checks (adsBlocked)
      const fakeAds={push(){}, loaded:true};
      try{ Object.defineProperty(window,'adsbygoogle',{get(){return window._adsFake||fakeAds;},set(v){window._adsFake=v;},configurable:true}); }catch{}
      try{ window.adsbygoogle=fakeAds; window._adsFake=fakeAds; }catch{}
    }catch{}
    try{
      // 2) intercept XHR/fetch for googlesyndication -> fake 200 (prevents callback true)
      const oOpen=XMLHttpRequest.prototype.open;
      const oSend=XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open=function(m,u,...a){ this._chpUrl=typeof u==='string'?u:''; return oOpen.call(this,m,u,...a); };
      XMLHttpRequest.prototype.send=function(...a){
        if(this._chpUrl && this._chpUrl.includes('googlesyndication.com/pagead/js/adsbygoogle.js')){
          try{
            Object.defineProperty(this,'readyState',{value:4, writable:true, configurable:true});
            Object.defineProperty(this,'status',{value:200, writable:true, configurable:true});
            Object.defineProperty(this,'responseText',{value:'/* fake adsbygoogle */ var adsbygoogle={};', writable:true, configurable:true});
            Object.defineProperty(this,'responseURL',{value:this._chpUrl, writable:true, configurable:true});
            Object.defineProperty(this,'response',{value:'/* fake */', writable:true, configurable:true});
          }catch{}
          setTimeout(()=>{ try{ this.onreadystatechange&&this.onreadystatechange(); }catch{} try{ this.onload&&this.onload(); }catch{} try{ this.dispatchEvent&&this.dispatchEvent(new Event('load')); }catch{} },0);
          return;
        }
        return oSend.apply(this,a);
      };
      if(window.fetch){
        const oFetch=window.fetch;
        window.fetch=function(inp,init){
          try{
            const url=typeof inp==='string'?inp:(inp&&inp.url)||'';
            if(url && url.includes('googlesyndication.com/pagead/js/adsbygoogle.js')){
              return Promise.resolve(new Response('/* fake adsbygoogle */', {status:200, headers:{'Content-Type':'text/javascript'}}));
            }
          }catch{}
          return oFetch.call(this,inp,init);
        };
      }
    }catch{}
    try{
      // 3) bait spoof: checkMultiple creates div.adsbox/Ad-Container offsetHeight==0 -> spoof to 100
      const oh=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetHeight');
      const ch=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'clientHeight');
      const isBait=el=> el && el.classList && (el.classList.contains('adsbox')||el.classList.contains('adsbygoogle')||el.classList.contains('Ad-Container')||el.classList.contains('ad-slot')||el.classList.contains('ad-placement'));
      if(oh) Object.defineProperty(HTMLElement.prototype,'offsetHeight',{get(){ if(isBait(this)) return 100; return oh.get.call(this); }, configurable:true});
      if(ch) Object.defineProperty(HTMLElement.prototype,'clientHeight',{get(){ if(isBait(this)) return 100; return ch.get.call(this); }, configurable:true});
    }catch{}
    try{
      // 4) block znro class from ever being added (site: addClass(modal, ZNRO) + addClass(body, BODYCLS))
      const cd=Object.getOwnPropertyDescriptor(Element.prototype,'className');
      if(cd && cd.set){
        Object.defineProperty(Element.prototype,'className',{get:cd.get,set(v){
          if(typeof v==='string'){
            if(v.includes(ZNRO)) v=v.replaceAll(ZNRO,'').replace(/\s+/g,' ').trim();
            if(v.includes(BODYCLS)) v=v.replaceAll(BODYCLS,'').replace(/\s+/g,' ').trim();
          }
          return cd.set.call(this,v);
        }, configurable:true});
      }
      const origAdd=DOMTokenList.prototype.add;
      DOMTokenList.prototype.add=function(...a){
        const f=a.filter(x=> x!==ZNRO && x!==BODYCLS);
        if(!f.length) return;
        return origAdd.apply(this,f);
      };
    }catch{}
    function killChp(){
      try{
        const hasText = document.body && document.body.innerText && document.body.innerText.includes('Ads Blocker Detected');
        const all=[...document.querySelectorAll('*')];
        let killed=0;
        for(const el of all){
          const txt=(el.innerText||'').slice(0,600);
          if(!txt.includes('Ads Blocker Detected')) continue;
          let cur=el;
          for(let i=0;i<6 && cur; i++){
            const cs=getComputedStyle(cur);
            const zi=parseInt(cs.zIndex||0);
            if(cs.position==='fixed' && zi >= 999999){
              try{ cur.style.setProperty('display','none','important'); cur.style.setProperty('pointer-events','none','important'); }catch{}
              killed++; break;
            }
            if(cur===el && cs.position==='fixed' && zi===2147483647){
              try{ cur.style.setProperty('display','none','important'); }catch{} killed++; break;
            }
            cur=cur.parentElement;
          }
          try{ el.style.setProperty('display','none','important'); }catch{}
        }
        if(hasText && !killed){
          for(const el of all){
            const cs=getComputedStyle(el);
            if(cs.display==='none' || cs.visibility==='hidden') continue;
            if(cs.position!=='fixed') continue;
            const zi=parseInt(cs.zIndex||0);
            if(zi < 999999 && zi !== 2147483647) continue;
            const r=el.getBoundingClientRect();
            if(r.width >= window.innerWidth*0.5 && r.height >= window.innerHeight*0.4){
              try{ el.style.setProperty('display','none','important'); el.style.setProperty('pointer-events','none','important'); killed++; }catch{}
            }
          }
        }
        // also force-remove znro/body class if somehow added
        try{
          const m=document.querySelector('.'+ZNRO); if(m) m.classList.remove(ZNRO);
          if(document.body.classList.contains(BODYCLS)) document.body.classList.remove(BODYCLS);
          if(document.body.classList.contains('modal-open')) document.body.classList.remove('modal-open');
        }catch{}
        if(killed){
          try{ document.body.style.overflow='auto'; document.documentElement.style.overflow='auto'; }catch{}
          try{ document.documentElement.style.removeProperty('overflow'); document.body.style.removeProperty('overflow'); }catch{}
          try{ if(getComputedStyle(document.body).position==='fixed') document.body.style.position=''; }catch{}
        }
      }catch{}
    }
    setInterval(killChp, 500);
    document.addEventListener('DOMContentLoaded', killChp);
    try{
      const obs=new MutationObserver(killChp);
      obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
      setTimeout(()=>{ try{obs.disconnect();}catch{} }, 90000);
    }catch{}
    setTimeout(killChp, 800);
    setTimeout(killChp, 2500);
  })();
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
  const SAFE=new Set(["url","u","link","go","site","r","target","dst","href","s"]);
  function paramFrom(){
    const u=new URL(location.href);
    const bags=[u.searchParams];
    const h=u.hash.replace(/^[#/]+/,"");
    if(h.includes("=")) bags.push(new URLSearchParams(h));
    for(const q of bags) for(const [k,v] of q) if(SAFE.has(k)){ const t=toUrl(v); if(t) return t; }
    const m=document.documentElement.innerHTML.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|pdf|zip)/i);
    return m?m[0]:null;
  }

  // ouo.io/ouo.press — auto click "I'm a human" after 2.5s enable + follow /go
  if(/ouo\.io|ouo\.press/i.test(location.hostname)){
    const tryOuo = ()=>{
      const btn=document.getElementById('btn-main');
      if(btn && btn.offsetParent!==null){
        try{ btn.click(); return true; }catch{ return false; }
      }
      return false;
    };
    // page has setTimeout 2500 to enable, we poll
    let tries=0;
    const iv=setInterval(()=>{
      if(tryOuo() || tries++>20) clearInterval(iv);
    }, 600);
    // also if redirected to /go, click again if needed
    setTimeout(()=>{ tryOuo(); }, 4000);
    // if on /go page, auto follow any meta/redirect
    if(location.pathname.startsWith('/go/')){
      setTimeout(()=>{
        const m=document.documentElement.innerHTML.match(/https?:\/\/[^\s"'<>]+/);
        // let site JS handle, just wait for navigation
      }, 2000);
    }
  }

  // tpi.li / shrinkearn — anti-adblock + stuck after captcha (root cause: jQuery replaceWith outerHTML + turnstile callback not auto-submitting)
  if(/tpi\.li|shrinkearn\.com/i.test(location.hostname)){
    // run before site checks (load event)
    try{
      const ih=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
      const oh=Object.getOwnPropertyDescriptor(Element.prototype,'outerHTML');
      if(ih&&ih.set) Object.defineProperty(Element.prototype,'innerHTML',{get:ih.get,set(v){ if(typeof v==='string'&&(v.includes('adb_detected')||/Please disable Adblock/i.test(v))) return; return ih.set.call(this,v); },configurable:true});
      if(oh&&oh.set) Object.defineProperty(Element.prototype,'outerHTML',{get:oh.get,set(v){ if(typeof v==='string'&&(v.includes('adb_detected')||/Please disable Adblock/i.test(v))) return; return oh.set.call(this,v); },configurable:true});
      const rw=Object.getOwnPropertyDescriptor(Element.prototype,'replaceWith');
      if(rw&&rw.value&&!Element.prototype._srPatched){ const orig=rw.value; Element.prototype.replaceWith=function(...a){ const j=a.join(' '); if(typeof j==='string'&&(j.includes('adb_detected')||/Please disable Adblock/i.test(j))) return; return orig.apply(this,a); }; Element.prototype._srPatched=true; }
    }catch{}
    try{
      const oH=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetHeight');
      const cH=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'clientHeight');
      const cW=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'clientWidth');
      const isAdFake=e=>e&&e.classList&&(e.classList.contains('textads')||e.classList.contains('banner-ads')||e.classList.contains('banner_ads')||e.classList.contains('ad-unit')||e.classList.contains('ad-zone')||e.classList.contains('ad-space')||e.classList.contains('adsbox'));
      const isBan=e=>e&&e.classList&&(e.classList.contains('banner-captcha')||e.classList.contains('banner-inner')||e.classList.contains('ad-banner')||e.id==='ad-banner'|| isAdFake(e));
      if(oH) Object.defineProperty(HTMLElement.prototype,'offsetHeight',{get(){ if(isBan(this)) return 100; return oH.get.call(this); },configurable:true});
      if(cH) Object.defineProperty(HTMLElement.prototype,'clientHeight',{get(){ if(isBan(this)) return 100; return cH.get.call(this); },configurable:true});
      if(cW) Object.defineProperty(HTMLElement.prototype,'clientWidth',{get(){ if(isBan(this)) return 300; return cW.get.call(this); },configurable:true});
    }catch{}
    function ensureBanner(){
      try{
        if(!document.querySelector('.banner.banner-captcha')){
          const b=document.createElement('div'); b.className='banner banner-captcha'; b.style.cssText='height:100px;display:block;position:absolute;left:-9999px;top:0';
          const inner=document.createElement('div'); inner.className='banner-inner'; inner.style.cssText='width:300px;height:100px;display:block';
          b.appendChild(inner); (document.body||document.documentElement).appendChild(b);
        } else if(!document.querySelector('.banner.banner-captcha .banner-inner')){
          const inner=document.createElement('div'); inner.className='banner-inner'; inner.style.cssText='width:300px;height:100px;display:block';
          document.querySelector('.banner.banner-captcha').appendChild(inner);
        }
        if(!document.getElementById('ad-banner')){
          const e=document.createElement('div'); e.id='ad-banner'; e.className='ad-banner'; e.style.cssText='height:5px;width:5px;position:absolute;top:0;left:0;display:block';
          (document.body||document.documentElement).appendChild(e);
        }
      }catch{}
    }
    ensureBanner();
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ensureBanner);
    // strip ad pop-up: button onclick hai8g + banner <a target=_blank> (root cause: new tab even when window.open nulled)
    function stripTpiAds(){
      try{
        const btn=document.querySelector('#continue');
        if(btn){
          const oc=btn.getAttribute('onclick')||'';
          if(oc.includes('hai8g')||oc.includes('window.open')) btn.removeAttribute('onclick');
        }
        for(const a of document.querySelectorAll('a[href*="hai8g.com"], a[href*="warlessstarved"], a[href*="peccaryentraps"], a[href*="rvpaste.com"], a[target="_blank"]')){
          try{
            const h=a.href||'';
            // keep same-origin or advertisingcamps (bypass target)
            if(h.includes('advertisingcamps.com')||h.includes(location.hostname)) continue;
            a.removeAttribute('target'); a.style.display='none'; a.style.pointerEvents='none';
          }catch{}
        }
        // also neutralize go-popup form target
        try{ const gp=document.getElementById('go-popup'); if(gp) gp.removeAttribute('target'); }catch{}
      }catch{}
    }
    // overlay killer: remove fixed high-z overlay covering captcha (2147483647) and ensure captcha on top
    function killTpiOverlay(){
      try{
        const cap=document.querySelector('#captchaShortlink');
        if(!cap) return;
        const cr=cap.getBoundingClientRect();
        if(cr.width===0&&cr.height===0) return;
        const cx=cr.left+cr.width/2, cy=cr.top+cr.height/2;
        for(const el of document.querySelectorAll('div, section, iframe, a')){
          if(el===cap || cap.contains(el)) continue;
          const cs=getComputedStyle(el);
          const zi=parseInt(cs.zIndex||0);
          if(zi<9999) continue;
          if(cs.position!=='fixed' && cs.position!=='absolute') continue;
          const r=el.getBoundingClientRect();
          if(r.width<50 || r.height<50) continue;
          // covers captcha center or full viewport
          const coversCap = cx>=r.left && cx<=r.right && cy>=r.top && cy<=r.bottom;
          const coversViewport = r.width>=window.innerWidth*0.8 && r.height>=window.innerHeight*0.5;
          if(coversCap || coversViewport){
            el.style.setProperty('display','none','important');
            el.style.setProperty('pointer-events','none','important');
          }
        }
        cap.style.setProperty('position','relative','important');
        cap.style.setProperty('z-index','2147483647','important');
        cap.style.setProperty('pointer-events','auto','important');
        const ifr=cap.querySelector('iframe');
        if(ifr){ ifr.style.setProperty('pointer-events','auto','important'); ifr.style.setProperty('z-index','2147483647','important'); }
      }catch{}
    }
    // capture-phase click protector: any ad anchor _blank blocked; captcha clicks protected from popunder
    try{
      const isAdHref=h=>/hai8g|warlessstarved|peccaryentraps|rvpaste|ek\.|sx\./i.test(h);
      document.addEventListener('click', e=>{
        const a=e.target.closest&&e.target.closest('a');
        if(a){
          const h=a.href||''; const tgt=a.getAttribute('target');
          if((tgt==='_blank' && h && !h.includes(location.hostname) && !h.includes('advertisingcamps.com')) || isAdHref(h)){
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return;
          }
        }
        // if click is on/over captcha, block popunder handlers (warless) but let iframe handle
        try{
          const cap=document.querySelector('#captchaShortlink');
          if(cap){
            const r=cap.getBoundingClientRect();
            const overCap = e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom;
            const insideCap = cap.contains(e.target) || (e.target.tagName==='IFRAME' && cap.contains(e.target));
            if(overCap || insideCap){
              // block any other document click listeners (popunder) — keep turnstile iframe intact
              e.stopImmediatePropagation();
            }
          }
        }catch{}
      }, true);
      // also block auxclick/mousedown popunder variants
      ['auxclick','mousedown','mouseup'].forEach(ev=>{
        document.addEventListener(ev, e=>{
          const a=e.target.closest&&e.target.closest('a[href*="hai8g"], a[href*="warless"], a[href*="peccary"]');
          if(a){ e.preventDefault(); e.stopImmediatePropagation(); }
        }, true);
      });
    }catch{}
    setInterval(stripTpiAds, 400);
    setInterval(killTpiOverlay, 350);
    document.addEventListener('DOMContentLoaded', ()=>{ stripTpiAds(); killTpiOverlay(); });
    function patchJQuery(){
      try{
        const jq=window.jQuery||window.$;
        if(jq&&jq.fn&&jq.fn.replaceWith&&!jq.fn._srPatched){
          const orig=jq.fn.replaceWith;
          jq.fn.replaceWith=function(v){ if(typeof v==='string'&&(v.includes('adb_detected')||/Please disable Adblock/i.test(v))) return this; if(this.is('#link-view')&&typeof v==='string'&&/adblock/i.test(v)) return this; return orig.apply(this, arguments); };
          jq.fn._srPatched=true;
        }
      }catch{}
    }
    setInterval(patchJQuery, 400);
    // hook turnstile before first render: poll until window.turnstile exists
    let _tpiHooked=false;
    function hookTurnstile(){
      try{
        const ts=window.turnstile;
        if(!ts||!ts.render||_tpiHooked) return;
        const orig=ts.render;
        ts.render=function(sel, opts){
          const origCb=opts&&opts.callback;
          const wrappedCb=function(...a){
            let r; if(typeof origCb==='function') try{ r=origCb.apply(this,a); }catch{}
            // auto-continue 300ms after site enables button, only if token present
            setTimeout(()=>{ tryAutoSubmit('turnstile-cb'); }, 320);
            return r;
          };
          if(opts) opts.callback=wrappedCb;
          // also handle expired/error callbacks to re-enable hook
          return orig.call(this, sel, opts);
        };
        _tpiHooked=true;
        ts._srPatched=true;
      }catch{}
    }
    // poll quickly before site's onloadTurnstileCallback fires (site loads turnstile async)
    const _hookIv=setInterval(()=>{ hookTurnstile(); if(_tpiHooked) clearInterval(_hookIv); }, 120);
    // fallback: if turnstile already rendered, hook future renders via MutationObserver on token input
    function attachTpiGuard(){
      try{
        const _form=document.querySelector('#link-view form')||document.querySelector('#link-view');
        const _f=_form&&(_form.tagName==='FORM'?_form:_form.querySelector('form'));
        if(!_f||_f._srGuard) return;
        _f.addEventListener('submit', e=>{
          const tok=document.querySelector('input[name="cf-turnstile-response"]');
          const hasTok=tok&&tok.value&&tok.value.length>10;
          if(!hasTok){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return; }
          if(window._tpiSubmitted){
            if(window._tpiSubmitCount){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return; }
            window._tpiSubmitCount=1;
          }
        }, true);
        _f._srGuard=true;
        // also neutralize go_popup ad popup if present
        try{
          const jq=window.jQuery||window.$;
          if(jq){
            jq(document).off('click.adLinkFly.goPopupClick');
            const gp=jq('#go-popup');
            if(gp.length) gp.off('submit.adLinkFly.goPopupSubmit').removeAttr('target');
          }
        }catch{}
      }catch{}
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', attachTpiGuard);
    else attachTpiGuard();
    setInterval(attachTpiGuard, 800);
    // ensure captcha never hidden by ad logic or our own hide
    function ensureCaptchaVisible(){
      try{
        const cap=document.querySelector('#captchaShortlink');
        if(cap){ cap.style.display='inline-block'; cap.style.visibility='visible'; cap.hidden=false; }
        const lv=document.querySelector('#link-view');
        if(lv){ lv.style.display=''; lv.style.visibility=''; }
      }catch{}
    }
    setInterval(ensureCaptchaVisible, 700);
    document.addEventListener('DOMContentLoaded', ensureCaptchaVisible);
    // hard block any form targeting Popup_Window (second popup vector)
    try{
      document.addEventListener('submit', e=>{
        const f=e.target;
        if(f && f.target==='Popup_Window'){ f.target='_self'; }
        if(f && f.id==='go-popup'){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
      }, true);
    }catch{}
    function tryAutoSubmit(src){
      try{
        const btn=document.querySelector('#continue');
        const tok=document.querySelector('input[name="cf-turnstile-response"]');
        const hasTok=tok&&tok.value&&tok.value.length>10;
        if(btn&&hasTok){
          // force enable (site disables until captcha, but overlay may keep disabled)
          try{ btn.disabled=false; btn.removeAttribute('disabled'); btn.style.pointerEvents='auto'; }catch{}
          if(btn.disabled) return false;
          // dedupe only if already submitted via guard count
          if(window._tpiSubmitted && window._tpiSubmitCount) return true;
          const oc=btn.getAttribute('onclick')||'';
          if(oc.includes('window.open')||oc.includes('hai8g')){ try{ btn.removeAttribute('onclick'); }catch{} }
          window._tpiSubmitted=true;
          try{ btn.click(); }catch{}
          // also try direct form submit as fallback (bypass onclick popup)
          try{
            const form=btn.closest&&btn.closest('form');
            if(form && !window._tpiSubmitCount){
              setTimeout(()=>{ try{ if(!window._tpiSubmitCount) form.requestSubmit ? form.requestSubmit(btn) : form.submit(); }catch{} }, 120);
            }
          }catch{}
          return true;
        }
        // also handle Get Link / Skip Ad on other shrinkearn variants (no captcha)
        if(!hasTok){
          const altBtn=[...document.querySelectorAll('a,button')].find(b=>{
            const tx=(b.innerText||b.textContent||'').trim();
            return /^(Get Link|Skip Ad)$/i.test(tx) && b.offsetParent!==null && !b.disabled;
          });
          if(altBtn){ altBtn.click(); return true; }
        }
      }catch{}
      return false;
    }
    function restoreTpi(){
      try{
        ensureBanner(); patchJQuery();
        const lv=document.querySelector('#link-view'); if(lv){ lv.style.display=''; lv.style.visibility=''; lv.hidden=false; }
        const row=document.querySelector('.box-main .row'); if(row) row.style.display='';
        const box=document.querySelector('.box-main'); if(box) box.style.display='';
        for(const el of document.querySelectorAll('#adb_detected')) el.remove();
        for(const el of document.querySelectorAll('.alert.alert-danger')){ if(/Adblock|disable/i.test(el.textContent)) el.remove(); }
        if(!document.querySelector('#link-view') && !window._tpiRestored){
          window._tpiRestored=true;
          fetch(location.href,{credentials:'include'}).then(r=>r.text()).then(html=>{
            try{
              const m=html.match(/<div[^>]*id="link-view"[^>]*>[\s\S]*?<\/form>\s*<\/div>/i);
              if(m){
                let host=document.querySelector('.box-main .row')||document.querySelector('.box-main')||document.body;
                const tmp=document.createElement('div'); tmp.innerHTML=m[0];
                const fresh=tmp.querySelector('#link-view');
                if(fresh && !document.querySelector('#link-view')) host.appendChild(fresh);
              }
            }catch{}
          }).catch(()=>{});
        }
      }catch{}
    }
    setInterval(restoreTpi, 700);
    document.addEventListener('DOMContentLoaded', restoreTpi);
    // poll for solved captcha (button enabled + token) — this is what fixes stuck after click
    setInterval(()=>tryAutoSubmit('poll'), 700);
    // immediate on any DOM change (token input filled, disabled removed)
    try{
      const obs=new MutationObserver(()=>{ restoreTpi(); tryAutoSubmit('mut'); });
      obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class','style','value']});
      setTimeout(()=>{ try{obs.disconnect();}catch{} },90000);
    }catch{}
    // also watch token input value via interval (turnstile fills hidden input without attribute change)
    let _lastTok='';
    setInterval(()=>{
      try{
        const tok=document.querySelector('input[name="cf-turnstile-response"]');
        const v=tok?tok.value:'';
        if(v&&v!==_lastTok&&v.length>10){ _lastTok=v; tryAutoSubmit('token-change'); }
      }catch{}
    }, 500);
  }

  // freedl — 60s bypass (GreasyFork 522735) — alive only: freedl.ink, frdl.io/hk/my/by/pw/net/de, fredl.ru/net/de (pruned dead: frdl.to/fi/com/org/co.uk/is, fredl.com/org/co.uk)
  if(/(freedl\.ink|frdl\.(io|hk|my|by|pw|net|de)|fredl\.(ru|net|de))/i.test(location.hostname)){
    function tryFrdl(){
      const btn=document.getElementById('downloadbtnfree');
      const cd=document.getElementById('countdown');
      const cap=document.getElementById('free-captcha');
      const inp=document.getElementById('download_free');
      if(btn&&cd&&cap&&inp){
        try{ inp.value='1'; }catch{}
        try{ cd.style.display='none'; cap.style.display='block'; }catch{}
        try{ btn.disabled=false; btn.innerText='Start Download NOW (after captcha)'; }catch{}
        if(!document.getElementById('userscript_message')){
          const m=document.createElement('p'); m.id='userscript_message'; m.style.color='green'; m.style.textAlign='center';
          m.innerText='Userscript active: Complete captcha then click Start Download NOW';
          try{ cap.after(m); }catch{}
        }
        return true;
      }
      return false;
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', tryFrdl);
    window.addEventListener('load', tryFrdl);
    let fTries=0; const fIv=setInterval(()=>{ if(tryFrdl()||fTries++>30) clearInterval(fIv); }, 500);
    try{ const obs=new MutationObserver(()=>{ if(tryFrdl()) obs.disconnect(); }); obs.observe(document.documentElement,{childList:true,subtree:true}); setTimeout(()=>{ try{obs.disconnect();}catch{} },15000); }catch{}
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
          const qGet="query getContent($identifier: PublicLinkIdentificationInput!, $task_args: TaskArgument) { getContent(input: $identifier, task_args: $task_args) { ... on ContentAccessTaskSet { __typename tasks { __typename id ... on PremiumTask { __typename status id } ... on WaitTask { __typename id remainingWaitingTime status adsTotal } ... on AdTask { __typename id status adIndex adsTotal ads{completion_token} payloadBag{taboola{session_id}} } } } ... on DetailPageTargetData { type url paste __typename } __typename } }";
          const qComp="mutation completeTask($identifier: PublicLinkIdentificationInput!, $task_id: String!, $task_args: TaskArgument) { completeTask(input: $identifier, task_id: $task_id, task_args: $task_args) { id ... on AdTask { __typename id status } ... on WaitTask { __typename id status remainingWaitingTime adsTotal } ... on PremiumTask { __typename status id } } }";
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
              if(gc.__typename==="DetailPageTargetData"){ if(gc.url && /^https?:\/\//.test(gc.url)){ location.replace(gc.url); return true; } if(gc.paste){ document.open(); document.write(gc.paste); document.close(); return true; } }
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
          if(gc2?.__typename==="DetailPageTargetData"){ if(gc2.url){ location.replace(gc2.url); return true; } if(gc2.paste){ document.open(); document.write(gc2.paste); document.close(); return true; } }
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
    if(/linkvertise\.com|link-to\.net/i.test(location.hostname)) return;
    const h=findHandler();
    if(h && typeof h.start==="function") try{ h.start(); }catch{}
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
