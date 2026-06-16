(function(){
  const root = document.documentElement;
  const saved = localStorage.getItem('calcheure-theme');
  if(saved === 'light') root.setAttribute('data-theme','light');

  function qs(s, ctx=document){ return ctx.querySelector(s); }
  function qsa(s, ctx=document){ return Array.from(ctx.querySelectorAll(s)); }
  function showToast(msg){
    const t = qs('#toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2200);
  }
  function fmt2(n){ return String(Math.abs(Math.floor(n))).padStart(2,'0'); }
  function getNumber(el){ return parseFloat(el && el.value ? el.value : '0') || 0; }
  function setLoading(btn, state){
    if(!btn) return;
    btn.classList.toggle('loading', state);
    btn.textContent = state ? 'Calcul en cours…' : (btn.dataset.label || 'Calculer');
  }
  function smoothResult(el){
    if(el) el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  window.toggleTheme = function(){
    const isLight = root.getAttribute('data-theme') === 'light';
    if(isLight){
      root.removeAttribute('data-theme');
      localStorage.setItem('calcheure-theme','dark');
    }else{
      root.setAttribute('data-theme','light');
      localStorage.setItem('calcheure-theme','light');
    }
    const btn = qs('#theme-btn');
    if(btn) btn.textContent = root.getAttribute('data-theme') === 'light' ? '🌙' : '☀️';
  };

  window.toggleMobileNav = function(){
    const nav = qs('#mobile-nav');
    const btn = qs('#hamburger');
    if(!nav || !btn) return;
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  };
  window.closeMobileNav = function(){
    const nav = qs('#mobile-nav');
    const btn = qs('#hamburger');
    if(nav) nav.classList.remove('open');
    if(btn) btn.setAttribute('aria-expanded','false');
  };

  window.toggleFaq = function(btn){
    const item = btn.parentElement;
    const open = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  };

  qsa('.calc-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const box = btn.closest('.calc-box');
      qsa('.calc-tab', box).forEach(t=>{ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      qsa('.calc-panel', box).forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      const panel = qs('#tab-' + btn.dataset.tab, box);
      if(panel) panel.classList.add('active');
    });
  });

  qsa('.op-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      qsa('.op-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  let rowCount = 2;
  window.addRow = function(){
    const rows = qs('#add-rows');
    if(!rows) return;
    rowCount += 1;
    const row = document.createElement('div');
    row.className = 'time-row';
    row.innerHTML = `
      <span class="row-label">Durée ${rowCount}</span>
      <div class="time-inputs">
        <div class="field-wrap"><input type="number" min="0" placeholder="0" class="h-in" aria-label="Heures"><span class="time-unit">h</span></div>
        <span class="sep" aria-hidden="true">:</span>
        <div class="field-wrap"><input type="number" min="0" max="59" placeholder="0" class="m-in" aria-label="Minutes"><span class="time-unit">min</span></div>
        <span class="sep" aria-hidden="true">:</span>
        <div class="field-wrap"><input type="number" min="0" max="59" placeholder="0" class="s-in" aria-label="Secondes"><span class="time-unit">sec</span></div>
      </div>
      <button class="del-btn" onclick="this.parentElement.remove()" aria-label="Supprimer cette durée">✕</button>`;
    rows.appendChild(row);
  };

  function validateMinSec(input){
    const max = input.classList.contains('m-in') || input.classList.contains('s-in') ? 59 : Infinity;
    const v = parseFloat(input.value || '0');
    const invalid = v < 0 || v > max || Number.isNaN(v);
    input.classList.toggle('invalid', invalid);
    return !invalid;
  }

  window.copyResult = function(id){
    const el = qs('#' + id);
    if(!el) return;
    const text = el.textContent.trim();
    if(navigator.clipboard){
      navigator.clipboard.writeText(text).then(()=>showToast('Résultat copié.'));
    }else{
      showToast(text);
    }
  };

  window.calcAddSub = function(event){
    const btn = event?.currentTarget || qs('[onclick*="calcAddSub"]');
    const rows = qsa('#add-rows .time-row');
    const op = qs('.op-btn.active')?.dataset.op || '+';
    const errBox = qs('#add-error');
    let valid = true;
    rows.forEach(row=>{
      qsa('.m-in,.s-in', row).forEach(inp=>{ if(!validateMinSec(inp)) valid = false; });
      qsa('.h-in', row).forEach(inp=>{
        const v = parseFloat(inp.value || '0');
        const bad = v < 0 || Number.isNaN(v);
        inp.classList.toggle('invalid', bad);
        if(bad) valid = false;
      });
    });
    if(!valid){
      if(errBox){ errBox.textContent='Valeur invalide : les minutes et secondes doivent être entre 0 et 59.'; errBox.style.display='block'; }
      return;
    }
    if(errBox) errBox.style.display='none';
    setLoading(btn,true);
    setTimeout(()=>{
      let totalSec = 0;
      rows.forEach((row,i)=>{
        const h = getNumber(qs('.h-in',row));
        const m = getNumber(qs('.m-in',row));
        const s = getNumber(qs('.s-in',row));
        const sec = h*3600 + m*60 + s;
        if(i === 0) totalSec = sec;
        else totalSec = op === '+' ? totalSec + sec : totalSec - sec;
      });
      const neg = totalSec < 0;
      const abs = Math.abs(totalSec);
      const h = Math.floor(abs/3600);
      const m = Math.floor((abs%3600)/60);
      const s = Math.floor(abs%60);
      const main = qs('#add-result-main');
      const sub = qs('#add-result-sub');
      const box = qs('#add-result');
      if(main) main.textContent = (neg ? '−' : '') + `${fmt2(h)}h ${fmt2(m)}min ${fmt2(s)}s`;
      if(sub){
        const sign = neg ? -1 : 1;
        sub.innerHTML = `<span>${(sign*Math.round(abs/60)).toLocaleString('fr-FR')} minutes</span> · <span>${(sign*Math.round(abs)).toLocaleString('fr-FR')} secondes</span>`;
      }
      if(box){ box.classList.add('show'); smoothResult(box); }
      setLoading(btn,false);
    },180);
  };

  window.resetAddSub = function(){
    qsa('#add-rows input').forEach(i=>{ i.value=''; i.classList.remove('invalid'); });
    const box = qs('#add-result');
    const err = qs('#add-error');
    if(box) box.classList.remove('show');
    if(err) err.style.display = 'none';
  };

  window.calcConvert = function(event){
    const btn = event?.currentTarget || qs('[onclick*="calcConvert"]');
    const input = qs('#conv-val');
    const unit = qs('#conv-unit');
    const err = qs('#conv-error');
    const val = parseFloat(input?.value || '');
    if(Number.isNaN(val) || val < 0){
      if(err){ err.textContent='Veuillez entrer une valeur positive.'; err.style.display='block'; }
      return;
    }
    if(err) err.style.display='none';
    setLoading(btn,true);
    setTimeout(()=>{
      let sec = val;
      if(unit?.value === 'min') sec = val*60;
      if(unit?.value === 'h') sec = val*3600;
      if(unit?.value === 'day') sec = val*86400;
      const fmt = (n,d=4)=> n.toLocaleString('fr-FR',{maximumFractionDigits:d});
      const results = [
        {val:fmt(sec,0),unit:'secondes'},
        {val:fmt(sec/60,4),unit:'minutes'},
        {val:fmt(sec/3600,6),unit:'heures'},
        {val:fmt(sec/86400,8),unit:'jours'}
      ];
      const box = qs('#conv-results');
      if(box){
        box.innerHTML = results.map(r=>`<div class="conv-item"><div class="conv-val">${r.val}</div><div class="conv-unit">${r.unit}</div></div>`).join('');
        box.style.display='grid';
        smoothResult(box);
      }
      setLoading(btn,false);
    },160);
  };

  window.resetConvert = function(){
    const val = qs('#conv-val'), res = qs('#conv-results'), err = qs('#conv-error');
    if(val) val.value='';
    if(res) res.style.display='none';
    if(err) err.style.display='none';
  };

  window.calcDiff = function(event){
    const btn = event?.currentTarget || qs('[onclick*="calcDiff"]');
    const start = qs('#diff-start')?.value;
    const end = qs('#diff-end')?.value;
    if(!start || !end){ showToast('Veuillez renseigner les deux heures.'); return; }
    setLoading(btn,true);
    setTimeout(()=>{
      const [sh,sm] = start.split(':').map(Number);
      const [eh,em] = end.split(':').map(Number);
      let diff = (eh*60+em) - (sh*60+sm);
      if(diff < 0) diff += 24*60;
      const h = Math.floor(diff/60), m = diff%60;
      const main = qs('#diff-result-main'), sub = qs('#diff-result-sub'), box = qs('#diff-result');
      if(main) main.textContent = `${fmt2(h)}h ${fmt2(m)}min`;
      if(sub) sub.innerHTML = `<span>${diff.toLocaleString('fr-FR')} minutes</span> · <span>${(diff*60).toLocaleString('fr-FR')} secondes</span>`;
      if(box){ box.classList.add('show'); smoothResult(box); }
      setLoading(btn,false);
    },160);
  };

  window.resetDiff = function(){
    const box = qs('#diff-result');
    if(box) box.classList.remove('show');
  };

  window.calcWorkHours = function(event){
    const btn = event?.currentTarget || qs('[onclick*="calcWorkHours"]');
    const start = qs('#work-start')?.value;
    const end = qs('#work-end')?.value;
    const pause = parseFloat(qs('#work-break')?.value || '0') || 0;
    const rate = parseFloat(qs('#work-rate')?.value || '0') || 0;
    if(!start || !end){ showToast('Indiquez une heure de début et de fin.'); return; }
    setLoading(btn,true);
    setTimeout(()=>{
      const [sh,sm] = start.split(':').map(Number), [eh,em] = end.split(':').map(Number);
      let minutes = (eh*60+em) - (sh*60+sm);
      if(minutes < 0) minutes += 1440;
      minutes = Math.max(0, minutes - pause);
      const h = Math.floor(minutes/60), m = minutes%60;
      const pay = rate > 0 ? (minutes/60*rate).toLocaleString('fr-FR',{style:'currency',currency:'EUR'}) : '—';
      const main = qs('#work-result-main'), sub = qs('#work-result-sub'), box = qs('#work-result');
      if(main) main.textContent = `${fmt2(h)}h ${fmt2(m)}min`;
      if(sub) sub.innerHTML = `<span>${(minutes/60).toLocaleString('fr-FR',{maximumFractionDigits:2})} h décimales</span> · <span>Montant estimé : ${pay}</span>`;
      if(box){ box.classList.add('show'); smoothResult(box); }
      setLoading(btn,false);
    },160);
  };

  window.calcHourlySalary = function(event){
    const btn = event?.currentTarget || qs('[onclick*="calcHourlySalary"]');
    const salary = parseFloat(qs('#salary-month')?.value || '0') || 0;
    const hours = parseFloat(qs('#salary-hours')?.value || '0') || 0;
    if(salary <= 0 || hours <= 0){ showToast('Entrez un salaire et un nombre d’heures valides.'); return; }
    setLoading(btn,true);
    setTimeout(()=>{
      const monthlyHours = hours * 52 / 12;
      const rate = salary / monthlyHours;
      const main = qs('#salary-result-main'), sub = qs('#salary-result-sub'), box = qs('#salary-result');
      if(main) main.textContent = rate.toLocaleString('fr-FR',{style:'currency',currency:'EUR'}) + ' / h';
      if(sub) sub.innerHTML = `<span>${monthlyHours.toLocaleString('fr-FR',{maximumFractionDigits:2})} heures/mois estimées</span>`;
      if(box){ box.classList.add('show'); smoothResult(box); }
      setLoading(btn,false);
    },160);
  };

  window.calcDateDifference = function(event){
    const btn = event?.currentTarget || qs('[onclick*="calcDateDifference"]');
    const a = qs('#date-start')?.value;
    const b = qs('#date-end')?.value;
    if(!a || !b){ showToast('Choisissez deux dates.'); return; }
    setLoading(btn,true);
    setTimeout(()=>{
      const d1 = new Date(a + 'T00:00:00'), d2 = new Date(b + 'T00:00:00');
      const diffDays = Math.round(Math.abs(d2-d1)/86400000);
      const main = qs('#date-result-main'), sub = qs('#date-result-sub'), box = qs('#date-result');
      if(main) main.textContent = diffDays.toLocaleString('fr-FR') + ' jours';
      if(sub) sub.innerHTML = `<span>${(diffDays*24).toLocaleString('fr-FR')} heures</span> · <span>${(diffDays*1440).toLocaleString('fr-FR')} minutes</span>`;
      if(box){ box.classList.add('show'); smoothResult(box); }
      setLoading(btn,false);
    },160);
  };

  let timerInterval = null;
  window.startTimer = function(){
    const min = parseInt(qs('#timer-min')?.value || '0',10) || 0;
    const sec = parseInt(qs('#timer-sec')?.value || '0',10) || 0;
    let total = min*60 + sec;
    const display = qs('#timer-display');
    if(total <= 0 || !display){ showToast('Entrez une durée supérieure à zéro.'); return; }
    clearInterval(timerInterval);
    function render(){
      const m = Math.floor(total/60), s = total%60;
      display.textContent = `${fmt2(m)}:${fmt2(s)}`;
    }
    render();
    timerInterval = setInterval(()=>{
      total -= 1;
      render();
      if(total <= 0){
        clearInterval(timerInterval);
        showToast('Minuteur terminé.');
      }
    },1000);
  };
  window.stopTimer = function(){ clearInterval(timerInterval); };

  window.calcTimesheet = function(event){
    const btn = event?.currentTarget || qs('[onclick*="calcTimesheet"]');
    const rows = qsa('.timesheet-row');
    let total = 0;
    rows.forEach(row=>{
      const h = parseFloat(qs('.ts-h', row)?.value || '0') || 0;
      const m = parseFloat(qs('.ts-m', row)?.value || '0') || 0;
      total += h*60 + m;
    });
    setLoading(btn,true);
    setTimeout(()=>{
      const h = Math.floor(total/60), m = total%60;
      const main = qs('#timesheet-result-main'), sub = qs('#timesheet-result-sub'), box = qs('#timesheet-result');
      if(main) main.textContent = `${fmt2(h)}h ${fmt2(m)}min`;
      if(sub) sub.innerHTML = `<span>${(total/60).toLocaleString('fr-FR',{maximumFractionDigits:2})} h décimales</span>`;
      if(box){ box.classList.add('show'); smoothResult(box); }
      setLoading(btn,false);
    },160);
  };

  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') window.closeMobileNav();
    if(e.key === 'Enter' && e.target.matches('input,select')){
      const active = qs('.calc-panel.active');
      if(active?.id === 'tab-add') window.calcAddSub();
      if(active?.id === 'tab-convert') window.calcConvert();
      if(active?.id === 'tab-diff') window.calcDiff();
    }
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = qs('#theme-btn');
    if(btn) btn.textContent = root.getAttribute('data-theme') === 'light' ? '🌙' : '☀️';
    qsa('[data-label]').forEach(b=>{ if(!b.textContent.trim()) b.textContent=b.dataset.label; });
  });
})();
