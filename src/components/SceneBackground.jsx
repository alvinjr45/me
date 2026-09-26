import React, { useId } from 'react';
import './SceneBackground.css';

export function SceneLandscape({ background = 'alpine' }) {
  const id = useId();
  const skyId = `${id}-sky`;
  const lakeId = `${id}-lake`;
  const sunlightId = `${id}-sunlight`;
  const pineId = `${id}-pine`;
  const windowsId = `${id}-windows`;
  const auroraId = `${id}-aurora`;

  return (
        <svg className="scene-background__landscape" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false">
          <defs>
            <linearGradient id={skyId} x2="0" y2="1">
              <stop stopColor="var(--scene-sky-top)" />
              <stop offset="0.48" stopColor="var(--scene-sky-middle)" />
              <stop offset="1" stopColor="var(--scene-sky-bottom)" />
            </linearGradient>
            <linearGradient id={lakeId} x2="0" y2="1">
              <stop stopColor="#789caa" />
              <stop offset="1" stopColor="#1b4555" />
            </linearGradient>
            <radialGradient id={sunlightId}>
              <stop stopColor="#ffd9a4" stopOpacity="0.6" />
              <stop offset="1" stopColor="#ffd9a4" stopOpacity="0" />
            </radialGradient>
            <g id={pineId}>
              <path d="M-3 0H3V-110H-3Z" fill="#162d31" />
              <path d="M0-150 25-96H14L35-65H22L47-24H-47L-22-65H-35L-14-96H-25Z" fill="#193a3e" />
            </g>
            <pattern id={windowsId} width="38" height="48" patternUnits="userSpaceOnUse">
              <path d="M9 12h8v14H9z" fill="#eab578" opacity="0.75" />
              <path d="M25 12h5v14h-5z" fill="#82b7c5" opacity="0.4" />
            </pattern>
            <linearGradient id={auroraId} x2="0.2" y2="1">
              <stop stopColor="#50efb6" stopOpacity="0" />
              <stop offset="0.6" stopColor="#53e2bb" stopOpacity="0.65" />
              <stop offset="1" stopColor="#7e7edf" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path fill={`url(#${skyId})`} d="M0 0h1600v900H0z" />
          {background === 'alpine' && <>
          <ellipse cx="1390" cy="160" rx="330" ry="270" fill={`url(#${sunlightId})`} />
          <circle cx="1390" cy="160" r="36" fill="#ffdaad" />
          <g fill="none" stroke="#d8d8ca" strokeLinecap="round" opacity="0.23">
            <path d="M60 83h240m44 0h86M870 123h220m40 0h77" strokeWidth="5" />
            <path d="M35 108h128M1110 55h320" strokeWidth="3" />
          </g>
          <path d="m0 320 150-210 135 164L440 155l183 215 174-146 184 128 166-154 175 135 143-96v440H0Z" fill="#607d8d" />
          <path d="m85 201 65-91 74 90-49-20-25-30-27 47Z" fill="#c9d3d1" />
          <path d="m393 192 47-37 73 86-57-25-19-32-21 22Z" fill="#bacbd0" />
          <path d="m0 439 181-160 224 211 152-163 199 199 199-162 187 126 233-202 225 166v446H0Z" fill="#365b6d" />
          <path d="M0 557q228-45 405 8t396-6 400 7 399-9v343H0Z" fill={`url(#${lakeId})`} />
          <g fill="none" stroke="#bad0ce" opacity="0.24">
            <path d="M960 607h480M1070 624h330M820 659h590M1050 700h360M960 749h490M1160 808h310" strokeWidth="3" />
            <path d="M120 590h290M245 630h190M510 709h220M190 777h170" strokeWidth="2" />
          </g>
          <path d="M0 510q125-18 226 61t240 54q-54 43-185 64T0 753Z" fill="#254a4f" />
          <path d="M1600 570q-94 60-165 111t-226 105l-125 114h516Z" fill="#203f43" />
          <g>
            <use href={`#${pineId}`} transform="translate(35 621) scale(1.6)" />
            <use href={`#${pineId}`} transform="translate(112 625) scale(1.15)" />
            <use href={`#${pineId}`} transform="translate(183 655) scale(1.35)" />
            <use href={`#${pineId}`} transform="translate(278 654) scale(0.8)" />
            <use href={`#${pineId}`} transform="translate(1535 730) scale(1.8)" />
            <use href={`#${pineId}`} transform="translate(1445 764) scale(1.35)" />
            <use href={`#${pineId}`} transform="translate(1342 830) scale(1.1)" />
          </g>
          </>}

          {background === 'coast' && <>
            <circle cx="1350" cy="170" r="54" fill="#ffdfad" />
            <path d="M0 395q360-25 780 0t820-4v509H0Z" fill="#367c91" />
            <path d="M0 570q310-60 700 8t900-10v332H0Z" fill="#246071" />
            <g fill="none" stroke="#c3e0d8" strokeWidth="5" opacity="0.6">
              <path d="M0 450q210-24 420 0m560 10q300-27 620-8M180 600q260-38 490 0m400 80q270-35 530-15M20 790q360-38 680 0" />
            </g>
            <path d="M0 460 140 415 270 468 390 585 310 640 0 710Z" fill="#324f49" />
            <path d="m0 555 270-87 120 117-80 55L0 710Z" fill="#6f7361" />
            <path d="m125 425 19-208h46l20 208Z" fill="#e2d7b9" />
            <path d="m138 290-4 46h68l-5-46Z" fill="#ac6150" />
            <path d="M137 190h62v29h-62z" fill="#233d4d" />
            <path d="m128 190 40-33 40 33Z" fill="#b36951" />
            <path d="M151 197h34v14h-34z" fill="#fbd795" />
            <path d="M1520 220q-20-20-40 0-20-20-40 0M1180 100q-16-16-32 0-16-16-32 0" fill="none" stroke="#425e67" strokeWidth="5" />
          </>}

          {background === 'desert' && <>
            <circle cx="1310" cy="215" r="85" fill="#ffc077" />
            <path d="M0 490 130 450 180 230h175l53 240 210 37 114-126h226l77 100 260-90 65-230h140l80 739H0Z" fill="#97504c" />
            <path d="m0 530 230-60 220 130 318-28 270 67 270-170 292 80v351H0Z" fill="#bd7450" />
            <path d="M0 720q370-200 800-15t800-32v227H0Z" fill="#754b3e" />
            <g fill="none" stroke="#333f36" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
              <path d="M109 770V510m0 110H62v-70m47 115h49V570M1475 800V610m0 110h48v-70" />
            </g>
            <path d="M250 271h98m-116 25h120M1418 218h80" stroke="#e7a26c" strokeWidth="5" opacity="0.5" />
          </>}

          {background === 'forest' && <>
            <circle cx="1250" cy="150" r="45" fill="#d9dec0" opacity="0.65" />
            <path d="M0 470Q350 210 760 440t840-140v600H0Z" fill="#557a76" />
            <g opacity="0.4">
              {[80, 250, 440, 660, 890, 1110, 1370, 1560].map((x, index) => <use key={x} href={`#${pineId}`} transform={`translate(${x} ${560 + index % 3 * 30}) scale(2.8)`} />)}
            </g>
            <path d="M0 590q460-80 800 0t800-20v330H0Z" fill="#9bb5aa" opacity="0.45" />
            <path d="M0 780q420-120 780-20t820-80v220H0Z" fill="#294c43" />
            {[0, 170, 360, 1270, 1480, 1620].map((x, index) => <use key={x} href={`#${pineId}`} transform={`translate(${x} 880) scale(${index % 2 ? 4.5 : 5.6})`} />)}
            <path d="M590 900q30-130 190-140t150-80q80 70-80 125t-90 95Z" fill="#91a99b" opacity="0.45" />
          </>}

          {background === 'city' && <>
            <circle cx="1390" cy="125" r="38" fill="#ded9bc" />
            <path d="M0 490h100V315h130v115h130V250h170v220h100V350h150v-80h150v210h140V320h180v160h350v420H0Z" fill="#343d5e" />
            {[[0, 225, 155], [190, 370, 160], [390, 150, 180], [610, 310, 150], [790, 410, 160], [990, 230, 175], [1200, 330, 130], [1380, 205, 220]].map(([x, y, width]) => (
              <g key={x}>
                <path d={`M${x} 900V${y}h${width}V900Z`} fill="#142433" />
                <path d={`M${x + 9} 900V${y + 14}h${width - 18}V900Z`} fill={`url(#${windowsId})`} />
                <path d={`M${x} ${y}h${width}`} stroke="#687081" strokeWidth="4" />
              </g>
            ))}
            <path d="M480 150V70m-26 80v-28h52v28M1450 205v-45" fill="none" stroke="#677a90" strokeWidth="6" />
            <path d="M1010 275h135M25 264h100" stroke="#dc9379" strokeWidth="6" />
          </>}

          {background === 'winter' && <>
            <circle cx="1370" cy="135" r="47" fill="#e1eaf0" />
            <path d="m0 520 240-365 270 340 250-275 280 330 310-415 250 320v445H0Z" fill="#7896ac" />
            <path d="m128 325 112-170 155 195-97-40-58-81-50 75Zm1060 26 162-216 139 178-93-49-48-59-83 140Z" fill="#d4e3e8" />
            <path d="M0 650q410-145 800 0t800-15v265H0Z" fill="#b6ced9" />
            <path d="M390 900q65-140 430-160t430-80q-15 100-310 140T740 900Z" fill="#608fa8" />
            {[40, 195, 1430, 1560].map((x) => <g key={x} transform={`translate(${x} 790) scale(2.4)`}>
              <use href={`#${pineId}`} />
              <path d="m0-150 16 36-16-9-16 9Zm0 42 27 35-27-12-27 12Zm0 44 35 34-35-9-35 9Z" fill="#dce7e7" />
            </g>)}
          </>}

          {background === 'aurora' && <>
            {[[75, 76], [235, 180], [450, 60], [690, 130], [925, 45], [1110, 220], [1300, 72], [1490, 180], [1560, 50], [810, 290]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="3" fill="#d4eeee" />)}
            <path d="M-100 40Q210 370 650 130T1700 90L1700 390Q1220 200 750 390T-100 190Z" fill={`url(#${auroraId})`} />
            <path d="M-100 230Q400 20 810 280T1700 140L1700 380Q1310 550 790 370T-100 370Z" fill={`url(#${auroraId})`} opacity="0.65" />
            <path d="m0 640 180-220 230 230 260-170 270 200 320-310 340 250v280H0Z" fill="#233c51" />
            <path d="M0 730q450-40 800 0t800 0v170H0Z" fill="#244950" />
            <path d="M320 790q360-50 820 10M470 840q300-30 530 5" stroke="#69b9a1" strokeWidth="6" fill="none" opacity="0.35" />
            {[0, 130, 1470, 1600].map((x) => <use key={x} href={`#${pineId}`} transform={`translate(${x} 930) scale(3.5)`} />)}
          </>}

          {background === 'garden' && <>
            <circle cx="1260" cy="190" r="53" fill="#ffe5bc" />
            <path d="M0 520Q270 260 630 490t970-100v511H0Z" fill="#7b9c87" />
            <path d="M0 680q350-160 800-30t800-60v310H0Z" fill="#416e61" />
            <ellipse cx="840" cy="820" rx="550" ry="170" fill="#7baba4" />
            <path d="M490 770q320-270 630 0" fill="none" stroke="#643f39" strokeWidth="30" />
            <path d="M490 714q320-270 630 0m-565-50v65m90-124v65m100-96v65m100-65v65m100-35v65m100-1v65" fill="none" stroke="#986b56" strokeWidth="12" />
            <path d="M85 800Q155 440 95 40M120 355 350 170M1500 850q-115-480 50-850m-105 350-230-140" fill="none" stroke="#53433e" strokeWidth="30" />
            {[[50, 80, 155], [245, 90, 140], [365, 180, 108], [120, 245, 140], [1540, 80, 190], [1330, 155, 155], [1210, 240, 95], [1480, 290, 130]].map(([cx, cy, r], index) => <circle key={cx} cx={cx} cy={cy} r={r} fill={index % 2 ? '#cb9da7' : '#e3b9ba'} />)}
            <path d="m250 390 9 7-8 14-9-8Zm1090 40 10 4-5 16-12-6ZM90 480l10 5-6 14-9-4Z" fill="#f0c8ca" />
          </>}
        </svg>
  );
}

export function MobileSceneLandscape({ background = 'alpine' }) {
  const id = useId();
  const skyId = `${id}-mobile-sky`;
  const waterId = `${id}-mobile-water`;
  const auroraId = `${id}-mobile-aurora`;

  return (
    <svg className="scene-background__landscape scene-background__landscape--mobile" viewBox="0 0 430 760" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id={skyId} x2="0" y2="1">
          <stop stopColor="var(--scene-sky-top)" />
          <stop offset="0.5" stopColor="var(--scene-sky-middle)" />
          <stop offset="1" stopColor="var(--scene-sky-bottom)" />
        </linearGradient>
        <linearGradient id={waterId} x2="0" y2="1">
          <stop stopColor="#7fa8b2" />
          <stop offset="1" stopColor="#173e4d" />
        </linearGradient>
        <linearGradient id={auroraId} x2="0.3" y2="1">
          <stop stopColor="#6ff1c3" stopOpacity="0" />
          <stop offset="0.55" stopColor="#65e2c0" stopOpacity="0.75" />
          <stop offset="1" stopColor="#8587e8" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path fill={`url(#${skyId})`} d="M0 0h430v760H0z" />

      {background === 'alpine' && <>
        <circle cx="345" cy="92" r="28" fill="#ffdfb6" />
        <path d="m0 350 82-185 64 102 78-169 92 168 54-98 60 174v418H0Z" fill="#728f9d" />
        <path d="m50 236 32-71 30 48-22-8-10-20-12 37Zm132-47 42-91 46 84-34-20-14-34-20 43Z" fill="#d6dfdd" />
        <path d="m0 395 98-118 92 133 73-104 110 99 57-61v416H0Z" fill="#355c6b" />
        <path d="M0 455q110-22 217 4t213-2v303H0Z" fill={`url(#${waterId})`} />
        <path d="M38 525h132m-84 52h225m-158 63h210" stroke="#c8dedb" strokeWidth="3" opacity="0.35" />
        <path d="M15 570v-92m0 10-38 68h76Zm398 40V493m0 12-42 76h84Z" fill="#173b3e" stroke="#173b3e" strokeWidth="7" />
      </>}

      {background === 'coast' && <>
        <circle cx="336" cy="100" r="34" fill="#ffe0ae" />
        <path d="M0 292q103-19 218 3t212-1v466H0Z" fill="#3b8297" />
        <path d="M0 430q102-35 218 3t212-1v328H0Z" fill="#246072" />
        <path d="M0 358q76-42 154 5l54 78-86 83L0 570Z" fill="#68736a" />
        <path d="m57 355 12-168h39l13 168Z" fill="#e7dcc1" />
        <path d="M68 230h42v34H68z" fill="#a96050" />
        <path d="m62 188 27-25 27 25Z" fill="#a96050" />
        <path d="M73 192h32v20H73z" fill="#ffe2a2" />
        <path d="M217 378q91-19 213 0M167 468q118-25 263-4M42 638q153-32 331-5" fill="none" stroke="#d7ebe4" strokeWidth="4" opacity="0.6" />
        <path d="M327 164q-13-14-27 0-13-14-27 0M202 95q-10-11-21 0-10-11-21 0" fill="none" stroke="#3f606b" strokeWidth="4" />
      </>}

      {background === 'desert' && <>
        <circle cx="330" cy="122" r="48" fill="#ffc17d" />
        <path d="M0 397 36 361 65 197h91l28 160 75 24 43-93h80l48 76v396H0Z" fill="#99534d" />
        <path d="m0 445 96-64 88 90 104-17 67 61 75-47v292H0Z" fill="#c17853" />
        <path d="M0 581q105-92 223-24t207-19v222H0Z" fill="#74483c" />
        <path d="M50 633V477m0 68H22v-43m28 78h29v-54m300 122V531m0 54h29v-42" fill="none" stroke="#30423a" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M78 221h73m-80 22h87m190 5h66" stroke="#e9aa77" strokeWidth="4" opacity="0.55" />
      </>}

      {background === 'forest' && <>
        <circle cx="333" cy="90" r="29" fill="#e3e4c8" opacity="0.72" />
        <path d="M0 350Q108 174 232 329T430 224v536H0Z" fill="#577c76" />
        <path d="M0 455q102-52 218 0t212-11v316H0Z" fill="#8eaaa0" opacity="0.52" />
        <path d="M0 590q107-75 225-18t205-42v230H0Z" fill="#2b5147" />
        {[24, 84, 148, 285, 350, 416].map((x, index) => <g key={x} transform={`translate(${x} ${index % 2 ? 585 : 625}) scale(${index % 2 ? 0.85 : 1.15})`}>
          <path d="M-4 115h8V0h-8Z" fill="#182e2d" />
          <path d="M0-54 34 10H20l36 55H31l43 61H-74l43-61h-25l36-55h-14Z" fill="#193a35" />
        </g>)}
        <path d="M152 760q20-105 111-118t84-58q50 54-40 92t-52 84Z" fill="#a4b7a9" opacity="0.38" />
      </>}

      {background === 'city' && <>
        <circle cx="348" cy="79" r="27" fill="#e4ddc2" />
        <path d="M0 333h64V215h77v68h72V150h88v155h68v-94h61v549H0Z" fill="#303959" />
        {[[0, 280, 76], [68, 355, 92], [151, 238, 91], [233, 327, 82], [303, 262, 82], [375, 370, 55]].map(([x, y, width], index) => <g key={x}>
          <path d={`M${x} 760V${y}h${width}V760Z`} fill={index % 2 ? '#182b39' : '#132433'} />
          {Array.from({ length: 4 }, (_, row) => Array.from({ length: 2 }, (_, column) => <rect key={`${row}-${column}`} x={x + 13 + column * 27} y={y + 24 + row * 49} width="9" height="17" rx="1" fill={(row + column + index) % 3 ? '#dca36f' : '#6f9dad'} opacity="0.78" />))}
        </g>)}
        <path d="M195 150V77m-18 73v-23h36v23M412 370v-56" fill="none" stroke="#77889b" strokeWidth="5" />
      </>}

      {background === 'winter' && <>
        <circle cx="338" cy="86" r="31" fill="#edf2f5" />
        <path d="m0 408 78-268 102 235 81-191 112 229 57-174v521H0Z" fill="#7b9aaf" />
        <path d="m41 267 37-127 55 126-38-30-18-52-18 62Zm174 23 46-106 54 111-37-29-17-43-23 57Z" fill="#dae7eb" />
        <path d="M0 508q108-107 225-23t205-13v288H0Z" fill="#bdd3dc" />
        <path d="M95 760q40-102 175-116t125-68q4 73-107 111T221 760Z" fill="#6b99ae" />
        {[24, 82, 350, 413].map((x, index) => <g key={x} transform={`translate(${x} ${index % 2 ? 610 : 660})`}>
          <path d="M-4 83h8V0h-8Z" fill="#244248" />
          <path d="M0-55 31 0H18l30 47H27l34 47H-61l34-47h-21l30-47h-13Z" fill="#31545a" />
          <path d="m0-55 14 27-14-8-14 8Zm0 35 25 34-25-11-25 11Z" fill="#e5edef" />
        </g>)}
      </>}

      {background === 'aurora' && <>
        {[[42, 62], [95, 140], [172, 75], [252, 125], [337, 54], [392, 172], [216, 220]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="2" fill="#dbf1ee" />)}
        <path d="M-45 18q112 244 245 81T480 65v234q-138-83-271 31T-45 171Z" fill={`url(#${auroraId})`} />
        <path d="M-30 181Q109 40 220 204T468 113v166Q342 391 215 282T-30 310Z" fill={`url(#${auroraId})`} opacity="0.68" />
        <path d="m0 501 68-143 97 151 95-109 99 125 71-151v386H0Z" fill="#263e51" />
        <path d="M0 585q108-32 220 5t210-2v172H0Z" fill="#265058" />
        <path d="M58 637q102-26 242 7m-175 62q90-18 184 3" fill="none" stroke="#72c5aa" strokeWidth="5" opacity="0.38" />
      </>}

      {background === 'garden' && <>
        <circle cx="335" cy="104" r="35" fill="#ffe8bf" />
        <path d="M0 380q111-160 221-25t209-54v459H0Z" fill="#7e9f89" />
        <path d="M0 506q107-96 225-23t205-34v311H0Z" fill="#416f61" />
        <ellipse cx="231" cy="672" rx="185" ry="95" fill="#78aaa2" />
        <path d="M107 657q109-183 218 0" fill="none" stroke="#67433c" strokeWidth="20" />
        <path d="M111 626q105-153 210 0m-172-48v56m52-92v55m54-47v56" fill="none" stroke="#a07059" strokeWidth="8" />
        <path d="M18 494Q64 246 31 0m21 183 101-96M412 510q-53-277 3-510m-29 171-101-83" fill="none" stroke="#55453e" strokeWidth="18" />
        {[[24, 44, 58], [76, 80, 51], [126, 102, 40], [403, 42, 66], [352, 91, 53], [302, 115, 34]].map(([cx, cy, r], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={index % 2 ? '#cf9daa' : '#e6babc'} />)}
      </>}
    </svg>
  );
}

export function SceneWindow({ background = 'alpine' }) {
  return (
    <span className="scene-background__window">
      <span className="scene-background__window-view">
        <SceneLandscape background={background} />
        <MobileSceneLandscape background={background} />
        <span className="scene-background__window-bars" />
      </span>
    </span>
  );
}

function SceneBackground({ background = 'alpine' }) {
  React.useLayoutEffect(() => {
    const themeClass = `scene-theme--${background}`;
    const root = document.documentElement;
    root.classList.add('scene-theme', themeClass);
    return () => root.classList.remove('scene-theme', themeClass);
  }, [background]);

  return (
    <div className={`scene-background scene-theme scene-theme--${background}`} aria-hidden="true">
      <SceneWindow background={background} />
      <div className="scene-background__desk">
        <div className="scene-background__plant">
          <span /><span /><span /><span />
          <i />
        </div>
        <div className="scene-background__mug" />
        {['winter', 'aurora'].includes(background) && <div className="scene-background__lantern"><span /></div>}
        {background === 'city' && <div className="scene-background__desk-lamp"><span /></div>}
      </div>
    </div>
  );
}

export default SceneBackground;
