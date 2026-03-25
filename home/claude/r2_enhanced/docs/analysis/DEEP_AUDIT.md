# Deep Audit — Rezidence-2

Дата аудита: 2026-03-24

## Executive summary

Проект в рабочем состоянии и успешно собирается, но имеет ряд архитектурных и продуктовых рисков перед production.
Главные зоны: auth/security, консистентность demo/live режимов, масштабируемость state-слоя, и тестовое покрытие критических переходов заявок.

## Findings

## 1) [High] Аутентификация остаётся demo-only
- Вход строится на имитации OTP (ввод любого кода), без реальной проверки токена/сессии.
- Риск: обход аутентификации в production-сценарии.

Референсы:
- `src/views/Login.jsx`
- `src/hooks/useAuth.js`

## 2) [High] Критичные операции выполняются на клиенте без серверной валидации
- Переходы статусов заявок (`approve/reject/arrive`) и часть доменной логики полностью клиентские.
- Риск: манипуляции состоянием при компрометации клиента.

Референсы:
- `src/store/AppStore.jsx`
- `src/domain/requestWorkflow.js`

## 3) [High] Поведение live-чата может дублировать сообщения
- В `ChatView.send` при `FB_MODE === 'live'` одновременно вызывается `fbSendMessage(...)` и локальный `sendMessage(...)`.
- При активной `subscribeChat` это потенциально создаёт дубли/echo-эффекты.

Референсы:
- `src/chat/ChatView.jsx`
- `src/views/Dashboard.jsx`

## 4) [Medium] Media persistence через localStorage масштабируется плохо
- Фото и данные чата/заявок сериализуются в localStorage.
- Есть обработка quota exceeded, но это симптом ограничения, а не решение.

Референсы:
- `src/store/AppStore.jsx`
- `src/hooks/useCreateRequest.js`

## 5) [Medium] Большой orchestration в AppStore
- `AppStore` сочетает reducer orchestration, persistence, restore, action-factory и часть доменной логики.
- Риск: рост когнитивной сложности при расширении фич.

Референсы:
- `src/store/AppStore.jsx`

## 6) [Medium] Дублирование/расхождение action-type строк
- В `requestWorkflow` используются строковые action types отдельно от `A`.
- Риск: typo/рассинхрон при будущих переименованиях.

Референсы:
- `src/domain/requestWorkflow.js`
- `src/store/AppStore.jsx`

## 7) [Medium] Недостаточно тестов на критический домен
- Нет явного набора unit/integration тестов для правил ролей, статусов и истечения временных пропусков.

Референсы:
- `src/domain/permissions.js`
- `src/store/slices/requestsSlice.js`

## 8) [Low] ErrorBoundary логирует, но нет прод-интеграции в централизованный error tracking
- Сейчас ошибки уходят в `console.error`.
- Для production нужен Sentry/Datadog/OTel pipeline.

Референсы:
- `src/ui/ErrorBoundary.jsx`
- `src/services/logger.js`

## Что делать в первую очередь (план)

1. Внедрить реальную auth-схему и server-side RBAC/rules.
2. Убрать двойной путь отправки chat-message в live-режиме (single source of truth: backend snapshot).
3. Унести media из localStorage в storage + метаданные в БД.
4. Довести action-type контракты до единого источника (shared constants/types).
5. Добавить тесты критических сценариев (permissions + request transitions + expiry).
6. Разделить AppStore на отдельные bounded contexts (requests/chat/users).

## Quick wins (1–2 дня)

- Удалить локальный optimistic `sendMessage` при live-чате и полагаться на `subscribeChat`.
- Ввести smoke-тесты для `requestsSlice` переходов.
- Добавить strict schema checks для create/edit request payload.

