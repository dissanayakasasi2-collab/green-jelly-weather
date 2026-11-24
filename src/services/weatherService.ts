import {
  GeoLocationData,
  HourlySlot,
  ParsedWeatherQuery,
  WeatherForecastResult,
} from '../types/weather';
import { buildFriendlySummary, mapWmoToCondition } from '../utils/nlParser';

export async function getCurrentBrowserCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Location permission was denied.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Location request timed out.'));
        } else {
          reject(new Error('Unable to determine your current location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoLocationData> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      latitude
    )}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Reverse geocode failed');
    const data = await res.json();

    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      'Your Location';
    const country = data.countryName || '';

    return {
      latitude,
      longitude,
      name: city,
      region: data.principalSubdivision || '',
      country,
      source: 'gps',
    };
  } catch {
    return {
      latitude,
      longitude,
      name: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
      source: 'gps',
    };
  }
}

export async function searchLocations(query: string): Promise<GeoLocationData[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cleaned
  )}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Location search failed');
  const data = await res.json();

  if (!Array.isArray(data.results)) return [];

  return data.results.map(
    (item: {
      latitude: number;
      longitude: number;
      name: string;
      admin1?: string;
      country?: string;
    }) => ({
      latitude: item.latitude,
      longitude: item.longitude,
      name: item.name,
      region: item.admin1,
      country: item.country,
      source: 'search' as const,
    })
  );
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    is_day: number[];
  };
}

function getTargetDateString(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchWeatherForQuery(
  location: GeoLocationData,
  parsedQuery: ParsedWeatherQuery
): Promise<WeatherForecastResult> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
    `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,is_day` +
    `&timezone=auto&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Could not fetch real-time weather data from Open-Meteo.');
  }

  const data: OpenMeteoResponse = await res.json();
  const { hourly, current } = data;

  const targetDateStr = getTargetDateString(parsedQuery.dayOffset);
  const targetHourPadded = String(parsedQuery.hour).padStart(2, '0');
  const targetIsoPrefix = `${targetDateStr}T${targetHourPadded}:00`;

  let index = hourly.time.findIndex((t) => t === targetIsoPrefix);
  if (index === -1) {
    const nowHourPrefix = `${getTargetDateString(0)}T${String(new Date().getHours()).padStart(2, '0')}:00`;
    index = Math.max(0, hourly.time.findIndex((t) => t === nowHourPrefix));
  }

  let temperature: number;
  let apparentTemperature: number;
  let humidity: number;
  let windSpeed: number;
  let precipitationProbability: number;
  let weatherCode: number;
  let isDay: boolean;

  if (parsedQuery.isCurrent && current) {
    temperature = current.temperature_2m;
    apparentTemperature = current.apparent_temperature;
    humidity = current.relative_humidity_2m;
    windSpeed = current.wind_speed_10m;
    weatherCode = current.weather_code;
    isDay = current.is_day === 1;
    precipitationProbability = hourly.precipitation_probability[index] ?? 0;
  } else {
    // Interpolate with next hour if user requested e.g. 5:30 PM
    const nextIdx = Math.min(index + 1, hourly.time.length - 1);
    const weight = parsedQuery.minute / 60;

    temperature =
      hourly.temperature_2m[index] * (1 - weight) + hourly.temperature_2m[nextIdx] * weight;
    apparentTemperature =
      hourly.apparent_temperature[index] * (1 - weight) +
      hourly.apparent_temperature[nextIdx] * weight;
    humidity = Math.round(
      hourly.relative_humidity_2m[index] * (1 - weight) +
        hourly.relative_humidity_2m[nextIdx] * weight
    );
    windSpeed =
      hourly.wind_speed_10m[index] * (1 - weight) + hourly.wind_speed_10m[nextIdx] * weight;
    precipitationProbability = Math.round(
      hourly.precipitation_probability[index] * (1 - weight) +
        hourly.precipitation_probability[nextIdx] * weight
    );
    const pickIdx = weight >= 0.5 ? nextIdx : index;
    weatherCode = hourly.weather_code[pickIdx];
    isDay = hourly.is_day[pickIdx] === 1;
  }

  const mapped = mapWmoToCondition(weatherCode, isDay, windSpeed);
  const displayPlace = location.country ? `${location.name}, ${location.country}` : location.name;

  const { summaryEn, summarySi } = buildFriendlySummary({
    language: parsedQuery.language,
    locationName: location.name,
    timeLabelEn: parsedQuery.requestedTimeLabelEn,
    timeLabelSi: parsedQuery.requestedTimeLabelSi,
    temperature,
    condition: mapped.condition,
    precipitationProbability,
    windSpeed,
  });

  // Build 6-hour timeline starting 1 hour before target index (or at 0)
  const startPreview = Math.max(0, index - 1);
  const hourlyPreview: HourlySlot[] = hourly.time
    .slice(startPreview, startPreview + 6)
    .map((iso, offset) => {
      const i = startPreview + offset;
      const hCode = hourly.weather_code[i];
      const hDay = hourly.is_day[i] === 1;
      const hWind = hourly.wind_speed_10m[i];
      const hMapped = mapWmoToCondition(hCode, hDay, hWind);
      const hourNum = parseInt(iso.slice(11, 13), 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const h12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
      return {
        isoTime: iso,
        hourLabel: `${h12} ${ampm}`,
        temperature: Math.round(hourly.temperature_2m[i]),
        weatherCode: hCode,
        condition: hMapped.condition,
        precipitationProbability: hourly.precipitation_probability[i] ?? 0,
        isDay: hDay,
      };
    });

  return {
    location: {
      ...location,
      name: displayPlace,
    },
    parsedQuery,
    temperature,
    apparentTemperature,
    humidity,
    windSpeed,
    precipitationProbability,
    weatherCode,
    condition: mapped.condition,
    isDay,
    conditionLabelEn: mapped.labelEn,
    conditionLabelSi: mapped.labelSi,
    summaryEn,
    summarySi,
    hourlyPreview,
    fetchedAt: new Date().toISOString(),
  };
}
