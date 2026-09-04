let finalUrl=null;
const $=id=>document.getElementById(id);
const words=["ouo.io","adf.ly","safelink","linkvertise","shortest","bit.ly","tinyurl","cutt.ly"];
let wi=0;
setInterval(()=>{ const e=$("changingText"); if(e) e.textContent=words[wi++%words.length]; }, 2500);
function setStatus(msg, kind=""){
  const s=$("status"); s.textContent=msg||""; s.className="status "+kind; s.classList.toggle("show", !!msg);
}
function setProgress(pct, show=true){
  const p=$("progress"); const f=$("fill");
  if(!show){ p.classList.remove("show"); return; }
  p.classList.add("show"); f.style.width=pct+"%";
}
function normalize(v){
  let s=(v||"").trim(); if(!s) return s;
  if(!/^[a-zA-Z]+:\/\//.test(s)) s="https://"+s;
  return s;
}
async function resolve(){
  let url=normalize($("urlInput").value);
  if(!url){ $("urlInput").focus(); return; }
  $("urlInput").value=url;
  const btn=$("goBtn"); btn.disabled=true; btn.textContent="Bypassing…";
  $("result").classList.remove("show"); setProgress(12,true); setStatus("Mendeteksi service…","loading");
  let svc="Generic";
  try{
    const r=await fetch("/api/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
    const d=await r.json();
    if(!d.valid) throw new Error(d.error||"URL tidak valid");
    svc=d.service||"Generic";
    const det=$("detected"); if(det){ det.style.display=""; $("detectedName").textContent=svc; }
  }catch(e){ setStatus(e.message||"check gagal","err"); setProgress(0,false); btn.disabled=false; btn.textContent="Bypass"; return; }
  const t0=Date.now();
  setProgress(35,true);
  try{
    const r=await fetch("/api/organic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
    const j=await r.json();
    const sec=((Date.now()-t0)/1000).toFixed(1)+"s";
    if(j.success){
      finalUrl=j.resolved||j.url;
      // sfl.gl intermediate → auto headless to article
      if(j.service==="sfl.gl"){
        setStatus("SFL 1-hop: "+finalUrl.slice(0,70)+"… — lanjut headless…","loading"); setProgress(60,true);
        $("finalUrl").textContent=finalUrl; $("svc").textContent="sfl.gl → headless…"; $("elapsed").textContent=sec; $("openLink").href=finalUrl; $("result").classList.add("show");
        try{
          const h=await fetch("https://skipreceh-browser.irfanraihanal.workers.dev/api/headless?url="+encodeURIComponent(url), {signal: AbortSignal.timeout(35000)});
          const hj=await h.json();
          if(hj.ok && hj.url){ finalUrl=hj.url; setProgress(100,true); setStatus("Headless berhasil","ok"); $("finalUrl").textContent=finalUrl; $("svc").textContent="sfl.gl (headless)"; $("elapsed").textContent=((Date.now()-t0)/1000).toFixed(1)+"s • browser"; $("openLink").href=finalUrl; $("openLink").textContent="Buka tujuan ↗"; }
          else { setStatus(hj.error||"Headless: artikel tanpa file","err"); $("finalUrl").textContent=(hj.chain||[]).join(" → ")||hj.error||""; $("svc").textContent=hj.code||"no file"; $("elapsed").textContent="headless"; $("openLink").href="/skipreceh.user.js"; $("openLink").textContent="Install userscript →"; setProgress(0,false); }
        }catch(eh){ setStatus("Headless error: "+(eh.message||eh),"err"); setProgress(0,false); }
      } else {
        setProgress(100,true); setStatus("Bypass berhasil ("+sec+")","ok"); $("finalUrl").textContent=finalUrl; $("svc").textContent=svc; $("elapsed").textContent=sec+" • organic • "+(j.steps||1)+" steps"; $("openLink").href=finalUrl; $("openLink").textContent="Buka tujuan ↗"; $("result").classList.add("show");
      }
    } else {
      if(j.code==="NEEDS_BROWSER"){
        setStatus(j.error,"err");
        // show hint + CTA in place of result
        finalUrl=null;
        $("finalUrl").textContent=j.hint||"";
        $("svc").textContent="butuh browser";
        $("elapsed").textContent="install userscript";
        const a=$("openLink"); a.textContent="Install userscript →"; a.href="/skipreceh.user.js";
        $("result").classList.add("show");
      } else {
        setStatus(j.error||"Tidak ketemu pola — kemungkinan butuh userscript (klik/timer).","err");
      }
      setProgress(0,false);
    }
  }catch(e){ setStatus("Koneksi error: "+(e.message||e),"err"); setProgress(0,false); }
  finally{ btn.disabled=false; btn.textContent="Bypass"; }
}
function copyResult(){
  if(!finalUrl) return;
  navigator.clipboard.writeText(finalUrl).then(()=>{ const b=$("goBtn"); const t=b.textContent; b.textContent="Copied!"; setTimeout(()=> b.textContent="Bypass", 1200); });
  // also try select fallback
}
function resetResult(){
  finalUrl=null; $("result").classList.remove("show"); setStatus("",""); setProgress(0,false); $("urlInput").focus(); $("urlInput").select();
}
$("urlInput")?.addEventListener("keydown",e=>{ if(e.key==="Enter") resolve(); });
