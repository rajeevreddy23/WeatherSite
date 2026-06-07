// API endpoints (using Open-Meteo - free API, no key required)
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements
const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const weatherContainer = document.getElementById('weatherContainer');
const errorMessage = document.getElementById('errorMessage');

// Weather data elements
const locationName = document.getElementById('locationName');
const currentDate = document.getElementById('currentDate');
const temp = document.getElementById('temp');
const feelsLike = document.getElementById('feelsLike');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const uvIndex = document.getElementById('uvIndex');
const weatherIcon = document.getElementById('weatherIcon');

// Event listeners
searchBtn.addEventListener('click', searchWeather);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Weather code to description mapping
const weatherDescriptions = {
    0: { description: 'Clear Sky', icon: '☀️' },
    1: { description: 'Mainly Clear', icon: '🌤️' },
    2: { description: 'Partly Cloudy', icon: '⛅' },
    3: { description: 'Overcast', icon: '☁️' },
    45: { description: 'Foggy', icon: '🌫️' },
    48: { description: 'Depositing Rime Fog', icon: '🌫️' },
    51: { description: 'Light Drizzle', icon: '🌦️' },
    53: { description: 'Moderate Drizzle', icon: '🌦️' },
    55: { description: 'Dense Drizzle', icon: '🌦️' },
    61: { description: 'Slight Rain', icon: '🌧️' },
    63: { description: 'Moderate Rain', icon: '🌧️' },
    65: { description: 'Heavy Rain', icon: '⛈️' },
    71: { description: 'Slight Snow', icon: '❄️' },
    73: { description: 'Moderate Snow', icon: '❄️' },
    75: { description: 'Heavy Snow', icon: '❄️' },
    77: { description: 'Snow Grains', icon: '❄️' },
    80: { description: 'Slight Rain Showers', icon: '🌧️' },
    81: { description: 'Moderate Rain Showers', icon: '🌧️' },
    82: { description: 'Violent Rain Showers', icon: '⛈️' },
    85: { description: 'Slight Snow Showers', icon: '❄️' },
    86: { description: 'Heavy Snow Showers', icon: '❄️' },
    95: { description: 'Thunderstorm', icon: '⛈️' },
    96: { description: 'Thunderstorm with Slight Hail', icon: '⛈️' },
    99: { description: 'Thunderstorm with Heavy Hail', icon: '⛈️' },
};

async function searchWeather() {
    const location = locationInput.value.trim();
    
    if (!location) {
        showError('Please enter a location');
        return;
    }

    try {
        hideError();
        
        // Get coordinates from location name
        const coordinates = await getCoordinates(location);
        
        if (!coordinates) {
            showError('Location not found. Please try another search.');
            return;
        }

        // Get weather data
        const weatherData = await getWeatherData(
            coordinates.latitude,
            coordinates.longitude,
            coordinates.name,
            coordinates.country
        );

        // Display weather
        displayWeather(weatherData, coordinates);
    } catch (error) {
        showError('Error fetching weather data. Please try again.');
        console.error(error);
    }
}

async function getCoordinates(locationName) {
    try {
        const response = await fetch(
            `${GEOCODING_API}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return null;
        }

        const result = data.results[0];
        return {
            latitude: result.latitude,
            longitude: result.longitude,
            name: result.name,
            country: result.country || '',
            admin1: result.admin1 || ''
        };
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        throw error;
    }
}

async function getWeatherData(latitude, longitude, name, country) {
    try {
        const response = await fetch(
            `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`
        );
        const data = await response.json();

        return {
            current: data.current,
            daily: data.daily,
            timezone: data.timezone,
            locationName: name,
            country: country
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

function displayWeather(weatherData, coordinates) {
    const { current, daily, timezone, locationName, country } = weatherData;

    // Update location and date
    const displayName = country ? `${locationName}, ${country}` : locationName;
    locationName.textContent = displayName;
    
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    currentDate.textContent = dateString;

    // Get weather description
    const weatherCode = current.weather_code;
    const weatherInfo = weatherDescriptions[weatherCode] || {
        description: 'Unknown',
        icon: '🌡️'
    };

    // Update main weather display
    temp.textContent = Math.round(current.temperature_2m);
    feelsLike.textContent = Math.round(current.apparent_temperature);
    description.textContent = weatherInfo.description;
    weatherIcon.textContent = weatherInfo.icon;
    weatherIcon.style.fontSize = '60px';
    weatherIcon.alt = weatherInfo.description;

    // Update details
    humidity.textContent = current.relative_humidity_2m;
    windSpeed.textContent = Math.round(current.wind_speed_10m * 10) / 10;
    pressure.textContent = current.pressure_msl;
    visibility.textContent = (current.visibility / 1000).toFixed(1);
    uvIndex.textContent = daily.uv_index_max[0];

    // Show weather container
    weatherContainer.classList.add('show');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    weatherContainer.classList.remove('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

// Load default weather on page load
window.addEventListener('load', () => {
    locationInput.value = 'New York';
    searchWeather();
});
