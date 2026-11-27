(function () {
  "use strict";
  const data = window.STONESTORM_CONTENT;
  if (!data) return;
  const english = window.STONESTORM_GUIDE_EN;
  const isEnglish = () => window.AtlasI18n?.getLocale() === "en";
  const localeText = (hu, en) => (isEnglish() ? en : hu);
  const guideArticle = (article) =>
    isEnglish() && english?.articles[article.id]
      ? { ...article, ...english.articles[article.id] }
      : article;
  const guideFaq = (faq, index) =>
    isEnglish() && english?.faq[index] ? english.faq[index] : faq;
  document.documentElement.classList.remove("no-js");
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const storageKey = "stonestorm-hu-guide-v1";
  const categories = {
    character: "Karakter",
    start: "Első lépések",
    daily: "Napi rutin",
    gear: "Felszerelés",
    adventure: "Kalandok",
    community: "Közösség",
    shop: "Kódok és Shop",
  };
  const englishCategories = {
    character: "Character",
    start: "First steps",
    daily: "Daily routine",
    gear: "Equipment",
    adventure: "Adventures",
    community: "Community",
    shop: "Codes and Shop",
  };
  const categoryName = (category) =>
    (isEnglish() ? englishCategories : categories)[category] ||
    (isEnglish() ? "Frequently asked question" : "Gyakori kérdés");
  const allowedFilters = ["all", ...Object.keys(categories)];
  let storageAvailable = true;
  let dailyResetMessage = false;
  let state = {
    classes: [],
    filter: "all",
    daily: { date: localDay(), done: [] },
  };

  function localDay() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function icon(name, className) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", className || "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + name);
    svg.append(use);
    return svg;
  }
  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || typeof saved !== "object") return;
      if (Array.isArray(saved.classes))
        state.classes = [
          ...new Set(
            saved.classes.filter((id) => data.classes.some((c) => c.id === id)),
          ),
        ].slice(0, 2);
      if (allowedFilters.includes(saved.filter)) state.filter = saved.filter;
      if (
        saved.daily &&
        saved.daily.date === localDay() &&
        Array.isArray(saved.daily.done)
      ) {
        state.daily = {
          date: localDay(),
          done: [
            ...new Set(
              saved.daily.done.filter((id) =>
                data.daily.some((task) => task.id === id),
              ),
            ),
          ],
        };
      }
    } catch (error) {
      // Hibás korábbi JSON esetén alaphelyzetből indulunk; tiltott tárhelynél memória használható.
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (storageError) {
        storageAvailable = false;
      }
    }
  }
  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      storageAvailable = false;
    }
    showStorageStatus();
  }
  function showStorageStatus() {
    if (!storageAvailable)
      $("#storage-note").textContent =
        localeText(
          "A böngésző tárhelye nem érhető el. A választások most csak az oldal bezárásáig élnek. A napi lista a helyi naptári napot követi, nem a játék visszaállítását.",
          "Browser storage is unavailable. Your choices will last only until you close the page. The daily list follows your local calendar day, not the game's reset.",
        );
  }
  readState();
  // A próbaírás a csak olvasható vagy privát tárhelyet is észleli.
  persist();

  const mediaItems = data.media || [];
  const mediaById = new Map(mediaItems.map((item) => [item.id, item]));
  const guideMedia = (item) =>
    isEnglish() && english?.media[item.id]
      ? { ...item, ...english.media[item.id] }
      : item;
  function mediaFigure(item, options = {}) {
    item = guideMedia(item);
    const figure = node("figure", "guide-figure");
    const link = node("a", "image-trigger");
    link.href = "assets/images/" + item.stem + "-1920.webp";
    link.dataset.mediaId = item.id;
    link.setAttribute("aria-label", item.title + (isEnglish() ? " – enlarge image" : " – kép nagyítása"));
    link.setAttribute("aria-haspopup", "dialog");
    const image = node("img");
    image.src = "assets/images/" + item.stem + "-640.webp";
    image.srcset = [640, 1280, 1920]
      .map(
        (width) =>
          "assets/images/" + item.stem + "-" + width + ".webp " + width + "w",
      )
      .join(", ");
    image.sizes =
      options.sizes ||
      "(max-width: 680px) calc(100vw - 36px), (max-width: 900px) 45vw, 35vw";
    image.alt = item.alt;
    image.width = 1920;
    image.height = 1080;
    image.loading = "lazy";
    image.decoding = "async";
    const zoom = node("span", "image-zoom");
    zoom.setAttribute("aria-hidden", "true");
    zoom.append(icon("search"), document.createTextNode(isEnglish() ? "Zoom" : "Nagyítás"));
    link.append(image, zoom);
    figure.append(link);
    if (options.caption !== false)
      figure.append(node("figcaption", null, item.caption));
    return figure;
  }
  function renderMedia() {
    $$("[data-media-slot]").forEach((slot) => {
      const item = mediaById.get(slot.dataset.mediaSlot);
      if (item) slot.replaceChildren(mediaFigure(item));
    });
    $("#world-gallery").replaceChildren();
    mediaItems
      .filter((item) => item.gallery)
      .forEach((source) => {
        const item = guideMedia(source);
        const card = node("article", "gallery-card");
        const copy = node("div", "gallery-card-copy");
        copy.append(
          node("p", "eyebrow", item.tag),
          node("h3", null, item.title),
          node("p", "gallery-card-caption", item.caption),
        );
        card.append(mediaFigure(item, { caption: false }), copy);
        $("#world-gallery").append(card);
      });
  }
  function setupLightbox() {
    const dialog = $("#image-lightbox");
    if (!dialog || typeof dialog.showModal !== "function") return;
    const image = $("#lightbox-image");
    let opener = null;
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("a[data-media-id]");
      if (
        !trigger ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const source = mediaById.get(trigger.dataset.mediaId);
      const item = source && guideMedia(source);
      if (!item) return;
      event.preventDefault();
      opener = trigger;
      $("#lightbox-title").textContent = item.title;
      $("#lightbox-description").textContent =
        item.caption + " · Stonestorm Creator Kit";
      $("#lightbox-error").hidden = true;
      image.alt = item.alt;
      image.src = trigger.href;
      $("#lightbox-original").href = trigger.href;
      document.body.classList.add("lightbox-open");
      dialog.showModal();
    });
    $("#lightbox-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialog.querySelectorAll(
          'button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]',
        ),
      );
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("lightbox-open");
      image.removeAttribute("src");
      $("#lightbox-original").removeAttribute("href");
      if (opener && document.contains(opener))
        opener.focus({ preventScroll: true });
      opener = null;
    });
    image.addEventListener("error", () => {
      if (dialog.open && image.hasAttribute("src"))
        $("#lightbox-error").hidden = false;
    });
  }

  function renderClasses() {
    const container = $("#class-cards");
    container.replaceChildren();
    data.classes.forEach((c) => {
      const translated = isEnglish() ? english?.classes[c.id] : null;
      const card = node("article", "class-card");
      card.dataset.classId = c.id;
      card.append(
        icon(c.icon, "topic-icon"),
        node("h4", null, c.name),
        node("div", "class-tags", translated?.tags ?? c.tags),
        node("p", null, translated?.description ?? c.description),
      );
      const stat = node("div", "class-stat", localeText("Elsődleges stat", "Primary stat"));
      stat.append(node("strong", null, translated?.stat ?? c.stat));
      const button = node("button", "compare-button");
      button.type = "button";
      button.setAttribute("aria-controls", "comparison-panel");
      button.addEventListener("click", () => {
        const index = state.classes.indexOf(c.id);
        if (index >= 0) state.classes.splice(index, 1);
        else if (state.classes.length < 2) state.classes.push(c.id);
        else {
          $("#class-feedback").textContent = localeText(
            "Egyszerre két kaszt hasonlítható össze. Előbb vedd ki az egyik kijelölt kasztot.",
            "You can compare two classes at a time. Remove one of the selected classes first.",
          );
          return;
        }
        $("#class-feedback").textContent = state.classes.length === 2
          ? localeText("Az összehasonlítás elkészült a kártyák alatt.", "Your comparison is ready below the cards.")
          : localeText("Válassz még ", "Select ") +
            (2 - state.classes.length) +
            localeText(" kasztot az összehasonlításhoz.", " more class to compare.");
        persist();
        updateComparison();
      });
      card.append(stat, button);
      container.append(card);
    });
    updateComparison();
  }
  function updateComparison() {
    const translatedClass = (c) => isEnglish() ? english?.classes[c.id] ?? c : c;
    $$(".class-card").forEach((card) => {
      const selected = state.classes.includes(card.dataset.classId);
      card.classList.toggle("selected", selected);
      const button = card.querySelector("button");
      const c = data.classes.find((item) => item.id === card.dataset.classId);
      button.textContent = selected
        ? localeText("✓ Kijelölve · eltávolítás", "✓ Selected · remove")
        : localeText("+ Összehasonlítom", "+ Compare");
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute(
        "aria-label",
        c.name +
          (selected
            ? localeText(" eltávolítása az összehasonlításból", " remove from comparison")
            : localeText(" hozzáadása az összehasonlításhoz", " add to comparison")),
      );
    });
    const selected = state.classes.map((id) =>
      data.classes.find((c) => c.id === id),
    );
    $("#comparison-count").textContent = selected.length + (isEnglish() ? " / 2 selected" : " / 2 kiválasztva");
    if (state.classes.length === 2) {
      $("#class-feedback").textContent = localeText(
        "Az összehasonlítás elkészült a kártyák alatt.",
        "Your comparison is ready below the cards.",
      );
    } else if (state.classes.length === 1) {
      $("#class-feedback").textContent = localeText(
        "Válassz még egy kasztot az összehasonlításhoz.",
        "Select one more class to compare.",
      );
    } else {
      $("#class-feedback").textContent = "";
    }
    const container = $("#comparison-content");
    container.replaceChildren();
    if (selected.length !== 2) {
      container.append(
        node(
          "p",
          null,
          selected.length
            ? localeText("Már csak egy kaszt hiányzik. Jelöld ki a fenti kártyák egyikét.", "Choose one more class from the cards above.")
            : localeText("Warrior, Ninja, Mage vagy Shaman? Két kijelöléssel egymás mellé teheted a fegyverüket, a fő statjukat és a harci stílusukat.", "Warrior, Ninja, Mage or Shaman? Select two to compare their weapons, primary stats and combat styles side by side."),
        ),
      );
      return;
    }
    const table = node("table");
    const caption = node(
      "caption",
      "sr-only",
      selected.map((c) => c.name).join(localeText(" és ", " and ")) + localeText(" összehasonlítása", " comparison"),
    );
    const head = node("thead"),
      header = node("tr");
    [localeText("Tulajdonság", "Attribute"), ...selected.map((c) => c.name)].forEach((name) => {
      const th = node("th", null, name);
      th.scope = "col";
      header.append(th);
    });
    head.append(header);
    const body = node("tbody");
    [
      [localeText("Elsődleges stat", "Primary stat"), "stat"],
      [localeText("Fegyver", "Weapon"), "weapon"],
      [localeText("Harci stílus", "Combat style"), "focus"],
      [localeText("Tipp · választás", "Tip · choice"), "tip"],
    ].forEach(([label, key]) => {
      const tr = node("tr"),
        th = node("th", null, label);
      th.scope = "row";
      tr.append(th);
      selected.forEach((c) => tr.append(node("td", null, translatedClass(c)[key] ?? c[key])));
      body.append(tr);
    });
    table.append(caption, head, body);
    container.append(table);
  }

  function ensureDailyDate() {
    if (state.daily.date !== localDay()) {
      state.daily = { date: localDay(), done: [] };
      persist();
      updateDaily();
    }
  }
  function renderDaily() {
    renderDailyTasks();
    $("#reset-daily").addEventListener("click", () => {
      state.daily = { date: localDay(), done: [] };
      dailyResetMessage = true;
      persist();
      updateDaily();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) ensureDailyDate();
    });
    window.addEventListener("focus", ensureDailyDate);
    window.setInterval(ensureDailyDate, 30000);
  }
  function renderDailyTasks() {
    $("#daily-checklist").replaceChildren();
    data.daily.forEach((task, index) => {
      const translated = isEnglish() ? english?.daily[index] : null;
      const label = node("label", "check-item");
      const input = node("input");
      input.type = "checkbox";
      input.id = "task-" + task.id;
      input.value = task.id;
      const copy = node("span");
      copy.append(
        node("strong", null, translated?.title ?? task.title),
        node("small", null, translated?.description ?? task.description),
      );
      input.addEventListener("change", () => {
        const checked = input.checked;
        dailyResetMessage = false;
        ensureDailyDate();
        state.daily.done = state.daily.done.filter((id) => id !== task.id);
        if (checked) state.daily.done.push(task.id);
        persist();
        updateDaily();
      });
      label.append(input, copy);
      $("#daily-checklist").append(label);
    });
    updateDaily();
  }
  function updateDaily() {
    $$("#daily-checklist input").forEach((input) => {
      input.checked = state.daily.done.includes(input.value);
    });
    const done = state.daily.done.length,
      total = data.daily.length;
    $("#daily-counter").textContent = done + " / " + total;
    $("#daily-progress").setAttribute("aria-valuemax", String(total));
    $("#daily-progress").setAttribute("aria-valuenow", String(done));
    $("#daily-progress span").style.width = (done / total) * 100 + "%";
    $("#daily-message").textContent = dailyResetMessage
      ? localeText("A pipákat töröltük. Kezdődhet egy új kör.", "Checkmarks cleared. Start a fresh round.")
      : done === total
        ? localeText("Minden pipa a helyén. Szép kaland volt!", "Every box is checked. Well done!")
        : done
          ? isEnglish()
            ? done + " complete, " + (total - done) + " tasks left."
            : done + " kész, " + (total - done) + " teendő vár még rád."
          : localeText("Minden kaland egy lépéssel kezdődik.", "Every adventure starts with one step.");
  }

  function renderLibrary() {
    data.articles.forEach((source, index) => {
      const article = guideArticle(source);
      const details = document.getElementById("cikk-" + source.id) || node("details", "library-item");
      details.id = "cikk-" + source.id;
      const summary = node("summary");
      summary.append(
        node("span", null, String(index + 1).padStart(2, "0")),
        document.createTextNode(article.title),
      );
      const content = node("div", "article-body");
      content.append(
        node("span", "article-tag", categoryName(article.category)),
        node("p", null, article.intro),
      );
      mediaItems
        .filter((item) => item.articles.includes(article.id))
        .forEach((item) => {
          content.append(mediaFigure(item));
        });
      article.sections.forEach((section) => {
        if (section.heading) content.append(node("h4", null, section.heading));
        const list = node("ul");
        section.items.forEach((text) => list.append(node("li", null, text)));
        content.append(list);
      });
      if (article.tip)
        content.append(node("p", "inline-tip", (isEnglish() ? "Tip · " : "Tipp · ") + article.tip));
      details.replaceChildren(summary, content);
      if (!details.parentNode) $("#article-library").append(details);
    });
    data.faq.forEach((source, index) => {
      const faq = guideFaq(source, index);
      const details = document.getElementById("gyik-" + index) || node("details", "faq-item");
      details.id = "gyik-" + index;
      details.replaceChildren(
        node("summary", null, faq.question),
        node("p", null, faq.answer),
      );
      if (!details.parentNode) $("#faq-list").append(details);
    });
  }
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("hu-HU")
      .replace(/[’‘]/g, "'");
  const articleText = (article) => [
    article.title,
    article.intro,
    ...article.sections.flatMap((s) => [s.heading || "", ...s.items]),
    article.tip || "",
  ].join(" ");
  const searchIndex = data.articles.map((article) => ({
    title: article.title,
    category: article.category,
    href: "#cikk-" + article.id,
    excerpt: article.intro,
    source: article,
    searchable: normalize(articleText(article) + " " + (english?.articles[article.id] ? articleText(english.articles[article.id]) : "")),
  }));
  data.faq.forEach((faq, index) =>
    searchIndex.push({
      title: faq.question,
      category: "faq",
      href: "#gyik-" + index,
      excerpt: faq.answer,
      faqIndex: index,
      searchable: normalize(faq.question + " " + faq.answer + " " + (english?.faq[index]?.question || "") + " " + (english?.faq[index]?.answer || "")),
    }),
  );
  function renderSearch() {
    const query = $("#knowledge-search").value.trim();
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    const filtering = tokens.length > 0 || state.filter !== "all";
    const results = $("#search-results");
    results.replaceChildren();
    results.hidden = !filtering;
    $("#clear-search").hidden = !query;
    $$(".filter").forEach((button) => {
      const active = button.dataset.filter === state.filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (!filtering) {
      $("#search-status").textContent =
        data.articles.length +
        (isEnglish() ? " searchable chapters · Search also works without accents." : " kereshető fejezet · A kereső az ékezet nélküli szavakat is felismeri.");
      return;
    }
    const matches = searchIndex.filter(
      (article) =>
        (state.filter === "all" || state.filter === article.category) &&
        tokens.every((token) => article.searchable.includes(token)),
    );
    $("#search-status").textContent = isEnglish()
      ? matches.length + (query ? " results for “" + query + "”." : " results in the selected topic.")
      : matches.length + " találat" + (query ? " a(z) „" + query + "” keresésre" : " a kiválasztott témában") + ".";
    if (!matches.length) {
      const empty = node("div", "empty-state");
      empty.append(
        node("h3", null, isEnglish() ? "No results found." : "Erre most nincs találat."),
        node(
          "p",
          null,
          isEnglish() ? "Try a shorter term, such as energy, Spirit Stone or Mage. You can also reset the topic filter." : "Próbálj rövidebb kifejezést, például: energia, Spirit Stone vagy Mage. A témaszűrőt is visszaállíthatod.",
        ),
      );
      results.append(empty);
      return;
    }
    matches.forEach((article) => {
      const a = node("a", "search-result");
      a.href = article.href;
      const translation = article.source ? guideArticle(article.source) : guideFaq(data.faq[article.faqIndex], article.faqIndex);
      const title = translation.title || translation.question;
      const text = translation.intro || translation.answer;
      const excerpt =
        text.length > 210 ? text.slice(0, 207) + "…" : text;
      a.append(
        node("h3", null, title),
        node("p", null, excerpt),
        node(
          "small",
          null,
          categoryName(article.category) + (isEnglish() ? " · Open →" : " · Megnyitás →"),
        ),
      );
      a.addEventListener("click", () => {
        const target = document.getElementById(article.href.slice(1));
        if (target) target.open = true;
      });
      results.append(a);
    });
  }
  function setupSearch() {
    $("#search-form").addEventListener("submit", (event) => {
      event.preventDefault();
      renderSearch();
    });
    $("#knowledge-search").addEventListener("input", renderSearch);
    $("#clear-search").addEventListener("click", () => {
      $("#knowledge-search").value = "";
      renderSearch();
      $("#knowledge-search").focus();
    });
    $$(".filter").forEach((button) =>
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        persist();
        renderSearch();
      }),
    );
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.target.closest('input,textarea,select,[contenteditable="true"]')
      ) {
        event.preventDefault();
        $("#knowledge-search").focus();
        $("#tudasbazis").scrollIntoView({ block: "start" });
      }
    });
    renderSearch();
  }
  function setupNavigation() {
    const toggle = $("#menu-toggle"),
      nav = $("#main-nav");
    function setMenuLabel(open) {
      const key = open ? "header.closeNavigation" : "header.openNavigation";
      toggle.dataset.atlasI18nLabel = key;
      toggle.setAttribute(
        "aria-label",
        globalThis.AtlasI18n?.t(key) ?? (open ? "Navigáció bezárása" : "Navigáció megnyitása"),
      );
    }
    function closeMenu(returnFocus) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      setMenuLabel(false);
      if (returnFocus) toggle.focus();
    }
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      setMenuLabel(open);
      nav.classList.toggle("open", open);
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      )
        closeMenu(true);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".site-header")) closeMenu(false);
    });
    const media = window.matchMedia("(min-width:681px)");
    if (media.addEventListener)
      media.addEventListener("change", () => closeMenu(false));
    const links = $$("#main-nav a"),
      sections = links.map((a) => document.getElementById(a.hash.slice(1).split("/")[0])).filter(Boolean);
    let scheduled = false;
    function updateNavigation() {
      scheduled = false;
      let current = sections[0];
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= 160) current = section;
      });
      links.forEach((a) => {
        const active = a.hash === "#" + current.id;
        a.classList.toggle("active", active);
        if (active) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
      $("#back-top").hidden = window.scrollY < 550;
    }
    window.addEventListener(
      "scroll",
      () => {
        if (!scheduled) {
          scheduled = true;
          window.requestAnimationFrame(updateNavigation);
        }
      },
      { passive: true },
    );
    updateNavigation();
  }
  function revealHash() {
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch (error) {
      return;
    }
    const target = document.getElementById(id);
    if (target && target.tagName === "DETAILS") {
      target.open = true;
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start" });
        target.querySelector("summary").focus({ preventScroll: true });
      });
    }
  }
  renderClasses();
  renderDaily();
  renderLibrary();
  renderMedia();
  setupLightbox();
  setupSearch();
  setupNavigation();
  window.AtlasI18n?.onChange(() => {
    renderClasses();
    renderDailyTasks();
    renderLibrary();
    renderSearch();
    renderMedia();
    showStorageStatus();
  });
  window.addEventListener("hashchange", revealHash);
  revealHash();
})();
