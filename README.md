# Remote Çalışma Takip Sistemi

Remote Çalışma Takip Sistemi, hibrit çalışma düzenindeki ekiplerin haftalık remote/ofis programını yöneten bir takvim ve planlama uygulamasıdır.

Ekipler **Geliştirici/Analiz** ve **Test/Raporlama** olarak iki departmana, her departman da **A** ve **B** olmak üzere iki gruba ayrılır. Proje yöneticisi ve takım liderleri haftalık planı belirler; çalışanlar kendi takvimlerini günlük olarak görüp PDF olarak dışa alabilir.

Takım liderleri kendi haftalık şablonunu (REMOTE/OFFICE) tanımlar ve gerektiğinde gün bazlı override yapar. Türkiye resmi tatilleri **Nager.Date** üzerinden otomatik senkronize edilir; aynı güne plan atanmak istenirse uyarı gösterilir.

Yetkilendirme rol bazlıdır. Süper admin tüm sistemi yönetir, takım liderleri kendi departmanını yönetir, standart kullanıcılar yalnızca kendi takvimlerini görür.

---
## Deployment

- http://172.18.98.9:3002 adresinden erişilebilir.
- 172.18.98.9 sunucusunda docker compose olrak çalışmaktadır.
- Repo: https://analizgitea.mhrs.gov.tr/remote_tracker/remote_tracker
- Deploymentlar actions üzerinden manuel yapılmalı
- CI klasörü altında bulunun Dockerfile.base 'den gerekli imageler üretilmiş repoya pushlanmıştır. Maven veya npm tarafı için bir paket güncellemesi gerekirse base imageler yeniden build edilip pushlanmalı.
- GIT_TOKEN , DOCKER_PASSWOR , JWT_SECRET , INITIAL_USER_PASSWORD secret olarak gitea ya eklendi. GIT_USERNAME , DOCKER_USERNAME variable olarak giteaya eklendi.
---

## Özellikler

- Aylık takvim üzerinde A/B grup bazlı haftalık planlama
- Kişisel takvim ve PDF çıktısı (DEV/TEST kullanıcıları için)
- Sürükle-bırak ile A↔B grup geçişi
- Takım lideri haftalık şablonu + gün bazlı override
- Departman bazlı analiz dashboard'u (kişi başı remote/ofis ortalaması)
- Türkiye resmi tatilleri (Nager.Date senkronizasyonu + manuel ekleme)
- Aylık plan için Excel ve PDF dışa aktarma
- Beş seviyeli rol modeli (`SUPER_ADMIN`, `TEAM_LEAD_DEV`, `TEAM_LEAD_TEST`, `DEV`, `TEST`)

---

## Roller

| Rol | Kapsam |
|---|---|
| `SUPER_ADMIN` | Tüm departmanlar, kullanıcı yönetimi, tatil yönetimi |
| `TEAM_LEAD_DEV` | Geliştirici/Analiz planı + DEV kullanıcı CRUD |
| `TEAM_LEAD_TEST` | Test/Raporlama planı + TEST kullanıcı CRUD |
| `DEV` / `TEST` | Yalnızca kendi takvimi ve PDF çıktısı |

---

## Mimari Notlar

- Şema yönetimi Hibernate `ddl-auto: update` ile (Flyway yok).
- Lead takvimi `lead_schedule_templates` (haftalık şablon) + `lead_schedule_overrides` (gün üst-yazma) yapısıyla tutulur.
- Resmi tatiller startup'ta ve `0 0 3 1 12 *` cron'u ile Nager.Date'ten çekilir.
- Departman bilgisi `Role` enum'ından türetilir (`Role.department()`).
- BCrypt strength=12, JWT 24 saat, CORS değerleri ortam değişkeninden okunur.

---

## Teknoloji Stack

### Backend
- Java 21
- Spring Boot 4
- Spring Security (JWT)
- Spring Data JPA
- PostgreSQL 16
- MapStruct
- Apache POI (Excel export)
- OpenPDF (PDF export)
- Nager.Date entegrasyonu

### Frontend
- React 18
- Vite
- TypeScript
- TailwindCSS
- TanStack Query
- Zustand
- React Router
- React Hook Form + Zod

### DevOps
- Docker Compose

---

## Hızlı Başlangıç

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
