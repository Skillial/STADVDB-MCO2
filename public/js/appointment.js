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
        const apptid = rowData.apptid;
        const RegionName = rowData.RegionName;
        values.push(`<a href="#" class="bi bi-pencil-square" onclick="editRow(this, '${apptid}', '${RegionName}')"></a>`, `<a href="#" class="bi bi-trash-fill" onclick="deleteRow(this, '${apptid}', '${RegionName}')"></a>`);
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

async function deleteRow(link, apptid, RegionName) {
    const id = apptid;
    
    if (confirm('Are you sure you want to delete this row?')) {
        await fetch(`/deleteRow/${id}/${RegionName}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 501) {
                    alert('Row not found. Please refresh the page.');
                    window.location.href = `/appointment`;
                    return;
                }
                throw new Error('Failed to delete row. Server returned ' + response.status + ': ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            // Remove the row from the table
            const row = link.closest('tr');
            row.remove();
            // Reload the table data
            const table = $('#table').DataTable();
            const info = table.page.info();
            const start = info.start + 1;
            const rowCount = info.recordsTotal;
            const end = Math.min(start + info.length - 1, rowCount);
            $('#table_info').text(`Showing ${start} to ${end} of ${rowCount} entries`);
            if (rowCount === 0) {
                $('#table tbody').html('<tr><td colspan="' + table.columns().count() + '" class="text-center">No data available in table</td></tr>');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    }
}

async function editRow(link, apptid, RegionName) {
    const id = apptid;
    if (confirm('Are you sure you want to edit this row?')) {
        window.location.href = `/editRecord/${id}/${RegionName}`;
    }
    
}