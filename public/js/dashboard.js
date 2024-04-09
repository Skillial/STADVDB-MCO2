document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('myChart').getContext('2d');
    let myChart;

    async function fetchData(region) {
        await fetch(`/fetchData/${region}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateChart(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function updateChart(data) {
        console.log(data);
        if (myChart && typeof myChart == 'object') {
            if (typeof myChart.destroy == 'function') {
                myChart.destroy();
            }
        }
    
        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Doctor Count',
                    data: data.values,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
    }

    document.getElementById('Region').addEventListener('change', function () {
        const selectedRegion = this.value;
        fetchData(selectedRegion);
    });
});