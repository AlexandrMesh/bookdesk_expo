# 🔐 Подпись Android приложения в EAS Build

## 🎯 Три варианта управления ключами

### 1. Автоматическое управление (Рекомендуется) ✅

**EAS автоматически создает и хранит keystore за вас**

#### Преимущества
- ✅ Самый простой способ
- ✅ EAS создает keystore автоматически при первой сборке
- ✅ Keystore хранится в облаке Expo безопасно
- ✅ Не нужно хранить локально
- ✅ Можно восстановить из облака
- ✅ **Идеально для managed workflow**

#### Как использовать
Ничего настраивать не нужно! Просто запустите:

```bash
eas build --platform android --profile production
```

При первой сборке EAS спросит:
```
? Generate a new Android Keystore? (Y/n)
```
Выберите **Y (Yes)**

EAS автоматически:
1. Создаст новый keystore
2. Подпишет ваше приложение
3. Сохранит keystore в облаке

#### Управление ключами
```bash
# Посмотреть текущие credentials
eas credentials

# Скачать keystore локально (для backup)
eas credentials -p android

# Удалить keystore (осторожно!)
eas credentials -p android --clear
```

---

### 2. Использование локального keystore

**У вас уже есть keystore или нужен полный контроль**

#### Шаг 1: Создайте или используйте существующий keystore

Если у вас уже есть `release.keystore`, пропустите этот шаг.

Создать новый keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

Вас спросят:
- **Keystore password**: придумайте пароль
- **Key password**: придумайте пароль для ключа
- **Distinguished Name**: ваши данные

#### Шаг 2: Создайте файл credentials.json

В корне проекта создайте `credentials.json`:
```json
{
  "android": {
    "keystore": {
      "keystorePath": "./release.keystore",
      "keystorePassword": "YOUR_KEYSTORE_PASSWORD",
      "keyAlias": "release-key",
      "keyPassword": "YOUR_KEY_PASSWORD"
    }
  }
}
```

**⚠️ ВАЖНО**: Добавьте в `.gitignore`:
```
credentials.json
*.keystore
*.jks
```

#### Шаг 3: Загрузите keystore в EAS

```bash
eas credentials
# Выберите: Android → Production → Keystore → Upload
# Укажите путь к файлу credentials.json
```

Или укажите в `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "local"
      }
    }
  }
}
```

---

### 3. Через переменные окружения (CI/CD)

**Для автоматизации в GitHub Actions, GitLab CI и т.д.**

#### Шаг 1: Закодируйте keystore в Base64
```bash
base64 -i release.keystore -o keystore.base64.txt
```

#### Шаг 2: Создайте secrets в EAS

```bash
# Добавьте keystore как secret
eas secret:create --scope project --name ANDROID_KEYSTORE --type file --value keystore.base64.txt

# Добавьте пароли
eas secret:create --scope project --name ANDROID_KEYSTORE_PASSWORD
eas secret:create --scope project --name ANDROID_KEY_PASSWORD
eas secret:create --scope project --name ANDROID_KEY_ALIAS
```

#### Шаг 3: Обновите eas.json
```json
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "remote"
      },
      "env": {
        "ANDROID_KEYSTORE_BASE64": "@ANDROID_KEYSTORE",
        "ANDROID_KEYSTORE_PASSWORD": "@ANDROID_KEYSTORE_PASSWORD",
        "ANDROID_KEY_PASSWORD": "@ANDROID_KEY_PASSWORD",
        "ANDROID_KEY_ALIAS": "@ANDROID_KEY_ALIAS"
      }
    }
  }
}
```

---

## 📋 Сравнение методов

| Метод | Простота | Безопасность | Контроль | Использование |
|-------|----------|--------------|----------|---------------|
| **Автоматический** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Большинство случаев |
| **Локальный keystore** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Полный контроль |
| **Переменные окружения** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | CI/CD автоматизация |

---

## 🎯 Рекомендации для вашего проекта

### Для начала (Рекомендуется)
Используйте **автоматическое управление**:
```bash
# Просто запустите сборку
npm run build:android:production

# EAS создаст и сохранит keystore автоматически
```

### Когда нужен свой keystore
Если приложение уже опубликовано в Google Play с определенным keystore:
1. Используйте **локальный keystore** (вариант 2)
2. Загрузите существующий keystore в EAS

### Для CI/CD
Используйте **переменные окружения** (вариант 3)

---

## ⚙️ Настройка в eas.json

### Вариант 1: Автоматический (по умолчанию)
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"  // или "aab" для Google Play
      }
    }
  }
}
```

### Вариант 2: Локальный keystore
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "local"
      }
    }
  }
}
```

### Вариант 3: Для Google Play (AAB)
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  }
}
```

---

## 🔑 Получение SHA-1/SHA-256 для Google Sign In

### Из EAS credentials
```bash
# Посмотреть информацию о keystore
eas credentials -p android

# Выберите: Production → Keystore → Show
# Скопируйте SHA-1 и SHA-256
```

### Из локального keystore
```bash
keytool -list -v -keystore release.keystore -alias release-key
```

### Добавьте в Google Cloud Console
1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите в **APIs & Services** → **Credentials**
4. Найдите OAuth 2.0 Client ID для Android
5. Добавьте SHA-1 и SHA-256

---

## 🚀 Быстрый старт

### Первая production сборка
```bash
# 1. Убедитесь что залогинены
eas login

# 2. Запустите сборку
npm run build:android:production

# 3. При вопросе о keystore выберите "Yes"
# EAS создаст keystore автоматически

# 4. Дождитесь сборки и скачайте APK/AAB
```

### Получить SHA для Google Sign In
```bash
eas credentials -p android
# Выберите: Production → Keystore → Show
# Скопируйте SHA-1 и SHA-256
# Добавьте в Google Cloud Console
```

---

## ⚠️ Важные моменты

### Backup keystore
**ОБЯЗАТЕЛЬНО сделайте backup keystore!**
```bash
eas credentials -p android
# Выберите: Production → Keystore → Download
```
Сохраните файл в безопасном месте.

### Потеря keystore
Если потеряете keystore:
- ❌ Не сможете обновлять приложение в Google Play
- ❌ Придется публиковать как новое приложение
- ✅ Но в EAS он хранится в облаке!

### .gitignore
Никогда не коммитьте:
```gitignore
*.keystore
*.jks
credentials.json
*.p12
*.pem
```

### Google Play требует AAB
Для публикации в Google Play измените в `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"  // Вместо "apk"
      }
    }
  }
}
```

---

## 📚 Дополнительные ресурсы

- [EAS Build Credentials](https://docs.expo.dev/app-signing/app-credentials/)
- [Android App Signing](https://docs.expo.dev/app-signing/android-credentials/)
- [Google Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

---

## 🎯 Итого для вашего проекта

**Рекомендация**: Используйте автоматическое управление keystore через EAS

1. Ничего не меняйте в `eas.json` (текущая конфигурация подходит)
2. Запустите: `npm run build:android:production`
3. При первой сборке выберите "Yes" для создания keystore
4. После сборки получите SHA через `eas credentials`
5. Добавьте SHA в Google Cloud Console

Готово! 🚀

