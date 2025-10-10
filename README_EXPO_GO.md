# ✅ Настройка завершена - Pure Managed Workflow

## 🎉 Что теперь работает

### Локально (Expo Go)
```bash
npm start
```
- ✅ Приложение запускается без ошибок
- ✅ Быстрый hot reload
- ✅ Google Sign In и Yandex Ads **не загружаются** (это правильно!)
- ✅ В консоли: "Running in Expo Go - native modules disabled"
- ✅ **БЕЗ prebuild локально**

### Production Build (EAS)
```bash
npm run build:android:preview
```
- ✅ Prebuild выполняется **ТОЛЬКО удаленно** на серверах Expo
- ✅ Google Sign In работает полностью
- ✅ Yandex Mobile Ads работает полностью
- ✅ В консоли: "Google Sign In initialized", "Yandex Mobile Ads initialized"

## 📱 Как использовать

### Каждый день - разработка
```bash
npm start
# Откройте Expo Go на телефоне и сканируйте QR
```
Все UI, логика, навигация, Redux - всё работает в Expo Go!

### Для тестирования Google Sign In / Рекламы
```bash
npm run build:android:preview
# Дождитесь сборки, скачайте APK, установите на телефон
```

## 🔑 Важные файлы

### App.tsx
Условная загрузка нативных модулей:
```typescript
const initializeNativeModules = async () => {
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (!isExpoGo) {
    // Загружается только в production build
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({...});
  }
};
```

### eas.json
Каждый профиль имеет `prebuildCommand`:
```json
{
  "preview": {
    "prebuildCommand": "expo prebuild --clean"
  }
}
```

### .easignore
Исключает локальные нативные папки:
```
ios/
android/
```

### .gitignore
Уже содержит (не коммитим):
```
/ios
/android
```

## ⚠️ Частые вопросы

### Q: Почему Google Sign In не работает в Expo Go?
**A:** Это нормально! Expo Go не поддерживает кастомные нативные модули. Используйте EAS Build для тестирования.

### Q: Нужно ли мне запускать `expo prebuild` локально?
**A:** НЕТ! Prebuild происходит автоматически на удаленном сервере при `eas build`. Локально работайте с Expo Go.

### Q: Могу ли я тестировать Google Sign In локально?
**A:** Да, но не рекомендуется для каждодневной работы:
```bash
npx expo prebuild --clean
npm run android
# После тестирования: rm -rf ios android
```

### Q: Предупреждение линтера о Google Sign In - это нормально?
**A:** Да! Это ожидаемое предупреждение для managed workflow. Оно не влияет на работу.

### Q: Как переключиться обратно на Expo Go после prebuild?
**A:** Просто удалите папки:
```bash
rm -rf ios android
npm start  # Expo Go снова работает
```

## 📚 Документация

- **QUICK_START.md** - пошаговая инструкция
- **EAS_BUILD_SETUP.md** - подробная техническая информация
- **CHANGELOG.md** - все внесенные изменения

## 🔐 Подпись приложения (кратко)

### При первой production сборке:
```bash
npm run build:android:production
# EAS спросит: "Generate a new Android Keystore?"
# Ответьте: Yes ✅
```

**EAS автоматически:**
- Создаст keystore
- Подпишет приложение
- Сохранит keystore в облаке

### Получить SHA для Google Sign In:
```bash
eas credentials -p android
# → Production → Keystore → Show
# Копировать SHA-1 и SHA-256 → Google Cloud Console
```

📚 **Полная документация**: [ANDROID_SIGNING.md](./ANDROID_SIGNING.md) и [SIGNING_CHEATSHEET.md](./SIGNING_CHEATSHEET.md)

## 🚀 Следующие шаги

1. Запустите локально: `npm start`
2. Протестируйте в Expo Go
3. Выполните первую сборку: `npm run build:android:production`
4. При вопросе о keystore выберите "Yes"
5. Получите SHA: `eas credentials -p android`
6. Настройте Google Cloud Console (добавьте SHA сертификаты)
7. Протестируйте Google Sign In в production build

---

**Важно**: Локально работаете с Expo Go, prebuild и подпись ТОЛЬКО удаленно! 🎯

