export type AssistantState = 'idle' | 'listening' | 'loading' | 'result' | 'error';

export type QueryLanguage = 'en' | 'si';

export type WeatherConditionType =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rainy'
  | 'thunderstorm'
  | 'windy'
  | 'foggy'
  | 'night-clear'
  | 'night-cloudy';

export interface ParsedWeatherQuery {
  rawQuery: string;
  language: QueryLanguage;
  isCurrent: boolean;
  dayOffset: number; // 0 = today, 1 = tomorrow, 2 = day after tomorrow, etc.
  hour: number; // 0 - 23
  minute: number; // 0 - 59
  requestedTimeLabelEn: string;
  requestedTimeLabelSi: string;
  explicitLocation?: string;
}

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  name: string;
  region?: string;
  country?: string;
  source: 'gps' | 'search' | 'fallback';
}

export interface HourlySlot {
  isoTime: string;
  hourLabel: string;
  temperature: number;
  weatherCode: number;
  condition: WeatherConditionType;
  precipitationProbability: number;
  isDay: boolean;
}

export interface WeatherForecastResult {
  location: GeoLocationData;
  parsedQuery: ParsedWeatherQuery;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitationProbability: number;
  weatherCode: number;
  condition: WeatherConditionType;
  isDay: boolean;
  conditionLabelEn: string;
  conditionLabelSi: string;
  summaryEn: string;
  summarySi: string;
  hourlyPreview: HourlySlot[];
  fetchedAt: string;
}
