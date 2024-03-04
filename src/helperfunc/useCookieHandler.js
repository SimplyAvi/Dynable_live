// useCookieHandler.js
import { useCookies } from 'react-cookie';
import { setSearchbarValue } from '../redux/searchbarSlice';
import { useDispatch } from 'react-redux';

export const useSearchCookieHandler = () => {
  const [searchbar, setSearchbar] = useCookies(['searchbar']);
  const dispatch = useDispatch()

  const saveToCookies = (value) => {
    // console.log('saving to cookies:', value)
    setSearchbar('searchbar', value);
    dispatch(setSearchbarValue(value))
  };

  return { saveToCookies };
};