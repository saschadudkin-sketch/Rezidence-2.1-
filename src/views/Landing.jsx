import { LOGO } from '../constants/logo';
import { CONTACT_EMAIL } from '../constants';

const CARDS = [
  {
    icon: '🏛️',
    title: 'Один комплекс — единый контур',
    text: 'Сервис настроен под Резиденции Замоскворечья и процессы вашей управляющей команды.',
  },
  {
    icon: '📷',
    title: 'QR-проверка на посту',
    text: 'Сканирование, валидация пропуска и журнал событий в реальном времени.',
  },
  {
    icon: '📈',
    title: 'Контроль проходов',
    text: 'Журнал визитов, статусы заявок и прозрачная история решений охраны.',
  },
];

const CASES = [
  'Заказ разовых и временных пропусков жителями',
  'Проверка QR на посту и мгновенное решение охраны',
  'Отдельный журнал проходов для аудита и отчётности',
];

export default function Landing({ onBack }) {
  return (
    <div className="landing">
      <header className="landing-head">
        <div className="landing-brand">
          <img src={LOGO} alt="" />
          <div>
            <div className="landing-name">Rezidence Access</div>
            <div className="landing-sub">Сервис заказа пропусков для одного жилого комплекса</div>
          </div>
        </div>
        <button className="btn-outline" style={{ width: 'auto', padding: '0 18px' }} onClick={onBack}>Войти</button>
      </header>

      <section className="landing-hero">
        <h1>Заказ пропусков для Резиденций Замоскворечья</h1>
        <p>
          Приложение сфокусировано на одном объекте: быстрый заказ пропусков, проверка QR-кода и
          фиксирование проходов в журнале.
        </p>
        <button className="btn-gold" style={{ width: 'auto', padding: '0 22px' }} onClick={onBack}>
          <span>Запросить демо / Войти</span>
        </button>
      </section>

      <section className="landing-cards">
        {CARDS.map((card) => (
          <article key={card.title} className="landing-card">
            <div className="landing-card-ico">{card.icon}</div>
            <div className="landing-card-title">{card.title}</div>
            <div className="landing-card-text">{card.text}</div>
          </article>
        ))}
      </section>

      <section className="landing-proof">
        <h2>Что уже работает в комплексе</h2>
        <ul>
          {CASES.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <a className="btn-outline landing-contact" href={`mailto:${CONTACT_EMAIL}?subject=Демо%20Rezidence%20Access`}>
          Связаться по внедрению
        </a>
      </section>
    </div>
  );
}
