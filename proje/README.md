## görsel tanıtım
[başlangıç](görsel_tanıtım/başlangıç.png)
[ana ekran](görsel_tanıtım/ana_ekran.png)
[arama](görsel_tanıtım/arama.png)

# Film Dünyası – Film Uygulaması

Popüler filmleri listeleyen, arayan ve detaylarını gösteren tek sayfalık bir web uygulaması.

## Özellikler

- **Popüler / En İyi / Yakında** film listeleri
- **Film arama** (yazarken canlı arama)
- **Film detayı** (tıklayınca özet, süre, yıl)
- Koyu tema, responsive tasarım
- Veriler **TMDb** (The Movie Database) API ile alınır

## Kurulum

1. Projeyi bilgisayarınıza alın.
2. **TMDB API anahtarı** alın (ücretsiz):
   - [themoviedb.org](https://www.themoviedb.org/) üzerinden ücretsiz hesap açın
   - [API Ayarları](https://www.themoviedb.org/settings/api) sayfasından "API Key (v3 auth)" değerini kopyalayın
3. Proje klasöründeki `config.js` dosyasını açın ve anahtarınızı yazın:

```javascript
window.TMDB_API_KEY = 'BURAYA_API_ANAHTARINIZI_YAPISTIRIN';
```

4. `index.html` dosyasını tarayıcıda açın (veya yerel bir sunucu ile çalıştırın).

## Dosya Yapısı

- `index.html` – Ana sayfa
- `styles.css` – Stiller
- `app.js` – Liste, arama ve detay mantığı
- `config.js` – API anahtarı (bu dosyayı paylaşmayın / git’e eklemeyin)

## Not

API anahtarı olmadan sayfa açılır ancak film listesi gelmez; ekranda API anahtarı eklemeniz gerektiğine dair bir uyarı görünür.
