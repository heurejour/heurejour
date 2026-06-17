(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const num = (value) => {
    const parsed = parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const parseClock = (value) => {
    if(!value) return 0;
    const [h='0', m='0'] = String(value).split(':');
    return (parseInt(h,10)||0)*60 + (parseInt(m,10)||0);
  };
  const fmt = (minutes) => {
    const sign = minutes < 0 ? '-' : '';
    minutes = Math.abs(Math.round(minutes));
    const h = Math.floor(minutes/60);
    const m = minutes % 60;
    return `${sign}${h} h ${String(m).padStart(2,'0')}`;
  };
  const money = (value) => new Intl.NumberFormat('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2}).format(value);
  function setResult(form, main, sub=''){
    const out = $('[data-result]', form);
    if(!out) return;
    $('.result-value', out).textContent = main;
    $('.result-sub', out).textContent = sub;
  }
  function workHours(form){
    let start = parseClock($('[name="start"]',form)?.value);
    let end = parseClock($('[name="end"]',form)?.value);
    const breakMin = num($('[name="break"]',form)?.value);
    if(end < start) end += 1440;
    const total = Math.max(0, end - start - breakMin);
    setResult(form, fmt(total), `${(total/60).toFixed(2).replace('.', ',')} heures décimales`);
  }
  function minutesToHours(form){
    const minutes = num($('[name="minutes"]',form)?.value);
    setResult(form, fmt(minutes), `${(minutes/60).toFixed(2).replace('.', ',')} heures décimales`);
  }
  function overtime(form){
    const total = num($('[name="total"]',form)?.value);
    const base = num($('[name="base"]',form)?.value) || 35;
    const rate = num($('[name="rate"]',form)?.value);
    const mult = num($('[name="multiplier"]',form)?.value) || 1.25;
    const extra = Math.max(0, total - base);
    const pay = extra * rate * mult;
    setResult(form, `${extra.toFixed(2).replace('.', ',')} h`, rate ? `Estimation majorée : ${money(pay)} €` : 'Ajoutez un taux horaire pour estimer le montant.');
  }
  function addTime(form){
    const h1 = num($('[name="h1"]',form)?.value), m1 = num($('[name="m1"]',form)?.value);
    const h2 = num($('[name="h2"]',form)?.value), m2 = num($('[name="m2"]',form)?.value);
    const total = h1*60 + m1 + h2*60 + m2;
    setResult(form, fmt(total), `${total} minutes au total`);
  }
  function subtractTime(form){
    const h1 = num($('[name="h1"]',form)?.value), m1 = num($('[name="m1"]',form)?.value);
    const h2 = num($('[name="h2"]',form)?.value), m2 = num($('[name="m2"]',form)?.value);
    const total = (h1*60 + m1) - (h2*60 + m2);
    setResult(form, fmt(total), `${total} minutes de différence`);
  }
  function hoursMinutes(form){
    const hours = num($('[name="hours"]',form)?.value);
    const minutes = num($('[name="minutes"]',form)?.value);
    const total = hours*60 + minutes;
    setResult(form, `${total} min`, `${(total/60).toFixed(2).replace('.', ',')} heures décimales · ${fmt(total)}`);
  }
  const handlers = {workHours, minutesToHours, overtime, addTime, subtractTime, hoursMinutes};
  $$('form[data-tool]').forEach(form => {
    const fn = handlers[form.dataset.tool];
    if(!fn) return;
    form.addEventListener('submit', e => { e.preventDefault(); fn(form); });
    $$('input,select', form).forEach(el => el.addEventListener('input', () => fn(form)));
    fn(form);
  });
})();