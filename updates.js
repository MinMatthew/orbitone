// Newest first. Each entry lists what got better for users, per language; `en` is the fallback.
export const UPDATES = [
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

export function renderUpdates(host, lang) {
  host.replaceChildren(...UPDATES.slice(0, MAX_ENTRIES).map(entry => {
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
  }));
}
