

document.getElementById('editData').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const id = document.getElementById('apptid').value;
    const formData = {
        id: document.getElementById('apptid').value,
        startHour: document.getElementById("startHour").value,
        Status: document.getElementById("Status").value,
        Type: document.getElementById("Type").value,
        Virtual: document.getElementById("Virtual").value,
        Hospital: document.getElementById("Hospital").value,
        City: document.getElementById("City").value,
        Province: document.getElementById("Province").value,
        Region: document.getElementById("Region").value,
        Specialty: document.getElementById("Specialty").value,
        Age: document.getElementById("Age").value
    };

    await fetch('/updateRecord', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update row');
        }
        return response.json();
    })
    .then(data => {
        console.log('Row updated successfully:', data);
        alert('Row updated successfully');
        window.location.href = `/editRecord/${id}`;
    })
    .catch(error => {
        // Handle error response
        console.error('Failed to update row:', error);
        // Display error message to the user
        // Example: document.getElementById('errorMessage').textContent = 'Failed to update row. Please try again.';
    });
});