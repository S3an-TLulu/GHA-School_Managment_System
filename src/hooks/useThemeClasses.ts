import { useAppContext } from '../context/AppContext';

const SCHEMES = {
  blue:   { btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',     text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', light: 'bg-blue-50', border: 'border-blue-200', activeNav: 'bg-blue-50 text-blue-700 border-blue-200' },
  green:  { btn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',   text: 'text-green-600', badge: 'bg-green-100 text-green-700', light: 'bg-green-50', border: 'border-green-200', activeNav: 'bg-green-50 text-green-700 border-green-200' },
  purple: { btn: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', light: 'bg-purple-50', border: 'border-purple-200', activeNav: 'bg-purple-50 text-purple-700 border-purple-200' },
  orange: { btn: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', light: 'bg-orange-50', border: 'border-orange-200', activeNav: 'bg-orange-50 text-orange-700 border-orange-200' },
  red:    { btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',         text: 'text-red-600', badge: 'bg-red-100 text-red-700', light: 'bg-red-50', border: 'border-red-200', activeNav: 'bg-red-50 text-red-700 border-red-200' },
} as const;

export function useThemeClasses() {
  const { theme } = useAppContext();
  return SCHEMES[theme.colorScheme] ?? SCHEMES.blue;
}

export function primaryBtnClass(scheme: keyof typeof SCHEMES) {
  return SCHEMES[scheme].btn;
}
