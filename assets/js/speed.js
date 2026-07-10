const currentHonorInput =
  document.getElementById('currentHonor');

const targetHonorInput =
  document.getElementById('targetHonor');

const remainHourInput =
  document.getElementById('remainHour');

const currentSpeedInput =
  document.getElementById('currentSpeed');

const onehourBeforeInput =
  document.getElementById('onehourBefore');

const onehourAfterInput =
  document.getElementById('onehourAfter');

const quarterBeforeInput =
  document.getElementById('quarterBefore');

const quarterAfterInput =
  document.getElementById('quarterAfter');


// 保存
function saveData(){

  localStorage.setItem(
    'gbf_currentHonor',
    currentHonorInput.value
  );

  localStorage.setItem(
    'gbf_targetHonor',
    targetHonorInput.value
  );

  localStorage.setItem(
    'gbf_remainHour',
    remainHourInput.value
  );

  localStorage.setItem(
    'gbf_currentSpeed',
    currentSpeedInput.value
  );

  localStorage.setItem(
    'gbf_onehourBefore',
    onehourBeforeInput.value
  );

  localStorage.setItem(
    'gbf_onehourAfter',
    onehourAfterInput.value
  );

  localStorage.setItem(
    'gbf_quarterBefore',
    quarterBeforeInput.value
  );

  localStorage.setItem(
    'gbf_quarterAfter',
    quarterAfterInput.value
  );

}


// 読み込み
function loadData(){

  currentHonorInput.value =
    localStorage.getItem(
      'gbf_currentHonor'
    ) || 0;

  targetHonorInput.value =
    localStorage.getItem(
      'gbf_targetHonor'
    ) || 1000000000;

  remainHourInput.value =
    localStorage.getItem(
      'gbf_remainHour'
    ) || 24;

  currentSpeedInput.value =
    localStorage.getItem(
      'gbf_currentSpeed'
    ) || 0;

  onehourBeforeInput.value =
    localStorage.getItem(
      'gbf_onehourBefore'
    ) || 0;

  onehourAfterInput.value =
    localStorage.getItem(
      'gbf_onehourAfter'
    ) || 0;

  quarterBeforeInput.value =
    localStorage.getItem(
      'gbf_quarterBefore'
    ) || 0;

  quarterAfterInput.value =
    localStorage.getItem(
      'gbf_quarterAfter'
    ) || 0;

}


// 計算
function calc(){

  const currentHonor =
    Number(currentHonorInput.value) || 0;

  const targetHonor =
    Number(targetHonorInput.value) || 0;

  const remainHour =
    Number(remainHourInput.value) || 1;

  const currentSpeed =
    Number(currentSpeedInput.value) || 0;

  const onehourBefore =
    Number(onehourBeforeInput.value) || 0;

  const onehourAfter =
    Number(onehourAfterInput.value) || 0;

  const quarterBefore =
    Number(quarterBeforeInput.value) || 0;

  const quarterAfter =
    Number(quarterAfterInput.value) || 0;


  // 必要貢献度
  const needHonor =
    Math.max(
      targetHonor - currentHonor,
      0
    );


  // 必要時速
  const needSpeed =
    Math.ceil(
      needHonor / remainHour
    );


  // 現在速度での予測
  const finalPrediction =
    currentHonor +
    (currentSpeed * remainHour);

  // 時速差分
  const onehourSpeed =
    Math.max(
      onehourAfter - onehourBefore,
      0
    );

  // 15分差分
  const quarterDiff =
    Math.max(
      quarterAfter - quarterBefore,
      0
    );

  // 時速換算
  const quarterSpeed =
    quarterDiff * 4;


  // 表示
  document.getElementById(
    'needHonor'
  ).textContent =
    formatNumber(needHonor);

  document.getElementById(
    'needSpeed'
  ).textContent =
    `${formatNumber(needSpeed)} /h`;

  document.getElementById(
    'finalPrediction'
  ).textContent =
    formatNumber(finalPrediction);

  document.getElementById(
    'onehourSpeed'
  ).textContent =
    `${formatNumber(onehourSpeed)} /h`;

  document.getElementById(
    'quarterDiff'
  ).textContent =
    formatNumber(quarterDiff);

  document.getElementById(
    'quarterSpeed'
  ).textContent =
    `${formatNumber(quarterSpeed)} /h`;

  document.getElementById(
    'judge'
  ).textContent =
    finalPrediction >= targetHonor
      ? '到達可能'
      : '未達';


  // 保存
  saveData();

}


// リセット
function resetData(){

  if(!resetConfirm()){
    return;
  }

  localStorage.removeItem(
    'gbf_currentHonor'
  );

  localStorage.removeItem(
    'gbf_targetHonor'
  );

  localStorage.removeItem(
    'gbf_remainHour'
  );

  localStorage.removeItem(
    'gbf_currentSpeed'
  );

  localStorage.removeItem(
    'gbf_onehourBefore'
  );

  localStorage.removeItem(
    'gbf_onehourAfter'
  );

  localStorage.removeItem(
    'gbf_quarterBefore'
  );

  localStorage.removeItem(
    'gbf_quarterAfter'
  );

  currentHonorInput.value = 0;
  targetHonorInput.value = 1000000000;
  remainHourInput.value = 24;
  currentSpeedInput.value = 0;

  onehourBeforeInput.value = 0;
  onehourAfterInput.value = 0;
  quarterBeforeInput.value = 0;
  quarterAfterInput.value = 0;

  calc();

}


// イベント
currentHonorInput.addEventListener(
  'input',
  calc
);

targetHonorInput.addEventListener(
  'input',
  calc
);

remainHourInput.addEventListener(
  'input',
  calc
);

currentSpeedInput.addEventListener(
  'input',
  calc
);

onehourBeforeInput.addEventListener(
  'input',
  calc
);

onehourAfterInput.addEventListener(
  'input',
  calc
);

quarterBeforeInput.addEventListener(
  'input',
  calc
);

quarterAfterInput.addEventListener(
  'input',
  calc
);


// 初回
loadData();
calc();