import { useAppContext } from '../../../context/AppContext';
import { Button } from '../../common';
import './ItemDetail.css';

export default function ItemDetail({ items }) {
  const { selectedId, clearSelection } = useAppContext();

  const item = items?.find((i) => i.id === selectedId);

  if (!selectedId) {
    return (
      <div className="item-detail item-detail--empty">
        <p>항목을 선택하세요</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-detail item-detail--empty">
        <p>항목을 찾을 수 없습니다</p>
        <Button variant="secondary" onClick={clearSelection}>
          닫기
        </Button>
      </div>
    );
  }

  return (
    <div className="item-detail">
      <h3 className="item-detail__title">{item.title}</h3>
      <p className="item-detail__desc">{item.description}</p>
      <p className="item-detail__id">ID: {item.id}</p>
      <Button variant="secondary" onClick={clearSelection}>
        닫기
      </Button>
    </div>
  );
}
