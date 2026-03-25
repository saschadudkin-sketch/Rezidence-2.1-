import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRequests, useActions, useBlacklist } from '../store/AppStore.jsx';
import { parsePassQR } from '../services/qrService';
import { validatePass, logVisit } from '../shared/api/passesApi';
import { CAT_LABEL, STS_LABEL } from '../constants/index.js';
import { getValidationReasonLabel, getStatusToneClass } from '../constants/statusPresentation';
import { normalizeValidationResult } from '../domain/validationResult';
import { canApproveScannedRequest } from '../domain/scanDecision';
import { lockScroll, unlockScroll } from '../ui/scrollLock.js';
import { toast } from '../ui/Toasts.jsx';

/**
 * ScanQRModal — сканер QR-кода для охраны.
 * Использует камеру устройства и BarcodeDetector API (Chrome/Edge/Safari).
 * Для браузеров без BarcodeDetector показывает ручной ввод ID.
 */
export function ScanQRModal({ user, onClose }) {
  const requests = useRequests();
  const blacklist = useBlacklist();
  const { approveRequest, rejectRequest, arriveRequest, approveAndArrive } = useActions();
  const [scannedReq, setScannedReq] = useState(null);
  const [validation, setValidation] = useState(null);
  const [checking, setChecking] = useState(false);
  const [scanning, setScanning]     = useState(true);
  const [manualId, setManualId]     = useState('');
  const [camError, setCamError]     = useState(false);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const scanRef   = useRef(null);
  const foundRef  = useRef(false);

  const stopCamera = useCallback(() => {
    if (scanRef.current) { clearInterval(scanRef.current); scanRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const buildRequestSnapshot = useCallback((req) => ({
    id: req.id,
    type: req.type,
    category: req.category,
    status: req.status,
    visitorName: req.visitorName || null,
    carPlate: req.carPlate || null,
    createdByUid: req.createdByUid || null,
    createdByName: req.createdByName || null,
    createdByApt: req.createdByApt || null,
    createdAt: req.createdAt instanceof Date ? req.createdAt.toISOString() : req.createdAt || null,
    passDuration: req.passDuration || null,
    validUntil: req.validUntil instanceof Date ? req.validUntil.toISOString() : req.validUntil || null,
  }), []);

  const validateAndSetRequest = useCallback(async (found) => {
    // Отменённый пропуск — отклоняем сразу
    if (found.status === 'cancelled') {
      setValidation(normalizeValidationResult({ status: 'denied', reason: 'cancelled' }));
      setScannedReq(found);
      return;
    }
    const passPayload = {
      id: found.id,
      userId: found.createdByUid || found.id,
      validUntil: found.validUntil || null,
    };
    let result;
    try {
      result = await validatePass(passPayload, { blacklist });
    } catch(e) {
      result = { status: 'denied', reason: 'error' };
    }
    const normalized = normalizeValidationResult(result);
    setValidation(normalized);
    if (normalized.status === 'denied') {
      await logVisit({
        userId: passPayload.userId,
        requestId: found.id,
        timestamp: new Date().toISOString(),
        result: 'denied',
        reason: normalized.reason,
        actorName: user.name,
        actorRole: user.role,
        visitorName: found.visitorName || null,
        category: found.category,
        createdByApt: found.createdByApt,
        createdByName: found.createdByName,
        createdByUid: found.createdByUid || null,
        requestSnapshot: buildRequestSnapshot(found),
      });
    }
  }, [blacklist, buildRequestSnapshot, user.name, user.role]);

  const handleScan = useCallback(async (raw) => {
    if (foundRef.current) return; // guard: не обрабатывать повторно
    const data = parsePassQR(raw);
    if (!data) { toast('Неизвестный QR-код', 'error'); return; }
    const found = requests.find(r => r.id === data.id);
    if (!found) { toast('Пропуск не найден в системе', 'error'); return; }
    foundRef.current = true;
    stopCamera();
    setScanning(false);
    setScannedReq(found);
    setChecking(true);
    await validateAndSetRequest(found);
    setChecking(false);
    if (navigator.vibrate) navigator.vibrate(100);
  }, [requests, stopCamera, validateAndSetRequest]);

  useEffect(() => {
    lockScroll();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      unlockScroll();
      stopCamera();
      document.removeEventListener('keydown', onKey);
    };
  }, [stopCamera, onClose]);

  // Запускаем камеру
  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // BarcodeDetector — работает в Chrome, Edge, Safari 17+
        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          scanRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                void handleScan(barcodes[0].rawValue);
              }
            } catch { /* ignore */ }
          }, 300);
        } else {
          // Firefox и другие без BarcodeDetector — камера работает, но автосканирование нет
          if (!cancelled) toast('Автосканирование недоступно — используйте поиск ниже', 'info');
        }
      } catch (e) {
        console.warn('[QR Scanner] camera error:', e);
        if (!cancelled) setCamError(true);
      }
    })();

    return () => { cancelled = true; stopCamera(); };
  }, [scanning, stopCamera, handleScan]);

  const handleManualSearch = async () => {
    const q = manualId.trim().toLowerCase();
    if (!q) return;
    const found = requests.find(r =>
      r.id === q
      || (r.visitorName && r.visitorName.toLowerCase().includes(q))
      || (r.carPlate && r.carPlate.toLowerCase().includes(q))
    );
    if (!found) { toast('Пропуск не найден', 'error'); return; }
    stopCamera();
    setScanning(false);
    setScannedReq(found);
    setChecking(true);
    await validateAndSetRequest(found);
    setChecking(false);
  };

  const handleApprove = async () => {
    if (scannedReq.status === 'pending') {
      const dur = scannedReq.passDuration || 'once';
      if (dur === 'once') {
        approveAndArrive(scannedReq.id, user.name, user.role);
        toast('Гость допущен', 'success');
      } else {
        approveRequest(scannedReq.id, user.name, user.role);
        toast('Допуск разрешён', 'success');
      }
    }
    if (scannedReq.status === 'approved') {
      arriveRequest(scannedReq.id, user.name, user.role);
      toast('Вход отмечен', 'success');
    }
    await logVisit({
      userId: scannedReq.createdByUid || scannedReq.id,
      requestId: scannedReq.id,
      timestamp: new Date().toISOString(),
      result: 'allowed',
      reason: 'ok',
      actorName: user.name,
      actorRole: user.role,
      visitorName: scannedReq.visitorName || null,
      category: scannedReq.category,
      createdByApt: scannedReq.createdByApt,
      createdByName: scannedReq.createdByName,
      createdByUid: scannedReq.createdByUid || null,
      requestSnapshot: buildRequestSnapshot(scannedReq),
    });
    onClose();
  };

  const handleReject = async () => {
    if (scannedReq && scannedReq.status === 'pending') {
      rejectRequest(scannedReq.id, user.name, user.role);
    }
    if (scannedReq) {
      await logVisit({
        userId: scannedReq.createdByUid || scannedReq.id,
        requestId: scannedReq.id,
        timestamp: new Date().toISOString(),
        result: 'denied',
        reason: 'manual_reject',
        actorName: user.name,
        actorRole: user.role,
        visitorName: scannedReq.visitorName || null,
        category: scannedReq.category,
        createdByApt: scannedReq.createdByApt,
        createdByName: scannedReq.createdByName,
        createdByUid: scannedReq.createdByUid || null,
        requestSnapshot: buildRequestSnapshot(scannedReq),
      });
    }
    toast('В допуске отказано', 'error');
    onClose();
  };

  const deniedByValidation = validation?.status === 'denied';
  const canApprove = scannedReq && canApproveScannedRequest({
    requestStatus: scannedReq.status,
    validationStatus: validation?.status,
  });
  const actionLabel = scannedReq?.status === 'approved' ? 'Отметить вход' : 'Пропустить';
  const validationReason = getValidationReasonLabel(validation?.reason);

  return createPortal(
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-head">
          <span className="modal-title">{scanning ? 'Сканировать QR' : 'Результат проверки'}</span>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="modal-body">
          {scanning && (
            <>
              <div className="qr-scanner-viewport">
                {camError ? (
                  <div className="qr-scanner-fallback">
                    <div style={{ fontSize: 36, marginBottom: 12, opacity: .3 }}>📷</div>
                    <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 4 }}>Камера недоступна</div>
                    <div style={{ fontSize: 11, color: 'var(--t4)' }}>Используйте поиск ниже</div>
                  </div>
                ) : (
                  <video ref={videoRef} className="qr-scanner-video" playsInline muted />
                )}
                <div className="qr-scanner-frame" />
              </div>
              <div className="field" style={{ marginTop: 16 }}>
                <label className="field-lbl">Или введите имя / номер авто / ID</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="field-inp" style={{ flex: 1, marginBottom: 0 }}
                    placeholder="Поиск..."
                    value={manualId} onChange={e => setManualId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualSearch()} />
                  <button className="btn-gold" style={{ width: 'auto', padding: '0 20px', flexShrink: 0 }}
                    onClick={handleManualSearch}>
                    <span>Найти</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {scannedReq && (
            <div className="qr-result">
              <div className={'qr-result-status ' + getStatusToneClass(scannedReq.status, validation?.status)}>
                {checking ? '⏳' : canApprove ? '✅' : deniedByValidation || scannedReq.status === 'rejected' ? '🚫' : '⚠️'}
                <span>
                  {checking
                    ? 'Проверяем пропуск...'
                    : deniedByValidation
                      ? 'Доступ запрещён'
                      : canApprove
                    ? (scannedReq.status === 'approved' ? 'Допуск открыт — ожидает входа' : 'Ожидает решения')
                    : STS_LABEL[scannedReq.status] || scannedReq.status}
                </span>
              </div>
              {validationReason && (
                <div style={{ fontSize: 12, color: 'var(--err-t)', marginBottom: 10, fontWeight: 600 }}>
                  {validationReason}
                </div>
              )}
              <div className="qr-result-details">
                <div className="qr-info-row">
                  <span className="qr-info-lbl">Тип</span>
                  <span className="qr-info-val">{CAT_LABEL[scannedReq.category]}</span>
                </div>
                {scannedReq.visitorName && (
                  <div className="qr-info-row">
                    <span className="qr-info-lbl">Посетитель</span>
                    <span className="qr-info-val" style={{ fontWeight: 600, fontSize: 15 }}>{scannedReq.visitorName}</span>
                  </div>
                )}
                {scannedReq.carPlate && (
                  <div className="qr-info-row">
                    <span className="qr-info-lbl">Авто</span>
                    <span className="qr-info-val" style={{ fontWeight: 600 }}>{scannedReq.carPlate}</span>
                  </div>
                )}
                <div className="qr-info-row">
                  <span className="qr-info-lbl">К кому</span>
                  <span className="qr-info-val">Апарт. {scannedReq.createdByApt} · {scannedReq.createdByName}</span>
                </div>
                {scannedReq.comment && (
                  <div className="qr-info-row">
                    <span className="qr-info-lbl">Комментарий</span>
                    <span className="qr-info-val">{scannedReq.comment}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          {scanning ? (
            <button className="btn-outline u-flex1" onClick={onClose}>Отмена</button>
          ) : (
            <>
              {canApprove ? (
                <>
                  <button className="btn-no" onClick={handleReject} style={{ flex: 1 }}>Отказать</button>
                  <button className="btn-yes" onClick={handleApprove} style={{ flex: 2, fontSize: 14, padding: '14px 20px' }} disabled={checking}>{actionLabel}</button>
                </>
              ) : (
                <>
                  <button className="btn-outline u-flex1" onClick={() => { setScannedReq(null); setScanning(true); foundRef.current = false; }}>Сканировать ещё</button>
                  <button className="btn-gold u-flex1" onClick={onClose}><span>Закрыть</span></button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
