/**
 * The official 4-colour Google "G" mark, rendered as a vector so it
 * stays crisp at any size and adapts to light / dark backgrounds
 * without needing a separate asset.
 *
 * Why SVG rather than a PNG asset:
 *   - One source of truth, no @1x/@2x/@3x assets to manage.
 *   - Looks correct in both light and dark theme without recolouring
 *     (the brand colours are baked-in by Google's guidelines).
 *   - Tiny — under 1 kB.
 *
 * Path data is the standard "G" mark from Google's branding guide.
 */

import Svg, { Path } from 'react-native-svg';

type Props = {
  /** Rendered width and height in dp. The mark is square. */
  size?: number;
};

export function GoogleLogo({ size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Blue */}
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      {/* Green */}
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      {/* Yellow */}
      <Path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      {/* Red */}
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}
