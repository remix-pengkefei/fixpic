#!/usr/bin/env python3
"""Sync all language files to have the same keys as zh-CN"""

import json
import os

# Translations for all missing keys
TRANSLATIONS = {
    "auth.login": {
        "en": "Login", "zh-TW": "登入", "ja": "ログイン", "ko": "로그인",
        "es": "Iniciar sesión", "pt": "Entrar", "fr": "Connexion", "de": "Anmelden",
        "it": "Accedi", "ru": "Войти", "id": "Masuk", "tr": "Giriş", "th": "เข้าสู่ระบบ", "vi": "Đăng nhập"
    },
    "auth.logout": {
        "en": "Logout", "zh-TW": "登出", "ja": "ログアウト", "ko": "로그아웃",
        "es": "Cerrar sesión", "pt": "Sair", "fr": "Déconnexion", "de": "Abmelden",
        "it": "Esci", "ru": "Выйти", "id": "Keluar", "tr": "Çıkış", "th": "ออกจากระบบ", "vi": "Đăng xuất"
    },
    "auth.email": {
        "en": "Email", "zh-TW": "電子郵件", "ja": "メール", "ko": "이메일",
        "es": "Correo electrónico", "pt": "E-mail", "fr": "E-mail", "de": "E-Mail",
        "it": "Email", "ru": "Эл. почта", "id": "Email", "tr": "E-posta", "th": "อีเมล", "vi": "Email"
    },
    "auth.emailHint": {
        "en": "Enter email to get verification code", "zh-TW": "輸入郵箱獲取驗證碼",
        "ja": "認証コードを取得するためにメールを入力", "ko": "인증 코드를 받으려면 이메일을 입력하세요",
        "es": "Ingrese su correo para obtener el código", "pt": "Digite o e-mail para obter o código",
        "fr": "Entrez votre e-mail pour obtenir le code", "de": "E-Mail eingeben um Code zu erhalten",
        "it": "Inserisci email per ottenere il codice", "ru": "Введите email для получения кода",
        "id": "Masukkan email untuk mendapatkan kode", "tr": "Kod almak için e-posta girin",
        "th": "ป้อนอีเมลเพื่อรับรหัสยืนยัน", "vi": "Nhập email để nhận mã xác nhận"
    },
    "auth.sendCode": {
        "en": "Send Code", "zh-TW": "發送驗證碼", "ja": "コードを送信", "ko": "코드 전송",
        "es": "Enviar código", "pt": "Enviar código", "fr": "Envoyer le code", "de": "Code senden",
        "it": "Invia codice", "ru": "Отправить код", "id": "Kirim Kode", "tr": "Kod Gönder",
        "th": "ส่งรหัส", "vi": "Gửi mã"
    },
    "auth.codeSentTo": {
        "en": "Code sent to {{email}}", "zh-TW": "驗證碼已發送至 {{email}}",
        "ja": "{{email}} にコードを送信しました", "ko": "{{email}}로 코드 전송됨",
        "es": "Código enviado a {{email}}", "pt": "Código enviado para {{email}}",
        "fr": "Code envoyé à {{email}}", "de": "Code gesendet an {{email}}",
        "it": "Codice inviato a {{email}}", "ru": "Код отправлен на {{email}}",
        "id": "Kode dikirim ke {{email}}", "tr": "Kod {{email}} adresine gönderildi",
        "th": "ส่งรหัสไปที่ {{email}}", "vi": "Mã đã gửi đến {{email}}"
    },
    "auth.resendCode": {
        "en": "Resend Code", "zh-TW": "重新發送", "ja": "再送信", "ko": "재전송",
        "es": "Reenviar código", "pt": "Reenviar código", "fr": "Renvoyer le code", "de": "Erneut senden",
        "it": "Rinvia codice", "ru": "Отправить снова", "id": "Kirim Ulang", "tr": "Tekrar Gönder",
        "th": "ส่งรหัสอีกครั้ง", "vi": "Gửi lại mã"
    },
    "auth.changeEmail": {
        "en": "Change Email", "zh-TW": "更換郵箱", "ja": "メールを変更", "ko": "이메일 변경",
        "es": "Cambiar correo", "pt": "Alterar e-mail", "fr": "Changer d'e-mail", "de": "E-Mail ändern",
        "it": "Cambia email", "ru": "Изменить email", "id": "Ubah Email", "tr": "E-posta Değiştir",
        "th": "เปลี่ยนอีเมล", "vi": "Đổi email"
    },
    "auth.verify": {
        "en": "Verify", "zh-TW": "驗證", "ja": "確認", "ko": "확인",
        "es": "Verificar", "pt": "Verificar", "fr": "Vérifier", "de": "Bestätigen",
        "it": "Verifica", "ru": "Подтвердить", "id": "Verifikasi", "tr": "Doğrula",
        "th": "ยืนยัน", "vi": "Xác nhận"
    },
    "auth.verifying": {
        "en": "Verifying...", "zh-TW": "驗證中...", "ja": "確認中...", "ko": "확인 중...",
        "es": "Verificando...", "pt": "Verificando...", "fr": "Vérification...", "de": "Überprüfung...",
        "it": "Verifica in corso...", "ru": "Проверка...", "id": "Memverifikasi...", "tr": "Doğrulanıyor...",
        "th": "กำลังยืนยัน...", "vi": "Đang xác nhận..."
    },
    "auth.codeRequired": {
        "en": "Please enter the code", "zh-TW": "請輸入驗證碼", "ja": "コードを入力してください", "ko": "코드를 입력하세요",
        "es": "Por favor ingrese el código", "pt": "Por favor insira o código", "fr": "Veuillez entrer le code",
        "de": "Bitte Code eingeben", "it": "Inserisci il codice", "ru": "Введите код",
        "id": "Masukkan kode", "tr": "Lütfen kodu girin", "th": "กรุณากรอกรหัส", "vi": "Vui lòng nhập mã"
    },
    "auth.loginRequired": {
        "en": "Please login to continue", "zh-TW": "請登入後繼續", "ja": "続行するにはログインしてください",
        "ko": "계속하려면 로그인하세요", "es": "Por favor inicie sesión para continuar",
        "pt": "Por favor faça login para continuar", "fr": "Veuillez vous connecter pour continuer",
        "de": "Bitte anmelden um fortzufahren", "it": "Accedi per continuare",
        "ru": "Войдите для продолжения", "id": "Silakan masuk untuk melanjutkan",
        "tr": "Devam etmek için giriş yapın", "th": "กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ", "vi": "Vui lòng đăng nhập để tiếp tục"
    },
    "auth.loginToSave": {
        "en": "Login to save history", "zh-TW": "登入後可保存歷史記錄", "ja": "履歴を保存するにはログイン",
        "ko": "기록을 저장하려면 로그인", "es": "Inicie sesión para guardar historial",
        "pt": "Faça login para salvar histórico", "fr": "Connectez-vous pour sauvegarder l'historique",
        "de": "Anmelden um Verlauf zu speichern", "it": "Accedi per salvare la cronologia",
        "ru": "Войдите для сохранения истории", "id": "Masuk untuk menyimpan riwayat",
        "tr": "Geçmişi kaydetmek için giriş yapın", "th": "เข้าสู่ระบบเพื่อบันทึกประวัติ", "vi": "Đăng nhập để lưu lịch sử"
    },
    "user.history": {
        "en": "History", "zh-TW": "歷史記錄", "ja": "履歴", "ko": "기록",
        "es": "Historial", "pt": "Histórico", "fr": "Historique", "de": "Verlauf",
        "it": "Cronologia", "ru": "История", "id": "Riwayat", "tr": "Geçmiş", "th": "ประวัติ", "vi": "Lịch sử"
    },
    "user.settings": {
        "en": "Settings", "zh-TW": "設定", "ja": "設定", "ko": "설정",
        "es": "Configuración", "pt": "Configurações", "fr": "Paramètres", "de": "Einstellungen",
        "it": "Impostazioni", "ru": "Настройки", "id": "Pengaturan", "tr": "Ayarlar", "th": "การตั้งค่า", "vi": "Cài đặt"
    },
    "user.logout": {
        "en": "Logout", "zh-TW": "登出", "ja": "ログアウト", "ko": "로그아웃",
        "es": "Cerrar sesión", "pt": "Sair", "fr": "Déconnexion", "de": "Abmelden",
        "it": "Esci", "ru": "Выйти", "id": "Keluar", "tr": "Çıkış", "th": "ออกจากระบบ", "vi": "Đăng xuất"
    },
    "user.account": {
        "en": "Account", "zh-TW": "帳戶", "ja": "アカウント", "ko": "계정",
        "es": "Cuenta", "pt": "Conta", "fr": "Compte", "de": "Konto",
        "it": "Account", "ru": "Аккаунт", "id": "Akun", "tr": "Hesap", "th": "บัญชี", "vi": "Tài khoản"
    },
    "history.title": {
        "en": "Processing History", "zh-TW": "處理歷史", "ja": "処理履歴", "ko": "처리 기록",
        "es": "Historial de procesamiento", "pt": "Histórico de processamento", "fr": "Historique de traitement",
        "de": "Verarbeitungsverlauf", "it": "Cronologia elaborazione", "ru": "История обработки",
        "id": "Riwayat Pemrosesan", "tr": "İşlem Geçmişi", "th": "ประวัติการประมวลผล", "vi": "Lịch sử xử lý"
    },
    "history.clearAll": {
        "en": "Clear All", "zh-TW": "清空全部", "ja": "すべて削除", "ko": "모두 지우기",
        "es": "Borrar todo", "pt": "Limpar tudo", "fr": "Tout effacer", "de": "Alle löschen",
        "it": "Cancella tutto", "ru": "Очистить всё", "id": "Hapus Semua", "tr": "Tümünü Temizle",
        "th": "ล้างทั้งหมด", "vi": "Xóa tất cả"
    },
    "history.confirmClear": {
        "en": "Are you sure you want to clear all history?", "zh-TW": "確定要清空所有歷史記錄嗎？",
        "ja": "すべての履歴を削除してもよろしいですか？", "ko": "모든 기록을 삭제하시겠습니까?",
        "es": "¿Está seguro de que desea borrar todo el historial?", "pt": "Tem certeza de que deseja limpar todo o histórico?",
        "fr": "Êtes-vous sûr de vouloir effacer tout l'historique?", "de": "Möchten Sie den gesamten Verlauf wirklich löschen?",
        "it": "Sei sicuro di voler cancellare tutta la cronologia?", "ru": "Вы уверены, что хотите очистить всю историю?",
        "id": "Apakah Anda yakin ingin menghapus semua riwayat?", "tr": "Tüm geçmişi silmek istediğinizden emin misiniz?",
        "th": "คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติทั้งหมด?", "vi": "Bạn có chắc chắn muốn xóa tất cả lịch sử?"
    },
    "history.empty": {
        "en": "No records yet", "zh-TW": "暫無記錄", "ja": "まだ記録がありません", "ko": "아직 기록이 없습니다",
        "es": "Sin registros aún", "pt": "Nenhum registro ainda", "fr": "Aucun enregistrement pour l'instant",
        "de": "Noch keine Einträge", "it": "Nessun record ancora", "ru": "Пока нет записей",
        "id": "Belum ada catatan", "tr": "Henüz kayıt yok", "th": "ยังไม่มีบันทึก", "vi": "Chưa có bản ghi nào"
    },
    "history.emptyHint": {
        "en": "Processed images will appear here", "zh-TW": "處理過的圖片會顯示在這裡", "ja": "処理した画像がここに表示されます",
        "ko": "처리된 이미지가 여기에 표시됩니다", "es": "Las imágenes procesadas aparecerán aquí",
        "pt": "Imagens processadas aparecerão aqui", "fr": "Les images traitées apparaîtront ici",
        "de": "Verarbeitete Bilder werden hier angezeigt", "it": "Le immagini elaborate appariranno qui",
        "ru": "Обработанные изображения появятся здесь", "id": "Gambar yang diproses akan muncul di sini",
        "tr": "İşlenen resimler burada görünecek", "th": "รูปภาพที่ประมวลผลแล้วจะปรากฏที่นี่", "vi": "Hình ảnh đã xử lý sẽ xuất hiện ở đây"
    },
    "history.delete": {
        "en": "Delete", "zh-TW": "刪除", "ja": "削除", "ko": "삭제",
        "es": "Eliminar", "pt": "Excluir", "fr": "Supprimer", "de": "Löschen",
        "it": "Elimina", "ru": "Удалить", "id": "Hapus", "tr": "Sil", "th": "ลบ", "vi": "Xóa"
    },
    "common.loading": {
        "en": "Loading...", "zh-TW": "載入中...", "ja": "読み込み中...", "ko": "로딩 중...",
        "es": "Cargando...", "pt": "Carregando...", "fr": "Chargement...", "de": "Laden...",
        "it": "Caricamento...", "ru": "Загрузка...", "id": "Memuat...", "tr": "Yükleniyor...",
        "th": "กำลังโหลด...", "vi": "Đang tải..."
    },
    "common.delete": {
        "en": "Delete", "zh-TW": "刪除", "ja": "削除", "ko": "삭제",
        "es": "Eliminar", "pt": "Excluir", "fr": "Supprimer", "de": "Löschen",
        "it": "Elimina", "ru": "Удалить", "id": "Hapus", "tr": "Sil", "th": "ลบ", "vi": "Xóa"
    },
    "common.viewAll": {
        "en": "View All", "zh-TW": "查看全部", "ja": "すべて表示", "ko": "모두 보기",
        "es": "Ver todo", "pt": "Ver tudo", "fr": "Voir tout", "de": "Alle anzeigen",
        "it": "Vedi tutto", "ru": "Посмотреть все", "id": "Lihat Semua", "tr": "Tümünü Gör",
        "th": "ดูทั้งหมด", "vi": "Xem tất cả"
    },
    "nav.tools": {
        "en": "Tools", "zh-TW": "工具", "ja": "ツール", "ko": "도구",
        "es": "Herramientas", "pt": "Ferramentas", "fr": "Outils", "de": "Werkzeuge",
        "it": "Strumenti", "ru": "Инструменты", "id": "Alat", "tr": "Araçlar", "th": "เครื่องมือ", "vi": "Công cụ"
    },
    "nav.history": {
        "en": "History", "zh-TW": "歷史記錄", "ja": "履歴", "ko": "기록",
        "es": "Historial", "pt": "Histórico", "fr": "Historique", "de": "Verlauf",
        "it": "Cronologia", "ru": "История", "id": "Riwayat", "tr": "Geçmiş", "th": "ประวัติ", "vi": "Lịch sử"
    },
    "nav.bgRemover": {
        "en": "Background Remover", "zh-TW": "AI抠圖", "ja": "背景除去", "ko": "배경 제거",
        "es": "Quitar Fondo", "pt": "Remover Fundo", "fr": "Supprimer Fond", "de": "Hintergrund entfernen",
        "it": "Rimuovi Sfondo", "ru": "Удаление фона", "id": "Hapus Latar", "tr": "Arka Plan Kaldır",
        "th": "ลบพื้นหลัง", "vi": "Xóa nền"
    },
    "nav.upscaler": {
        "en": "Image Upscaler", "zh-TW": "圖片放大", "ja": "画像拡大", "ko": "이미지 확대",
        "es": "Ampliar Imagen", "pt": "Ampliar Imagem", "fr": "Agrandir Image", "de": "Bild vergrößern",
        "it": "Ingrandisci Immagine", "ru": "Увеличение изображения", "id": "Perbesar Gambar",
        "tr": "Resim Büyüt", "th": "ขยายภาพ", "vi": "Phóng to ảnh"
    },
    "nav.watermarkRemover": {
        "en": "Watermark Remover", "zh-TW": "去水印", "ja": "透かし除去", "ko": "워터마크 제거",
        "es": "Quitar Marca de Agua", "pt": "Remover Marca d'água", "fr": "Supprimer Filigrane",
        "de": "Wasserzeichen entfernen", "it": "Rimuovi Filigrana", "ru": "Удаление водяных знаков",
        "id": "Hapus Watermark", "tr": "Filigran Kaldır", "th": "ลบลายน้ำ", "vi": "Xóa watermark"
    },
    "nav.bgGenerator": {
        "en": "Background Generator", "zh-TW": "背景生成", "ja": "背景生成", "ko": "배경 생성",
        "es": "Generar Fondo", "pt": "Gerar Fundo", "fr": "Générer Fond", "de": "Hintergrund generieren",
        "it": "Genera Sfondo", "ru": "Генерация фона", "id": "Buat Latar", "tr": "Arka Plan Oluştur",
        "th": "สร้างพื้นหลัง", "vi": "Tạo nền"
    },
    "nav.sharpener": {
        "en": "Image Sharpener", "zh-TW": "圖片銳化", "ja": "画像シャープ化", "ko": "이미지 선명화",
        "es": "Enfocar Imagen", "pt": "Nitidez de Imagem", "fr": "Netteté Image", "de": "Bild schärfen",
        "it": "Nitidezza Immagine", "ru": "Повышение резкости", "id": "Pertajam Gambar",
        "tr": "Resim Keskinleştir", "th": "เพิ่มความคมชัด", "vi": "Làm nét ảnh"
    },
    "nav.denoiser": {
        "en": "Image Denoiser", "zh-TW": "圖片降噪", "ja": "ノイズ除去", "ko": "노이즈 제거",
        "es": "Reducir Ruido", "pt": "Reduzir Ruído", "fr": "Réduire Bruit", "de": "Rauschen entfernen",
        "it": "Riduzione Rumore", "ru": "Подавление шума", "id": "Kurangi Noise",
        "tr": "Gürültü Azalt", "th": "ลดสัญญาณรบกวน", "vi": "Khử nhiễu"
    },
    "nav.shadowGen": {
        "en": "Shadow Generator", "zh-TW": "陰影生成", "ja": "影生成", "ko": "그림자 생성",
        "es": "Generar Sombra", "pt": "Gerar Sombra", "fr": "Générer Ombre", "de": "Schatten generieren",
        "it": "Genera Ombra", "ru": "Генерация тени", "id": "Buat Bayangan", "tr": "Gölge Oluştur",
        "th": "สร้างเงา", "vi": "Tạo bóng"
    },
    "nav.smartCrop": {
        "en": "Smart Crop", "zh-TW": "智能裁剪", "ja": "スマートクロップ", "ko": "스마트 자르기",
        "es": "Recorte Inteligente", "pt": "Corte Inteligente", "fr": "Recadrage Intelligent",
        "de": "Intelligenter Zuschnitt", "it": "Ritaglio Intelligente", "ru": "Умная обрезка",
        "id": "Crop Cerdas", "tr": "Akıllı Kırpma", "th": "ครอปอัจฉริยะ", "vi": "Cắt thông minh"
    },
    "nav.extender": {
        "en": "Image Extender", "zh-TW": "圖片擴展", "ja": "画像拡張", "ko": "이미지 확장",
        "es": "Extender Imagen", "pt": "Estender Imagem", "fr": "Étendre Image", "de": "Bild erweitern",
        "it": "Estendi Immagine", "ru": "Расширение изображения", "id": "Perluas Gambar",
        "tr": "Resim Genişlet", "th": "ขยายภาพ", "vi": "Mở rộng ảnh"
    },
    "home.category.remove": {
        "en": "AI Remove", "zh-TW": "AI移除", "ja": "AI削除", "ko": "AI 제거",
        "es": "AI Eliminar", "pt": "AI Remover", "fr": "AI Supprimer", "de": "AI Entfernen",
        "it": "AI Rimuovi", "ru": "AI Удаление", "id": "AI Hapus", "tr": "AI Kaldır",
        "th": "AI ลบ", "vi": "AI Xóa"
    },
    "home.category.enhance": {
        "en": "AI Enhance", "zh-TW": "AI增強", "ja": "AI強化", "ko": "AI 향상",
        "es": "AI Mejorar", "pt": "AI Melhorar", "fr": "AI Améliorer", "de": "AI Verbessern",
        "it": "AI Migliora", "ru": "AI Улучшение", "id": "AI Tingkatkan", "tr": "AI İyileştir",
        "th": "AI ปรับปรุง", "vi": "AI Nâng cao"
    },
    "home.category.generate": {
        "en": "AI Generate", "zh-TW": "AI生成", "ja": "AI生成", "ko": "AI 생성",
        "es": "AI Generar", "pt": "AI Gerar", "fr": "AI Générer", "de": "AI Generieren",
        "it": "AI Genera", "ru": "AI Генерация", "id": "AI Buat", "tr": "AI Oluştur",
        "th": "AI สร้าง", "vi": "AI Tạo"
    },
    "home.category.edit": {
        "en": "Edit Tools", "zh-TW": "編輯工具", "ja": "編集ツール", "ko": "편집 도구",
        "es": "Herramientas de Edición", "pt": "Ferramentas de Edição", "fr": "Outils d'Édition",
        "de": "Bearbeitungswerkzeuge", "it": "Strumenti di Modifica", "ru": "Инструменты редактирования",
        "id": "Alat Edit", "tr": "Düzenleme Araçları", "th": "เครื่องมือแก้ไข", "vi": "Công cụ chỉnh sửa"
    },
    "home.allTools": {
        "en": "All Tools", "zh-TW": "全部工具", "ja": "すべてのツール", "ko": "모든 도구",
        "es": "Todas las Herramientas", "pt": "Todas as Ferramentas", "fr": "Tous les Outils",
        "de": "Alle Werkzeuge", "it": "Tutti gli Strumenti", "ru": "Все инструменты",
        "id": "Semua Alat", "tr": "Tüm Araçlar", "th": "เครื่องมือทั้งหมด", "vi": "Tất cả công cụ"
    },
    "home.showcase.title": {
        "en": "See the Magic", "zh-TW": "效果展示", "ja": "効果を見る", "ko": "효과 보기",
        "es": "Ver la Magia", "pt": "Veja a Mágica", "fr": "Voir la Magie", "de": "Sehen Sie die Magie",
        "it": "Guarda la Magia", "ru": "Смотрите результат", "id": "Lihat Keajaiban",
        "tr": "Büyüyü Görün", "th": "ดูความมหัศจรรย์", "vi": "Xem phép thuật"
    },
    "home.showcase.before": {
        "en": "Before", "zh-TW": "處理前", "ja": "処理前", "ko": "처리 전",
        "es": "Antes", "pt": "Antes", "fr": "Avant", "de": "Vorher",
        "it": "Prima", "ru": "До", "id": "Sebelum", "tr": "Önce", "th": "ก่อน", "vi": "Trước"
    },
    "home.showcase.after": {
        "en": "After", "zh-TW": "處理後", "ja": "処理後", "ko": "처리 후",
        "es": "Después", "pt": "Depois", "fr": "Après", "de": "Nachher",
        "it": "Dopo", "ru": "После", "id": "Sesudah", "tr": "Sonra", "th": "หลัง", "vi": "Sau"
    },
    "home.dashboard.welcome": {
        "en": "Welcome back, {{name}}!", "zh-TW": "歡迎回來，{{name}}！", "ja": "おかえりなさい、{{name}}！",
        "ko": "환영합니다, {{name}}!", "es": "¡Bienvenido de nuevo, {{name}}!",
        "pt": "Bem-vindo de volta, {{name}}!", "fr": "Bienvenue, {{name}}!",
        "de": "Willkommen zurück, {{name}}!", "it": "Bentornato, {{name}}!",
        "ru": "С возвращением, {{name}}!", "id": "Selamat datang kembali, {{name}}!",
        "tr": "Tekrar hoş geldiniz, {{name}}!", "th": "ยินดีต้อนรับกลับ, {{name}}!", "vi": "Chào mừng trở lại, {{name}}!"
    },
    "home.dashboard.desc": {
        "en": "Select a tool to start", "zh-TW": "選擇工具開始處理", "ja": "ツールを選択して開始",
        "ko": "시작할 도구를 선택하세요", "es": "Seleccione una herramienta para comenzar",
        "pt": "Selecione uma ferramenta para começar", "fr": "Sélectionnez un outil pour commencer",
        "de": "Wählen Sie ein Werkzeug aus", "it": "Seleziona uno strumento per iniziare",
        "ru": "Выберите инструмент для начала", "id": "Pilih alat untuk memulai",
        "tr": "Başlamak için bir araç seçin", "th": "เลือกเครื่องมือเพื่อเริ่มต้น", "vi": "Chọn công cụ để bắt đầu"
    },
    "home.dashboard.tools": {
        "en": "Image Tools", "zh-TW": "圖片工具", "ja": "画像ツール", "ko": "이미지 도구",
        "es": "Herramientas de Imagen", "pt": "Ferramentas de Imagem", "fr": "Outils d'Image",
        "de": "Bildwerkzeuge", "it": "Strumenti Immagine", "ru": "Инструменты для изображений",
        "id": "Alat Gambar", "tr": "Görsel Araçları", "th": "เครื่องมือรูปภาพ", "vi": "Công cụ hình ảnh"
    },
    "home.dashboard.recentHistory": {
        "en": "Recent History", "zh-TW": "最近處理", "ja": "最近の履歴", "ko": "최근 기록",
        "es": "Historial Reciente", "pt": "Histórico Recente", "fr": "Historique Récent",
        "de": "Kürzlicher Verlauf", "it": "Cronologia Recente", "ru": "Недавняя история",
        "id": "Riwayat Terbaru", "tr": "Son Geçmiş", "th": "ประวัติล่าสุด", "vi": "Lịch sử gần đây"
    },
    "home.dashboard.viewHistory": {
        "en": "View all processing history", "zh-TW": "查看所有處理歷史", "ja": "すべての処理履歴を表示",
        "ko": "모든 처리 기록 보기", "es": "Ver todo el historial de procesamiento",
        "pt": "Ver todo o histórico de processamento", "fr": "Voir tout l'historique de traitement",
        "de": "Gesamten Verarbeitungsverlauf anzeigen", "it": "Visualizza tutta la cronologia di elaborazione",
        "ru": "Просмотреть всю историю обработки", "id": "Lihat semua riwayat pemrosesan",
        "tr": "Tüm işlem geçmişini görüntüle", "th": "ดูประวัติการประมวลผลทั้งหมด", "vi": "Xem tất cả lịch sử xử lý"
    },
    "home.tools.bgRemover.title": {
        "en": "AI Background Remover", "zh-TW": "AI智能抠圖", "ja": "AI背景除去", "ko": "AI 배경 제거",
        "es": "Eliminador de Fondo AI", "pt": "Removedor de Fundo AI", "fr": "Suppresseur de Fond AI",
        "de": "AI Hintergrundentferner", "it": "Rimuovi Sfondo AI", "ru": "AI Удаление фона",
        "id": "Penghapus Latar AI", "tr": "AI Arka Plan Kaldırıcı", "th": "AI ลบพื้นหลัง", "vi": "AI Xóa nền"
    },
    "home.tools.bgRemover.desc": {
        "en": "Automatically remove image background with AI", "zh-TW": "一鍵自動識別並移除圖片背景",
        "ja": "AIで自動的に画像の背景を削除", "ko": "AI로 자동으로 이미지 배경 제거",
        "es": "Elimina automáticamente el fondo de la imagen con IA", "pt": "Remova automaticamente o fundo da imagem com IA",
        "fr": "Supprimez automatiquement le fond de l'image avec l'IA", "de": "Hintergrund automatisch mit KI entfernen",
        "it": "Rimuovi automaticamente lo sfondo con AI", "ru": "Автоматически удаляйте фон изображения с помощью ИИ",
        "id": "Hapus latar belakang gambar secara otomatis dengan AI", "tr": "AI ile görsel arka planını otomatik olarak kaldırın",
        "th": "ลบพื้นหลังภาพอัตโนมัติด้วย AI", "vi": "Tự động xóa nền ảnh bằng AI"
    },
    "home.tools.bgRemover.shortDesc": {
        "en": "Remove background with one click", "zh-TW": "一鍵移除背景", "ja": "ワンクリックで背景削除",
        "ko": "원클릭 배경 제거", "es": "Eliminar fondo con un clic", "pt": "Remover fundo com um clique",
        "fr": "Supprimer le fond en un clic", "de": "Hintergrund mit einem Klick entfernen",
        "it": "Rimuovi sfondo con un clic", "ru": "Удалить фон одним кликом",
        "id": "Hapus latar dengan satu klik", "tr": "Tek tıkla arka planı kaldır",
        "th": "ลบพื้นหลังด้วยคลิกเดียว", "vi": "Xóa nền chỉ với một cú nhấp"
    },
    "home.tools.upscaler.title": {
        "en": "AI Image Upscaler", "zh-TW": "AI圖片放大", "ja": "AI画像拡大", "ko": "AI 이미지 확대",
        "es": "Ampliador de Imagen AI", "pt": "Ampliador de Imagem AI", "fr": "Agrandisseur d'Image AI",
        "de": "AI Bildvergrößerer", "it": "Ingranditore Immagine AI", "ru": "AI Увеличение изображения",
        "id": "Pembesar Gambar AI", "tr": "AI Görsel Büyütücü", "th": "AI ขยายภาพ", "vi": "AI Phóng to ảnh"
    },
    "home.tools.upscaler.desc": {
        "en": "Upscale images up to 4x with AI while keeping clarity", "zh-TW": "使用AI技術將低解析度圖片放大2-4倍",
        "ja": "AIで画質を保ちながら画像を最大4倍に拡大", "ko": "AI로 선명도를 유지하면서 최대 4배 확대",
        "es": "Amplíe imágenes hasta 4x con IA manteniendo la claridad", "pt": "Amplie imagens até 4x com IA mantendo a clareza",
        "fr": "Agrandissez les images jusqu'à 4x avec l'IA", "de": "Bilder mit KI bis zu 4x vergrößern",
        "it": "Ingrandisci le immagini fino a 4x con AI", "ru": "Увеличивайте изображения до 4x с помощью ИИ",
        "id": "Perbesar gambar hingga 4x dengan AI", "tr": "AI ile görüntüleri 4x'e kadar büyütün",
        "th": "ขยายภาพได้สูงสุด 4 เท่าด้วย AI", "vi": "Phóng to ảnh lên đến 4x với AI"
    },
    "home.tools.upscaler.shortDesc": {
        "en": "Enlarge images up to 4x", "zh-TW": "放大圖片至4倍", "ja": "最大4倍に拡大", "ko": "최대 4배 확대",
        "es": "Ampliar hasta 4x", "pt": "Ampliar até 4x", "fr": "Agrandir jusqu'à 4x", "de": "Bis zu 4x vergrößern",
        "it": "Ingrandisci fino a 4x", "ru": "Увеличить до 4x", "id": "Perbesar hingga 4x",
        "tr": "4x'e kadar büyüt", "th": "ขยายสูงสุด 4 เท่า", "vi": "Phóng to lên đến 4x"
    },
    "home.tools.watermarkRemover.shortDesc": {
        "en": "Remove watermarks smartly", "zh-TW": "智能移除水印", "ja": "スマートに透かしを削除", "ko": "스마트 워터마크 제거",
        "es": "Eliminar marcas de agua inteligentemente", "pt": "Remover marcas d'água de forma inteligente",
        "fr": "Supprimer les filigranes intelligemment", "de": "Wasserzeichen intelligent entfernen",
        "it": "Rimuovi filigrane in modo intelligente", "ru": "Умное удаление водяных знаков",
        "id": "Hapus watermark dengan cerdas", "tr": "Filigranları akıllıca kaldır",
        "th": "ลบลายน้ำอย่างชาญฉลาด", "vi": "Xóa watermark thông minh"
    },
    "home.tools.bgGenerator.title": {
        "en": "AI Background Generator", "zh-TW": "AI背景生成", "ja": "AI背景生成", "ko": "AI 배경 생성",
        "es": "Generador de Fondo AI", "pt": "Gerador de Fundo AI", "fr": "Générateur de Fond AI",
        "de": "AI Hintergrundgenerator", "it": "Generatore Sfondo AI", "ru": "AI Генератор фона",
        "id": "Generator Latar AI", "tr": "AI Arka Plan Oluşturucu", "th": "AI สร้างพื้นหลัง", "vi": "AI Tạo nền"
    },
    "home.tools.bgGenerator.desc": {
        "en": "Generate professional backgrounds for product photos", "zh-TW": "為抠圖後的圖片生成專業的產品背景",
        "ja": "商品写真用のプロフェッショナルな背景を生成", "ko": "제품 사진용 전문 배경 생성",
        "es": "Genera fondos profesionales para fotos de productos", "pt": "Gere fundos profissionais para fotos de produtos",
        "fr": "Générez des arrière-plans professionnels pour les photos de produits", "de": "Professionelle Hintergründe für Produktfotos generieren",
        "it": "Genera sfondi professionali per foto di prodotti", "ru": "Создавайте профессиональные фоны для фотографий продуктов",
        "id": "Buat latar belakang profesional untuk foto produk", "tr": "Ürün fotoğrafları için profesyonel arka planlar oluşturun",
        "th": "สร้างพื้นหลังมืออาชีพสำหรับภาพสินค้า", "vi": "Tạo nền chuyên nghiệp cho ảnh sản phẩm"
    },
    "home.tools.bgGenerator.shortDesc": {
        "en": "Generate professional backgrounds", "zh-TW": "生成專業背景", "ja": "プロの背景を生成", "ko": "전문 배경 생성",
        "es": "Generar fondos profesionales", "pt": "Gerar fundos profissionais", "fr": "Générer des fonds professionnels",
        "de": "Professionelle Hintergründe generieren", "it": "Genera sfondi professionali", "ru": "Генерация профессиональных фонов",
        "id": "Buat latar profesional", "tr": "Profesyonel arka planlar oluştur",
        "th": "สร้างพื้นหลังมืออาชีพ", "vi": "Tạo nền chuyên nghiệp"
    },
    "home.tools.sharpener.title": {
        "en": "AI Image Sharpener", "zh-TW": "AI圖片銳化", "ja": "AI画像シャープ化", "ko": "AI 이미지 선명화",
        "es": "Enfocador de Imagen AI", "pt": "Nitidez de Imagem AI", "fr": "Netteté d'Image AI",
        "de": "AI Bildschärfer", "it": "Nitidezza Immagine AI", "ru": "AI Повышение резкости",
        "id": "Penajam Gambar AI", "tr": "AI Görsel Keskinleştirici", "th": "AI เพิ่มความคมชัด", "vi": "AI Làm nét ảnh"
    },
    "home.tools.sharpener.desc": {
        "en": "Enhance blurry image clarity and details", "zh-TW": "增強模糊圖片的清晰度和細節",
        "ja": "ぼやけた画像の鮮明さと詳細を向上", "ko": "흐릿한 이미지의 선명도와 세부 사항 향상",
        "es": "Mejora la claridad y los detalles de imágenes borrosas", "pt": "Melhore a clareza e os detalhes de imagens borradas",
        "fr": "Améliorez la clarté et les détails des images floues", "de": "Verbessern Sie Klarheit und Details unscharfer Bilder",
        "it": "Migliora la chiarezza e i dettagli delle immagini sfocate", "ru": "Улучшите четкость и детали размытых изображений",
        "id": "Tingkatkan kejernihan dan detail gambar buram", "tr": "Bulanık görsel netliğini ve detaylarını artırın",
        "th": "เพิ่มความชัดเจนและรายละเอียดของภาพเบลอ", "vi": "Tăng cường độ rõ nét và chi tiết của ảnh mờ"
    },
    "home.tools.sharpener.shortDesc": {
        "en": "Sharpen blurry images", "zh-TW": "增強圖片清晰度", "ja": "ぼやけた画像をシャープに", "ko": "흐릿한 이미지 선명화",
        "es": "Enfocar imágenes borrosas", "pt": "Nitidez de imagens borradas", "fr": "Améliorer les images floues",
        "de": "Unscharfe Bilder schärfen", "it": "Rendi nitide le immagini sfocate", "ru": "Сделать размытые изображения четче",
        "id": "Pertajam gambar buram", "tr": "Bulanık görselleri keskinleştir",
        "th": "เพิ่มความคมชัดให้ภาพเบลอ", "vi": "Làm nét ảnh mờ"
    },
    "home.tools.denoiser.title": {
        "en": "AI Image Denoiser", "zh-TW": "AI圖片降噪", "ja": "AIノイズ除去", "ko": "AI 노이즈 제거",
        "es": "Reductor de Ruido AI", "pt": "Redutor de Ruído AI", "fr": "Réducteur de Bruit AI",
        "de": "AI Rauschentferner", "it": "Riduttore Rumore AI", "ru": "AI Подавление шума",
        "id": "Pengurang Noise AI", "tr": "AI Gürültü Azaltıcı", "th": "AI ลดสัญญาณรบกวน", "vi": "AI Khử nhiễu"
    },
    "home.tools.denoiser.desc": {
        "en": "Remove noise and grain from images", "zh-TW": "移除圖片中的噪點和顆粒",
        "ja": "画像からノイズと粒子を除去", "ko": "이미지에서 노이즈와 그레인 제거",
        "es": "Elimina el ruido y el grano de las imágenes", "pt": "Remova ruído e granulação das imagens",
        "fr": "Supprimez le bruit et le grain des images", "de": "Rauschen und Körnung aus Bildern entfernen",
        "it": "Rimuovi rumore e grana dalle immagini", "ru": "Удалите шум и зернистость с изображений",
        "id": "Hapus noise dan grain dari gambar", "tr": "Görüntülerden gürültü ve grenini kaldırın",
        "th": "ลบสัญญาณรบกวนและเกรนจากภาพ", "vi": "Loại bỏ nhiễu và hạt từ ảnh"
    },
    "home.tools.denoiser.shortDesc": {
        "en": "Remove image noise", "zh-TW": "移除圖片噪點", "ja": "画像ノイズを除去", "ko": "이미지 노이즈 제거",
        "es": "Eliminar ruido de imagen", "pt": "Remover ruído de imagem", "fr": "Supprimer le bruit d'image",
        "de": "Bildrauschen entfernen", "it": "Rimuovi rumore immagine", "ru": "Удалить шум изображения",
        "id": "Hapus noise gambar", "tr": "Görsel gürültüsünü kaldır",
        "th": "ลบสัญญาณรบกวนในภาพ", "vi": "Loại bỏ nhiễu ảnh"
    },
    "home.tools.shadowGen.title": {
        "en": "AI Shadow Generator", "zh-TW": "AI陰影生成", "ja": "AI影生成", "ko": "AI 그림자 생성",
        "es": "Generador de Sombras AI", "pt": "Gerador de Sombras AI", "fr": "Générateur d'Ombres AI",
        "de": "AI Schattengenerator", "it": "Generatore Ombre AI", "ru": "AI Генератор теней",
        "id": "Generator Bayangan AI", "tr": "AI Gölge Oluşturucu", "th": "AI สร้างเงา", "vi": "AI Tạo bóng"
    },
    "home.tools.shadowGen.desc": {
        "en": "Add realistic shadows to product images", "zh-TW": "為產品圖片添加自然真實的陰影效果",
        "ja": "商品画像にリアルな影を追加", "ko": "제품 이미지에 사실적인 그림자 추가",
        "es": "Añade sombras realistas a las imágenes de productos", "pt": "Adicione sombras realistas às imagens de produtos",
        "fr": "Ajoutez des ombres réalistes aux images de produits", "de": "Realistische Schatten zu Produktbildern hinzufügen",
        "it": "Aggiungi ombre realistiche alle immagini dei prodotti", "ru": "Добавьте реалистичные тени к изображениям продуктов",
        "id": "Tambahkan bayangan realistis ke gambar produk", "tr": "Ürün görsellerine gerçekçi gölgeler ekleyin",
        "th": "เพิ่มเงาที่สมจริงให้กับภาพสินค้า", "vi": "Thêm bóng chân thực cho ảnh sản phẩm"
    },
    "home.tools.shadowGen.shortDesc": {
        "en": "Add realistic shadows", "zh-TW": "添加自然陰影", "ja": "リアルな影を追加", "ko": "사실적인 그림자 추가",
        "es": "Añadir sombras realistas", "pt": "Adicionar sombras realistas", "fr": "Ajouter des ombres réalistes",
        "de": "Realistische Schatten hinzufügen", "it": "Aggiungi ombre realistiche", "ru": "Добавить реалистичные тени",
        "id": "Tambahkan bayangan realistis", "tr": "Gerçekçi gölgeler ekle",
        "th": "เพิ่มเงาที่สมจริง", "vi": "Thêm bóng chân thực"
    },
    "home.tools.smartCrop.title": {
        "en": "AI Smart Crop", "zh-TW": "AI智能裁剪", "ja": "AIスマートクロップ", "ko": "AI 스마트 자르기",
        "es": "Recorte Inteligente AI", "pt": "Corte Inteligente AI", "fr": "Recadrage Intelligent AI",
        "de": "AI Intelligenter Zuschnitt", "it": "Ritaglio Intelligente AI", "ru": "AI Умная обрезка",
        "id": "Crop Cerdas AI", "tr": "AI Akıllı Kırpma", "th": "AI ครอปอัจฉริยะ", "vi": "AI Cắt thông minh"
    },
    "home.tools.smartCrop.desc": {
        "en": "Automatically crop to the best composition", "zh-TW": "智能識別主體，自動裁剪到最佳構圖",
        "ja": "最適な構図に自動的にクロップ", "ko": "최적의 구도로 자동 자르기",
        "es": "Recorta automáticamente a la mejor composición", "pt": "Corte automaticamente para a melhor composição",
        "fr": "Recadrez automatiquement vers la meilleure composition", "de": "Automatisch auf die beste Komposition zuschneiden",
        "it": "Ritaglia automaticamente alla migliore composizione", "ru": "Автоматическая обрезка до лучшей композиции",
        "id": "Crop otomatis ke komposisi terbaik", "tr": "En iyi kompozisyona otomatik kırp",
        "th": "ครอปอัตโนมัติเป็นองค์ประกอบที่ดีที่สุด", "vi": "Tự động cắt theo bố cục tốt nhất"
    },
    "home.tools.smartCrop.shortDesc": {
        "en": "AI-powered smart cropping", "zh-TW": "智能識別裁剪", "ja": "AIスマートクロップ", "ko": "AI 스마트 자르기",
        "es": "Recorte inteligente con IA", "pt": "Corte inteligente com IA", "fr": "Recadrage intelligent par IA",
        "de": "KI-gestütztes intelligentes Zuschneiden", "it": "Ritaglio intelligente con IA", "ru": "Умная обрезка на основе ИИ",
        "id": "Crop cerdas berbasis AI", "tr": "AI destekli akıllı kırpma",
        "th": "ครอปอัจฉริยะด้วย AI", "vi": "Cắt thông minh bằng AI"
    },
    "home.tools.extender.title": {
        "en": "AI Image Extender", "zh-TW": "AI圖片擴展", "ja": "AI画像拡張", "ko": "AI 이미지 확장",
        "es": "Extensor de Imagen AI", "pt": "Extensor de Imagem AI", "fr": "Extenseur d'Image AI",
        "de": "AI Bilderweiterer", "it": "Estensore Immagine AI", "ru": "AI Расширение изображения",
        "id": "Pemerluas Gambar AI", "tr": "AI Görsel Genişletici", "th": "AI ขยายภาพ", "vi": "AI Mở rộng ảnh"
    },
    "home.tools.extender.desc": {
        "en": "Extend image borders with AI-generated content", "zh-TW": "智能擴展圖片邊界，生成自然延伸內容",
        "ja": "AIが生成したコンテンツで画像の境界を拡張", "ko": "AI 생성 콘텐츠로 이미지 경계 확장",
        "es": "Extiende los bordes de la imagen con contenido generado por IA", "pt": "Estenda as bordas da imagem com conteúdo gerado por IA",
        "fr": "Étendez les bords de l'image avec du contenu généré par IA", "de": "Bildränder mit KI-generiertem Inhalt erweitern",
        "it": "Estendi i bordi dell'immagine con contenuto generato da AI", "ru": "Расширяйте границы изображения с помощью ИИ-контента",
        "id": "Perluas batas gambar dengan konten yang dihasilkan AI", "tr": "Görsel sınırlarını AI tarafından oluşturulan içerikle genişletin",
        "th": "ขยายขอบภาพด้วยเนื้อหาที่สร้างโดย AI", "vi": "Mở rộng viền ảnh với nội dung do AI tạo"
    },
    "home.tools.extender.shortDesc": {
        "en": "Extend image borders", "zh-TW": "擴展圖片邊界", "ja": "画像の境界を拡張", "ko": "이미지 경계 확장",
        "es": "Extender bordes de imagen", "pt": "Estender bordas da imagem", "fr": "Étendre les bords de l'image",
        "de": "Bildränder erweitern", "it": "Estendi bordi immagine", "ru": "Расширить границы изображения",
        "id": "Perluas batas gambar", "tr": "Görsel sınırlarını genişlet",
        "th": "ขยายขอบภาพ", "vi": "Mở rộng viền ảnh"
    },
}

def set_nested(data, key, value):
    """Set a nested key in dictionary"""
    keys = key.split('.')
    d = data
    for k in keys[:-1]:
        if k not in d:
            d[k] = {}
        d = d[k]
    d[keys[-1]] = value

def get_nested(data, key):
    """Get a nested key from dictionary"""
    keys = key.split('.')
    d = data
    for k in keys:
        if k not in d:
            return None
        d = d[k]
    return d

def sync_language(lang):
    """Sync a language file with all translations"""
    filepath = f'{lang}.json'
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    updated = 0
    for key, translations in TRANSLATIONS.items():
        if lang in translations and get_nested(data, key) is None:
            set_nested(data, key, translations[lang])
            updated += 1

    if updated > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"{lang}: added {updated} translations")
    else:
        print(f"{lang}: no updates needed")

    return updated

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    langs = ['en', 'zh-TW', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'id', 'tr', 'th', 'vi']
    total = 0

    print("Syncing translations...\n")
    for lang in langs:
        try:
            total += sync_language(lang)
        except Exception as e:
            print(f"{lang}: error - {e}")

    print(f"\n✅ Total: {total} translations added")
