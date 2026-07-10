const chunkInput =
  document.getElementById('chunk');

const clumpInput =
  document.getElementById('clump');

const time95Input =
  document.getElementById('time95');

const time150Input =
  document.getElementById('time150');

const time200Input =
  document.getElementById('time200');

const time250Input =
  document.getElementById('time250');


// 保存
function saveData(){

  localStorage.setItem(
    'gbf_chunk',
    chunkInput.value
  );

  localStorage.setItem(
    'gbf_clump',
    clumpInput.value
  );

  localStorage.setItem(
    'gbf_time95',
    time95Input.value
  );

  localStorage.setItem(
    'gbf_time150',
    time150Input.value
  );

  localStorage.setItem(
    'gbf_time200',
    time200Input.value
  );

  localStorage.setItem(
    'gbf_time250',
    time250Input.value
  );

}


// 読み込み
function loadData(){

  chunkInput.value =
    localStorage.getItem('gbf_chunk') || 10000;

  clumpInput.value =
    localStorage.getItem('gbf_clump') || 0;

  time95Input.value =
    localStorage.getItem('gbf_time95') || 30;

  time150Input.value =
    localStorage.getItem('gbf_time150') || 90;

  time200Input.value =
    localStorage.getItem('gbf_time200') || 180;

  time250Input.value =
    localStorage.getItem('gbf_time250') || 500;

}


// 計算
function calc(){

  const chunk =
    Number(chunkInput.value) || 0;

  const clump =
    Number(clumpInput.value) || 0;

  const time95 =
    Number(time95Input.value) || 1;

  const time150 =
    Number(time150Input.value) || 1;

  const time200 =
    Number(time200Input.value) || 1;

  const time250 =
    Number(time250Input.value) || 1;

  const count95 =
    Math.floor(chunk / 10);

  const count150 =
    Math.floor(chunk / 20);

  const count200 =
    Math.floor(chunk / 20);

  const count250 =
    Math.floor(clump / 20);

  document.getElementById(
    'count95'
  ).textContent =
    `${formatNumber(count95)}回`;

  document.getElementById(
    'count150'
  ).textContent =
    `${formatNumber(count150)}回`;

  document.getElementById(
    'count200'
  ).textContent =
    `${formatNumber(count200)}回`;

  document.getElementById(
    'count250'
  ).textContent =
    `${formatNumber(count250)}回`;

  document.getElementById(
    'hour95'
  ).textContent =
    formatHour(count95 * time95);

  document.getElementById(
    'hour150'
  ).textContent =
    formatHour(count150 * time150);

  document.getElementById(
    'hour200'
  ).textContent =
    formatHour(count200 * time200);

  document.getElementById(
    'hour250'
  ).textContent =
    formatHour(count250 * time250);

  saveData();

}


// リセット
function resetData(){

  if(!resetConfirm()){
    return;
  }

  localStorage.clear();

  chunkInput.value = 10000;
  clumpInput.value = 0;

  time95Input.value = 30;
  time150Input.value = 90;
  time200Input.value = 180;
  time250Input.value = 300;

  calc();

}


// イベント
chunkInput.addEventListener('input', calc);
clumpInput.addEventListener('input', calc);

time95Input.addEventListener('input', calc);
time150Input.addEventListener('input', calc);
time200Input.addEventListener('input', calc);
time250Input.addEventListener('input', calc);


// 初回
loadData();
calc();