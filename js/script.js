"use strict";

const STORAGE_KEYS = {
    tasks: "lifeDashboardTasks",
    links: "lifeDashboardLinks",
    name: "lifeDashboardName",
    theme: "lifeDashboardTheme"
};

const clockElement = document.getElementById("clock");
const dateElement = document.getElementById("date");
const greetingElement = document.getElementById("greeting");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

const timerElement = document.getElementById("timer");
const timerRing = document.querySelector(".timer-ring");
const startTimerButton = document.getElementById("start-timer");
const stopTimerButton = document.getElementById("stop-timer");
const resetTimerButton = document.getElementById("reset-timer");

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const taskMessage = document.getElementById("task-message");
const emptyTasks = document.getElementById("empty-tasks");

const linkForm = document.getElementById("link-form");
const linkNameInput = document.getElementById("link-name");
const linkUrlInput = document.getElementById("link-url");
const linkList = document.getElementById("link-list");
const linkCount = document.getElementById("link-count");
const linkMessage = document.getElementById("link-message");
const emptyLinks = document.getElementById("empty-links");

const editNameButton = document.getElementById("edit-name");
const nameModal = document.getElementById("name-modal");
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("name-input");
const cancelNameButton = document.getElementById("cancel-name");

let tasks = readStorage(STORAGE_KEYS.tasks, []);
let links = readStorage(STORAGE_KEYS.links, []);

const TIMER_DURATION = 25 * 60;
let timerSeconds = TIMER_DURATION;
let timerInterval = null;

function readStorage(key, fallbackValue) {
    try {
        const savedValue = localStorage.getItem(key);
        return savedValue ? JSON.parse(savedValue) : fallbackValue;
    } catch (error) {
        console.error(`Unable to read ${key} from Local Storage.`, error);
        return fallbackValue;
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function updateDateTime() {
    const now = new Date();

    clockElement.textContent = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    dateElement.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    updateGreeting(now.getHours());
}

function updateGreeting(hour) {
    let greeting = "Good evening";

    if (hour >= 5 && hour < 12) {
        greeting = "Good morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon";
    }

    const savedName = localStorage.getItem(STORAGE_KEYS.name);
    greetingElement.textContent = savedName ? `${greeting}, ${savedName}` : greeting;
    editNameButton.textContent = savedName ? "Change your name" : "Set your name";
}

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    themeIcon.textContent = isDark ? "☀" : "☾";
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
    applyTheme(nextTheme);
});

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const progressPercentage =
        (timerSeconds / TIMER_DURATION) * 100;

    timerRing.style.setProperty(
        "--timer-progress",
        `${progressPercentage}%`
    );
}

function startTimer() {
    if (timerInterval !== null) {
        return;
    }

    timerInterval = window.setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds -= 1;
            updateTimerDisplay();
            return;
        }

        stopTimer();
        window.alert("Focus session complete. Great work!");
    }, 1000);
}

function stopTimer() {
    window.clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    stopTimer();
    timerSeconds = TIMER_DURATION;
    updateTimerDisplay();
}

startTimerButton.addEventListener("click", startTimer);
stopTimerButton.addEventListener("click", stopTimer);
resetTimerButton.addEventListener("click", resetTimer);

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task) => {
        const item = document.createElement("li");
        item.className = `task-item${task.completed ? " completed" : ""}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "not completed" : "completed"}`);
        checkbox.addEventListener("change", () => toggleTask(task.id));

        const title = document.createElement("p");
        title.className = "task-title";
        title.textContent = task.title;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.className = "small-button";
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editTask(task.id));

        const deleteButton = document.createElement("button");
        deleteButton.className = "small-button delete-button";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteTask(task.id));

        actions.append(editButton, deleteButton);
        item.append(checkbox, title, actions);
        taskList.appendChild(item);
    });

    taskCount.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
    emptyTasks.hidden = tasks.length > 0;
}

function saveTasks() {
    writeStorage(STORAGE_KEYS.tasks, tasks);
    renderTasks();
}

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = taskInput.value.trim();
    taskMessage.textContent = "";

    const duplicateExists = tasks.some((task) => task.title.toLowerCase() === title.toLowerCase());

    if (duplicateExists) {
        taskMessage.textContent = "That task already exists.";
        return;
    }

    tasks.push({
        id: Date.now(),
        title,
        completed: false
    });

    saveTasks();
    taskForm.reset();
    taskInput.focus();
});

function toggleTask(id) {
    tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
    saveTasks();
}

function editTask(id) {
    const task = tasks.find((item) => item.id === id);
    const newTitle = window.prompt("Edit your task:", task.title);

    if (newTitle === null) {
        return;
    }

    const cleanTitle = newTitle.trim();
    if (!cleanTitle) {
        taskMessage.textContent = "A task cannot be empty.";
        return;
    }

    const duplicateExists = tasks.some((item) => item.id !== id && item.title.toLowerCase() === cleanTitle.toLowerCase());
    if (duplicateExists) {
        taskMessage.textContent = "That task already exists.";
        return;
    }

    task.title = cleanTitle;
    taskMessage.textContent = "";
    saveTasks();
}

function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
}

function normalizeUrl(value) {
    const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(url).href;
}

function renderLinks() {
    linkList.innerHTML = "";

    links.forEach((link) => {
        const item = document.createElement("div");
        item.className = "quick-link";

        const icon = document.createElement("span");
        icon.className = "link-icon";
        icon.textContent = link.name.charAt(0);

        const anchor = document.createElement("a");
        anchor.href = link.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = link.name;
        anchor.title = link.url;

        const deleteButton = document.createElement("button");
        deleteButton.className = "small-button delete-button";
        deleteButton.type = "button";
        deleteButton.textContent = "Remove";
        deleteButton.addEventListener("click", () => deleteLink(link.id));

        item.append(icon, anchor, deleteButton);
        linkList.appendChild(item);
    });

    linkCount.textContent = `${links.length} ${links.length === 1 ? "link" : "links"}`;
    emptyLinks.hidden = links.length > 0;
}

function saveLinks() {
    writeStorage(STORAGE_KEYS.links, links);
    renderLinks();
}

linkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = linkNameInput.value.trim();
    linkMessage.textContent = "";

    try {
        const url = normalizeUrl(linkUrlInput.value.trim());
        links.push({ id: Date.now(), name, url });
        saveLinks();
        linkForm.reset();
        linkNameInput.focus();
    } catch (error) {
        linkMessage.textContent = "Please enter a valid website address.";
    }
});

function deleteLink(id) {
    links = links.filter((link) => link.id !== id);
    saveLinks();
}

function openNameModal() {
    nameInput.value = localStorage.getItem(STORAGE_KEYS.name) || "";
    nameModal.hidden = false;
    window.setTimeout(() => nameInput.focus(), 0);
}

function closeNameModal() {
    nameModal.hidden = true;
}

editNameButton.addEventListener("click", openNameModal);
cancelNameButton.addEventListener("click", closeNameModal);

nameModal.addEventListener("click", (event) => {
    if (event.target === nameModal) {
        closeNameModal();
    }
});

nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem(STORAGE_KEYS.name, nameInput.value.trim());
    closeNameModal();
    updateDateTime();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !nameModal.hidden) {
        closeNameModal();
    }
});

applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || "light");
updateDateTime();
updateTimerDisplay();
renderTasks();
renderLinks();
window.setInterval(updateDateTime, 1000);
