#!/usr/bin/env python3
"""Add SEO translations for Asian and other languages."""
import json
import os

ASIAN_TRANSLATIONS = {
    "id": {
        "bgRemover": {
            "seo": {
                "title": "AI Hapus Latar Belakang - Alat Online Gratis | FixPic",
                "description": "Penghapus latar belakang AI gratis. Hapus latar belakang gambar secara instan.",
                "keywords": "hapus latar belakang,hilangkan background,AI background,transparan"
            },
            "instructions": {"step1": "Unggah gambar dengan latar belakang", "step2": "AI mendeteksi subjek otomatis", "step3": "Latar belakang dihapus seketika", "step4": "Unduh PNG transparan"}
        },
        "upscaler": {
            "seo": {
                "title": "AI Perbesar Gambar - Tingkatkan Resolusi hingga 4x | FixPic",
                "description": "Pembesar gambar AI gratis. Tingkatkan resolusi hingga 4x dengan menjaga kualitas.",
                "keywords": "perbesar gambar,tingkatkan resolusi,AI upscale"
            },
            "instructions": {"step1": "Unggah gambar resolusi rendah", "step2": "Pilih faktor pembesaran", "step3": "AI meningkatkan dan memperbesar", "step4": "Unduh gambar HD"}
        },
        "sharpener": {
            "seo": {
                "title": "AI Tajamkan Gambar - Perbaiki Foto Buram | FixPic",
                "description": "Alat penajam gambar AI gratis. Perbaiki foto buram dan tingkatkan ketajaman.",
                "keywords": "tajamkan gambar,perbaiki foto buram,AI ketajaman"
            },
            "instructions": {"step1": "Unggah gambar buram", "step2": "AI menganalisis keburaman", "step3": "Gambar ditajamkan otomatis", "step4": "Unduh gambar tajam"}
        },
        "denoiser": {
            "seo": {
                "title": "AI Hapus Noise Gambar - Hilangkan Grain dari Foto | FixPic",
                "description": "Alat penghapus noise AI gratis. Hilangkan noise dan grain dari foto.",
                "keywords": "hapus noise,hilangkan grain,AI denoiser"
            },
            "instructions": {"step1": "Unggah gambar bernoise", "step2": "AI mendeteksi pola noise", "step3": "Noise dihapus, detail dipertahankan", "step4": "Unduh gambar bersih"}
        },
        "bgGenerator": {
            "seo": {
                "title": "AI Generator Latar Belakang - Buat Background Profesional | FixPic",
                "description": "Generator latar belakang AI gratis. Buat background profesional untuk foto produk.",
                "keywords": "generator background,AI latar belakang,buat background"
            },
            "instructions": {"step1": "Unggah gambar produk", "step2": "Deskripsikan background yang diinginkan", "step3": "AI menghasilkan background profesional", "step4": "Unduh gambar final"}
        },
        "shadowGen": {
            "seo": {
                "title": "AI Generator Bayangan - Tambahkan Bayangan Realistis | FixPic",
                "description": "Generator bayangan AI gratis. Tambahkan bayangan alami dan realistis.",
                "keywords": "tambah bayangan,generator bayangan,AI bayangan"
            },
            "instructions": {"step1": "Unggah gambar crop", "step2": "Pilih jenis bayangan", "step3": "AI menghasilkan bayangan realistis", "step4": "Unduh gambar dengan bayangan"}
        },
        "extender": {
            "seo": {
                "title": "AI Perluas Gambar - Perlebar Batas Gambar | FixPic",
                "description": "Alat perluasan gambar AI gratis. Perlebar batas dengan konten yang dihasilkan.",
                "keywords": "perluas gambar,AI outpainting,perlebar batas"
            },
            "instructions": {"step1": "Unggah gambar untuk diperluas", "step2": "Pilih arah perluasan", "step3": "AI menghasilkan konten yang cocok", "step4": "Unduh gambar yang diperluas"}
        },
        "smartCrop": {
            "seo": {
                "title": "AI Smart Crop - Potong ke Komposisi Terbaik | FixPic",
                "description": "Alat smart crop AI gratis. Potong otomatis ke komposisi optimal.",
                "keywords": "smart crop,AI potong,auto crop"
            },
            "instructions": {"step1": "Unggah gambar untuk dipotong", "step2": "Pilih rasio aspek target", "step3": "AI mendeteksi subjek dan memotong", "step4": "Unduh gambar terpotong"}
        }
    },
    "tr": {
        "bgRemover": {
            "seo": {
                "title": "AI Arka Plan Kaldırma - Ücretsiz Çevrimiçi Araç | FixPic",
                "description": "Ücretsiz AI arka plan kaldırıcı. Görüntü arka planlarını anında kaldırın.",
                "keywords": "arka plan kaldır,background sil,AI arka plan,şeffaf"
            },
            "instructions": {"step1": "Arka planlı görüntü yükleyin", "step2": "AI konuyu otomatik algılar", "step3": "Arka plan anında kaldırılır", "step4": "Şeffaf PNG indirin"}
        },
        "upscaler": {
            "seo": {
                "title": "AI Görüntü Büyütme - Çözünürlüğü 4x'e Kadar Artırın | FixPic",
                "description": "Ücretsiz AI görüntü büyütücü. Kaliteyi koruyarak çözünürlüğü 4x'e kadar artırın.",
                "keywords": "görüntü büyüt,çözünürlük artır,AI upscale"
            },
            "instructions": {"step1": "Düşük çözünürlüklü görüntü yükleyin", "step2": "Büyütme faktörünü seçin", "step3": "AI iyileştirir ve büyütür", "step4": "HD görüntü indirin"}
        },
        "sharpener": {
            "seo": {
                "title": "AI Görüntü Keskinleştirme - Bulanık Fotoğrafları Düzeltin | FixPic",
                "description": "Ücretsiz AI keskinleştirme aracı. Bulanık fotoğrafları iyileştirin.",
                "keywords": "görüntü keskinleştir,bulanık foto düzelt,AI keskinlik"
            },
            "instructions": {"step1": "Bulanık görüntü yükleyin", "step2": "AI bulanıklığı analiz eder", "step3": "Görüntü otomatik keskinleştirilir", "step4": "Keskin görüntü indirin"}
        },
        "denoiser": {
            "seo": {
                "title": "AI Görüntü Gürültü Azaltma - Fotoğraflardan Grenli Giderme | FixPic",
                "description": "Ücretsiz AI gürültü azaltma aracı. Fotoğraflardan gürültü ve grenli giderin.",
                "keywords": "gürültü azalt,grenli gider,AI denoiser"
            },
            "instructions": {"step1": "Gürültülü görüntü yükleyin", "step2": "AI gürültü kalıplarını algılar", "step3": "Gürültü giderilir, detaylar korunur", "step4": "Temiz görüntü indirin"}
        },
        "bgGenerator": {
            "seo": {
                "title": "AI Arka Plan Oluşturucu - Profesyonel Arka Planlar Oluşturun | FixPic",
                "description": "Ücretsiz AI arka plan oluşturucu. Ürün fotoğrafları için profesyonel arka planlar oluşturun.",
                "keywords": "arka plan oluştur,AI background,profesyonel arka plan"
            },
            "instructions": {"step1": "Ürün görüntüsü yükleyin", "step2": "İstenen arka planı tanımlayın", "step3": "AI profesyonel arka plan oluşturur", "step4": "Son görüntüyü indirin"}
        },
        "shadowGen": {
            "seo": {
                "title": "AI Gölge Oluşturucu - Gerçekçi Gölgeler Ekleyin | FixPic",
                "description": "Ücretsiz AI gölge oluşturucu. Doğal, gerçekçi gölgeler ekleyin.",
                "keywords": "gölge ekle,gölge oluşturucu,AI gölge"
            },
            "instructions": {"step1": "Kesilmiş görüntü yükleyin", "step2": "Gölge tipini seçin", "step3": "AI gerçekçi gölge oluşturur", "step4": "Gölgeli görüntü indirin"}
        },
        "extender": {
            "seo": {
                "title": "AI Görüntü Genişletme - Görüntü Sınırlarını Genişletin | FixPic",
                "description": "Ücretsiz AI görüntü genişletme aracı. Oluşturulan içerikle sınırları genişletin.",
                "keywords": "görüntü genişlet,AI outpainting,sınır genişlet"
            },
            "instructions": {"step1": "Genişletilecek görüntü yükleyin", "step2": "Genişletme yönünü seçin", "step3": "AI eşleşen içerik oluşturur", "step4": "Genişletilmiş görüntü indirin"}
        },
        "smartCrop": {
            "seo": {
                "title": "AI Akıllı Kırpma - En İyi Kompozisyona Kırpın | FixPic",
                "description": "Ücretsiz AI akıllı kırpma aracı. Optimal kompozisyona otomatik kırpın.",
                "keywords": "akıllı kırpma,AI kırp,otomatik kırpma"
            },
            "instructions": {"step1": "Kırpılacak görüntü yükleyin", "step2": "Hedef en-boy oranını seçin", "step3": "AI konuyu algılar ve kırpar", "step4": "Kırpılmış görüntü indirin"}
        }
    },
    "th": {
        "bgRemover": {
            "seo": {
                "title": "AI ลบพื้นหลัง - เครื่องมือออนไลน์ฟรี | FixPic",
                "description": "เครื่องมือลบพื้นหลัง AI ฟรี ลบพื้นหลังรูปภาพได้ทันที",
                "keywords": "ลบพื้นหลัง,ลบแบ็คกราวด์,AI พื้นหลัง,โปร่งใส"
            },
            "instructions": {"step1": "อัปโหลดรูปที่มีพื้นหลัง", "step2": "AI ตรวจจับวัตถุอัตโนมัติ", "step3": "ลบพื้นหลังทันที", "step4": "ดาวน์โหลด PNG โปร่งใส"}
        },
        "upscaler": {
            "seo": {
                "title": "AI ขยายรูปภาพ - เพิ่มความละเอียดสูงสุด 4 เท่า | FixPic",
                "description": "เครื่องมือขยายรูปภาพ AI ฟรี เพิ่มความละเอียดสูงสุด 4 เท่าโดยรักษาคุณภาพ",
                "keywords": "ขยายรูปภาพ,เพิ่มความละเอียด,AI upscale"
            },
            "instructions": {"step1": "อัปโหลดรูปความละเอียดต่ำ", "step2": "เลือกอัตราการขยาย", "step3": "AI ปรับปรุงและขยาย", "step4": "ดาวน์โหลดรูป HD"}
        },
        "sharpener": {
            "seo": {
                "title": "AI เพิ่มความคมชัด - แก้ไขรูปเบลอ | FixPic",
                "description": "เครื่องมือเพิ่มความคมชัด AI ฟรี แก้ไขรูปเบลอและเพิ่มความชัด",
                "keywords": "เพิ่มความคมชัด,แก้รูปเบลอ,AI ความคมชัด"
            },
            "instructions": {"step1": "อัปโหลดรูปเบลอ", "step2": "AI วิเคราะห์ความเบลอ", "step3": "ปรับความคมชัดอัตโนมัติ", "step4": "ดาวน์โหลดรูปคมชัด"}
        },
        "denoiser": {
            "seo": {
                "title": "AI ลบสัญญาณรบกวน - ลบเกรนจากรูป | FixPic",
                "description": "เครื่องมือลบสัญญาณรบกวน AI ฟรี ลบสัญญาณรบกวนและเกรนจากรูป",
                "keywords": "ลบสัญญาณรบกวน,ลบเกรน,AI denoiser"
            },
            "instructions": {"step1": "อัปโหลดรูปที่มีสัญญาณรบกวน", "step2": "AI ตรวจจับรูปแบบสัญญาณรบกวน", "step3": "ลบสัญญาณรบกวนและรักษารายละเอียด", "step4": "ดาวน์โหลดรูปสะอาด"}
        },
        "bgGenerator": {
            "seo": {
                "title": "AI สร้างพื้นหลัง - สร้างพื้นหลังมืออาชีพ | FixPic",
                "description": "เครื่องมือสร้างพื้นหลัง AI ฟรี สร้างพื้นหลังมืออาชีพสำหรับรูปสินค้า",
                "keywords": "สร้างพื้นหลัง,AI แบ็คกราวด์,พื้นหลังมืออาชีพ"
            },
            "instructions": {"step1": "อัปโหลดรูปสินค้า", "step2": "อธิบายพื้นหลังที่ต้องการ", "step3": "AI สร้างพื้นหลังมืออาชีพ", "step4": "ดาวน์โหลดรูปสำเร็จ"}
        },
        "shadowGen": {
            "seo": {
                "title": "AI สร้างเงา - เพิ่มเงาสมจริง | FixPic",
                "description": "เครื่องมือสร้างเงา AI ฟรี เพิ่มเงาธรรมชาติและสมจริง",
                "keywords": "เพิ่มเงา,สร้างเงา,AI เงา"
            },
            "instructions": {"step1": "อัปโหลดรูปที่ตัดแล้ว", "step2": "เลือกประเภทเงา", "step3": "AI สร้างเงาสมจริง", "step4": "ดาวน์โหลดรูปที่มีเงา"}
        },
        "extender": {
            "seo": {
                "title": "AI ขยายรูป - ขยายขอบรูปภาพ | FixPic",
                "description": "เครื่องมือขยายรูปภาพ AI ฟรี ขยายขอบด้วยเนื้อหาที่สร้างขึ้น",
                "keywords": "ขยายรูป,AI outpainting,ขยายขอบ"
            },
            "instructions": {"step1": "อัปโหลดรูปที่จะขยาย", "step2": "เลือกทิศทางการขยาย", "step3": "AI สร้างเนื้อหาที่เข้ากัน", "step4": "ดาวน์โหลดรูปที่ขยายแล้ว"}
        },
        "smartCrop": {
            "seo": {
                "title": "AI ครอปอัจฉริยะ - ครอปให้องค์ประกอบดีที่สุด | FixPic",
                "description": "เครื่องมือครอปอัจฉริยะ AI ฟรี ครอปอัตโนมัติให้องค์ประกอบสมบูรณ์แบบ",
                "keywords": "ครอปอัจฉริยะ,AI ครอป,ครอปอัตโนมัติ"
            },
            "instructions": {"step1": "อัปโหลดรูปที่จะครอป", "step2": "เลือกอัตราส่วนเป้าหมาย", "step3": "AI ตรวจจับวัตถุและครอป", "step4": "ดาวน์โหลดรูปที่ครอปแล้ว"}
        }
    },
    "vi": {
        "bgRemover": {
            "seo": {
                "title": "AI Xóa Nền Ảnh - Công Cụ Trực Tuyến Miễn Phí | FixPic",
                "description": "Công cụ xóa nền AI miễn phí. Xóa nền ảnh ngay lập tức.",
                "keywords": "xóa nền,xóa background,AI nền,trong suốt"
            },
            "instructions": {"step1": "Tải lên ảnh có nền", "step2": "AI tự động phát hiện đối tượng", "step3": "Nền được xóa ngay lập tức", "step4": "Tải xuống PNG trong suốt"}
        },
        "upscaler": {
            "seo": {
                "title": "AI Phóng To Ảnh - Tăng Độ Phân Giải Lên 4 Lần | FixPic",
                "description": "Công cụ phóng to ảnh AI miễn phí. Tăng độ phân giải lên 4 lần mà vẫn giữ chất lượng.",
                "keywords": "phóng to ảnh,tăng độ phân giải,AI upscale"
            },
            "instructions": {"step1": "Tải lên ảnh độ phân giải thấp", "step2": "Chọn hệ số phóng to", "step3": "AI cải thiện và phóng to", "step4": "Tải xuống ảnh HD"}
        },
        "sharpener": {
            "seo": {
                "title": "AI Làm Sắc Nét Ảnh - Sửa Ảnh Mờ | FixPic",
                "description": "Công cụ làm sắc nét ảnh AI miễn phí. Cải thiện ảnh mờ và tăng độ sắc nét.",
                "keywords": "làm sắc nét ảnh,sửa ảnh mờ,AI sắc nét"
            },
            "instructions": {"step1": "Tải lên ảnh mờ", "step2": "AI phân tích độ mờ", "step3": "Ảnh được làm sắc nét tự động", "step4": "Tải xuống ảnh sắc nét"}
        },
        "denoiser": {
            "seo": {
                "title": "AI Khử Nhiễu Ảnh - Xóa Hạt Từ Ảnh | FixPic",
                "description": "Công cụ khử nhiễu ảnh AI miễn phí. Xóa nhiễu và hạt từ ảnh.",
                "keywords": "khử nhiễu,xóa hạt,AI denoiser"
            },
            "instructions": {"step1": "Tải lên ảnh có nhiễu", "step2": "AI phát hiện mẫu nhiễu", "step3": "Nhiễu được xóa, chi tiết được giữ", "step4": "Tải xuống ảnh sạch"}
        },
        "bgGenerator": {
            "seo": {
                "title": "AI Tạo Nền - Tạo Nền Chuyên Nghiệp | FixPic",
                "description": "Công cụ tạo nền AI miễn phí. Tạo nền chuyên nghiệp cho ảnh sản phẩm.",
                "keywords": "tạo nền,AI background,nền chuyên nghiệp"
            },
            "instructions": {"step1": "Tải lên ảnh sản phẩm", "step2": "Mô tả nền mong muốn", "step3": "AI tạo nền chuyên nghiệp", "step4": "Tải xuống ảnh hoàn chỉnh"}
        },
        "shadowGen": {
            "seo": {
                "title": "AI Tạo Bóng - Thêm Bóng Chân Thực | FixPic",
                "description": "Công cụ tạo bóng AI miễn phí. Thêm bóng tự nhiên và chân thực.",
                "keywords": "thêm bóng,tạo bóng,AI bóng"
            },
            "instructions": {"step1": "Tải lên ảnh đã cắt", "step2": "Chọn loại bóng", "step3": "AI tạo bóng chân thực", "step4": "Tải xuống ảnh có bóng"}
        },
        "extender": {
            "seo": {
                "title": "AI Mở Rộng Ảnh - Mở Rộng Biên Ảnh | FixPic",
                "description": "Công cụ mở rộng ảnh AI miễn phí. Mở rộng biên với nội dung được tạo.",
                "keywords": "mở rộng ảnh,AI outpainting,mở rộng biên"
            },
            "instructions": {"step1": "Tải lên ảnh cần mở rộng", "step2": "Chọn hướng mở rộng", "step3": "AI tạo nội dung phù hợp", "step4": "Tải xuống ảnh mở rộng"}
        },
        "smartCrop": {
            "seo": {
                "title": "AI Cắt Thông Minh - Cắt Theo Bố Cục Tốt Nhất | FixPic",
                "description": "Công cụ cắt thông minh AI miễn phí. Tự động cắt theo bố cục tối ưu.",
                "keywords": "cắt thông minh,AI cắt,tự động cắt"
            },
            "instructions": {"step1": "Tải lên ảnh cần cắt", "step2": "Chọn tỷ lệ mục tiêu", "step3": "AI phát hiện đối tượng và cắt", "step4": "Tải xuống ảnh đã cắt"}
        }
    }
}

def update_language_file(lang_code):
    """Update a single language file with translations."""
    file_path = f"{lang_code}.json"
    if not os.path.exists(file_path):
        return 0

    if lang_code not in ASIAN_TRANSLATIONS:
        return 0

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    lang_trans = ASIAN_TRANSLATIONS[lang_code]

    for tool_key, tool_data in lang_trans.items():
        if tool_key not in data:
            data[tool_key] = {}

        if 'seo' in tool_data:
            data[tool_key]['seo'] = tool_data['seo']
            added += 1

        if 'instructions' in tool_data:
            data[tool_key]['instructions'] = tool_data['instructions']
            added += 1

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return added

def main():
    print("Adding Asian language translations...")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    total = 0
    for lang in ASIAN_TRANSLATIONS.keys():
        added = update_language_file(lang)
        if added > 0:
            print(f"{lang}: updated {added} sections")
            total += added

    print(f"\nTotal: {total} sections updated")

if __name__ == '__main__':
    main()
