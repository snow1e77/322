// script.js
document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ---------------------------------------------
  function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode === toastContainer) {
        toastContainer.removeChild(toast);
      }
    }, 4000);
  }

  function validateForm(form) {
    let valid = true;
    form.querySelectorAll("input[required], textarea[required]").forEach((input) => {
      const errorSpan = input.nextElementSibling;
      if (!input.value.trim()) {
        errorSpan.textContent = "Это поле обязательно";
        valid = false;
      } else {
        errorSpan.textContent = "";
      }
    });
    return valid;
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
  }

  function setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem("currentUser");
  }

  function updateCurrentUserName() {
    const userSpan = document.getElementById("current-user");
    const user = getCurrentUser();
    if (user) {
      userSpan.textContent = `Привет, ${user.name}`;
      document.getElementById("profile-btn").style.display = "inline-block";
      document.getElementById("auth-buttons").style.display = "none";
    } else {
      userSpan.textContent = "";
      document.getElementById("profile-btn").style.display = "none";
      document.getElementById("auth-buttons").style.display = "flex";
    }
  }
  updateCurrentUserName();

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("show");
      modal.style.display = "block";
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    }
  }

  // ---------------------------------------------
  // API-ФУНКЦИИ
  // ---------------------------------------------
  const API_URL = "/api";

  async function registerUserAPI(user) {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      return await res.json();
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  async function verifyEmailAPI(email, code) {
    try {
      const res = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      return await res.json();
    } catch (err) {
      console.error("Ошибка подтверждения email:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  async function loginUserAPI(email, password) {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err) {
      console.error("Ошибка входа:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  async function updateUserProfile(userId, profileData) {
    try {
      const res = await fetch(`${API_URL}/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      return await res.json();
    } catch (err) {
      console.error("Ошибка обновления профиля:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  async function createPortfolioAPI(portfolioData) {
    try {
      const res = await fetch(`${API_URL}/portfolios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolioData),
      });
      return await res.json();
    } catch (err) {
      console.error("Ошибка создания анкеты:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  async function getPortfoliosAPI() {
    try {
      const res = await fetch(`${API_URL}/portfolios`);
      return await res.json();
    } catch (err) {
      console.error("Ошибка загрузки анкет:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  async function getUserProfileById(userId) {
    try {
      const res = await fetch(`${API_URL}/profile/${userId}`);
      return await res.json();
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  // Новый эндпоинт для добавления/убирания анкеты из избранного
  async function toggleFavoriteAPI(userId, portfolioId) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/favorites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioId }),
      });
      return await res.json();
    } catch (err) {
      console.error("Ошибка избранного:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  async function deletePortfolioAPI(id) {
    try {
      const res = await fetch(`${API_URL}/portfolios/${id}`, {
        method: "DELETE",
      });
      return await res.json();
    } catch (err) {
      console.error("Ошибка удаления анкеты:", err);
      return { error: "Ошибка связи с сервером" };
    }
  }

  // ---------------------------------------------
  // ФУНКЦИЯ ПОЛУЧЕНИЯ+ФИЛЬТРАЦИИ+СОРТИРОВКИ АНКЕТ
  // ---------------------------------------------
  async function filterAndRenderPortfolios() {
    const result = await getPortfoliosAPI();
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    let portfolios = result.portfolios || [];
    const user = getCurrentUser();

    // 1) Поиск
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
      portfolios = portfolios.filter((p) =>
        p.fullname.toLowerCase().includes(query)
      );
    }

    // 2) Фильтр по навыкам
    const skills = Array.from(document.querySelectorAll('input[name="skill"]:checked'))
      .map((checkbox) => checkbox.value);

    if (skills.length > 0) {
      portfolios = portfolios.filter((p) =>
        skills.every((skill) => p.skills.includes(skill))
      );
    }

    // 3) "Только избранные"
    const isFavoriteOnly = document.getElementById("filter-favorite").checked;
    if (isFavoriteOnly && user) {
      const favs = user.favorites || [];
      portfolios = portfolios.filter((p) => favs.includes(String(p.id)));
    }

    // 4) Фильтр по дате
    const dateFromValue = document.getElementById("date-from").value;
    const dateToValue = document.getElementById("date-to").value;
    if (dateFromValue) {
      const fromDate = new Date(dateFromValue);
      portfolios = portfolios.filter((p) => new Date(p.createdAt) >= fromDate);
    }
    if (dateToValue) {
      const toDate = new Date(dateToValue);
      toDate.setHours(23, 59, 59, 999);
      portfolios = portfolios.filter((p) => new Date(p.createdAt) <= toDate);
    }

    // 5) Сортировка
    const sortBy = document.getElementById("sort-select").value;
    switch (sortBy) {
      case "date_desc":
        portfolios.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "date_asc":
        portfolios.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "alpha_asc":
        portfolios.sort((a, b) => a.fullname.localeCompare(b.fullname));
        break;
      case "alpha_desc":
        portfolios.sort((a, b) => b.fullname.localeCompare(a.fullname));
        break;
    }

    // 6) Избранные выше остальных
    if (user && user.favorites) {
      portfolios.sort((a, b) => {
        const aFav = user.favorites.includes(String(a.id));
        const bFav = user.favorites.includes(String(b.id));
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
      });
    }

    // Отрисовываем
    renderPortfolios(portfolios);
  }

  // ---------------------------------------------
  // ОТОБРАЖЕНИЕ СПИСКА АНКЕТ
  // ---------------------------------------------
  function renderPortfolios(portfolios) {
    const portfolioList = document.getElementById("portfolio-list");
    portfolioList.innerHTML = "";
    const currentUser = getCurrentUser();

    portfolios.forEach((portfolio) => {
      const portfolioCard = document.createElement("div");
      portfolioCard.className = "portfolio-card";
      portfolioCard.innerHTML = `
        <h3>${portfolio.fullname}</h3>
        <p>${portfolio.description}</p>
        <p>Навыки: ${portfolio.skills.join(", ")}</p>
        ${
          portfolio.photo
            ? `<img src="${portfolio.photo}" alt="Фото" style="margin-top:10px; max-width:100%;"/>`
            : ""
        }
        <p class="creation-date">
          Создано: ${new Date(portfolio.createdAt).toLocaleString("ru-RU")}
        </p>
      `;

      // Кнопка избранного (если анкета не моя)
      if (
        currentUser &&
        String(currentUser.id) !== String(portfolio.ownerId) // чужая анкета
      ) {
        const userFavs = currentUser.favorites || [];
        const isFav = userFavs.includes(String(portfolio.id));
        const favBtn = document.createElement("button");
        favBtn.className = "secondary";
        favBtn.textContent = isFav ? "Убрать из избранного" : "В избранное";
        favBtn.style.marginRight = "10px";
        favBtn.addEventListener("click", async () => {
          const toggleRes = await toggleFavoriteAPI(currentUser.id, String(portfolio.id));
          if (toggleRes.error) {
            showToast(toggleRes.error, "error");
          } else {
            setCurrentUser(toggleRes.user);
            showToast("Избранное изменено!");
            filterAndRenderPortfolios();
          }
        });
        portfolioCard.appendChild(favBtn);
      }

      // Кнопка "Удалить" (только если это моя анкета)
      if (currentUser && currentUser.email === portfolio.owner) {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete";
        deleteBtn.textContent = "Удалить";
        deleteBtn.addEventListener("click", async () => {
          if (confirm("Вы действительно хотите удалить эту анкету?")) {
            const result = await deletePortfolioAPI(portfolio.id);
            if (result.error) {
              showToast(result.error, "error");
            } else {
              showToast("Анкета удалена!");
              filterAndRenderPortfolios();
            }
          }
        });
        portfolioCard.appendChild(deleteBtn);
      }

      portfolioList.appendChild(portfolioCard);
    });
  }

  // ---------------------------------------------
  // ПОКАЗ ЧУЖОГО ПРОФИЛЯ
  // ---------------------------------------------
  function showUserProfileModal(userData) {
    const modalViewUser = document.getElementById("modal-view-user");
    if (!modalViewUser) return;
    const contentDiv = modalViewUser.querySelector(".modal-content-inner");
    contentDiv.innerHTML = `
      <h2>Профиль пользователя</h2>
      <div class="photo-container">
        ${userData.photo ? `<img src="${userData.photo}" alt="Фото"/>` : ""}
      </div>
      <p><strong>Имя:</strong> ${userData.name || ""}</p>
      <p><strong>Возраст:</strong> ${userData.age || ""}</p>
      <p><strong>Место проживания:</strong> ${userData.location || ""}</p>
      <p><strong>Стаж работы:</strong> ${userData.experience || ""}</p>
      <p><strong>Образование:</strong> ${userData.education || ""}</p>
      <p><strong>Телефон:</strong> ${userData.phone || ""}</p>
    `;
    openModal("modal-view-user");
  }

  // ---------------------------------------------
  // ЭЛЕМЕНТЫ ДЛЯ ФИЛЬТРА
  // ---------------------------------------------
  const searchInput = document.getElementById("search-input");
  const applyFilterBtn = document.getElementById("apply-filter-btn");
  const filterToggle = document.getElementById("filter-toggle");
  const filterOptions = document.getElementById("filter-options");

  // Показ/скрытие блока с опциями фильтра
  filterToggle.addEventListener("click", () => {
    filterOptions.style.display =
      filterOptions.style.display === "none" ? "block" : "none";
  });

  // При загрузке — сразу фильтруем и выводим
  filterAndRenderPortfolios();

  // Поиск (при вводе)
  searchInput.addEventListener("input", () => {
    filterAndRenderPortfolios();
  });

  // Кнопка "Применить фильтр"
  applyFilterBtn.addEventListener("click", () => {
    filterAndRenderPortfolios();
  });

  // ---------------------------------------------
  // РЕГИСТРАЦИЯ (Шаг 1)
  // ---------------------------------------------
  const regForm = document.getElementById("registration-form");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateForm(regForm)) return;

      const submitBtn = regForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const formData = new FormData(regForm);
      const user = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      };
      const result = await registerUserAPI(user);
      if (result.error) {
        showToast(result.error, "error");
        submitBtn.disabled = false;
      } else {
        showToast("Код отправлен на почту. Подтвердите email.");
        closeModal("modal-registration");

        // Откроем форму verify
        document.getElementById("verify-form").reset();
        openModal("modal-verify");
      }
    });
  }

  // ---------------------------------------------
  // ВЕРИФИКАЦИЯ (Шаг 2)
  // ---------------------------------------------
  const verifyForm = document.getElementById("verify-form");
  if (verifyForm) {
    verifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateForm(verifyForm)) return;

      const submitBtn = verifyForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const formData = new FormData(verifyForm);
      const email = formData.get("email");
      const code = formData.get("code");

      const result = await verifyEmailAPI(email, code);
      if (result.error) {
        showToast(result.error, "error");
        submitBtn.disabled = false;
      } else {
        showToast("Email подтверждён! Теперь можете войти.");
        closeModal("modal-verify");
      }
    });
  }

  // ---------------------------------------------
  // ВХОД
  // ---------------------------------------------
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateForm(loginForm)) return;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const formData = new FormData(loginForm);
      const email = formData.get("email");
      const password = formData.get("password");
      const result = await loginUserAPI(email, password);
      if (result.error) {
        showToast(result.error, "error");
        submitBtn.disabled = false;
      } else {
        setCurrentUser(result.user);
        showToast("Вход успешен!");
        closeModal("modal-login");
        updateCurrentUserName();
        filterAndRenderPortfolios();
      }
    });
  }

  // ---------------------------------------------
  // ПРОСМОТР СОБСТВЕННОГО ПРОФИЛЯ
  // ---------------------------------------------
  const profileBtn = document.getElementById("profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      const user = getCurrentUser();
      if (!user) {
        showToast("Сначала войдите в систему.");
        return;
      }
      const profileInfo = document.getElementById("profile-info");
      profileInfo.innerHTML = `
        <div class="photo-container">
          ${user.photo ? `<img src="${user.photo}" alt="Фото" />` : ""}
        </div>
        <p><strong>Имя:</strong> ${user.name}</p>
        <p><strong>Возраст:</strong> ${user.age || ""}</p>
        <p><strong>Место проживания:</strong> ${user.location || ""}</p>
        <p><strong>Стаж работы:</strong> ${user.experience || ""}</p>
        <p><strong>Образование:</strong> ${user.education || ""}</p>
        <p><strong>Телефон:</strong> ${user.phone || ""}</p>
      `;
      openModal("modal-profile");
    });
  }

  // ---------------------------------------------
  // РЕДАКТИРОВАНИЕ ПРОФИЛЯ
  // ---------------------------------------------
  const editProfileBtn = document.getElementById("edit-profile-btn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const user = getCurrentUser();
      if (!user) {
        showToast("Сначала войдите в систему.");
        return;
      }
      const editForm = document.getElementById("edit-profile-form");
      editForm.name.value = user.name || "";
      editForm.age.value = user.age || "";
      editForm.location.value = user.location || "";
      editForm.experience.value = user.experience || "";
      editForm.education.value = user.education || "";
      editForm.phone.value = user.phone || "";
      openModal("modal-edit-profile");
    });
  }

  const editProfileForm = document.getElementById("edit-profile-form");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateForm(editProfileForm)) return;

      const submitBtn = editProfileForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const user = getCurrentUser();
      if (!user) {
        showToast("Сначала войдите в систему.");
        submitBtn.disabled = false;
        return;
      }
      const formData = new FormData(editProfileForm);
      const updatedData = {
        name: formData.get("name"),
        age: formData.get("age"),
        location: formData.get("location"),
        experience: formData.get("experience"),
        education: formData.get("education"),
        phone: formData.get("phone"),
      };

      const photoFile = formData.get("photo");
      if (photoFile && photoFile.size > 0) {
        if (photoFile.size > 2 * 1024 * 1024) {
          showToast("Максимальный размер фото — 2 МБ", "error");
          submitBtn.disabled = false;
          return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
          updatedData.photo = event.target.result;
          const res = await updateUserProfile(user.id, updatedData);
          if (res.error) {
            showToast(res.error, "error");
            submitBtn.disabled = false;
          } else {
            setCurrentUser(res.user);
            showToast("Профиль обновлён!");
            closeModal("modal-edit-profile");
            updateCurrentUserName();
            filterAndRenderPortfolios();
          }
        };
        reader.readAsDataURL(photoFile);
      } else {
        // Без изменения фото
        const res = await updateUserProfile(user.id, updatedData);
        if (res.error) {
          showToast(res.error, "error");
          submitBtn.disabled = false;
        } else {
          setCurrentUser(res.user);
          showToast("Профиль обновлён!");
          closeModal("modal-edit-profile");
          updateCurrentUserName();
          filterAndRenderPortfolios();
        }
      }
    });
  }

  // ---------------------------------------------
  // СОЗДАНИЕ НОВОЙ АНКЕТЫ
  // ---------------------------------------------
  const createProfileBtn = document.getElementById("create-profile-btn");
  if (createProfileBtn) {
    createProfileBtn.addEventListener("click", () => {
      const user = getCurrentUser();
      if (!user) {
        showToast("Сначала войдите, чтобы создать анкету.");
        openModal("modal-login");
        return;
      }
      const createForm = document.getElementById("create-profile-form");
      createForm.reset();
      openModal("modal-create-profile");
    });
  }

  const createProfileForm = document.getElementById("create-profile-form");
  if (createProfileForm) {
    createProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateForm(createProfileForm)) return;

      const submitBtn = document.getElementById("save-create-btn");
      submitBtn.disabled = true;

      const user = getCurrentUser();
      if (!user) {
        showToast("Сначала войдите в систему.");
        submitBtn.disabled = false;
        return;
      }
      const formData = new FormData(createProfileForm);
      const portfolioData = {
        fullname: formData.get("fullname"),
        description: formData.get("description"),
        skills: formData.get("skills")
          ? formData
              .get("skills")
              .split(",")
              .map((s) => s.trim().toLowerCase())
              .filter((s) => s)
          : [],
        owner: user.email,
        ownerId: user.id,
      };

      const photoFile = formData.get("photo");
      if (photoFile && photoFile.size > 0) {
        if (photoFile.size > 2 * 1024 * 1024) {
          showToast("Максимальный размер фото — 2 МБ", "error");
          submitBtn.disabled = false;
          return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
          portfolioData.photo = event.target.result;
          const res = await createPortfolioAPI(portfolioData);
          if (res.error) {
            showToast(res.error, "error");
            submitBtn.disabled = false;
          } else {
            showToast("Анкета создана!");
            closeModal("modal-create-profile");
            filterAndRenderPortfolios();
          }
        };
        reader.readAsDataURL(photoFile);
      } else {
        // без фото
        const res = await createPortfolioAPI(portfolioData);
        if (res.error) {
          showToast(res.error, "error");
          submitBtn.disabled = false;
        } else {
          showToast("Анкета создана!");
          closeModal("modal-create-profile");
          filterAndRenderPortfolios();
        }
      }
    });
  }

  // ---------------------------------------------
  // ВЫХОД
  // ---------------------------------------------
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearCurrentUser();
      showToast("Вы вышли из системы.");
      updateCurrentUserName();
      closeModal("modal-profile");
      filterAndRenderPortfolios();
    });
  }

  // ---------------------------------------------
  // НОВОСТИ
  // ---------------------------------------------
  const newsBtn = document.getElementById("news-btn");
  if (newsBtn) {
    newsBtn.addEventListener("click", () => {
      openModal("modal-news");
    });
  }

  // ---------------------------------------------
  // ЗАКРЫТИЕ МОДАЛОК
  // ---------------------------------------------
  document.querySelectorAll(".close").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-modal");
      closeModal(modalId);
    });
  });

  window.addEventListener("click", (event) => {
    document.querySelectorAll(".modal").forEach((modal) => {
      if (event.target === modal) {
        closeModal(modal.id);
      }
    });
  });
});
