const API_BASE_URL = "http://127.0.0.1:5000";

const adminUser = {
  name: "Alex Carter",
  role: "Administrator",
  initials: "AC"
};

function setAdminUser() {
  document.querySelectorAll(".admin-name").forEach(el => el.textContent = adminUser.name);
  document.querySelectorAll(".admin-role").forEach(el => el.textContent = adminUser.role);
  document.querySelectorAll(".avatar").forEach(el => el.textContent = adminUser.initials);
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) sidebar.classList.toggle("show");
}

function formatUSD(amount) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2
  })}`;
}

function showAlert(message) {
  let alertBox = document.querySelector(".alert-box");

  if (!alertBox) {
    alertBox = document.createElement("div");
    alertBox.className = "alert-box";
    document.body.appendChild(alertBox);
  }

  alertBox.textContent = message;
  alertBox.style.display = "block";

  setTimeout(() => {
    alertBox.style.display = "none";
  }, 3000);
}

function badgeClass(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("completed")) return "badge-completed";
  if (value.includes("paid")) return "badge-paid";
  if (value.includes("active")) return "badge-active";
  if (value.includes("pending")) return "badge-pending";
  if (value.includes("progress")) return "badge-progress";
  if (value.includes("partial")) return "badge-partial";
  if (value.includes("cancelled")) return "badge-cancelled";

  return "badge-pending";
}

async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`GET Error: ${endpoint}`);
  }

  return await response.json();
}

async function apiPost(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`POST Error: ${endpoint}`);
  }

  return await response.json();
}

/* DASHBOARD */

async function loadDashboardStats() {
  try {
    const stats = await apiGet("/api/dashboard/stats");

    const totalClients = document.getElementById("totalClients");
    const totalProjects = document.getElementById("totalProjects");
    const totalTasks = document.getElementById("totalTasks");
    const totalRevenue = document.getElementById("totalRevenue");

    if (totalClients) totalClients.textContent = stats.total_clients || stats.clients || 0;
    if (totalProjects) totalProjects.textContent = stats.total_projects || stats.projects || 0;
    if (totalTasks) totalTasks.textContent = stats.total_tasks || stats.tasks || 0;
    if (totalRevenue) totalRevenue.textContent = formatUSD(stats.total_revenue || stats.revenue || 0);

  } catch (error) {
    console.error("Dashboard API Error:", error);
  }
}

/* CLIENTS */

async function loadClientsFromAPI() {
  try {
    const data = await apiGet("/api/clients");
    renderClients(data);
  } catch (error) {
    console.error("Clients API Error:", error);
    showAlert("Failed to load clients.");
  }
}

function renderClients(clients) {
  const tbody = document.getElementById("clientsTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!clients || clients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No clients found.</td>
      </tr>
    `;
    return;
  }

  clients.forEach(client => {

    const clientName =
      client.name ||
      client.client_name ||
      client.full_name ||
      "No Name";

    const companyName =
      client.company ||
      client.company_name ||
      "No Company";

    tbody.innerHTML += `
      <tr>
        <td>
          <strong>${clientName}</strong>
        </td>

        <td>
          ${client.email || "No Email"}
        </td>

        <td>
          ${companyName}
        </td>

        <td>
          <span class="badge-pill badge-active">
            Active
          </span>
        </td>

        <td>

          <button
            class="action-btn"
            onclick="viewDetails('${clientName}')"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button class="action-btn">
            <i class="bi bi-pencil"></i>
          </button>

          <button class="action-btn">
            <i class="bi bi-trash"></i>
          </button>

        </td>
      </tr>
    `;
  });
}

async function connectClientForm() {
  const form = document.getElementById("clientForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const formData = {
      client_name: document.getElementById("clientName")?.value || "",
      name: document.getElementById("clientName")?.value || "",

      email: document.getElementById("clientEmail")?.value || "",

      phone: document.getElementById("clientPhone")?.value || "",

      company_name: document.getElementById("clientCompany")?.value || "",
      company: document.getElementById("clientCompany")?.value || "",

      address: document.getElementById("clientAddress")?.value || ""
    };

    try {
      await apiPost("/api/clients", formData);

      showAlert("Client added successfully.");

      form.reset();
      form.classList.remove("was-validated");

      const modalElement = document.getElementById("clientModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();

      loadClientsFromAPI();
      loadDashboardStats();

    } catch (error) {
      console.error("Add Client Error:", error);
      showAlert("Failed to add client.");
    }
  });
}

/* PROJECTS */

async function loadProjectsFromAPI() {
  try {
    const data = await apiGet("/api/projects");
    renderProjects(data);
  } catch (error) {
    console.error("Projects API Error:", error);
  }
}

function renderProjects(projects) {
  const tbody = document.getElementById("projectsTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!projects || projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No projects found.</td></tr>`;
    return;
  }

  projects.forEach(project => {
    const projectName = project.project_name || project.name || project.title || "No Project";
    const clientName = project.client_name || project.client || "No Client";

    tbody.innerHTML += `
      <tr>
        <td><strong>${projectName}</strong></td>
        <td>${clientName}</td>
        <td>${formatUSD(project.budget)}</td>
        <td>${project.start_date || project.deadline || "N/A"}</td>
        <td><span class="badge-pill ${badgeClass(project.status || "In Progress")}">${project.status || "In Progress"}</span></td>
        <td><span class="badge-pill badge-pending">${project.priority || "Medium"}</span></td>
        <td>
          <button class="action-btn" onclick="viewDetails('${projectName}')">
            <i class="bi bi-eye"></i>
          </button>
          <button class="action-btn"><i class="bi bi-pencil"></i></button>
          <button class="action-btn"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

async function loadClientsDropdown() {
  try {
    const clients = await apiGet("/api/clients");
    const dropdown = document.getElementById("projectClient");

    if (!dropdown) return;

    dropdown.innerHTML = `<option value="">Select Client</option>`;

    clients.forEach(client => {
      dropdown.innerHTML += `
        <option value="${client.id || client.client_id}">
          ${client.name || client.client_name || client.full_name}
        </option>
      `;
    });

  } catch (error) {
    console.error("Dropdown API Error:", error);
  }
}

async function connectProjectForm() {
  const form = document.getElementById("projectForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const formData = {
      project_name: document.getElementById("projectName")?.value || "",
      client_id: document.getElementById("projectClient")?.value || "",
      start_date: document.getElementById("projectStartDate")?.value || "",
      budget: document.getElementById("projectBudget")?.value || "",
      description: document.getElementById("projectDescription")?.value || ""
    };

    try {
      await apiPost("/api/projects", formData);

      showAlert("Project added successfully.");

      form.reset();
      form.classList.remove("was-validated");

      const modalElement = document.getElementById("projectModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();

      loadProjectsFromAPI();
      loadDashboardStats();

    } catch (error) {
      console.error("Add Project Error:", error);
      showAlert("Failed to add project.");
    }
  });
}

/* EMPLOYEES */

async function loadEmployeesFromAPI() {
  try {
    const data = await apiGet("/api/employees");
    renderEmployees(data);
  } catch (error) {
    console.error("Employees API Error:", error);
  }
}

function renderEmployees(employees) {
  const tbody = document.getElementById("employeesTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!employees || employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No employees found.</td></tr>`;
    return;
  }

  employees.forEach(employee => {
    const employeeName = employee.employee_name || employee.name || "No Name";

    tbody.innerHTML += `
      <tr>
        <td><strong>${employeeName}</strong></td>
        <td>${employee.email || "No Email"}</td>
        <td>${employee.role || "Team Member"}</td>
        <td>${employee.tasks || employee.task_count || 0}</td>
        <td><span class="badge-pill badge-active">Active</span></td>
        <td>
          <button class="action-btn" onclick="viewDetails('${employeeName}')">
            <i class="bi bi-eye"></i>
          </button>
          <button class="action-btn"><i class="bi bi-pencil"></i></button>
          <button class="action-btn"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `;
  });

  const employeeCount = document.getElementById("employeeCount");
  if (employeeCount) employeeCount.textContent = employees.length;
}

/* TASKS */

async function loadTasksFromAPI() {
  try {
    const data = await apiGet("/api/tasks");
    renderTasks(data);
  } catch (error) {
    console.error("Tasks API Error:", error);
  }
}

function renderTasks(tasks) {
  const tbody = document.getElementById("tasksTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No tasks found.</td></tr>`;
    return;
  }

  tasks.forEach(task => {
    const taskName = task.task_name || task.title || task.name || "No Task";
    const projectName = task.project_name || task.project || "No Project";
    const employeeName = task.employee_name || task.employee || "Unassigned";

    tbody.innerHTML += `
      <tr>
        <td><strong>${taskName}</strong></td>
        <td>${projectName}</td>
        <td>${employeeName}</td>
        <td><span class="badge-pill ${badgeClass(task.status || "Pending")}">${task.status || "Pending"}</span></td>
        <td><span class="badge-pill badge-progress">${task.priority || "Medium"}</span></td>
        <td>${task.due_date || task.deadline || "N/A"}</td>
        <td>
          <button class="action-btn" onclick="viewDetails('${taskName}')">
            <i class="bi bi-eye"></i>
          </button>
          <button class="action-btn"><i class="bi bi-pencil"></i></button>
          <button class="action-btn"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

/* SEARCH */

function searchTable(inputId, tableId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll(`#${tableId} tr`);

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
}

/* VIEW */

function viewDetails(name) {
  showAlert(`Viewing details for ${name}`);
}

/* INIT */

document.addEventListener("DOMContentLoaded", function () {
  setAdminUser();

  loadDashboardStats();
  loadClientsFromAPI();
  loadProjectsFromAPI();
  loadEmployeesFromAPI();
  loadTasksFromAPI();
  loadClientsDropdown();

  connectClientForm();
  connectProjectForm();

  const mobileToggle = document.getElementById("mobileToggle");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", toggleSidebar);
  }
});