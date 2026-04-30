# Liya AI 3D Avatar React - Migration & Sync Plan

Bu doküman, `liya-ai-3d-avatar-react` paketinin `liya-3d-avatar-widget-vuejs` paketi ile birebir uyumlu hale getirilmesi için gereken eksikleri ve uygulama adımlarını içerir.

## 1. Mevcut Durum Analizi

Yapılan inceleme sonucunda React paketinin Vue paketine göre oldukça eksik ve farklı bir yapıda olduğu tespit edilmiştir.

### 1.1. API Katmanı Eksikleri
Vue paketindeki API yapısı çok daha gelişmiş ve modülerdir. React tarafında şu dosyalar eksik veya yetersizdir:
- **Eksik Dosyalar:** `assistants.ts`, `sessions.ts`, `tasks.ts`.
- **Yetersiz Dosyalar:** `avatar.ts`, `chat.ts`, `client.ts`, `files.ts` (Vue versiyonları 2-5 kat daha fazla mantık ve endpoint içeriyor).
- **Eylem:** Vue tarafındaki API mantığı (Axios/Fetch client, interceptors, error handling) birebir React tarafına taşınmalıdır.

### 1.2. Bileşen Yapısı ve Mantık
Vue tarafındaki `LiyaAvatarWidget.vue` (~3400 satır) ile React tarafındaki `LiyaAvatarWidget.tsx` (~180 satır) arasında devasa bir özellik farkı vardır.
- **Eksik Özellikler:**
    - Gelişmiş AudioContext yönetimi (özellikle Safari/iOS uyumluluğu).
    - Detaylı Lip-Sync (Viseme) ve konuşma (TTS) yönetimi.
    - i18n (Çoklu dil) desteği (React'ta iskelet var ama tam uygulanmamış).
    - Sesli komut (Voice) desteği ve tarayıcı uyumluluk kontrolleri.
    - Dosya yükleme (File upload) süreçleri.
- **Eylem:** Vue bileşenlerindeki mantık, React Hook'larına (`useChat`, `useVoice`, `useAvatarColors` vb.) parçalanarak React bileşenlerine aktarılmalıdır.

### 1.3. Stil ve Tema (Liquid Glass)
Vue paketinde "Liquid Glass" teması bileşen bazlı (scoped CSS) olarak uygulanmıştır. React tarafında ise inline stiller ağırlıktadır.
- **Eylem:** 
    - Vue bileşenlerindeki CSS blokları çıkarılmalı ve `src/styles/liquid-glass.css` gibi merkezi bir dosyaya veya CSS modüllerine taşınmalıdır.
    - React bileşenleri bu sınıfları kullanacak şekilde güncellenmelidir.

## 2. Uygulama Planı

### Faz 1: Altyapı ve API (Hemen)
1. `src/api` klasörünü Vue versiyonuyla eşitle (Tüm endpoint'ler ve tip tanımlamaları).
2. `src/types` klasörünü Vue tarafındaki tüm arayüzleri (interfaces) içerecek şekilde güncelle.
3. `src/utils` klasörünü oluştur ve `markdown.ts`, `tts.ts` gibi yardımcı araçları taşı.

### Faz 2: Hook'lar ve Mantık
1. `useChat`, `useVoice`, `useFileUpload`, `useAvatarColors` gibi composable'ları React Hook'larına dönüştür.
2. AudioContext yönetimini merkezi bir `useAudioContext` hook'una taşı.

### Faz 3: Bileşenler ve Stil
1. Vue tarafındaki bileşen hiyerarşisini (app, avatar, shared, widget) React tarafında da uygula.
2. "Liquid Glass" CSS'ini Vue bileşenlerinden ayıkla ve React'a uyarla.
3. `LiyaAvatarWidget.tsx` ana bileşenini Vue'daki tüm prop'ları ve state mantığını içerecek şekilde yeniden yaz.

### Faz 4: Test ve Doğrulama
1. Örnek uygulama (`examples/`) üzerinden tüm özelliklerin (konuşma, lip-sync, dosya yükleme, tema) çalıştığını doğrula.
2. Vue paketi ile görsel ve işlevsel karşılaştırma yap.

## 3. Sorular ve Notlar
- Vue paketindeki `plugin.ts` (Vue Plugin) mantığının React tarafında bir `LiyaAvatarProvider` (Context API) olarak mı yoksa sadece bağımsız bir widget olarak mı sunulacağı netleştirilmelidir.
- Liquid Glass CSS'i için Tailwind veya düz CSS tercihi teyit edilmelidir (Vue tarafı düz CSS/Sass kullanıyor gibi görünüyor).
