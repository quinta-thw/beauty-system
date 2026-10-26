import { API } from './theme';

async function req(path, opts) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = Object.values(data)[0];
    const msg = Array.isArray(first) ? first[0] : data.detail || 'Something went wrong. Please try again.';
    throw new Error(msg);
  }
  return data;
}

export const getInfo = () => req('/info/');
export const getServices = () => req('/services/');
export const getReviews = () => req('/reviews/');
export const getSlots = (service, date) => req(`/availability/?service=${service}&date=${date}`);
export const book = (payload) => req('/bookings/', { method: 'POST', body: JSON.stringify(payload) });

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const to12h = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};
