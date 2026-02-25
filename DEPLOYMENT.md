# 🚀 GitHub ve Vercel Deployment Rehberi

## 📋 Ön Hazırlık

### 1. Gerekli Hesaplar
- [GitHub](https://github.com) hesabı
- [Vercel](https://vercel.com) hesabı (GitHub ile giriş yapın)

### 2. Gerekli Araçlar
- Git yüklü olmalı
- Node.js 18.x veya üzeri

---

## 📦 Projeyi GitHub'a Yükleme

### Adım 1: GitHub'da Yeni Repo Oluşturun

1. GitHub'a gidin: https://github.com/new
2. Repository adı girin: `safa-trend-analysis` (veya istediğiniz ad)
3. **Public** veya **Private** seçin
4. **"Initialize this repository"** seçeneklerini **SEÇMEYIN** (README, .gitignore, license)
5. **"Create repository"** tıklayın

### Adım 2: Lokal Projeyi Hazırlayın

Proje klasörünüze gidin ve şu komutları çalıştırın:

```bash
# Git başlat
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: SAFA Trend Analysis Platform"

# Ana branch'i main olarak ayarla
git branch -M main

# GitHub remote ekle (YOUR_USERNAME yerine kendi kullanıcı adınızı yazın)
git remote add origin https://github.com/YOUR_USERNAME/safa-trend-analysis.git

# GitHub'a push et
git push -u origin main
```

**Not:** GitHub'da username/password sorduğunda:
- Username: GitHub kullanıcı adınız
- Password: **Personal Access Token** kullanın (şifre değil!)

### Personal Access Token Oluşturma

Eğer token'ınız yoksa:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" → "Generate new token (classic)"
3. Note: "SAFA Project"
4. Expiration: 90 days (veya istediğiniz)
5. Scope: **repo** seçin (tüm repo erişimi)
6. "Generate token" tıklayın
7. Token'ı kopyalayın ve güvenli yere kaydedin!

---

## 🌐 Vercel'e Deploy Etme

### Yöntem 1: Vercel Dashboard (ÖNERİLEN)

1. **Vercel'e gidin:** https://vercel.com/login
2. **GitHub ile giriş yapın**
3. **"New Project"** butonuna tıklayın
4. **GitHub reposunu bulun:**
   - "Import Git Repository" bölümünde
   - `safa-trend-analysis` reposunu arayın
   - **"Import"** tıklayın

5. **Proje Ayarları:**
   ```
   Framework Preset: Next.js
   Root Directory: ./ (default)
   Build Command: pnpm build (otomatik algılanacak)
   Output Directory: .next (otomatik algılanacak)
   Install Command: pnpm install (otomatik algılanacak)
   ```

6. **Environment Variables (Şimdilik gerekli değil):**
   - İleride ekleyebilirsiniz

7. **"Deploy"** butonuna tıklayın

8. **Bekleyin (2-3 dakika):**
   - Build logları göreceksiniz
   - Başarılı olduğunda "Congratulations!" mesajı
   - Vercel URL'iniz: `https://safa-trend-analysis-xxx.vercel.app`

### Yöntem 2: Vercel CLI

```bash
# Vercel CLI yükle
npm i -g vercel

# Giriş yap
vercel login

# Deploy et
vercel

# Production deploy
vercel --prod
```

---

## 🔄 Otomatik Deployment (CI/CD)

GitHub'a push ettiğinizde Vercel otomatik olarak deploy eder:

```bash
# Değişiklik yap
git add .
git commit -m "Fix: Component detection algorithm"
git push origin main

# Vercel otomatik olarak yeni deploy başlatır!
```

**Branch Preview:**
- `git checkout -b feature/new-feature` ile yeni branch
- Push ettiğinizde Vercel ayrı bir preview URL oluşturur
- Main branch production'da kalır

---

## ⚙️ Vercel Dashboard Ayarları

### Önemli Ayarlar

1. **Settings → General:**
   - Node.js Version: 18.x (otomatik)
   - Install Command: `pnpm install`
   - Build Command: `pnpm build`
   - Output Directory: `.next`

2. **Settings → Environment Variables:**
   - Şimdilik gerekli değil
   - İleride API key eklemek isterseniz buradan

3. **Settings → Domains:**
   - Custom domain ekleyebilirsiniz
   - Örnek: `safa-analysis.yourdomain.com`

4. **Settings → Git:**
   - Production Branch: `main`
   - Auto-deploy: Enabled ✅

---

## 🐛 Deployment Sorunları

### Build Error: "Module not found"

```bash
# Lokal olarak test edin
pnpm install
pnpm build

# Çalışıyorsa, package.json'u kontrol edin
# Vercel'de "Redeploy" deneyin
```

### Build Error: "Out of memory"

Vercel Settings → Functions → Memory: 1024 MB (default yeterli)

### TypeScript Error

```bash
# Lokal olarak kontrol
pnpm build

# Type hataları varsa düzeltin
```

### Port 3000 çakışması

Vercel production'da port yönetimi yapar, sorun olmaz.

---

## 📊 Production'da Kullanım

### Önemli Notlar:

1. **Memory Storage:**
   - Veriler şu an memory'de (global değişken)
   - Her deploy sonrası veriler sıfırlanır
   - Production'da **database** kullanın (PostgreSQL, MongoDB, vb.)

2. **File Upload:**
   - Vercel'de 4.5 MB body limit var
   - Büyük Excel'ler için:
     - S3/Cloudinary gibi storage
     - Veya Vercel Pro (50 MB limit)

3. **Serverless Function Timeout:**
   - Hobby: 10 saniye
   - Pro: 60 saniye (vercel.json'da ayarlı)
   - Çok büyük Excel'ler için Pro gerekebilir

---

## 🔒 Güvenlik Önerileri

1. **Environment Variables:**
   - Hassas bilgileri `.env.local`'de tutun
   - `.env.local` Git'e commitlenmesin (.gitignore'da var)
   - Vercel'de Environment Variables'dan ekleyin

2. **API Security:**
   - İleride authentication ekleyin
   - Rate limiting kullanın

3. **CORS:**
   - Şu an gerekli değil
   - Public API yaparsanız dikkat edin

---

## 📈 Monitoring

### Vercel Analytics (Ücretsiz)

1. Project → Analytics sekmesi
2. Trafik, performance, hata izleme

### Sentry Integration (Opsiyonel)

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## 🎯 İleri Seviye

### Database Ekleme (Production için önerilen)

**Supabase (Ücretsiz):**
```bash
pnpm add @supabase/supabase-js
```

**Vercel Postgres:**
- Vercel Storage → Postgres → Create
- Environment variables otomatik eklenir

**PlanetScale (MySQL):**
```bash
pnpm add @planetscale/database
```

### Custom Domain

1. Vercel → Settings → Domains
2. Domain adınızı girin
3. DNS kayıtlarını güncelleyin (A/CNAME)
4. SSL otomatik oluşturulur

---

## ✅ Checklist

- [ ] GitHub reposu oluşturuldu
- [ ] Kod GitHub'a push edildi
- [ ] Vercel hesabı oluşturuldu (GitHub ile)
- [ ] Vercel'de proje import edildi
- [ ] İlk deploy başarılı
- [ ] Vercel URL çalışıyor
- [ ] Excel upload test edildi
- [ ] Grafikler çalışıyor
- [ ] Modal detaylar çalışıyor
- [ ] CSV export çalışıyor

---

## 🆘 Yardım

**Vercel Documentation:**
https://vercel.com/docs

**Next.js Deployment:**
https://nextjs.org/docs/deployment

**GitHub Issues:**
Repo'nuzda issue açabilirsiniz

---

## 🎉 Tebrikler!

Projeniz artık canlıda! 

Vercel URL'nizi paylaşabilirsiniz:
`https://safa-trend-analysis-xxx.vercel.app`

Her Git push'unuzda otomatik deploy olacak! 🚀
