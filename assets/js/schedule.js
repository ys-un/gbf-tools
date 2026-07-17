(() => {
  const DATA_URL = "../data/schedule.json";
  const FILTER_KEY = "gbfToolsScheduleFilters";
  const categories = ["event", "collab", "battle", "update"];
  const state = {
    data: null,
    index: 0,
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
    const d=parse(date); const md=`${d.getMonth()+1}/${d.getDate()}`;
    if(!includeTime) return md;
    return `${md} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function isSingleDay(e){
    const s=parse(e.start), t=parse(e.end);
    return s.getFullYear()===t.getFullYear() && s.getMonth()===t.getMonth() && s.getDate()===t.getDate();
  }

  function rangeText(e){
    if(isSingleDay(e)) return fmtDate(e.start, true);
    return `${fmtDate(e.start, true)} ～ ${fmtDate(e.end, true)}`;
  }

  function monthDays(month){
    const [y,m]=month.split("-").map(Number);
    return new Date(y,m,0).getDate();
  }

  function clampDay(date, year, month, days){
    const d=parse(date);
    if(d.getFullYear()<year || (d.getFullYear()===year && d.getMonth()+1<month)) return 1;
    if(d.getFullYear()>year || (d.getFullYear()===year && d.getMonth()+1>month)) return days;
    return d.getDate();
  }

  function renderStatus(events){
    const visibleEvents = filteredEvents(events);
    const current=now();
    const active=visibleEvents.filter(e=>parse(e.start)<=current && parse(e.end)>=current).sort((a,b)=>parse(a.end)-parse(b.end));
    const upcoming=visibleEvents.filter(e=>parse(e.start)>current).sort((a,b)=>parse(a.start)-parse(b.start));
    const currentBox=document.getElementById("currentEvents");
    const nextBox=document.getElementById("nextEvent");

    currentBox.innerHTML=active.length ? active.map(e=>{
      const hours=Math.max(0,Math.ceil((parse(e.end)-current)/3600000));
      const remain=hours<24 ? `残り約${hours}時間` : `残り約${Math.ceil(hours/24)}日`;
      return `<div class="schedule_status_item"><span class="schedule_category _${e.category}">${categoryLabel[e.category]}</span><h3>${escapeHtml(e.title)}</h3><p>${rangeText(e)}</p><strong>${remain}</strong></div>`;
    }).join("") : '<p class="schedule_empty">表示対象の開催中予定はありません。</p>';

    if(upcoming.length){
      const e=upcoming[0]; const hours=Math.max(0,Math.ceil((parse(e.start)-current)/3600000));
      const remain=hours<24 ? `開始まで約${hours}時間` : `開始まで約${Math.ceil(hours/24)}日`;
      nextBox.innerHTML=`<div class="schedule_status_item"><span class="schedule_category _${e.category}">${categoryLabel[e.category]}</span><h3>${escapeHtml(e.title)}</h3><p>${rangeText(e)}</p><strong>${remain}</strong></div>`;
    }else nextBox.innerHTML='<p class="schedule_empty">表示対象の次の予定は未登録です。</p>';
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
    const pack=state.data.months[state.index];
    const events=filteredEvents(pack.events);
    const [year,month]=pack.month.split("-").map(Number);
    const days=monthDays(pack.month);
    document.getElementById("scheduleYear").textContent=year;
    document.getElementById("scheduleMonth").textContent=`${month}月`;
    document.getElementById("prevMonth").disabled=state.index<=0;
    document.getElementById("nextMonth").disabled=state.index>=state.data.months.length-1;

    const current=now();
    const header=Array.from({length:days},(_,i)=>{
      const d=new Date(year,month-1,i+1); const day=d.getDay();
      const cls=[0,6].includes(day)?(day===0?" _sun":" _sat"):"";
      const today=current.getFullYear()===year && current.getMonth()+1===month && current.getDate()===i+1 ? " _today" : "";
      return `<div class="schedule_day${cls}${today}"><strong>${i+1}</strong><span>${["日","月","火","水","木","金","土"][day]}</span></div>`;
    }).join("");

    const rows=events.map(e=>{
      const start=clampDay(e.start,year,month,days); const end=clampDay(e.end,year,month,days);
      const left=((start-1)/days)*100; const width=(Math.max(1,end-start+1)/days)*100;
      const active=parse(e.start)<=current && parse(e.end)>=current ? " is_active" : "";
      const title=escapeHtml(e.title);
      return `<div class="schedule_row${active}"><div class="schedule_row_title"><span class="schedule_category _${e.category}">${categoryLabel[e.category]}</span><strong>${title}</strong></div><div class="schedule_row_track">${Array.from({length:days},()=>'<i></i>').join("")}<div class="schedule_bar _${e.category}" style="left:${left}%;width:${width}%" title="${title}｜${rangeText(e)}"><span>${title}</span></div></div></div>`;
    }).join("");

    document.getElementById("scheduleTimeline").style.setProperty("--schedule-days",days);
    document.getElementById("scheduleTimeline").innerHTML=`<div class="schedule_days"><div class="schedule_days_blank">イベント</div><div class="schedule_days_grid">${header}</div></div>${rows || '<div class="schedule_no_results">選択中のカテゴリーに予定はありません。</div>'}`;

    document.getElementById("scheduleList").innerHTML=events.length ? events.slice().sort((a,b)=>parse(a.start)-parse(b.start)).map(e=>`<article class="schedule_list_item"><div class="schedule_list_date"><strong>${fmtDate(e.start,false)}</strong><span>${isSingleDay(e)?pad(parse(e.start).getHours())+":"+pad(parse(e.start).getMinutes()):"期間"}</span></div><div><span class="schedule_category _${e.category}">${categoryLabel[e.category]}</span><h3>${escapeHtml(e.title)}</h3><p>${rangeText(e)}${e.note?`<br>${escapeHtml(e.note)}`:""}</p></div></article>`).join("") : '<p class="schedule_empty">選択中のカテゴリーに予定はありません。</p>';

    renderStatus(pack.events);
    renderFilters();
  }

  async function init(){
    try{
      const res=await fetch(DATA_URL,{cache:"no-store"});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data=await res.json();
      const currentMonth=`${now().getFullYear()}-${pad(now().getMonth()+1)}`;
      const found=state.data.months.findIndex(x=>x.month===currentMonth);
      state.index=found>=0?found:state.data.months.length-1;
      document.getElementById("scheduleUpdated").textContent=`データ更新：${fmtDate(state.data.updatedAt,true)}`;
      renderMonth();
    }catch(err){
      console.error(err);
      document.getElementById("scheduleUpdated").textContent="データを読み込めませんでした";
      document.getElementById("scheduleTimeline").innerHTML='<p class="schedule_empty">スケジュールデータの読み込みに失敗しました。</p>';
    }
  }

  document.getElementById("prevMonth").addEventListener("click",()=>{ if(state.index>0){state.index--;renderMonth();} });
  document.getElementById("nextMonth").addEventListener("click",()=>{ if(state.data && state.index<state.data.months.length-1){state.index++;renderMonth();} });
  init();
})();
