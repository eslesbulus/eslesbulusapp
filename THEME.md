# Eşleş Buluş — Renk Paleti

Bu doküman uygulama genelinde kullanılacak resmi renk paletini içerir. Tüm UI bileşenleri bu tokenları `constants/theme.ts` üzerinden kullanmalı, hard-coded renk kullanılmamalı.

---

## Ana Renkler (Her İki Temada da Aynı)

| Token | Hex | Açıklama |
|-------|-----|----------|
| **Primary** | `#800020` | Bordo / Burgundy — ana marka rengi |
| **Primary Dark** | `#4C0013` | Koyu Bordo — hover/pressed state, gradient ucu |

---

## Koyu Tema (Dark Theme) — **Varsayılan**

| Token | Hex | Kullanım |
|-------|-----|----------|
| Background | `#0A0A0A` | Ana arka plan (neredeyse siyah) |
| Surface | `#1E1E1E` | Modal, sheet, panel arka planı (koyu gri) |
| Card | `#1a1a1a` | Profil kartları, list item arka planı |
| Secondary | `#D4AF37` | Altın sarısı — VIP rozet, premium vurgu |
| Text | `#FFFFFF` | Ana metin |
| Text Muted | `#A0A0A0` | İkincil metin, hint, placeholder |
| Input Bg | `#333333` | TextInput arka planı |

---

## Açık Tema (Light Theme)

| Token | Hex | Kullanım |
|-------|-----|----------|
| Background | `#F5F5F7` | Ana arka plan (çok açık gri) |
| Surface | `#FFFFFF` | Modal, sheet, panel arka planı |
| Card | `#FFFFFF` | Profil kartları, list item arka planı |
| Secondary | `#B8941F` | Koyu altın sarısı — VIP rozet |
| Text | `#1C1C1E` | Ana metin (koyu antrasit) |
| Text Muted | `#6E6E73` | İkincil metin (orta gri) |
| Input Bg | `#F2F2F7` | TextInput arka planı |

---

## Kullanım Kuralları

1. **Asla hard-coded hex yazma** — her zaman `theme.colors.primary` gibi token kullan.
2. **Yeni renk gerektiğinde** önce burada listeye ekle, sonra `theme.ts`'e ekle.
3. **Aktiflik (online) durumu** için sabit `#4CAF50` (yeşil) — her iki temada da aynı.
4. **Yazı kontrast oranları** WCAG AA üstü olmalı (4.5:1 minimum gövde metin için).
5. **Primary (#800020)** üzerine her zaman beyaz metin — light/dark fark etmez.

---

## Önizleme

```
Primary       ████████  #800020
Primary Dark  ████████  #4C0013
Gold          ████████  #D4AF37   (dark)
Gold Dark     ████████  #B8941F   (light)
```
