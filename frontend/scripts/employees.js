// /ShipNGo-frontend/scripts/employees.js

document.addEventListener("DOMContentLoaded", () => {
  // 1) Populate all location selects (filter + modals)
  loadLocationOptions();
  loadManagerOptions();

  // 2) Wire up filters
  document.getElementById("role-filter")
    .addEventListener("input", debounce(loadEmployees, 500));
  document.getElementById("location-selector")
    .addEventListener("change", loadEmployees);

  // 3) Show Add modal
  document.getElementById("add-new-employee-btn")
    .addEventListener("click", () => {
      document.getElementById("add-employee-modal").classList.remove("hidden");
    });

  // 4) Close modals
  ["close-edit-modal", "cancel-edit-employee"].forEach(id =>
    document.getElementById(id)
      .addEventListener("click", () =>
        document.getElementById("edit-employee-modal").classList.add("hidden")
      )
  );
  ["close-add-modal", "cancel-add-employee"].forEach(id =>
    document.getElementById(id)
      .addEventListener("click", () =>
        document.getElementById("add-employee-modal").classList.add("hidden")
      )
  );

  // 5) Save actions
  document.getElementById("save-edit-employee")
    .addEventListener("click", saveEditedEmployee);
  document.getElementById("save-add-employee")
    .addEventListener("click", saveNewEmployee);

  // 6) Initial fetch
  loadEmployees();
});

function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

// Populate location dropdowns: filter + add/edit
async function loadLocationOptions() {
  try {
    const res = await fetch("/api/locations", { credentials: "include" });
    if (!res.ok) throw new Error(res.status);
    // handle raw-array or wrapped { success, data }
    const payload = await res.json();
    const locations = Array.isArray(payload)
      ? payload
      : (payload.success ? payload.data : []);
    if (!Array.isArray(locations)) throw new Error("Bad locations format");

    // Filter dropdown
    const selector = document.getElementById("location-selector");
    selector.innerHTML = "<option value=\"\">All Locations</option>";
    locations.forEach(loc => {
      if (loc.location_id === 10) return;
      const o = document.createElement("option");
      o.value = loc.location_id;
      o.textContent = `${loc.location_name} (${loc.location_type})`;
      selector.appendChild(o);
    });

    // Add/Edit modals
    ["add-location-dropdown", "edit-location-dropdown"].forEach(id => {
      const dd = document.getElementById(id);
      dd.innerHTML = "<option value=\"\">-- Select Location --</option>";
      locations.forEach(loc => {
        if (loc.location_id === 10) return;
        const o = document.createElement("option");
        o.value = loc.location_id;
        o.textContent = `${loc.location_name} (${loc.location_type})`;
        dd.appendChild(o);
      });
    });

  } catch (err) {
    console.error("Could not load locations:", err);
  }
}

async function loadManagerOptions() {
  try {
    const res = await fetch("/api/employees?role=manager", { credentials: "include" });
    if (!res.ok) throw new Error(res.status);
    const { success, data: managers, message } = await res.json();
    if (!success) throw new Error(message);

    ["add-manager-dropdown", "edit-manager-dropdown"].forEach(id => {
      const dd = document.getElementById(id);
      dd.innerHTML = "<option value=''>-- Select Manager --</option>";
      managers.forEach(m => {
        const o = document.createElement("option");
        o.value = m.employee_id;
        o.textContent = m.name;
        dd.appendChild(o);
      });
    });
  } catch (err) {
    console.error("Could not load managers:", err);
  }
}

async function loadEmployees() {
  const params = new URLSearchParams({
    role:     document.getElementById("role-filter").value,
    location: document.getElementById("location-selector").value
  });

  try {
    const res = await fetch(`/api/employees?${params}`, {
      credentials: "include"
    });
    const { success, data: emps, message } = await res.json();
    if (!success) throw new Error(message);

    updateStats(emps);
    populateTable(emps);

  } catch (err) {
    console.error("Error loading employees:", err);
  }
}

function updateStats(emps) {
  const total    = emps.length;
  const managers = emps.filter(e => e.employee_role == "manager").length;

  document.getElementById("total-employees-count").textContent = total;
  document.getElementById("managers-count").textContent        = managers;
}

function populateTable(emps) {
  const tbl = document.getElementById("employee-table");
  tbl.innerHTML = "";

  if (!emps.length) {
    tbl.innerHTML = "<tr><td colspan='11'>No employees found.</td></tr>";
    return;
  }

  emps.forEach(e => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${e.employee_id}</td>
      <td>${e.name}</td>
      <td>${e.address}</td>
      <td>${e.phone}</td>
      <td>${e.email}</td>
      <td>${e.ssn}</td>
      <td>${e.username}</td>
      <td>${e.employee_role}</td>
      <td>${e.manager_id ?? '—'}</td>
      <td>${e.location_name || e.employment_location}</td>
      <td>
        <button onclick="editEmployee(${e.employee_id})">Edit</button>
        <button onclick="deleteEmployee(${e.employee_id})">Delete</button>
      </td>`;
    tbl.appendChild(row);
  });
}

async function editEmployee(id) {
  try {
    const res = await fetch(`/api/employees/${id}`, { credentials: "include" });
    const { success, data: e, message } = await res.json();
    if (!success) throw new Error(message);

    document.getElementById("edit-employee-id").textContent   = e.employee_id;
    document.getElementById("edit-name").value              = e.name || "";
    document.getElementById("edit-address").value           = e.address || "";
    document.getElementById("edit-phone").value             = e.phone || "";
    document.getElementById("edit-email").value             = e.email || "";
    document.getElementById("edit-ssn").value               = e.ssn || "";
    document.getElementById("edit-username").value          = e.username || "";
    document.getElementById("edit-password").value          = "";
    document.getElementById("edit-role").value              = e.employee_role || "";
    document.getElementById("edit-manager-id").value        = e.manager_id ?? "";
    document.getElementById("edit-location-dropdown").value = e.employment_location || "";

    document.getElementById("edit-employee-modal")
      .classList.remove("hidden");
  } catch (err) {
    console.error("Error fetching employee:", err);
    alert("Could not load employee");
  }
}

async function saveEditedEmployee() {
  const id = document.getElementById("edit-employee-id").textContent;
  const body = {
    name:                document.getElementById("edit-name").value,
    address:             document.getElementById("edit-address").value,
    phone:               document.getElementById("edit-phone").value,
    email:               document.getElementById("edit-email").value,
    ssn:                 document.getElementById("edit-ssn").value,
    username:            document.getElementById("edit-username").value,
    password:            document.getElementById("edit-password").value,
    employee_role:       document.getElementById("edit-role").value,
    manager_id:          document.getElementById("edit-manager-id").value || null,
    employment_location: document.getElementById("edit-location-dropdown").value
  };

  try {
    const res = await fetch(`/api/employees/${id}`, {
      method:      "PUT",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify(body)
    });
    const { success, message } = await res.json();
    if (!success) throw new Error(message);

    document.getElementById("edit-employee-modal").classList.add("hidden");
    loadEmployees();
  } catch (err) {
    console.error("Update failed:", err);
    alert("Update failed: " + err.message);
  }
}

async function saveNewEmployee() {
  const body = {
    name:                document.getElementById("add-name").value,
    address:             document.getElementById("add-address").value,
    phone:               document.getElementById("add-phone").value,
    email:               document.getElementById("add-email").value,
    ssn:                 document.getElementById("add-ssn").value,
    username:            document.getElementById("add-username").value,
    password:            document.getElementById("add-password").value,
    employee_role:       document.getElementById("add-role").value,
    manager_id:          document.getElementById("add-manager-id").value || null,
    employment_location: document.getElementById("add-location-dropdown").value
  };

  try {
    const res = await fetch(`/api/employees`, {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify(body)
    });
    const { success, message } = await res.json();
    if (!success) throw new Error(message);

    document.getElementById("add-employee-modal").classList.add("hidden");
    loadEmployees();
  } catch (err) {
    console.error("Add failed:", err);
    alert("Add failed: " + err.message);
  }
}

async function deleteEmployee(id) {
  if (!confirm("Delete this employee?")) return;
  try {
    const res = await fetch(`/api/employees/${id}`, {
      method:      "DELETE",
      credentials: "include"
    });
    const { success, message } = await res.json();
    if (!success) throw new Error(message);
    loadEmployees();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Delete failed: " + err.message);
  }
}
