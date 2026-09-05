let finalUrl=null;
const $=id=>document.getElementById(id);
const words=["ouo.io","adf.ly","linkvertise.com","shortest","bit.ly","tinyurl","cutt.ly"];
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
    const txt=await r.text();
    let j; try{ j=JSON.parse(txt); }catch{ throw new Error(txt.includes("<!DOCTYPE")||txt.includes("<html") ? "Server diblokir challenge (Cf) — pakai userscript buka link langsung" : (txt.slice(0,120)||"Response bukan JSON")); }
    const sec=((Date.now()-t0)/1000).toFixed(1)+"s";
    if(j.success){
      finalUrl=j.resolved||j.url; setProgress(100,true);
      setStatus("Bypass berhasil ("+sec+")","ok");
      $("svc").textContent=svc;
      $("finalUrl").textContent=finalUrl; $("elapsed").textContent=sec+" • organic • "+(j.steps||1)+" steps";
      const a=$("openLink"); a.href=finalUrl; a.textContent="Buka tujuan ↗";
      $("result").classList.add("show");
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