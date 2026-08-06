// 共通スクリプト自身のURLからサイトのルートを取得
const commonScriptUrl = document.currentScript?.src || location.href;
const siteRootUrl = new URL("../../", commonScriptUrl);

// index.htmlを非表示URLへ統一
if(location.pathname.endsWith("/index.html")){
  location.replace(
    location.pathname.replace("/index.html", "/")
    + location.search
    + location.hash
  );
}

// 共通ヘッダー・サイドバーを生成
function injectCommonNavigation(){
  if(document.querySelector(".mobile_header") || document.getElementById("sidebar")){
    return;
  }

  const navigationItems = [
    ["", "ダッシュボード"],
    ["schedule/", "スケジュール"],
    ["stone/", "天井計算機"],
    ["event/", "イベント戦貨計算機"],
    ["meat/", "肉消費計算機"],
    ["speed/", "時速換算"],
    ["efficiency/", "HELL効率比較"]
  ];

  const navigationLinks = navigationItems
    .map(([path,label]) => `<a href="${new URL(path,siteRootUrl).href}">${label}</a>`)
    .join("");

  document.body.insertAdjacentHTML("afterbegin", `
    <div class="mobile_header">
      <button type="button" class="menu_btn" aria-controls="sidebar" aria-expanded="false">☰ MENU</button>
    </div>
    <button type="button" class="menu_overlay" aria-label="メニューを閉じる" tabindex="-1"></button>
    <nav class="sidebar" id="sidebar" aria-label="メインメニュー">
      <h2>GBF Tools</h2>
      ${navigationLinks}
    </nav>
  `);

  document.querySelector(".menu_btn")?.addEventListener("click",toggleMenu);
}

// メニュー開閉
function setMenuOpen(isOpen){
  const sidebar=document.getElementById("sidebar");
  const button=document.querySelector(".menu_btn");
  const overlay=document.querySelector(".menu_overlay");
  if(!sidebar) return;

  sidebar.classList.toggle("active",isOpen);
  overlay?.classList.toggle("active",isOpen);
  document.body.classList.toggle("menu_open",isOpen);
  button?.setAttribute("aria-expanded",String(isOpen));
}

function toggleMenu(){
  const sidebar=document.getElementById("sidebar");
  if(!sidebar) return;
  setMenuOpen(!sidebar.classList.contains("active"));
}

function setupMobileMenuClose(){
  document.querySelector(".menu_overlay")?.addEventListener("click",()=>setMenuOpen(false));

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
      setMenuOpen(false);
      document.querySelector(".menu_btn")?.focus();
    }
  });

  window.addEventListener("resize",()=>{
    if(window.innerWidth>768){
      setMenuOpen(false);
    }
  });
}

// 数字整形
function formatNumber(num){
  return Number(num).toLocaleString();
}

// 時間変換
function formatHour(seconds){
  const h=Math.floor(seconds/3600);
  const m=Math.floor((seconds%3600)/60);
  return `${h}時間 ${m}分`;
}

// リセット確認
function resetConfirm(){
  return confirm("入力内容をリセットしますか？");
}

// 現在表示中のページをサイドバーで強調
function setActiveNavigation(){
  const currentPath=location.pathname.replace(/\/index\.html$/, "/");
  const rootPath=siteRootUrl.pathname.replace(/\/index\.html$/, "/");

  document.querySelectorAll(".sidebar > a").forEach(link=>{
    const linkPath=new URL(link.href,location.href).pathname.replace(/\/index\.html$/, "/");
    const isCurrentPage=linkPath===currentPath || (linkPath===rootPath && currentPath===rootPath);

    link.classList.toggle("is_active",isCurrentPage);
    if(isCurrentPage){
      link.setAttribute("aria-current","page");
    }else{
      link.removeAttribute("aria-current");
    }
  });
}

// SPメニュー内のリンクを押したらメニューを閉じる
function setupMobileMenuLinks(){
  document.querySelectorAll(".sidebar > a").forEach(link=>{
    link.addEventListener("click",()=>{
      setMenuOpen(false);
    });
  });
}

// 共通フッターを生成
function injectFooter(){
  if(document.querySelector(".footer_common")) return;

  const footer=document.createElement("footer");
  footer.className="footer_common";
  footer.innerHTML=`<div class="footer_inner">
    <p class="footer_copy">© ${new Date().getFullYear()} GBF Tools</p>
    <p class="footer_note">本サイト「GBF Tools」は『グランブルーファンタジー』の非公式ファンツールです。<br>Cygames, Inc. とは一切関係ありません。</p>
  </div>`;
  document.body.appendChild(footer);
}

document.addEventListener("DOMContentLoaded",()=>{
  injectCommonNavigation();
  setActiveNavigation();
  setupMobileMenuLinks();
  setupMobileMenuClose();
  injectFooter();
});
