# Legacy Cleanup Checklist (Demo/Live Split)

Обновлено: 2026-03-24

## Уже сделано ✅

- [x] Введён единый runtime-mode модуль (`runtimeMode`).
- [x] Убран прямой `FB_MODE` из UI-слоя.
- [x] Вынесены mode-aware side effects в gateways:
  - `chatGateway`
  - `requestsGateway`
  - `adminGateway`
  - `liveDataGateway`
- [x] Вынесены request transitions в `requestWorkflow`.
- [x] Добавлены unit-тесты для gateways и workflow.

## Осталось сделать ⏳

### 1) Provider-level split
- [ ] Ввести интерфейсные контракты `ChatProvider`, `RequestsProvider`, `AdminProvider`.
- [ ] Сделать `DemoProvider` и `FirebaseProvider` как взаимозаменяемые реализации.
- [ ] Подключать провайдер через фабрику на старте приложения.

### 2) Contract tests
- [ ] Добавить contract-тесты, которые прогоняют одинаковые кейсы на DemoProvider и FirebaseProvider.
- [ ] Проверить одинаковые semantics для ошибок, retry, и возвращаемых форматов.

### 3) Data integrity
- [ ] Убрать хранение больших media dataURL в localStorage для production-пути.
- [ ] Ввести схему валидации payload (zod/yup) перед gateway-вызовами.

### 4) Auth/Security hardening
- [ ] Реальная auth вместо demo OTP.
- [ ] Server-side RBAC/rules и аудит действий.
- [ ] Проверки прав на write-операции на backend.

### 5) Observability
- [ ] Централизованный error reporting (Sentry/Datadog/OTel).
- [ ] Корреляционные id для операций gateways.

## Definition of Done (для split)

- UI-компоненты не содержат mode-ветвлений.
- Переключение demo/live делается одной конфигурацией без изменений UI.
- Все gateways покрыты unit + contract-тестами.
- Нет критичных функций, зависящих только от клиентской валидации.
