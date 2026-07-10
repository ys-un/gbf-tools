const chunkInput = document.getElementById('chunk');
const clumpInput = document.getElementById('clump');
const time95Input = document.getElementById('time95');
const time150Input = document.getElementById('time150');
const time200Input = document.getElementById('time200');
const time250Input = document.getElementById('time250');

let applyingCloudData = false;
let cloudRegistered = false;

function getMeatData(){
  return {
    chunk: chunkInput.value,
    clump: clumpInput.value,
    time95: time95Input.value,
    time150: time150Input.value,
    time200: time200Input.value,
    time250: time250Input.value
  };
}

function saveData(){
  const data = getMeatData();

  localStorage.setItem('gbf_chunk', data.chunk);
  localStorage.setItem('gbf_clump', data.clump);
  localStorage.setItem('gbf_time95', data.time95);
  localStorage.setItem('gbf_time150', data.time150);
  localStorage.setItem('gbf_time200', data.time200);
  localStorage.setItem('gbf_time250', data.time250);

  if(!applyingCloudData){
    window.GBFCloud?.queueSave('meat', data);
  }
}

function loadData(){
  chunkInput.value = localStorage.getItem('gbf_chunk') || 10000;
  clumpInput.value = localStorage.getItem('gbf_clump') || 0;
  time95Input.value = localStorage.getItem('gbf_time95') || 10;
  time150Input.value = localStorage.getItem('gbf_time150') || 20;
  time200Input.value = localStorage.getItem('gbf_time200') || 120;
  time250Input.value = localStorage.getItem('gbf_time250') || 450;
}

function applyMeatData(data){
  applyingCloudData = true;

  chunkInput.value = data.chunk ?? 10000;
  clumpInput.value = data.clump ?? 0;
  time95Input.value = data.time95 ?? 10;
  time150Input.value = data.time150 ?? 20;
  time200Input.value = data.time200 ?? 120;
  time250Input.value = data.time250 ?? 450;

  calc();
  applyingCloudData = false;
}

function registerCloudSync(){
  if(cloudRegistered || !window.GBFCloud) return;

  cloudRegistered = true;
  window.GBFCloud.registerTool('meat', {
    getLocalData: getMeatData,
    applyData: applyMeatData
  });
}

function calc(){
  const chunk = Number(chunkInput.value) || 0;
  const clump = Number(clumpInput.value) || 0;
  const time95 = Number(time95Input.value) || 1;
  const time150 = Number(time150Input.value) || 1;
  const time200 = Number(time200Input.value) || 1;
  const time250 = Number(time250Input.value) || 1;

  const count95 = Math.floor(chunk / 10);
  const count150 = Math.floor(chunk / 20);
  const count200 = Math.floor(chunk / 20);
  const count250 = Math.floor(clump / 20);

  document.getElementById('count95').textContent = `${formatNumber(count95)}回`;
  document.getElementById('count150').textContent = `${formatNumber(count150)}回`;
  document.getElementById('count200').textContent = `${formatNumber(count200)}回`;
  document.getElementById('count250').textContent = `${formatNumber(count250)}回`;

  document.getElementById('hour95').textContent = formatHour(count95 * time95);
  document.getElementById('hour150').textContent = formatHour(count150 * time150);
  document.getElementById('hour200').textContent = formatHour(count200 * time200);
  document.getElementById('hour250').textContent = formatHour(count250 * time250);

  saveData();
}

function resetData(){
  if(!resetConfirm()) return;

  [
    'gbf_chunk',
    'gbf_clump',
    'gbf_time95',
    'gbf_time150',
    'gbf_time200',
    'gbf_time250'
  ].forEach(key => localStorage.removeItem(key));

  chunkInput.value = 10000;
  clumpInput.value = 0;
  time95Input.value = 10;
  time150Input.value = 20;
  time200Input.value = 120;
  time250Input.value = 450;

  calc();
  window.GBFCloud?.saveNow('meat', getMeatData());
}

chunkInput.addEventListener('input', calc);
clumpInput.addEventListener('input', calc);
time95Input.addEventListener('input', calc);
time150Input.addEventListener('input', calc);
time200Input.addEventListener('input', calc);
time250Input.addEventListener('input', calc);

document.addEventListener('gbf-cloud-api-ready', registerCloudSync);

loadData();
calc();
registerCloudSync();
