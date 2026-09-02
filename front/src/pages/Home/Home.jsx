import { useApi } from '../../hooks/useApi';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../services/api';
import { ItemList, ItemDetail, ItemForm } from '../../components/features';
import './Home.css';

export default function Home() {
  const { refreshKey } = useAppContext();
  const { data, loading, error } = useApi(
    () => api.getExamples().then((res) => res.data),
    [refreshKey],
  );

  return (
    <div className="home">
      <section className="home__section">
        <h2 className="home__heading">항목 목록</h2>
        <ItemList items={data} loading={loading} error={error} />
      </section>

      <aside className="home__aside">
        <ItemDetail items={data} />
        <ItemForm />
      </aside>
    </div>
  );
}
