const statusEl = document.getElementById("health-status");
const healthDot = document.getElementById("health-dot");
const itemsEl = document.getElementById("items");
const requestEl = document.getElementById("request");
const responseEl = document.getElementById("response");
const responseMeta = document.getElementById("response-meta");
const logEl = document.getElementById("log");
const titleInput = document.getElementById("title");
const idInput = document.getElementById("item-id");

let selectedId = 2;

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

async function callApi(method, path, body) {
  const started = performance.now();
  const request = {
    method,
    url: path,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body || undefined,
  };

  requestEl.textContent = pretty(request);

  let responsePayload;
  let status = 0;
  let ok = false;

  try {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    status = res.status;
    ok = res.ok;
    responsePayload = await res.json();
  } catch (error) {
    responsePayload = { error: error.message };
  }

  const ms = Math.round(performance.now() - started);
  responseEl.textContent = pretty(responsePayload);
  responseMeta.textContent = status
    ? `${status} · ${ms}ms`
    : `NETWORK ERROR · ${ms}ms`;
  responseMeta.className = ok ? "status-ok" : "status-err";

  const entry = document.createElement("div");
  entry.className = "entry";
  entry.innerHTML = `
    <span class="method" style="color: var(--${method.toLowerCase()})">${method}</span>
    <span>${path}</span>
    <span class="${ok ? "status-ok" : "status-err"}">${status || "ERR"}</span>
  `;
  logEl.prepend(entry);

  return { ok, data: responsePayload };
}

function renderItems(items) {
  if (!items.length) {
    itemsEl.innerHTML = `<p class="empty">아이템이 없습니다. POST로 추가하세요.</p>`;
    return;
  }

  itemsEl.innerHTML = items
    .map(
      (item) => `
        <article class="item ${item.done ? "done" : ""} ${item.id === selectedId ? "selected" : ""}" data-id="${item.id}">
          <div>
            <div class="title">${item.title}</div>
            <div class="meta">id: ${item.id} · done: ${item.done}</div>
          </div>
          <div class="meta">GET /api/items/${item.id}</div>
        </article>
      `
    )
    .join("");
}

async function refreshItems() {
  const result = await callApi("GET", "/api/items");
  if (result.ok) {
    renderItems(result.data.items);
  }
}

function currentId() {
  const id = Number(idInput.value);
  return Number.isInteger(id) && id > 0 ? id : selectedId;
}

document.getElementById("btn-health").addEventListener("click", async () => {
  const result = await callApi("GET", "/api/health");
  healthDot.className = `dot ${result.ok ? "ok" : "err"}`;
  statusEl.textContent = result.ok ? "서버 연결됨" : "서버 오류";
});

document.getElementById("btn-list").addEventListener("click", refreshItems);

document.getElementById("btn-get").addEventListener("click", async () => {
  await callApi("GET", `/api/items/${currentId()}`);
});

document.getElementById("btn-post").addEventListener("click", async () => {
  const title = titleInput.value.trim() || "새 아이템";
  const result = await callApi("POST", "/api/items", { title, done: false });
  if (result.ok) {
    selectedId = result.data.id;
    idInput.value = selectedId;
    titleInput.value = "";
    await refreshItems();
  }
});

document.getElementById("btn-put").addEventListener("click", async () => {
  const title = titleInput.value.trim() || "전체 교체된 아이템";
  const result = await callApi("PUT", `/api/items/${currentId()}`, {
    title,
    done: false,
  });
  if (result.ok) await refreshItems();
});

document.getElementById("btn-patch").addEventListener("click", async () => {
  const result = await callApi("PATCH", `/api/items/${currentId()}`, {
    done: true,
  });
  if (result.ok) await refreshItems();
});

document.getElementById("btn-delete").addEventListener("click", async () => {
  const result = await callApi("DELETE", `/api/items/${currentId()}`);
  if (result.ok) {
    selectedId = 1;
    idInput.value = 1;
    await refreshItems();
  }
});

itemsEl.addEventListener("click", async (event) => {
  const card = event.target.closest(".item");
  if (!card) return;
  selectedId = Number(card.dataset.id);
  idInput.value = selectedId;
  await callApi("GET", `/api/items/${selectedId}`);
  const list = await fetch("/api/items").then((res) => res.json());
  renderItems(list.items);
});

async function boot() {
  const health = await callApi("GET", "/api/health");
  healthDot.className = `dot ${health.ok ? "ok" : "err"}`;
  statusEl.textContent = health.ok ? "서버 연결됨" : "서버에 연결할 수 없음";
  await refreshItems();
}

boot();
