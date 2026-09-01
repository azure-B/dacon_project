import { useAppContext } from '../../../context/AppContext';
import './ItemList.css';

export default function ItemList({ items, loading, error }) {
  const { selectedId, selectItem } = useAppContext();

  if (loading) return <p className="item-list__status">Loading...</p>;
  if (error) return <p className="item-list__status item-list__status--error">{error}</p>;

  return (
    <ul className="item-list">
      {items?.map((item) => (
        <li
          key={item.id}
          className={`item-list__item ${selectedId === item.id ? 'item-list__item--active' : ''}`}
        >
          <button
            type="button"
            className="item-list__button"
            onClick={() => selectItem(item.id)}
          >
            <span className="item-list__title">{item.title}</span>
            <span className="item-list__desc">{item.description}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
