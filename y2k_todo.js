// DOM 요소 선택
const todoListEl = document.getElementById('y2k-todo-list');
const addBtn = document.getElementById('add-btn');
const inputContainer = document.getElementById('input-container');
const newTodoInput = document.getElementById('new-todo-input');
const themeBtn = document.getElementById('theme-btn');
const themeDropdown = document.getElementById('theme-dropdown');

// 로컬 스토리지 키 이름
const STORAGE_KEY_TODOS = 'y2k_todos_json';
const STORAGE_KEY_THEME = 'y2k_theme_json';

// 상태 배열 (JSON 구조로 저장될 데이터)
let todoArr = [];

// 1. 로컬 스토리지에 JSON 문자열로 저장
function saveTodos() {
  const jsonString = JSON.stringify(todoArr);
  localStorage.setItem(STORAGE_KEY_TODOS, jsonString);
}

// 2. 로컬 스토리지에서 JSON 데이터 불러오기
function loadTodos() {
  const savedTodos = localStorage.getItem(STORAGE_KEY_TODOS);
  if (savedTodos !== null) {
    todoArr = JSON.parse(savedTodos);
  }
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  if (savedTheme !== null) {
    applyTheme(savedTheme);
  }
  displayTodos();
}

// 3. 테마 변경 및 저장 함수
function applyTheme(themeName) {
  document.body.className = `theme-${themeName}`;
  localStorage.setItem(STORAGE_KEY_THEME, themeName);
}

// 4. 화면에 TO DO 리스트 렌더링
function displayTodos() {
  todoListEl.innerHTML = '';

  todoArr.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'todo-node';

    // 상단 제목 바
    const headerDiv = document.createElement('div');
    headerDiv.className = 'todo-header';

    const titleSpan = document.createElement('span');
    titleSpan.className = `todo-title ${item.todoDone ? 'completed' : ''}`;
    titleSpan.innerText = item.todoTitle;

    // 우측 아이템 설정 버튼 및 드롭다운 (완료 / 삭제)
    const menuWrapper = document.createElement('div');
    menuWrapper.className = 'item-menu-wrapper';

    const settingBtn = document.createElement('button');
    settingBtn.className = 'item-setting-btn';
    settingBtn.innerText = '●';
    settingBtn.title = '아이템 설정';

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu hidden';

    const completeBtn = document.createElement('button');
    completeBtn.innerText = item.todoDone ? '완료 해제' : '완료 (밑줄)';
    completeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleComplete(item.todoId);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = '삭제';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTodo(item.todoId);
    });

    dropdown.appendChild(completeBtn);
    dropdown.appendChild(deleteBtn);
    menuWrapper.appendChild(settingBtn);
    menuWrapper.appendChild(dropdown);

    // 아이템 우측 설정 버튼 클릭 시 드롭다운 토글
    settingBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      dropdown.classList.toggle('hidden');
    });

    headerDiv.appendChild(titleSpan);
    headerDiv.appendChild(menuWrapper);

    // 헤더(아이템) 클릭 시 아래로 4:3 비율 세부 계획 네모 박스 열기/닫기
    headerDiv.addEventListener('click', () => {
      toggleExpand(item.todoId);
    });

    li.appendChild(headerDiv);

    // 4:3 비율 세부 계획 네모 박스 (클릭되어 열려있는 경우 표시)
    if (item.isExpanded) {
      const detailBox = document.createElement('div');
      detailBox.className = 'todo-detail-box';

      const textarea = document.createElement('textarea');
      textarea.className = 'detail-textarea';
      textarea.placeholder = '세부 계획을 작성하세요 (최대 200자)...';
      textarea.maxLength = 200;
      textarea.value = item.todoDetail || '';

      const counter = document.createElement('div');
      counter.className = 'char-counter';
      counter.innerText = `${textarea.value.length}/200`;

      // 글자 입력 시 실시간 글자수(띄어쓰기 포함) 업데이트 및 로컬 스토리지 저장
      textarea.addEventListener('input', () => {
        if (textarea.value.length > 200) {
          textarea.value = textarea.value.substring(0, 200);
        }
        counter.innerText = `${textarea.value.length}/200`;
        updateDetailText(item.todoId, textarea.value);
      });

      detailBox.appendChild(textarea);
      detailBox.appendChild(counter);
      li.appendChild(detailBox);
    }

    todoListEl.appendChild(li);
  });
}

// 5. 아이템 클릭 시 4:3 세부 계획 박스 펼치기/접기
function toggleExpand(targetId) {
  todoArr = todoArr.map((item) =>
    item.todoId === targetId ? { ...item, isExpanded: !item.isExpanded } : item
  );
  saveTodos();
  displayTodos();
}

// 6. 세부 계획 텍스트 실시간 저장
function updateDetailText(targetId, newText) {
  todoArr = todoArr.map((item) =>
    item.todoId === targetId ? { ...item, todoDetail: newText } : item
  );
  saveTodos();
}

// 7. 완료 처리 (제목에 밑줄 긋기)
function toggleComplete(targetId) {
  todoArr = todoArr.map((item) =>
    item.todoId === targetId ? { ...item, todoDone: !item.todoDone } : item
  );
  saveTodos();
  displayTodos();
}

// 8. 삭제 처리 (아이템 및 하위 세부 계획 데이터 함께 삭제)
function deleteTodo(targetId) {
  todoArr = todoArr.filter((item) => item.todoId !== targetId);
  saveTodos();
  displayTodos();
}

// 9. 상단 '+' 버튼 클릭 시 목록 최하단에 입력 칸 표시
addBtn.addEventListener('click', () => {
  inputContainer.classList.remove('hidden');
  newTodoInput.value = '';
  newTodoInput.focus();
});

// 새 계획 입력 확정 또는 입력이 없을 시 원상태로 복원하는 함수
function finalizeNewTodo() {
  if (inputContainer.classList.contains('hidden')) return;

  const trimmedTitle = newTodoInput.value.trim();
  if (trimmedTitle !== '') {
    const newTodo = {
      todoId: new Date().getTime(),
      todoTitle: trimmedTitle,
      todoDetail: '', // 하위 데이터(세부 계획)
      todoDone: false,
      isExpanded: false
    };
    todoArr.push(newTodo);
    saveTodos();
    displayTodos();
  }

  // 입력이 없거나 추가가 완료되면 입력창을 숨겨 원상태로 복원
  newTodoInput.value = '';
  inputContainer.classList.add('hidden');
}

// Enter 키를 누르면 추가, Esc 키를 누르면 취소 후 원상태 복원
newTodoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    finalizeNewTodo();
  } else if (e.key === 'Escape') {
    newTodoInput.value = '';
    inputContainer.classList.add('hidden');
  }
});

// 포커스를 잃었을 때(외부 클릭 시) 입력이 없으면 원상태로 복원, 있으면 자동 등록
newTodoInput.addEventListener('blur', () => {
  finalizeNewTodo();
});

// 10. 상단 테마 설정 버튼 제어
themeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns();
  themeDropdown.classList.toggle('hidden');
});

themeDropdown.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const selectedTheme = btn.getAttribute('data-theme');
    applyTheme(selectedTheme);
    themeDropdown.classList.add('hidden');
  });
});

// 화면 빈 곳 클릭 시 열려있는 설정 메뉴 닫기
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach((menu) => {
    menu.classList.add('hidden');
  });
}

document.addEventListener('click', () => {
  closeAllDropdowns();
});

// 초기 실행
loadTodos();