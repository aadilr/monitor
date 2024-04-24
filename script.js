document.addEventListener("DOMContentLoaded", function(event) {
    // Initialize the chart and gauge only after the DOM has fully loaded
    const chartContext = document.getElementById('dataChart').getContext('2d');
    let lineChart, gauge;

    function createLineChart(data) {
        lineChart = new Chart(chartContext, {
            type: 'line',
            data: {
                labels: data.map(entry => new Date(entry.timestamp).toLocaleTimeString()),
                datasets: [{
                    label: 'Hourly Rate',
                    data: data.map(entry => entry.hourly_rate),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    function createGauge() {
        gauge = new RadialGauge({
            renderTo: 'gauge',
            width: 400,
            height: 400,
            units: "texts/hr",
            minValue: 0,
            maxValue: 1000000, // Set the maximum value based on your data
            majorTicks: ["0", "200k", "400k", "600k", "800k", "1m"],
            minorTicks: 5,
            strokeTicks: true,
            highlights: [
                { from: 0, to: 330000, color: 'rgba(0,255,0,.15)' },
                { from: 330000, to: 660000, color: 'rgba(255,255,0,.15)' },
                { from: 660000, to: 1000000, color: 'rgba(255,30,0,.25)' },
            ],
            colorPlate: "#fff",
            borderShadowWidth: 0,
            borders: false,
            needleType: "arrow",
            needleWidth: 3,
            needleCircleSize: 7,
            needleCircleOuter: true,
            needleCircleInner: false,
            animationDuration: 1500,
            animationRule: "linear",
            valueBox: false,
            fontNumbers: 'Arial',
            fontTitle: 'Arial',
            fontValue: 'Led',
            animatedValue: true
        }).draw();
    }

    function fetchDataAndUpdateUI() {
        axios.get('/data')
            .then(response => {
                const data = response.data;
                const lastRate = data[data.length - 1].hourly_rate;

                if (!lineChart) {
                    createLineChart(data);
                } else {
                    lineChart.data.labels = data.map(entry => new Date(entry.timestamp).toLocaleTimeString());
                    lineChart.data.datasets[0].data = data.map(entry => entry.hourly_rate);
                    lineChart.update();
                }

                if (!gauge) {
                    createGauge();
                }

                // Update the gauge with the latest rate
                gauge.value = lastRate;

                // Update the 'Current Speed' display
                updateCurrentSpeedDisplay(lastRate);

              const tableBody = document.querySelector('#data-table tbody');
              tableBody.innerHTML = data.map(entry => `
                  <tr>
                      <td>${new Date(entry.timestamp).toLocaleTimeString()}</td>
                      <td>${entry.text_count.toLocaleString()}</td>
                      <td>${entry.rate_per_minute.toFixed(2)}</td>
                      <td>${entry.hourly_rate.toLocaleString()}</td>
                      <td>${entry.good_to_mine ? 'Yes' : 'No'}</td>
                  </tr>
              `).join('');
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    function updateCurrentSpeedDisplay(rate) {
      const currentSpeedDisplay = document.getElementById('latest-rate');
      currentSpeedDisplay.textContent = `${rate.toFixed(2)} texts/hr`;

      // Grow the current speed display for emphasis
      currentSpeedDisplay.classList.add('updated');
      setTimeout(() => {
          currentSpeedDisplay.classList.remove('updated');
      }, 600);
  }

    fetchDataAndUpdateUI(); // Initial fetch
    setInterval(fetchDataAndUpdateUI, 300000); // Set up the interval for auto-updating the UI
});
