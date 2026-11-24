import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LocateFixed,
  MapPin,
  Mic,
  MicOff,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { GreenJellyCharacter } from './components/GreenJellyCharacter';
import { WeatherTablet } from './components/WeatherTablet';
import {
  fetchWeatherForQuery,
  getCurrentBrowserCoordinates,
  reverseGeocode,
  searchLocations,
} from './services/weatherService';
import {
  AssistantState,
  GeoLocationData,
  QueryLanguage,
  WeatherForecastResult,
} from './types/weather';
import { parseWeatherQuery } from './utils/nlParser';

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    isFinal: boolean;
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

const SAMPLE_QUERIES: { label: string; query: string; lang: QueryLanguage }[] = [
  {
    label: 'Ada havasa 5.30ta kalagune kohomada?',
    query: 'Mama dan inna thanata ada havasa 5.30ta kalagune kohomada?',
    lang: 'si',
  },
  {
    label: 'Weather at 5:30 PM today?',
    query: 'What is the weather at my location at 5:30 PM today?',
    lang: 'en',
  },
  {
    label: 'Tomorrow morning weather',
    query: 'What will the weather be like tomorrow morning?',
    lang: 'en',
  },
  {
    label: 'හෙට උදේ කාලගුණය කොහොමද?',
    query: 'හෙට උදේ කාලගුණය කොහොමද?',
    lang: 'si',
  },
];

export default function App() {
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [voiceLang, setVoiceLang] = useState<QueryLanguage>('en');
  const [textQuery, setTextQuery] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [location, setLocation] = useState<GeoLocationData | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [forecast, setForecast] = useState<WeatherForecastResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Location Picker Modal state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [citySearchInput, setCitySearchInput] = useState('');
  const [citySearchResults, setCitySearchResults] = useState<GeoLocationData[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const speechSupported =
    typeof window !== 'undefined' && Boolean(getSpeechRecognitionConstructor());

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback((text: string, lang: QueryLanguage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'si' ? 'si-LK' : 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, []);

  const resolveUserGpsLocation = useCallback(async (): Promise<GeoLocationData> => {
    setIsLocating(true);
    try {
      const coords = await getCurrentBrowserCoordinates();
      const resolved = await reverseGeocode(coords.latitude, coords.longitude);
      setLocation(resolved);
      return resolved;
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Attempt non-intrusive GPS resolution on mount if already granted
  useEffect(() => {
    let active = true;
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((perm) => {
          if (active && perm.state === 'granted') {
            resolveUserGpsLocation().catch(() => {});
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      stopSpeaking();
      recognitionRef.current?.abort();
    };
  }, [resolveUserGpsLocation, stopSpeaking]);

  const executeWeatherLookup = useCallback(
    async (rawQuery: string, preferredLang: QueryLanguage) => {
      const cleaned = rawQuery.trim();
      if (!cleaned) return;

      stopSpeaking();
      setErrorMessage(null);
      setStatusMessage(
        preferredLang === 'si'
          ? 'ඔබගේ ස්ථානය සහ කාලගුණ දත්ත පරීක්ෂා කරමින්...'
          : 'Checking your location and live forecast...'
      );
      setAssistantState('loading');

      try {
        let activeLocation = location;
        if (!activeLocation) {
          try {
            activeLocation = await resolveUserGpsLocation();
          } catch (geoErr) {
            const msg =
              geoErr instanceof Error
                ? geoErr.message
                : 'Location access is required.';
            setErrorMessage(
              `${msg} Please allow location access or choose a city in Location.`
            );
            setAssistantState('idle');
            setStatusMessage(null);
            setIsLocationModalOpen(true);
            return;
          }
        }

        const parsed = parseWeatherQuery(cleaned, preferredLang);
        const weatherResult = await fetchWeatherForQuery(activeLocation, parsed);
        setForecast(weatherResult);
        setAssistantState('result');
        setStatusMessage(null);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to fetch weather right now. Please try again.';
        setErrorMessage(msg);
        setAssistantState('error');
        setStatusMessage(null);
      }
    },
    [location, resolveUserGpsLocation, stopSpeaking]
  );

  const handleMicToggle = () => {
    if (assistantState === 'listening') {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechCtor = getSpeechRecognitionConstructor();
    if (!SpeechCtor) {
      setErrorMessage(
        'Voice recognition is not supported in this browser. Please type your question below.'
      );
      return;
    }

    stopSpeaking();
    setErrorMessage(null);
    setLiveTranscript('');
    latestTranscriptRef.current = '';

    try {
      const recognition = new SpeechCtor();
      recognition.lang = voiceLang === 'si' ? 'si-LK' : 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = '';
        let finalStr = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const txt = res[0]?.transcript || '';
          if (res.isFinal) {
            finalStr += txt;
          } else {
            interim += txt;
          }
        }
        const combined = (finalStr || interim).trim();
        latestTranscriptRef.current = combined;
        setLiveTranscript(combined);

        if (finalStr.trim()) {
          setTextQuery(finalStr.trim());
          recognition.stop();
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage(
            'Microphone access was denied. You can enable it or type your question below.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMessage(
            voiceLang === 'si'
              ? 'හඬක් හඳුනාගත නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.'
              : 'No speech detected. Tap the mic and speak clearly, or type below.'
          );
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Voice error (${event.error}). Please try typing your query.`);
        }
        setAssistantState('idle');
      };

      recognition.onend = () => {
        const spoken = latestTranscriptRef.current.trim();
        recognitionRef.current = null;
        if (spoken) {
          setTextQuery(spoken);
          executeWeatherLookup(spoken, voiceLang);
        } else {
          setAssistantState((prev) => (prev === 'listening' ? 'idle' : prev));
        }
      };

      recognitionRef.current = recognition;
      setAssistantState('listening');
      recognition.start();
    } catch {
      setErrorMessage('Could not start microphone. Please use the text box below.');
      setAssistantState('idle');
    }
  };

  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!textQuery.trim()) return;
    executeWeatherLookup(textQuery, voiceLang);
  };

  const handleSampleClick = (sample: { query: string; lang: QueryLanguage }) => {
    setVoiceLang(sample.lang);
    setTextQuery(sample.query);
    executeWeatherLookup(sample.query, sample.lang);
  };

  const handleResetToIdle = () => {
    stopSpeaking();
    setForecast(null);
    setLiveTranscript('');
    setErrorMessage(null);
    setStatusMessage(null);
    setAssistantState('idle');
  };

  const handleSelectHourFromTablet = (hourLabel: string) => {
    if (!forecast) return;
    const queryText =
      forecast.parsedQuery.dayOffset === 1
        ? `Tomorrow at ${hourLabel}`
        : `Today at ${hourLabel}`;
    executeWeatherLookup(queryText, forecast.parsedQuery.language);
  };

  const handleCitySearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!citySearchInput.trim()) return;
    setIsSearchingCities(true);
    try {
      const results = await searchLocations(citySearchInput);
      setCitySearchResults(results);
    } catch {
      setCitySearchResults([]);
    } finally {
      setIsSearchingCities(false);
    }
  };

  const handleUseGpsFromModal = async () => {
    try {
      const resolved = await resolveUserGpsLocation();
      setIsLocationModalOpen(false);
      setErrorMessage(null);
      if (forecast) {
        executeWeatherLookup(forecast.parsedQuery.rawQuery, forecast.parsedQuery.language);
      } else if (textQuery.trim()) {
        executeWeatherLookup(textQuery, voiceLang);
      } else {
        setStatusMessage(`Location set to ${resolved.name}`);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to access GPS location.'
      );
    }
  };

  const handlePickManualCity = (picked: GeoLocationData) => {
    setLocation(picked);
    setIsLocationModalOpen(false);
    setErrorMessage(null);
    if (forecast) {
      fetchWeatherForQuery(picked, forecast.parsedQuery)
        .then(setForecast)
        .catch(() => {});
    } else if (textQuery.trim()) {
      executeWeatherLookup(textQuery, voiceLang);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[radial-gradient(ellipse_at_top,_#10b981_0%,_#065f46_38%,_#022c22_100%)] text-emerald-50 selection:bg-emerald-300 selection:text-emerald-950">
      {/* Compact Single-Row Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleResetToIdle}
          className="text-xl sm:text-2xl font-extrabold tracking-tight text-white hover:text-emerald-200 transition-colors whitespace-nowrap shrink-0 text-left"
        >
          Green Jelly
        </button>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Voice Recognition Language Switcher */}
          <div
            className="flex items-center bg-emerald-950/60 border border-emerald-400/25 rounded-xl p-1"
            role="group"
            aria-label="Voice recognition language"
          >
            <button
              type="button"
              onClick={() => setVoiceLang('en')}
              className={`px-3 py-1.5 min-h-[36px] text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                voiceLang === 'en'
                  ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setVoiceLang('si')}
              className={`px-3 py-1.5 min-h-[36px] text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                voiceLang === 'si'
                  ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              සිංහල
            </button>
          </div>

          {/* Location Button */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 min-h-[44px] rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-400/25 text-xs sm:text-sm font-medium text-emerald-100 transition-colors max-w-[160px] sm:max-w-[240px]"
          >
            <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="truncate">
              {isLocating
                ? 'Locating...'
                : location
                  ? location.name
                  : 'Set Location'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Centered Interactive Stage */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pb-10 pt-2 flex flex-col items-center justify-center">
        {/* Headline / Prompt Context */}
        <div className="text-center max-w-2xl mb-3 sm:mb-5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
            {assistantState === 'listening'
              ? voiceLang === 'si'
                ? 'මම හොඳින් අහගෙන ඉන්නවා...'
                : 'Listening carefully...'
              : assistantState === 'result' && forecast
                ? voiceLang === 'si'
                  ? 'මෙන්න ඔබ ඇසූ කාලගුණ තොරතුරු'
                  : "Here's your weather forecast"
                : voiceLang === 'si'
                  ? 'කාලගුණය ගැන මගෙන් අහන්න'
                  : 'Ask Green Jelly about the weather'}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-emerald-100/85">
            {assistantState === 'listening'
              ? liveTranscript
                ? `"${liveTranscript}"`
                : voiceLang === 'si'
                  ? 'උදා: "මම දැන් ඉන්න තැනට අද හවස 5.30ට කාලගුණය කොහොමද?"'
                  : 'Try: "What is the weather at my location at 5:30 PM today?"'
              : assistantState === 'loading'
                ? statusMessage
                : assistantState === 'result'
                  ? null
                  : voiceLang === 'si'
                    ? 'මයික්‍රොෆෝනය ඔබා සිංහලෙන් හෝ ඉංග්‍රීසියෙන් විමසන්න'
                    : 'Tap the microphone and speak in English or Sinhala, or type below'}
          </p>
        </div>

        {/* Character + Tablet Stage */}
        <div className="w-full flex flex-col items-center justify-center">
          <GreenJellyCharacter state={assistantState} />

          <AnimatePresence mode="wait">
            {assistantState === 'result' && forecast ? (
              <WeatherTablet
                key="tablet-result"
                forecast={forecast}
                isSpeaking={isSpeaking}
                onToggleSpeak={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    const textToSpeak =
                      forecast.parsedQuery.language === 'si'
                        ? forecast.summarySi
                        : forecast.summaryEn;
                    speakText(textToSpeak, forecast.parsedQuery.language);
                  }
                }}
                onReset={handleResetToIdle}
                onSelectHour={handleSelectHourFromTablet}
              />
            ) : (
              <motion.div
                key="voice-controls"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-xl flex flex-col items-center mt-2"
              >
                {/* Prominent Microphone Button directly below Green Jelly */}
                <div className="relative flex flex-col items-center">
                  {assistantState === 'listening' && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-emerald-300/35"
                      animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    disabled={assistantState === 'loading'}
                    aria-label={
                      assistantState === 'listening'
                        ? 'Stop listening'
                        : 'Activate voice weather assistant'
                    }
                    className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-[0_14px_34px_rgba(0,0,0,0.35)] border-4 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                      assistantState === 'listening'
                        ? 'bg-rose-500 hover:bg-rose-400 border-rose-200 text-white'
                        : 'bg-emerald-400 hover:bg-emerald-300 border-emerald-100 text-emerald-950'
                    } disabled:opacity-60`}
                  >
                    {assistantState === 'listening' ? (
                      <MicOff className="w-8 h-8 sm:w-10 sm:h-10" />
                    ) : (
                      <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                    )}
                  </button>
                  <span className="mt-2.5 text-xs sm:text-sm font-semibold text-emerald-100">
                    {assistantState === 'listening'
                      ? voiceLang === 'si'
                        ? 'නවත්වන්න ඔබන්න'
                        : 'Tap to stop'
                      : speechSupported
                        ? voiceLang === 'si'
                          ? 'කතා කිරීමට ඔබන්න (සිංහල)'
                          : 'Tap to speak (English)'
                        : 'Voice unavailable · Type below'}
                  </span>
                </div>

                {/* Error Alert if any */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="mt-4 w-full rounded-2xl bg-rose-950/75 border border-rose-400/40 px-4 py-3 text-sm text-rose-100 text-center"
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Fallback Text Input Box */}
                <form
                  onSubmit={handleTextSubmit}
                  className="mt-5 w-full flex items-center gap-2 bg-emerald-950/70 border border-emerald-300/25 rounded-2xl p-2 shadow-lg focus-within:border-emerald-300 transition-colors"
                >
                  <input
                    type="text"
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    placeholder={
                      voiceLang === 'si'
                        ? 'මෙතන ටයිප් කරන්න... (උදා: ada havasa 5.30ta kalagune kohomada?)'
                        : 'Or type a weather question... (e.g., today at 5:30 PM)'
                    }
                    className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder:text-emerald-200/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!textQuery.trim() || assistantState === 'loading'}
                    className="min-h-[44px] px-4 sm:px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-45 text-emerald-950 font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {voiceLang === 'si' ? 'අහන්න' : 'Ask'}
                    </span>
                  </button>
                </form>

                {/* Quick Example Prompts */}
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-200/75 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {voiceLang === 'si' ? 'උදාහරණ ප්‍රශ්න උත්සාහ කරන්න:' : 'Try asking:'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SAMPLE_QUERIES.map((sample) => (
                      <button
                        key={sample.query}
                        type="button"
                        onClick={() => handleSampleClick(sample)}
                        className="text-left px-3.5 py-2.5 min-h-[44px] rounded-xl bg-emerald-900/45 hover:bg-emerald-800/65 border border-emerald-300/20 text-xs sm:text-sm text-emerald-50 transition-colors truncate"
                      >
                        “{sample.label}”
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Location Picker Modal (GPS or Manual City Fallback) */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsLocationModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-400/25 p-5 sm:p-6 text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Your Weather Location</h2>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:bg-white/10"
                  aria-label="Close location dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleUseGpsFromModal}
                disabled={isLocating}
                className="mt-4 w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <LocateFixed className="w-4 h-4" />
                <span>{isLocating ? 'Detecting GPS...' : 'Use My Current GPS Location'}</span>
              </button>

              <div className="mt-5">
                <label htmlFor="city-search" className="block text-xs font-medium text-slate-300 mb-2">
                  Or search a city manually
                </label>
                <form onSubmit={handleCitySearch} className="flex items-center gap-2">
                  <input
                    id="city-search"
                    type="text"
                    value={citySearchInput}
                    onChange={(e) => setCitySearchInput(e.target.value)}
                    placeholder="Colombo, Kandy, Galle, London..."
                    className="flex-1 min-w-0 rounded-xl bg-slate-800 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingCities}
                    className="min-h-[44px] px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    <span>Find</span>
                  </button>
                </form>

                {citySearchResults.length > 0 && (
                  <div className="mt-3 divide-y divide-white/10 rounded-xl bg-slate-800/70 border border-white/10 overflow-hidden">
                    {citySearchResults.map((city, idx) => (
                      <button
                        key={`${city.latitude}-${city.longitude}-${idx}`}
                        type="button"
                        onClick={() => handlePickManualCity(city)}
                        className="w-full text-left px-4 py-3 min-h-[44px] hover:bg-emerald-500/20 flex items-center justify-between gap-2 text-sm transition-colors"
                      >
                        <span className="font-medium text-white truncate">{city.name}</span>
                        <span className="text-xs text-slate-400 truncate">
                          {[city.region, city.country].filter(Boolean).join(', ')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
