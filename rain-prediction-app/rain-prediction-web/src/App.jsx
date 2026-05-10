import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import './App.css'

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Weather code descriptions
const weatherCodes = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
}

// Get weather icon based on code
const getWeatherIcon = (code) => {
  if (code === 0 || code === 1) return "☀️"
  if (code === 2) return "⛅"
  if (code === 3) return "☁️"
  if (code >= 45 && code <= 48) return "🌫️"
  if (code >= 51 && code <= 57) return "🌧️"
  if (code >= 61 && code <= 67) return "🌧️"
  if (code >= 71 && code <= 77) return "❄️"
  if (code >= 80 && code <= 82) return "🌦️"
  if (code >= 95) return "⛈️"
  return "🌤️"
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to center map on location
function MapCenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, 10, { duration: 1 })
    }
  }, [center, map])
  return null
}

function App() {
  const [position, setPosition] = useState([51.505, -0.09]) // Default: London
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locationName, setLocationName] = useState("London")

  const fetchWeatherData = async (lat, lng) => {
    setLoading(true)
    setError(null)
    
    try {
      // Get location name using reverse geocoding
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      const geoResponse = await fetch(geoUrl)
      const geoData = await geoResponse.json()
      const name = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.display_name?.split(',')[0] || "Unknown"
      setLocationName(name)

      // Get weather data from Open-Meteo
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation_probability,precipitation,weather_code&daily=weather_code,precipitation_sum,precipitation_probability_max&forecast_days=7&timezone=auto`
      const weatherResponse = await fetch(weatherUrl)
      const data = await weatherResponse.json()
      
      setWeatherData(data)
    } catch (err) {
      setError("Failed to fetch weather data. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (lat, lng) => {
    setPosition([lat, lng])
    fetchWeatherData(lat, lng)
  }

  // Initial load
  useEffect(() => {
    fetchWeatherData(position[0], position[1])
  }, [])

  const analyzeRain = () => {
    if (!weatherData) return null
    
    const daily = weatherData.daily
    let maxProb = 0
    let rainyDays = 0
    
    for (let i = 0; i < daily.precipitation_probability_max.length; i++) {
      const prob = daily.precipitation_probability_max[i]
      if (prob > maxProb) maxProb = prob
      if (prob >= 50) rainyDays++
    }
    
    const willRain = maxProb >= 50
    let confidence = "low"
    let message = "Very unlikely to rain"
    
    if (maxProb >= 70) {
      confidence = "high"
      message = "High chance of rain expected"
    } else if (maxProb >= 50) {
      confidence = "medium"
      message = "Moderate chance of rain"
    } else if (maxProb >= 30) {
      confidence = "low"
      message = "Low chance of rain"
    }
    
    return { willRain, confidence, message, maxProb, rainyDays }
  }

  const rainAnalysis = analyzeRain()

  return (
    <div className="app">
      <header className="header">
        <h1>🌧️ Rain Prediction Map</h1>
        <p>Click anywhere on the map to get rain predictions</p>
      </header>
      
      <div className="main-content">
        <div className="map-container">
          <MapContainer 
            center={position} 
            zoom={10} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={position} />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <MapCenter center={position} />
          </MapContainer>
        </div>
        
        <div className="weather-panel">
          <div className="location-info">
            <h2>📍 {locationName}</h2>
            <p>Coordinates: {position[0].toFixed(4)}, {position[1].toFixed(4)}</p>
          </div>
          
          {loading && <div className="loading">Loading weather data...</div>}
          
          {error && <div className="error">{error}</div>}
          
          {weatherData && !loading && (
            <>
              {rainAnalysis && (
                <div className={`rain-prediction ${rainAnalysis.willRain ? 'rain-yes' : 'rain-no'}`}>
                  <h3>{rainAnalysis.willRain ? '🌧️ Rain Expected' : '☀️ No Rain'}</h3>
                  <p className="confidence">Confidence: {rainAnalysis.confidence.toUpperCase()}</p>
                  <p className="message">{rainAnalysis.message}</p>
                  <div className="rain-stats">
                    <div className="stat">
                      <span className="stat-value">{rainAnalysis.maxProb}%</span>
                      <span className="stat-label">Max Rain Chance</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{rainAnalysis.rainyDays}</span>
                      <span className="stat-label">Rainy Days (7 days)</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="forecast">
                <h3>📅 7-Day Forecast</h3>
                <div className="forecast-grid">
                  {weatherData.daily.time.map((date, index) => (
                    <div key={index} className="forecast-day">
                      <div className="forecast-date">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="forecast-icon">
                        {getWeatherIcon(weatherData.daily.weather_code[index])}
                      </div>
                      <div className="forecast-desc">
                        {weatherCodes[weatherData.daily.weather_code[index]] || "Unknown"}
                      </div>
                      <div className="forecast-precip">
                        {weatherData.daily.precipitation_sum[index]}mm
                      </div>
                      <div className="forecast-prob">
                        {weatherData.daily.precipitation_probability_max[index]}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
