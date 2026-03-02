/**
 * Centralized Design System - Unified Blue Theme
 * Used by all dashboard pages for consistent visual identity.
 * 
 * All roles share the same dark-blue sidebar and blue accent palette.
 * Only use shades of blue + neutral gray/white. No purple, teal, green theme colors.
 */

const blueTheme = {
  primary: 'blue',
  accent: 'blue',
  sidebar: {
    bg: 'bg-[#0F172A]',
    text: 'text-blue-100',
    activeItem: 'bg-blue-600 text-white shadow-lg shadow-blue-600/25',
    hoverItem: 'hover:bg-white/10 hover:text-white',
    inactiveText: 'text-slate-400',
    inactiveIcon: 'text-slate-500',
    logo: 'text-white',
    divider: 'border-slate-700/40',
    footerBg: 'bg-slate-800/40 border-slate-700/40',
  },
  header: {
    bg: 'bg-white/80 backdrop-blur-xl border-b border-blue-100/50',
  },
  page: {
    bg: 'bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50',
  },
  statCard: {
    iconColors: {
      blue: 'bg-blue-600 text-white shadow-blue-600/30',
      green: 'bg-green-500 text-white shadow-green-500/30',
      red: 'bg-red-500 text-white shadow-red-500/30',
      yellow: 'bg-yellow-500 text-white shadow-yellow-500/30',
      gray: 'bg-gray-500 text-white shadow-gray-500/30',
    },
  },
};

export const roleThemes = {
  admin: { id: 'admin', label: 'Administrator', ...blueTheme },
  manager: { id: 'manager', label: 'Manager', ...blueTheme },
  employee: { id: 'employee', label: 'Employee', ...blueTheme },
};

/** Shared card style presets */
export const cardStyles = {
  elevated: 'bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300',
  flat: 'bg-white rounded-2xl border border-gray-200',
  glass: 'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm',
  stat: 'bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative group',
};

/** Shared table style presets */
export const tableStyles = {
  header: 'text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80 sticky top-0 z-10',
  row: 'hover:bg-gray-50/60 transition-colors',
  rowAlt: 'even:bg-gray-25 hover:bg-gray-50/60 transition-colors',
  cell: 'py-4 px-5',
};

/** Status badge color presets (semantic — not theme colors) */
export const statusColors = {
  Present: { variant: 'success', dot: 'bg-green-500' },
  Absent: { variant: 'danger', dot: 'bg-red-500' },
  WFH: { variant: 'info', dot: 'bg-blue-500' },
  'Half-day': { variant: 'warning', dot: 'bg-yellow-500' },
  Leave: { variant: 'secondary', dot: 'bg-gray-400' },
  Pending: { variant: 'warning', dot: 'bg-yellow-500' },
  Approved: { variant: 'success', dot: 'bg-green-500' },
  Rejected: { variant: 'danger', dot: 'bg-red-500' },
};

export const getTheme = (role) => roleThemes[role?.toLowerCase()] || roleThemes.employee;

export default roleThemes;
