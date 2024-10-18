const apiKey = "1062dac0c3e4e655042b945ecea54556"; // OpenWeatherMap API key
const openCageApiKey = "8da611da931e478a8b4f7b81825de08a"; // OpenCage API key
const geminiApiKey = "AIzaSyA68lqt6pGEaq5-oypFoBmKQDApVqvfbhs"; // Replace with your Gemini API key

let currentPage = 1;
const rowsPerPage = 10; // Show 10 entries on the first page
let isNightMode = false; // Track if it's night
const itemsPerPage = 10;
let forecastData = [];

// Geolocation on page load
document.addEventListener("DOMContentLoaded", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    alert("Geolocation is not supported. Please enter a city manually.");
  }

  document.getElementById("getWeatherBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) {
      getWeather(city);
      getForecast(city);
    } else {
      alert("Please enter a city name.");
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => paginate(1));
  document.getElementById("prevPage").addEventListener("click", () => paginate(-1));
});

// Geolocation success and error handlers
function success(position) {
  const { latitude, longitude } = position.coords;
  reverseGeocode(latitude, longitude);
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
  alert("Unable to retrieve location. Enter the city manually.");
}

// Reverse geocode to get city name using OpenCage API
function reverseGeocode(lat, lon) {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${openCageApiKey}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const city = data.results[0].components.city || data.results[0].components.town || "";
      document.getElementById("cityInput").value; // Set the detected city
      if (city) {
        getWeather(city);
        getForecast(city);
      }
    })
    .catch(() => {
      console.error("Error in reverse geocoding");
      document.getElementById("cityInput").value = ""; // Ensure input is blank on failure
    });
}

function renderPagination(totalItems, rowsPerPage) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // Create Previous button
  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.disabled = currentPage === 1;
  prevButton.classList.add('pagination-btn', 'blur-background');
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updateTable(weatherData, cityName, timezone); // Re-update the table
    }
  });
  paginationContainer.appendChild(prevButton);

  // Create page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.classList.add('pagination-btn', 'blur-background');
    if (i === currentPage) pageButton.classList.add('active');
    pageButton.addEventListener('click', () => {
      currentPage = i;
      updateTable(weatherData, cityName, timezone);
    });
    paginationContainer.appendChild(pageButton);
  }

  // Create Next button
  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.disabled = currentPage === totalPages;
  nextButton.classList.add('pagination-btn', 'blur-background');
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateTable(weatherData, cityName, timezone);
    }
  });
  paginationContainer.appendChild(nextButton);
}

// Fetch current weather
function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Update the city name display
      document.getElementById("cityyname").textContent = `${data.name}`;
      
      // Determine if it's night based on sunrise and sunset times
      const currentTime = new Date().getTime() / 1000; // Current time in seconds
      isNightMode = currentTime < data.sys.sunrise || currentTime > data.sys.sunset;
      
      updateBackgroundVideo(data.weather[0].main, data.weather[0].description);
      
      // Call getForecast to update the forecast table
      getForecast(data.name);
    })
    .catch((error) => {
      console.error("Error fetching weather:", error);
      alert("City not found. Please check the spelling and try again.");
    });
}

function updateTable(data, cityyName, timezone) {
  const tableBody = document.getElementById('weatherTableBody');
  const cityTitle = document.getElementById('tableCityTitle');
  
  // Set the city name at the top of the table
  cityTitle.textContent = `Weather Forecast for ${cityName}`;

  // Determine if it's night based on the timezone
  const currentTime = new Date();
  const utcOffset = timezone * 1000;
  const cityTime = new Date(currentTime.getTime() + utcOffset);
  const hour = cityTime.getUTCHours();
  isNightMode = hour < 6 || hour >= 18; // Night if before 6 AM or after 6 PM

  // Update the background video based on day/night and weather condition
    const currentWeather = data[0].weather[0].main;
    const currentDescription = data[0].weather[0].description;
  updateBackgroundVideo(currentWeather,currentDescription);
  
  // Clear the existing table content
  tableBody.innerHTML = "";

  // Paginate the data based on the current page
  const start = (currentPage - 1) * rowsPerPage;
  const paginatedData = data.slice(start, start + rowsPerPage);

  // Populate the table with the paginated data
  paginatedData.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(item.dt_txt).toLocaleDateString()}</td>
      <td>${item.weather[0].description}</td>
      <td>${Math.round(item.main.temp)}°C</td>
      <td>${item.wind.speed} m/s</td>
    `;
    tableBody.appendChild(row);
  });

  // Render the pagination buttons
  renderPagination(data.length, rowsPerPage);
}
// Fetch 5-day forecast
function getForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      forecastData = data.list;
      currentPage = 1;
      displayForecast();
    })
    .catch((error) => console.error("Error fetching forecast:", error));
}

// Display forecast with pagination
function displayForecast() {
  const tableBody = document.getElementById("forecastTableBody");
  tableBody.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, forecastData.length);
  const slicedData = forecastData.slice(startIndex, endIndex);

  slicedData.forEach((item) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = new Date(item.dt_txt).toLocaleDateString();
    row.appendChild(dateCell);

    const weatherCell = document.createElement("td");
    weatherCell.textContent = item.weather[0].description;
    row.appendChild(weatherCell);

    const tempCell = document.createElement("td");
    tempCell.textContent = `${item.main.temp}°C`;
    row.appendChild(tempCell);

    tableBody.appendChild(row);
  });

  document.getElementById("pageInfo").textContent = `Page ${currentPage}`;
  updatePaginationButtons();
}

// Handle pagination
function paginate(direction) {
  currentPage += direction;
  displayForecast();
}

function updatePaginationButtons() {
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage * itemsPerPage >= forecastData.length;
}

function changeBackgroundVideo(mode) {
  const videoContainer = document.getElementById('videoContainer');
  const videoFile = mode === 'night' ? 'clear_night.mp4' : 'sunny.mp4';

  const newVideo = document.createElement('video');
  newVideo.id = 'backgroundVideo';
  newVideo.src = videoFile;
  newVideo.autoplay = true;
  newVideo.loop = true;
  newVideo.muted = true;
  newVideo.classList.add('fade-in');

  const oldVideo = document.getElementById('backgroundVideo');
  if (oldVideo) oldVideo.remove();

  videoContainer.appendChild(newVideo);
}

function updateBackgroundVideo(condition, description) {
  const videoContainer = document.getElementById("videoContainer");
  let videoFile = "default.mp4";

  // Convert condition and description to lowercase for easier comparison
  const lowerCondition = condition.toLowerCase();
  const lowerDescription = description.toLowerCase();

  if (isNightMode && lowerCondition === "clear") {
    videoFile = "clear_night.mp4";
  } else {
    switch (lowerCondition) {
      case "clear":
        videoFile = "sunny.mp4";
        break;
      case "clouds":
        if (lowerDescription.includes("overcast")) {
          videoFile = "overcast.mp4";
        } else {
          videoFile = "cloudy.mp4";
        }
            break;
        case "drizzle":
            videoFile = "drizzle.mp4";
            break;
      case "rain":
     
        videoFile = "rain.mp4";
        break;
      case "thunderstorm":
        videoFile = "thunderstorm.mp4";
        break;
      case "snow":
        videoFile = "snow.mp4";
        break;
        case "mist":
            videoFile = "mist.mp4";
            break;
      case "fog":
      case "haze":
        videoFile = "fog.mp4";
        break;
      default:
        videoFile = "default.mp4";
    }
  }
const newVideo = document.createElement("video");
  newVideo.id = "backgroundVideo";
  newVideo.src = videoFile;
  newVideo.autoplay = true;
  newVideo.loop = true;
  newVideo.muted = true;
  newVideo.classList.add('fade-in');

  const oldVideo = document.getElementById("backgroundVideo");
  if (oldVideo) oldVideo.replaceWith(newVideo);
}


