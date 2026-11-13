import { $ } from './lib.js?v=5';
import { lang } from './i18n.js?v=13';

const TEXT = {
  en: { button: 'Share the app with a friend', guide: 'Show this QR code to a friend. Scanning it with the camera opens Orbitone right away.', copied: 'The app link was copied. You can also paste it into a message.', alt: 'QR code to open Orbitone' },
  ko: { button: '친구에게 앱 공유하기', guide: '친구에게 이 QR 코드를 보여 주세요. 카메라로 스캔하면 Orbitone이 바로 열려요.', copied: '앱 주소를 복사했어요. 메시지에 붙여 넣어 보낼 수도 있어요.', alt: 'Orbitone 접속 QR 코드' },
  ja: { button: '友だちにアプリを共有', guide: '友だちにこのQRコードを見せてください。カメラで読み取ると、すぐにOrbitoneが開きます。', copied: 'アプリのリンクをコピーしました。メッセージに貼り付けて送ることもできます。', alt: 'Orbitoneを開くQRコード' },
  zh: { button: '与朋友分享应用', guide: '请向朋友出示此二维码。用相机扫描即可直接打开 Orbitone。', copied: '已复制应用链接，也可以粘贴到消息中发送。', alt: '打开 Orbitone 的二维码' },
  es: { button: 'Compartir la app con un amigo', guide: 'Enseña este código QR a un amigo. Al escanearlo con la cámara, Orbitone se abre al instante.', copied: 'Se copió el enlace de la app. También puedes pegarlo en un mensaje.', alt: 'Código QR para abrir Orbitone' },
  fr: { button: 'Partager l’app avec un ami', guide: 'Montrez ce code QR à un ami. En le scannant avec l’appareil photo, il ouvre Orbitone aussitôt.', copied: 'Le lien de l’app a été copié. Vous pouvez aussi le coller dans un message.', alt: 'Code QR pour ouvrir Orbitone' },
  de: { button: 'App mit einem Freund teilen', guide: 'Zeig diesen QR-Code einem Freund. Mit der Kamera gescannt, öffnet sich Orbitone sofort.', copied: 'Der App-Link wurde kopiert. Du kannst ihn auch in eine Nachricht einfügen.', alt: 'QR-Code zum Öffnen von Orbitone' },
};

export function setupShare(url) {
  const text = TEXT[lang] ?? TEXT.en;
  $('share-app').textContent = text.button;
  $('share-guide').textContent = text.guide;
  $('share-qr').alt = text.alt;
  // The toast sits under a modal dialog, so the confirmation is shown inside it.
  $('share-app').onclick = async () => {
    try { await navigator.clipboard.writeText(url); $('share-status').textContent = text.copied; } catch { $('share-status').textContent = url; }
    $('share-dialog').showModal();
  };
  $('share-dialog').addEventListener('click', () => $('share-dialog').close());
}
