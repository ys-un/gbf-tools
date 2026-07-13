// index.htmlを非表示URLへ統一
if(location.pathname.endsWith("/index.html")){

    location.replace(
        location.pathname.replace(
            "/index.html",
            "/"
        )
        + location.search
        + location.hash
    );

}

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

// 現在表示中のページをサイドバーで強調
function setActiveNavigation(){

  const currentPath = location.pathname.replace(/\/index\.html$/, "/");

  document.querySelectorAll(".sidebar > a").forEach(link=>{

    const linkPath = new URL(link.href, location.href)
      .pathname
      .replace(/\/index\.html$/, "/");

    const isTopPage =
      linkPath.endsWith("/gbf-tools/") &&
      currentPath.endsWith("/gbf-tools/");

    const isCurrentPage =
      isTopPage ||
      (!linkPath.endsWith("/gbf-tools/") && currentPath === linkPath);

    link.classList.toggle("is_active", isCurrentPage);

    if(isCurrentPage){
      link.setAttribute("aria-current", "page");
    }else{
      link.removeAttribute("aria-current");
    }

  });

}


// SPメニュー内のリンクを押したらメニューを閉じる
function setupMobileMenuLinks(){

  document.querySelectorAll(".sidebar > a").forEach(link=>{

    link.addEventListener("click",()=>{
      document.getElementById("sidebar")?.classList.remove("active");
    });

  });

}


document.addEventListener("DOMContentLoaded",()=>{
  setActiveNavigation();
  setupMobileMenuLinks();
});
