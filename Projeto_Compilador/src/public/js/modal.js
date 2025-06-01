document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("resourceModal");
  const preview = document.getElementById("previewArea");
  const commentsList = document.getElementById("commentsList");
  const commentForm = document.getElementById("commentForm");
  const shareFB = document.getElementById("shareFacebook");
  const shareTW = document.getElementById("shareTwitter");
  const closeBtn = modal.querySelector(".modal-close");

  // 1) Attach click handler to all “Ver” buttons that have data-id
  document.querySelectorAll("a.button[data-id]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const id = btn.dataset.id;
      commentForm.dataset.resourceId = id;

      try {
        // 1a) Load resource metadata
        const resResource = await fetch(
          `http://localhost:3001/api/resources/${id}`,
          {
            credentials: "include",
          }
        );
        if (!resResource.ok) {
          throw new Error(`Erro ao buscar recurso (${resResource.status})`);
        }
        const resource = await resResource.json();

        // 1b) Render preview (may be async for text)
        await renderPreview(resource);

        // 1c) Load comments
        await loadComments(id);

        // 1d) Setup share links
        const url = `${window.location.origin}/resource/${id}`;
        shareFB.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        shareTW.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}`;

        // 1e) Show modal
        modal.classList.add("open");
      } catch (err) {
        console.error("Modal error:", err);
        alert("Não foi possível carregar o recurso.");
      }
    });
  });

  // 2) Close‐button hides the modal
  closeBtn.addEventListener("click", () => modal.classList.remove("open"));

  // 3) Helper: renderPreview based on file type (handles images, video, audio, pdf, text)
  async function renderPreview(r) {
    const ext = r.filename.split(".").pop().toLowerCase();
    const fileUrl = `/${r.path}`;

    // Image
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      preview.innerHTML = `<div class="preview-center"><img src="${fileUrl}" alt="${r.metadata.titulo}" style="max-width:100%; max-height:65vh; border-radius:8px;"></div>`;
      return;
    }
    // Video
    if (["mp4", "webm"].includes(ext)) {
      preview.innerHTML = `<div class="preview-center"><video controls src="${fileUrl}" style="max-width:100%; max-height:75vh; border-radius:8px; background:#222;"></video></div>`;
      return;
    }
    // Audio
    if (["mp3", "wav"].includes(ext)) {
      preview.innerHTML = `<div class="preview-center"><audio controls src="${fileUrl}" style="width:70%; max-width:400px; min-width:220px;"></audio></div>`;
      return;
    }
    // PDF
    if (ext === "pdf") {
      preview.innerHTML = `<div class="preview-center"><iframe src="${fileUrl}" allow="fullscreen" style="width:100%; height:70vh; min-height:350px; border-radius:8px; background:#f9f9f9;"></iframe></div>`;
      return;
    }
    // Text‐based files: json, txt, csv, md
    if (["json", "txt", "csv", "md"].includes(ext)) {
      try {
        const textRes = await fetch(fileUrl);
        if (!textRes.ok)
          throw new Error(`Erro ao baixar texto (${textRes.status})`);
        const text = await textRes.text();
        const escaped = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        preview.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-word; max-height: 60vh; overflow: auto; background: #fff; border-radius: 8px; padding: 1rem;">${escaped}</pre>`;
      } catch (err) {
        preview.innerHTML = `<p>Não foi possível exibir o texto.</p>`;
      }
      return;
    }
    // Fallback: link to download
    preview.innerHTML = `<p><a href="${fileUrl}" download>${r.filename}</a></p>`;
  }

  // 4) Helper: fetch and display comments
  async function loadComments(id) {
    commentsList.innerHTML = ""; // clear previous

    try {
      // FIXED URL: removed extra `}` after comments
      const resComments = await fetch(
        `http://localhost:3001/api/resources/${id}/comments`,
        {
          credentials: "include",
        }
      );
      if (!resComments.ok) {
        throw new Error(`Erro ao buscar comentários (${resComments.status})`);
      }
      const comments = await resComments.json();
      comments.forEach((c) => {
        const li = document.createElement("li");
        li.textContent = `${c.author.username}: ${c.content}`;
        commentsList.appendChild(li);
      });
    } catch (err) {
      console.error("Comments error:", err);
      commentsList.innerHTML = "<li>Erro ao carregar comentários.</li>";
    }
  }

  // 5) Submit a new comment
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = commentForm.dataset.resourceId;
    const authorId = window.currentUserId || null;

    const data = {
      content: commentForm.content.value,
      author: authorId,
    };

    try {
      const resPost = await fetch(
        `http://localhost:3001/api/resources/${id}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!resPost.ok) {
        throw new Error(`Erro ao enviar comentário (${resPost.status})`);
      }
      commentForm.content.value = "";
      await loadComments(id);
    } catch (err) {
      console.error("Post comment error:", err);
      alert("Erro ao enviar comentário");
    }
  });
});
