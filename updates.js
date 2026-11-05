// Newest first. Each entry lists what got better for users, per language; `en` is the fallback.
export const UPDATES = [
  {
    date: '2026-11-05',
    notes: {
      en: ['You can now choose the app language in Options. Until you do, it follows your device language.', 'You no longer need your own YouTube API key; videos for popular songs are already linked and play right away.', 'Songs whose video is not connected yet open a YouTube search, with a note that the link is on its way.'],
      ko: ['옵션에서 앱 언어를 직접 고를 수 있어요. 고르지 않으면 기기 언어를 따라가요.', '이제 YouTube API 키를 직접 입력하지 않아도 돼요. 인기 곡의 YouTube 영상이 미리 연결되어 있어 바로 재생돼요.', '영상이 아직 연결되지 않은 곡은 곧 연결된다는 안내와 함께 YouTube 검색 결과가 열려요.'],
      ja: ['オプションでアプリの言語を選べるようになりました。選ばない場合は端末の言語に従います。', 'YouTube APIキーを自分で入力する必要はなくなりました。人気曲の動画はあらかじめ連携されていて、すぐに再生できます。', '動画がまだ連携されていない曲は、準備中のお知らせとともにYouTubeの検索結果が開きます。'],
      zh: ['现在可以在选项中选择应用语言。未选择时会跟随设备语言。', '不再需要自己输入 YouTube API 密钥；热门歌曲的视频已预先关联，可直接播放。', '尚未关联视频的歌曲会打开 YouTube 搜索结果，并提示视频即将关联。'],
      es: ['Ahora puedes elegir el idioma de la app en Opciones. Si no lo haces, sigue el idioma del dispositivo.', 'Ya no necesitas tu propia clave de la API de YouTube; los vídeos de las canciones populares ya están vinculados y se reproducen al instante.', 'Las canciones sin vídeo vinculado abren una búsqueda en YouTube, con un aviso de que el enlace está en camino.'],
      fr: ['Vous pouvez désormais choisir la langue de l’app dans les Options. Sans choix, elle suit la langue de l’appareil.', 'Plus besoin de votre propre clé d’API YouTube : les vidéos des titres populaires sont déjà associées et se lisent tout de suite.', 'Les titres dont la vidéo n’est pas encore associée ouvrent une recherche YouTube, avec un message indiquant que le lien arrive.'],
      de: ['Du kannst die App-Sprache jetzt in den Optionen wählen. Ohne Auswahl folgt sie der Gerätesprache.', 'Du brauchst keinen eigenen YouTube-API-Schlüssel mehr; Videos beliebter Songs sind bereits verknüpft und starten sofort.', 'Songs ohne verknüpftes Video öffnen eine YouTube-Suche, mit dem Hinweis, dass der Link bald folgt.']
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

export function renderUpdates(host, lang) {
  host.replaceChildren(...UPDATES.map(entry => {
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
