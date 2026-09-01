const items = [
  { id: 1, title: 'Hello', description: 'Welcome to the API' },
  { id: 2, title: 'World', description: 'Express MVC structure' },
];

const ExampleModel = {
  findAll() {
    return items;
  },

  findById(id) {
    return items.find((item) => item.id === Number(id));
  },

  create(data) {
    const newItem = {
      id: items.length + 1,
      title: data.title,
      description: data.description || '',
    };
    items.push(newItem);
    return newItem;
  },
};

module.exports = ExampleModel;
