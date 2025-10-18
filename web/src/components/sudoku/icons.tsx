// ./icons.tsx
import * as React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  /** width/height, defaults to 22 like your current icons */
  size?: number | string;
};

const Svg: React.FC<IconProps> = ({ size = 22, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const Undo: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M7 7H3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 11a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Eraser: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M3 17l7-7 7 7-3 3H6l-3-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M14 7l2-2 5 5-2 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </Svg>
);

export const Pencil: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M14 4l2-2 4 4-2 2-4-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </Svg>
);

export const Sparkles: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M5 12l2-2-2-2 2-2 2 2 2-2 2 2-2 2 2 2-2 2-2-2-2 2-2-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M17 7l1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </Svg>
);

export const Bulb: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M9 18h6M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 2a7 7 0 0 0-4 13c.4.4 1 1.3 1 2h6c0-.7.6-1.6 1-2a7 7 0 0 0-4-13z" stroke="currentColor" strokeWidth="2" />
  </Svg>
);

export const Reset: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Dice: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
  </Svg>
);

export const Icons = { Undo, Eraser, Pencil, Sparkles, Bulb, Reset, Dice } as const;
export default Icons;
