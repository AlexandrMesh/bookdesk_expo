## Bookdesk

Документация по разработке, сборке и обновлению приложения.

---

### Запуск приложения (локальная разработка)

- **Установка зависимостей**

  ```bash
  npm install
  ```

- **Старт в режиме разработки (Expo / Expo Go)**

  ```bash
  npm start
  # или
  npx expo start
  ```

  - Откройте приложение в **Expo Go** на устройстве (QR‑код в терминале/браузере) или в эмуляторе Android/iOS.
  - Все UI, навигация, Redux и логика работают в этом режиме.
  - Нативные модули (Google Sign In, Yandex Ads) полноценно тестируются в сборках EAS, а не в Expo Go (подробнее см. `README_EXPO_GO.md`).

---

### Хранение API ключей

Приложение использует следующие API ключи:

- **GROQ_API_KEY** — для AI‑рекомендаций книг
- **GOOGLE_BOOKS_API_KEY** — для поиска книг через Google Books API
- **GOOGLE_SEARCH_API_KEY** — для загрузки обложек через Google Custom Search API

#### Локальная разработка (`.env` файл)

Для локальной разработки создайте файл `.env` в корне проекта:

```env
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
```

**Важно:**

- Файл `.env` уже добавлен в `.gitignore` и **не коммитится** в репозиторий.
- Ключи загружаются через `app.config.ts` (используется `dotenv`) и доступны в приложении через `Constants.expoConfig.extra.*`.

#### Продакшн билды (EAS Environment Variables)

Для продакшн сборок ключи хранятся в **EAS Environment Variables** (ранее назывались EAS Secrets).

**Просмотр существующих переменных:**

```bash
eas env:list
```

**Создание/обновление переменных:**

```bash
# Для production окружения
eas env:create --name GROQ_API_KEY --value "your_groq_api_key" --environment production
eas env:create --name GOOGLE_BOOKS_API_KEY --value "your_google_books_key" --environment production
eas env:create --name GOOGLE_SEARCH_API_KEY --value "your_google_search_key" --environment production

# Для preview окружения (если нужно)
eas env:create --name GROQ_API_KEY --value "your_groq_api_key" --environment preview
```

**Удаление переменной:**

```bash
eas env:delete --name GROQ_API_KEY --environment production
```

**Замена ключа (ротация):**

1. Создайте новую переменную с тем же именем — EAS автоматически перезапишет старое значение:

   ```bash
   eas env:create --name GROQ_API_KEY --value "новый_ключ" --environment production
   ```

2. Или сначала удалите, затем создайте заново:

   ```bash
   eas env:delete --name GROQ_API_KEY --environment production
   eas env:create --name GROQ_API_KEY --value "новый_ключ" --environment production
   ```

**Как это работает:**

- При локальной разработке: `app.config.ts` читает `.env` через `dotenv/config` → ключи попадают в `process.env.*` → доступны в `Constants.expoConfig.extra.*`.
- При EAS Build: EAS автоматически подставляет переменные окружения из `eas env` в `process.env.*` во время сборки → `app.config.ts` читает их → ключи доступны в `Constants.expoConfig.extra.*`.

**Безопасность:**

- ✅ Ключи **никогда не попадают в Git** (`.env` в `.gitignore`).
- ✅ В продакшн билдах ключи хранятся на серверах EAS и доступны только во время сборки.
- ✅ Ключи попадают в финальный бинарник приложения, но не в исходный код репозитория.

---

### Сборка приложений (EAS Build)

Профили сборок настроены в `eas.json`. Основные команды (см. `package.json`):

- **Android (preview / тестирование)**

  ```bash
  npm run build:android:preview
  ```

- **Android (production / релиз в Google Play)**

  ```bash
  npm run build:android:production
  ```

- **iOS (preview)**

  ```bash
  npm run build:ios:preview
  ```

- **iOS (production)**

  ```bash
  npm run build:ios:production
  ```

Замечания:

- `prebuildCommand: "expo prebuild --clean"` выполняется **на серверах Expo**, локально prebuild обычно запускать не нужно.
- Подробности по подписи и настройке ключей см. в файлах `ANDROID_SIGNING.md`, `SIGNING_CHEATSHEET.md`, `SIGNING_SUMMARY.md`, `EAS_BUILD_SETUP.md`.

---

### Обновление Expo SDK и зависимостей

Рекомендуемый общий процесс:

1. Зафиксировать текущее состояние в Git.
2. Запустить команду обновления Expo SDK:

   ```bash
   npx expo upgrade
   ```

   Expo обновит `expo`, `react-native` и связанные пакеты, подскажет, что нужно изменить.

3. Обновить EAS CLI до актуальной версии:

   ```bash
   npm install -D eas-cli@latest
   ```

4. Проверить, что проект собирается и запускается:

   ```bash
   npm run lint
   npm start
   npm run build:android:preview
   ```

5. Протестировать основные сценарии в Expo Go и в preview/production сборке.

---

### Обновления через EAS Update (OTA)

Для выката OTA‑обновлений (JS/Assets без новой нативной сборки) используются команды:

- **Отправить обновление на канал `preview`**

  ```bash
  npm run update:preview
  ```

- **Отправить обновление на канал `production`**

  ```bash
  npm run update:production
  ```

- **Посмотреть историю обновлений**

  ```bash
  npm run update:list:preview
  npm run update:list:production
  ```

Важно:

- OTA‑обновления подходят для изменений JS/стилей/ассетов.
- Любые изменения, требующие обновления нативного кода (SDK, новые нативные модули и т.п.), требуют **новой EAS Build** и публикации новой версии приложения в стор.

---

### Удалённый конфиг и Яндекс.Диск (обновление версии приложения)

Приложение получает удалённый конфиг (`config.json`) с Яндекс.Диска:

- Используется публичный ресурс:
  - `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=https://disk.yandex.ru/d/AoLEwxwE9ksmaw`
  - Из ответа берётся поле `file` — прямая ссылка на `config.json` на Яндекс.Диске.
- Логика загрузки описана в `src/utils/versionCheck.ts` в функции `fetchRemoteConfig`.

**После выпуска новой версии приложения (новая сборка и публикация в стор):**

1. Откройте на Яндекс.Диске публичный ресурс с конфигом (`config.json`), который используется приложением.
2. Обновите в `config.json` значение поля **`appVersion`**:
   - Версия должна соответствовать актуальной версии приложения (той, что указана в `app.json` и используется в сторе).
   - При необходимости скорректируйте поле `minimumSupportedAppVersion`, если хотите принудительно «отрубить» слишком старые версии.
3. Сохраните/перезапишите файл `config.json` на Яндекс.Диске **так, чтобы публичная ссылка и `public_key` не менялись**.
4. При следующем запуске приложения:
   - `versionCheck.ts` загрузит новый конфиг,
   - функция `checkForAppUpdate` сравнит локальную версию с `appVersion` из конфига,
   - в профиле приложения отобразится информация о доступном обновлении (если на сервере версия больше).

Таким образом, после каждого релиза достаточно:

- собрать и опубликовать новую версию приложения;
- обновить `appVersion` в удалённом `config.json` на Яндекс.Диске —
  и приложение корректно покажет пользователю информацию об обновлении.
