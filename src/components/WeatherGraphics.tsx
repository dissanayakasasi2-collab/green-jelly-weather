import { motion } from 'motion/react';
import { WeatherConditionType } from '../types/weather';

interface WeatherGraphicsProps {
  condition: WeatherConditionType;
  compact?: boolean;
}

export function WeatherGraphics({ condition, compact = false }: WeatherGraphicsProps) {
  const sizeClass = compact ? 'w-12 h-12' : 'w-32 h-28 sm:w-40 sm:h-32';

  return (
    <div className={`relative flex items-center justify-center select-none ${sizeClass}`}>
      <svg
        viewBox="0 0 160 120"
        className="w-full h-full overflow-visible"
        role="img"
        aria-label={`Weather animation for ${condition}`}
      >
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="65%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <linearGradient id="fluffyCloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="backCloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="stormCloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
        </defs>

        {/* SUNNY */}
        {condition === 'sunny' && (
          <g>
            <motion.circle
              cx="80"
              cy="58"
              r="38"
              fill="#fde047"
              opacity={0.22}
              animate={{ scale: [1, 1.16, 1], opacity: [0.22, 0.35, 0.22] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '80px 58px' }}
            />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '80px 58px' }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line
                  key={angle}
                  x1="80"
                  y1="14"
                  x2="80"
                  y2="24"
                  stroke="#facc15"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  transform={`rotate(${angle} 80 58)`}
                />
              ))}
            </motion.g>
            <circle cx="80" cy="58" r="24" fill="url(#sunGlow)" />
          </g>
        )}

        {/* PARTLY CLOUDY: Bright sun peeking out from behind a fluffy cloud */}
        {condition === 'partly-cloudy' && (
          <g>
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '104px 42px' }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line
                  key={angle}
                  x1="104"
                  y1="14"
                  x2="104"
                  y2="20"
                  stroke="#facc15"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  transform={`rotate(${angle} 104 42)`}
                />
              ))}
            </motion.g>
            <motion.circle
              cx="104"
              cy="42"
              r="18"
              fill="url(#sunGlow)"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '104px 42px' }}
            />
            <motion.g
              animate={{ x: [-4, 4, -4] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M42 86h64a17 17 0 0 0 2-33.8A23 23 0 0 0 64 46a19 19 0 0 0-22 18.7A14 14 0 0 0 42 86Z"
                fill="url(#fluffyCloud)"
              />
            </motion.g>
          </g>
        )}

        {/* CLOUDY / OVERCAST: Multiple layered moving clouds */}
        {condition === 'cloudy' && (
          <g>
            <motion.path
              d="M54 58h56a14 14 0 0 0 2-27.8A19 19 0 0 0 74 24a16 16 0 0 0-20 15.5A12 12 0 0 0 54 58Z"
              fill="url(#backCloud)"
              animate={{ x: [-8, 10, -8] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M34 88h74a17 17 0 0 0 2-33.8A24 24 0 0 0 62 46a20 20 0 0 0-28 19.5A14 14 0 0 0 34 88Z"
              fill="url(#fluffyCloud)"
              animate={{ x: [6, -6, 6] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {/* RAINY: Dark cloud with animated falling raindrops */}
        {condition === 'rainy' && (
          <g>
            {[
              { x: 54, delay: 0 },
              { x: 72, delay: 0.35 },
              { x: 90, delay: 0.15 },
              { x: 106, delay: 0.5 },
            ].map((drop, idx) => (
              <motion.line
                key={idx}
                x1={drop.x}
                y1="74"
                x2={drop.x - 5}
                y2="90"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
                animate={{ y: [0, 24], opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: drop.delay,
                  ease: 'linear',
                }}
              />
            ))}
            <motion.path
              d="M36 72h76a17 17 0 0 0 2-33.8A23 23 0 0 0 68 30a19 19 0 0 0-32 18.5A14 14 0 0 0 36 72Z"
              fill="url(#stormCloud)"
              animate={{ y: [-1.5, 1.5, -1.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {/* THUNDERSTORM: Storm cloud with falling raindrops and flashing lightning bolts */}
        {condition === 'thunderstorm' && (
          <g>
            {[
              { x: 50, delay: 0 },
              { x: 104, delay: 0.4 },
            ].map((drop, idx) => (
              <motion.line
                key={idx}
                x1={drop.x}
                y1="72"
                x2={drop.x - 6}
                y2="88"
                stroke="#60a5fa"
                strokeWidth="3.2"
                strokeLinecap="round"
                animate={{ y: [0, 24], opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.75,
                  repeat: Infinity,
                  delay: drop.delay,
                  ease: 'linear',
                }}
              />
            ))}
            <motion.polygon
              points="82,66 68,88 79,88 73,109 95,82 83,82"
              fill="#fde047"
              animate={{ opacity: [0.15, 1, 0.2, 1, 0.15] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                times: [0, 0.1, 0.2, 0.28, 1],
              }}
            />
            <motion.path
              d="M34 68h78a17 17 0 0 0 2-33.8A24 24 0 0 0 66 26a19 19 0 0 0-32 18.5A14 14 0 0 0 34 68Z"
              fill="url(#stormCloud)"
              animate={{ x: [-2, 2, -2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {/* WINDY */}
        {condition === 'windy' && (
          <g>
            <motion.path
              d="M52 54h52a13 13 0 0 0 2-25.8A18 18 0 0 0 70 22a15 15 0 0 0-18 14.5A11 11 0 0 0 52 54Z"
              fill="url(#fluffyCloud)"
              animate={{ x: [-5, 7, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {[
              { d: 'M24 68 H108 C118 68 122 56 112 53 C106 51 102 56 105 60', delay: 0 },
              { d: 'M34 82 H122 C132 82 135 94 124 96 C118 97 115 92 118 89', delay: 0.45 },
              { d: 'M20 94 H88', delay: 0.25 },
            ].map((gust, i) => (
              <motion.path
                key={i}
                d={gust.d}
                fill="none"
                stroke="#a7f3d0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="90"
                animate={{ strokeDashoffset: [90, 0, -90] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: gust.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </g>
        )}

        {/* FOGGY */}
        {condition === 'foggy' && (
          <g>
            <circle cx="80" cy="44" r="18" fill="#fde68a" opacity={0.6} />
            {[
              { y: 52, w: 86, x: 37, d: 0 },
              { y: 68, w: 100, x: 30, d: 0.5 },
              { y: 84, w: 80, x: 40, d: 0.25 },
            ].map((bar, idx) => (
              <motion.line
                key={idx}
                x1={bar.x}
                y1={bar.y}
                x2={bar.x + bar.w}
                y2={bar.y}
                stroke="#e2e8f0"
                strokeWidth="6"
                strokeLinecap="round"
                opacity={0.75}
                animate={{ x: [-7, 7, -7] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  delay: bar.d,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </g>
        )}

        {/* NIGHT CLEAR */}
        {condition === 'night-clear' && (
          <g>
            {[
              { cx: 42, cy: 36, r: 2.5, d: 0 },
              { cx: 118, cy: 32, r: 3, d: 0.6 },
              { cx: 124, cy: 74, r: 2.2, d: 1.1 },
              { cx: 48, cy: 84, r: 2.2, d: 0.3 },
            ].map((star, idx) => (
              <motion.circle
                key={idx}
                cx={star.cx}
                cy={star.cy}
                r={star.r}
                fill="#fef9c3"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.25, 0.8] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: star.d }}
                style={{ transformOrigin: `${star.cx}px ${star.cy}px` }}
              />
            ))}
            <motion.path
              d="M88 30 A26 26 0 1 0 108 76 A20 20 0 1 1 88 30 Z"
              fill="url(#moonGrad)"
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '80px 56px' }}
            />
          </g>
        )}

        {/* NIGHT CLOUDY */}
        {condition === 'night-cloudy' && (
          <g>
            {[
              { cx: 44, cy: 30, r: 2.2, d: 0.2 },
              { cx: 120, cy: 30, r: 2.5, d: 0.8 },
            ].map((star, idx) => (
              <motion.circle
                key={idx}
                cx={star.cx}
                cy={star.cy}
                r={star.r}
                fill="#fef9c3"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: star.d }}
              />
            ))}
            <path
              d="M96 24 A18 18 0 1 0 112 56 A14 14 0 1 1 96 24 Z"
              fill="url(#moonGrad)"
            />
            <motion.path
              d="M36 86h70a16 16 0 0 0 2-31.8A22 22 0 0 0 64 46a18 18 0 0 0-28 17.5A13 13 0 0 0 36 86Z"
              fill="url(#backCloud)"
              animate={{ x: [-5, 5, -5] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
