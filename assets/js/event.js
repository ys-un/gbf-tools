const EVENT_STORAGE_KEY = "gbf_event_tickets";
const levels = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

// SSRチケットありの20箱累計40,666枚に合わせた箱別戦貨。
const boxTicketCosts = [
  1200, 1580, 1980, 2116,
  2112, 2112, 2112, 2112, 2112, 2112, 2112, 2112,
  2112, 2112, 2112, 2112, 2112, 2112, 2112, 2110
];

const fieldIds = [
  "targetBoxes","completedBoxes","currentBoxRemaining","ownedTickets","ownedTriggers","storedHell",
  "rewardHellMission","rewardContribution","rewardDaily","rewardLogin","extraTickets","extraTriggers",
  "freeBossRuns","includeHell","vhTickets","vhAp","vhTriggerGain","timeVh","exTickets","exAp",
  "exTriggerCost","timeEx","hlTickets","hlAp","hlTriggerCost","timeHl","hellTickets","hellTriggerGain",
  "timeHell","hellRate","halfElixirAp","eventEnd","subtractNaturalAp"
];

let applyingCloudData = false;
let cloudRegistered = false;

const $ = id => document.getElementById(id);
const num = id => Number($(id)?.value || 0);
const checked = id => Boolean($(id)?.checked);
const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
const eventFormatNumber = value => Math.round(value).toLocaleString("ja-JP");

function buildSelects(){
  $("targetBoxes").innerHTML = levels.map(n => `<option value="${n}" ${n===20?"selected":""}>${n}箱</option>`).join("");
  $("completedBoxes").innerHTML = [0,...levels].map(n => `<option value="${n}">${n}箱</option>`).join("");
}

function cumulativeTickets(boxes){
  return boxTicketCosts.slice(0,clamp(Number(boxes)||0,0,20)).reduce((a,b)=>a+b,0);
}

function currentProgressTickets(targetBoxes,completedBoxes,remainingPullsRaw){
  const completed = Math.min(completedBoxes,targetBoxes);
  let progress = cumulativeTickets(completed);

  if(completed < targetBoxes){
    const currentCost = boxTicketCosts[completed];
    const totalPulls = currentCost / 2;
    const remainingPulls = remainingPullsRaw === ""
      ? totalPulls
      : clamp(Number(remainingPullsRaw)||0,0,totalPulls);
    progress += currentCost - remainingPulls * 2;
  }

  return progress;
}

function rewardTickets(){
  return (checked("rewardHellMission")?2000:0)
    + (checked("rewardContribution")?1000:0)
    + (checked("rewardDaily")?1350:0)
    + (checked("rewardLogin")?450:0)
    + num("extraTickets");
}

function getRemainingDays(){
  const value = $("eventEnd").value;
  if(!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  if(diff <= 0) return 0;
  return Math.max(1,Math.ceil(diff / 86400000));
}

function formatDuration(seconds){
  const rounded = Math.max(0,Math.round(seconds));
  const h = Math.floor(rounded/3600);
  const m = Math.floor((rounded%3600)/60);
  const s = rounded%60;
  if(h) return `${h}時間${m}分`;
  if(m) return `${m}分${s ? `${s}秒` : ""}`;
  return `${s}秒`;
}

function calculatePlan(type,baseMissing){
  const bossTickets = num(type === "ex" ? "exTickets" : "hlTickets");
  const bossAp = num(type === "ex" ? "exAp" : "hlAp");
  const triggerCost = num(type === "ex" ? "exTriggerCost" : "hlTriggerCost");
  const bossTime = num(type === "ex" ? "timeEx" : "timeHl");
  const vhTickets = num("vhTickets");
  const vhAp = num("vhAp");
  const triggerGain = Math.max(0.01,num("vhTriggerGain"));
  const vhTime = num("timeVh");
  const hellTickets = num("hellTickets");
  const hellTriggerGain = num("hellTriggerGain");
  const hellTime = num("timeHell");
  const hellRate = checked("includeHell") ? clamp(num("hellRate"),0,1) : 0;
  const currentTriggers = num("ownedTriggers") + num("extraTriggers");
  const storedHell = num("storedHell");
  const freeRuns = Math.max(0,Math.floor(num("freeBossRuns")));
  const storedHellTickets = storedHell * hellTickets;
  const storedHellTriggers = storedHell * hellTriggerGain;
  const targetAfterStoredHell = Math.max(0,baseMissing - storedHellTickets);

  let best = null;
  const maxBossRuns = Math.max(1000,Math.ceil(targetAfterStoredHell / Math.max(1,bossTickets))*4 + 500);

  for(let bossRuns=0; bossRuns<=maxBossRuns; bossRuns++){
    const generatedHell = Math.floor(bossRuns * hellRate);
    const paidBossRuns = Math.max(0,bossRuns - freeRuns);
    const grossTriggerNeed = paidBossRuns * triggerCost;
    const availableWithoutVh = currentTriggers + storedHellTriggers + generatedHell * hellTriggerGain;
    const triggerShortage = Math.max(0,grossTriggerNeed - availableWithoutVh);
    const vhRuns = Math.ceil(triggerShortage / triggerGain);
    const tickets = bossRuns * bossTickets + generatedHell * hellTickets + vhRuns * vhTickets + storedHellTickets;

    if(tickets < baseMissing) continue;

    const ap = vhRuns * vhAp + paidBossRuns * bossAp;
    const seconds = vhRuns * vhTime + bossRuns * bossTime + (storedHell + generatedHell) * hellTime;
    const score = ap * 1000000 + seconds;

    if(!best || score < best.score){
      best = {
        score,bossRuns,vhRuns,generatedHell,
        hellRuns: storedHell + generatedHell,
        tickets,ap,seconds,
        grossTriggerNeed,
        triggerShortage,
        paidBossRuns
      };
    }
  }

  return best || {bossRuns:0,vhRuns:0,generatedHell:0,hellRuns:storedHell,tickets:storedHellTickets,ap:0,seconds:storedHell*hellTime,grossTriggerNeed:0,triggerShortage:0,paidBossRuns:0};
}

function getData(){
  const data = {};
  fieldIds.forEach(id => {
    const el = $(id);
    if(!el) return;
    data[id] = el.type === "checkbox" ? el.checked : el.value;
  });
  return data;
}

function saveLocal(){
  const data = getData();
  localStorage.setItem(EVENT_STORAGE_KEY,JSON.stringify(data));
  if(!applyingCloudData) window.GBFCloud?.queueSave("event",data,1000);
}

function applyData(data){
  applyingCloudData = true;
  fieldIds.forEach(id => {
    const el = $(id);
    if(!el || data[id] === undefined || data[id] === null) return;
    if(el.type === "checkbox") el.checked = Boolean(data[id]);
    else el.value = data[id];
  });
  calculate();
  applyingCloudData = false;
}

function loadLocal(){
  try{
    const data = JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY) || "null");
    if(data) applyData(data);
  }catch(error){
    console.error("イベント戦貨計算機の保存データを読み込めませんでした。",error);
  }
}

function registerCloudSync(){
  if(cloudRegistered || !window.GBFCloud) return;
  cloudRegistered = true;
  window.GBFCloud.registerTool("event",{getLocalData:getData,applyData});
}

function renderPlan(prefix,plan,type,days,netAp){
  $(prefix+"VhRuns").textContent = `${eventFormatNumber(plan.vhRuns)}周`;
  $(prefix+"BossRuns").textContent = `${eventFormatNumber(plan.bossRuns)}周`;
  $(prefix+"HellRuns").textContent = `${eventFormatNumber(plan.hellRuns)}回（新規${eventFormatNumber(plan.generatedHell)}回）`;
  $(prefix+"TriggerNeed").textContent = `${eventFormatNumber(plan.triggerShortage)}個（総消費${eventFormatNumber(plan.grossTriggerNeed)}個）`;
  $(prefix+"ApNeed").textContent = eventFormatNumber(netAp);
  $(prefix+"HalfNeed").textContent = `${eventFormatNumber(Math.ceil(netAp / Math.max(1,num("halfElixirAp"))))}本`;
  $(prefix+"TimeNeed").textContent = formatDuration(plan.seconds);
  $(prefix+"Daily").textContent = days ? `VH ${Math.ceil(plan.vhRuns/days)}周 / ${type.toUpperCase()} ${Math.ceil(plan.bossRuns/days)}周` : "終了日時を設定してください";
}

function calculate(){
  const targetBoxes = clamp(num("targetBoxes"),1,20);
  const completedBoxes = clamp(num("completedBoxes"),0,20);
  const targetTickets = cumulativeTickets(targetBoxes);
  const progressSpent = currentProgressTickets(targetBoxes,completedBoxes,$("currentBoxRemaining").value);
  const ownedTickets = num("ownedTickets");
  const currentTotal = Math.min(targetTickets,progressSpent + ownedTickets);
  const missingBeforeRewards = Math.max(0,targetTickets - currentTotal);
  const futureRewards = rewardTickets();
  const effectiveMissing = Math.max(0,missingBeforeRewards - futureRewards);
  const days = getRemainingDays();

  const progress = targetTickets ? clamp(currentTotal/targetTickets*100,0,100) : 100;
  $("progressPercent").textContent = `${progress.toFixed(1)}%`;
  $("progressBar").style.width = `${progress}%`;
  $("progressText").textContent = `${eventFormatNumber(currentTotal)} / ${eventFormatNumber(targetTickets)}枚`;
  $("missingTickets").textContent = `${eventFormatNumber(missingBeforeRewards)}枚`;
  $("effectiveMissingTickets").textContent = `${eventFormatNumber(effectiveMissing)}枚`;
  $("remainingDays").textContent = days === null ? "未設定" : days === 0 ? "終了済み" : `${days}日`;

  const ex = calculatePlan("ex",effectiveMissing);
  const hl = calculatePlan("hl",effectiveMissing);

  const naturalAp = checked("subtractNaturalAp") && days ? days * 288 : 0;
  const exNetAp = Math.max(0,ex.ap-naturalAp);
  const hlNetAp = Math.max(0,hl.ap-naturalAp);

  renderPlan("ex",ex,"ex",days,exNetAp);
  renderPlan("hl",hl,"hl",days,hlNetAp);

  const guide = Math.min(
    ex.triggerShortage,
    hl.triggerShortage
  );
  $("triggerGuide").textContent = `${eventFormatNumber(guide)}個`;

  const exBadges = [];
  const hlBadges = [];

  $("exPlan").classList.remove("is_recommended");
  $("hlPlan").classList.remove("is_recommended");

  let recommendation = "";

  if(effectiveMissing <= 0){
    recommendation = "現在の所持戦貨と今後の報酬だけで目標に到達できます。";
  }else if(ex.seconds <= hl.seconds){
    exBadges.push("時間重視");
    $("exPlan").classList.add("is_recommended");
    recommendation = `入力した討伐時間ではEX中心が約${formatDuration(Math.max(0,hl.seconds-ex.seconds))}短い見込みです。`;
  }else{
    hlBadges.push("時間重視");
    $("hlPlan").classList.add("is_recommended");
    recommendation = `入力した討伐時間ではHL中心が約${formatDuration(Math.max(0,ex.seconds-hl.seconds))}短い見込みです。`;
  }

  if(exNetAp < hlNetAp){
    exBadges.push("AP重視");
    recommendation += ` AP効率はEX中心が${eventFormatNumber(hlNetAp-exNetAp)}AP少ない見込みです。`;
  }else if(hlNetAp < exNetAp){
    hlBadges.push("AP重視");
    recommendation += ` AP効率はHL中心が${eventFormatNumber(exNetAp-hlNetAp)}AP少ない見込みです。`;
  }

  $("exRecommend").textContent = exBadges.join("・");
  $("hlRecommend").textContent = hlBadges.join("・");

  $("eventNotice").textContent = recommendation;
  saveLocal();
}

function resetEvent(){
  if(!confirm("イベント戦貨計算機の入力内容をリセットしますか？")) return;

  const defaults = {
    targetBoxes:"20", completedBoxes:"0", currentBoxRemaining:"", ownedTickets:"0", ownedTriggers:"0", storedHell:"0",
    rewardHellMission:true, rewardContribution:true, rewardDaily:true, rewardLogin:true, extraTickets:"0", extraTriggers:"0",
    freeBossRuns:"0", includeHell:true, vhTickets:"31", vhAp:"20", vhTriggerGain:"3.5", timeVh:"10",
    exTickets:"64", exAp:"30", exTriggerCost:"3", timeEx:"15", hlTickets:"144", hlAp:"40", hlTriggerCost:"5", timeHl:"60",
    hellTickets:"100", hellTriggerGain:"2", timeHell:"10", hellRate:"0.56", halfElixirAp:"75", eventEnd:"", subtractNaturalAp:false
  };

  applyingCloudData = true;
  applyData(defaults);
  applyingCloudData = false;
  localStorage.setItem(EVENT_STORAGE_KEY,JSON.stringify(defaults));
  window.GBFCloud?.saveNow("event",defaults);
}

buildSelects();
fieldIds.forEach(id => {
  const el = $(id);
  if(!el) return;
  el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input",calculate);
});
$("eventResetBtn").addEventListener("click",resetEvent);
document.addEventListener("gbf-cloud-api-ready",registerCloudSync);
loadLocal();
calculate();
registerCloudSync();
