(() => {
  const DATA_URL = "../data/schedule.json";
  const FILTER_KEY = "gbfToolsScheduleFilters";
  const categories = ["event", "collab", "battle", "update"];
  const state = {
    data: null,
    currentDate: new Date(),
    filters: loadFilters()
  };

  const categoryLabel = { event:"イベント", collab:"コラボ", battle:"バトル", update:"アップデート" };
  const pad = n => String(n).padStart(2,"0");
  const parse = value => new Date(value);
  const now = () => new Date();
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));

  function loadFilters(){
    const defaults = Object.fromEntries(categories.map(category => [category, true]));
    try{
      const saved = JSON.parse(localStorage.getItem(FILTER_KEY));
      return {...defaults, ...(saved || {})};
    }catch(_){
      return defaults;
    }
  }

  function saveFilters(){
    localStorage.setItem(FILTER_KEY, JSON.stringify(state.filters));
  }

  function filteredEvents(events){
    return events.filter(event => state.filters[event.category] !== false);
  }

  function fmtDate(date, includeTime=true){
    const d=parse(date);
    const md=`${d.getMonth()+1}/${d.getDate()}`;
    if(!includeTime) return md;
    return `${md} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function isSingleDay(event){
    const start=parse(event.start);
    const end=parse(event.end);
    return start.getFullYear()===end.getFullYear() && start.getMonth()===end.getMonth() && start.getDate()===end.getDate();
  }

  function rangeText(event){
    if(isSingleDay(event)) return fmtDate(event.start, true);
    return `${fmtDate(event.start, true)} ～ ${fmtDate(event.end, true)}`;
  }

  function monthDays(year, month){
    return new Date(year, month, 0).getDate();
  }

  function clampDay(date, year, month, days){
    const d=parse(date);
    if(d.getFullYear()<year || (d.getFullYear()===year && d.getMonth()+1<month)) return 1;
    if(d.getFullYear()>year || (d.getFullYear()===year && d.getMonth()+1>month)) return days;
    return d.getDate();
  }

  function getMonthEvents(events, year, month){
    const firstDay = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
    return events.filter(event => parse(event.start) <= lastDay && parse(event.end) >= firstDay);
  }

  function renderStatus(events){
    const visibleEvents = filteredEvents(events);
    const current=now();
    const active=visibleEvents.filter(event=>parse(event.start)<=current && parse(event.end)>=current).sort((a,b)=>parse(a.end)-parse(b.end));
    const upcoming=visibleEvents.filter(event=>parse(event.start)>current).sort((a,b)=>parse(a.start)-parse(b.start));
    const currentBox=document.getElementById("currentEvents");
    const nextBox=document.getElementById("nextEvent");

    currentBox.innerHTML=active.length ? active.map(event=>{
      const hours=Math.max(0,Math.ceil((parse(event.end)-current)/3600000));
      const remain=hours<24 ? `残り約${hours}時間` : `残り約${Math.ceil(hours/24)}日`;
      return `<div class="schedule_status_item"><span class="schedule_category _${event.category}">${categoryLabel[event.category]}</span><h3>${escapeHtml(event.title)}</h3><p>${rangeText(event)}</p><strong>${remain}</strong></div>`;
    }).join("") : '<p class="schedule_empty">表示対象の開催中予定はありません。</p>';

    if(upcoming.length){
      const event=upcoming[0];
      const hours=Math.max(0,Math.ceil((parse(event.start)-current)/3600000));
      const remain=hours<24 ? `開始まで約${hours}時間` : `開始まで約${Math.ceil(hours/24)}日`;
      nextBox.innerHTML=`<div class="schedule_status_item"><span class="schedule_category _${event.category}">${categoryLabel[event.category]}</span><h3>${escapeHtml(event.title)}</h3><p>${rangeText(event)}</p><strong>${remain}</strong></div>`;
    }else{
      nextBox.innerHTML='<p class="schedule_empty">表示対象の次の予定は未登録です。</p>';
    }
  }

  function renderFilters(){
    const container = document.getElementById("scheduleFilters");
    container.innerHTML = categories.map(category => `
      <label class="schedule_filter _${category}${state.filters[category] ? ' is_active' : ''}">
        <input type="checkbox" value="${category}" ${state.filters[category] ? 'checked' : ''}>
        <i aria-hidden="true"></i>
        <span>${categoryLabel[category]}</span>
      </label>
    `).join("");

    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener("change", event => {
        state.filters[event.target.value] = event.target.checked;
        saveFilters();
        renderMonth();
      });
    });
  }

  function renderMonth(){
    if(!state.data) return;

    const year=state.currentDate.getFullYear();
    const month=state.currentDate.getMonth()+1;
    const days=monthDays(year, month);
    const allVisibleEvents=filteredEvents(state.data.events || []);
    const events=getMonthEvents(allVisibleEvents, year, month).sort((a,b)=>parse(a.start)-parse(b.start));

    document.getElementById("scheduleYear").textContent=year;
    document.getElementById("scheduleMonth").textContent=`${month}月`;

    const current=now();
    const header=Array.from({length:days},(_,i)=>{
      const date=new Date(year,month-1,i+1);
      const day=date.getDay();
      const cls=[0,6].includes(day)?(day===0?" _sun":" _sat"):"";
      const today=current.getFullYear()===year && current.getMonth()+1===month && current.getDate()===i+1 ? " _today" : "";
      return `<div class="schedule_day${cls}${today}"><strong>${i+1}</strong><span>${["日","月","火","水","木","金","土"][day]}</span></div>`;
    }).join("");

    const rows=events.map(event=>{
      const start=clampDay(event.start,year,month,days);
      const end=clampDay(event.end,year,month,days);
      const left=((start-1)/days)*100;
      const width=(Math.max(1,end-start+1)/days)*100;
      const active=parse(event.start)<=current && parse(event.end)>=current ? " is_active" : "";
      const title=escapeHtml(event.title);
      return `<div class="schedule_row${active}"><div class="schedule_row_title"><span class="schedule_category _${event.category}">${categoryLabel[event.category]}</span><strong>${title}</strong></div><div class="schedule_row_track">${Array.from({length:days},()=>'<i></i>').join("")}<div class="schedule_bar _${event.category}" style="left:${left}%;width:${width}%" title="${title}｜${rangeText(event)}"><span>${title}</span></div></div></div>`;
    }).join("");

    const timeline=document.getElementById("scheduleTimeline");
    timeline.style.setProperty("--schedule-days",days);
    timeline.innerHTML=`<div class="schedule_days"><div class="schedule_days_blank">イベント</div><div class="schedule_days_grid">${header}</div></div>${rows || '<div class="schedule_no_results">この月には、選択中のカテゴリーの予定はありません。</div>'}`;

    document.getElementById("scheduleList").innerHTML=events.length ? events.map(event=>`<article class="schedule_list_item"><div class="schedule_list_date"><strong>${fmtDate(event.start,false)}</strong><span>${isSingleDay(event)?pad(parse(event.start).getHours())+":"+pad(parse(event.start).getMinutes()):"期間"}</span></div><div><span class="schedule_category _${event.category}">${categoryLabel[event.category]}</span><h3>${escapeHtml(event.title)}</h3><p>${rangeText(event)}${event.note?`<br>${escapeHtml(event.note)}`:""}</p></div></article>`).join("") : '<p class="schedule_empty">この月には、選択中のカテゴリーの予定はありません。</p>';

    renderStatus(state.data.events || []);
    renderFilters();
  }

  function moveMonth(amount){
    state.currentDate = new Date(
      state.currentDate.getFullYear(),
      state.currentDate.getMonth() + amount,
      1
    );
    renderMonth();
  }

  async function init(){
    try{
      const response=await fetch(DATA_URL,{cache:"no-store"});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      state.data=await response.json();
      if(!Array.isArray(state.data.events)) state.data.events=[];
      state.currentDate=new Date(now().getFullYear(), now().getMonth(), 1);
      document.getElementById("scheduleUpdated").textContent=`データ更新：${fmtDate(state.data.updatedAt,true)}`;
      renderMonth();
    }catch(error){
      console.error(error);
      document.getElementById("scheduleUpdated").textContent="データを読み込めませんでした";
      document.getElementById("scheduleTimeline").innerHTML='<p class="schedule_empty">スケジュールデータの読み込みに失敗しました。</p>';
    }
  }

  document.getElementById("prevMonth").addEventListener("click",()=>moveMonth(-1));
  document.getElementById("nextMonth").addEventListener("click",()=>moveMonth(1));
  init();
})();
