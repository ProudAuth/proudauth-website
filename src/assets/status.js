(() => {
  const overall=document.querySelector('#overall'),components=document.querySelector('#components'),checked=document.querySelector('#checked');
  let active=false;
  async function refresh() {
    if(active)return;active=true;
    try {
      const response=await fetch('/health.json',{cache:'no-store',signal:AbortSignal.timeout(6000)});
      if(!response.ok)throw new Error('status');
      const state=await response.json();
      overall.textContent=state.status==='operational'?'All checked components are operational.':state.status==='checking'?'Checking current readiness…':'Some components are currently unavailable.';
      components.replaceChildren(...state.components.map(component=>{
        const row=document.createElement('div');row.style.cssText='display:flex;justify-content:space-between;gap:18px;padding:20px 0;border-bottom:1px solid var(--border);font-size:13px';
        const name=document.createElement('strong');name.textContent=component.name;
        const result=document.createElement('span');result.style.color=component.status==='operational'?'var(--accent)':'var(--muted)';result.textContent=(component.status==='operational'?'● Operational':'○ '+component.status)+(component.latencyMs!==null?' · '+component.latencyMs+' ms':'');
        row.append(name,result);return row;
      }));
      checked.textContent=state.checkedAt?'Last checked '+new Date(state.checkedAt).toLocaleString()+'. Refreshes every 30 seconds.':'Waiting for the first check.';
    } catch {overall.textContent='Status could not be retrieved.';checked.textContent='Check your connection and try refreshing.';}
    finally{active=false;}
  }
  document.querySelector('#refresh').addEventListener('click',refresh);
  refresh();setInterval(refresh,30000);
})();
