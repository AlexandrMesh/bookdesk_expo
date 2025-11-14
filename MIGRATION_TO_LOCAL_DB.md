# План миграции на полностью локальную базу данных

## Обзор

Этот документ описывает план полной миграции приложения BookDesk на работу исключительно с локальной SQLite базой данных, без использования внешнего API/backend сервера.

## Текущее состояние (до миграции)

### ✅ Уже работает на локальной БД

**Все операции записи и чтения данных пользователя работают через локальную БД:**

1. **Управление книгами**
   - ✅ Загрузка списка книг - из локальной БД (fallback на сервер только при первом запуске)
   - ✅ Поиск книг - полностью через локальную БД
   - ✅ Изменение статуса книги - локальная БД
   - ✅ Обновление даты добавления - локальная БД
   - ✅ Сохранение заметок - локальная БД
   - ✅ Сохранение рейтингов - локальная БД
   - ✅ Обновление лайков - локальная БД
   - ✅ Удаление заметок - локальная БД
   - ✅ Удаление рейтингов - локальная БД
   - ✅ Загрузка категорий - из локальной БД (fallback на сервер только при первом запуске)

2. **Управление целями**
   - ✅ Создание цели - локальная БД
   - ✅ Обновление цели - локальная БД
   - ✅ Удаление цели - локальная БД
   - ✅ Загрузка элементов цели - из локальной БД (fallback на сервер только при первом запуске)
   - ✅ Добавление элемента цели - локальная БД
   - ✅ Удаление элемента цели - локальная БД

3. **Профиль пользователя**
   - ✅ Загрузка профиля - из локальной БД
   - ✅ Создание гостевого пользователя - локальная БД (для новых пользователей без токена)
   - ✅ Загрузка рейтингов, лайков, заметок, целей - из локальной БД при запуске

4. **Статистика**
   - ✅ Статистика книг - подсчитывается локально из единой таблицы `books`
   - ✅ Статистика страниц - подсчитывается локально из `goal_items`

5. **Кастомные книги**
   - ✅ Создание - локальная БД
   - ✅ Обновление - локальная БД
   - ✅ Удаление - локальная БД

### ⚠️ Еще использует API (будет удалено)

1. **Синхронизация данных при первом запуске**
   - `checkAuthAndSyncDB` - загружает данные с сервера при первом входе пользователя
   - `loadBookList` - fallback на сервер если нет данных в локальной БД
   - `loadCategories` - fallback на сервер если нет категорий в локальной БД
   - `getGoalItems` - fallback на сервер если нет элементов цели в локальной БД

2. **HTTP сервисы (будут удалены)**
   - `AuthService` - авторизация, регистрация, проверка токена
   - `DataService` - загрузка книг и категорий
   - `GoalsService` - загрузка элементов цели
   - `CustomBooksService` - операции с кастомными книгами (если используется)
   - `AppService` - информация о приложении, поддержка

## Структура локальной базы данных

Все данные пользователя сохраняются в SQLite базу данных (`bookdesk.db`):

- **books** - единая таблица со всеми данными книг (название, статус, авторы, обложка, страницы, категория, рейтинг, лайки, дата добавления, заметки)
- **board_data** - кэш данных досок (книги с фильтрами и сортировкой)
- **book_ratings** - рейтинги книг пользователя (дублируется в `books`)
- **book_votes** - количество лайков книг (дублируется в `books`)
- **user_votes** - лайки пользователя (массив)
- **book_dates** - даты добавления книг и их статусы (дублируется в `books`)
- **book_notes** - заметки пользователя к книгам (дублируется в `books`)
- **goal_items** - элементы целей (прочитанные страницы)
- **user_goal** - цели пользователя (количество страниц, тип)
- **user_profile** - профиль пользователя (ID, email, дата регистрации, флаги синхронизации)
- **categories** - категории книг (кэш)

**Примечание:** Таблицы `book_ratings`, `book_votes`, `book_dates`, `book_notes` сохраняются для обратной совместимости, но основная таблица `books` содержит все данные.

## План миграции

### Этап 1: Период синхронизации (10-15 дней)

**Цель:** Дать всем пользователям возможность войти в приложение и синхронизировать свои данные с локальной БД.

**Действия:**
1. Выпустить обновление приложения с текущим кодом (API еще работает)
2. Пользователи при входе автоматически синхронизируют данные через `checkAuthAndSyncDB`
3. После успешной синхронизации устанавливается флаг `syncDatabaseCompleted = true`
4. Все последующие операции работают только с локальной БД

**Проверка готовности к следующему этапу:**
- [ ] Подождать 10-15 дней после релиза
- [ ] Проверить метрики: сколько пользователей зашли в приложение
- [ ] Убедиться, что большинство активных пользователей синхронизировали данные

### Этап 2: Удаление API кода (после периода синхронизации)

**Цель:** Полностью удалить весь код, обращающийся к внешнему API, чтобы приложение работало только с локальной БД.

**Дата начала:** После завершения периода синхронизации (10-15 дней)

## Детальный план удаления API кода

### Шаг 1: Удаление HTTP сервисов

#### 1.1. Удалить AuthService

**Файл:** `src/http/services/auth.ts`

**Действие:** Удалить весь файл

**Файлы для обновления:**
- `src/redux/actions/authActions.ts` - удалить все вызовы `AuthService()`
- Удалить импорт `import AuthService from '~http/services/auth';`

#### 1.2. Удалить DataService

**Файл:** `src/http/services/books.ts`

**Действие:** Удалить весь файл

**Файлы для обновления:**
- `src/redux/actions/booksActions.ts` - удалить вызовы `DataService().getBookList()` и `DataService().getCategories()`
- Удалить импорт `import DataService from '~http/services/books';`

#### 1.3. Удалить GoalsService

**Файл:** `src/http/services/goals.ts`

**Действие:** Удалить весь файл

**Файлы для обновления:**
- `src/redux/actions/goalsActions.ts` - удалить вызов `GoalsService().getGoalItems()`
- Удалить импорт `import GoalsService from '~http/services/goals';`

#### 1.4. Удалить CustomBooksService

**Файл:** `src/http/services/customBooks.ts`

**Действие:** Удалить весь файл (если используется)

**Файлы для обновления:**
- Проверить использование в коде и удалить все вызовы
- Удалить импорт `import CustomBooksService from '~http/services/customBooks';`

#### 1.5. Удалить AppService

**Файл:** `src/http/services/app.ts`

**Действие:** Удалить весь файл

**Файлы для обновления:**
- `src/redux/actions/appActions.ts` - удалить вызов `AppService().supportApp()` (если используется)
- Удалить импорт `import AppService from '~http/services/app';`

### Шаг 2: Обновление Redux actions

#### 2.1. Обновить `checkAuthAndSyncDB` в `src/redux/actions/authActions.ts`

**Текущее поведение:** Загружает данные с сервера при первом входе

**Новое поведение:** Работает только с локальной БД

```typescript
export const checkAuthAndSyncDB = createAsyncThunk(`${PREFIX}/checkAuthAndSyncDB`, async (_, { dispatch, rejectWithValue }) => {
  // Проверяем, есть ли профиль в локальной БД
  const existingProfile = await loadProfile();
  
  if (existingProfile) {
    // Профиль есть - загружаем данные из локальной БД
    const localGoal = await loadGoal();
    if (localGoal) {
      dispatch(setGoal({ pages: localGoal.numberOfPages || 0, type: localGoal.goalType as any }));
    }
    
    // Загружаем все данные из локальной БД
    const localBookNotes = await loadBookNotes();
    if (localBookNotes.length > 0) {
      dispatch(setBookNotes(localBookNotes));
    }
    
    const localUserVotes = await loadUserVotes();
    if (localUserVotes.length > 0) {
      dispatch(setBookVotes(localUserVotes));
    }
    
    const localRatings = await loadBookRatings();
    if (localRatings.length > 0) {
      dispatch(userBookRatingsLoaded(localRatings));
    }
    
    await dispatch(getGoalItems()).unwrap();
    
    // Загружаем книги из локальной БД
    const boardTypes = [PLANNED, IN_PROGRESS, COMPLETED] as const;
    for (const boardType of boardTypes) {
      try {
        await dispatch(loadBookListFromLocalDB({ boardType, shouldLoadMoreResults: false })).unwrap();
      } catch (error) {
        console.error(`Error loading books for board ${boardType} from local DB:`, error);
      }
    }
    
    return {
      profile: existingProfile as IProfile,
      isSignedIn: !!existingProfile?.email,
    };
  }
  
  // Профиля нет - создаем гостевого пользователя
  await saveGuestProfile();
  const newProfile = await loadProfile();
  
  return {
    profile: newProfile as IProfile,
    isSignedIn: false,
  };
});
```

**Удалить:**
- Все вызовы `AuthService().checkAuth()`
- Загрузку данных с сервера
- Установку `syncDatabaseCompleted` (больше не нужен)

#### 2.2. Обновить `loadBookList` в `src/redux/actions/booksActions.ts`

**Текущее поведение:** Загружает с сервера если нет данных в локальной БД

**Новое поведение:** Работает только с локальной БД, возвращает пустой массив если данных нет

```typescript
export const loadBookList = createAsyncThunk(
  `${PREFIX}/loadBookList`,
  async ({ boardType, shouldLoadMoreResults }: { boardType: BookStatus; shouldLoadMoreResults: boolean }, { getState }: AppThunkAPI) => {
    // Всегда загружаем из локальной БД
    const cachedData = await loadBoardData(...);
    if (cachedData) {
      return cachedData;
    }
    
    // Если данных нет - возвращаем пустой массив
    return {
      boardType,
      data: [],
      totalItems: 0,
      hasNextPage: false,
      shouldLoadMoreResults: false,
      booksCountByYear: null,
      fromCache: true,
    };
  },
);
```

**Удалить:**
- Вызов `DataService().getBookList()`
- Логику загрузки с сервера
- Конвертацию обложек (если она зависела от сервера)

#### 2.3. Обновить `loadCategories` в `src/redux/actions/booksActions.ts`

**Текущее поведение:** Загружает с сервера если нет категорий в локальной БД

**Новое поведение:** Работает только с локальной БД

```typescript
export const loadCategories = createAsyncThunk(
  `${PREFIX}/loadCategories`,
  async (language: string) => {
    await initDatabase();
    const categoriesFromDB = await loadCategories(language);
    
    if (categoriesFromDB.length > 0) {
      return categoriesFromDB;
    }
    
    // Если категорий нет - инициализируем из config/categories.ts
    const { initializeCategoriesFromJson } = await import('~utils/boardStorage');
    const initializedCategories = await initializeCategoriesFromJson(language);
    
    return initializedCategories;
  },
);
```

**Удалить:**
- Вызов `DataService().getCategories()`
- Логику загрузки с сервера

#### 2.4. Обновить `getGoalItems` в `src/redux/actions/goalsActions.ts`

**Текущее поведение:** Загружает с сервера если нет элементов в локальной БД

**Новое поведение:** Работает только с локальной БД

```typescript
export const getGoalItems = createAsyncThunk(`${PREFIX}/getGoalItems`, async () => {
  await initDatabase();
  const localGoalItems = await loadGoalItems();
  
  return localGoalItems as IGoal[];
});
```

**Удалить:**
- Вызов `GoalsService().getGoalItems()`
- Логику загрузки с сервера

#### 2.5. Удалить неиспользуемые actions

**Файл:** `src/redux/actions/authActions.ts`

**Удалить методы:**
- `signIn` - не используется (экраны авторизации удалены)
- `signUp` - не используется (экраны регистрации удалены)
- `signInFailed` - не используется
- `setSignInError` - не используется
- `setSignUpError` - не используется

### Шаг 3: Обновление логики инициализации

#### 3.1. Обновить `initializeApp` в `src/screens/Main/index.tsx`

**Удалить:**
- Вызов `checkAuthAndSyncDB` (заменить на простую загрузку из локальной БД)
- Логику проверки `syncDatabaseCompleted` (больше не нужна)

**Новое поведение:**
```typescript
const initializeApp = useCallback(async () => {
  try {
    await initDatabase();
    
    // Загружаем профиль из локальной БД
    let profile = await loadProfile();
    
    if (!profile) {
      // Профиля нет - создаем гостевого пользователя
      await saveGuestProfile();
      profile = await loadProfile();
    }
    
    // Загружаем все данные из локальной БД
    const localGoal = await loadGoal();
    if (localGoal) {
      dispatch(setGoal({ pages: localGoal.numberOfPages || 0, type: localGoal.goalType as any }));
    }
    
    // ... загрузка остальных данных из локальной БД
    
    dispatch(initializationComplete({ profile, isSignedIn: !!profile?.email }));
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}, [dispatch]);
```

### Шаг 4: Удаление конфигурации API

#### 4.1. Обновить `src/config/api.ts`

**Удалить или оставить заглушки:**
```typescript
// Можно удалить функцию getApiUrl или оставить заглушку
export const getApiUrl = async (): Promise<string> => {
  // Возвращаем пустую строку - больше не используется
  return '';
};

// getImgUrl может остаться если используется для локальных изображений
export const getImgUrl = async () => {
  const imgUrl = await AsyncStorage.getItem('imgUrl');
  return imgUrl ? `${imgUrl}/images/covers` : `${APP_CONFIG.imgUrl}/images/covers`;
};
```

#### 4.2. Удалить `src/http/http.ts`

**Действие:** Удалить весь файл (axios больше не нужен)

**Файлы для обновления:**
- Удалить все импорты `import http from '~http/http';`

### Шаг 5: Удаление экранов и компонентов

#### 5.1. Удалить экраны авторизации (если еще есть)

**Файлы для удаления:**
- `src/screens/Auth/SignIn/` - весь каталог
- `src/screens/Auth/SignUp/` - весь каталог

#### 5.2. Удалить маршруты

**Файл:** `src/constants/routes.ts`

**Удалить:**
```typescript
export const SIGN_IN_ROUTE = 'SignIn';
export const SIGN_UP_ROUTE = 'SignUp';
```

### Шаг 6: Очистка Redux

#### 6.1. Обновить `src/redux/reducers/authReducer.ts`

**Удалить обработчики:**
- `signIn.pending`, `signIn.fulfilled`, `signIn.rejected`
- `signUp.pending`, `signUp.fulfilled`, `signUp.rejected`
- `setSignInError`, `setSignUpError`, `signInFailed`
- `checkAuthAndSyncDB` - обновить логику (убрать синхронизацию с сервером)

#### 6.2. Обновить `src/redux/selectors/auth.ts`

**Удалить селекторы (если не используются):**
- `getSignInLoadingDataStatus`
- `getSignInErrors`
- `getIsSignedUp`
- `getSignUpLoadingDataStatus`
- `getSignUpErrors`

#### 6.3. Удалить неиспользуемые поля из state

**Файл:** `src/redux/reducers/authReducer.ts`

**Удалить из интерфейса состояния:**
- `signInLoadingDataStatus`
- `signInErrors`
- `isSignedUp`
- `signUpLoadingDataStatus`
- `signUpErrors`
- `syncDatabaseCompleted` (если больше не используется)

### Шаг 7: Удаление зависимостей

**Файл:** `package.json`

**Удалить пакеты:**
- `axios` - больше не используется для HTTP запросов
- `@react-native-community/netinfo` - если был установлен (проверка интернета)

**Команда:**
```bash
npm uninstall axios @react-native-community/netinfo
# или
yarn remove axios @react-native-community/netinfo
```

### Шаг 8: Очистка кода

#### 8.1. Удалить неиспользуемые импорты

**Проверить и удалить во всех файлах:**
- `import AuthService from '~http/services/auth';`
- `import DataService from '~http/services/books';`
- `import GoalsService from '~http/services/goals';`
- `import CustomBooksService from '~http/services/customBooks';`
- `import AppService from '~http/services/app';`
- `import { getApiUrl } from '~config/api';` (если не используется)
- `import http from '~http/http';`

#### 8.2. Удалить неиспользуемые функции

**Проверить и удалить:**
- Функции, которые вызывают API сервисы
- Обработчики ошибок API
- Логику retry для API запросов

## Чеклист для удаления API кода

### Подготовка
- [ ] Подождать 10-15 дней после релиза с синхронизацией
- [ ] Проверить метрики: сколько пользователей зашли в приложение
- [ ] Убедиться, что большинство активных пользователей синхронизировали данные

### Удаление HTTP сервисов
- [ ] Удалить `src/http/services/auth.ts`
- [ ] Удалить `src/http/services/books.ts`
- [ ] Удалить `src/http/services/goals.ts`
- [ ] Удалить `src/http/services/customBooks.ts` (если используется)
- [ ] Удалить `src/http/services/app.ts`
- [ ] Удалить `src/http/http.ts`

### Обновление Redux actions
- [ ] Обновить `checkAuthAndSyncDB` - убрать синхронизацию с сервером
- [ ] Обновить `loadBookList` - убрать fallback на сервер
- [ ] Обновить `loadCategories` - убрать fallback на сервер
- [ ] Обновить `getGoalItems` - убрать fallback на сервер
- [ ] Удалить методы `signIn`, `signUp` из `authActions.ts`
- [ ] Удалить неиспользуемые actions

### Обновление логики инициализации
- [ ] Обновить `initializeApp` в `src/screens/Main/index.tsx`
- [ ] Убрать проверку `syncDatabaseCompleted`
- [ ] Убрать вызов `checkAuthAndSyncDB` (заменить на загрузку из локальной БД)

### Удаление конфигурации
- [ ] Обновить `src/config/api.ts` (удалить или оставить заглушки)
- [ ] Удалить `getApiUrl` или оставить пустую заглушку

### Удаление экранов и компонентов
- [ ] Удалить `src/screens/Auth/SignIn/` (если есть)
- [ ] Удалить `src/screens/Auth/SignUp/` (если есть)
- [ ] Удалить маршруты `SIGN_IN_ROUTE` и `SIGN_UP_ROUTE`

### Очистка Redux
- [ ] Обновить `src/redux/reducers/authReducer.ts` - убрать обработчики signIn/signUp
- [ ] Удалить неиспользуемые селекторы из `src/redux/selectors/auth.ts`
- [ ] Удалить неиспользуемые поля из state

### Удаление зависимостей
- [ ] Удалить `axios` из `package.json`
- [ ] Удалить `@react-native-community/netinfo` из `package.json` (если установлен)

### Очистка кода
- [ ] Удалить все неиспользуемые импорты API сервисов
- [ ] Удалить обработчики ошибок API
- [ ] Удалить логику retry для API запросов
- [ ] Проверить все файлы на наличие упоминаний API

### Тестирование
- [ ] Протестировать создание гостевого пользователя
- [ ] Протестировать загрузку данных из локальной БД
- [ ] Протестировать сохранение и загрузку рейтингов
- [ ] Протестировать сохранение и загрузку лайков
- [ ] Протестировать сохранение и загрузку заметок
- [ ] Протестировать работу с целями
- [ ] Протестировать работу с кастомными книгами
- [ ] Протестировать статистику
- [ ] Протестировать работу приложения в офлайн режиме
- [ ] Протестировать работу для новых пользователей (без данных)

## Итоговое состояние после миграции

**Приложение будет работать полностью офлайн, используя только локальную SQLite базу данных:**

- ✅ Все операции записи работают через локальную БД
- ✅ Все операции чтения работают через локальную БД
- ✅ Новые пользователи автоматически создаются как гостевые
- ✅ При перезапуске все данные загружаются из локальной БД
- ✅ Нет зависимости от внешнего API/backend сервера
- ✅ Приложение работает полностью офлайн

## Важные замечания

1. **Период синхронизации критически важен** - нужно дать пользователям достаточно времени для синхронизации данных
2. **После удаления API кода** - новые пользователи будут работать с пустыми данными (без книг, категорий и т.д.)
3. **Резервное копирование** - рекомендуется создать механизм экспорта/импорта данных для пользователей
4. **Тестирование** - обязательно протестировать все сценарии перед релизом версии без API

## Дата начала миграции

**Период синхронизации:** [УКАЗАТЬ ДАТУ РЕЛИЗА] + 10-15 дней

**Дата удаления API кода:** [УКАЗАТЬ ДАТУ] (после завершения периода синхронизации)

---

**Документ обновлен:** [УКАЗАТЬ ДАТУ]
