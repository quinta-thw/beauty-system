import { Platform } from 'react-native';

export const C = {
  ink: '#0e0c0b',
  paper: '#faf8f5',
  cream: '#f0ebe2',
  gold: '#c9a96e',
  goldSoft: '#e8d5b0',
  rose: '#c4857a',
  heading: '#1a1714',
  body: '#5a4f47',
  muted: '#6b6058',        // secondary text, 5:1 on paper and cream
  goldText: '#7d5f26',     // gold that is readable as small text on light backgrounds
  roseText: '#a5493d',     // errors and rose text on light backgrounds
  line: 'rgba(201,169,110,0.35)',
};

export const F = {
  serif: Platform.select({ web: "'Cormorant Garamond', Georgia, serif", ios: 'Georgia', default: 'serif' }),
  sans: Platform.select({ web: "'DM Sans', system-ui, sans-serif", default: undefined }),
};

// Edit these to match the real salon.
export const SALON = {
  name: 'Petals & Glam',
  city: 'Nairobi',
  address: 'Ngong Road, Nairobi',
  phone: '0700 000 000',
  hours: [
    ['Monday to Friday', '9:00 am to 7:00 pm'],
    ['Saturday', '9:00 am to 7:00 pm'],
    ['Sunday', 'By appointment'],
  ],
  instagram: 'petalsandglam',
  tiktok: 'petalsandglam',
};

export const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
