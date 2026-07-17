(() => {
  const DATA_URL = "data/schedule.json";
  const pad = n => String(n).padStart(2, "0");
  const parse = value => new Date(value);
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const categoryLabel = { event:"イベント", collab:"コラボ", battle:"バトル", update:"アップデート" };

  function fmtDate(value){
    const date = parse(value);
    return `${date.getMonth()+1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function rangeText(event){
    return `${fmtDate(event.start)} ～ ${fmtDate(event.end)}`;
  }

  function remainingText(target, prefix){
    const hours = Math.max(0, Math.ceil((parse(target) - new Date()) / 3600000));
    return hours < 24 ? `${prefix}約${hours}時間` : `${prefix}約${Math.ceil(hours / 24)}日`;
  }

  async function init(){
    const currentBox = document.getElementById("homeCurrentEvent");
    const nextBox = document.getElementById("homeNextEvent");
    const updated = document.getElementById("homeScheduleUpdated");

    try{
      const response = await fetch(DATA_URL, {cache:"no-store"});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const events = data.months.flatMap(month => month.events).sort((a,b) => parse(a.start) - parse(b.start));
      const now = new Date();
      const active = events.filter(event => parse(event.start) <= now && parse(event.end) >= now).sort((a,b) => parse(a.end) - parse(b.end));
      const next = events.find(event => parse(event.start) > now);

      currentBox.innerHTML = active.length ? active.slice(0,2).map(event => `
        <a href="schedule/" class="home_schedule_item">
          <span class="schedule_category _${event.category}">${categoryLabel[event.category]}</span>
          <strong>${escapeHtml(event.title)}</strong>
          <small>${rangeText(event)}</small>
          <em>${remainingText(event.end, "残り")}</em>
        </a>
      `).join("") : '<p class="home_schedule_empty">現在開催中の予定はありません。</p>';

      nextBox.innerHTML = next ? `
        <a href="schedule/" class="home_schedule_item">
          <span class="schedule_category _${next.category}">${categoryLabel[next.category]}</span>
          <strong>${escapeHtml(next.title)}</strong>
          <small>${rangeText(next)}</small>
          <em>${remainingText(next.start, "開始まで")}</em>
        </a>
      ` : '<p class="home_schedule_empty">次の予定は未登録です。</p>';

      updated.textContent = `更新：${fmtDate(data.updatedAt)}`;
    }catch(error){
      console.error(error);
      currentBox.innerHTML = '<p class="home_schedule_empty">スケジュールを読み込めませんでした。</p>';
      nextBox.innerHTML = '<p class="home_schedule_empty">スケジュールを読み込めませんでした。</p>';
      updated.textContent = "";
    }
  }

  init();
})();
