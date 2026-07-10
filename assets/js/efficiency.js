const hellData = {

  90:{ contribution:310000 },
  95:{ contribution:910000 },
  100:{ contribution:2680000 },
  150:{ contribution:4100000 },
  200:{ contribution:20000000 },
  250:{ contribution:75000000 }

};

const levels = [
  90,
  95,
  100,
  150,
  200,
  250
];

function formatTime(sec){

  const m =
    Math.floor(sec / 60);

  const s =
    Math.round(sec % 60);

  return `${m}分${s}秒`;

}


window.addEventListener("load",()=>{

  levels.forEach(level=>{

    document.getElementById(
      `hell${level}m`
    ).value =
      localStorage.getItem(
        `hell${level}m`
      ) || "";

    document.getElementById(
      `hell${level}s`
    ).value =
      localStorage.getItem(
        `hell${level}s`
      ) || "";

  });

  const hasData =
    levels.some(level=>{

      return (
        localStorage.getItem(
          `hell${level}m`
        ) ||
        localStorage.getItem(
          `hell${level}s`
        )
      );

    });

  if(hasData){

    calcEfficiency();

  }

});


function calcEfficiency(){

  let html = "";

  let bestHell = null;
  let bestSpeed = 0;

  const hourlyMap = {};

  levels.forEach(level=>{

    const minute =
      document.getElementById(
        `hell${level}m`
      ).value;

    const second =
      document.getElementById(
        `hell${level}s`
      ).value;

    if(
      minute === "" &&
      second === ""
    ){

      localStorage.removeItem(
        `hell${level}m`
      );

      localStorage.removeItem(
        `hell${level}s`
      );

      return;

    }

    localStorage.setItem(
      `hell${level}m`,
      minute
    );

    localStorage.setItem(
      `hell${level}s`,
      second
    );

    const sec =
      Number(minute || 0) * 60 +
      Number(second || 0);

    hourlyMap[level] =
      hellData[level].contribution
      / sec
      * 3600;

  });


  levels.forEach((level,index)=>{

    if(
      !hourlyMap[level]
    ){
      return;
    }

    const hourly =
      hourlyMap[level];

    const oku =
      (
        hourly / 100000000
      ).toFixed(2);

    let statusText =
      "◎ 基準HELL";

    let statusColor =
      "#4ade80";

    if(index > 0){

      const prevLevel =
        levels[index - 1];

      const prevHourly =
        hourlyMap[prevLevel];

      if(prevHourly){

        const targetSec =
          hellData[level].contribution
          / prevHourly
          * 3600;

        if(hourly >= prevHourly){

          statusText =
            `◎ ${prevLevel}HELL以上の効率 (${formatTime(targetSec)}以内目安)`;

        }else{

          statusText =
            `▲ ${prevLevel}HELL以下の効率 (${formatTime(targetSec)}以内推奨)`;

          statusColor =
            "#ef4444";

        }

      }

    }

    if(hourly > bestSpeed){

      bestSpeed = hourly;
      bestHell = level;

    }

    html += `
      <div class="result_item">

        <div>
          <strong>${level}HELL</strong>
        </div>

        <div>
          時速 ${oku}億/h
        </div>

        <div
          style="
            color:${statusColor};
            font-weight:bold;
          "
        >
          ${statusText}
        </div>

      </div>
    `;

  });

  if(bestHell){

    html += `
      <div
        style="
          margin-top:30px;
          padding:20px;
          border-radius:12px;
          background:#0f172a;
        "
      >

        👑おすすめ周回

        <br><br>

        ${bestHell}HELL

        <br>

        時速
        ${(bestSpeed / 100000000).toFixed(2)}
        億/h

      </div>
    `;

  }

  document.getElementById(
    "result"
  ).innerHTML = html;

}


function resetEfficiency(){

  if(
    !confirm(
      "入力内容をリセットしますか？"
    )
  ){
    return;
  }

  levels.forEach(level=>{

    localStorage.removeItem(
      `hell${level}m`
    );

    localStorage.removeItem(
      `hell${level}s`
    );

    document.getElementById(
      `hell${level}m`
    ).value = "";

    document.getElementById(
      `hell${level}s`
    ).value = "";

  });

  document.getElementById(
    "result"
  ).innerHTML = "";

}