(() => {
  const STORAGE_KEY = 'gbf_checklist_v1';
  const CLOUD_TOOL = 'checklist';

  const ITEMS = [
    // daily
    { id:'daily_magna_pro', type:'daily', title:'マグナPro', group:'スキップ系', recommended:true },
    { id:'daily_angel_halo_pro', type:'daily', title:'エンジェル・ヘイローPro', group:'スキップ系', recommended:true },
    { id:'daily_matome_pro', type:'daily', title:'まとめてPro', group:'スキップ系', recommended:false, recommendedFrom:'2026-09-30T00:00:00+09:00', note:'解放済みProを一括消化（9月末頃実装予定）' },
    { id:'daily_event_mission', type:'daily', title:'イベントミッション消化', group:'イベント', recommended:true, eventWhen:{ categories:['event','collab','battle'] } },
    { id:'daily_casino_pickup', type:'daily', title:'カジノメダル拾い', group:'その他', recommended:true },
    { id:'daily_skyleap_login', type:'daily', title:'SkyLeapログイン', group:'その他', recommended:false },
    { id:'daily_tsuyobaha', type:'daily', title:'つよバハ', group:'ヒヒ掘り', priority:'優先', recommended:false },
    { id:'daily_ubaha', type:'daily', title:'アルバハHL', group:'ヒヒ掘り', priority:'優先', recommended:false },
    { id:'daily_akasha', type:'daily', title:'アーカーシャ', group:'ヒヒ掘り', priority:'次点', recommended:false },
    { id:'daily_grande', type:'daily', title:'グランデHL', group:'ヒヒ掘り', priority:'次点', recommended:false },
    { id:'daily_huanglong', type:'daily', title:'黄龍HL', group:'ヒヒ掘り', priority:'素材がある時', recommended:false },
    { id:'daily_qilin', type:'daily', title:'黒麒麟HL', group:'ヒヒ掘り', priority:'素材がある時', recommended:false },

    // weekly
    { id:'weekly_honors', type:'weekly', title:'武勲・栄誉の輝き', recommended:true },
    { id:'weekly_skyscope', type:'weekly', title:'スカイスコープ', recommended:true },
    { id:'weekly_skyleap', type:'weekly', title:'SkyLeapポイント', recommended:true },
    { id:'weekly_arcarum_passport', type:'weekly', title:'アーカルムパスポートの消化', note:'所持上限に注意', recommended:true },

    // monthly
    { id:'monthly_astral', type:'monthly', title:'神秘の天象儀交換', recommended:true },
    { id:'monthly_gold_fragment', type:'monthly', title:'金剛晶の欠片交換', note:'隔月', months:[2,4,6,8,10,12], recommended:true },
    { id:'monthly_login_point', type:'monthly', title:'ログインポイント交換', recommended:true },
    { id:'monthly_arcarum_point', type:'monthly', title:'アーカルムポイント交換', recommended:true },
    { id:'monthly_fp', type:'monthly', title:'FP（フォローポイント）交換', recommended:false },
    { id:'monthly_extermination', type:'monthly', title:'撃滅戦トレジャー交換', recommended:false, eventWhen:{ titles:['撃滅戦'] } },
    { id:'monthly_casino', type:'monthly', title:'カジノメダル交換', recommended:false },
    { id:'monthly_merit', type:'monthly', title:'武勲の輝き交換', recommended:false },
    { id:'monthly_honor', type:'monthly', title:'栄誉の輝き交換', recommended:false },
    { id:'monthly_treasure', type:'monthly', title:'トレジャー交換', recommended:false, eventWhen:{ categories:['event','collab','battle'] } },
    { id:'monthly_skyleap', type:'monthly', title:'SkyLeapポイント交換', recommended:false },
    { id:'monthly_skyscope', type:'monthly', title:'スカイスコープミッション', recommended:false },
    { id:'monthly_benefit', type:'monthly', title:'特典ポイントショップ', recommended:false },
    { id:'monthly_drops', type:'monthly', title:'軌跡の雫', recommended:false }
  ];

  const LABELS = { daily:'日課', weekly:'週課', monthly:'月課' };
  let applyingCloudData = false;
  let cloudRegistered = false;
  let scheduleEvents = [];
  let scheduleLoaded = false;
  let state = loadState();
  const accordionOpen = { daily:true, weekly:false, monthly:false };

  const root = document.getElementById('checklistApp');
  if(!root) return;

  function emptyState(){
    return {
      initialized:false,
      dismissed:false,
      selected:[],
      checked:{},
      periodKeys:currentPeriodKeys()
    };
  }

  function loadState(){
    try{
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return normalizeState(data);
    }catch(_){
      return emptyState();
    }
  }

  function normalizeState(data){
    const base = emptyState();
    if(!data || typeof data !== 'object') return base;
    return {
      initialized:Boolean(data.initialized),
      dismissed:Boolean(data.dismissed),
      selected:Array.isArray(data.selected) ? data.selected.filter(id => ITEMS.some(item => item.id === id)) : [],
      checked:data.checked && typeof data.checked === 'object' ? data.checked : {},
      periodKeys:data.periodKeys && typeof data.periodKeys === 'object' ? data.periodKeys : currentPeriodKeys()
    };
  }

  function gameDate(now = new Date()){
    const date = new Date(now);
    date.setHours(date.getHours() - 5);
    return date;
  }

  function currentPeriodKeys(){
    const date = gameDate();
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    const monday = new Date(date);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    const wy = monday.getFullYear();
    const wm = String(monday.getMonth()+1).padStart(2,'0');
    const wd = String(monday.getDate()).padStart(2,'0');
    return { daily:`${y}-${m}-${d}`, weekly:`${wy}-${wm}-${wd}`, monthly:`${y}-${m}` };
  }

  function refreshPeriods(){
    const next = currentPeriodKeys();
    for(const type of ['daily','weekly','monthly']){
      if(state.periodKeys[type] !== next[type]){
        for(const item of ITEMS.filter(item => item.type === type)) delete state.checked[item.id];
      }
    }
    state.periodKeys = next;
  }

  function activeEvents(now = new Date()){
    return scheduleEvents.filter(event => {
      if(event.milestone) return false;
      const start = new Date(event.start);
      const end = new Date(event.end);
      return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= now && now <= end;
    });
  }

  function matchesEventCondition(item){
    if(!item.eventWhen) return true;
    if(!scheduleLoaded) return false;
    const current = activeEvents();
    return current.some(event => {
      const categoryMatch = !item.eventWhen.categories || item.eventWhen.categories.includes(event.category);
      const titleMatch = !item.eventWhen.titles || item.eventWhen.titles.some(keyword => event.title?.includes(keyword));
      return categoryMatch && titleMatch;
    });
  }

  function isVisibleThisMonth(item){
    const monthMatch = !item.months || item.months.includes(gameDate().getMonth()+1);
    return monthMatch && matchesEventCondition(item);
  }

  async function loadScheduleEvents(){
    try{
      const response = await fetch('data/schedule.json', { cache:'no-store' });
      if(!response.ok) throw new Error(`schedule.json: ${response.status}`);
      const data = await response.json();
      scheduleEvents = Array.isArray(data.events) ? data.events : [];
    }catch(error){
      console.warn('やることリスト用のスケジュールを読み込めませんでした。', error);
      scheduleEvents = [];
    }finally{
      scheduleLoaded = true;
      render();
    }
  }

  function saveState(){
    refreshPeriods();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if(!applyingCloudData) window.GBFCloud?.queueSave(CLOUD_TOOL, state, 500);
  }

  function applyData(data){
    applyingCloudData = true;
    state = normalizeState(data);
    refreshPeriods();
    saveState();
    render();
    applyingCloudData = false;
  }

  function registerCloudSync(){
    if(cloudRegistered || !window.GBFCloud) return;
    cloudRegistered = true;
    window.GBFCloud.registerTool(CLOUD_TOOL, {
      getLocalData:() => state,
      applyData
    });
  }

  function selectedItems(type){
    return ITEMS.filter(item => item.type === type && state.selected.includes(item.id) && isVisibleThisMonth(item));
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function progress(type){
    const items = selectedItems(type);
    const done = items.filter(item => state.checked[item.id]).length;
    return { items, done, total:items.length };
  }

  function renderChecklist(){
    const blocks = ['daily','weekly','monthly'].map(type => {
      const {items, done, total} = progress(type);
      if(!total) return '';
      const complete = done === total;
      return `
        <section class="checklist_group ${complete ? 'is_complete' : ''} ${accordionOpen[type] ? 'is_open' : ''}" data-checklist-group="${type}">
          <div class="checklist_group_head">
            <button type="button" class="checklist_group_summary" data-accordion-type="${type}" aria-expanded="${accordionOpen[type] ? 'true' : 'false'}">
              <span class="checklist_group_title"><small>${type.toUpperCase()}</small><strong>${LABELS[type]}</strong></span>
              <span class="checklist_group_arrow" aria-hidden="true"></span>
            </button>
            <div class="checklist_group_actions">
              <strong>${complete ? '完了' : `${done}/${total}`}</strong>
              <button type="button" class="checklist_group_toggle" data-toggle-type="${type}">${complete ? 'すべて外す' : 'すべてチェック'}</button>
            </div>
          </div>
          <div class="checklist_items">
            ${items.map(item => `
              <label class="checklist_item ${state.checked[item.id] ? 'is_checked' : ''}">
                <input type="checkbox" data-check-id="${item.id}" ${state.checked[item.id] ? 'checked' : ''}>
                <span class="checklist_check" aria-hidden="true"></span>
                <span class="checklist_item_text"><strong>${escapeHtml(item.title)}</strong>${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''}</span>
              </label>
            `).join('')}
          </div>
        </section>`;
    }).join('');

    root.innerHTML = `
      <div class="checklist_header">
        <div><span>TO DO</span><h2>やることリスト</h2></div>
        <button type="button" class="checklist_text_btn" data-action="settings">項目を設定</button>
      </div>
      <div class="checklist_grid">${blocks || '<p class="checklist_empty">表示する項目がありません。</p>'}</div>
      <div class="checklist_usage_notes">
        <p>※日課・週課・月課の確認用リストです。（チェックは任意）</p>
        <p>※チェック状態はゲーム内のリセットタイミングに合わせて自動的に解除されます。</p>
        <p>※「まとめてPro」は9月末頃の実装予定に合わせ、実装時期以降はおすすめ項目にも追加されます。</p>
      </div>
      <p class="checklist_reset_note">日課は毎日5:00、週課は月曜5:00、月課は毎月1日5:00を基準にリセットします。</p>
    `;
  }

  function renderInitial(){
    if(state.dismissed){
      root.innerHTML = `
        <div class="checklist_header"><div><span>TO DO</span><h2>やることリスト</h2></div></div>
        <div class="checklist_compact_start">
          <p>日課・週課・月課の確認に使えます。</p>
          <button type="button" class="checklist_primary_btn" data-action="show-initial">やることリストを作成</button>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="checklist_header"><div><span>TO DO</span><h2>やることリスト</h2></div></div>
      <div class="checklist_onboarding">
        <div>
          <h3>やることリストを作成します。</h3>
          <p>おすすめ設定を適用しますか？　あとから項目を変更できます。</p>
          <div class="checklist_usage_notes _onboarding">
            <p>※日課・週課・月課の確認用リストです。（チェックは任意）</p>
            <p>※チェック状態はゲーム内のリセットタイミングに合わせて自動的に解除されます。</p>
        <p>※「まとめてPro」は9月末頃の実装予定に合わせ、実装時期以降はおすすめ項目にも追加されます。</p>
          </div>
        </div>
        <div class="checklist_onboarding_actions">
          <button type="button" class="checklist_primary_btn" data-action="recommended">おすすめで始める</button>
          <button type="button" class="checklist_secondary_btn" data-action="custom">自分で設定する</button>
          <button type="button" class="checklist_skip_btn" data-action="dismiss">今回は設定しない</button>
        </div>
      </div>`;
  }

  function customItem(item){
    const details = [];
    if(item.priority) details.push(item.priority);
    else if(item.note) details.push(item.note);
    if(item.eventWhen) details.push('対象イベント開催中のみ表示');
    const detail = details.length ? `<small>${escapeHtml(details.join('・'))}</small>` : '';
    return `<label class="checklist_setting_item"><input type="checkbox" data-select-id="${item.id}" ${state.selected.includes(item.id) ? 'checked' : ''}><span><strong>${escapeHtml(item.title)}</strong>${detail}</span></label>`;
  }

  function sameIds(a, b){
    if(a.length !== b.length) return false;
    const bSet = new Set(b);
    return a.every(id => bSet.has(id));
  }

  function selectionMode(ids = state.selected){
    for(const name of ['recommended','hihi-basic','hihi-full','skip']){
      if(sameIds(ids, presetIds(name))) return { key:name, label:presetLabel(name) };
    }
    return { key:'custom', label:'カスタム' };
  }

  function selectionIdsFromSettings(){
    return [...root.querySelectorAll('[data-select-id]:checked')].map(input => input.dataset.selectId);
  }

  function updateSettingsMode(){
    const badge = root.querySelector('[data-selection-mode]');
    if(!badge) return;
    const mode = selectionMode(selectionIdsFromSettings());
    badge.textContent = mode.label;
    badge.dataset.mode = mode.key;
  }

  function renderSettings(){
    const currentMode = selectionMode();
    root.innerHTML = `
      <div class="checklist_header checklist_settings_header">
        <div class="checklist_settings_title">
          <span>SETTINGS</span>
          <div class="checklist_settings_title_row">
            <h2>やることリスト設定</h2>
            <span class="checklist_mode_badge" data-selection-mode data-mode="${currentMode.key}">${currentMode.label}</span>
          </div>
          <p class="checklist_autosave_note">チェックした内容は自動で保存されます。</p>
        </div>
        <div class="checklist_settings_actions">
          <button type="button" class="checklist_secondary_btn" data-action="cancel-settings">戻る</button>
        </div>
      </div>
      <div class="checklist_preset_area">
        <div class="checklist_preset_intro"><span class="checklist_preset_kicker">QUICK SETUP</span><h3>プリセット</h3><p>現在の選択に項目を追加します。個別に調整すると「カスタム」表示になります。</p></div>
        <div class="checklist_preset_buttons">
          <button type="button" data-preset="recommended">おすすめを追加</button>
          <button type="button" data-preset="hihi-basic">ヒヒ掘り・基本</button>
          <button type="button" data-preset="hihi-full">ヒヒ掘り・すべて</button>
          <button type="button" data-preset="skip">スキップ系</button>
          <button type="button" class="is_reset" data-action="reset-recommended">おすすめに戻す</button>
        </div>
      </div>
      <div class="checklist_preset_notice" role="status" aria-live="polite"></div>
      <div class="checklist_settings_grid">
        ${['daily','weekly','monthly'].map(type => {
          const visibleItems = ITEMS.filter(item => item.type === type && (!item.months || item.months.includes(gameDate().getMonth()+1)));
          const selectedCount = visibleItems.filter(item => state.selected.includes(item.id)).length;
          return `
          <section class="checklist_setting_group">
            <div class="checklist_setting_head">
              <div><span>${type.toUpperCase()}</span><h3>${LABELS[type]}</h3></div>
              <button type="button" class="checklist_setting_toggle" data-select-toggle="${type}">${selectedCount === visibleItems.length ? 'すべて外す' : 'すべてチェック'}</button>
            </div>
            ${type === 'daily' ? `
              <div class="checklist_setting_subgroup"><h4>基本</h4>${ITEMS.filter(item => item.type === type && item.group !== 'ヒヒ掘り').map(customItem).join('')}</div>
              <div class="checklist_setting_subgroup"><h4>ヒヒ掘り</h4>${ITEMS.filter(item => item.type === type && item.group === 'ヒヒ掘り').map(customItem).join('')}</div>
            ` : ITEMS.filter(item => item.type === type).map(customItem).join('')}
          </section>`;
        }).join('')}
      </div>`;
  }

  function isRecommended(item){
    if(item.recommended) return true;
    if(!item.recommendedFrom) return false;
    const from = new Date(item.recommendedFrom);
    return !Number.isNaN(from.getTime()) && new Date() >= from;
  }

  function presetIds(name){
    if(name === 'recommended') return ITEMS.filter(isRecommended).map(item => item.id);
    if(name === 'hihi-basic') return ['daily_tsuyobaha','daily_ubaha'];
    if(name === 'hihi-full') return ['daily_tsuyobaha','daily_ubaha','daily_akasha','daily_grande','daily_huanglong','daily_qilin'];
    if(name === 'skip') return ['daily_magna_pro','daily_angel_halo_pro','daily_matome_pro'];
    return [];
  }

  function presetLabel(name){
    return {
      recommended:'おすすめ',
      'hihi-basic':'ヒヒ掘り・基本',
      'hihi-full':'ヒヒ掘り・すべて',
      skip:'スキップ系'
    }[name] || 'プリセット';
  }

  function showPresetNotice(message){
    const notice = root.querySelector('.checklist_preset_notice');
    if(!notice) return;
    notice.textContent = message;
    notice.classList.add('is_visible');
    window.clearTimeout(showPresetNotice.timer);
    showPresetNotice.timer = window.setTimeout(() => {
      notice.classList.remove('is_visible');
    }, 2200);
  }

  function applyPreset(name){
    const ids = presetIds(name);
    const current = selectionIdsFromSettings();
    if(current.length || root.querySelector('[data-select-id]')) state.selected = current;
    const before = new Set(state.selected);
    state.selected = [...new Set([...state.selected, ...ids])];
    const added = state.selected.filter(id => !before.has(id)).length;
    state.initialized = true;
    state.dismissed = false;
    saveState();
    renderSettings();
    showPresetNotice(added ? `「${presetLabel(name)}」を追加しました。` : `「${presetLabel(name)}」は追加済みです。`);
  }

  function resetToRecommended(){
    state.selected = presetIds('recommended');
    for(const id of Object.keys(state.checked)){
      if(!state.selected.includes(id)) delete state.checked[id];
    }
    state.initialized = true;
    state.dismissed = false;
    saveState();
    renderSettings();
    showPresetNotice('おすすめ設定に戻しました。');
  }

  function saveSettingsSelection(){
    state.selected = selectionIdsFromSettings();
    state.initialized = true;
    state.dismissed = false;
    for(const id of Object.keys(state.checked)){
      if(!state.selected.includes(id)) delete state.checked[id];
    }
    saveState();
    updateSettingsMode();
  }

  function recommendedStart(){
    state.selected = ITEMS.filter(isRecommended).map(item => item.id);
    state.initialized = true;
    state.dismissed = false;
    state.checked = {};
    saveState();
    renderChecklist();
  }

  function render(){
    refreshPeriods();
    if(state.initialized) renderChecklist(); else renderInitial();
  }

  root.addEventListener('change', event => {
    const id = event.target.dataset.checkId;
    if(id){
      state.checked[id] = event.target.checked;
      saveState();
      renderChecklist();
      return;
    }
    if(event.target.dataset.selectId){
      saveSettingsSelection();
    }
  });

  root.addEventListener('click', event => {
    const accordionType = event.target.closest('[data-accordion-type]')?.dataset.accordionType;
    if(accordionType){
      accordionOpen[accordionType] = !accordionOpen[accordionType];
      renderChecklist();
      return;
    }

    const toggleType = event.target.closest('[data-toggle-type]')?.dataset.toggleType;
    if(toggleType){
      const {items, done, total} = progress(toggleType);
      const shouldCheck = total > 0 && done !== total;
      items.forEach(item => {
        state.checked[item.id] = shouldCheck;
      });
      saveState();
      renderChecklist();
      return;
    }

    const action = event.target.closest('[data-action]')?.dataset.action;
    const preset = event.target.closest('[data-preset]')?.dataset.preset;
    const selectToggle = event.target.closest('[data-select-toggle]')?.dataset.selectToggle;
    if(selectToggle){
      state.selected = selectionIdsFromSettings();
      const all=ITEMS.filter(item=>item.type===selectToggle&&(!item.months||item.months.includes(gameDate().getMonth()+1))).map(i=>i.id);
      const selected=all.filter(id=>state.selected.includes(id));
      if(selected.length===all.length){state.selected=state.selected.filter(id=>!all.includes(id));}
      else{state.selected=[...new Set([...state.selected,...all])];}
      state.initialized = true;
      state.dismissed = false;
      saveState();
      renderSettings();
      return;
    }

    if(preset){ applyPreset(preset); return; }
    if(!action) return;
    if(action === 'recommended') recommendedStart();
    if(action === 'custom' || action === 'settings') renderSettings();
    if(action === 'dismiss'){ state.dismissed = true; saveState(); renderInitial(); }
    if(action === 'show-initial'){ state.dismissed = false; saveState(); renderInitial(); }
    if(action === 'cancel-settings'){ if(state.initialized) renderChecklist(); else renderInitial(); }
    if(action === 'clear-selection'){ state.selected = []; state.initialized = true; state.dismissed = false; state.checked = {}; saveState(); renderSettings(); }
    if(action === 'reset-recommended') resetToRecommended();
  });

  document.addEventListener('gbf-cloud-api-ready', registerCloudSync);
  render();
  registerCloudSync();
  loadScheduleEvents();
})();
