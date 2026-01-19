import { CONFIG } from '../config.js';

class WeatherService {
    constructor() {
        this.cache = new Map();
        this.units = CONFIG.API.UNITS;
        this.timezone = CONFIG.API.TIMEZONE;

        this.cityCoordinates = new Map();
    }

    async geocodeCity(city) {
        try {
            if (this.cityCoordinates.has(city)) {
                console.log('📍 Współrzędne z cache:', city);
                return this.cityCoordinates.get(city);
            }

            const url = new URL(CONFIG.API.GEOCODING_URL);
            url.searchParams.append('name', city);
            url.searchParams.append('count', '1');
            url.searchParams.append('language', CONFIG.API.LANG);
            url.searchParams.append('format', 'json');

            console.log('🌍 Geocoding:', city);
            const response = await this.fetchWithTimeout(url.toString());
            const data = await response.json();

            if (!response.ok || !data.results || data.results.length === 0) {
                throw new Error(`Nie znaleziono miasta: ${city}`);
            }

            const result = data.results[0];
            const coordinates = {
                latitude: result.latitude,
                longitude: result.longitude,
                name: result.name,
                country: result.country || '',
                timezone: result.timezone || CONFIG.API.TIMEZONE,
            };

            this.cityCoordinates.set(city, coordinates);

            return coordinates;
        } catch (error) {
            console.error('❌ Błąd geocodingu:', error);
            throw new Error(`Błąd konwersji miasta: ${error.message}`);
        }
    }

    async getCurrentWeather(city) {
        try {
            const cacheKey = `current_${city}`;

            if (this.isCached(cacheKey)) {
                console.log('📦 Bieżąca pogoda z cache:', city);
                return this.cache.get(cacheKey).data;
            }

            // Pobierz współrzędne
            const coords = await this.geocodeCity(city);

            const url = new URL(CONFIG.API.FORECAST_URL);
            url.searchParams.append('latitude', coords.latitude);
            url.searchParams.append('longitude', coords.longitude);
            url.searchParams.append(
                'current',
                'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,apparent_temperature,weather_code,is_day',
            );
            url.searchParams.append(
                'hourly',
                'temperature_2m,weather_code,relative_humidity_2m,pressure_msl,wind_speed_10m',
            );
            url.searchParams.append('timezone', coords.timezone);
            url.searchParams.append('temperature_unit', 'celsius');

            console.log('🌐 Pobieranie bieżącej pogody:', city);
            const response = await this.fetchWithTimeout(url.toString());
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Błąd pobierania bieżącej pogody');
            }

            const transformedData = this.transformCurrentWeather(data, coords);

            this.setCache(cacheKey, transformedData);

            return transformedData;
        } catch (error) {
            console.error('❌ Błąd getCurrentWeather:', error);
            throw new Error(`Błąd pobierania pogody: ${error.message}`);
        }
    }

    async getForecast(city) {
        try {
            const cacheKey = `forecast_${city}`;

            if (this.isCached(cacheKey)) {
                console.log('📦 Prognoza z cache:', city);
                return this.cache.get(cacheKey).data;
            }

            const coords = await this.geocodeCity(city);

            const url = new URL(CONFIG.API.FORECAST_URL);
            url.searchParams.append('latitude', coords.latitude);
            url.searchParams.append('longitude', coords.longitude);
            url.searchParams.append(
                'daily',
                'weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,wind_speed_10m_max,sunrise,sunset',
            );
            url.searchParams.append('timezone', coords.timezone);
            url.searchParams.append('temperature_unit', 'celsius');

            console.log('🌐 Pobieranie prognozy:', city);
            const response = await this.fetchWithTimeout(url.toString());
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Błąd pobierania prognozy');
            }

            const transformedData = this.transformForecast(data, coords);

            // Zapisz w cache
            this.setCache(cacheKey, transformedData);

            return transformedData;
        } catch (error) {
            console.error('❌ Błąd getForecast:', error);
            throw new Error(`Błąd pobierania prognozy: ${error.message}`);
        }
    }

    async getHistoricalData(city, startDate, endDate) {
        try {
            const cacheKey = `historical_${city}_${startDate}_${endDate}`;

            if (this.isCached(cacheKey)) {
                console.log('📦 Dane historyczne z cache:', city);
                return this.cache.get(cacheKey).data;
            }

            const coords = await this.geocodeCity(city);

            const url = new URL(CONFIG.API.HISTORICAL_URL);
            url.searchParams.append('latitude', coords.latitude);
            url.searchParams.append('longitude', coords.longitude);
            url.searchParams.append('start_date', startDate);
            url.searchParams.append('end_date', endDate);
            url.searchParams.append(
                'daily',
                'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
            );
            url.searchParams.append('timezone', coords.timezone);
            url.searchParams.append('temperature_unit', 'celsius');

            console.log(
                '🌐 Pobieranie danych historycznych (80 lat):',
                city,
                startDate,
                'do',
                endDate,
            );
            const response = await this.fetchWithTimeout(url.toString());
            const data = await response.json();

            if (!response.ok) {
                console.error('❌ API Response Error:', data);
                throw new Error(`API error: ${response.status}`);
            }

            if (!data.daily) {
                console.error('❌ Brak daily data w odpowiedzi:', data);
                throw new Error('Brak danych daily w odpowiedzi API');
            }

            console.log(
                '📊 API zwrócił dane, rozmiar:',
                data.daily.time?.length || 0,
                'dni',
            );

            const transformedData = this.transformHistoricalData(data, coords);

            // Zapisz w cache
            this.setCache(cacheKey, transformedData);

            return transformedData;
        } catch (error) {
            console.error('❌ Błąd getHistoricalData:', error.message);
            throw new Error(
                `Błąd pobierania danych historycznych: ${error.message}`,
            );
        }
    }

    async getMultipleCities(cities) {
        try {
            const promises = cities.map((city) => this.getCurrentWeather(city));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('❌ Błąd getMultipleCities:', error);
            throw new Error(`Błąd pobierania wielu miast: ${error.message}`);
        }
    }

    transformCurrentWeather(data, coords) {
        const current = data.current;
        const hourly = data.hourly;

        return {
            main: {
                temp: current.temperature_2m,
                feels_like: current.apparent_temperature,
                humidity: current.relative_humidity_2m,
                pressure: hourly.pressure_msl[0] || 1013,
            },
            weather: [
                {
                    main: this.getWeatherCondition(
                        current.weather_code,
                        current.is_day,
                    ),
                    description: this.getWeatherDescription(
                        current.weather_code,
                    ),
                    code: current.weather_code,
                },
            ],
            wind: {
                speed: current.wind_speed_10m,
                deg: current.wind_direction_10m,
            },
            clouds: {
                all: 0,
            },
            visibility: 10000,
            name: coords.name,
            sys: {
                country: coords.country,
            },
            is_day: current.is_day,
            timezone: coords.timezone,
        };
    }

    transformForecast(data, coords) {
        const daily = data.daily;
        const times = daily.time;

        return {
            list: times.map((date, i) => ({
                dt: Math.floor(new Date(date).getTime() / 1000),
                main: {
                    temp: daily.temperature_2m_mean[i],
                    temp_max: daily.temperature_2m_max[i],
                    temp_min: daily.temperature_2m_min[i],
                },
                weather: [
                    {
                        main: this.getWeatherCondition(daily.weather_code[i]),
                        description: this.getWeatherDescription(
                            daily.weather_code[i],
                        ),
                    },
                ],
                wind: {
                    speed: daily.wind_speed_10m_max[i],
                },
                rain: {
                    '1h': daily.precipitation_sum[i] || 0,
                },
                sunrise_ts: daily.sunrise?.[i]
                    ? Math.floor(new Date(daily.sunrise[i]).getTime() / 1000)
                    : null,
                sunset_ts: daily.sunset?.[i]
                    ? Math.floor(new Date(daily.sunset[i]).getTime() / 1000)
                    : null,
            })),
            city: {
                name: coords.name,
                country: coords.country,
                coord: {
                    lat: coords.latitude,
                    lon: coords.longitude,
                },
            },
        };
    }

    transformHistoricalData(data, coords) {
        const daily = data.daily;

        if (!daily || !daily.time || daily.time.length === 0) {
            console.error('❌ Brak danych daily w odpowiedzi API');
            throw new Error('Brak danych w odpowiedzi API');
        }

        const temperatureAvg = (daily.temperature_2m_max || []).map(
            (max, i) => {
                const min = (daily.temperature_2m_min || [])[i] || 0;
                return (max + min) / 2;
            },
        );

        console.log('✅ Dane historyczne przetworzone:', {
            days: daily.time.length,
            tempRange: `${Math.min(...(daily.temperature_2m_min || [])).toFixed(
                1,
            )}°C - ${Math.max(...(daily.temperature_2m_max || [])).toFixed(
                1,
            )}°C`,
        });

        return {
            timestamps: daily.time,
            temperature: temperatureAvg,
            humidity: [],
            dewPoint: [], // Archive API nie zwraca dew_point_2m_mean
            precipitation: daily.precipitation_sum || [],
            windSpeed: daily.wind_speed_10m_max || [],
            uvIndex: [],
            coordinates: coords,
            temperatureMax: daily.temperature_2m_max || [],
            temperatureMin: daily.temperature_2m_min || [],
        };
    }

    getWeatherCondition(code, isDay = true) {
        if (code === 0) return 'Clear';
        if (code === 1 || code === 2) return 'Clouds';
        if (code === 3) return 'Clouds';
        if (code === 45 || code === 48) return 'Fog';
        if (code === 51 || code === 53 || code === 55) return 'Drizzle';
        if (code === 61 || code === 63 || code === 65) return 'Rain';
        if (code === 71 || code === 73 || code === 75 || code === 77)
            return 'Snow';
        if (code === 80 || code === 81 || code === 82) return 'Rain';
        if (code === 85 || code === 86) return 'Snow';
        if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
        return 'Clouds';
    }

    getWeatherDescription(code) {
        const descriptions = {
            0: 'Jasno',
            1: 'Głównie jasno',
            2: 'Częściowo pochmurno',
            3: 'Pochmurno',
            45: 'Mgła',
            48: 'Mgła reniferowa',
            51: 'Lekka mżawka',
            53: 'Umiarkowana mżawka',
            55: 'Gęsta mżawka',
            61: 'Słaby deszcz',
            63: 'Umiarkowany deszcz',
            65: 'Intensywny deszcz',
            71: 'Słaby śnieg',
            73: 'Umiarkowany śnieg',
            75: 'Intensywny śnieg',
            77: 'Ziarno śniegu',
            80: 'Słabe przelotne opady',
            81: 'Umiarkowane przelotne opady',
            82: 'Intensywne przelotne opady',
            85: 'Lekkie przelotne opady śniegu',
            86: 'Intensywne przelotne opady śniegu',
            95: 'Burza',
            96: 'Burza z gradem',
            99: 'Burza z gradem',
        };
        return descriptions[code] || 'Zmienna pogoda';
    }

    async fetchWithTimeout(url, timeout = CONFIG.APP.TIMEOUT) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Timeout - bezpieczna cisza ⏱️');
            }
            throw error;
        }
    }

    isCached(key) {
        if (!this.cache.has(key)) return false;

        const cached = this.cache.get(key);
        const now = Date.now();
        const isExpired = now - cached.timestamp > CONFIG.APP.CACHE_DURATION;

        if (isExpired) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    clearCache() {
        this.cache.clear();
        this.cityCoordinates.clear();
        console.log('🗑️ Cache wyczyszczony');
    }

    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            citiesCount: this.cityCoordinates.size,
            cachedCities: Array.from(this.cityCoordinates.keys()),
        };
    }
}
export const weatherService = new WeatherService();
