# Minuto - AI Meeting Workspace

Монгол хэлний хурлын AI туслах - хурлыг бичиж, автомат протокол үүсгэх, хамтран ажиллах систем.

## 🎯 Онцлогүүд

### ✅ Бүрэн ажиллаж буй

#### Хурлын бичлэг
- **Шууд бичлэг**: Браузерээс микрофон ашиглан бичих
- **Файл оруулах**: MP3, WAV, M4A, WebM, OGG, FLAC, AAC формат
- **WebSocket дамжуулалт**: Бодит цагт бичвэр үүсгэх
- **Audio waveform**: Бичлэгийн үед дууны түвшин харуулах

#### AI боловсруулалт
- **Speech-to-Text**: Qwen-Omni API ашиглан монгол хэл таних
- **Meeting Minutes**: Товч агуулга, сэдвүүд, шийдвэр, даалгавар автоматаар үүсгэх
- **Topic Segmentation**: Хурлыг сэдвүүдэд хуваах
- **Ask Minuto**: Хурлын тухай асуулт асуух, хариулт авах

#### Хурлын удирдлага
- **Dashboard**: Нүүр хуудас, статистик, хайлт, шүүлтүүр
- **Meeting Library**: Бүх хурлуудыг жагсаах, grid/list view
- **Archive**: Хурлуудыг архивлах, буцаах
- **Bulk Actions**: Олон хурлыг зэрэг устгах, архивлах

#### Бичвэр засварлах
- **Inline Editing**: Бичвэрийн сегмент засах
- **Speaker Labeling**: Яригчийн нэр засах
- **Find & Replace**: Үг солих
- **Audio Sync**: Бичвэрийг аудиотой синхрончлох

#### Экспорт
- **DOCX Export**: Word форматаар татах
- **PDF Export**: PDF форматаар татах

#### Хамтын ажиллагаа
- **Workspaces**: Personal болон Organization workspace
- **Members**: Гишүүд урих, role-based permissions (owner/admin/editor/viewer)
- **Projects**: Хурлуудыг project-уудад бүлэглэх
- **Action Items**: Төвлөрсөн даалгаврын хуудас

#### Загварууд
- **Default Templates**: Албан хурал, Daily Standup, Brainstorming, Ярилцлага, Сургалт, Төслийн төлөв
- **Custom Templates**: Өөрийн загвар үүсгэх
- **Sections**: Товч агуулга, сэдвүүд, шийдвэр, даалгавар, нээлттэй асуулт

#### Хайлт
- **Cross-Meeting Search**: Бүх хурлаас хайх
- **Filters**: Огноо, оролцогч, хурал
- **Hybrid Search**: Монгол stemming, synonym matching

#### Тохиргоо
- **Profile**: Нэр засах
- **Preferences**: Theme (light/dark/system), language, summary length
- **Vocabulary**: Толь бичиг удирдах

## 🏗️ Архитектур

### Frontend
- **Framework**: Next.js 15 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **State**: React hooks
- **Auth**: JWT token

### Backend
- **Framework**: FastAPI + Python 3.11
- **Database**: PostgreSQL (Render) / SQLite (local)
- **ORM**: SQLAlchemy
- **Auth**: JWT authentication
- **ASR**: Qwen-Omni API (tokenhub.mn)
- **LLM**: Qwen (tokenhub.mn)
- **Export**: python-docx, fpdf2

### Deployment
- **Frontend**: Vercel (https://mongolian-ai-minutes.vercel.app)
- **Backend**: Render (https://minuto-backend.onrender.com)
- **Database**: Render PostgreSQL

## 📦 Локал хөгжүүлэлт

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# .env файл үүсгэх
cp .env.example .env
# .env файлд QWEN_API_KEY оруулна уу

# Сервер асаах
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install

# .env.local файл үүсгэх
cp .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL тохируулна уу

# Хөгжүүлэлтийн сервер
npm run dev
```

## 🔧 Тохируулга

### Environment Variables

**Backend (.env):**
```env
QWEN_API_KEY=your_tokenhub_api_key
QWEN_BASE_URL=https://tokenhub.mn/v1
QWEN_MODEL=qwen3.7-plus
DATABASE_URL=postgresql://...
CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_BASE_URL=https://minuto-backend.onrender.com
```

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Бүртгэл
- `POST /api/auth/login` - Нэвтрэх
- `GET /api/auth/me` - Хэрэглэгчийн мэдээлэл
- `PATCH /api/auth/me` - Профайл шинэчлэх

### Meetings
- `POST /api/meetings` - Шинэ хурал үүсгэх
- `GET /api/meetings` - Бүх хурлуудыг авах
- `GET /api/meetings/{id}` - Хурлын дэлгэрэнгүй
- `PATCH /api/meetings/{id}` - Хурал шинэчлэх
- `DELETE /api/meetings/{id}` - Хурал устгах
- `POST /api/meetings/{id}/upload` - Дуу файл оруулах
- `POST /api/meetings/{id}/process` - Боловсруулах
- `GET /api/meetings/{id}/transcript` - Бичвэр авах
- `PUT /api/meetings/{id}/transcript` - Бичвэр засах
- `GET /api/meetings/{id}/minutes` - Протокол авах
- `POST /api/meetings/{id}/regenerate-summary` - Товч агуулга дахин үүсгэх
- `PUT /api/meetings/{id}/action-items` - Даалгавар шинэчлэх
- `POST /api/meetings/{id}/topics` - Сэдвүүд үүсгэх
- `POST /api/meetings/{id}/archive` - Архивлах
- `POST /api/meetings/{id}/unarchive` - Архиваас гаргах
- `GET /api/meetings/{id}/export.docx` - DOCX экспорт
- `GET /api/meetings/{id}/export.pdf` - PDF экспорт
- `GET /api/meetings/{id}/audio` - Дуу файл авах

### WebSocket
- `WS /ws/meetings/{id}/audio` - Шууд бичлэг

### Ask
- `POST /api/ask` - AI-аас асуух (cross-meeting search)

### Templates
- `GET /api/templates` - Бүх загвар
- `POST /api/templates` - Шинэ загвар үүсгэх
- `DELETE /api/templates/{id}` - Загвар устгах

### Workspaces
- `GET /api/workspaces` - Бүх workspace
- `POST /api/workspaces` - Шинэ workspace үүсгэх
- `GET /api/workspaces/{id}` - Workspace дэлгэрэнгүй
- `GET /api/workspaces/{id}/members` - Гишүүд
- `POST /api/workspaces/{id}/invite` - Гишүүн урих
- `DELETE /api/workspaces/{id}/members/{user_id}` - Гишүүн хасах
- `GET /api/workspaces/{id}/projects` - Project-ууд
- `POST /api/workspaces/{id}/projects` - Project үүсгэх
- `DELETE /api/workspaces/{id}/projects/{id}` - Project устгах

### Vocabulary
- `GET /api/vocabulary` - Толийн жагсаалт
- `POST /api/vocabulary` - Үг нэмэх
- `DELETE /api/vocabulary/{id}` - Үг устгах

### Contacts
- `GET /api/contacts` - Оролцогчид
- `POST /api/contacts` - Оролцогч нэмэх

## 🧪 Тест

```bash
# Backend тест
cd backend
pytest tests/ -v

# Frontend build
cd frontend
npm run build
```

## 🚀 Deploy

### Backend (Render)
1. GitHub repo холбох: https://github.com/shinezayam/minuto
2. Environment variables тохируулах
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1. GitHub repo холбох: https://github.com/shinezayam/minuto-frontend
2. Environment variables: `NEXT_PUBLIC_API_BASE_URL`
3. Auto-deploy on push

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| Database | PostgreSQL (Render) |
| ASR | Qwen-Omni (tokenhub.mn) |
| LLM | Qwen (tokenhub.mn) |
| Export | python-docx, fpdf2 |
| Auth | JWT |
| Hosting | Vercel (frontend), Render (backend) |

## 📝 Хөгжүүлэлтийн явц

- ✅ Phase 1: Design System & Application Shell
- ✅ Phase 2: Dashboard & Meeting Library
- ✅ Phase 3: Recording & Upload Refinement
- ✅ Phase 4: Meeting Details Enhancement
- ✅ Phase 5: Formal Meeting Minutes
- ✅ Phase 6: Action Management
- ✅ Phase 7: Advanced AI Features
- ✅ Phase 8: Templates & Workspaces
- ✅ Phase 9: Settings
- 🔄 Phase 10: Production Readiness

## 👥 Хөгжүүлэгчид

- **Шинэзаяа** - UI/UX Designer & Marketing Manager @ Гэрэгэ Системс
- **Qwen Code** - AI Engineering Assistant

## 📄 Лиценз

Private - Гэрэгэ Системс ХХК

---

**Minuto** - Монгол хэлний хурлын AI туслах 🎙️📝
