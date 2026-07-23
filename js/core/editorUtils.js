export async function copyEditorCode(editorElement) {
  const code = String(editorElement?.value ?? editorElement?.textContent ?? "");
  if (!code.trim()) {
    showToast("복사할 코드가 없습니다.", "warn");
    return false;
  }

  try {
    await navigator.clipboard.writeText(code);
    showToast("코드가 복사되었습니다.", "success");
    return true;
  } catch {
    showToast("코드를 복사하지 못했습니다. 직접 선택하여 복사해 주세요.", "error");
    editorElement?.focus?.();
    editorElement?.select?.();
    return false;
  }
}

export function showToast(message, type = "info") {
  let host = document.getElementById("appToastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "appToastHost";
    host.className = "toast-host";
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  const toast = document.createElement("div");
  toast.className = `app-toast ${type}`;
  toast.textContent = message;
  host.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 180);
  }, 2600);
}

export function bindCodeEditorShortcuts(editor, { onRun, starterCode = "", draftKey = "", onDirtyChange } = {}) {
  if (!editor) return () => {};
  const update = () => {
    if (draftKey) localStorage.setItem(draftKey, editor.value);
    onDirtyChange?.(editor.value !== starterCode);
  };
  const keydown = (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = editor.selectionStart;
      editor.setRangeText("  ", start, editor.selectionEnd, "end");
      update();
    }
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onRun?.();
    }
  };
  editor.addEventListener("input", update);
  editor.addEventListener("keydown", keydown);
  onDirtyChange?.(editor.value !== starterCode);
  return () => {
    editor.removeEventListener("input", update);
    editor.removeEventListener("keydown", keydown);
  };
}

export function restoreDraft(editor, draftKey, starterCode = "") {
  if (!editor || !draftKey) return false;
  const draft = localStorage.getItem(draftKey);
  if (draft == null || draft === starterCode) return false;
  editor.value = draft;
  return true;
}

export function mountLabEditorUtilities(root, context = {}) {
  const editors = [...root.querySelectorAll("textarea.code-editor")];
  editors.forEach((editor, index) => {
    if (editor.dataset.utilitiesMounted) return;
    editor.dataset.utilitiesMounted = "true";
    const toolbar = document.createElement("div");
    toolbar.className = "editor-utility-bar";
    toolbar.innerHTML = `
      <button class="btn ghost compact-btn" data-copy-editor type="button">코드 복사</button>
      <span class="editor-dirty-status" data-editor-dirty>시작 코드와 동일</span>
      <span class="muted">Tab 들여쓰기 · Ctrl/Cmd+Enter 실행</span>
    `;
    editor.before(toolbar);
    toolbar.querySelector("[data-copy-editor]").onclick = () => copyEditorCode(editor);
    const initialCode = editor.value;
    const draftKey = `robotCoach:draft:${context.route || "lab"}:${context.lessonId || index}`;
    restoreDraft(editor, draftKey, initialCode);
    const runButton = [...root.querySelectorAll("button")].find((button) =>
      /가상 실행|실행하기|코드 실행/.test(button.textContent));
    bindCodeEditorShortcuts(editor, {
      starterCode: initialCode,
      draftKey,
      onRun: () => runButton?.click(),
      onDirtyChange: (dirty) => {
        const status = toolbar.querySelector("[data-editor-dirty]");
        status.textContent = dirty ? "시작 코드에서 수정됨" : "시작 코드와 동일";
        status.classList.toggle("dirty", dirty);
      }
    });
  });

  [...root.querySelectorAll("button")].filter((button) => /시작 코드로 되돌리기|초기 코드/.test(button.textContent))
    .forEach((button) => button.addEventListener("click", (event) => {
      if (!window.confirm("작성한 코드를 지우고 시작 코드로 되돌리시겠습니까?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true));
}
