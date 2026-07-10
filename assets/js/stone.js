const stoneInput = document.getElementById('stone');
const singleTicketInput = document.getElementById('singleTicket');
const tenTicketInput = document.getElementById('tenTicket');
const markInput = document.getElementById('mark');

const totalStone = document.getElementById('totalStone');
const totalRoll = document.getElementById('totalRoll');
const remainRoll = document.getElementById('remainRoll');
const needStone = document.getElementById('needStone');
const needMoney = document.getElementById('needMoney');

const pieChart = document.getElementById('pieChart');
const chartPercent = document.getElementById('chartPercent');

let applyingCloudData = false;
let cloudRegistered = false;

function getStoneData(){
  return {
    stone: stoneInput.value,
    singleTicket: singleTicketInput.value,
    tenTicket: tenTicketInput.value,
    mark: markInput.value
  };
}

function saveData(){
  const data = getStoneData();

  localStorage.setItem('gbf_stone', data.stone);
  localStorage.setItem('gbf_single', data.singleTicket);
  localStorage.setItem('gbf_ten', data.tenTicket);
  localStorage.setItem('gbf_mark', data.mark);

  if(!applyingCloudData){
    window.GBFCloud?.queueSave('stone', data);
  }
}

function loadData(){
  stoneInput.value = localStorage.getItem('gbf_stone') || 0;
  singleTicketInput.value = localStorage.getItem('gbf_single') || 0;
  tenTicketInput.value = localStorage.getItem('gbf_ten') || 0;
  markInput.value = localStorage.getItem('gbf_mark') || 0;
}

function applyStoneData(data){
  applyingCloudData = true;

  stoneInput.value = data.stone ?? 0;
  singleTicketInput.value = data.singleTicket ?? 0;
  tenTicketInput.value = data.tenTicket ?? 0;
  markInput.value = data.mark ?? 0;

  calc();
  applyingCloudData = false;
}

function registerCloudSync(){
  if(cloudRegistered || !window.GBFCloud) return;

  cloudRegistered = true;
  window.GBFCloud.registerTool('stone', {
    getLocalData: getStoneData,
    applyData: applyStoneData
  });
}

function calc(){
  const stone = Number(stoneInput.value) || 0;
  const singleTicket = Number(singleTicketInput.value) || 0;
  const tenTicket = Number(tenTicketInput.value) || 0;
  const mark = Number(markInput.value) || 0;

  const singleStone = singleTicket * 300;
  const tenStone = tenTicket * 3000;
  const totalStoneValue = stone + singleStone + tenStone;

  const stoneRoll = Math.floor(stone / 300);
  const total = stoneRoll + singleTicket + (tenTicket * 10) + mark;
  const remain = Math.max(300 - total, 0);

  totalStone.textContent = `${formatNumber(totalStoneValue)}個`;
  totalRoll.textContent = `${formatNumber(total)}連`;
  remainRoll.textContent = `${formatNumber(remain)}連`;

  const remainStoneValue = Math.max(90000 - totalStoneValue, 0);
  needStone.textContent = `${formatNumber(remainStoneValue)}個`;
  needMoney.textContent = `¥${formatNumber(remain * 300)}`;

  const stoneRate = Math.min((stone / 90000) * 360, 360);
  const ticketValue = singleStone + tenStone;
  const ticketRate = Math.min((ticketValue / 90000) * 360, 360);
  const totalRate = Math.min(stoneRate + ticketRate, 360);
  const percent = Math.min((totalStoneValue / 90000) * 100, 100);

  chartPercent.textContent = `${Math.floor(percent)}%`;

  if(totalStoneValue >= 90000){
    pieChart.classList.add('complete');
    pieChart.style.background = '';
  }else{
    pieChart.classList.remove('complete');
    pieChart.style.background = `
      conic-gradient(
        #38bdf8 0deg,
        #38bdf8 ${stoneRate}deg,
        #ef4444 ${stoneRate}deg,
        #ef4444 ${totalRate}deg,
        #1e293b ${totalRate}deg,
        #1e293b 360deg
      )
    `;
  }

  saveData();
}

function resetData(){
  if(!resetConfirm()) return;

  localStorage.removeItem('gbf_stone');
  localStorage.removeItem('gbf_single');
  localStorage.removeItem('gbf_ten');
  localStorage.removeItem('gbf_mark');

  stoneInput.value = 0;
  singleTicketInput.value = 0;
  tenTicketInput.value = 0;
  markInput.value = 0;

  calc();
  window.GBFCloud?.saveNow('stone', getStoneData());
}

stoneInput.addEventListener('input', calc);
singleTicketInput.addEventListener('input', calc);
tenTicketInput.addEventListener('input', calc);
markInput.addEventListener('input', calc);

document.addEventListener('gbf-cloud-api-ready', registerCloudSync);

loadData();
calc();
registerCloudSync();
