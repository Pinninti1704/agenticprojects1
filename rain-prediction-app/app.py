"""
Rain Prediction App
Uses Open-Meteo API (free, no API key required) to predict rain.
"""

import requests
import sys
from datetime import datetime, timedelta
from typing import Optional

# Fix Windows console encoding for emoji support
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


class RainPredictor:
    """Predicts rain using Open-Meteo weather API."""
    
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
    
    def get_coordinates(self, location: str) -> Optional[tuple[float, float]]:
        """Get latitude/longitude for a location name using Open-Meteo geocoding."""
        geocode_url = f"https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": location, "count": 1, "language": "en", "format": "json"}
        
        try:
            response = requests.get(geocode_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if "results" in data and len(data["results"]) > 0:
                result = data["results"][0]
                return result["latitude"], result["longitude"]
        except Exception as e:
            print(f"Error geocoding location: {e}")
        
        return None
    
    def get_weather_data(self, latitude: float, longitude: float) -> Optional[dict]:
        """Fetch weather forecast from Open-Meteo API."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation_probability,precipitation,weather_code",
            "daily": "weather_code,precipitation_sum,precipitation_probability_max",
            "forecast_days": 7,
            "timezone": "auto"
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching weather data: {e}")
            return None
    
    def predict_rain(self, location: str) -> dict:
        """
        Predict rain for a given location.
        Returns a dictionary with prediction details.
        """
        # Get coordinates
        coords = self.get_coordinates(location)
        if not coords:
            return {"error": f"Could not find location: {location}"}
        
        latitude, longitude = coords
        
        # Get weather data
        weather_data = self.get_weather_data(latitude, longitude)
        if not weather_data:
            return {"error": "Could not fetch weather data"}
        
        # Analyze data for rain prediction
        result = {
            "location": location,
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "current_conditions": {},
            "hourly_forecast": [],
            "daily_forecast": [],
            "rain_prediction": None
        }
        
        # Parse hourly data
        hourly = weather_data.get("hourly", {})
        current_hour = datetime.now().hour
        
        for i in range(len(hourly.get("time", []))):
            time = hourly["time"][i]
            precip_prob = hourly["precipitation_probability"][i]
            precip = hourly["precipitation"][i]
            weather_code = hourly["weather_code"][i]
            
            # Only show next 24 hours
            hour_dt = datetime.fromisoformat(time.replace("Z", "+00:00"))
            if hour_dt.hour >= current_hour and i < current_hour + 24:
                result["hourly_forecast"].append({
                    "time": time,
                    "precipitation_probability": precip_prob,
                    "precipitation_mm": precip,
                    "weather_code": weather_code,
                    "weather_description": self._get_weather_description(weather_code)
                })
        
        # Parse daily data
        daily = weather_data.get("daily", {})
        for i in range(len(daily.get("time", []))):
            result["daily_forecast"].append({
                "date": daily["time"][i],
                "weather_code": daily["weather_code"][i],
                "weather_description": self._get_weather_description(daily["weather_code"][i]),
                "precipitation_sum_mm": daily["precipitation_sum"][i],
                "max_precipitation_probability": daily["precipitation_probability_max"][i]
            })
        
        # Make rain prediction
        result["rain_prediction"] = self._analyze_rain_chance(result)
        
        return result
    
    def _analyze_rain_chance(self, data: dict) -> dict:
        """Analyze weather data to predict rain."""
        hourly = data.get("hourly_forecast", [])
        daily = data.get("daily_forecast", [])
        
        if not hourly and not daily:
            return {"will_rain": None, "confidence": "low", "message": "Insufficient data"}
        
        # Check hourly forecast for next 24 hours
        max_hourly_prob = 0
        total_hourly_prob = 0
        rainy_hours = 0
        
        for hour in hourly:
            prob = hour.get("precipitation_probability", 0)
            total_hourly_prob += prob
            if prob > max_hourly_prob:
                max_hourly_prob = prob
            if prob >= 50:
                rainy_hours += 1
        
        avg_hourly_prob = total_hourly_prob / len(hourly) if hourly else 0
        
        # Check daily forecast
        max_daily_prob = 0
        rainy_days = 0
        
        for day in daily:
            prob = day.get("max_precipitation_probability", 0)
            if prob > max_daily_prob:
                max_daily_prob = prob
            if prob >= 50:
                rainy_days += 1
        
        # Determine rain prediction
        will_rain = max_hourly_prob >= 50 or max_daily_prob >= 50
        
        if max_hourly_prob >= 70 or max_daily_prob >= 70:
            confidence = "high"
            message = "High chance of rain expected"
        elif max_hourly_prob >= 50 or max_daily_prob >= 50:
            confidence = "medium"
            message = "Moderate chance of rain"
        elif max_hourly_prob >= 30 or max_daily_prob >= 30:
            confidence = "low"
            message = "Low chance of rain"
        else:
            confidence = "very_low"
            message = "Very unlikely to rain"
        
        return {
            "will_rain": will_rain,
            "confidence": confidence,
            "message": message,
            "max_hourly_probability": max_hourly_prob,
            "avg_hourly_probability": round(avg_hourly_prob, 1),
            "max_daily_probability": max_daily_prob,
            "rainy_hours_expected": rainy_hours,
            "rainy_days_expected": rainy_days
        }
    
    def _get_weather_description(self, code: int) -> str:
        """Convert WMO weather code to description."""
        weather_codes = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            56: "Light freezing drizzle",
            57: "Dense freezing drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            66: "Light freezing rain",
            67: "Heavy freezing rain",
            71: "Slight snow",
            73: "Moderate snow",
            75: "Heavy snow",
            77: "Snow grains",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            85: "Slight snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        }
        return weather_codes.get(code, f"Unknown ({code})")


def display_forecast(result: dict):
    """Display the forecast results."""
    print("\n" + "=" * 50)
    print(f"Location: {result['location']}")
    print(f"   Coordinates: {result['coordinates']['latitude']:.2f}, {result['coordinates']['longitude']:.2f}")
    print("=" * 50)
    
    # Rain prediction
    prediction = result["rain_prediction"]
    print("\nRAIN PREDICTION:")
    print("-" * 30)
    
    if prediction["will_rain"]:
        print(f"   WILL RAIN: Yes")
    else:
        print(f"   WILL RAIN: No")
    
    print(f"   Confidence: {prediction['confidence'].upper()}")
    print(f"   Message: {prediction['message']}")
    print(f"   Max Hourly Probability: {prediction['max_hourly_probability']}%")
    print(f"   Avg Hourly Probability: {prediction['avg_hourly_probability']}%")
    print(f"   Max Daily Probability: {prediction['max_daily_probability']}%")
    
    # Daily forecast
    print("\n7-DAY FORECAST:")
    print("-" * 30)
    for day in result["daily_forecast"]:
        date = datetime.fromisoformat(day["date"]).strftime("%A, %b %d")
        print(f"   {date}")
        print(f"      {day['weather_description']}")
        print(f"      Precipitation: {day['precipitation_sum_mm']}mm")
        print(f"      Rain Chance: {day['max_precipitation_probability']}%")
        print()


def main():
    """Main function to run the rain prediction app."""
    predictor = RainPredictor()
    
    print("=" * 50)
    print("       Rain Prediction App")
    print("=" * 50)
    print("\nUsing Open-Meteo API (free, no API key required)")
    
    # Check for command-line argument
    if len(sys.argv) > 1:
        location = " ".join(sys.argv[1:])
    else:
        print("\nEnter a location to predict rain (or 'quit' to exit)")
        print("-" * 50)
        
        while True:
            try:
                location = input("\nLocation: ").strip()
            except EOFError:
                print("\nNo input provided. Using default location: London")
                location = "London"
                break
            
            if location.lower() in ["quit", "exit", "q"]:
                print("Goodbye!")
                return
            
            if not location:
                print("Please enter a location name.")
                continue
            break
    
    print(f"\nFetching weather data for {location}...")
    
    result = predictor.predict_rain(location)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        return
    
    display_forecast(result)


if __name__ == "__main__":
    main()
