import { motion } from 'motion/react';
import { AssistantState } from '../types/weather';

interface GreenJellyCharacterProps {
  state: AssistantState;
}

export function GreenJellyCharacter({ state }: GreenJellyCharacterProps) {
  const isListening = state === 'listening';
  const isLoading = state === 'loading';
  const isHoldingTablet = state === 'result';

  // In 'result' state, Green Jelly sits right above the tablet peeking happily,
  // while its two hands grip the left & right edges of the tablet (rendered in WeatherTablet).
  if (isHoldingTablet) {
    return (
      <motion.div
        initial={{ y: 12, opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="relative z-10 flex justify-center pointer-events-none select-none -mb-5 sm:-mb-6"
      >
        <motion.svg
          viewBox="0 0 240 132"
          className="w-44 h-24 sm:w-56 sm:h-30 overflow-visible drop-shadow-[0_12px_20px_rgba(0,0,0,0.28)]"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          aria-label="Green Jelly smiling above the digital weather tablet"
        >
          <JellyDefs />
          {/* Cute bouncy green jelly head peeking */}
          <path
            d="M58 118 C54 58, 72 16, 120 16 C168 16, 186 58, 182 118 Z"
            fill="url(#jellyBodyGrad)"
          />
          {/* Glossy jelly specular highlight */}
          <ellipse
            cx="93"
            cy="42"
            rx="18"
            ry="8"
            transform="rotate(-24 93 42)"
            fill="#ffffff"
            opacity="0.45"
          />
          <circle cx="77" cy="56" r="4" fill="#ffffff" opacity="0.35" />

          {/* Smart suit collar & tie peek */}
          <path d="M74 118 L92 103 L120 124 L148 103 L166 118 Z" fill="#1e293b" />
          <path d="M98 106 L120 124 L142 106 L120 112 Z" fill="#f8fafc" />
          <polygon points="116,112 124,112 126,125 120,130 114,125" fill="#eab308" />

          {/* Rosy cheeks */}
          <ellipse cx="78" cy="84" rx="8" ry="4.5" fill="#4ade80" opacity="0.65" />
          <ellipse cx="162" cy="84" rx="8" ry="4.5" fill="#4ade80" opacity="0.65" />

          {/* Eyes */}
          <JellyEyes happy />

          {/* Stylish glasses */}
          <JellyGlasses />

          {/* Proud happy smile */}
          <path
            d="M107 90 Q120 101 133 90"
            fill="none"
            stroke="#064e3b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </motion.svg>
      </motion.div>
    );
  }

  return (
    <div className="relative flex items-center justify-center select-none pointer-events-none">
      {/* Subtle soundwave animations when listening */}
      {isListening && (
        <div className="absolute right-2 sm:right-6 top-10 sm:top-12 flex items-center justify-center">
          {[0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              className="absolute rounded-full border-2 border-emerald-200/75"
              initial={{ width: 28, height: 28, opacity: 0.9 }}
              animate={{
                width: [28, 118],
                height: [28, 118],
                opacity: [0.85, 0],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: ring * 0.52,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Ground shadow that scales inversely with bounce */}
      <motion.div
        className="absolute bottom-2 w-40 sm:w-48 h-5 rounded-full bg-emerald-950/45 blur-md"
        animate={
          isListening
            ? { scaleX: [0.96, 1.02, 0.96], opacity: [0.55, 0.45, 0.55] }
            : { scaleX: [1, 0.88, 1], opacity: [0.55, 0.35, 0.55] }
        }
        transition={{ duration: isLoading ? 0.9 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.svg
        viewBox="0 0 260 275"
        className="w-56 h-60 sm:w-68 sm:h-72 overflow-visible drop-shadow-[0_18px_28px_rgba(0,0,0,0.3)]"
        animate={
          isListening
            ? { y: [0, -5, 0], rotate: -8, scaleX: [1, 1.02, 1], scaleY: [1, 0.98, 1] }
            : isLoading
              ? { y: [0, -14, 0], scaleX: [1.03, 0.96, 1.03], scaleY: [0.96, 1.05, 0.96] }
              : { y: [0, -10, 0], scaleX: [1.03, 0.97, 1.03], scaleY: [0.97, 1.04, 0.97] }
        }
        transition={{
          duration: isLoading ? 0.85 : isListening ? 1.8 : 2.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '130px 235px' }}
        role="img"
        aria-label={
          isListening
            ? 'Green Jelly cupping a hand to its ear and listening carefully'
            : 'Green Jelly wearing a suit jacket, tie, and glasses'
        }
      >
        <JellyDefs />

        {/* Left Arm (resting or slightly outward when listening) */}
        <motion.g
          animate={
            isListening
              ? { rotate: 10, y: 4 }
              : { rotate: [-4, 4, -4] }
          }
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '64px 168px' }}
        >
          {/* Coat sleeve */}
          <path
            d="M65 162 C44 172, 36 198, 45 215 L63 209 C58 196, 62 182, 74 176 Z"
            fill="#1e293b"
          />
          {/* Shirt cuff */}
          <path d="M44 211 L62 206 L64 212 L46 217 Z" fill="#f8fafc" />
          {/* Jelly hand */}
          <circle cx="56" cy="221" r="11" fill="url(#jellyBodyGrad)" />
        </motion.g>

        {/* Main Bouncy Green Jelly Body */}
        <path
          d="M58 212 C52 105, 68 32, 130 32 C192 32, 208 105, 202 212 C199 242, 174 252, 130 252 C86 252, 61 242, 58 212 Z"
          fill="url(#jellyBodyGrad)"
        />

        {/* Subtle inner jelly glow */}
        <ellipse cx="130" cy="112" rx="52" ry="62" fill="#86efac" opacity="0.16" />

        {/* Glossy specular jelly highlights */}
        <ellipse
          cx="96"
          cy="64"
          rx="20"
          ry="9"
          transform="rotate(-26 96 64)"
          fill="#ffffff"
          opacity="0.48"
        />
        <circle cx="78" cy="81" r="4.5" fill="#ffffff" opacity="0.38" />

        {/* Smart Suit Jacket (Coat) */}
        <path
          d="M62 162 C68 152, 82 146, 98 144 L130 198 L162 144 C178 146, 192 152, 198 162 L203 216 C198 242, 172 251, 130 251 C88 251, 62 242, 57 216 Z"
          fill="url(#suitGrad)"
        />

        {/* Crisp White Shirt V-Front */}
        <polygon points="98,144 162,144 130,204" fill="#f8fafc" />

        {/* Shirt Collar Flaps */}
        <polygon points="98,144 130,158 113,167" fill="#e2e8f0" />
        <polygon points="162,144 130,158 147,167" fill="#e2e8f0" />

        {/* Suit Lapels */}
        <polygon points="98,144 84,174 106,184 130,204" fill="#0f172a" />
        <polygon points="162,144 176,174 154,184 130,204" fill="#0f172a" />

        {/* Smart Tie (swaying gently) */}
        <motion.g
          animate={{ rotate: isListening ? 4 : [-2.5, 2.5, -2.5] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '130px 152px' }}
        >
          <polygon points="124,151 136,151 133,163 127,163" fill="#ca8a04" />
          <polygon points="127,163 133,163 138,200 130,211 122,200" fill="url(#tieGrad)" />
          {/* Tie diagonal stripe */}
          <line x1="125" y1="176" x2="135" y2="171" stroke="#fef08a" strokeWidth="2.2" opacity="0.85" />
          <line x1="124" y1="190" x2="136" y2="184" stroke="#fef08a" strokeWidth="2.2" opacity="0.85" />
        </motion.g>

        {/* Suit Coat Buttons & Pocket Square */}
        <circle cx="130" cy="222" r="3.5" fill="#475569" />
        <circle cx="130" cy="236" r="3.5" fill="#475569" />
        <polygon points="158,184 176,184 171,175 162,178" fill="#34d399" />

        {/* Little Jelly Feet */}
        <ellipse cx="104" cy="252" rx="16" ry="8" fill="#065f46" />
        <ellipse cx="156" cy="252" rx="16" ry="8" fill="#065f46" />

        {/* Face Region */}
        <g transform="translate(10, 14)">
          <ellipse cx="78" cy="100" rx="8.5" ry="4.5" fill="#4ade80" opacity="0.6" />
          <ellipse cx="162" cy="100" rx="8.5" ry="4.5" fill="#4ade80" opacity="0.6" />

          <JellyEyes attentive={isListening} />
          <JellyGlasses />

          {/* Mouth */}
          {isListening ? (
            <ellipse cx="120" cy="107" rx="5.5" ry="6.5" fill="#064e3b" />
          ) : (
            <path
              d="M107 104 Q120 115 133 104"
              fill="none"
              stroke="#064e3b"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Right Arm: Resting in idle vs Cupped up to ear in listening! */}
        <motion.g
          initial={false}
          animate={
            isListening
              ? { rotate: -118, x: 6, y: -14 }
              : { rotate: [4, -4, 4], x: 0, y: 0 }
          }
          transition={{
            rotate: isListening
              ? { type: 'spring', stiffness: 180, damping: 14 }
              : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
            x: { type: 'spring', stiffness: 180, damping: 16 },
            y: { type: 'spring', stiffness: 180, damping: 16 },
          }}
          style={{ transformOrigin: '194px 168px' }}
        >
          {/* Coat sleeve */}
          <path
            d="M195 162 C216 172, 224 198, 215 215 L197 209 C202 196, 198 182, 186 176 Z"
            fill="#1e293b"
          />
          {/* Shirt cuff */}
          <path d="M216 211 L198 206 L196 212 L214 217 Z" fill="#f8fafc" />
          {/* Cupped / resting jelly hand */}
          <path
            d="M193 219 C193 212, 204 209, 212 214 C218 219, 216 230, 207 232 C198 233, 193 226, 193 219 Z"
            fill="url(#jellyBodyGrad)"
          />
        </motion.g>
      </motion.svg>
    </div>
  );
}

function JellyDefs() {
  return (
    <defs>
      <radialGradient id="jellyBodyGrad" cx="38%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="45%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#047857" />
      </radialGradient>
      <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="tieGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
  );
}

function JellyEyes({ attentive = false, happy = false }: { attentive?: boolean; happy?: boolean }) {
  return (
    <g>
      {/* Eyebrows */}
      <path
        d={attentive ? 'M88 58 Q97 51 106 57' : 'M89 61 Q97 58 105 61'}
        fill="none"
        stroke="#064e3b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={attentive ? 'M134 57 Q143 51 152 58' : 'M135 61 Q143 58 151 61'}
        fill="none"
        stroke="#064e3b"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {happy ? (
        <>
          <path
            d="M90 77 Q97 69 104 77"
            fill="none"
            stroke="#064e3b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M136 77 Q143 69 150 77"
            fill="none"
            stroke="#064e3b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <motion.g
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.88, 0.92, 0.96, 1] }}
          style={{ transformOrigin: '120px 76px' }}
        >
          <circle cx="97" cy="76" r={attentive ? 7.5 : 6.5} fill="#022c22" />
          <circle cx="143" cy="76" r={attentive ? 7.5 : 6.5} fill="#022c22" />
          <circle cx="99.5" cy="73.5" r="2.3" fill="#ffffff" />
          <circle cx="145.5" cy="73.5" r="2.3" fill="#ffffff" />
        </motion.g>
      )}
    </g>
  );
}

function JellyGlasses() {
  return (
    <g>
      {/* Left lens */}
      <rect
        x="79"
        y="62"
        width="35"
        height="26"
        rx="8"
        fill="#ecfdf5"
        fillOpacity="0.22"
        stroke="#0f172a"
        strokeWidth="4"
      />
      {/* Right lens */}
      <rect
        x="126"
        y="62"
        width="35"
        height="26"
        rx="8"
        fill="#ecfdf5"
        fillOpacity="0.22"
        stroke="#0f172a"
        strokeWidth="4"
      />
      {/* Bridge & temples */}
      <path d="M114 73 Q120 70 126 73" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <line x1="72" y1="72" x2="79" y2="73" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="161" y1="73" x2="168" y2="72" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
      {/* Subtle lens glare */}
      <line x1="86" y1="68" x2="93" y2="81" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <line x1="133" y1="68" x2="140" y2="81" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
    </g>
  );
}
