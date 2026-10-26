import { getJSON, readStore, writeStore } from './lib.js';
// ISO numeric ID matches Natural Earth / world-atlas geometry.
const rows = [
 ['kr','410','대한민국','South Korea',127.8,36.2],['jp','392','일본','Japan',138,37],['us','840','미국','United States',-100,39],['gb','826','영국','United Kingdom',-2,54],['fr','250','프랑스','France',2,47],['de','276','독일','Germany',10,51],['it','380','이탈리아','Italy',12.5,43],['es','724','스페인','Spain',-4,40],['pt','620','포르투갈','Portugal',-8,40],['ca','124','캐나다','Canada',-105,57],['mx','484','멕시코','Mexico',-102,24],['br','076','브라질','Brazil',-52,-12],['ar','032','아르헨티나','Argentina',-64,-35],['cl','152','칠레','Chile',-71,-32],['co','170','콜롬비아','Colombia',-74,4],['pe','604','페루','Peru',-75,-10],['au','036','호주','Australia',134,-25],['nz','554','뉴질랜드','New Zealand',173,-41],['in','356','인도','India',79,22],['id','360','인도네시아','Indonesia',118,-3],['th','764','태국','Thailand',101,15],['vn','704','베트남','Vietnam',107,16],['ph','608','필리핀','Philippines',122,12],['my','458','말레이시아','Malaysia',103,4],['sg','702','싱가포르','Singapore',103.8,1.35],['tw','158','대만','Taiwan',121,23.7],['hk','344','홍콩','Hong Kong',114.2,22.3],['tr','792','튀르키예','Türkiye',35,39],['sa','682','사우디아라비아','Saudi Arabia',45,24],['ae','784','아랍에미리트','United Arab Emirates',54,24],['za','710','남아프리카공화국','South Africa',25,-29],['ng','566','나이지리아','Nigeria',8,9],['eg','818','이집트','Egypt',30,27],['ke','404','케냐','Kenya',38,0],['gh','288','가나','Ghana',-2,8],['se','752','스웨덴','Sweden',16,62],['no','578','노르웨이','Norway',10,62],['fi','246','핀란드','Finland',26,64],['dk','208','덴마크','Denmark',10,56],['nl','528','네덜란드','Netherlands',5,52],['be','056','벨기에','Belgium',4.5,50.8],['ch','756','스위스','Switzerland',8.2,46.8],['at','040','오스트리아','Austria',14,48],['pl','616','폴란드','Poland',19,52],['ua','804','우크라이나','Ukraine',32,49],['ie','372','아일랜드','Ireland',-8,53],['gr','300','그리스','Greece',23,39],['ro','642','루마니아','Romania',25,46],['hu','348','헝가리','Hungary',19,47],['cz','203','체코','Czechia',15,50]
];
export const countries = rows.map(([code,id,name,en,lon,lat]) => ({code,id,name,en,center:[lon,lat]}));
export const demos = [
 {id:'demo-apt',title:'APT.',artist:'ROSÉ & Bruno Mars',genre:'Pop',youtube:'ekr2nIex040'},
 {id:'demo-dynamite',title:'Dynamite',artist:'BTS',genre:'K-Pop',youtube:'gdZLi9oWNZg'},
 {id:'demo-shape',title:'Shape of You',artist:'Ed Sheeran',genre:'Pop',youtube:'JGwWNGJdvx8'}
];
function appleChart(data, country) {
 if (!Array.isArray(data.feed?.results) || !data.feed.results.length) throw new Error('Empty chart');
 return {source:'Apple Music 인기 차트',updated:data.feed.updated,tracks:data.feed.results.map((x,i) => ({id:x.id,title:x.name,artist:x.artistName,genre:x.genres?.find(g=>g.genreId!=='34')?.name||'장르 미제공',artwork:x.artworkUrl100?.replace('100x100','600x600'),url:x.url,rank:i+1,country:country.code,countryName:country.name}))};
}
function itunesChart(data,country) {
 if (!Array.isArray(data.feed?.entry) || !data.feed.entry.length) throw new Error('Empty chart');
 return {source:'iTunes 판매 차트 (대체 출처)',updated:data.feed.updated?.label,tracks:data.feed.entry.map((x,i)=>({id:x.id.attributes['im:id'],title:x['im:name'].label,artist:x['im:artist'].label,genre:x.category?.attributes?.label||'장르 미제공',artwork:x['im:image']?.at(-1)?.label,url:x.id.label,rank:i+1,country:country.code,countryName:country.name}))};
}
export async function loadChart(country) {
 const key = `orbitone-chart-${country.code}`;
 const attempts = [
  () => getJSON(`./api/chart?country=${country.code}`,8000).then(d=>appleChart(d,country)),
  () => getJSON(`https://itunes.apple.com/${country.code}/rss/topsongs/limit=25/json`,8000).then(d=>itunesChart(d,country))
 ];
 for (const attempt of attempts) { try { const chart = await attempt(); writeStore(key,chart); return chart; } catch { /* Explicit cache/demo fallback below. */ } }
 const cache = readStore(key,null);
 if (cache?.tracks?.length) return {...cache,stale:true};
 return {source:'예시 음악 · 현재 국가의 실제 순위가 아닙니다',demo:true,tracks:demos.map(t=>({...t,country:country.code,countryName:country.name}))};
}
