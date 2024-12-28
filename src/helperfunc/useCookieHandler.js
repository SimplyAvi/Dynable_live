// useCookieHandler.js
import { useCookies } from 'react-cookie';
import { setSearchbarValue } from '../redux/searchbarSlice';
import {setAllergies} from '../redux/allergiesSlice';
import { useDispatch } from 'react-redux';

export const useSearchCookieHandler = () => {
  const [searchbar, setSearchbar] = useCookies(['searchbar']);
  const [allergens, setAllergens] = useCookies(['allergens'])
  const dispatch = useDispatch()

  const saveToCookies = (value) => {
    // console.log('saving to cookies:', value)
    setSearchbar('searchbar', value);
    dispatch(setSearchbarValue(value))
  };

  const initializeSearchFromCookies = () => {
    const cookieSearch = searchbar.searchbar || ''
    dispatch(setSearchbarValue(cookieSearch))
  }

  const saveAllergensToCookies = (value) => {
    setAllergens('allergens', value);
    dispatch(setAllergies(value))
  }

  const initializeAllergensFromCookies = () => {
    const cookieAllergies = allergens.allergens || {}
    dispatch(setAllergies(cookieAllergies))
  }

  return {
    saveToCookies,
    initializeSearchFromCookies,
    saveAllergensToCookies,
    initializeAllergensFromCookies
  };
};