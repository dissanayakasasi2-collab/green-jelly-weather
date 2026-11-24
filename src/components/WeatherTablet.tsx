import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Droplets,
  MapPin,
  RotateCcw,
  Thermometer,
  Umbrella,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { QueryLanguage, WeatherConditionType, WeatherForecastResult } from '../types/weather';
import { WeatherGraphics } from './WeatherGraphics';

interface WeatherTabletProps {
  forecast: WeatherForecastResult;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
  onReset: () => void;
  onSelectHour?: (hourLabel: string, isoTime: string) => void;
}

function getScreenBackdrop(condition: WeatherConditionType): string {
  switch (condition) {
    case 'sunny':
    case 'partly-cloudy':
      return 'from-sky-900/95 via-emerald-900/90 to-slate-900/95';
    case 'rainy':
      return 'from-slate-900 via-sky-950 to-slate-950';
    case 'thunderstorm':
      return 'from-slate-950 via-indigo-950 to-slate-950';
    case 'night-clear':
    case 'night-cloudy':
      return 'from-slate-950 via-emerald-950 to-slate-950';
    case 'foggy':
    case 'cloudy':
    default:
      return 'from-slate-800 via-emerald-950 to-slate-900';
  }
}

export function WeatherTablet({
  forecast,
  isSpeaking,
  onToggleSpeak,
  onReset,
  onSelectHour,
}: WeatherTabletProps) {
  const [displayLang, setDisplayLang] = useState<QueryLanguage>(forecast.parsedQuery.language);

  const isSi = displayLang === 'si';
  const timeLabel = isSi
    ? forecast.parsedQuery.requestedTimeLabelSi
    : forecast.parsedQuery.requestedTimeLabelEn;
  const conditionLabel = isSi ? forecast.conditionLabelSi : forecast.conditionLabelEn;
  const summaryText = isSi ? forecast.summarySi : forecast.summaryEn;

  return (
    <motion.div
      initial={{ y: 24, scale: 0.94, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="relative w-full max-w-xl mx-auto px-3 sm:px-6"
    >
      {/* Left Green Jelly Hand gripping tablet edge */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none select-none absolute -left-1 sm:left-0 top-1/2 -translate-y-1/2 z-20"
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 96" className="w-10 h-16 sm:w-14 sm:h-22 drop-shadow-lg">
          <defs>
            <radialGradient id="handGradL" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="55%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>
          </defs>
          {/* Suit sleeve & cuff */}
          <path d="M0 32 L22 30 L24 64 L0 66 Z" fill="#1e293b" />
          <path d="M18 30 L25 30 L26 64 L19 64 Z" fill="#f8fafc" />
          {/* Jelly palm & fingers wrapping onto bezel */}
          <rect x="20" y="25" width="34" height="44" rx="16" fill="url(#handGradL)" />
          <rect x="34" y="28" width="22" height="10" rx="5" fill="#4ade80" />
          <rect x="36" y="42" width="24" height="10" rx="5" fill="#4ade80" />
          <rect x="34" y="56" width="21" height="10" rx="5" fill="#4ade80" />
        </svg>
      </motion.div>

      {/* Right Green Jelly Hand gripping tablet edge */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="pointer-events-none select-none absolute -right-1 sm:right-0 top-1/2 -translate-y-1/2 z-20"
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 96" className="w-10 h-16 sm:w-14 sm:h-22 drop-shadow-lg">
          <defs>
            <radialGradient id="handGradR" cx="65%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="55%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>
          </defs>
          {/* Suit sleeve & cuff */}
          <path d="M64 32 L42 30 L40 64 L64 66 Z" fill="#1e293b" />
          <path d="M46 30 L39 30 L38 64 L45 64 Z" fill="#f8fafc" />
          {/* Jelly palm & fingers wrapping onto bezel */}
          <rect x="10" y="25" width="34" height="44" rx="16" fill="url(#handGradR)" />
          <rect x="8" y="28" width="22" height="10" rx="5" fill="#4ade80" />
          <rect x="4" y="42" width="24" height="10" rx="5" fill="#4ade80" />
          <rect x="9" y="56" width="21" height="10" rx="5" fill="#4ade80" />
        </svg>
      </motion.div>

      {/* Sleek Digital Tablet Bezel */}
      <div className="relative z-10 rounded-[28px] sm:rounded-[34px] bg-slate-900 p-2.5 sm:p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.48)] border border-slate-700/80">
        {/* Tablet Front Camera */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-1.5 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
          </div>
        </div>

        {/* Tablet Display Screen */}
        <div
          className={`rounded-[20px] sm:rounded-[24px] bg-gradient-to-br ${getScreenBackdrop(
            forecast.condition
          )} p-4 sm:p-6 text-slate-50 border border-white/10 overflow-hidden`}
        >
          {/* Top metadata bar inside tablet */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-200 text-xs sm:text-sm font-medium">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">{forecast.location.name}</span>
              </div>
              <div className="text-sm sm:text-base font-semibold text-white mt-0.5">
                {timeLabel}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language switcher inside tablet */}
              <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setDisplayLang('en')}
                  className={`px-2.5 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    displayLang === 'en'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayLang('si')}
                  className={`px-2.5 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    displayLang === 'si'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  සිංහල
                </button>
              </div>

              <button
                type="button"
                onClick={onToggleSpeak}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 transition-colors"
                aria-label={isSpeaking ? 'Stop voice summary' : 'Read weather summary aloud'}
                title={isSpeaking ? 'Stop speaking' : 'Speak summary'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Weather Hero inside Tablet */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 py-5">
            <div className="sm:col-span-5 flex justify-center">
              <WeatherGraphics condition={forecast.condition} />
            </div>

            <div className="sm:col-span-7 text-center sm:text-left">
              <div className="font-mono-tabular text-5xl sm:text-6xl font-bold tracking-tight text-white">
                {Math.round(forecast.temperature)}°C
              </div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-300 mt-1">
                {conditionLabel}
              </div>
            </div>
          </div>

          {/* Friendly Bilingual Summary */}
          <div className="rounded-xl bg-black/25 border border-white/10 px-4 py-3 text-sm sm:text-base leading-relaxed text-emerald-50">
            {summaryText}
          </div>

          {/* 4-column Clean Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <Thermometer className="w-4 h-4 text-emerald-300 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-300">
                  {isSi ? 'දැනෙන උෂ්ණත්වය' : 'Feels Like'}
                </div>
                <div className="font-mono-tabular text-sm font-semibold text-white">
                  {Math.round(forecast.apparentTemperature)}°C
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Umbrella className="w-4 h-4 text-sky-300 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-300">
                  {isSi ? 'වැසි අවස්ථාව' : 'Rain Chance'}
                </div>
                <div className="font-mono-tabular text-sm font-semibold text-white">
                  {forecast.precipitationProbability}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Wind className="w-4 h-4 text-teal-300 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-300">
                  {isSi ? 'සුළඟ' : 'Wind'}
                </div>
                <div className="font-mono-tabular text-sm font-semibold text-white">
                  {Math.round(forecast.windSpeed)} km/h
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Droplets className="w-4 h-4 text-cyan-300 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-300">
                  {isSi ? 'ආර්ද්‍රතාවය' : 'Humidity'}
                </div>
                <div className="font-mono-tabular text-sm font-semibold text-white">
                  {forecast.humidity}%
                </div>
              </div>
            </div>
          </div>

          {/* 6-Hour Quick Timeline inside Tablet */}
          {forecast.hourlyPreview.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs font-medium text-emerald-200/80 mb-2.5">
                {isSi ? 'පැය කිහිපයක පුරෝකථනය' : 'Surrounding Hours'}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {forecast.hourlyPreview.map((slot) => (
                  <button
                    key={slot.isoTime}
                    type="button"
                    onClick={() => onSelectHour?.(slot.hourLabel, slot.isoTime)}
                    className="flex flex-col items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 py-2 px-1.5 min-h-[44px] transition-colors text-center"
                  >
                    <span className="text-[11px] text-slate-300 whitespace-nowrap">
                      {slot.hourLabel}
                    </span>
                    <div className="my-0.5">
                      <WeatherGraphics condition={slot.condition} compact />
                    </div>
                    <span className="font-mono-tabular text-xs font-semibold text-white">
                      {slot.temperature}°
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Tablet Action */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSi ? 'තවත් ප්‍රශ්නයක් අසන්න' : 'Ask Another Question'}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
