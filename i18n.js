import { escapeHTML } from './lib.js?v=3';

// Only the option dialogs (install guide, API key guide) and their toasts follow the device language; the rest of the UI is English.
const tags = navigator.languages?.length ? [...navigator.languages] : [navigator.language || 'en'];
export const lang = (tags[0] || 'en').toLowerCase().split('-')[0];

const LINKS = {
  cloud: 'https://console.cloud.google.com/projectcreate',
  api: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
  cred: 'https://console.cloud.google.com/apis/credentials',
  terms: 'https://www.youtube.com/t/terms',
  privacy: 'https://policies.google.com/privacy'
};

const DICT = {
  en: {
    close: 'Close',
    'install.title': 'Add Orbitone to your Home Screen',
    'install.ios': 'iPhone / iPad: In Safari, choose **Share → Add to Home Screen**.',
    'install.android': 'Android / desktop: In your browser menu, choose **Install app** or **Add to Home Screen**.',
    'install.note': 'The install icon disappears once you open the installed app. HTTPS or localhost is required.',
    'install.done': 'Orbitone has been installed.',
    'settings.title': 'Full-track playback settings',
    'settings.intro': 'Playback defaults to 30-second previews. Full tracks play through YouTube, and searching for a song needs your own YouTube Data API key (one-time setup). It is free and no credit card is required.',
    'settings.guide': 'How to create an API key',
    'settings.step1': 'In the [[cloud|Google Cloud Console]], sign in with your Google account and create a project.',
    'settings.step2': 'On the [[api|YouTube Data API v3]] page, click **Enable**.',
    'settings.step3': 'Under [[cred|Credentials]], choose **Create credentials → API key**.',
    'settings.step4': "Open the key and set **Application restrictions** to Websites (HTTP referrers), then add this app's address (for example `https://yourname.github.io/*`). Under **API restrictions**, select only YouTube Data API v3 and save.",
    'settings.step5': 'Copy the key and paste it below.',
    'settings.quota': 'Each search uses 100 quota units and the default daily quota is 10,000, so you can search about 100 songs per day. Songs you have found are saved on this device for 7 days and are not searched again.',
    'settings.label': 'YouTube Data API key',
    'settings.privacy': 'The key is stored only in this browser on your device and is never sent to the developer or any other server. Be sure to set the restrictions from step 4.',
    'settings.save': 'Save and play full track',
    'settings.clear': 'Delete key',
    'settings.legal': 'Orbitone uses YouTube API Services. By using full-track playback you agree to the [[terms|YouTube Terms of Service]] and the [[privacy|Google Privacy Policy]].',
    'settings.chartNote': 'Apple Music country charts are used first. On static hosting they may fall back to iTunes sales charts, and the source is always shown.',
    'settings.privacyHeading': 'Playback and privacy',
    'settings.privacyP1': 'YouTube and Spotify connect to their own services when you play or link a track. Autoplay, region, sign-in and subscription limits may apply. Orbitone does not download or store music offline.',
    'settings.privacyP2': 'Your playlist and linked video IDs are stored on this device. If a chart fails to load, a cached chart or a clearly labeled sample is shown.',
    'settings.empty': 'Enter your API key.',
    'settings.saved': 'API key saved on this device.',
    'settings.cleared': 'Saved API key deleted.',
    'settings.problem': 'The API key cannot be used: {problem}'
  },
  ko: {
    close: '닫기',
    'install.title': 'Orbitone을 홈 화면에',
    'install.ios': 'iPhone / iPad: Safari에서 **공유 → 홈 화면에 추가**를 선택하세요.',
    'install.android': 'Android / 데스크톱: 브라우저 메뉴에서 **앱 설치** 또는 **홈 화면에 추가**를 선택하세요.',
    'install.note': '설치된 앱에서 실행하면 설치 아이콘이 사라집니다. HTTPS 또는 localhost가 필요합니다.',
    'install.done': 'Orbitone이 설치되었습니다.',
    'settings.title': '전곡 듣기 설정',
    'settings.intro': '기본 재생은 30초 미리듣기입니다. 곡 전체는 YouTube로 재생하며, 곡을 검색하려면 본인의 YouTube Data API 키가 한 번 필요합니다. 무료이며 카드 등록은 필요 없습니다.',
    'settings.guide': 'API 키 만드는 방법',
    'settings.step1': '[[cloud|Google Cloud 콘솔]]에서 Google 계정으로 로그인하고 프로젝트를 만듭니다.',
    'settings.step2': '[[api|YouTube Data API v3]] 페이지에서 **사용**을 누릅니다.',
    'settings.step3': '[[cred|사용자 인증 정보]]에서 **사용자 인증 정보 만들기 → API 키**를 선택합니다.',
    'settings.step4': '만든 키를 열어 **애플리케이션 제한사항**은 웹사이트(HTTP 리퍼러)로 두고 이 앱 주소(예: `https://내아이디.github.io/*`)를 추가합니다. **API 제한사항**은 YouTube Data API v3만 선택하고 저장합니다.',
    'settings.step5': '키를 복사해 아래에 붙여넣습니다.',
    'settings.quota': '검색 1회는 할당량 100을 쓰며 하루 기본 10,000이므로 하루 약 100곡을 검색할 수 있습니다. 한 번 찾은 곡은 이 기기에 7일간 저장되어 다시 검색하지 않습니다.',
    'settings.label': 'YouTube Data API 키',
    'settings.privacy': '키는 이 기기의 브라우저에만 저장되고 개발자나 다른 서버로 전송되지 않습니다. 위 4번의 제한을 꼭 설정해 주세요.',
    'settings.save': '저장하고 전곡 듣기',
    'settings.clear': '키 삭제',
    'settings.legal': 'Orbitone은 YouTube API 서비스를 사용합니다. 전곡 듣기를 사용하면 [[terms|YouTube 서비스 약관]]과 [[privacy|Google 개인정보처리방침]]에 동의하는 것으로 간주됩니다.',
    'settings.chartNote': 'Apple Music 국가별 인기 차트를 우선 사용합니다. 정적 호스팅에서는 iTunes 판매 차트로 대체될 수 있으며 출처를 표시합니다.',
    'settings.privacyHeading': '재생과 개인정보',
    'settings.privacyP1': 'YouTube·Spotify는 재생/연결 시 해당 서비스에 접속합니다. 자동재생, 지역, 로그인 및 구독 제한이 적용될 수 있습니다. 음악을 다운로드하거나 오프라인 저장하지 않습니다.',
    'settings.privacyP2': '플레이리스트와 연결한 영상 ID는 이 기기에 저장됩니다. 차트 로딩 실패 시 캐시 또는 명확히 표시된 예시를 보여줍니다.',
    'settings.empty': 'API 키를 입력해 주세요.',
    'settings.saved': 'API 키를 이 기기에 저장했습니다.',
    'settings.cleared': '저장된 API 키를 삭제했습니다.',
    'settings.problem': 'API 키를 사용할 수 없습니다: {problem}'
  },
  ja: {
    close: '閉じる',
    'install.title': 'Orbitone をホーム画面に追加',
    'install.ios': 'iPhone / iPad: Safari で **共有 → ホーム画面に追加** を選びます。',
    'install.android': 'Android / デスクトップ: ブラウザのメニューから **アプリをインストール** または **ホーム画面に追加** を選びます。',
    'install.note': 'インストールしたアプリから起動すると、インストールアイコンは表示されなくなります。HTTPS または localhost が必要です。',
    'install.done': 'Orbitone をインストールしました。',
    'settings.title': 'フル再生の設定',
    'settings.intro': '標準の再生は30秒のプレビューです。曲全体は YouTube で再生され、曲を検索するには、ご自身の YouTube Data API キーが一度だけ必要です。無料で、カード登録は不要です。',
    'settings.guide': 'API キーの作成方法',
    'settings.step1': '[[cloud|Google Cloud コンソール]]で Google アカウントにログインし、プロジェクトを作成します。',
    'settings.step2': '[[api|YouTube Data API v3]] のページで **有効にする** を押します。',
    'settings.step3': '[[cred|認証情報]]で **認証情報を作成 → API キー** を選びます。',
    'settings.step4': '作成したキーを開き、**アプリケーションの制限**を「ウェブサイト（HTTP リファラー）」にして、このアプリのアドレス（例: `https://yourname.github.io/*`）を追加します。**API の制限**は YouTube Data API v3 のみを選んで保存します。',
    'settings.step5': 'キーをコピーして、下に貼り付けます。',
    'settings.quota': '検索1回でクォータを100消費し、1日の標準クォータは10,000なので、1日に約100曲を検索できます。一度見つけた曲はこの端末に7日間保存され、再検索されません。',
    'settings.label': 'YouTube Data API キー',
    'settings.privacy': 'キーはこの端末のブラウザにのみ保存され、開発者や他のサーバーには送信されません。上の手順4の制限を必ず設定してください。',
    'settings.save': '保存してフル再生',
    'settings.clear': 'キーを削除',
    'settings.legal': 'Orbitone は YouTube API サービスを使用します。フル再生を使用すると、[[terms|YouTube 利用規約]]と [[privacy|Google プライバシーポリシー]]に同意したものとみなされます。',
    'settings.chartNote': 'Apple Music の国別チャートを優先して使用します。静的ホスティングでは iTunes の売上チャートに切り替わることがあり、その場合は出典が表示されます。',
    'settings.privacyHeading': '再生とプライバシー',
    'settings.privacyP1': 'YouTube と Spotify は、再生・連携時にそれぞれのサービスへ接続します。自動再生、地域、ログイン、サブスクリプションの制限が適用される場合があります。音楽のダウンロードやオフライン保存は行いません。',
    'settings.privacyP2': 'プレイリストと連携した動画 ID はこの端末に保存されます。チャートの読み込みに失敗した場合は、キャッシュまたは明示されたサンプルを表示します。',
    'settings.empty': 'API キーを入力してください。',
    'settings.saved': 'API キーをこの端末に保存しました。',
    'settings.cleared': '保存した API キーを削除しました。',
    'settings.problem': 'API キーを使用できません: {problem}'
  },
  zh: {
    close: '关闭',
    'install.title': '将 Orbitone 添加到主屏幕',
    'install.ios': 'iPhone / iPad：在 Safari 中选择 **分享 → 添加到主屏幕**。',
    'install.android': 'Android / 桌面：在浏览器菜单中选择 **安装应用** 或 **添加到主屏幕**。',
    'install.note': '从已安装的应用启动后，安装图标会消失。需要 HTTPS 或 localhost。',
    'install.done': 'Orbitone 已安装。',
    'settings.title': '完整播放设置',
    'settings.intro': '默认播放 30 秒试听。完整歌曲通过 YouTube 播放，搜索歌曲需要您自己的 YouTube Data API 密钥（只需设置一次）。免费，无需绑定银行卡。',
    'settings.guide': '如何创建 API 密钥',
    'settings.step1': '在 [[cloud|Google Cloud 控制台]] 使用 Google 账号登录并创建项目。',
    'settings.step2': '在 [[api|YouTube Data API v3]] 页面点击 **启用**。',
    'settings.step3': '在 [[cred|凭据]] 中选择 **创建凭据 → API 密钥**。',
    'settings.step4': '打开创建的密钥，将 **应用限制** 设为网站（HTTP 引荐来源），并添加本应用的地址（例如 `https://yourname.github.io/*`）。**API 限制** 仅选择 YouTube Data API v3 并保存。',
    'settings.step5': '复制密钥并粘贴到下方。',
    'settings.quota': '每次搜索消耗 100 配额，每日默认配额为 10,000，因此每天大约可搜索 100 首歌曲。找到过的歌曲会在此设备上保存 7 天，不会重复搜索。',
    'settings.label': 'YouTube Data API 密钥',
    'settings.privacy': '密钥只保存在此设备的浏览器中，不会发送给开发者或其他服务器。请务必设置上面第 4 步的限制。',
    'settings.save': '保存并播放完整歌曲',
    'settings.clear': '删除密钥',
    'settings.legal': 'Orbitone 使用 YouTube API 服务。使用完整播放即表示您同意 [[terms|YouTube 服务条款]] 和 [[privacy|Google 隐私权政策]]。',
    'settings.chartNote': '优先使用 Apple Music 各国榜单。在静态托管环境下可能改用 iTunes 销量榜，并会标明来源。',
    'settings.privacyHeading': '播放与隐私',
    'settings.privacyP1': '播放或关联时，YouTube 和 Spotify 会连接各自的服务，可能受到自动播放、地区、登录和订阅的限制。Orbitone 不会下载音乐，也不会离线保存。',
    'settings.privacyP2': '播放列表和已关联的视频 ID 保存在此设备上。榜单加载失败时，会显示缓存内容或明确标注的示例。',
    'settings.empty': '请输入 API 密钥。',
    'settings.saved': 'API 密钥已保存在此设备上。',
    'settings.cleared': '已删除保存的 API 密钥。',
    'settings.problem': '无法使用该 API 密钥：{problem}'
  },
  es: {
    close: 'Cerrar',
    'install.title': 'Añade Orbitone a la pantalla de inicio',
    'install.ios': 'iPhone / iPad: en Safari, elige **Compartir → Añadir a pantalla de inicio**.',
    'install.android': 'Android / escritorio: en el menú del navegador, elige **Instalar aplicación** o **Añadir a la pantalla de inicio**.',
    'install.note': 'El icono de instalación desaparece cuando abres la app instalada. Se requiere HTTPS o localhost.',
    'install.done': 'Orbitone se ha instalado.',
    'settings.title': 'Ajustes de reproducción completa',
    'settings.intro': 'La reproducción predeterminada es una vista previa de 30 segundos. Las canciones completas se reproducen con YouTube y, para buscarlas, necesitas tu propia clave de la API de YouTube Data (solo una vez). Es gratis y no hace falta tarjeta.',
    'settings.guide': 'Cómo crear una clave de API',
    'settings.step1': 'En la [[cloud|consola de Google Cloud]], inicia sesión con tu cuenta de Google y crea un proyecto.',
    'settings.step2': 'En la página de [[api|YouTube Data API v3]], pulsa **Habilitar**.',
    'settings.step3': 'En [[cred|Credenciales]], elige **Crear credenciales → Clave de API**.',
    'settings.step4': 'Abre la clave y, en **Restricciones de la aplicación**, elige Sitios web (referentes HTTP) y añade la dirección de esta app (por ejemplo, `https://tunombre.github.io/*`). En **Restricciones de la API**, selecciona solo YouTube Data API v3 y guarda.',
    'settings.step5': 'Copia la clave y pégala abajo.',
    'settings.quota': 'Cada búsqueda consume 100 unidades de cuota y la cuota diaria predeterminada es de 10 000, así que puedes buscar unas 100 canciones al día. Las canciones ya encontradas se guardan 7 días en este dispositivo y no se vuelven a buscar.',
    'settings.label': 'Clave de la API de YouTube Data',
    'settings.privacy': 'La clave solo se guarda en el navegador de este dispositivo y nunca se envía al desarrollador ni a otros servidores. Asegúrate de configurar las restricciones del paso 4.',
    'settings.save': 'Guardar y reproducir completa',
    'settings.clear': 'Eliminar clave',
    'settings.legal': 'Orbitone usa los servicios de la API de YouTube. Al usar la reproducción completa aceptas las [[terms|Condiciones del servicio de YouTube]] y la [[privacy|Política de privacidad de Google]].',
    'settings.chartNote': 'Se usan primero las listas de éxitos de Apple Music por país. En alojamiento estático pueden sustituirse por las listas de ventas de iTunes, y siempre se indica la fuente.',
    'settings.privacyHeading': 'Reproducción y privacidad',
    'settings.privacyP1': 'YouTube y Spotify se conectan a sus propios servicios al reproducir o vincular. Pueden aplicarse límites de reproducción automática, región, inicio de sesión y suscripción. Orbitone no descarga música ni la guarda sin conexión.',
    'settings.privacyP2': 'Tu lista de reproducción y los ID de vídeo vinculados se guardan en este dispositivo. Si falla la carga de una lista, se muestra una copia en caché o un ejemplo claramente indicado.',
    'settings.empty': 'Introduce tu clave de API.',
    'settings.saved': 'Clave de API guardada en este dispositivo.',
    'settings.cleared': 'Clave de API guardada eliminada.',
    'settings.problem': 'No se puede usar la clave de API: {problem}'
  },
  fr: {
    close: 'Fermer',
    'install.title': 'Ajouter Orbitone à l’écran d’accueil',
    'install.ios': 'iPhone / iPad : dans Safari, choisissez **Partager → Sur l’écran d’accueil**.',
    'install.android': 'Android / ordinateur : dans le menu du navigateur, choisissez **Installer l’application** ou **Ajouter à l’écran d’accueil**.',
    'install.note': 'L’icône d’installation disparaît lorsque vous ouvrez l’app installée. HTTPS ou localhost est requis.',
    'install.done': 'Orbitone a été installée.',
    'settings.title': 'Réglages de lecture complète',
    'settings.intro': 'La lecture par défaut est un aperçu de 30 secondes. Les titres complets sont lus via YouTube et, pour les rechercher, il vous faut votre propre clé d’API YouTube Data (une seule fois). C’est gratuit, sans carte bancaire.',
    'settings.guide': 'Comment créer une clé d’API',
    'settings.step1': 'Dans la [[cloud|console Google Cloud]], connectez-vous avec votre compte Google et créez un projet.',
    'settings.step2': 'Sur la page [[api|YouTube Data API v3]], cliquez sur **Activer**.',
    'settings.step3': 'Dans [[cred|Identifiants]], choisissez **Créer des identifiants → Clé API**.',
    'settings.step4': 'Ouvrez la clé, réglez **Restrictions relatives aux applications** sur Sites Web (référents HTTP) et ajoutez l’adresse de cette app (par exemple `https://votrenom.github.io/*`). Dans **Restrictions relatives aux API**, sélectionnez uniquement YouTube Data API v3 et enregistrez.',
    'settings.step5': 'Copiez la clé et collez-la ci-dessous.',
    'settings.quota': 'Chaque recherche consomme 100 unités de quota et le quota quotidien par défaut est de 10 000 : vous pouvez donc rechercher environ 100 titres par jour. Les titres trouvés sont conservés 7 jours sur cet appareil et ne sont plus recherchés.',
    'settings.label': 'Clé d’API YouTube Data',
    'settings.privacy': 'La clé n’est enregistrée que dans le navigateur de cet appareil et n’est jamais envoyée au développeur ni à un autre serveur. Pensez à définir les restrictions de l’étape 4.',
    'settings.save': 'Enregistrer et lire en entier',
    'settings.clear': 'Supprimer la clé',
    'settings.legal': 'Orbitone utilise les services d’API YouTube. En utilisant la lecture complète, vous acceptez les [[terms|Conditions d’utilisation de YouTube]] et la [[privacy|Politique de confidentialité de Google]].',
    'settings.chartNote': 'Les classements Apple Music par pays sont utilisés en priorité. Sur un hébergement statique, ils peuvent être remplacés par les classements des ventes iTunes, et la source est toujours indiquée.',
    'settings.privacyHeading': 'Lecture et confidentialité',
    'settings.privacyP1': 'YouTube et Spotify se connectent à leurs propres services lors de la lecture ou de l’association. Des limites de lecture automatique, de région, de connexion et d’abonnement peuvent s’appliquer. Orbitone ne télécharge pas la musique et ne l’enregistre pas hors ligne.',
    'settings.privacyP2': 'Votre playlist et les identifiants vidéo associés sont enregistrés sur cet appareil. Si le chargement d’un classement échoue, un classement en cache ou un exemple clairement indiqué s’affiche.',
    'settings.empty': 'Saisissez votre clé d’API.',
    'settings.saved': 'Clé d’API enregistrée sur cet appareil.',
    'settings.cleared': 'Clé d’API enregistrée supprimée.',
    'settings.problem': 'La clé d’API est inutilisable : {problem}'
  },
  de: {
    close: 'Schließen',
    'install.title': 'Orbitone zum Home-Bildschirm hinzufügen',
    'install.ios': 'iPhone / iPad: Wähle in Safari **Teilen → Zum Home-Bildschirm**.',
    'install.android': 'Android / Desktop: Wähle im Browsermenü **App installieren** oder **Zum Startbildschirm hinzufügen**.',
    'install.note': 'Das Installationssymbol verschwindet, sobald du die installierte App öffnest. HTTPS oder localhost ist erforderlich.',
    'install.done': 'Orbitone wurde installiert.',
    'settings.title': 'Einstellungen für die Wiedergabe ganzer Titel',
    'settings.intro': 'Standardmäßig werden 30-Sekunden-Vorschauen abgespielt. Ganze Titel laufen über YouTube; für die Suche brauchst du einmalig deinen eigenen YouTube-Data-API-Schlüssel. Er ist kostenlos, eine Kreditkarte ist nicht nötig.',
    'settings.guide': 'So erstellst du einen API-Schlüssel',
    'settings.step1': 'Melde dich in der [[cloud|Google Cloud Console]] mit deinem Google-Konto an und erstelle ein Projekt.',
    'settings.step2': 'Klicke auf der Seite [[api|YouTube Data API v3]] auf **Aktivieren**.',
    'settings.step3': 'Wähle unter [[cred|Anmeldedaten]] **Anmeldedaten erstellen → API-Schlüssel**.',
    'settings.step4': 'Öffne den Schlüssel, stelle **Anwendungseinschränkungen** auf Websites (HTTP-Verweis-URLs) und füge die Adresse dieser App hinzu (z. B. `https://deinname.github.io/*`). Wähle bei **API-Einschränkungen** nur YouTube Data API v3 und speichere.',
    'settings.step5': 'Kopiere den Schlüssel und füge ihn unten ein.',
    'settings.quota': 'Jede Suche verbraucht 100 Kontingenteinheiten, das tägliche Standardkontingent beträgt 10.000 – so kannst du täglich etwa 100 Titel suchen. Gefundene Titel werden 7 Tage auf diesem Gerät gespeichert und nicht erneut gesucht.',
    'settings.label': 'YouTube-Data-API-Schlüssel',
    'settings.privacy': 'Der Schlüssel wird nur im Browser dieses Geräts gespeichert und weder an den Entwickler noch an andere Server gesendet. Richte unbedingt die Einschränkungen aus Schritt 4 ein.',
    'settings.save': 'Speichern und ganzen Titel abspielen',
    'settings.clear': 'Schlüssel löschen',
    'settings.legal': 'Orbitone nutzt die YouTube-API-Dienste. Mit der Wiedergabe ganzer Titel stimmst du den [[terms|YouTube-Nutzungsbedingungen]] und der [[privacy|Datenschutzerklärung von Google]] zu.',
    'settings.chartNote': 'Bevorzugt werden die Apple-Music-Länder-Charts verwendet. Bei statischem Hosting kann auf die iTunes-Verkaufscharts ausgewichen werden; die Quelle wird immer angezeigt.',
    'settings.privacyHeading': 'Wiedergabe und Datenschutz',
    'settings.privacyP1': 'YouTube und Spotify verbinden sich beim Abspielen oder Verknüpfen mit ihren eigenen Diensten. Es können Einschränkungen für Autoplay, Region, Anmeldung und Abos gelten. Orbitone lädt keine Musik herunter und speichert sie nicht offline.',
    'settings.privacyP2': 'Deine Playlist und verknüpfte Video-IDs werden auf diesem Gerät gespeichert. Schlägt das Laden eines Charts fehl, werden zwischengespeicherte Daten oder ein klar gekennzeichnetes Beispiel angezeigt.',
    'settings.empty': 'Bitte gib deinen API-Schlüssel ein.',
    'settings.saved': 'API-Schlüssel auf diesem Gerät gespeichert.',
    'settings.cleared': 'Gespeicherter API-Schlüssel gelöscht.',
    'settings.problem': 'Der API-Schlüssel kann nicht verwendet werden: {problem}'
  }
};

const strings = { ...DICT.en, ...DICT[lang] };

export const t = (key, vars = {}) => (strings[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');

// Translation text is trusted but still escaped; [[link|label]], **bold** and `code` are the only markup.
const rich = text => escapeHTML(text)
  .replace(/\[\[(\w+)\|([^\]]+)\]\]/g, (_, key, label) => (LINKS[key] ? `<a href="${LINKS[key]}" target="_blank" rel="noopener noreferrer">${label}</a>` : label))
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

export function applyLocale() {
  for (const id of ['install-dialog', 'settings-dialog']) document.getElementById(id).lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = rich(t(el.dataset.i18n)); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}

let regionNames = null;
try { regionNames = new Intl.DisplayNames([tags[0] || 'en'], { type: 'region' }); } catch { /* unsupported locale */ }

// Name follows the device language; the small English line is dropped when the device language is English.
export function countryLabel(country) {
  const english = country.en || country.name;
  let name = '';
  if (country.code) {
    try { name = regionNames?.of(country.code.toUpperCase()) || ''; } catch { /* unknown region */ }
    if (!name || name.toUpperCase() === country.code.toUpperCase()) name = lang === 'ko' ? country.name : english;
  } else {
    name = english;
  }
  const sub = lang === 'en' || name.toUpperCase() === english.toUpperCase() ? '' : english.toUpperCase();
  return { name, sub };
}
