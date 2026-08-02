(function () {
  "use strict";

  const editor = document.getElementById("editor");
  const content = document.getElementById("content");
  const toolbar = document.getElementById("toolbar");
  const stats = document.getElementById("stats");
  const htmlView = document.getElementById("htmlView");
  const out = document.getElementById("out");
  const docTitle = document.getElementById("docTitle");
  const docList = document.getElementById("docList");

  let currentDocId = 0;
  let statusTimer = null;

  const toggleButtons = ["bold", "italic", "underline", "strikeThrough",
    "superscript", "subscript", "insertUnorderedList", "insertOrderedList",
    "justifyLeft", "justifyCenter", "justifyRight", "justifyFull"];

  const formatSelects = new Map();
  toolbar.querySelectorAll("select[data-cmd]").forEach((sel) => {
    formatSelects.set(sel.dataset.cmd, sel);
  });

  function exec(cmd, value) {
    content.focus();
    document.execCommand(cmd, false, value);
    updateToolbar();
    updateStats();
  }

  function activeElement() {
    return content.contains(document.activeElement) ? document.activeElement : content;
  }

  function updateToolbar() {
    toolbar.querySelectorAll("button[data-cmd]").forEach((btn) => {
      const cmd = btn.dataset.cmd;
      if (toggleButtons.includes(cmd)) {
        btn.classList.toggle("active", document.queryCommandState(cmd));
      } else if (cmd === "formatBlock") {
        btn.classList.toggle("active", btn.dataset.value === currentBlock());
      }
    });

    formatSelects.forEach((sel, cmd) => {
      let val = document.queryCommandValue(cmd);
      if (!val || val === "false") return;
      val = String(val).toLowerCase();
      const opts = Array.from(sel.options).map((o) => o.value.toLowerCase());
      sel.value = opts.includes(val) ? val : (cmd === "fontName" ? "" : "");
    });

    if (!document.queryCommandState("bold")) activeElement().classList.remove("bold-active");
  }

  function currentBlock() {
    const el = activeElement();
    if (el === content) return "P";
    let node = el;
    while (node && node !== content) {
      if (/^[H1-6P]$/.test(node.nodeName) || node.nodeName === "PRE" || node.nodeName === "BLOCKQUOTE" || node.nodeName === "DIV") {
        return node.nodeName === "DIV" ? "P" : node.nodeName;
      }
      node = node.parentNode;
    }
    return "P";
  }

  function updateStats() {
    const text = content.innerText.trim();
    const words = text.length ? text.split(/\s+/).length : 0;
    stats.textContent = "Words: " + words + "  |  Characters: " + text.length;
  }

  function syncView() {
    if (htmlView.checked) {
      content.textContent = content.innerHTML;
      content.setAttribute("contenteditable", "false");
    } else {
      content.innerHTML = content.textContent;
      content.removeAttribute("contenteditable");
      content.setAttribute("contenteditable", "true");
    }
    updateStats();
  }

  function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      showUploadState(true);

      fetch("upload.php", { method: "POST", body: formData })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) throw new Error(data.error || "Upload failed.");
          content.focus();
          document.execCommand("insertImage", false, data.url);
          updateToolbar();
          updateStats();
        })
        .catch((err) => alert("Image upload failed: " + err.message))
        .finally(() => showUploadState(false));
    };
    input.click();
  }

  function showUploadState(uploading) {
    document.getElementById("imgBtn").textContent = uploading ? "…" : "🖼";
    document.getElementById("imgBtn").title = uploading ? "Uploading..." : "Insert image";
  }

  function setStatus(message) {
    out.textContent = message;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { out.textContent = ""; }, 4000);
  }

  function getContentHtml() {
    if (htmlView.checked) {
      htmlView.checked = false;
      syncView();
    }
    return content.innerHTML;
  }

  function saveDoc() {
    const title = docTitle.value.trim() || "Untitled";
    const payload = { id: currentDocId, title: title, content: getContentHtml() };

    fetch("save.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || "Save failed.");
        currentDocId = data.id;
        setStatus("Saved \"" + title + "\" (id " + currentDocId + ").");
        loadList();
      })
      .catch((err) => setStatus("Save failed: " + err.message));
  }

  function loadDoc(id) {
    fetch("load.php?id=" + encodeURIComponent(id))
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || "Load failed.");
        const doc = data.document;
        currentDocId = (parseInt(doc.id, 10) || 0);
        docTitle.value = doc.title;
        htmlView.checked = false;
        content.removeAttribute("contenteditable");
        content.innerHTML = doc.content;
        content.setAttribute("contenteditable", "true");
        docList.value = String(currentDocId);
        updateStats();
        updateToolbar();
        setStatus("Loaded \"" + doc.title + "\".");
      })
      .catch((err) => setStatus("Load failed: " + err.message));
  }

  function newDoc() {
    if (currentDocId && content.innerHTML && !confirm("Start a new document? Unsaved changes will be lost.")) {
      return;
    }
    currentDocId = 0;
    docTitle.value = "Untitled";
    docList.value = "";
    htmlView.checked = false;
    content.innerHTML = "";
    updateStats();
    updateToolbar();
    setStatus("");
  }

  function loadList() {
    fetch("list.php")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || "List failed.");
        const selected = docList.value;
        docList.innerHTML = '<option value="">(saved documents)</option>';
        data.documents.forEach((doc) => {
          const opt = document.createElement("option");
          opt.value = doc.id;
          opt.textContent = doc.title + "  —  " + (doc.updated_at || "").replace("T", " ").slice(0, 16);
          docList.appendChild(opt);
        });
        docList.value = selected;
      })
      .catch(() => {});
  }

  toolbar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cmd]");
    if (!btn) return;
    const cmd = btn.dataset.cmd;

    if (cmd === "createLink") {
      const url = prompt("Enter URL:");
      if (url && url.trim()) exec(cmd, url.trim());
      return;
    }
    if (cmd === "insertImage") {
      openFilePicker();
      return;
    }
    if (cmd === "removeFormat") {
      exec("removeFormat");
      exec("unlink");
      return;
    }
    exec(cmd, btn.dataset.value);
  });

  toolbar.addEventListener("input", (e) => {
    if (e.target.matches("select[data-cmd]")) {
      exec(e.target.dataset.cmd, e.target.value);
    } else if (e.target.matches('input[type="color"]')) {
      exec(e.target.dataset.cmd, e.target.value);
    }
  });

  toolbar.addEventListener("change", (e) => {
    if (e.target.matches("select[data-cmd]")) {
      exec(e.target.dataset.cmd, e.target.value);
    }
  });

  content.addEventListener("input", () => {
    updateToolbar();
    updateStats();
  });

  content.addEventListener("keyup", updateToolbar);
  content.addEventListener("mouseup", updateToolbar);

  content.addEventListener("keydown", (e) => {
    if ((e.key === "Tab") && !e.shiftKey) {
      e.preventDefault();
      exec("insertHTML", "&#9;");
    }
  });

  document.addEventListener("selectionchange", () => {
    if (content.contains(document.activeElement) || toolbar.contains(document.activeElement)) {
      updateToolbar();
    }
  });

  htmlView.addEventListener("change", syncView);

  document.getElementById("clearBtn").addEventListener("click", () => {
    if (confirm("Clear all content?")) {
      content.innerHTML = "";
      updateStats();
    }
  });

  document.getElementById("saveBtn").addEventListener("click", saveDoc);
  document.getElementById("loadBtn").addEventListener("click", () => {
    const id = parseInt(docList.value, 10);
    if (id) loadDoc(id);
  });
  document.getElementById("newBtn").addEventListener("click", newDoc);
  docList.addEventListener("change", () => {
    const id = parseInt(docList.value, 10);
    if (id) loadDoc(id);
  });

  loadList();
  updateToolbar();
  updateStats();
})();
