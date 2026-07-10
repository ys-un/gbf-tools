const currentHonorInput = document.getElementById('currentHonor');
const targetHonorInput = document.getElementById('targetHonor');
const remainHourInput = document.getElementById('remainHour');
const currentSpeedInput = document.getElementById('currentSpeed');
const onehourBeforeInput = document.getElementById('onehourBefore');
const onehourAfterInput = document.getElementById('onehourAfter');
const quarterBeforeInput = document.getElementById('quarterBefore');
const quarterAfterInput = document.getElementById('quarterAfter');

let applyingCloudData = false;
let cloudRegistered = false;

function getSpeedData(){
  return {
    currentHonor: currentHonorInput.value,
    targetHonor: targetHonorInput.value,
    remainHour: remainHourInput.value,
    currentSpeed: currentSpeedInput.value,
    onehourBefore: onehourBeforeInput.value,
    onehourAfter: onehourAfterInput.value,
    quarterBefore: quarterBeforeInput.value,
    quarterAfter: quarterAfterInput.value
  };
}

function saveData(){
  const data = getSpeedData();

  localStorage.setItem('gbf_currentHonor', data.currentHonor);
  localStorage.setItem('gbf_targetHonor', data.targetHonor);
  localStorage.setItem('gbf_remainHour', data.remainHour);
  localStorage.setItem('gbf_currentSpeed', data.currentSpeed);
  localStorage.setItem('gbf_onehourBefore', data.onehourBefore);
  localStorage.setItem('gbf_onehourAfter', data.onehourAfter);
  localStorage.setItem('gbf_quarterBefore', data.quarterBefore);
  localStorage.setItem('gbf_quarterAfter', data.quarterAfter);

  if(!applyingCloudData){
    window.GBFCloud?.queueSave('speed', data);
  }
}

function loadData(){
  currentHonorInput.value = localStorage.getItem('gbf_currentHonor') || 0;
  targetHonorInput.value = localStorage.getItem('gbf_targetHonor') || 1000000000;
  remainHourInput.value = localStorage.getItem('gbf_remainHour') || 24;
  currentSpeedInput.value = localStorage.getItem('gbf_currentSpeed') || 0;
  onehourBeforeInput.value = localStorage.getItem('gbf_onehourBefore') || 0;
  onehourAfterInput.value = localStorage.getItem('gbf_onehourAfter') || 0;
  quarterBeforeInput.value = localStorage.getItem('gbf_quarterBefore') || 0;
  quarterAfterInput.value = localStorage.getItem('gbf_quarterAfter') || 0;
}

function applySpeedData(data){
  applyingCloudData = true;

  currentHonorInput.value = data.currentHonor ?? 0;
  targetHonorInput.value = data.targetHonor ?? 1000000000;
  remainHourInput.value = data.remainHour ?? 24;
  currentSpeedInput.value = data.currentSpeed ?? 0;
  onehourBeforeInput.value = data.onehourBefore ?? 0;
  onehourAfterInput.value = data.onehourAfter ?? 0;
  quarterBeforeInput.value = data.quarterBefore ?? 0;
  quarterAfterInput.value = data.quarterAfter ?? 0;

  calc();
  applyingCloudData = false;
}

function registerCloudSync(){
  if(cloudRegistered || !window.GBFCloud) return;

  cloudRegistered = true;
  window.GBFCloud.registerTool('speed', {
    getLocalData: getSpeedData,
    applyData: applySpeedData
  });
}

function calc(){
  const currentHonor = Number(currentHonorInput.value) || 0;
  const targetHonor = Number(targetHonorInput.value) || 0;
  const remainHour = Number(remainHourInput.value) || 1;
  const currentSpeed = Number(currentSpeedInput.value) || 0;
  const onehourBefore = Number(onehourBeforeInput.value) || 0;
  const onehourAfter = Number(onehourAfterInput.value) || 0;
  const quarterBefore = Number(quarterBeforeInput.value) || 0;
  const quarterAfter = Number(quarterAfterInput.value) || 0;

  const needHonor = Math.max(targetHonor - currentHonor, 0);
  const needSpeed = Math.ceil(needHonor / remainHour);
  const finalPrediction = currentHonor + (currentSpeed * remainHour);
  const onehourSpeed = Math.max(onehourAfter - onehourBefore, 0);
  const quarterDiff = Math.max(quarterAfter - quarterBefore, 0);
  const quarterSpeed = quarterDiff * 4;

  document.getElementById('needHonor').textContent = formatNumber(needHonor);
  document.getElementById('needSpeed').textContent = `${formatNumber(needSpeed)} /h`;
  document.getElementById('finalPrediction').textContent = formatNumber(finalPrediction);
  document.getElementById('onehourSpeed').textContent = `${formatNumber(onehourSpeed)} /h`;
  document.getElementById('quarterDiff').textContent = formatNumber(quarterDiff);
  document.getElementById('quarterSpeed').textContent = `${formatNumber(quarterSpeed)} /h`;
  document.getElementById('judge').textContent = finalPrediction >= targetHonor ? '到達可能' : '未達';

  saveData();
}

function resetData(){
  if(!resetConfirm()) return;

  [
    'gbf_currentHonor',
    'gbf_targetHonor',
    'gbf_remainHour',
    'gbf_currentSpeed',
    'gbf_onehourBefore',
    'gbf_onehourAfter',
    'gbf_quarterBefore',
    'gbf_quarterAfter'
  ].forEach(key => localStorage.removeItem(key));

  currentHonorInput.value = 0;
  targetHonorInput.value = 1000000000;
  remainHourInput.value = 24;
  currentSpeedInput.value = 0;
  onehourBeforeInput.value = 0;
  onehourAfterInput.value = 0;
  quarterBeforeInput.value = 0;
  quarterAfterInput.value = 0;

  calc();
  window.GBFCloud?.saveNow('speed', getSpeedData());
}

[
  currentHonorInput,
  targetHonorInput,
  remainHourInput,
  currentSpeedInput,
  onehourBeforeInput,
  onehourAfterInput,
  quarterBeforeInput,
  quarterAfterInput
].forEach(input => input.addEventListener('input', calc));

document.addEventListener('gbf-cloud-api-ready', registerCloudSync);

loadData();
calc();
registerCloudSync();
