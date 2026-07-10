const hellData = {
  90:{ contribution:310000 },
  95:{ contribution:910000 },
  100:{ contribution:2680000 },
  150:{ contribution:4100000 },
  200:{ contribution:20000000 },
  250:{ contribution:75000000 }
};

const levels = [90, 95, 100, 150, 200, 250];
let applyingCloudData = false;
let cloudRegistered = false;

function formatTime(sec){
  let rounded = Math.round(sec);
  let m = Math.floor(rounded / 60);
  let s = rounded % 60;

  if(s === 60){
    m += 1;
    s = 0;
  }

  return `${m}分${String(s).padStart(2, '0')}秒`;
}

function getEfficiencyData(){
  const data = {};

  levels.forEach(level => {
    data[`hell${level}m`] = document.getElementById(`hell${level}m`).value;
    data[`hell${level}s`] = document.getElementById(`hell${level}s`).value;
  });

  return data;
}

function saveEfficiencyData(){
  const data = getEfficiencyData();

  levels.forEach(level => {
    const minuteKey = `hell${level}m`;
    const secondKey = `hell${level}s`;

    if(data[minuteKey] === ''){
      localStorage.removeItem(minuteKey);
    }else{
      localStorage.setItem(minuteKey, data[minuteKey]);
    }

    if(data[secondKey] === ''){
      localStorage.removeItem(secondKey);
    }else{
      localStorage.setItem(secondKey, data[secondKey]);
    }
  });

  if(!applyingCloudData){
    window.GBFCloud?.queueSave('efficiency', data);
  }
}

function loadLocalData(){
  levels.forEach(level => {
    document.getElementById(`hell${level}m`).value = localStorage.getItem(`hell${level}m`) || '';
    document.getElementById(`hell${level}s`).value = localStorage.getItem(`hell${level}s`) || '';
  });
}

function applyEfficiencyData(data){
  applyingCloudData = true;

  levels.forEach(level => {
    document.getElementById(`hell${level}m`).value = data[`hell${level}m`] ?? '';
    document.getElementById(`hell${level}s`).value = data[`hell${level}s`] ?? '';
  });

  calcEfficiency();
  applyingCloudData = false;
}

function registerCloudSync(){
  if(cloudRegistered || !window.GBFCloud) return;

  cloudRegistered = true;
  window.GBFCloud.registerTool('efficiency', {
    getLocalData: getEfficiencyData,
    applyData: applyEfficiencyData
  });
}

function calcEfficiency(){
  let html = '';
  let bestHell = null;
  let bestSpeed = 0;
  const hourlyMap = {};

  levels.forEach(level => {
    const minute = document.getElementById(`hell${level}m`).value;
    const second = document.getElementById(`hell${level}s`).value;

    if(minute === '' && second === '') return;

    const sec = Number(minute || 0) * 60 + Number(second || 0);
    if(sec <= 0) return;

    hourlyMap[level] = hellData[level].contribution / sec * 3600;
  });

  levels.forEach((level, index) => {
    if(!hourlyMap[level]) return;

    const hourly = hourlyMap[level];
    const oku = (hourly / 100000000).toFixed(2);
    let statusText = '◎ 基準HELL';
    let statusColor = '#4ade80';

    if(index > 0){
      const prevLevel = levels[index - 1];
      const prevHourly = hourlyMap[prevLevel];

      if(prevHourly){
        const targetSec = hellData[level].contribution / prevHourly * 3600;

        if(hourly >= prevHourly){
          statusText = `◎ ${prevLevel}HELL以上の効率 (${formatTime(targetSec)}以内目安)`;
        }else{
          statusText = `▲ ${prevLevel}HELL以下の効率 (${formatTime(targetSec)}以内推奨)`;
          statusColor = '#ef4444';
        }
      }
    }

    if(hourly > bestSpeed){
      bestSpeed = hourly;
      bestHell = level;
    }

    html += `
      <div class="result_item">
        <div><strong>${level}HELL</strong></div>
        <div>時速 ${oku}億/h</div>
        <div style="color:${statusColor};font-weight:bold;">${statusText}</div>
      </div>
    `;
  });

  if(bestHell){
    html += `
      <div style="margin-top:30px;padding:20px;border-radius:12px;background:#0f172a;">
        👑おすすめ周回<br><br>
        ${bestHell}HELL<br>
        時速 ${(bestSpeed / 100000000).toFixed(2)}億/h
      </div>
    `;
  }

  document.getElementById('result').innerHTML = html;
  saveEfficiencyData();
}

function resetEfficiency(){
  if(!confirm('入力内容をリセットしますか？')) return;

  levels.forEach(level => {
    localStorage.removeItem(`hell${level}m`);
    localStorage.removeItem(`hell${level}s`);
    document.getElementById(`hell${level}m`).value = '';
    document.getElementById(`hell${level}s`).value = '';
  });

  document.getElementById('result').innerHTML = '';
  window.GBFCloud?.saveNow('efficiency', getEfficiencyData());
}

document.addEventListener('gbf-cloud-api-ready', registerCloudSync);

loadLocalData();

const hasData = levels.some(level =>
  document.getElementById(`hell${level}m`).value !== '' ||
  document.getElementById(`hell${level}s`).value !== ''
);

if(hasData){
  calcEfficiency();
}

registerCloudSync();
