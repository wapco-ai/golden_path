import { useLangStore } from '../store/langStore';
import { toLocaleDigits } from './digits';

const useLocaleDigits = () => {
  const language = useLangStore(state => state.language);
  return (value) => toLocaleDigits(value, language);
};

export default useLocaleDigits;
