#!/usr/bin/env python3
"""Add complete SEO content for all tools in all languages."""
import json
import os

# Tool SEO content for all languages
TOOL_SEO = {
    "bgRemover": {
        "seo": {
            "en": {
                "title": "AI Background Remover - Remove Image Background Free Online | FixPic",
                "description": "Free AI-powered background remover. Remove image backgrounds instantly with one click. Perfect for product photos, portraits, logos. No signup required.",
                "keywords": "remove background,background remover,AI background removal,transparent background,product photo background,remove bg,cutout image"
            },
            "zh-CN": {
                "title": "AI智能抠图 - 一键去除图片背景 免费在线工具 | FixPic",
                "description": "免费AI智能抠图工具。一键去除图片背景，完美处理产品图、人像照片、Logo。无需注册，本地处理。",
                "keywords": "抠图,去除背景,AI抠图,透明背景,产品图背景,智能抠图,一键去背景"
            },
            "zh-TW": {
                "title": "AI智慧去背 - 一鍵移除圖片背景 免費線上工具 | FixPic",
                "description": "免費AI智慧去背工具。一鍵移除圖片背景，完美處理產品圖、人像照片、Logo。無需註冊，本地處理。",
                "keywords": "去背,移除背景,AI去背,透明背景,產品圖背景,智慧去背,一鍵去背"
            },
            "ja": {
                "title": "AI背景除去 - ワンクリックで画像背景を削除 無料オンラインツール | FixPic",
                "description": "無料AI背景除去ツール。ワンクリックで画像の背景を削除。商品写真、ポートレート、ロゴに最適。登録不要。",
                "keywords": "背景除去,背景削除,AI切り抜き,透明背景,商品写真背景,背景消去"
            },
            "ko": {
                "title": "AI 배경 제거 - 원클릭 이미지 배경 제거 무료 온라인 도구 | FixPic",
                "description": "무료 AI 배경 제거 도구. 원클릭으로 이미지 배경을 즉시 제거합니다. 제품 사진, 인물 사진, 로고에 완벽합니다.",
                "keywords": "배경 제거,배경 삭제,AI 누끼,투명 배경,제품 사진 배경,배경 지우기"
            }
        },
        "instructions": {
            "en": ["Upload image with background", "AI automatically detects subject", "Background removed instantly", "Download transparent PNG"],
            "zh-CN": ["上传带背景的图片", "AI自动识别主体", "背景立即被移除", "下载透明PNG图片"],
            "zh-TW": ["上傳帶背景的圖片", "AI自動識別主體", "背景立即被移除", "下載透明PNG圖片"],
            "ja": ["背景のある画像をアップロード", "AIが自動で被写体を検出", "背景が即座に削除", "透明PNGをダウンロード"],
            "ko": ["배경이 있는 이미지 업로드", "AI가 자동으로 피사체 감지", "배경이 즉시 제거됨", "투명 PNG 다운로드"]
        }
    },
    "upscaler": {
        "seo": {
            "en": {
                "title": "AI Image Upscaler - Enlarge Images Up to 4x Without Quality Loss | FixPic",
                "description": "Free AI image upscaler. Enlarge and enhance images up to 4x resolution while maintaining clarity. Perfect for printing, social media, and web use.",
                "keywords": "image upscaler,enlarge image,AI upscale,increase resolution,enhance image quality,4x upscale,photo enlarger"
            },
            "zh-CN": {
                "title": "AI图片放大 - 无损放大图片至4倍 免费在线工具 | FixPic",
                "description": "免费AI图片放大工具。将图片无损放大至4倍分辨率，保持清晰度。适合打印、社交媒体和网页使用。",
                "keywords": "图片放大,无损放大,AI放大,提高分辨率,增强图片质量,4倍放大,照片放大"
            },
            "zh-TW": {
                "title": "AI圖片放大 - 無損放大圖片至4倍 免費線上工具 | FixPic",
                "description": "免費AI圖片放大工具。將圖片無損放大至4倍解析度，保持清晰度。適合列印、社群媒體和網頁使用。",
                "keywords": "圖片放大,無損放大,AI放大,提高解析度,增強圖片品質,4倍放大,照片放大"
            },
            "ja": {
                "title": "AI画像拡大 - 画質を保ちながら4倍まで拡大 無料オンラインツール | FixPic",
                "description": "無料AI画像拡大ツール。画質を保ちながら画像を最大4倍まで拡大。印刷、SNS、ウェブに最適。",
                "keywords": "画像拡大,高画質拡大,AI拡大,解像度アップ,画質向上,4倍拡大"
            },
            "ko": {
                "title": "AI 이미지 업스케일러 - 품질 손실 없이 4배 확대 무료 온라인 도구 | FixPic",
                "description": "무료 AI 이미지 업스케일러. 선명도를 유지하면서 이미지를 최대 4배까지 확대합니다.",
                "keywords": "이미지 확대,무손실 확대,AI 업스케일,해상도 향상,품질 개선,4배 확대"
            }
        },
        "instructions": {
            "en": ["Upload low resolution image", "Select upscale factor (2x or 4x)", "AI enhances and enlarges", "Download high-res image"],
            "zh-CN": ["上传低分辨率图片", "选择放大倍数(2倍或4倍)", "AI增强并放大", "下载高清图片"],
            "zh-TW": ["上傳低解析度圖片", "選擇放大倍數(2倍或4倍)", "AI增強並放大", "下載高清圖片"],
            "ja": ["低解像度の画像をアップロード", "拡大率を選択(2倍または4倍)", "AIが拡大・高画質化", "高解像度画像をダウンロード"],
            "ko": ["저해상도 이미지 업로드", "확대 배율 선택(2배 또는 4배)", "AI가 확대 및 향상", "고해상도 이미지 다운로드"]
        }
    },
    "sharpener": {
        "seo": {
            "en": {
                "title": "AI Image Sharpener - Fix Blurry Photos Online Free | FixPic",
                "description": "Free AI image sharpener. Enhance blurry photos, improve clarity and details. Perfect for fixing out-of-focus shots and improving image quality.",
                "keywords": "sharpen image,fix blurry photo,AI sharpener,enhance clarity,improve image quality,unblur photo,deblur image"
            },
            "zh-CN": {
                "title": "AI图片锐化 - 免费修复模糊照片 在线工具 | FixPic",
                "description": "免费AI图片锐化工具。增强模糊照片的清晰度和细节。完美修复失焦照片，提高图片质量。",
                "keywords": "图片锐化,修复模糊,AI锐化,增强清晰度,提高图片质量,去模糊,照片增强"
            },
            "zh-TW": {
                "title": "AI圖片銳化 - 免費修復模糊照片 線上工具 | FixPic",
                "description": "免費AI圖片銳化工具。增強模糊照片的清晰度和細節。完美修復失焦照片，提高圖片品質。",
                "keywords": "圖片銳化,修復模糊,AI銳化,增強清晰度,提高圖片品質,去模糊,照片增強"
            },
            "ja": {
                "title": "AI画像シャープ化 - ぼやけた写真を無料で修正 オンラインツール | FixPic",
                "description": "無料AI画像シャープ化ツール。ぼやけた写真の鮮明度と詳細を向上。ピンボケ写真の修正に最適。",
                "keywords": "画像シャープ化,ぼかし修正,AI鮮明化,クリアリティ向上,画質改善,ぼけ除去"
            },
            "ko": {
                "title": "AI 이미지 샤프닝 - 흐릿한 사진 무료 수정 온라인 도구 | FixPic",
                "description": "무료 AI 이미지 샤프닝 도구. 흐릿한 사진의 선명도와 디테일을 향상시킵니다.",
                "keywords": "이미지 선명화,흐림 수정,AI 샤프닝,선명도 향상,품질 개선,블러 제거"
            }
        },
        "instructions": {
            "en": ["Upload blurry or soft image", "AI analyzes and detects blur", "Image sharpened automatically", "Download enhanced image"],
            "zh-CN": ["上传模糊或不清晰的图片", "AI分析并检测模糊", "图片自动锐化", "下载增强后的图片"],
            "zh-TW": ["上傳模糊或不清晰的圖片", "AI分析並檢測模糊", "圖片自動銳化", "下載增強後的圖片"],
            "ja": ["ぼやけた画像をアップロード", "AIがぼかしを分析・検出", "画像を自動でシャープ化", "鮮明化した画像をダウンロード"],
            "ko": ["흐릿한 이미지 업로드", "AI가 흐림 분석 및 감지", "이미지 자동 선명화", "향상된 이미지 다운로드"]
        }
    },
    "denoiser": {
        "seo": {
            "en": {
                "title": "AI Image Denoiser - Remove Noise and Grain from Photos | FixPic",
                "description": "Free AI image denoiser. Remove noise, grain, and artifacts from photos. Perfect for high ISO shots and low-light photography.",
                "keywords": "remove noise,denoise image,AI denoiser,reduce grain,fix noisy photo,ISO noise removal,photo noise reduction"
            },
            "zh-CN": {
                "title": "AI图片降噪 - 去除照片噪点和颗粒 免费在线工具 | FixPic",
                "description": "免费AI图片降噪工具。去除照片中的噪点、颗粒和伪影。完美处理高ISO照片和低光拍摄。",
                "keywords": "去除噪点,图片降噪,AI降噪,减少颗粒,修复噪点,ISO噪点去除,照片降噪"
            },
            "zh-TW": {
                "title": "AI圖片降噪 - 去除照片雜訊和顆粒 免費線上工具 | FixPic",
                "description": "免費AI圖片降噪工具。去除照片中的雜訊、顆粒和偽影。完美處理高ISO照片和低光拍攝。",
                "keywords": "去除雜訊,圖片降噪,AI降噪,減少顆粒,修復雜訊,ISO雜訊去除,照片降噪"
            },
            "ja": {
                "title": "AIノイズ除去 - 写真のノイズと粒子を除去 無料オンラインツール | FixPic",
                "description": "無料AIノイズ除去ツール。写真のノイズ、粒子、アーティファクトを除去。高ISO撮影や暗所撮影に最適。",
                "keywords": "ノイズ除去,画像ノイズ,AIデノイザー,粒子除去,ノイズ修正,ISOノイズ除去"
            },
            "ko": {
                "title": "AI 이미지 노이즈 제거 - 사진 노이즈 및 입자 제거 무료 온라인 도구 | FixPic",
                "description": "무료 AI 노이즈 제거 도구. 사진의 노이즈, 입자, 아티팩트를 제거합니다. 고ISO 촬영에 완벽합니다.",
                "keywords": "노이즈 제거,이미지 디노이즈,AI 디노이저,입자 제거,노이즈 수정,ISO 노이즈 제거"
            }
        },
        "instructions": {
            "en": ["Upload noisy or grainy image", "AI detects noise patterns", "Noise removed while preserving details", "Download clean image"],
            "zh-CN": ["上传有噪点或颗粒的图片", "AI检测噪点模式", "去除噪点同时保留细节", "下载干净的图片"],
            "zh-TW": ["上傳有雜訊或顆粒的圖片", "AI檢測雜訊模式", "去除雜訊同時保留細節", "下載乾淨的圖片"],
            "ja": ["ノイズのある画像をアップロード", "AIがノイズパターンを検出", "ディテールを保ちながらノイズ除去", "クリーンな画像をダウンロード"],
            "ko": ["노이즈가 있는 이미지 업로드", "AI가 노이즈 패턴 감지", "디테일을 유지하면서 노이즈 제거", "깨끗한 이미지 다운로드"]
        }
    },
    "bgGenerator": {
        "seo": {
            "en": {
                "title": "AI Background Generator - Create Professional Product Photo Backgrounds | FixPic",
                "description": "Free AI background generator. Create stunning product photo backgrounds with AI. Perfect for e-commerce, marketing, and social media.",
                "keywords": "AI background generator,product photo background,create background,e-commerce photo,professional background,AI backdrop"
            },
            "zh-CN": {
                "title": "AI背景生成器 - 生成专业产品图背景 免费在线工具 | FixPic",
                "description": "免费AI背景生成器。使用AI创建精美的产品图背景。适合电商、营销和社交媒体。",
                "keywords": "AI背景生成,产品图背景,创建背景,电商图片,专业背景,AI背景"
            },
            "zh-TW": {
                "title": "AI背景生成器 - 生成專業產品圖背景 免費線上工具 | FixPic",
                "description": "免費AI背景生成器。使用AI創建精美的產品圖背景。適合電商、行銷和社群媒體。",
                "keywords": "AI背景生成,產品圖背景,創建背景,電商圖片,專業背景,AI背景"
            },
            "ja": {
                "title": "AI背景生成 - プロの商品写真背景を作成 無料オンラインツール | FixPic",
                "description": "無料AI背景生成ツール。AIで素敵な商品写真の背景を作成。ECサイト、マーケティング、SNSに最適。",
                "keywords": "AI背景生成,商品写真背景,背景作成,EC写真,プロ背景,AI背景"
            },
            "ko": {
                "title": "AI 배경 생성기 - 전문적인 제품 사진 배경 생성 무료 온라인 도구 | FixPic",
                "description": "무료 AI 배경 생성기. AI로 멋진 제품 사진 배경을 만듭니다. 이커머스, 마케팅, SNS에 완벽합니다.",
                "keywords": "AI 배경 생성,제품 사진 배경,배경 만들기,이커머스 사진,전문 배경"
            }
        },
        "instructions": {
            "en": ["Upload product image (transparent background works best)", "Describe desired background or select style", "AI generates professional background", "Download final image"],
            "zh-CN": ["上传产品图(透明背景效果最佳)", "描述想要的背景或选择风格", "AI生成专业背景", "下载最终图片"],
            "zh-TW": ["上傳產品圖(透明背景效果最佳)", "描述想要的背景或選擇風格", "AI生成專業背景", "下載最終圖片"],
            "ja": ["商品画像をアップロード(透明背景推奨)", "希望の背景を説明またはスタイル選択", "AIがプロの背景を生成", "最終画像をダウンロード"],
            "ko": ["제품 이미지 업로드(투명 배경 권장)", "원하는 배경 설명 또는 스타일 선택", "AI가 전문적인 배경 생성", "최종 이미지 다운로드"]
        }
    },
    "shadowGen": {
        "seo": {
            "en": {
                "title": "AI Shadow Generator - Add Realistic Shadows to Product Photos | FixPic",
                "description": "Free AI shadow generator. Add natural, realistic shadows to product images. Make cutout images look professional and grounded.",
                "keywords": "add shadow,shadow generator,AI shadow,product shadow,drop shadow,realistic shadow,photo shadow effect"
            },
            "zh-CN": {
                "title": "AI阴影生成器 - 为产品图添加逼真阴影 免费在线工具 | FixPic",
                "description": "免费AI阴影生成器。为产品图添加自然逼真的阴影。让抠图看起来更专业、更有立体感。",
                "keywords": "添加阴影,阴影生成,AI阴影,产品阴影,投影,逼真阴影,照片阴影效果"
            },
            "zh-TW": {
                "title": "AI陰影生成器 - 為產品圖添加逼真陰影 免費線上工具 | FixPic",
                "description": "免費AI陰影生成器。為產品圖添加自然逼真的陰影。讓去背圖片看起來更專業、更有立體感。",
                "keywords": "添加陰影,陰影生成,AI陰影,產品陰影,投影,逼真陰影,照片陰影效果"
            },
            "ja": {
                "title": "AI影生成 - 商品写真にリアルな影を追加 無料オンラインツール | FixPic",
                "description": "無料AI影生成ツール。商品画像に自然でリアルな影を追加。切り抜き画像をプロ品質に。",
                "keywords": "影を追加,影生成,AI影,商品影,ドロップシャドウ,リアルな影,写真影効果"
            },
            "ko": {
                "title": "AI 그림자 생성기 - 제품 사진에 사실적인 그림자 추가 무료 온라인 도구 | FixPic",
                "description": "무료 AI 그림자 생성기. 제품 이미지에 자연스럽고 사실적인 그림자를 추가합니다.",
                "keywords": "그림자 추가,그림자 생성,AI 그림자,제품 그림자,드롭 섀도우,사실적 그림자"
            }
        },
        "instructions": {
            "en": ["Upload cutout image (transparent background)", "Select shadow type and direction", "AI generates realistic shadow", "Download image with shadow"],
            "zh-CN": ["上传抠图(透明背景)", "选择阴影类型和方向", "AI生成逼真阴影", "下载带阴影的图片"],
            "zh-TW": ["上傳去背圖(透明背景)", "選擇陰影類型和方向", "AI生成逼真陰影", "下載帶陰影的圖片"],
            "ja": ["切り抜き画像をアップロード(透明背景)", "影の種類と方向を選択", "AIがリアルな影を生成", "影付き画像をダウンロード"],
            "ko": ["누끼 이미지 업로드(투명 배경)", "그림자 유형과 방향 선택", "AI가 사실적인 그림자 생성", "그림자가 있는 이미지 다운로드"]
        }
    },
    "extender": {
        "seo": {
            "en": {
                "title": "AI Image Extender - Expand Image Borders with AI Outpainting | FixPic",
                "description": "Free AI image extender. Expand image borders seamlessly with AI-generated content. Perfect for changing aspect ratios and creating more canvas space.",
                "keywords": "image extender,AI outpainting,expand image,extend borders,uncrop image,generative fill,canvas expansion"
            },
            "zh-CN": {
                "title": "AI图片扩展 - 智能扩展图片边界 免费在线工具 | FixPic",
                "description": "免费AI图片扩展工具。使用AI无缝扩展图片边界。完美改变图片比例，创造更多画布空间。",
                "keywords": "图片扩展,AI外扩,扩展图片,延伸边界,取消裁剪,生成式填充,画布扩展"
            },
            "zh-TW": {
                "title": "AI圖片擴展 - 智慧擴展圖片邊界 免費線上工具 | FixPic",
                "description": "免費AI圖片擴展工具。使用AI無縫擴展圖片邊界。完美改變圖片比例，創造更多畫布空間。",
                "keywords": "圖片擴展,AI外擴,擴展圖片,延伸邊界,取消裁剪,生成式填充,畫布擴展"
            },
            "ja": {
                "title": "AI画像拡張 - AIでシームレスに画像の境界を拡張 無料オンラインツール | FixPic",
                "description": "無料AI画像拡張ツール。AIで画像の境界をシームレスに拡張。アスペクト比の変更やキャンバス拡大に最適。",
                "keywords": "画像拡張,AIアウトペインティング,画像拡大,境界拡張,アンクロップ,生成塗りつぶし"
            },
            "ko": {
                "title": "AI 이미지 확장 - AI 아웃페인팅으로 이미지 테두리 확장 무료 온라인 도구 | FixPic",
                "description": "무료 AI 이미지 확장 도구. AI로 이미지 테두리를 자연스럽게 확장합니다. 종횡비 변경에 완벽합니다.",
                "keywords": "이미지 확장,AI 아웃페인팅,이미지 늘리기,테두리 확장,언크롭,생성형 채우기"
            }
        },
        "instructions": {
            "en": ["Upload image to extend", "Select expansion direction", "AI generates matching content", "Download extended image"],
            "zh-CN": ["上传需要扩展的图片", "选择扩展方向", "AI生成匹配内容", "下载扩展后的图片"],
            "zh-TW": ["上傳需要擴展的圖片", "選擇擴展方向", "AI生成匹配內容", "下載擴展後的圖片"],
            "ja": ["拡張する画像をアップロード", "拡張方向を選択", "AIがマッチするコンテンツを生成", "拡張画像をダウンロード"],
            "ko": ["확장할 이미지 업로드", "확장 방향 선택", "AI가 매칭되는 콘텐츠 생성", "확장된 이미지 다운로드"]
        }
    },
    "smartCrop": {
        "seo": {
            "en": {
                "title": "AI Smart Crop - Auto Crop Images to Best Composition | FixPic",
                "description": "Free AI smart crop tool. Automatically crop images to optimal composition. Detect subjects and apply rule of thirds for professional results.",
                "keywords": "smart crop,AI crop,auto crop,best composition,subject detection,rule of thirds,intelligent cropping"
            },
            "zh-CN": {
                "title": "AI智能裁剪 - 自动裁剪到最佳构图 免费在线工具 | FixPic",
                "description": "免费AI智能裁剪工具。自动将图片裁剪到最佳构图。检测主体并应用三分法获得专业效果。",
                "keywords": "智能裁剪,AI裁剪,自动裁剪,最佳构图,主体检测,三分法,智能剪裁"
            },
            "zh-TW": {
                "title": "AI智慧裁切 - 自動裁切到最佳構圖 免費線上工具 | FixPic",
                "description": "免費AI智慧裁切工具。自動將圖片裁切到最佳構圖。檢測主體並應用三分法獲得專業效果。",
                "keywords": "智慧裁切,AI裁切,自動裁切,最佳構圖,主體檢測,三分法,智能剪裁"
            },
            "ja": {
                "title": "AIスマートクロップ - 自動で最適な構図にクロップ 無料オンラインツール | FixPic",
                "description": "無料AIスマートクロップツール。画像を自動で最適な構図にクロップ。被写体検出と三分割法でプロ品質に。",
                "keywords": "スマートクロップ,AIクロップ,自動切り抜き,最適構図,被写体検出,三分割法"
            },
            "ko": {
                "title": "AI 스마트 크롭 - 최적의 구도로 자동 자르기 무료 온라인 도구 | FixPic",
                "description": "무료 AI 스마트 크롭 도구. 이미지를 최적의 구도로 자동 자르기. 피사체 감지와 삼분법으로 전문적인 결과물.",
                "keywords": "스마트 크롭,AI 크롭,자동 자르기,최적 구도,피사체 감지,삼분법"
            }
        },
        "instructions": {
            "en": ["Upload image to crop", "Select target aspect ratio", "AI detects subject and crops", "Download cropped image"],
            "zh-CN": ["上传需要裁剪的图片", "选择目标宽高比", "AI检测主体并裁剪", "下载裁剪后的图片"],
            "zh-TW": ["上傳需要裁切的圖片", "選擇目標寬高比", "AI檢測主體並裁切", "下載裁切後的圖片"],
            "ja": ["クロップする画像をアップロード", "目標アスペクト比を選択", "AIが被写体を検出してクロップ", "クロップ画像をダウンロード"],
            "ko": ["자를 이미지 업로드", "목표 종횡비 선택", "AI가 피사체 감지 후 자르기", "잘린 이미지 다운로드"]
        }
    }
}

# Languages to update
LANGUAGES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'id', 'tr', 'th', 'vi']

# Fallback translations for languages not explicitly defined
def get_translation(tool_key, field, lang):
    """Get translation with fallback to English."""
    tool_data = TOOL_SEO.get(tool_key, {})
    field_data = tool_data.get(field, {})

    if lang in field_data:
        return field_data[lang]
    elif 'en' in field_data:
        return field_data['en']
    return None

def update_language_file(lang_code):
    """Update a single language file with tool SEO content."""
    file_path = f"{lang_code}.json"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return 0

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0

    for tool_key in TOOL_SEO:
        # Create tool section if not exists
        tool_section_key = tool_key
        if tool_section_key not in data:
            data[tool_section_key] = {}

        # Add SEO
        seo = get_translation(tool_key, 'seo', lang_code)
        if seo and 'seo' not in data[tool_section_key]:
            data[tool_section_key]['seo'] = seo
            added += 1

        # Add instructions
        instructions = get_translation(tool_key, 'instructions', lang_code)
        if instructions and 'instructions' not in data[tool_section_key]:
            data[tool_section_key]['instructions'] = {
                'step1': instructions[0] if len(instructions) > 0 else '',
                'step2': instructions[1] if len(instructions) > 1 else '',
                'step3': instructions[2] if len(instructions) > 2 else '',
                'step4': instructions[3] if len(instructions) > 3 else ''
            }
            added += 1

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return added

def main():
    print("Adding tool SEO content to all languages...")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    total = 0
    for lang in LANGUAGES:
        added = update_language_file(lang)
        if added > 0:
            print(f"{lang}: added {added} sections")
            total += added

    print(f"\nTotal: {total} sections added")

if __name__ == '__main__':
    main()
