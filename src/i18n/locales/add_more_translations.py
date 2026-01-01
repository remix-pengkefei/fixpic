#!/usr/bin/env python3
"""Add more SEO translations for remaining languages."""
import json
import os

# Additional translations for other languages
MORE_TRANSLATIONS = {
    "es": {
        "bgRemover": {
            "seo": {
                "title": "Eliminar Fondo de Imagen con IA - Herramienta Gratuita Online | FixPic",
                "description": "Eliminador de fondo con IA gratuito. Elimina el fondo de tus imágenes al instante. Perfecto para fotos de productos y retratos.",
                "keywords": "eliminar fondo,quitar fondo,IA fondo,fondo transparente,foto producto,recortar imagen"
            },
            "instructions": {"step1": "Sube imagen con fondo", "step2": "IA detecta el sujeto automáticamente", "step3": "Fondo eliminado al instante", "step4": "Descarga PNG transparente"}
        },
        "upscaler": {
            "seo": {
                "title": "Ampliar Imagen con IA - Aumentar Resolución hasta 4x | FixPic",
                "description": "Ampliador de imágenes con IA gratuito. Aumenta la resolución hasta 4x manteniendo la calidad.",
                "keywords": "ampliar imagen,aumentar resolución,IA upscale,mejorar calidad,4x ampliación"
            },
            "instructions": {"step1": "Sube imagen de baja resolución", "step2": "Selecciona factor de ampliación", "step3": "IA mejora y amplía", "step4": "Descarga imagen HD"}
        },
        "sharpener": {
            "seo": {
                "title": "Enfocar Imagen con IA - Arreglar Fotos Borrosas | FixPic",
                "description": "Herramienta gratuita para enfocar imágenes con IA. Mejora fotos borrosas y aumenta la nitidez.",
                "keywords": "enfocar imagen,arreglar foto borrosa,IA nitidez,mejorar claridad"
            },
            "instructions": {"step1": "Sube imagen borrosa", "step2": "IA analiza y detecta borrosidad", "step3": "Imagen enfocada automáticamente", "step4": "Descarga imagen mejorada"}
        },
        "denoiser": {
            "seo": {
                "title": "Eliminar Ruido de Imagen con IA - Quitar Grano de Fotos | FixPic",
                "description": "Herramienta gratuita para eliminar ruido con IA. Quita grano y artefactos de las fotos.",
                "keywords": "eliminar ruido,quitar grano,IA denoiser,reducir ruido ISO"
            },
            "instructions": {"step1": "Sube imagen con ruido", "step2": "IA detecta patrones de ruido", "step3": "Ruido eliminado conservando detalles", "step4": "Descarga imagen limpia"}
        },
        "bgGenerator": {
            "seo": {
                "title": "Generador de Fondos con IA - Crear Fondos Profesionales | FixPic",
                "description": "Generador de fondos con IA gratuito. Crea fondos profesionales para fotos de productos.",
                "keywords": "generador fondos,IA fondo,crear fondo,foto producto profesional"
            },
            "instructions": {"step1": "Sube imagen de producto", "step2": "Describe el fondo deseado", "step3": "IA genera fondo profesional", "step4": "Descarga imagen final"}
        },
        "shadowGen": {
            "seo": {
                "title": "Generador de Sombras con IA - Añadir Sombras Realistas | FixPic",
                "description": "Generador de sombras con IA gratuito. Añade sombras naturales y realistas a tus imágenes.",
                "keywords": "añadir sombra,generador sombras,IA sombra,sombra realista"
            },
            "instructions": {"step1": "Sube imagen recortada", "step2": "Selecciona tipo de sombra", "step3": "IA genera sombra realista", "step4": "Descarga imagen con sombra"}
        },
        "extender": {
            "seo": {
                "title": "Extender Imagen con IA - Expandir Bordes de Imagen | FixPic",
                "description": "Herramienta gratuita para extender imágenes con IA. Expande los bordes con contenido generado.",
                "keywords": "extender imagen,IA outpainting,expandir bordes,ampliar lienzo"
            },
            "instructions": {"step1": "Sube imagen a extender", "step2": "Selecciona dirección de expansión", "step3": "IA genera contenido coincidente", "step4": "Descarga imagen extendida"}
        },
        "smartCrop": {
            "seo": {
                "title": "Recorte Inteligente con IA - Recortar a Mejor Composición | FixPic",
                "description": "Herramienta de recorte inteligente con IA gratuita. Recorta automáticamente a la composición óptima.",
                "keywords": "recorte inteligente,IA recortar,auto recorte,mejor composición"
            },
            "instructions": {"step1": "Sube imagen a recortar", "step2": "Selecciona proporción objetivo", "step3": "IA detecta sujeto y recorta", "step4": "Descarga imagen recortada"}
        }
    },
    "fr": {
        "bgRemover": {
            "seo": {
                "title": "Supprimer l'Arrière-plan avec l'IA - Outil Gratuit en Ligne | FixPic",
                "description": "Suppresseur d'arrière-plan IA gratuit. Supprimez l'arrière-plan de vos images instantanément.",
                "keywords": "supprimer arrière-plan,enlever fond,IA fond,fond transparent"
            },
            "instructions": {"step1": "Téléchargez l'image avec arrière-plan", "step2": "L'IA détecte automatiquement le sujet", "step3": "Arrière-plan supprimé instantanément", "step4": "Téléchargez le PNG transparent"}
        },
        "upscaler": {
            "seo": {
                "title": "Agrandir Image avec l'IA - Augmenter la Résolution jusqu'à 4x | FixPic",
                "description": "Agrandisseur d'images IA gratuit. Augmentez la résolution jusqu'à 4x en maintenant la qualité.",
                "keywords": "agrandir image,augmenter résolution,IA upscale,améliorer qualité"
            },
            "instructions": {"step1": "Téléchargez image basse résolution", "step2": "Sélectionnez facteur d'agrandissement", "step3": "L'IA améliore et agrandit", "step4": "Téléchargez image HD"}
        },
        "sharpener": {
            "seo": {
                "title": "Améliorer la Netteté avec l'IA - Corriger Photos Floues | FixPic",
                "description": "Outil gratuit pour améliorer la netteté avec l'IA. Améliorez les photos floues.",
                "keywords": "améliorer netteté,corriger photo floue,IA netteté"
            },
            "instructions": {"step1": "Téléchargez image floue", "step2": "L'IA analyse et détecte le flou", "step3": "Image améliorée automatiquement", "step4": "Téléchargez image nette"}
        },
        "denoiser": {
            "seo": {
                "title": "Supprimer le Bruit avec l'IA - Enlever le Grain des Photos | FixPic",
                "description": "Outil gratuit pour supprimer le bruit avec l'IA. Enlevez le grain et les artefacts.",
                "keywords": "supprimer bruit,enlever grain,IA débruitage,réduire bruit ISO"
            },
            "instructions": {"step1": "Téléchargez image bruitée", "step2": "L'IA détecte les motifs de bruit", "step3": "Bruit supprimé en préservant les détails", "step4": "Téléchargez image nette"}
        },
        "bgGenerator": {
            "seo": {
                "title": "Générateur d'Arrière-plan IA - Créer des Fonds Professionnels | FixPic",
                "description": "Générateur d'arrière-plan IA gratuit. Créez des fonds professionnels pour vos photos produits.",
                "keywords": "générateur fond,IA arrière-plan,créer fond,photo produit pro"
            },
            "instructions": {"step1": "Téléchargez image produit", "step2": "Décrivez le fond souhaité", "step3": "L'IA génère un fond pro", "step4": "Téléchargez image finale"}
        },
        "shadowGen": {
            "seo": {
                "title": "Générateur d'Ombres IA - Ajouter des Ombres Réalistes | FixPic",
                "description": "Générateur d'ombres IA gratuit. Ajoutez des ombres naturelles et réalistes.",
                "keywords": "ajouter ombre,générateur ombres,IA ombre,ombre réaliste"
            },
            "instructions": {"step1": "Téléchargez image détourée", "step2": "Sélectionnez type d'ombre", "step3": "L'IA génère ombre réaliste", "step4": "Téléchargez image avec ombre"}
        },
        "extender": {
            "seo": {
                "title": "Étendre Image avec l'IA - Élargir les Bordures | FixPic",
                "description": "Outil gratuit pour étendre les images avec l'IA. Élargissez les bordures avec du contenu généré.",
                "keywords": "étendre image,IA outpainting,élargir bordures"
            },
            "instructions": {"step1": "Téléchargez image à étendre", "step2": "Sélectionnez direction d'expansion", "step3": "L'IA génère contenu correspondant", "step4": "Téléchargez image étendue"}
        },
        "smartCrop": {
            "seo": {
                "title": "Recadrage Intelligent IA - Recadrer à la Meilleure Composition | FixPic",
                "description": "Outil de recadrage intelligent IA gratuit. Recadrez automatiquement pour une composition optimale.",
                "keywords": "recadrage intelligent,IA recadrer,auto recadrage"
            },
            "instructions": {"step1": "Téléchargez image à recadrer", "step2": "Sélectionnez ratio cible", "step3": "L'IA détecte sujet et recadre", "step4": "Téléchargez image recadrée"}
        }
    },
    "de": {
        "bgRemover": {
            "seo": {
                "title": "KI Hintergrund Entfernen - Kostenloses Online-Tool | FixPic",
                "description": "Kostenloser KI-Hintergrundentferner. Entfernen Sie Bildhintergründe sofort.",
                "keywords": "Hintergrund entfernen,KI Hintergrund,transparenter Hintergrund"
            },
            "instructions": {"step1": "Bild mit Hintergrund hochladen", "step2": "KI erkennt Motiv automatisch", "step3": "Hintergrund sofort entfernt", "step4": "Transparentes PNG herunterladen"}
        },
        "upscaler": {
            "seo": {
                "title": "KI Bild Vergrößern - Auflösung bis zu 4x erhöhen | FixPic",
                "description": "Kostenloser KI-Bildvergrößerer. Erhöhen Sie die Auflösung bis zu 4x ohne Qualitätsverlust.",
                "keywords": "Bild vergrößern,Auflösung erhöhen,KI Upscale"
            },
            "instructions": {"step1": "Niedrigauflösendes Bild hochladen", "step2": "Vergrößerungsfaktor wählen", "step3": "KI verbessert und vergrößert", "step4": "HD-Bild herunterladen"}
        },
        "sharpener": {
            "seo": {
                "title": "KI Bild Schärfen - Unscharfe Fotos Reparieren | FixPic",
                "description": "Kostenloses KI-Schärfungstool. Verbessern Sie unscharfe Fotos und erhöhen Sie die Klarheit.",
                "keywords": "Bild schärfen,unscharfes Foto reparieren,KI Schärfung"
            },
            "instructions": {"step1": "Unscharfes Bild hochladen", "step2": "KI analysiert Unschärfe", "step3": "Bild automatisch geschärft", "step4": "Verbessertes Bild herunterladen"}
        },
        "denoiser": {
            "seo": {
                "title": "KI Bildrauschen Entfernen - Körnung aus Fotos Entfernen | FixPic",
                "description": "Kostenloses KI-Entrauschungstool. Entfernen Sie Rauschen und Körnung aus Fotos.",
                "keywords": "Rauschen entfernen,Körnung entfernen,KI Denoiser"
            },
            "instructions": {"step1": "Verrauschtes Bild hochladen", "step2": "KI erkennt Rauschmuster", "step3": "Rauschen entfernt, Details erhalten", "step4": "Sauberes Bild herunterladen"}
        },
        "bgGenerator": {
            "seo": {
                "title": "KI Hintergrund Generator - Professionelle Hintergründe Erstellen | FixPic",
                "description": "Kostenloser KI-Hintergrundgenerator. Erstellen Sie professionelle Produktfoto-Hintergründe.",
                "keywords": "Hintergrund Generator,KI Hintergrund,professioneller Hintergrund"
            },
            "instructions": {"step1": "Produktbild hochladen", "step2": "Gewünschten Hintergrund beschreiben", "step3": "KI generiert professionellen Hintergrund", "step4": "Fertiges Bild herunterladen"}
        },
        "shadowGen": {
            "seo": {
                "title": "KI Schatten Generator - Realistische Schatten Hinzufügen | FixPic",
                "description": "Kostenloser KI-Schattengenerator. Fügen Sie natürliche, realistische Schatten hinzu.",
                "keywords": "Schatten hinzufügen,Schatten Generator,KI Schatten"
            },
            "instructions": {"step1": "Freigestelltes Bild hochladen", "step2": "Schattentyp wählen", "step3": "KI generiert realistischen Schatten", "step4": "Bild mit Schatten herunterladen"}
        },
        "extender": {
            "seo": {
                "title": "KI Bild Erweitern - Bildränder Erweitern | FixPic",
                "description": "Kostenloses KI-Tool zum Erweitern von Bildern. Erweitern Sie Bildränder mit generiertem Inhalt.",
                "keywords": "Bild erweitern,KI Outpainting,Ränder erweitern"
            },
            "instructions": {"step1": "Zu erweiterndes Bild hochladen", "step2": "Erweiterungsrichtung wählen", "step3": "KI generiert passenden Inhalt", "step4": "Erweitertes Bild herunterladen"}
        },
        "smartCrop": {
            "seo": {
                "title": "KI Smart Crop - Automatisch zur Besten Komposition Zuschneiden | FixPic",
                "description": "Kostenloses KI-Smart-Crop-Tool. Schneiden Sie Bilder automatisch auf optimale Komposition zu.",
                "keywords": "Smart Crop,KI Zuschneiden,Auto Crop"
            },
            "instructions": {"step1": "Zu schneidendes Bild hochladen", "step2": "Ziel-Seitenverhältnis wählen", "step3": "KI erkennt Motiv und schneidet zu", "step4": "Zugeschnittenes Bild herunterladen"}
        }
    },
    "pt": {
        "bgRemover": {
            "seo": {
                "title": "Remover Fundo de Imagem com IA - Ferramenta Grátis Online | FixPic",
                "description": "Removedor de fundo com IA gratuito. Remova o fundo das suas imagens instantaneamente.",
                "keywords": "remover fundo,tirar fundo,IA fundo,fundo transparente"
            },
            "instructions": {"step1": "Envie imagem com fundo", "step2": "IA detecta o sujeito automaticamente", "step3": "Fundo removido instantaneamente", "step4": "Baixe PNG transparente"}
        },
        "upscaler": {
            "seo": {
                "title": "Ampliar Imagem com IA - Aumentar Resolução até 4x | FixPic",
                "description": "Ampliador de imagens com IA gratuito. Aumente a resolução até 4x mantendo a qualidade.",
                "keywords": "ampliar imagem,aumentar resolução,IA upscale,melhorar qualidade"
            },
            "instructions": {"step1": "Envie imagem de baixa resolução", "step2": "Selecione fator de ampliação", "step3": "IA melhora e amplia", "step4": "Baixe imagem HD"}
        },
        "sharpener": {
            "seo": {
                "title": "Nitidez de Imagem com IA - Corrigir Fotos Borradas | FixPic",
                "description": "Ferramenta gratuita para aumentar nitidez com IA. Melhore fotos borradas.",
                "keywords": "aumentar nitidez,corrigir foto borrada,IA nitidez"
            },
            "instructions": {"step1": "Envie imagem borrada", "step2": "IA analisa e detecta borrão", "step3": "Imagem melhorada automaticamente", "step4": "Baixe imagem nítida"}
        },
        "denoiser": {
            "seo": {
                "title": "Remover Ruído de Imagem com IA - Tirar Granulação de Fotos | FixPic",
                "description": "Ferramenta gratuita para remover ruído com IA. Tire granulação e artefatos das fotos.",
                "keywords": "remover ruído,tirar granulação,IA denoiser,reduzir ruído ISO"
            },
            "instructions": {"step1": "Envie imagem com ruído", "step2": "IA detecta padrões de ruído", "step3": "Ruído removido preservando detalhes", "step4": "Baixe imagem limpa"}
        },
        "bgGenerator": {
            "seo": {
                "title": "Gerador de Fundos com IA - Criar Fundos Profissionais | FixPic",
                "description": "Gerador de fundos com IA gratuito. Crie fundos profissionais para fotos de produtos.",
                "keywords": "gerador fundos,IA fundo,criar fundo,foto produto profissional"
            },
            "instructions": {"step1": "Envie imagem de produto", "step2": "Descreva o fundo desejado", "step3": "IA gera fundo profissional", "step4": "Baixe imagem final"}
        },
        "shadowGen": {
            "seo": {
                "title": "Gerador de Sombras com IA - Adicionar Sombras Realistas | FixPic",
                "description": "Gerador de sombras com IA gratuito. Adicione sombras naturais e realistas às suas imagens.",
                "keywords": "adicionar sombra,gerador sombras,IA sombra,sombra realista"
            },
            "instructions": {"step1": "Envie imagem recortada", "step2": "Selecione tipo de sombra", "step3": "IA gera sombra realista", "step4": "Baixe imagem com sombra"}
        },
        "extender": {
            "seo": {
                "title": "Estender Imagem com IA - Expandir Bordas de Imagem | FixPic",
                "description": "Ferramenta gratuita para estender imagens com IA. Expanda as bordas com conteúdo gerado.",
                "keywords": "estender imagem,IA outpainting,expandir bordas"
            },
            "instructions": {"step1": "Envie imagem a estender", "step2": "Selecione direção de expansão", "step3": "IA gera conteúdo correspondente", "step4": "Baixe imagem estendida"}
        },
        "smartCrop": {
            "seo": {
                "title": "Corte Inteligente com IA - Cortar para Melhor Composição | FixPic",
                "description": "Ferramenta de corte inteligente com IA gratuita. Corte automaticamente para composição ótima.",
                "keywords": "corte inteligente,IA cortar,auto corte"
            },
            "instructions": {"step1": "Envie imagem a cortar", "step2": "Selecione proporção alvo", "step3": "IA detecta sujeito e corta", "step4": "Baixe imagem cortada"}
        }
    },
    "it": {
        "bgRemover": {
            "seo": {
                "title": "Rimuovi Sfondo Immagine con IA - Strumento Gratuito Online | FixPic",
                "description": "Rimozione sfondo con IA gratuita. Rimuovi lo sfondo delle tue immagini istantaneamente.",
                "keywords": "rimuovi sfondo,elimina sfondo,IA sfondo,sfondo trasparente"
            },
            "instructions": {"step1": "Carica immagine con sfondo", "step2": "IA rileva soggetto automaticamente", "step3": "Sfondo rimosso istantaneamente", "step4": "Scarica PNG trasparente"}
        },
        "upscaler": {
            "seo": {
                "title": "Ingrandisci Immagine con IA - Aumenta Risoluzione fino a 4x | FixPic",
                "description": "Ingranditore immagini IA gratuito. Aumenta la risoluzione fino a 4x mantenendo la qualità.",
                "keywords": "ingrandisci immagine,aumenta risoluzione,IA upscale"
            },
            "instructions": {"step1": "Carica immagine bassa risoluzione", "step2": "Seleziona fattore ingrandimento", "step3": "IA migliora e ingrandisce", "step4": "Scarica immagine HD"}
        },
        "sharpener": {
            "seo": {
                "title": "Nitidezza Immagine con IA - Correggi Foto Sfocate | FixPic",
                "description": "Strumento gratuito per migliorare nitidezza con IA. Migliora foto sfocate.",
                "keywords": "migliora nitidezza,correggi foto sfocata,IA nitidezza"
            },
            "instructions": {"step1": "Carica immagine sfocata", "step2": "IA analizza e rileva sfocatura", "step3": "Immagine migliorata automaticamente", "step4": "Scarica immagine nitida"}
        },
        "denoiser": {
            "seo": {
                "title": "Rimuovi Rumore Immagine con IA - Elimina Grana dalle Foto | FixPic",
                "description": "Strumento gratuito per rimuovere rumore con IA. Elimina grana e artefatti dalle foto.",
                "keywords": "rimuovi rumore,elimina grana,IA denoiser"
            },
            "instructions": {"step1": "Carica immagine con rumore", "step2": "IA rileva pattern di rumore", "step3": "Rumore rimosso preservando dettagli", "step4": "Scarica immagine pulita"}
        },
        "bgGenerator": {
            "seo": {
                "title": "Generatore Sfondi IA - Crea Sfondi Professionali | FixPic",
                "description": "Generatore sfondi IA gratuito. Crea sfondi professionali per foto prodotti.",
                "keywords": "generatore sfondi,IA sfondo,crea sfondo"
            },
            "instructions": {"step1": "Carica immagine prodotto", "step2": "Descrivi sfondo desiderato", "step3": "IA genera sfondo professionale", "step4": "Scarica immagine finale"}
        },
        "shadowGen": {
            "seo": {
                "title": "Generatore Ombre IA - Aggiungi Ombre Realistiche | FixPic",
                "description": "Generatore ombre IA gratuito. Aggiungi ombre naturali e realistiche.",
                "keywords": "aggiungi ombra,generatore ombre,IA ombra"
            },
            "instructions": {"step1": "Carica immagine ritagliata", "step2": "Seleziona tipo ombra", "step3": "IA genera ombra realistica", "step4": "Scarica immagine con ombra"}
        },
        "extender": {
            "seo": {
                "title": "Estendi Immagine con IA - Espandi Bordi Immagine | FixPic",
                "description": "Strumento gratuito per estendere immagini con IA. Espandi i bordi con contenuto generato.",
                "keywords": "estendi immagine,IA outpainting,espandi bordi"
            },
            "instructions": {"step1": "Carica immagine da estendere", "step2": "Seleziona direzione espansione", "step3": "IA genera contenuto corrispondente", "step4": "Scarica immagine estesa"}
        },
        "smartCrop": {
            "seo": {
                "title": "Ritaglio Intelligente IA - Ritaglia alla Migliore Composizione | FixPic",
                "description": "Strumento ritaglio intelligente IA gratuito. Ritaglia automaticamente per composizione ottimale.",
                "keywords": "ritaglio intelligente,IA ritaglio,auto crop"
            },
            "instructions": {"step1": "Carica immagine da ritagliare", "step2": "Seleziona proporzioni target", "step3": "IA rileva soggetto e ritaglia", "step4": "Scarica immagine ritagliata"}
        }
    },
    "ru": {
        "bgRemover": {
            "seo": {
                "title": "ИИ Удаление Фона - Бесплатный Онлайн Инструмент | FixPic",
                "description": "Бесплатное удаление фона с помощью ИИ. Мгновенно удаляйте фон с изображений.",
                "keywords": "удалить фон,убрать фон,ИИ фон,прозрачный фон"
            },
            "instructions": {"step1": "Загрузите изображение с фоном", "step2": "ИИ автоматически определяет объект", "step3": "Фон мгновенно удален", "step4": "Скачайте прозрачный PNG"}
        },
        "upscaler": {
            "seo": {
                "title": "ИИ Увеличение Изображения - Повысить Разрешение до 4x | FixPic",
                "description": "Бесплатное увеличение изображений с ИИ. Повысьте разрешение до 4x сохраняя качество.",
                "keywords": "увеличить изображение,повысить разрешение,ИИ апскейл"
            },
            "instructions": {"step1": "Загрузите изображение низкого разрешения", "step2": "Выберите коэффициент увеличения", "step3": "ИИ улучшает и увеличивает", "step4": "Скачайте HD изображение"}
        },
        "sharpener": {
            "seo": {
                "title": "ИИ Повышение Резкости - Исправить Размытые Фото | FixPic",
                "description": "Бесплатный инструмент для повышения резкости с ИИ. Улучшите размытые фотографии.",
                "keywords": "повысить резкость,исправить размытое фото,ИИ резкость"
            },
            "instructions": {"step1": "Загрузите размытое изображение", "step2": "ИИ анализирует размытие", "step3": "Изображение автоматически улучшено", "step4": "Скачайте четкое изображение"}
        },
        "denoiser": {
            "seo": {
                "title": "ИИ Удаление Шума - Убрать Зернистость с Фото | FixPic",
                "description": "Бесплатный инструмент для удаления шума с ИИ. Уберите зернистость и артефакты.",
                "keywords": "удалить шум,убрать зернистость,ИИ шумоподавление"
            },
            "instructions": {"step1": "Загрузите шумное изображение", "step2": "ИИ определяет паттерны шума", "step3": "Шум удален, детали сохранены", "step4": "Скачайте чистое изображение"}
        },
        "bgGenerator": {
            "seo": {
                "title": "ИИ Генератор Фонов - Создать Профессиональные Фоны | FixPic",
                "description": "Бесплатный ИИ генератор фонов. Создавайте профессиональные фоны для товарных фото.",
                "keywords": "генератор фонов,ИИ фон,создать фон"
            },
            "instructions": {"step1": "Загрузите изображение товара", "step2": "Опишите желаемый фон", "step3": "ИИ генерирует профессиональный фон", "step4": "Скачайте готовое изображение"}
        },
        "shadowGen": {
            "seo": {
                "title": "ИИ Генератор Теней - Добавить Реалистичные Тени | FixPic",
                "description": "Бесплатный ИИ генератор теней. Добавьте естественные, реалистичные тени.",
                "keywords": "добавить тень,генератор теней,ИИ тень"
            },
            "instructions": {"step1": "Загрузите вырезанное изображение", "step2": "Выберите тип тени", "step3": "ИИ генерирует реалистичную тень", "step4": "Скачайте изображение с тенью"}
        },
        "extender": {
            "seo": {
                "title": "ИИ Расширение Изображения - Расширить Границы | FixPic",
                "description": "Бесплатный инструмент для расширения изображений с ИИ. Расширьте границы с генерируемым контентом.",
                "keywords": "расширить изображение,ИИ аутпеинтинг,расширить границы"
            },
            "instructions": {"step1": "Загрузите изображение для расширения", "step2": "Выберите направление расширения", "step3": "ИИ генерирует соответствующий контент", "step4": "Скачайте расширенное изображение"}
        },
        "smartCrop": {
            "seo": {
                "title": "ИИ Умная Обрезка - Обрезать для Лучшей Композиции | FixPic",
                "description": "Бесплатный инструмент умной обрезки с ИИ. Автоматически обрезайте для оптимальной композиции.",
                "keywords": "умная обрезка,ИИ обрезка,авто обрезка"
            },
            "instructions": {"step1": "Загрузите изображение для обрезки", "step2": "Выберите целевое соотношение сторон", "step3": "ИИ определяет объект и обрезает", "step4": "Скачайте обрезанное изображение"}
        }
    }
}

def update_language_file(lang_code):
    """Update a single language file with translations."""
    file_path = f"{lang_code}.json"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return 0

    if lang_code not in MORE_TRANSLATIONS:
        return 0

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    added = 0
    lang_trans = MORE_TRANSLATIONS[lang_code]

    for tool_key, tool_data in lang_trans.items():
        if tool_key not in data:
            data[tool_key] = {}

        # Update SEO
        if 'seo' in tool_data:
            data[tool_key]['seo'] = tool_data['seo']
            added += 1

        # Update instructions
        if 'instructions' in tool_data:
            data[tool_key]['instructions'] = tool_data['instructions']
            added += 1

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return added

def main():
    print("Adding more translations...")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    total = 0
    for lang in MORE_TRANSLATIONS.keys():
        added = update_language_file(lang)
        if added > 0:
            print(f"{lang}: updated {added} sections")
            total += added

    print(f"\nTotal: {total} sections updated")

if __name__ == '__main__':
    main()
