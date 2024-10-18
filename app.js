const apiKey = "1062dac0c3e4e655042b945ecea54556"; // OpenWeatherMap API key
const openCageApiKey = "8da611da931e478a8b4f7b81825de08a"; // OpenCage API key
let temperatureBarChart, weatherDoughnutChart, temperatureLineChart;
let timeUpdateInterval;
document.addEventListener("DOMContentLoaded", () => {
  // Automatically get geolocation weather on page load
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    alert("Geolocation is not supported by this browser. Please enter a city manually.");
  }
document.querySelectorAll('input[name="tempUnit"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateTemperature(radio.value);
    });
  });
  // Handle when the "Get Weather" button is clicked
  document.getElementById("getWeatherBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) {
      getWeather(city);
      getForecast(city);
    } else {
      alert("Please enter a city name.");
    }
  });

  let currentTemperatureCelsius; // Variable to store temperature in Celsius

  // Geolocation success callback
  function success(position) {
    const { latitude, longitude } = position.coords;
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    // Reverse geocode the coordinates to get the city name
    reverseGeocode(latitude, longitude);
  }

  // Geolocation error callback
  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    alert("Unable to retrieve your location. Please enter a city manually.");
  }

  // Reverse geocode the coordinates to get the city name using OpenCage API
  function reverseGeocode(lat, lon) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${openCageApiKey}`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const city = data.results[0].components.city || data.results[0].components.town || data.results[0].components.village;

        // Check if the detected city is Islamabad
        if (city === "Islamabad") {
          console.log("Detected location: Islamabad");
          document.getElementById("cityName").textContent = "Islamabad";
          getWeather("Islamabad");
          getForecast("Islamabad");
        } else {
          alert(`The detected location is ${city}. Please enter Islamabad manually if this is incorrect.`);
        }
      })
      .catch(error => {
        console.error("Error with reverse geocoding:", error);
      });
  }

  // Fetch current weather using city name
 function getWeather(city) {
  const unit = document.querySelector('input[name="tempUnit"]:checked').value;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;

  fetchWeatherData(url);
}

  // Fetch forecast using city name
  function getForecast(city) {
    const unit = document.querySelector('input[name="tempUnit"]:checked').value; // Get selected unit
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`;

    fetchForecastData(url);
  }

function fetchWeatherData(url) {
    const spinner = document.getElementById("loadingSpinner");
    spinner.style.display = "block";

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("City not found");
            }
            return response.json();
        })
        .then(data => {
            console.log("Weather data:", data);
            spinner.style.display = "none";

            document.getElementById("cityName").textContent = data.name;
            currentTemperatureCelsius = data.main.temp;
            updateTemperature(document.querySelector('input[name="tempUnit"]:checked').value);
            document.getElementById("weatherDescription").textContent = data.weather[0].description.toUpperCase();
            document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
            document.getElementById("windSpeed").textContent = `Wind Speed: ${data.wind.speed} m/s`;

            // Get sunrise and sunset times
            const sunrise = data.sys.sunrise * 1000;
            const sunset = data.sys.sunset * 1000;
            const currentTime = Date.now();

            // Check if it's night time
            const isNight = currentTime < sunrise || currentTime > sunset;

            // Determine the weather condition
            const condition = data.weather[0].main.toLowerCase();
            const description = data.weather[0].description.toLowerCase();
            const iconElement = document.getElementById("weatherIcon");

            // Map the weather conditions to your SVG file paths
            let svgPath = '';

            if (description.includes('overcast')) {
                svgPath = 'images/overcast.svg';
            } else if (condition === 'clear') {
                svgPath = isNight ? 'images/clear_night.svg' : 'images/clear.svg';
            } else if (condition === 'clouds') {
                svgPath = 'images/clouds.svg';
            } else if (condition === 'rain' || description.includes('rain')) {
                svgPath = 'images/rain.svg';
            } else if (condition === 'snow' || description.includes('snow')) {
                svgPath = 'images/snow.svg';
            } else if (condition === 'thunderstorm') {
                svgPath = 'images/thunderstorm.svg';
            } else if (condition === 'mist' || description.includes('mist')) {
                svgPath = 'images/mist.svg';
            } else if (condition === 'haze' || description.includes('haze')) {
                svgPath = 'images/haze.svg';
            } else if (condition === 'fog' || description.includes('fog')) {
                svgPath = 'images/fog.svg';
            } else if (condition === 'drizzle' || description.includes('drizzle')) {
                svgPath = 'images/drizzle.svg';
            } else {
                svgPath = 'images/default.svg';
            }

            // Update the src of the icon
            iconElement.src = svgPath;

            // Update current time
            updateCurrentTime(data.timezone);

            changeBackgroundVideo(condition, description, isNight);
        })
        .catch(error => {
            spinner.style.display = "none";
            console.error("Error fetching weather data:", error);
            alert(error.message);
        });
}

  function updateCurrentTime(timezone) {
  const currentTimeElement = document.getElementById("currentTime");

  // Clear any existing time update interval
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }

  function updateTime() {
    const date = new Date();
    const localTime = date.getTime();
    const localOffset = date.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const cityTime = utc + (1000 * timezone);
    const cityDate = new Date(cityTime);

    const options = { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true
    };
    currentTimeElement.textContent = cityDate.toLocaleTimeString('en-US', options);
  }

  // Update time immediately and then every second
  updateTime(); // Call to immediately update time
  timeUpdateInterval = setInterval(updateTime, 1000); // Store the interval ID
}
function changeBackgroundVideo(condition, description, isNight) {
    const videoContainer = document.getElementById("videoContainer");
    let videoFile = "default.mp4";

    if (description.includes("overcast")) {
        videoFile = "overcast.mp4";
    } else if (condition.includes("thunderstorm")) {
        videoFile = "thunderstorm.mp4";
    } else if (condition.includes("drizzle") || description.includes("light rain")) {
        videoFile = "drizzle.mp4";
    } else if (condition.includes("rain") || description.includes("rain")) {
        videoFile = "rain.mp4";
    } else if (condition.includes("snow") || description.includes("snow")) {
        videoFile = "snow.mp4";
    } else if (condition.includes("mist") || description.includes("mist")) {
        videoFile = "mist.mp4";
    } else if (condition.includes("fog") || description.includes("fog")) {
        videoFile = "fog.mp4";
    } else if (condition.includes("haze") || description.includes("haze")) {
        videoFile = "fog.mp4";
    }else if (condition.includes("clear")) {
        videoFile = isNight ? "clear_night.mp4" : "sunny.mp4";
    } else if (condition.includes("cloud") || description.includes("cloud")) {
        videoFile = "cloudy.mp4";
    }

    const newVideo = document.createElement("video");
    newVideo.id = "backgroundVideo";
    newVideo.src = videoFile;
    newVideo.autoplay = true;
    newVideo.loop = true;
    newVideo.muted = true;
    newVideo.classList.add("fade-in");

    const oldVideo = document.getElementById("backgroundVideo");
    if (oldVideo) oldVideo.remove();

    videoContainer.appendChild(newVideo);
}

  // Fetch forecast data
  function fetchForecastData(url) {
    const spinner = document.getElementById("loadingSpinner");
    spinner.style.display = "block"; // Show the spinner

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error("Forecast data not found");
        }
        return response.json();
      })
      .then(data => {
        console.log("Forecast data:", data);
        spinner.style.display = "none"; // Hide the spinner

        // Destroy existing charts if they exist
        destroyCharts();

        // Filter to get only the first entry for each of the next 5 days
        const filteredData = filterForecastData(data.list);

        // Create new charts
        createWeatherConditionChart(filteredData); // Pass the filtered data
        createTemperatureLineChart(filteredData); // Pass the filtered data
        createTemperatureChart(filteredData); // Pass the filtered data
      })
      .catch(error => {
        spinner.style.display = "none"; // Hide the spinner
        console.error("Error fetching forecast data:", error);
      });
  }

  // Function to filter forecast data to get only 5 days worth of data
  function filterForecastData(data) {
    const filtered = [];
    const seenDays = new Set();

    for (const item of data) {
      const date = new Date(item.dt_txt).toLocaleDateString(); // Get the date string

      if (!seenDays.has(date) && filtered.length < 5) {
        filtered.push(item); // Push the item to filtered array
        seenDays.add(date); // Mark this date as seen
      }
    }

    return filtered; // Return the filtered data with only 5 days
  }

  // Create a function to destroy existing charts
  function destroyCharts() {
    if (weatherDoughnutChart) {
      weatherDoughnutChart.destroy();
      weatherDoughnutChart = null;
    }
    if (temperatureLineChart) {
      temperatureLineChart.destroy();
      temperatureLineChart = null;
    }
    if (temperatureBarChart) {
      temperatureBarChart.destroy();
      temperatureBarChart = null;
    }
  }
// Create the weather condition doughnut chart
function createWeatherConditionChart(data) {
  const counts = {
    Clear: 0,
    Cloudy: 0,
    Overcast: 0,
    Rain: 0,
    Snow: 0,
    Thunderstorm: 0,
    Drizzle: 0,
    Mist: 0,
    Fog: 0,
    Other: 0, // For any other weather types
  };

  for (const item of data) {
    const condition = item.weather[0].main; // Main condition (e.g., 'Clear', 'Clouds', 'Rain')

    // Categorize the weather condition
    if (condition === 'Clear') {
      counts.Clear++;
    } else if (condition === 'Clouds') {
      const description = item.weather[0].description.toLowerCase();
      if (description.includes('overcast')) {
        counts.Overcast++;
      } else {
        counts.Cloudy++;
      }
    } else if (condition === 'Rain') {
      counts.Rain++;
    } else if (condition === 'Snow') {
      counts.Snow++;
    } else if (condition === 'Thunderstorm') {
      counts.Thunderstorm++;
    } else if (condition === 'Drizzle') {
      counts.Drizzle++;
    } else if (condition === 'Mist') {
      counts.Mist++;
    } else if (condition === 'Fog') {
      counts.Fog++;
    } else {
      counts.Other++; // Catch any unhandled conditions
    }
  }

  const ctx = document.getElementById('weatherDoughnutChart').getContext('2d');
  weatherDoughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Weather Conditions',
        data: Object.values(counts),
        backgroundColor: [
  'rgba(255, 206, 86, 0.7)',  // Clear
  'rgba(54, 162, 235, 0.7)',   // Cloudy
  'rgba(75, 192, 192, 0.7)',   // Overcast
  'rgba(255, 99, 132, 0.7)',   // Rain
  'rgba(153, 102, 255, 0.7)',  // Snow
  'rgba(255, 159, 64, 0.7)',   // Thunderstorm
  'rgba(100, 200, 86, 0.7)',   // Drizzle
  'rgba(200, 206, 86, 0.7)',   // Mist
  'rgba(54, 100, 200, 0.7)',   // Fog
  'rgba(75, 75, 192, 0.7)',    // Other
],
borderColor: [
  'rgba(255, 206, 86, 1)',   // Clear
  'rgba(54, 162, 235, 1)',   // Cloudy
  'rgba(75, 192, 192, 1)',   // Overcast
  'rgba(255, 99, 132, 1)',   // Rain
  'rgba(153, 102, 255, 1)',  // Snow
  'rgba(255, 159, 64, 1)',   // Thunderstorm
  'rgba(100, 200, 86, 1)',   // Drizzle
  'rgba(200, 206, 86, 1)',   // Mist
  'rgba(54, 100, 200, 1)',   // Fog
  'rgba(75, 75, 192, 1)',    // Other
],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    }
  });
}


  // Create the temperature line chart
  function createTemperatureLineChart(data) {
    const labels = data.map(item => new Date(item.dt_txt).toLocaleDateString());
    const temperatures = data.map(item => item.main.temp);

    const ctx = document.getElementById('temperatureLineChart').getContext('2d');
    temperatureLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: temperatures,
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
   options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#ffffff'  // White color for legend labels
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#ffffff' },  // White color for x-axis labels
      grid: { color: 'rgba(255, 255, 255, 0.1)' }  // Subtle grid lines
    },
    y: {
      ticks: { color: '#ffffff' },  // White color for y-axis labels
      grid: { color: 'rgba(255, 255, 255, 0.1)' }  // Subtle grid lines
    }
  }
}
    });
  }

  // Create the temperature bar chart
  function createTemperatureChart(data) {
    const labels = data.map(item => new Date(item.dt_txt).toLocaleDateString());
    const temperatures = data.map(item => item.main.temp);

    const ctx = document.getElementById('temperatureBarChart').getContext('2d');
    temperatureBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: temperatures,
         backgroundColor: 'rgba(255, 99, 132, 0.5)',
borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
   options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#ffffff'  // White color for legend labels
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#ffffff' },  // White color for x-axis labels
      grid: { color: 'rgba(255, 255, 255, 0.1)' }  // Subtle grid lines
    },
    y: {
      ticks: { color: '#ffffff' },  // White color for y-axis labels
      grid: { color: 'rgba(255, 255, 255, 0.1)' }  // Subtle grid lines
    }
  }
}
    });
  }



  // Update temperature based on the selected unit
   function updateTemperature(unit) {
    const temperatureDisplay = document.getElementById("temperature");
    if (unit === "imperial") {
      const temperatureFahrenheit = toFahrenheit(currentTemperatureCelsius);
      temperatureDisplay.textContent = `${Math.round(temperatureFahrenheit)}°F`;
    } else {
      temperatureDisplay.textContent = `${Math.round(currentTemperatureCelsius)}°C`;
    }
  }

  // Convert Celsius to Fahrenheit
  function toFahrenheit(celsius) {
    return (celsius * 9 / 5) + 32;
  }


});
