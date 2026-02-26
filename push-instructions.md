# GitHub Push Instructions

Değişiklikler commit edildi. GitHub'a push etmek için:

## Opsiyon 1: Terminal'den

```bash
git push origin HEAD:main
```

## Opsiyon 2: Web Üzerinden

Aşağıdaki dosyaları GitHub'da güncelleyin:

### 1. `components/FileUpload.tsx`
- Excel dosyasını browser'da okur (XLSX kütüphanesi ile)
- API'ye sadece parse edilmiş veriyi gönderir
- İşlenmiş veriyi localStorage'a kaydeder
- Vercel'de serverless sorununu çözer

### 2. `app/api/process/route.ts` (YENİ DOSYA)
- Parse edilmiş veriyi alır
- processExcelData ile işler
- İşlenmiş veriyi client'a geri döndürür
- Dosya yükleme işlemi yapmaz (client-side)

### 3. `app/dashboard/page.tsx`
- localStorage'dan veriyi okur
- API'ye bağımlı değil
- Tarih string'lerini Date objesine çevirir
- İstatistikleri client-side hesaplar

## Değişiklik Özeti

**Eski Mimari (Sorunlu):**
```
Browser -> Upload Excel -> API (file system) -> global.safaData
Browser -> Dashboard -> API -> global.safaData (BOŞ - farklı instance!)
```

**Yeni Mimari (Çalışan):**
```
Browser -> Parse Excel (XLSX) -> API Process -> localStorage
Browser -> Dashboard -> localStorage (HER ZAMAN DOLU!)
```

## Neden localStorage?

1. Vercel serverless fonksiyonlar stateless
2. /tmp her cold start'ta silinir
3. Global değişkenler instance'lar arası paylaşılmaz
4. localStorage browser'da kalıcı ve güvenilir
5. SAFA analiz verisi kullanıcıya özel (paysaşım gerekmez)

