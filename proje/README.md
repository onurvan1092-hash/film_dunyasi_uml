## 11. hafta 

[çizelge](./11h_veritabanı.png)


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
- Veriler MongoDB backend API ile alınır

## Kurulum

1. Projeyi bilgisayarınıza alın.
2. Frontend ve backend klasorlerini birlikte calistirin.

## Dosya Yapısı

- `index.html` – Ana sayfa
- `styles.css` – Stiller
- `app.js` – Liste, arama ve detay mantığı
- `backend/` – MongoDB tabanli Node.js API

## Not

Film verileri artik `db.json` veya TMDb yerine dogrudan backend API'den gelir.

## MongoDB Backend (Yeni)

Frontend tamamlandiktan sonra MongoDB tabanli backend `backend/` klasorune eklendi.

### 1) Kurulum

```bash
cd backend
npm install
```

### 2) Ortam Degiskenleri

`.env.example` dosyasini `.env` olarak kopyalayin ve degerleri duzenleyin:

- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`
- `ADMIN_*` alanlari

### 3) Ilk Veri Yukleme

`backend/src/data/movies.json` icindeki filmleri MongoDB'ye aktarmak icin:

```bash
npm run seed
```

Admin kullanici olusturmak/guncellemek icin:

```bash
npm run create-admin
```

### 4) Backend Baslatma

Gelistirme modu:

```bash
npm run dev
```

Normal calisma:

```bash
npm start
```

### 5) Temel Endpointler

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/movies`
- `GET /api/movies/:id`
- `GET /api/admin/dashboard` (Admin token)
- `GET /api/admin/users` (Admin token)
- `DELETE /api/admin/users/:id` (Admin token)
- `POST /api/admin/movies` (Admin token)
- `PATCH /api/admin/movies/:id` (Admin token)
- `DELETE /api/admin/movies/:id` (Admin token)
