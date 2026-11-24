import { ParsedWeatherQuery, QueryLanguage, WeatherConditionType } from '../types/weather';

const SINHALA_UNICODE_REGEX = /[\u0D80-\u0DFF]/;

const SINGLISH_KEYWORDS = [
  'mama',
  'dan',
  'inna',
  'thanata',
  'thana',
  'ada',
  'heta',
  'anidda',
  'havasa',
  'hawasa',
  'sawasa',
  'savasa',
  'ude',
  'udee',
  'uday',
  'dawal',
  'dawalta',
  'ra',
  'raa',
  'rathri',
  'kalagune',
  'kalagunaya',
  'kalaguna',
  'kohomada',
  'wessa',
  'wahinawada',
  'wahida',
  'rassne',
  'rasne',
  'seethala',
  'hulan',
];

export function detectLanguage(text: string, preferredLang: QueryLanguage = 'en'): QueryLanguage {
  if (SINHALA_UNICODE_REGEX.test(text)) {
    return 'si';
  }
  const normalized = text.toLowerCase();
  const tokens = normalized.split(/[\s,?!.]+/).filter(Boolean);
  const singlishHits = tokens.filter((t) => {
    const cleaned = t.replace(/(ta|ට|da|ද|wala|වල)$/g, '');
    return SINGLISH_KEYWORDS.includes(t) || SINGLISH_KEYWORDS.includes(cleaned);
  });

  if (singlishHits.length >= 1) {
    return 'si';
  }
  return preferredLang;
}

function getDayOffset(normalized: string): { dayOffset: number; explicitDayWord: boolean } {
  if (
    /\b(day after tomorrow|overmorrow|anidda)\b/.test(normalized) ||
    normalized.includes('අනිද්දා')
  ) {
    return { dayOffset: 2, explicitDayWord: true };
  }

  if (/\b(tomorrow|tmrw|tomoro|heta)\b/.test(normalized) || normalized.includes('හෙට')) {
    return { dayOffset: 1, explicitDayWord: true };
  }

  if (/\b(today|tonight|ada|adath)\b/.test(normalized) || normalized.includes('අද')) {
    return { dayOffset: 0, explicitDayWord: true };
  }

  // Check weekday names (English & Sinhala)
  const weekdaysEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekdaysSi = ['ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා'];
  const todayIndex = new Date().getDay();

  for (let i = 0; i < 7; i++) {
    if (normalized.includes(weekdaysEn[i]) || normalized.includes(weekdaysSi[i])) {
      let diff = i - todayIndex;
      if (diff <= 0) diff += 7;
      return { dayOffset: diff, explicitDayWord: true };
    }
  }

  return { dayOffset: 0, explicitDayWord: false };
}

function formatTime12Hour(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const minStr = minute.toString().padStart(2, '0');
  return `${h12}:${minStr} ${period}`;
}

function formatTimeLabelEn(dayOffset: number, hour: number, minute: number, isCurrent: boolean): string {
  if (isCurrent) return 'Right Now';
  const timeStr = formatTime12Hour(hour, minute);
  if (dayOffset === 0) return `Today · ${timeStr}`;
  if (dayOffset === 1) return `Tomorrow · ${timeStr}`;
  const target = new Date();
  target.setDate(target.getDate() + dayOffset);
  const dayName = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${dayName} · ${timeStr}`;
}

function formatTimeLabelSi(dayOffset: number, hour: number, minute: number, isCurrent: boolean): string {
  if (isCurrent) return 'මේ මොහොතේ';
  const minStr = minute.toString().padStart(2, '0');
  const h12 = hour % 12 === 0 ? 12 : hour % 12;

  let periodSi = 'උදේ';
  if (hour >= 12 && hour < 16) periodSi = 'දවල්';
  else if (hour >= 16 && hour < 19) periodSi = 'සවස';
  else if (hour >= 19 || hour < 4) periodSi = 'රාත්‍රී';
  else if (hour >= 4 && hour < 6) periodSi = 'පාන්දර';

  let daySi = 'අද';
  if (dayOffset === 1) {
    daySi = 'හෙට';
  } else if (dayOffset === 2) {
    daySi = 'අනිද්දා';
  } else if (dayOffset > 2) {
    const target = new Date();
    target.setDate(target.getDate() + dayOffset);
    const weekdaysSi = ['ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා'];
    daySi = weekdaysSi[target.getDay()];
  }

  return `${daySi} ${periodSi} ${h12}:${minStr}`;
}

export function parseWeatherQuery(
  rawQuery: string,
  preferredLang: QueryLanguage = 'en'
): ParsedWeatherQuery {
  const trimmed = rawQuery.trim();
  const normalized = trimmed.toLowerCase();
  const language = detectLanguage(trimmed, preferredLang);
  const now = new Date();

  const { dayOffset, explicitDayWord } = getDayOffset(normalized);

  const hasMorning =
    /\b(morning|am|ude|udee|uday|pandara)\b/.test(normalized) ||
    normalized.includes('උදේ') ||
    normalized.includes('උදෑසන') ||
    normalized.includes('පාන්දර');

  const hasNoon =
    /\b(noon|midday|afternoon|dawal|dawalta)\b/.test(normalized) ||
    normalized.includes('දවල්') ||
    normalized.includes('මධ්‍යාහ්න');

  const hasEvening =
    /\b(evening|pm|havasa|hawasa|sawasa|savasa)\b/.test(normalized) ||
    normalized.includes('සවස') ||
    normalized.includes('හවස');

  const hasNight =
    /\b(night|tonight|midnight|ra|raa|rathri)\b/.test(normalized) ||
    normalized.includes('රෑ') ||
    normalized.includes('රාත්‍රී');

  const hasExplicitNow =
    /\b(now|currently|right now|dan|daan)\b/.test(normalized) || normalized.includes('දැන්');

  // Match time expressions like 5.30, 5:30, 5.30ta, 17:30, 5 pm, 5pm, 5ට
  const timeRegex = /\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|ta|ට)?\b/gi;
  const matches = Array.from(normalized.matchAll(timeRegex));

  let matchedHour: number | null = null;
  let matchedMinute = 0;
  let explicitMeridiem: 'am' | 'pm' | null = null;

  for (const m of matches) {
    const rawH = parseInt(m[1], 10);
    const rawMin = m[2] ? parseInt(m[2], 10) : 0;
    const suffix = (m[3] || '').replace(/\./g, '').toLowerCase();

    if (rawH >= 0 && rawH <= 23 && rawMin >= 0 && rawMin <= 59) {
      // Avoid matching random numbers unless they have : / . / am / pm / ta / ට or time context
      const hasSeparatorOrSuffix = Boolean(m[2] || suffix);
      const hasTimeContext = hasMorning || hasNoon || hasEvening || hasNight || /\b(at|around|by|time)\b/.test(normalized);

      if (hasSeparatorOrSuffix || hasTimeContext) {
        matchedHour = rawH;
        matchedMinute = rawMin;
        if (suffix === 'am') explicitMeridiem = 'am';
        if (suffix === 'pm') explicitMeridiem = 'pm';
        break;
      }
    }
  }

  let hour = now.getHours();
  let minute = now.getMinutes();
  let isCurrent = false;

  if (matchedHour !== null) {
    hour = matchedHour;
    minute = matchedMinute;

    if (explicitMeridiem === 'pm' && hour < 12) {
      hour += 12;
    } else if (explicitMeridiem === 'am' && hour === 12) {
      hour = 0;
    } else if (!explicitMeridiem && hour <= 12) {
      if (hasEvening && hour >= 1 && hour <= 11) {
        hour += 12;
      } else if (hasNight && hour >= 5 && hour <= 11) {
        hour += 12;
      } else if (hasNight && hour === 12) {
        hour = 0;
      } else if (hasNoon && hour >= 1 && hour <= 5) {
        hour += 12;
      } else if (hasMorning && hour === 12) {
        hour = 0;
      } else if (!hasMorning && !hasNoon && !hasEvening && !hasNight && dayOffset === 0) {
        // If user just said "at 5:30" today and 5:30 AM already passed, assume 5:30 PM
        if (hour < 12 && hour < now.getHours()) {
          hour += 12;
        }
      }
    }
  } else if (hasMorning) {
    hour = 8;
    minute = 0;
  } else if (hasNoon) {
    hour = 13;
    minute = 0;
  } else if (hasEvening) {
    hour = 17;
    minute = 30;
  } else if (hasNight) {
    hour = 20;
    minute = 30;
  } else if (explicitDayWord && dayOffset > 0) {
    hour = 9;
    minute = 0;
  } else if (hasExplicitNow || !trimmed) {
    isCurrent = true;
  } else {
    isCurrent = true;
  }

  // If computed target time for today is within ~20 minutes of current time and no explicit future time, treat as current
  if (!isCurrent && dayOffset === 0 && matchedHour === null && !hasMorning && !hasNoon && !hasEvening && !hasNight) {
    isCurrent = true;
  }

  return {
    rawQuery: trimmed,
    language,
    isCurrent,
    dayOffset,
    hour,
    minute,
    requestedTimeLabelEn: formatTimeLabelEn(dayOffset, hour, minute, isCurrent),
    requestedTimeLabelSi: formatTimeLabelSi(dayOffset, hour, minute, isCurrent),
  };
}

export function mapWmoToCondition(
  code: number,
  isDay: boolean,
  windSpeed: number
): { condition: WeatherConditionType; labelEn: string; labelSi: string } {
  // Thunderstorm
  if ([95, 96, 99].includes(code)) {
    return {
      condition: 'thunderstorm',
      labelEn: 'Thunderstorm',
      labelSi: 'ගිගුරුම් සහිත වැසි',
    };
  }

  // Rain / Drizzle / Showers
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      condition: 'rainy',
      labelEn: code >= 63 || code >= 81 ? 'Rain Showers' : 'Light Rain',
      labelSi: code >= 63 || code >= 81 ? 'තද වැසි' : 'සැහැල්ලු වැසි',
    };
  }

  // Fog
  if ([45, 48].includes(code)) {
    return {
      condition: 'foggy',
      labelEn: 'Foggy & Misty',
      labelSi: 'මීදුම සහිත',
    };
  }

  // Strong wind override for clear/cloudy skies
  if (windSpeed >= 28 && [0, 1, 2, 3].includes(code)) {
    return {
      condition: 'windy',
      labelEn: 'Breezy & Windy',
      labelSi: 'තද සුළං සහිත',
    };
  }

  // Clear sky
  if (code === 0 || code === 1) {
    if (!isDay) {
      return {
        condition: 'night-clear',
        labelEn: 'Clear Night',
        labelSi: 'පැහැදිලි රාත්‍රිය',
      };
    }
    return {
      condition: code === 0 ? 'sunny' : 'partly-cloudy',
      labelEn: code === 0 ? 'Clear & Sunny' : 'Mostly Sunny',
      labelSi: code === 0 ? 'පැහැදිලි හිරු එළිය' : 'බොහෝ දුරට පැහැදිලි',
    };
  }

  // Partly cloudy
  if (code === 2) {
    return {
      condition: isDay ? 'partly-cloudy' : 'night-cloudy',
      labelEn: 'Partly Cloudy',
      labelSi: 'වළාකුළු සහිතයි',
    };
  }

  // Overcast / Cloudy
  return {
    condition: isDay ? 'cloudy' : 'night-cloudy',
    labelEn: 'Overcast Clouds',
    labelSi: 'ඝන වළාකුළු සහිතයි',
  };
}

export function buildFriendlySummary(params: {
  language: QueryLanguage;
  locationName: string;
  timeLabelEn: string;
  timeLabelSi: string;
  temperature: number;
  condition: WeatherConditionType;
  precipitationProbability: number;
  windSpeed: number;
}): { summaryEn: string; summarySi: string } {
  const tempRounded = Math.round(params.temperature);
  const rainChance = Math.round(params.precipitationProbability);

  let adviceEn = 'Comfortable conditions outside.';
  let adviceSi = 'පිටත කාලගුණය බොහෝ දුරට සුවපහසුයි.';

  switch (params.condition) {
    case 'sunny':
      adviceEn =
        tempRounded >= 30
          ? 'Bright sunshine and warm air—stay hydrated and wear sunglasses.'
          : 'Lovely sunny skies ahead! Great weather to be outdoors.';
      adviceSi =
        tempRounded >= 30
          ? 'හොඳටම හිරු එළිය තියෙන උණුසුම් කාලගුණයක්. වතුර ටිකක් වැඩිපුර බොන්න.'
          : 'හිරු එළිය සහිත පැහැදිලි කාලගුණයක්. එළියට යන්න හොඳම වෙලාවක්!';
      break;
    case 'partly-cloudy':
      adviceEn = 'Sunbeams peeking through soft clouds with mild warmth.';
      adviceSi = 'වළාකුළු අතරින් හිරු එළිය වැටෙන ප්‍රසන්න කාලගුණයක්.';
      break;
    case 'cloudy':
      adviceEn = 'Cloudy skies will keep direct heat away.';
      adviceSi = 'අහස වළාකුළින් බර වී ඇති නිසා දැඩි රස්නයක් නැහැ.';
      break;
    case 'rainy':
      adviceEn = `Rain is expected (${rainChance}% chance)—keep an umbrella handy!`;
      adviceSi = `වැසි ඇතිවීමේ හැකියාව ${rainChance}% ක් තියෙනවා—කුඩයක් අරගෙන යන්න අමතක කරන්න එපා!`;
      break;
    case 'thunderstorm':
      adviceEn = 'Thunderstorms and lightning expected—best to stay indoors if you can.';
      adviceSi = 'ගිගුරුම් සහිත තද වැසි ඇතිවිය හැකියි—පුළුවන් නම් ආරක්ෂිතව ගෘහස්ථව ඉන්න.';
      break;
    case 'windy':
      adviceEn = `Brisk winds around ${Math.round(params.windSpeed)} km/h—hold onto your hat!`;
      adviceSi = `පැයට කිලෝමීටර ${Math.round(params.windSpeed)} ක පමණ තද සුළඟක් හමනවා.`;
      break;
    case 'foggy':
      adviceEn = 'Misty conditions with reduced visibility—travel carefully.';
      adviceSi = 'මීදුම සහිත නිසා ගමන් බිමන් වලදී ප්‍රවේශම් වෙන්න.';
      break;
    case 'night-clear':
      adviceEn = 'Calm, starry night skies with pleasant evening air.';
      adviceSi = 'තරු පිරුණු පැහැදිලි, සන්සුන් රාත්‍රී කාලගුණයක්.';
      break;
    case 'night-cloudy':
      adviceEn = 'Quiet cloudy night ahead with gentle temperatures.';
      adviceSi = 'වළාකුළු සහිත සිසිල් රාත්‍රියක්.';
      break;
  }

  return {
    summaryEn: `In ${params.locationName} (${params.timeLabelEn}), it will be ${tempRounded}°C. ${adviceEn}`,
    summarySi: `${params.timeLabelSi} වන විට ${params.locationName} ප්‍රදේශයේ උෂ්ණත්වය ${tempRounded}°C ක් පමණ වේ. ${adviceSi}`,
  };
}
