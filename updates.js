// Newest first. Each entry lists what got better for users, per language; `en` is the fallback.
export const UPDATES = [
  {
    date: '2026-11-12',
    notes: {
      en: ['Flick the globe and it spins like a roulette wheel, stops on a random country, and plays that country\'s #1 song preview right away.', 'You can now favorite a country straight from the country list with the star next to its name.'],
      ko: ['지구본을 휙 돌리면 룰렛처럼 돌다가 무작위 나라에서 멈추고, 그 나라 1위 곡의 미리듣기가 바로 재생돼요.', '나라 목록에서도 각 나라 옆의 별표로 바로 즐겨찾기할 수 있어요.'],
      ja: ['地球儀をさっと回すとルーレットのように回転し、ランダムな国で止まって、その国の1位の曲のプレビューがすぐに再生されます。', '国の一覧でも、各国の横の星ですぐにお気に入りに登録できます。'],
      zh: ['轻轻一甩地球仪，它会像轮盘一样旋转，随机停在某个国家，并立即播放该国第一名歌曲的试听。', '现在在国家列表中，也可以直接点按每个国家旁边的星标来收藏。'],
      es: ['Lanza el globo y girará como una ruleta, se detendrá en un país al azar y reproducirá enseguida el adelanto de la canción n.º 1 de ese país.', 'Ahora también puedes marcar un país como favorito directamente desde la lista de países con la estrella junto a su nombre.'],
      fr: ['Lancez le globe : il tourne comme une roulette, s’arrête sur un pays au hasard et lance aussitôt l’extrait du titre n° 1 de ce pays.', 'Vous pouvez désormais mettre un pays en favori directement depuis la liste des pays, avec l’étoile à côté de son nom.'],
      de: ['Wirf den Globus an: Er dreht sich wie ein Roulette, bleibt bei einem zufälligen Land stehen und spielt sofort die Hörprobe des Nr.-1-Songs dieses Landes ab.', 'Du kannst ein Land jetzt direkt in der Länderliste mit dem Stern neben seinem Namen zu den Favoriten hinzufügen.']
    }
  },
  {
    date: '2026-11-09',
    notes: {
      en: ['Fixed the globe looking broken on some Android devices.', 'While a video is playing, you can now return to the globe with the "Close video" button.'],
      ko: ['일부 안드로이드 기기에서 지구본이 깨져 보이던 문제를 고쳤어요.', '영상을 재생하는 중에도 "영상 닫기" 버튼으로 지구본 화면으로 돌아올 수 있어요.'],
      ja: ['一部のAndroid端末で地球儀が崩れて表示される問題を修正しました。', '動画の再生中でも「動画を閉じる」ボタンで地球儀の画面に戻れます。'],
      zh: ['修复了部分安卓设备上地球仪显示异常的问题。', '播放视频时，也可以用“关闭视频”按钮回到地球仪界面。'],
      es: ['Hemos corregido el globo que se veía roto en algunos dispositivos Android.', 'Mientras se reproduce un vídeo, ahora puedes volver al globo con el botón «Cerrar vídeo».'],
      fr: ['Nous avons corrigé l’affichage du globe, qui apparaissait cassé sur certains appareils Android.', 'Pendant la lecture d’une vidéo, vous pouvez revenir au globe avec le bouton « Fermer la vidéo ».'],
      de: ['Auf manchen Android-Geräten wurde der Globus fehlerhaft dargestellt – das ist behoben.', 'Während ein Video läuft, kommst du jetzt mit der Schaltfläche „Video schließen“ zurück zum Globus.']
    }
  },
  {
    date: '2026-11-05',
    notes: {
      en: ['You can now choose the app language in Options.', 'Full-track listening on YouTube now works without an API key. Popular songs already have their videos linked, and more are added every day.', 'Songs without a video yet open a YouTube search, with a note that the link is being prepared.'],
      ko: ['옵션에서 앱 언어를 직접 고를 수 있어요.', 'API 키 없이도 YouTube로 전체 듣기를 할 수 있어요. 인기 곡부터 영상이 연결되어 있고, 매일 더 늘어나요.', '영상이 아직 없는 곡은 YouTube 검색 결과가 열리고, 연결을 준비 중이라는 안내가 나와요.'],
      ja: ['オプションでアプリの言語を選べるようになりました。', 'APIキーなしでYouTubeのフル再生ができます。人気曲から動画が連携されていて、毎日増えていきます。', '動画がまだない曲はYouTubeの検索結果が開き、準備中であることをお知らせします。'],
      zh: ['现在可以在选项中选择应用语言。', '无需 API 密钥也能在 YouTube 上收听完整歌曲。热门歌曲已关联视频，并且每天都在增加。', '尚无视频的歌曲会打开 YouTube 搜索结果，并提示正在准备关联。'],
      es: ['Ahora puedes elegir el idioma de la app en Opciones.', 'Ahora puedes escuchar canciones completas en YouTube sin clave de API. Las canciones populares ya tienen su vídeo vinculado y cada día se añaden más.', 'Las canciones que aún no tienen vídeo abren una búsqueda en YouTube, con un aviso de que el enlace se está preparando.'],
      fr: ['Vous pouvez désormais choisir la langue de l’app dans les Options.', 'Vous pouvez écouter les titres en entier sur YouTube sans clé d’API. Les titres populaires ont déjà leur vidéo associée, et d’autres s’ajoutent chaque jour.', 'Les titres qui n’ont pas encore de vidéo ouvrent une recherche YouTube, avec un message indiquant que le lien est en préparation.'],
      de: ['Du kannst die App-Sprache jetzt in den Optionen wählen.', 'Vollständiges Hören über YouTube funktioniert jetzt ohne API-Schlüssel. Beliebte Songs haben schon ihr Video, und täglich kommen mehr dazu.', 'Songs ohne Video öffnen eine YouTube-Suche, mit dem Hinweis, dass der Link gerade vorbereitet wird.']
    }
  },
  {
    date: '2026-11-04',
    notes: {
      en: ['The whole app now follows your phone\'s language.', 'Star a country next to its name, and the arrow buttons will move only between your favorites.'],
      ko: ['스마트폰 언어에 맞춰 앱 전체가 바뀌어요.', '나라 이름 옆 별표로 즐겨찾기를 하면, 좌우 이동 버튼이 즐겨찾기한 나라만 오가요.'],
      ja: ['スマートフォンの言語に合わせて、アプリ全体が切り替わります。', '国名の横の星でお気に入りに登録すると、左右の矢印ボタンはお気に入りの国の間だけを移動します。'],
      zh: ['整个应用会跟随手机的语言。', '点按国家名称旁的星标加入收藏后，左右箭头按钮只会在收藏的国家之间切换。'],
      es: ['Toda la app ahora sigue el idioma de tu teléfono.', 'Marca un país con la estrella junto a su nombre y las flechas solo se moverán entre tus favoritos.'],
      fr: ['Toute l’app suit désormais la langue de votre téléphone.', 'Mettez un pays en favori avec l’étoile à côté de son nom : les flèches ne passeront alors qu’entre vos favoris.'],
      de: ['Die ganze App folgt jetzt der Sprache deines Handys.', 'Markiere ein Land mit dem Stern neben seinem Namen, dann wechseln die Pfeiltasten nur noch zwischen deinen Favoriten.']
    }
  },
  {
    date: '2026-11-03',
    notes: {
      en: ['Improved the UI and options.'],
      ko: ['UI와 옵션 내용을 개선했어요.'],
      ja: ['UIとオプションを改善しました。'],
      zh: ['优化了界面和选项。'],
      es: ['Hemos mejorado la interfaz y las opciones.'],
      fr: ['Nous avons amélioré l’interface et les options.'],
      de: ['Wir haben die Oberfläche und die Optionen verbessert.']
    }
  }
];

function formatDate(date, lang) {
  const value = new Date(`${date}T00:00:00`);
  try { return value.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return date; }
}

// The list shows only the latest releases.
const MAX_ENTRIES = 3;

// A live entry for work still in progress: { date: 'YYYY-MM-DD', text }.
function progressSection({ date, text }, lang) {
  const section = document.createElement('section');
  section.className = 'update-entry update-progress';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const time = document.createElement('time');
    time.dateTime = date;
    time.textContent = formatDate(date, lang);
    section.append(time);
  }
  const list = document.createElement('ul');
  const item = document.createElement('li');
  item.textContent = text;
  list.append(item);
  section.append(list);
  return section;
}

export function renderUpdates(host, lang, progress = null) {
  const sections = UPDATES.slice(0, MAX_ENTRIES).map(entry => {
    const section = document.createElement('section');
    section.className = 'update-entry';
    const time = document.createElement('time');
    time.dateTime = entry.date;
    time.textContent = formatDate(entry.date, lang);
    const list = document.createElement('ul');
    for (const note of entry.notes[lang] ?? entry.notes.en) {
      const item = document.createElement('li');
      item.textContent = note;
      list.append(item);
    }
    section.append(time, list);
    return section;
  });
  if (progress) sections.unshift(progressSection(progress, lang));
  host.replaceChildren(...sections);
}
