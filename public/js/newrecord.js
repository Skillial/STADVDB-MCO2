function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

document.getElementById("insertData").addEventListener("submit", async function(event) {
    event.preventDefault();
    const formData = {
        id: generateRandomString(32),
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

    await fetch("/insertRecord", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        document.getElementById("insertData").reset();
    })
    .catch(error => {
        console.error("Error:", error);
        // Optionally, handle error and show a user-friendly message
        alert("An error occurred while processing your request. Please try again later.");
    });
});
