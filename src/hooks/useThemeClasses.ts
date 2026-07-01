import { useAppContext } from '../context/AppContext';

const SCHEMES = {
  blue:   { btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',     text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', light: 'bg-blue-50', border: 'border-blue-300', activeNav: 'bg-blue-100 text-blue-900 border-blue-300' },
  green:  { btn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',   text: 'text-green-700', badge: 'bg-green-100 text-green-800', light: 'bg-green-50', border: 'border-green-300', activeNav: 'bg-green-100 text-green-900 border-green-300' },
  purple: { btn: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', light: 'bg-purple-50', border: 'border-purple-300', activeNav: 'bg-purple-100 text-purple-900 border-purple-300' },
  orange: { btn: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-900', light: 'bg-orange-50', border: 'border-orange-300', activeNav: 'bg-orange-100 text-orange-900 border-orange-400' },
  red:    { btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',         text: 'text-red-700', badge: 'bg-red-100 text-red-900', light: 'bg-red-50', border: 'border-red-300', activeNav: 'bg-red-100 text-red-900 border-red-400' },
} as const;

export function useThemeClasses() {
  const { theme } = useAppContext();
  return SCHEMES[theme.colorScheme] ?? SCHEMES.blue;
}

export function primaryBtnClass(scheme: keyof typeof SCHEMES) {
  return SCHEMES[scheme].btn;
}
