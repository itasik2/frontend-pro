// Получение элементов из DOM
const clientsTable = document.getElementById("clients-table"),
  modalContainer = document.getElementById("modal-container"),
  modalContent = document.getElementById("modal-content"),
  addClientForm = document.getElementById("add-client-form"),
  addBtn = document.getElementById("add-btn"),
  saveBtn = document.getElementById("save-client-btn"),
  modalTitle = document.getElementById("modal-title"),
  addContactBtn = document.getElementById("add-contact-btn"),
  closeBtn = document.getElementById("close-btn"),
  buttonContainer = document.getElementById("button-container"),
  modalConfirmDelete = document.getElementById("modal-confirm-delete"),
  clientsTableData = document.querySelectorAll("table th"),
  modalHeader = document.getElementById("modal-header"),
  contactsContainer = document.getElementById("contacts-container"),
  errorsContainer = document.getElementById("errors-container"),
  searchInput = document.getElementById("search-input");

let initialFormState = {};

// Функция добавления прелоадера
function togglePreloader(show) {
  document.getElementById("preloader").style.display = show ? "block" : "none";
}

const serverClientsUrl = "http://localhost:3000/api/clients/";

// Универсальная функция для выполнения запросов на сервер
async function serverRequest(endpoint, method, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(serverClientsUrl + endpoint, options);
  return await response.json();
}

// Функции для работы с клиентами
async function serverAddClient(obj) {
  saveBtn.disabled = true;
  togglePreloader(true);
  try {
    const data = await serverRequest("", "POST", obj);
    return data;
  } catch (error) {
    console.error("Ошибка при удалении клиента:", error);
  } finally {
    togglePreloader(false);
    saveBtn.disabled = false;
  }
}

//функция получения списка клиентов
async function serverGetClients() {
  togglePreloader(true);
  try {
    const data = await serverRequest("", "GET");
    return data;
  } catch (error) {
    console.error("Ошибка при получении списка клиентов:", error);
  } finally {
    togglePreloader(false);
  }
}

// Функция удаления клиента
async function serverDeleteClient(id) {
  togglePreloader(true);
  try {
    const data = await serverRequest(id, "DELETE");
    return data;
  } catch (error) {
    console.error("Ошибка при удалении клиента:", error);
  } finally {
    togglePreloader(false);
  }
}

// Функция редактирования клиентов
async function serverEditClient(id, obj) {
  try {
    const data = await serverRequest(id, "PATCH", obj);
    return data;
  } catch (error) {
    console.error("Ошибка при редактировании клиента:", error);
  }
}

// Функия получения клиента по ID
async function serverGetClientById(clientId) {
  try {
    const data = await serverRequest(clientId, "GET");
    return data;
  } catch (error) {
    console.error("Ошибка при получении клиента по ID:", error);
  }
}

// Функция поиска клиента
async function serverSearchClients(query) {
  return await serverRequest(`?search=${encodeURIComponent(query)}`, "GET");
}

let column = "fio",
  columnDir = true;

// Инициализация массива клиентов
let clientsArr = await serverGetClients();

// Функция создания кнопки
function getBtn(innerHTML, className, id) {
  const btn = document.createElement("button");
  btn.innerHTML = innerHTML;
  btn.classList.add(className);
  btn.id = id;
  return btn;
}

// Функция сброса данных
function resetModal() {
  modalContainer.classList.replace("show", "hidde");
  addClientForm.reset();
  modalConfirmDelete.classList.add("d-none");
  modalConfirmDelete.innerHTML = "";
  contactsContainer.innerHTML = "";
  errorsContainer.innerHTML = "";
}

// Кнопка отмены
const cancelBtn = getBtn("Отмена", "cancel-btn", "cancelBtn");

// Функция конкатинации имени, фамилии, отчества
function getFio(surname, name, lastname) {
  return `${surname} ${name} ${lastname}`;
}

// функция форматирования даты и времени
function formatDateTime(date) {
  date = new Date(date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} <span class="time light-text">${hours}:${minutes}</span>`;
}

// добавляет элемент изображения
function getImage(src, alt = "", className = "") {
  const img = new Image();
  img.src = src;
  img.alt = alt;
  if (className) img.classList.add(className);
  return img;
}

// создает иконку контакта
function createContactIcon(contact) {
  const contactIcons = {
    Телефон: "img/phone-icon.svg",
    Другое: "img/phone-alt-icon.svg",
    Email: "img/email-icon.svg",
    Vk: "img/vk-icon.svg",
    Facebook: "img/facebook-icon.svg",
  };
  const imgSrc = contactIcons[contact.type] || "img/contact-icon.svg";
  const img = getImage(imgSrc, contact.type, "contact-icon");

  let dataTippyContent = "",
    contactLink = contact.value;
  if (contact.type === "Телефон") {
    contactLink = `tel:${contact.value}`;
  } else if (contact.type === "Email") {
    contactLink = `mailto:${contact.value}`;
  } else if (contact.type === "Vk" || contact.type === "Facebook") {
    contactLink = contact.value; // предполагается, что это URL
  }

  if (contact.type === "Телефон") {
    dataTippyContent = `data-tippy-content='<div class="tooltip-content">${contact.value}</div>'`;
  } else {
    dataTippyContent = `data-tippy-content='<div class="tooltip-content">${contact.type}: <a href=""${contactLink}" target="_blank">${contact.value}</a></div>'`;
  }

  return `<span id="tippy-contact" ${dataTippyContent}>${img.outerHTML}</span>`;
}

// Показывает скрытые контакты
function showHiddenContacts(button) {
  const contactsWrapper = button.closest(".contacts-wrapper");
  const hiddenContacts = contactsWrapper.querySelector(".hidden-contacts");
  hiddenContacts.classList.replace("d-none", "d-flex");
  button.classList.add("d-none");
  contactsWrapper.classList.toggle("flex-column");
  contactsWrapper.classList.toggle("align-items-start");
}

// Делегирование событий на таблицу клиентов
clientsTable.addEventListener("click", (event) => {
  if (event.target.classList.contains("hidden-contacts-btn")) {
    showHiddenContacts(event.target);
  }
});

// Показавает первые 5 контактов
function getContacts(contacts) {
  const visibleContacts = contacts.slice(0, 4).map(createContactIcon).join(" ");
  const hiddenContactsCount = contacts.length - 4;
  const hiddenButton =
    hiddenContactsCount > 0
      ? `<button class="hidden-contacts-btn">+${hiddenContactsCount}</button>`
      : "";
  return `
    <div class="contacts-wrapper">
      <div class="visible-contacts d-flex">${visibleContacts}</div>
      <div class="hidden-contacts d-none">${contacts
        .slice(4)
        .map(createContactIcon)
        .join(" ")}</div>
      ${hiddenButton}
    </div>`;
}

// Создает поле ввода контакта с его типом и значением
function createContactInput(
  contact = {
    type: "Телефон",
    value: "",
  }
) {
  const contactDiv = document.createElement("div");
  contactDiv.classList.add("contact-input", "d-flex");
  contactDiv.innerHTML = `
    <div class="select-wrapper">
      <select class="contact-type">
        <option value="Телефон" ${
          contact.type === "Телефон" ? "selected" : ""
        }>Телефон</option>
        <option value="Email" ${
          contact.type === "Email" ? "selected" : ""
        }>Email</option>
        <option value="Vk" ${contact.type === "Vk" ? "selected" : ""}>Vk</option>
        <option value="Facebook" ${
          contact.type === "Facebook" ? "selected" : ""
        }>Facebook</option>
        <option value="Другое" ${
          contact.type === "Другое" ? "selected" : ""
        }>Другое</option>
      </select>
    </div>
    <div class="value-input-wrapper d-flex w-100">
      <input type="text" class="contact-value" value="${
        contact.value
      }" placeholder="Введите значение">
      <button type="button" class="delete-input-btn d-none" data-tippy-content="Удалить">${
        getImage("./img/clear-icon.svg", "", "clear-btn-icon").outerHTML
      }</button>
    </div>
  `;

  const valueInput = contactDiv.querySelector(".contact-value");
  const deleteInputBtn = contactDiv.querySelector(".delete-input-btn");

  // Применение маски на телефон при инициализации, если выбран телефон
  if (contact.type === "Телефон") {
    Inputmask({
      mask: "+7(999)999-99-99",
    }).mask(valueInput);
  }

  // Обработчик изменения типа контакта
  contactDiv
    .querySelector(".contact-type")
    .addEventListener("change", (event) => {
      if (event.target.value === "Телефон") {
        Inputmask({
          mask: "+7(999)999-99-99",
        }).mask(valueInput); // Применить маску на телефон
      } else {
        Inputmask.remove(valueInput); // Удалить маску, если тип не телефон
      }
    });

  // показывает кнопку удалить контакт при заполнении значения
  valueInput.addEventListener("input", () => {
    deleteInputBtn.classList.toggle("d-none", !valueInput.value.trim());
  });

  deleteInputBtn.addEventListener("click", () => {
    valueInput.value = "";
    deleteInputBtn.classList.add("d-none");
    contactsContainer.removeChild(contactDiv);

    // Показать кнопку "Добавить контакт", если контактов меньше 10
    if (contactsContainer.children.length < 10) {
      addContactBtn.style.display = "block";
    }

    if (contactsContainer.children.length === 0) {
      contactsContainer.classList.add("d-none");
    }

    // Обновить начальное состояние формы после удаления контакта
    saveInitialFormState();
  });

  // показывает кнопку удалить контакт если поле не пустое
  if (contact.value.trim()) {
    deleteInputBtn.classList.remove("d-none");
  }

  // Инициализация Tippy.js для кнопки удаления
  tippy(deleteInputBtn, {
    content: "Удалить",
    allowHTML: true,
    interactive: true,
  });

  return contactDiv;
}

// Добалет форму заполнения контакта
function addContact() {
  if (contactsContainer.children.length >= 9) {
    // Если число контактов равно или больше 10, то кнопка добавить контакт исчезает
    addContactBtn.style.display = "none";
  }

  contactsContainer.appendChild(createContactInput());

  if (contactsContainer.children.length != 0) {
    contactsContainer.classList.remove("d-none");
  }
}

addContactBtn.addEventListener("click", addContact);

// Функция заполнения формы данными клиента
function fillForm(client) {
  const { name, surname, lastName, contacts } = client;
  document.getElementById("name").value = name;
  document.getElementById("surname").value = surname;
  document.getElementById("lastName").value = lastName;

  contactsContainer.innerHTML = "";
  contacts.forEach((contact) =>
    contactsContainer.appendChild(createContactInput(contact))
  );

  addContactBtn.style.display = contacts.length >= 9 ? "none" : "block";

  if (contactsContainer.children.length === 0) {
    contactsContainer.classList.add("d-none");
  } else {
    contactsContainer.classList.remove("d-none");
  }

  // Сохранение начального состояния формы
  initialFormState = getFormState();
}

// Функция для получения текущего состояния формы
function getFormState() {
  const surname = document.getElementById("surname").value.trim(),
    name = document.getElementById("name").value.trim(),
    lastName = document.getElementById("lastName").value.trim(),
    contactInputs = document.querySelectorAll(".contact-input"),
    contacts = Array.from(contactInputs).map((input) => {
      return {
        type: input.querySelector("select").value,
        value: input.querySelector("input").value.trim(),
      };
    });
  return {
    surname,
    name,
    lastName,
    contacts,
  };
}

// Функция сохранения начального состояния формы
function saveInitialFormState() {
  initialFormState = new FormData(addClientForm);
}

// Функция проверки изменений в форме
function isFormChanged() {
  const currentFormState = getFormState();
  return JSON.stringify(currentFormState) !== JSON.stringify(initialFormState);
}

// Открытие модального окна для добавления клиента
addBtn.addEventListener("click", () => {
  modalContainer.classList.replace("hidde", "show");
  modalTitle.innerHTML = "Новый клиент";
  modalContent.classList.remove("d-none");
  buttonContainer.innerHTML = "";
  addClientForm.reset();
  contactsContainer.innerHTML = "";
  contactsContainer.classList.add("d-none");
  errorsContainer.innerHTML = "";
  modalConfirmDelete.innerHTML = "";
  saveInitialFormState(); // Сохранение начального состояния формы
  buttonContainer.appendChild(cancelBtn);
  addContactBtn.style.display = "block";
  cancelBtn.addEventListener("click", resetModal);
});

// Закрытие модального окна
closeBtn.addEventListener("click", resetModal);

// добавляет или изменяет данные клиента
async function addOrUpdateClient(event) {
  event.preventDefault();
  const errors = [];
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/; // Проверка email

  errorsContainer.innerHTML = "";

  if (!isFormChanged()) {
    resetModal();
    return;
  }

  const clientId = addBtn.dataset.editId;
  const name = document.getElementById("name").value.trim();
  const surname = document.getElementById("surname").value.trim();
  const lastname = document.getElementById("lastName").value.trim();

  const contacts = Array.from(document.querySelectorAll(".contact-input")).map(
    (contactInput) => {
      const type = contactInput.querySelector(".contact-type").value;
      const value = contactInput.querySelector(".contact-value").value.trim();
      return {
        type,
        value,
      };
    }
  );

  // Валидация на стороне клиента

  if (!name) {
    errors.push("Имя не может быть пустым.");
    document.getElementById("name").classList.add("input-error");
  } else {
    document.getElementById("name").classList.remove("input-error");
  }

  if (!surname) {
    errors.push("Фамилия не может быть пустой.");
    document.getElementById("surname").classList.add("input-error");
  } else {
    document.getElementById("surname").classList.remove("input-error");
  }

  contacts.forEach((contact, index) => {
    const contactInput = document.querySelectorAll(".contact-input")[index];

    // Проверка на емайл
    if (contact.type === "Email") {
      if (!contact.value) {
        errors.push(`Значение контакта №${index + 1} не может быть пустым.`);
        contactInput.classList.add("input-error");
      } else if (!emailPattern.test(contact.value)) {
        errors.push("Непарвильный Email!");
        contactInput.classList.add("input-error"); // подсвечиваем не валидное поле
      } else {
        contactInput.classList.remove("input-error"); // Убираем подсветку если поле валидное
      }
    }
  });

  if (errors.length > 0) {
    errorsContainer.innerHTML = errors.join("<br>");
    return;
  }

  const newClient = {
    name,
    surname,
    lastName: lastname,
    contacts,
  };

  try {
    if (clientId) {
      await serverEditClient(clientId, newClient);
    } else {
      await serverAddClient(newClient);
    }

    resetModal();
    clientsArr = await serverGetClients();
    render();
  } catch (error) {
    console.error("Ошибка при добавлении/редактировании клиента:", error);

    // Обработка ошибок
    if (error.response) {
      const statusCode = error.response.status;

      // Обработка конкретных статусов ошибок
      switch (statusCode) {
        case 404:
          errors.push(
            "Переданный в запросе метод не существует или запрашиваемый элемент не найден в базе данных"
          );
          break;

        case 422:
          // Если сервер вернул ошибки валидации
          if (error.response.data && Array.isArray(error.response.data)) {
            const validationErrors = error.response.data;
            validationErrors.forEach((err) => {
              errors.push(
                `Объект, переданный в теле запроса, не прошёл валидацию: ${err.field}: ${err.message}`
              );
            });
          } else {
            errors.push("Ошибка 422: Объект не прошёл валидацию.");
          }
          break;

        case 500:
          errors.push(
            "Странно, но сервер сломался :(<br>Обратитесь к куратору Skillbox, чтобы решить проблему"
          );
          break;

        default:
          errors.push(`Ошибка: ${statusCode}: Что то пошло не так...`);
      }
    } else {
      // Если нет ответа от сервера
      errors.push("Ошибка соединения с сервером. Попробуйте позже.");
    }

    // Отображение ошибок пользователю
    errorsContainer.innerHTML = errors.join("<br>");
  }
}

// Сохранение клиента
saveBtn.addEventListener("click", addOrUpdateClient);

// Функция для подтверждения удаления клиента
function confirmDeleteClient(clientId) {
  modalContainer.classList.replace("hidde", "show");
  modalContent.classList.add("d-none");
  modalHeader.classList.remove("justify-content-between");
  modalTitle.innerHTML = "Удалить клиента";
  modalTitle.classList.add("delete-title");
  modalConfirmDelete.classList.remove("d-none");
  modalConfirmDelete.innerHTML = `
    <p class="modal-confirm-delete-desc text">
      Вы действительно хотите удалить<br>данного клиента?
    </p>
    <div class="modal-confirm-btn-wrap d-flex flex-column">
      <button class="confirm-delete-btn modal-btn" id="confirm-delete-btn">Удалить</button>
      ${cancelBtn.outerHTML}
    </div>
  `;

  document
    .getElementById("confirm-delete-btn")
    .addEventListener("click", async () => {
      await serverDeleteClient(clientId);
      resetModal();
      clientsArr = await serverGetClients();
      render();
    });

  document.getElementById("cancelBtn").addEventListener("click", resetModal);
}

// Функция для открытия модального окна с заполнением формы данными клиента
async function openEditClientForm(clientId) {
  const client = await serverGetClientById(clientId);
  saveInitialFormState();
  fillForm(client);

  modalConfirmDelete.classList.add("d-none");
  modalContainer.classList.replace("hidde", "show");
  modalContent.classList.remove("d-none");
  modalTitle.innerHTML = `Изменить данные <span class="span-id light-text"> ID: ${client.id}</span>`;
  modalTitle.classList.remove("delete-title");
  addBtn.dataset.editId = client.id;

  buttonContainer.innerHTML = "";
  const deleteClientBtn = getBtn(
    "Удалить клиента",
    "delete-client-btn",
    `delete-client-${client.id}`
  );
  deleteClientBtn.addEventListener("click", () => {
    confirmDeleteClient(client.id);
    modalContent.classList.add("d-none");
  });

  buttonContainer.appendChild(deleteClientBtn);
}

// Сотрировка списка
clientsTableData.forEach((elem) => {
  elem.addEventListener("click", function () {
    if (this.dataset.column) {
      column = this.dataset.column;
      columnDir = !columnDir;
      render();
    }
  });
});

// Функция сортировки
function getSortClients(prop, dir) {
  return clientsArr.sort((clientA, clientB) => {
    let propA = clientA[prop],
      propB = clientB[prop];
    if (prop === "fio") {
      propA = getFio(clientA.surname, clientA.name, clientA.lastname);
      propB = getFio(clientB.surname, clientB.name, clientB.lastname);
    }
    return (!dir ? propA < propB : propA > propB) ? -1 : 1;
  });
}

// Функция обновления иконок сортировки и указателей
function updateSortIcons() {
  clientsTableData.forEach((th) => {
    const icon = th.querySelector(".sort-icon");
    const order = th.querySelector(".sort-order");

    if (th.dataset.column === column) {
      th.classList.add("sorted");
      icon.classList.toggle("asc", columnDir);
      icon.classList.toggle("desc", !columnDir);
      if (order && th.dataset.column === "fio") {
        order.textContent = columnDir ? "А-Я" : "Я-А";
      }
    } else {
      th.classList.remove("sorted");
    }
  });
}

// Фильтрация
let debounceTimer;

searchInput.addEventListener("input", (event) => {
  clearTimeout(debounceTimer); // Сбросить предыдущий таймер

  debounceTimer = setTimeout(async () => {
    const query = event.target.value.trim();

    if (query) {
      try {
        clientsArr = await serverSearchClients(query);
      } catch (error) {
        console.error("Ошибка при поиске клиентов:", error);
      }
    } else {
      clientsArr = await serverGetClients();
    }

    render();
  }, 300); // Устанавливаем задержку в 300 мс
});

function showLoaderInButton(button, className = "", preloader) {
  // Сохраняем оригинальное содержимое кнопки для возможности восстановления
  button.setAttribute("data-original", button.innerHTML);
  // Устанавливаем прелоадер как содержимое кнопки
  button.innerHTML = preloader;
  if (className != "") {
    button.classList.add(className);
  }
}

function restoreButtonContent(button, className = "") {
  // Восстанавливаем оригинальное содержимое кнопки
  const originalContent = button.getAttribute("data-original");
  if (originalContent) {
    button.innerHTML = originalContent;
    button.classList.remove(className);
  }
}

// Функция отрисовки таблицы
function render() {
  clientsTable.innerHTML = "";
  clientsArr = getSortClients(column, columnDir);

  clientsArr.forEach((client) => {
    const clientTR = document.createElement("tr");
    clientTR.innerHTML = `
      <td class="client-id light-text">${client.id}</td>
      <td class="client-fio text">${getFio(
        client.surname,
        client.name,
        client.lastName
      )}</td>
      <td class="client-create-time text">${formatDateTime(
        client.createdAt
      )}</td>
      <td class="client-update-time text">${formatDateTime(
        client.updatedAt
      )}</td>
      <td class="client-contacts">${getContacts(client.contacts)}</td>
    `;

    const editBtn = getBtn(
      `${
        getImage("./img/edit.svg", "Изменить", "edit-img").outerHTML
      } Изменить`,
      "editBtn",
      `edit-${client.id}`
    );

    editBtn.addEventListener("click", async () => {
      // Показывает спинер в кнопке
      showLoaderInButton(
        editBtn,
        "activeEditBtn",
        `${
          getImage("./img/spiner.svg", "Изменить", "spin-edit-img").outerHTML
        } Изменить`
      );

      try {
        await openEditClientForm(client.id);
      } catch (error) {
        error.push("Ошибка при редактировании клиента:", error);
      } finally {
        restoreButtonContent(editBtn, "activeEditBtn");
      }
    });

    const deleteBtn = getBtn(
      `${
        getImage("./img/delete-icon.svg", "Удалить", "delete-img").outerHTML
      } Удалить`,
      "deleteBtn",
      `delete-${client.id}`
    );

    deleteBtn.addEventListener("click", () => {
      showLoaderInButton(
        deleteBtn,
        "activeDeleteBtn",
        `${
          getImage("./img/delete-spiner.svg", "Спинер", "spin-delete-img")
            .outerHTML
        } Удалить`
      );
      confirmDeleteClient(client.id);
      document
        .getElementById("confirm-delete-btn")
        .addEventListener("click", () =>
          restoreButtonContent(deleteBtn, "activeDeleteBtn")
        );
      closeBtn.addEventListener("click", () =>
        restoreButtonContent(deleteBtn, "activeDeleteBtn")
      );
      document
        .getElementById("cancelBtn")
        .addEventListener("click", () =>
          restoreButtonContent(deleteBtn, "activeDeleteBtn")
        );
      modalContainer.addEventListener("click", () =>
        restoreButtonContent(deleteBtn, "activeDeleteBtn")
      );
    });

    const btnTd = document.createElement("td");
    btnTd.append(editBtn, deleteBtn);

    clientTR.appendChild(btnTd);

    clientsTable.appendChild(clientTR);
  });

  tippy("#tippy-contact", {
    allowHTML: true,
    interactive: true,
  });

  updateSortIcons();

  modalContainer.addEventListener("click", (event) => {
    if (event.target === modalContainer) {
      resetModal();
    }
  });
}

render();
