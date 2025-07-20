import { useLangStore } from '../store/langStore';

export async function getLocationTitleById(id) {
  try {
    const lang = useLangStore.getState().language;
    const res = await fetch('./data/locationData.json');
    const data = await res.json();
    const loc = Array.isArray(data) ? data.find(l => l.id === id) : data;
    if (!loc) return null;
    const { title } = loc;
    if (title && typeof title === 'object' && !Array.isArray(title)) {
      return title[lang] || title.fa || Object.values(title)[0];
    }
    return title || null;
  } catch (err) {
    console.error('failed to load location title', err);
    return null;
  }
}
