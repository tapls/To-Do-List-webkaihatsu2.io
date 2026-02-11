'use strict';

const STORAGE_KEY = 'study_todo_progress_v1';

const $ = (sel) => document.querySelector(sel);

const todoForm = $('#todoForm');
const todoInput = $('#todoInput');
const todoList = $('#todoList');

const progressFill = $('#progressFill');
const progressText = $('#progressText');
const filterBadge = $('#filterBadge');

const clearDoneBtn = $('#clearDone');
const clearAllBtn = $('#clearAll');

const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));

let filter = 'all';
let todos = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function uid() {
  return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

function setFilter(next) {
  filter = next;
  filterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  filterBadge.textContent = filter === 'all' ? '全て' : (filter === 'active' ? '未完了' : '完了');
  render();
}

function getVisibleTodos() {
  if (filter === 'active') return todos.filter(t => !t.done);
  if (filter === 'done') return todos.filter(t => t.done);
  return todos;
}

function updateProgress() {
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${done}/${total}（${percent}%）`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function render() {
  updateProgress();
  const visible = getVisibleTodos();

  if (visible.length === 0) {
    todoList.innerHTML = `<li class="item"><div class="small">ToDoがありません（追加してみてください）</div></li>`;
    return;
  }

  todoList.innerHTML = visible.map(t => {
    const created = new Date(t.createdAt).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
    return `
      <li class="item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="left">
          <input class="check" type="checkbox" ${t.done ? 'checked' : ''} aria-label="done" />
          <div class="text" title="${escapeHtml(t.text)}">${escapeHtml(t.text)}</div>
        </div>
        <div class="right">
          <div class="small">${created}</div>
          <button class="iconbtn" data-action="delete" type="button">削除</button>
        </div>
      </li>
    `;
  }).join('');
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  todos.unshift({
    id: uid(),
    text,
    done: false,
    createdAt: Date.now()
  });

  todoInput.value = '';
  save();
  render();
});

todoList.addEventListener('click', (e) => {
  const li = e.target.closest('.item');
  if (!li) return;
  const id = li.dataset.id;
  const idx = todos.findIndex(t => t.id === id);
  if (idx < 0) return;

  const action = e.target.dataset.action;
  if (action === 'delete') {
    todos.splice(idx, 1);
    save();
    render();
    return;
  }

  // checkbox toggle
  if (e.target.classList.contains('check')) {
    todos[idx].done = e.target.checked;
    save();
    render();
  }
});

clearDoneBtn.addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  save();
  render();
});

clearAllBtn.addEventListener('click', () => {
  todos = [];
  save();
  render();
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// 初期表示
render();
setFilter('all');
