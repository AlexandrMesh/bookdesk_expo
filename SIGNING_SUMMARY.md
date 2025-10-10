# 🔐 Краткая сводка - Подпись Android приложения

## ✅ Ответ на ваш вопрос

> "Где указывать key ключи для android сборки в таком варианте?"

**Ответ**: В managed workflow с EAS Build вам **не нужно** указывать ключи вручную! ✨

---

## 🎯 Как это работает

### Автоматическое управление (Рекомендуется) ⭐

EAS автоматически создает и управляет keystore за вас:

```bash
# Просто запустите сборку
npm run build:android:production
```

При первой сборке EAS спросит:
```
? Generate a new Android Keystore? 
```
Ответьте **Yes** ✅

**EAS автоматически:**
1. Создаст keystore
2. Подпишет приложение
3. Сохранит keystore в облаке Expo
4. Будет использовать его для всех последующих сборок

---

## 📋 Три способа управления ключами

### 1️⃣ Автоматический (Рекомендуется для вас!)

**Конфигурация**: Уже настроена! Ничего менять не нужно.

```json
// eas.json - уже правильно настроен
{
  "production": {
    "android": {
      "buildType": "app-bundle"  // ✅ Готово!
    }
  }
}
```

**Использование**:
```bash
npm run build:android:production
# EAS создаст keystore автоматически
```

**Получить SHA для Google Sign In**:
```bash
eas credentials -p android
# → Production → Keystore → Show
```

---

### 2️⃣ Свой keystore (Если у вас уже есть)

Если приложение уже опубликовано с существующим keystore:

**В eas.json добавьте**:
```json
{
  "production": {
    "android": {
      "buildType": "app-bundle",
      "credentialsSource": "local"  // ← Добавить эту строку
    }
  }
}
```

**Создайте credentials.json**:
```json
{
  "android": {
    "keystore": {
      "keystorePath": "./release.keystore",
      "keystorePassword": "YOUR_PASSWORD",
      "keyAlias": "release-key",
      "keyPassword": "YOUR_KEY_PASSWORD"
    }
  }
}
```

**⚠️ Важно**: `credentials.json` уже в `.gitignore` - не коммитится!

---

### 3️⃣ Через EAS Secrets (Для CI/CD)

```bash
# Загрузить keystore как secret
eas secret:create --scope project --name ANDROID_KEYSTORE --type file

# В eas.json:
{
  "production": {
    "android": {
      "credentialsSource": "remote"
    }
  }
}
```

---

## 🚀 Ваш workflow

### Шаг 1: Первая production сборка
```bash
npm run build:android:production
```

При вопросе о keystore:
```
? Generate a new Android Keystore? → Yes ✅
```

### Шаг 2: Получить SHA для Google Sign In
```bash
eas credentials -p android
```
Выберите:
- **Production** 
- **Keystore** 
- **Show**

Скопируйте **SHA-1** и **SHA-256**

### Шаг 3: Добавить в Google Cloud Console
1. Откройте https://console.cloud.google.com/
2. Ваш проект → APIs & Services → Credentials
3. OAuth 2.0 Client ID (Android)
4. Вставьте SHA-1 и SHA-256

### Шаг 4: Готово! 🎉
Скачайте AAB и публикуйте в Google Play.

---

## 📊 Текущая конфигурация вашего проекта

### eas.json ✅
```json
{
  "preview": {
    "android": {
      "buildType": "apk"  // ← Для тестирования
    }
  },
  "production": {
    "android": {
      "buildType": "app-bundle"  // ← Для Google Play
    }
  }
}
```

### .gitignore ✅
```gitignore
*.keystore
*.jks
credentials.json
service-account-key.json
```

**Все уже настроено правильно!** Ничего менять не нужно.

---

## 💡 Преимущества автоматического управления

| Преимущество | Описание |
|--------------|----------|
| ✅ **Просто** | Ничего настраивать не нужно |
| ✅ **Безопасно** | Keystore в облаке Expo |
| ✅ **Надежно** | Не потеряете keystore |
| ✅ **Удобно** | Легко получить SHA |
| ✅ **Быстро** | Работает из коробки |

---

## 🆘 Частые вопросы

### Q: Где хранится keystore?
**A**: В облаке Expo, зашифрованный и безопасный.

### Q: Могу ли я скачать keystore?
**A**: Да! `eas credentials -p android` → Download

### Q: Что если я потеряю keystore?
**A**: Не потеряете - он в облаке Expo. Но сделайте backup!

### Q: Нужно ли создавать keystore вручную?
**A**: Нет! EAS сделает это автоматически.

### Q: Где указать пароли от keystore?
**A**: Никуда! EAS управляет всем автоматически.

---

## 📚 Документация

- **[ANDROID_SIGNING.md](./ANDROID_SIGNING.md)** - полная документация (все 3 способа)
- **[SIGNING_CHEATSHEET.md](./SIGNING_CHEATSHEET.md)** - команды и шпаргалка
- **[QUICK_START.md](./QUICK_START.md)** - общее руководство

---

## 🎯 Итого для вас

**Вам НЕ нужно указывать ключи вручную!**

Просто запустите:
```bash
npm run build:android:production
```

При вопросе о keystore выберите **Yes**, и EAS сделает всё остальное! 🚀

---

**Ваша конфигурация уже готова к использованию!** ✅

