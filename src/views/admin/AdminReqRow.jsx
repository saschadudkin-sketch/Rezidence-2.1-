import { useState } from 'react';
import { useActions } from '../../store/AppStore';
import { STS_LABEL, S_END } from '../../constants';
import { ReqCard } from '../../requests/ReqCard';
import { toastBySyncResult } from '../../ui/syncFeedback';
import { toast } from '../../ui/Toasts';
import { services } from '../../services/providers/serviceContainer';

export default function AdminReqRow({ r }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(r.comment || '');
  const [status,  setStatus]  = useState(r.status);
  const { deleteRequest, updateRequest } = useActions();

  async function del() {
    try {
      const mode = await services.requests.deleteEverywhere({ requestId: r.id, deleteLocal: deleteRequest });
      toastBySyncResult(mode, 'Заявка удалена', 'Удаление выполнено локально. Синхронизация будет повторена позже');
    } catch(e) { toast('Ошибка удаления', 'error'); }
  }

  async function save() {
    const mode = await services.requests.updateEverywhere({ requestId: r.id, patch: { comment, status }, updateLocal: updateRequest });
    setEditing(false);
    toastBySyncResult(mode, 'Заявка обновлена', 'Изменения сохранены локально. Синхронизация будет повторена позже');
  }

  function handleCancel() { setEditing(false); }

  return (
    <div className="u-mb8">
      <ReqCard req={{ ...r, status }} userRole="admin" />
      <div style={{ display: 'flex', gap: 6, marginTop: -4, paddingBottom: 8, borderBottom: '1px solid var(--b1)', justifyContent: 'flex-end' }}>
        <button className="btn-edit" onClick={() => setEditing(e => !e)}>
          {editing ? '✕' : '✏️ Ред.'}
        </button>
        {/* Кнопка удаления всегда видна в AdminView — admin может удалять любые заявки */}
        <button className="btn-del-sm" onClick={del}>🗑 Удалить</button>
      </div>
      {editing && (
        <div className="edit-inline u-mt4">
          <div className="edit-inline-row">
            <select className="edit-inline-sel" value={status} onChange={e => setStatus(e.target.value)}>
              {Object.entries(STS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="edit-inline-row">
            <input className="edit-inline-inp" placeholder="Комментарий" value={comment}
              onChange={e => setComment(e.target.value)} />
          </div>
          <div style={S_END}>
            <button className="btn-outline" onClick={handleCancel}>Отмена</button>
            <button className="btn-gold u-pad-btn" onClick={save}><span>Сохранить</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
