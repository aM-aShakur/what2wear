import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import './App.css';

const Weather = () => {
  const [location, setLocation] = useState("New York");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState(localStorage.getItem("unit") || "metric");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history")) || []
  );
  const API_KEY = "09ca7a3ac5c43b10fed51851b48f7f28";

  // error handling with auto-dismiss
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  // weather data fetching
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        // Determine if input is zip code or location name
        const parts = location.split(',');
        const firstPart = parts[0].trim();
        const isZipCode = /^\d+$/.test(firstPart);

        const [weatherResponse, forecastResponse] = await Promise.all([
          axios.get(
            isZipCode 
              ? `https://api.openweathermap.org/data/2.5/weather?zip=${location}&units=${unit}&appid=${API_KEY}`
              : `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${unit}&appid=${API_KEY}`
          ),
          axios.get(
            isZipCode
              ? `https://api.openweathermap.org/data/2.5/forecast?zip=${location}&units=${unit}&appid=${API_KEY}`
              : `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${unit}&appid=${API_KEY}`
          ),
        ]);

        // Process forecast data to get daily values
        const dailyForecast = forecastResponse.data.list
          .filter((_, index) => index % 8 === 0)
          .slice(0, 5);

        setWeather(weatherResponse.data);
        setForecast(dailyForecast);
      } catch (error) {
        showError(
          error.response?.status === 404 
            ? "Location not found. Please try again." 
            : "Failed to fetch weather data. Please try again."
        );
        setWeather(null);
        setForecast([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location, unit, API_KEY]);

  // Clothing recommendation function
  const getClothingRecommendation = useCallback((temp) => {
    const celsiusTemp = unit === "imperial" ? (temp - 32) * (5 / 9) : temp;
    return celsiusTemp < 10
      ? "Bundle up! 🧥 Wear a warm coat, gloves, and hat."
      : celsiusTemp < 20
      ? "Layer up! 🧥 Light jacket or sweater recommended."
      : celsiusTemp < 30
      ? "Comfortable! 👕 T-shirt and light pants/shorts."
      : "Stay cool! 🩳 Breathable clothes and sunscreen!";
  }, [unit]);

  // Geolocation handling
  const fetchWeatherByLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&units=${unit}&appid=${API_KEY}`
          );
          setLocation(response.data.name);
        } catch {
          showError("Failed to fetch weather for your location.");
        }
      },
      (error) => {
        showError(
          error.code === error.PERMISSION_DENIED
            ? "Location access denied. Please enable permissions."
            : "Unable to retrieve your location."
        );
      }
    );
  }, [unit, API_KEY]);

  // input validation
  const handleSubmit = (e) => {
    e.preventDefault();
    const validatedInput = input.trim();
    
    if (!validatedInput) {
      showError("Please enter a location.");
      return;
    }

    if (!/^[a-zA-ZÀ-ÖØ-öø-ÿ0-9\s-,']+$/.test(validatedInput)) {
      showError("Please enter a valid city, state, or zip code.");
      return;
    }

    setLocation(validatedInput);
    setHistory((prev) => 
      [validatedInput, ...prev.filter(item => item !== validatedInput)].slice(0, 5)
    );
    setInput("");
  };

  // Toggle Theme Function
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Toggle Unit Function
  const toggleUnit = () => {
    const newUnit = unit === "metric" ? "imperial" : "metric";
    setUnit(newUnit);
    localStorage.setItem("unit", newUnit);
  };

  return (
    <div className={`flex flex-col items-center min-h-screen p-6 transition-colors duration-300 ${theme === "light" ? "bg-blue-100 text-gray-800" : "bg-gray-800 text-gray-100"}`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-opacity-90 hover:bg-opacity-100 transition-all"
        style={{
          backgroundColor: theme === "light" ? "white" : "#374151",
          color: theme === "light" ? "#4F46E5" : "white"
        }}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>

      {/* Location Fetch Button */}
      <button
        onClick={fetchWeatherByLocation}
        className="absolute top-4 left-4 p-2 rounded-lg bg-opacity-90 hover:bg-opacity-100 transition-all"
        style={{
          backgroundColor: theme === "light" ? "white" : "#374151",
          color: theme === "light" ? "#4F46E5" : "white"
        }}
      >
        🌍 Use My Location
      </button>

      {/* Main Content */}
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6 text-center"
      >
        What2Wear? 👕
      </motion.h2>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md flex gap-2 mb-6 px-4">
        <input
          type="text"
          placeholder="Enter city, state, or zip code..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2"
          style={{
            backgroundColor: theme === "light" ? "white" : "#4B5563",
            borderColor: theme === "light" ? "#E5E7EB" : "#4B5563"
          }}
        />
        <button
          type="submit"
          className="px-4 py-3 rounded-lg font-semibold transition-colors"
          style={{
            backgroundColor: theme === "light" ? "#4F46E5" : "#6366F1",
            color: "white"
          }}
        >
          Search
        </button>
      </form>

      {/* Error Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-2 text-lg">
          <div className="animate-spin">🌀</div>
          Loading weather data...
        </div>
      )}

      {/* Weather Display */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-6 rounded-xl shadow-lg backdrop-blur-sm border pt-4"
          style={{
            backgroundColor: theme === "light" 
              ? "rgba(255, 255, 255, 0.9)" 
              : "rgba(45, 91, 150, 0.9)"
          }}
        >
          {/* Current Weather */}
          <div className="text-center mb-6" >
            <h3 className="text-2xl font-bold mb-2">{weather.name}</h3>
            <div className="flex items-center justify-center gap-4">
              <img
                src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
                className="w-20 h-20"
              />
              <div>
                <p className="text-4xl font-bold">
                  {Math.round(weather.main.temp)}°{unit === "metric" ? "C" : "F"}
                </p>
                <p className="text-gray-500 capitalize">
                  {weather.weather[0].description}
                </p>
              </div>
            </div>
            <p className="mt-4 text-lg font-semibold">
              {getClothingRecommendation(weather.main.temp)}
            </p>
          </div>

          {/* 5-Day Forecast */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-bold mb-4">5-Day Forecast</h4>
            <div className="grid gap-4">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-opacity-20"
                  style={{
                    backgroundColor: theme === "light"
                      ? "rgba(147, 197, 253, 0.2)"
                      : "rgba(55, 65, 81, 0.4)"
                  }}
                >
                  <span className="font-medium">
                    {new Date(day.dt_txt).toLocaleDateString("en-US", {
                      weekday: "short"
                    })}
                  </span>
                  <img
                    src={`http://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                    alt={day.weather[0].description}
                    className="w-12 h-12"
                  />
                  <span className="font-semibold">
                    {Math.round(day.main.temp)}°{unit === "metric" ? "C" : "F"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unit Toggle */}
          <button
            onClick={toggleUnit}
            className="w-full mt-6 px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: theme === "light" ? "#4F46E5" : "#6366F1",
              color: "white"
            }}
          >
            Switch to {unit === "metric" ? "Fahrenheit (°F)" : "Celsius (°C)"}
          </button>
        </motion.div>
      )}

      {/* Search History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 w-full max-w-md"
        >
          <h4 className="text-lg font-semibold mb-2 px-4">Recent Searches:</h4>
          <div className="flex flex-wrap gap-2 px-4">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => setLocation(item)}
                className="px-3 py-1 rounded-full text-sm transition-colors"
                style={{
                  backgroundColor: theme === "light" 
                    ? "#E0E7FF" 
                    : "#4B5563",
                  color: theme === "light" ? "#4F46E5" : "white"
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Weather;