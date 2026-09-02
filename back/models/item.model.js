let nextId = 3;
const items = [
  {
    id: 1,
    title: "REST 문서 읽기",
    done: true,
    createdAt: "2026-08-31T04:00:00.000Z",
  },
  {
    id: 2,
    title: "프론트와 API 연동",
    done: false,
    createdAt: "2026-08-31T04:05:00.000Z",
  },
];

function findAll() {
  return items;
}

function findById(id) {
  return items.find((item) => item.id === id) || null;
}

function create(data) {
  const item = {
    id: nextId++,
    title: String(data.title || "").trim(),
    done: Boolean(data.done),
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  return item;
}

function update(id, data) {
  const item = findById(id);
  if (!item) return null;

  if (data.title !== undefined) {
    item.title = String(data.title).trim();
  }
  if (data.done !== undefined) {
    item.done = Boolean(data.done);
  }
  return item;
}

function replace(id, data) {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const item = {
    id,
    title: String(data.title || "").trim(),
    done: Boolean(data.done),
    createdAt: items[index].createdAt,
  };
  items[index] = item;
  return item;
}

function remove(id) {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const [deleted] = items.splice(index, 1);
  return deleted;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  replace,
  remove,
};
