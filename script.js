
// DOM refs & state
const tabUs = document.getElementById('tab-us');
const tabMetric = document.getElementById('tab-metric');
const tabOther = document.getElementById('tab-other');
const panelUs = document.getElementById('panel-us');
const panelMetric = document.getElementById('panel-metric');
const panelOther = document.getElementById('panel-other');

tabUs.addEventListener('click', ()=>switchUnit('us'));
tabMetric.addEventListener('click', ()=>switchUnit('metric'));
tabOther.addEventListener('click', ()=>switchUnit('other'));
let unit = 'us';
function switchUnit(u){
  unit = u;
  tabUs.classList.toggle('active', u==='us');
  tabMetric.classList.toggle('active', u==='metric');
  tabOther.classList.toggle('active', u==='other');
  panelUs.style.display = u==='us' ? '' : 'none';
  panelMetric.style.display = u==='metric' ? '' : 'none';
  panelOther.style.display = u==='other' ? '' : 'none';
}

const genderMale = document.getElementById('gender-male');
const genderFemale = document.getElementById('gender-female');
let gender = 'male';
genderMale.addEventListener('click', ()=>setGender('male'));
genderFemale.addEventListener('click', ()=>setGender('female'));
function setGender(g){ gender = g; genderMale.classList.toggle('active', g==='male'); genderFemale.classList.toggle('active', g==='female'); }

//inputs
const ageEl = document.getElementById('age');
const ftEl = document.getElementById('ft');
const inEl = document.getElementById('inch');
const lbsEl = document.getElementById('lbs');
const cmEl = document.getElementById('cm');
const kgEl = document.getElementById('kg');
const mEl = document.getElementById('m');
const kg2El = document.getElementById('kg2');

const calcBtn = document.getElementById('calcBtn');
const clearBtn = document.getElementById('clearBtn');

const bmiValueEl = document.getElementById('bmiValue');
const bmiCatEl = document.getElementById('bmiCat');
const healthyRangeEl = document.getElementById('healthyRange');
const to25El = document.getElementById('to25');
const primeEl = document.getElementById('prime');
const ponderalEl = document.getElementById('ponderal');

const canvas = document.getElementById('gauge');

  // Gauge - zones & chart
const minBMI = 10;
const maxBMI = 40;
const totalRange = maxBMI - minBMI;

// zones 
const zones = [
  { label:'Under 16', from: minBMI, to:16, color: '#8b0000' },     // deep red
  { label:'16-18.5', from:16, to:18.5, color: '#ef4444' },         // lighter red
  { label:'18.5-25', from:18.5, to:25, color: getComputedStyle(document.documentElement).getPropertyValue('--normal') || '#2ecc71' },
  { label:'25-30', from:25, to:30, color: getComputedStyle(document.documentElement).getPropertyValue('--over') || '#f59e0b' },
  { label:'30-35', from:30, to:35, color: '#fca5a5' },
  { label:'35-40', from:35, to:40, color: getComputedStyle(document.documentElement).getPropertyValue('--obese') || '#b91c1c' },
];

const zoneSizes = zones.map(z => z.to - z.from);

// chart
let chart = null;
let animRAF = null;
let currentSegments = zones.map(()=>0);

// create skeleton
function createChart(){
  const ctx = canvas.getContext('2d');

  const baseDataset = {
    label: 'base',
    data: zoneSizes.slice(),
    backgroundColor: zones.map(z => hexToRgba(z.color, 0.16)),
    borderWidth: 0
  };

  const fillDataset = {
    label: 'fill',
    data: zones.map(_=>0),
    backgroundColor: zones.map(z => z.color),
    borderWidth: 0
  };

  if(chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: zones.map(z=>z.label),
      datasets: [baseDataset, fillDataset]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      rotation: 270,
      circumference: 180,
      cutout: '62%',
      plugins: { legend:{display:false}, tooltip:{enabled:false} },
      animation: { duration: 0 }
    }
  });

  canvas.classList.remove('visible');
}
createChart();

function hexToRgba(hex,a=1){
  hex = (hex||'#000').replace('#','').trim();
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  const r = parseInt(hex.slice(0,2),16);
  const g = parseInt(hex.slice(2,4),16);
  const b = parseInt(hex.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

// compute amount per zone
function computeFillSegments(bmi){
  let remain = clamp(bmi - minBMI, 0, totalRange);
  return zones.map(z=>{
    const length = Math.max(0, Math.min(remain, z.to - z.from));
    remain -= length;
    return length;
  });
}

// animate fill
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
function animateTo(targetSegments, duration=900){
  if(animRAF) cancelAnimationFrame(animRAF);
  const start = performance.now();
  const from = currentSegments.slice();
  function step(now){
    const t = Math.min(1, (now - start)/duration);
    const e = easeOutCubic(t);
    const cur = from.map((v,i)=> v + (targetSegments[i] - v) * e);
    currentSegments = cur;
    chart.data.datasets[1].data = cur;
    chart.update('none');
    if(t < 1) animRAF = requestAnimationFrame(step);
    else { animRAF = null; currentSegments = targetSegments.slice(); }
  }
  animRAF = requestAnimationFrame(step);
}

// clamp
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }


   //Calculation logic
function toMetric(){
  let weightKg, heightM;
  if(unit === 'metric'){
    weightKg = parseFloat(kgEl.value) || NaN;
    heightM = (parseFloat(cmEl.value) || NaN) / 100;
  } else if(unit === 'us'){
    const ft = parseFloat(ftEl.value) || 0;
    const inch = parseFloat(inEl.value) || 0;
    const totalIn = ft * 12 + inch;
    heightM = totalIn * 0.0254;
    weightKg = (parseFloat(lbsEl.value) || NaN) * 0.45359237;
  } else {
    weightKg = parseFloat(kg2El.value) || NaN;
    heightM = parseFloat(mEl.value) || NaN;
  }
  return { weightKg, heightM };
}

function formatNum(n,d=1){ if(typeof n !== 'number' || !isFinite(n)) return '—'; return (Math.round(n * Math.pow(10,d)) / Math.pow(10,d)).toFixed(d); }

function bmiCategoryAndColor(bmi){
  if(bmi < 16) return {label:'Severely Underweight', color: zones[0].color};
  if(bmi < 18.5) return {label:'Underweight', color: zones[1].color};
  if(bmi < 25) return {label:'Normal', color: zones[2].color};
  if(bmi < 30) return {label:'Overweight', color: zones[3].color};
  if(bmi < 35) return {label:'Obesity I', color: zones[4].color};
  return {label:'Obesity II', color: zones[5].color};
}

function calculate(){
  const age = parseInt(ageEl.value,10);
  if(!age || age < 2 || age > 120){ alert('Please enter a valid age between 2 and 120.'); return; }

  const { weightKg, heightM } = toMetric();
  if(!weightKg || !heightM || weightKg <=0 || heightM <=0){ alert('Please enter valid height and weight.'); return; }

  const bmi = weightKg / (heightM * heightM);
  const bmiRounded = parseFloat(bmi.toFixed(1));

  const cat = bmiCategoryAndColor(bmi);

  // update UI
  bmiValueEl.textContent = `${formatNum(bmiRounded,1)} kg/m²`;
  bmiValueEl.style.color = cat.color;
  bmiCatEl.textContent = `${cat.label} • Age ${age} • ${gender.charAt(0).toUpperCase() + gender.slice(1)}`;
  bmiCatEl.style.color = cat.color;

  // healthy weight Range
  const wmin = 18.5 * heightM * heightM;
  const wmax = 25 * heightM * heightM;
  if(unit === 'us'){
    healthyRangeEl.textContent = `${formatNum(wmin*2.2046226218,1)} lbs - ${formatNum(wmax*2.2046226218,1)} lbs`;
  } else {
    healthyRangeEl.textContent = `${formatNum(wmin,1)} kg - ${formatNum(wmax,1)} kg`;
  }

  const weightAt25 = 25 * heightM * heightM;
  const change = weightKg - weightAt25;
  const changeRounded = parseFloat(change.toFixed(1));
  if(Math.abs(changeRounded) < 0.1){
    to25El.innerHTML = `<span style="color:${cat.color}">You are at BMI 25 (ideal).</span>`;
  } else if(changeRounded > 0){
    const text = unit==='us' ? `${formatNum(changeRounded*2.2046226218,1)} lbs` : `${formatNum(changeRounded,1)} kg`;
    to25El.innerHTML = `<span style="color:${cat.color}">Lose ${text} to reach BMI 25</span>`;
  } else {
    const text = unit==='us' ? `${formatNum(Math.abs(changeRounded*2.2046226218),1)} lbs` : `${formatNum(Math.abs(changeRounded),1)} kg`;
    to25El.innerHTML = `<span style="color:${cat.color}">Gain ${text} to reach BMI 25</span>`;
  }

  primeEl.textContent = formatNum(bmi / 25, 2);
  ponderalEl.textContent = `${formatNum(weightKg / Math.pow(heightM,3),2)} kg/m³`;

  // animate gauge
  const targetSegments = computeFillSegments(bmi);
  chart.data.datasets[1].backgroundColor = zones.map(z => z.color);
  canvas.classList.add('visible');
  animateTo(targetSegments, 1000);
}


  // events & init
   
calcBtn.addEventListener('click', calculate);
clearBtn.addEventListener('click', ()=>{
  ageEl.value=''; ftEl.value=''; inEl.value=''; lbsEl.value=''; cmEl.value=''; kgEl.value=''; mEl.value=''; kg2El.value='';
  bmiValueEl.textContent='--'; bmiValueEl.style.color=''; bmiCatEl.textContent='—'; healthyRangeEl.textContent='—';
  to25El.textContent='—'; primeEl.textContent='—'; ponderalEl.textContent='—';
  canvas.classList.remove('visible');
  currentSegments = zones.map(()=>0);
  chart.data.datasets[1].data = currentSegments.slice();
  chart.update('none');
});

// Enter key
document.querySelectorAll('input').forEach(i=>{
  i.addEventListener('keydown', e => { if(e.key === 'Enter') calculate(); });
});

// redraw after resize
let resizeTimer = null;
window.addEventListener('resize', ()=>{
  if(resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(()=>{ chart.update('none'); }, 120);
});