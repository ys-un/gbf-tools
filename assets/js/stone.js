const stoneInput =
  document.getElementById('stone');

const singleTicketInput =
  document.getElementById('singleTicket');

const tenTicketInput =
  document.getElementById('tenTicket');

const markInput =
  document.getElementById('mark');

const totalStone =
  document.getElementById('totalStone');

const totalRoll =
  document.getElementById('totalRoll');

const remainRoll =
  document.getElementById('remainRoll');

const needStone =
  document.getElementById('needStone');

const needMoney =
  document.getElementById('needMoney');


// 円グラフ
const pieChart =
  document.getElementById('pieChart');

const chartPercent =
  document.getElementById('chartPercent');


// 保存
function saveData(){

  localStorage.setItem(
    'gbf_stone',
    stoneInput.value
  );

  localStorage.setItem(
    'gbf_single',
    singleTicketInput.value
  );

  localStorage.setItem(
    'gbf_ten',
    tenTicketInput.value
  );

  localStorage.setItem(
    'gbf_mark',
    markInput.value
  );

}


// 読み込み
function loadData(){

  stoneInput.value =
    localStorage.getItem(
      'gbf_stone'
    ) || 0;

  singleTicketInput.value =
    localStorage.getItem(
      'gbf_single'
    ) || 0;

  tenTicketInput.value =
    localStorage.getItem(
      'gbf_ten'
    ) || 0;

  markInput.value =
    localStorage.getItem(
      'gbf_mark'
    ) || 0;

}


// 計算
function calc(){

  const stone =
    Number(stoneInput.value) || 0;

  const singleTicket =
    Number(singleTicketInput.value) || 0;

  const tenTicket =
    Number(tenTicketInput.value) || 0;

  const mark =
    Number(markInput.value) || 0;


  // チケット石換算
  const singleStone =
    singleTicket * 300;

  const tenStone =
    tenTicket * 3000;


  // 合計石
  const totalStoneValue =
    stone +
    singleStone +
    tenStone;


  // ガチャ回数
  const stoneRoll =
    Math.floor(stone / 300);

  const total =
    stoneRoll +
    singleTicket +
    (tenTicket * 10) +
    mark;


  // 残り
  const remain =
    Math.max(
      300 - total,
      0
    );


  // 表示
  totalStone.textContent =
    `${formatNumber(totalStoneValue)}個`;

  totalRoll.textContent =
    `${formatNumber(total)}連`;

  remainRoll.textContent =
    `${formatNumber(remain)}連`;

  const remainStoneValue =
    Math.max(
      90000 - totalStoneValue,
      0
    );

  needStone.textContent =
    `${formatNumber(remainStoneValue)}個`;

  needMoney.textContent =
    `¥${formatNumber(remain * 300)}`;


  // -------------------
  // 円グラフ
  // -------------------

  // 石割合
  const stoneRate =
    Math.min(
      (stone / 90000) * 360,
      360
    );


  // チケット割合
  const ticketValue =
    singleStone + tenStone;

  const ticketRate =
    Math.min(
      (ticketValue / 90000) * 360,
      360
    );


  // 合計割合
  const totalRate =
    Math.min(
      stoneRate + ticketRate,
      360
    );


  // パーセント
  const percent =
    Math.min(
      (totalStoneValue / 90000) * 100,
      100
    );


  // パーセント表示
  chartPercent.textContent =
    `${Math.floor(percent)}%`;


  // 天井到達
  if(totalStoneValue >= 90000){

    pieChart.classList.add(
      'complete'
    );

    // JS背景解除
    pieChart.style.background = '';

  }else{

    pieChart.classList.remove(
      'complete'
    );

    // 通常グラフ
    pieChart.style.background =
      `
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


  // 保存
  saveData();

}


// リセット
function resetData(){

  if(!resetConfirm()){
    return;
  }

  localStorage.removeItem(
    'gbf_stone'
  );

  localStorage.removeItem(
    'gbf_single'
  );

  localStorage.removeItem(
    'gbf_ten'
  );

  localStorage.removeItem(
    'gbf_mark'
  );

  stoneInput.value = 0;
  singleTicketInput.value = 0;
  tenTicketInput.value = 0;
  markInput.value = 0;

  calc();

}


// イベント
stoneInput.addEventListener(
  'input',
  calc
);

singleTicketInput.addEventListener(
  'input',
  calc
);

tenTicketInput.addEventListener(
  'input',
  calc
);

markInput.addEventListener(
  'input',
  calc
);


// 初回
loadData();
calc();