// メニュー開閉
function toggleMenu(){

  document
    .getElementById('sidebar')
    ?.classList
    .toggle('active');

}


// 数字整形
function formatNumber(num){

  return Number(num).toLocaleString();

}


// 時間変換
function formatHour(seconds){

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return `${h}時間 ${m}分`;

}


// リセット確認
function resetConfirm(){

  return confirm(
    '入力内容をリセットしますか？'
  );

}