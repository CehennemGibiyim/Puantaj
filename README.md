# Personel Puantaj Sistemi

Bu proje, personel puantajını aylık olarak takip etmek için hazırlanmış React + TypeScript tabanlı bir uygulamadır.

## Özellikler

- İşçi için 45 saat / hafta, memur için 40 saat / hafta puantaj hesabı
- Haftalık ve aylık çalışma saatleri, fark ve bayram toplamı hesaplaması
- Günlük `7,5` veya `7,5` gibi ondalıklı saat girişi
- Departman ekleme ve seçme
- Personel ekleme ve personel atama (departman değişikliği)
- Personel iletişim bilgileri (telefon / e-posta)
- Bayram mesai etiketi (gün çift tıklanarak değiştirilebilir)

## Çalışma mantığı

- `dailyHours(type)` fonksiyonu:
  - `ISCI` için 7.5 saat/gün (6 gün = 45 saat)
  - `MEMUR` için 8 saat/gün (5 gün = 40 saat)
- `isWorkDay(type, year, month, day)` fonksiyonu:
  - `ISCI` işçileri için hafta sonu sadece pazar hariç çalışılır
  - `MEMUR` memurları için hafta sonu pazar ve cumartesi hariç çalışılır
- Haftalık ve aylık gereken saat hesaplaması bu kurallara göre yapılır.

## Çalıştırma

1. Proje dizinine geçin:

```bash
cd project
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

4. Tarayıcıda `http://localhost:5173` adresini açın.

## Önemli Notlar

- `supabase` bağlantı bilgileri `.env` dosyasında tanımlı olmalıdır.
- `TimesheetEntry.hours_worked` numeric(4,2) olarak saklanmalıdır.
- `personnel` tablosunda `phone` ve `email` alanları olduğu varsayılmaktadır.

## Yükleme ve GitHub Sayfası

Bu proje `https://cehennemgibiyim.github.io/Puantaj` adresi altında yayınlanmak üzere yapılandırıldı.

### GitHub Pages deploy adımları

1. Bu proje için bir GitHub deposu oluşturun: `https://github.com/CehennemGibiyim/Puantaj`
2. Proje dizininde gerekli bağımlılıkları yükleyin:

```bash
npm install
```

3. Uygulamayı yerel olarak çalıştırın:

```bash
npm run dev
```

4. Uygulamayı GitHub Pages'e deploy edin:

```bash
npm run deploy
```

5. Yayınlanan sitenizi şu adreste kontrol edin:

```text
https://cehennemgibiyim.github.io/Puantaj
```

> Eğer `https://github.io/cehennemgibiyim/Puantaj` şeklinde kullanmak isterseniz, GitHub Pages otomatik olarak `https://cehennemgibiyim.github.io/Puantaj` adresine yönlendirecektir.

## Resimli Anlatım

Aşağıdaki adımları takip edin:

1. `Personel Ekle` butonuna tıklayın.

   ![Personel Ekle](docs/personel-ekle.png)

2. `Departman Ekle` butonuna tıklayın.

   ![Departman Ekle](docs/departman-ekle.png)

3. `Departmanlar` menüsünden seçili departmanı değiştirebilirsiniz.

   ![Departman Menüsü](docs/departman-menusu.png)

4. Haftalık ve aylık çalışma saatleri otomatik olarak hesaplanır.

   ![Hesaplama](docs/hesaplama.png)

> Not: Görseller placeholder niteliğindedir. `docs/` klasörüne ekran görüntüleri ekleyerek dokümantasyonu zenginleştirebilirsiniz.
