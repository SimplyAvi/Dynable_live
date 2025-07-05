// useCookieHandler.js
import { useCookies } from 'react-cookie';
import { setSearchbarValue } from '../redux/searchbarSlice';
import {setAllergies} from '../redux/allergiesSlice';
import { useDispatch, useSelector } from 'react-redux';

export const useSearchCookieHandler = () => {
  const [searchbar, setSearchbar] = useCookies(['searchbar']);
  const [allergens, setAllergens] = useCookies(['allergens'])
  const dispatch = useDispatch()
  const reduxAllergies = useSelector((state) => state.allergies?.allergies || {});

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
    // Use Redux state if available, otherwise use cookies, otherwise use empty object
    const cookieAllergies = allergens.allergens || reduxAllergies || {}
    dispatch(setAllergies(cookieAllergies))
  }

  return {
    saveToCookies,
    initializeSearchFromCookies,
    saveAllergensToCookies,
    initializeAllergensFromCookies
  };
};