(() => {
  const doc = document.documentElement;
  const preferred = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  try { doc.dataset.theme = localStorage.getItem('pa-docs-theme') || preferred(); } catch { doc.dataset.theme = preferred(); }
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    doc.dataset.theme = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('pa-docs-theme',doc.dataset.theme); } catch {}
  });
  const menu = document.querySelector('.menu-toggle');
  const closeMenu = () => { document.body.classList.remove('nav-open'); menu?.setAttribute('aria-expanded','false'); };
  menu?.addEventListener('click', () => { const open = document.body.classList.toggle('nav-open'); menu.setAttribute('aria-expanded',String(open)); });
  document.querySelectorAll('.sidebar a').forEach(link=>link.addEventListener('click',closeMenu));
  const notice = document.querySelector('#notice');
  let noticeTimer;
  const tell = message => { notice.textContent=message; clearTimeout(noticeTimer); noticeTimer=setTimeout(()=>notice.textContent='',2500); };
  document.querySelectorAll('.copy-code').forEach(button=>button.addEventListener('click',async()=>{
    const text = button.closest('.code-block').querySelector('code').textContent;
    try { await navigator.clipboard.writeText(text); button.textContent='Copied'; tell('Code copied'); setTimeout(()=>button.textContent='Copy',1800); }
    catch { tell('Select the code and copy it with your browser.'); }
  }));
  const dialog = document.querySelector('#search-dialog');
  const input = document.querySelector('#search-input');
  const results = document.querySelector('#search-results');
  let index, indexPromise, selected = -1, request = 0;
  const load = () => indexPromise ||= fetch(`${doc.dataset.docsBase}/search-index.json`).then(r=>{if(!r.ok)throw new Error('search');return r.json();}).then(value=>index=value).catch(error=>{indexPromise=null;throw error;});
  const openSearch = () => { if(!dialog.open)dialog.showModal(); input.focus(); load().catch(()=>results.textContent='Search could not load. Use the navigation to browse the guides.'); };
  const closeSearch = () => dialog.close();
  document.querySelector('.search-open')?.addEventListener('click',openSearch);
  document.querySelector('.search-close')?.addEventListener('click',closeSearch);
  dialog?.addEventListener('click',event=>{if(event.target===dialog)closeSearch();});
  const escape = value => value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  input?.addEventListener('input',async()=>{
    const mine = ++request;
    const query = input.value.trim().toLowerCase();
    selected=-1;
    if(query.length<2){results.innerHTML='<p>Type at least two characters to search.</p>';return;}
    try { await load(); } catch { results.textContent='Search could not load. Please try again.'; return; }
    if(mine!==request)return;
    const terms=query.split(/\s+/);
    // Body hits (tables and lists included) rank pages by how often a term occurs,
    // capped at 5 so a title hit (10) still ranks first.
    const bodyHits=(body,t)=>{let n=0;for(let i=body.indexOf(t);i!==-1&&n<5;i=body.indexOf(t,i+t.length))n++;return n;};
    const matches=index.map(page=>{
      const title=page.title.toLowerCase(), body=page.text.toLowerCase(), group=page.group.toLowerCase();
      if(!terms.every(t=>title.includes(t)||body.includes(t)||group.includes(t)))return null;
      return {page,score:terms.reduce((score,t)=>score+(title.includes(t)?10:0)+(group.includes(t)?3:0)+bodyHits(body,t),0)+(title===query?30:0)};
    }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,20);
    if(!matches.length){results.innerHTML='<p>No results. Try a protocol, field name or endpoint.</p>';return;}
    results.innerHTML=matches.map(({page})=>{
      const position=page.text.toLowerCase().indexOf(terms.find(t=>page.text.toLowerCase().includes(t))||query);
      const snippet=page.text.slice(Math.max(0,position-45),Math.max(0,position-45)+170);
      return `<div role="listitem"><a class="search-result" href="${escape(page.url)}"><small>${escape(page.group)}</small><strong>${escape(page.title)}</strong><p>${escape(snippet)}…</p></a></div>`;
    }).join('');
  });
  document.addEventListener('keydown',event=>{
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();return;}
    if(event.key==='Escape')closeMenu();
    if(!dialog?.open)return;
    const links=[...results.querySelectorAll('a')];
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();if(!links.length)return;
      selected=(selected+(event.key==='ArrowDown'?1:-1)+links.length)%links.length;
      links.forEach((link,i)=>link.classList.toggle('selected',i===selected));links[selected].scrollIntoView({block:'nearest'});
    }
    if(event.key==='Enter'&&links.length){event.preventDefault();links[Math.max(0,selected)].click();}
  });
  const expandHash = () => {
    const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if(target?.tagName==='DETAILS')target.open=true;
    const ancestor=target?.closest('details');if(ancestor)ancestor.open=true;
  };
  expandHash();window.addEventListener('hashchange',expandHash);
})();
