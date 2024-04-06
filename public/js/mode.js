document.getElementById('Mode').addEventListener('click', async function() {
    try {
        const response = await fetch('/mode');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
