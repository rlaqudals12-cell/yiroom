/**
 * 날씨 모듈 공개 API
 */

export { useWeather } from './useWeather';
export {
  getWeatherByRegion,
  findNearestRegion,
  generateMockWeather,
  clearWeatherCache,
} from './weatherService';
export type {
  KoreaRegion,
  WeatherData,
  CurrentWeather,
  HourlyForecast,
} from './types';
export { REGION_INFO, WEATHER_CACHE_TTL_MS } from './types';
