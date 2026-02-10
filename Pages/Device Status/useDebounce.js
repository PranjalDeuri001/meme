import { useState, useEffect } from 'react';
import propsTypes from "prop-types";

/**
 * A custom hook to debounce a value.
 * @param {any} value The value to debounce (e.g., a search term).
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
useDebounce.propsTypes = {
  value: propsTypes.any.isRequired,
  delay: propsTypes.number.isRequired,
};  
    