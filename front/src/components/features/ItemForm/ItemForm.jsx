import { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { Button } from '../../common';
import './ItemForm.css';

export default function ItemForm() {
  const { triggerRefresh } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await api.createExample({ title, description });
      setTitle('');
      setDescription('');
      triggerRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <h3 className="item-form__heading">새 항목 추가</h3>
      <input
        className="item-form__input"
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="item-form__input"
        type="text"
        placeholder="설명"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit" variant="legacy" disabled={submitting || !title.trim()}>
        {submitting ? '추가 중...' : '추가'}
      </Button>
    </form>
  );
}
