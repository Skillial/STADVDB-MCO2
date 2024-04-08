function displaySearchResults(data) {
    const table = $('#table').DataTable();
    table.clear().draw();

    if (data.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = table.getElementsByTagName("thead")[0].getElementsByTagName("th").length;
        cell.textContent = "No results found.";
        return;
    }

    data.forEach(rowData => {
        const values = Object.values(rowData);
        values.push('<a href="#" class="bi bi-pencil-square"></a>', '<a href="#" class="bi bi-trash-fill"></a>');
        table.row.add(values).draw();
    });
}

document.getElementById("searchAppID").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent form submission
    const appointmentId = {
        appointmentId: document.getElementById("appointmentId").value
    };

    await fetch("/searchAppID", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(appointmentId)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        displaySearchResults(data);
    })
    .catch(error => {
        console.error("Error:", error);
        // Optionally, display an error message to the user
    });
});

document.getElementById("searchFilter").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent form submission
    const fitler = {
        status: document.getElementById("Status").value,
        type: document.getElementById("Type").value,
        Virtual: document.getElementById("Virtual").value,
        IsHospital: document.getElementById("Hospital").value,
        City: document.getElementById("City").value,
        Province: document.getElementById("Province").value,
        RegionName: document.getElementById("Region").value,
        MainSpecialty: document.getElementById("Specialty").value
    }; 

    await fetch("/searchFilter", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(fitler)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        displaySearchResults(data);
    })
    .catch(error => {
        console.error("Error:", error);
        // Optionally, display an error message to the user
    });
});