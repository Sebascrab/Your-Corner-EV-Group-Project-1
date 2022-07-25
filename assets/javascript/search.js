const $datalist = $('#possible-locations');
const $searchInput = $('input[name="location"]');

  /**
   * Function copied from https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_debounce. Delays execution of a function until `wait` time has passed to prevent a function from being called too frequently.
   * @param {function} func - The function to call
   * @param {number} wait - Time to wait before calling in ms
   * @param {boolean} [leading = true] - Whether to fire immediately or not
   */
   function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      }, wait);
      if (immediate && !timeout) func.apply(context, args);
    };
  }
//#region City searching adapted from Weather Dashboard
/**
 * Converts an openweather geolocation object into a full city name.
 * @param {object} obj - The object to convert into a city name
 * @returns {string}
 */
const createFullCityName = (obj) => `${obj.name}${obj.state ? `, ${obj.state}` :''}, ${obj.country}`;

/**
   * Function that initiates a search of the cities using the Open Weather Geocoding API
   * @param {object} event - The event that fired the function
   */
// const searchCities = async (event) => {
//   const searchText = validateInput();
//   if(!searchText) return;
//   const [city,state,country] = searchText.toLowerCase().match(/^(.+?),\s*(?:(.+?)(?:,|$)\s*)?(?:(.+)$)?/)?.slice(1) || [];
//   const selectedCity = possibleCities.find(obj => 
//     city === obj.name.toLowerCase() &&
//       (
//         (state === (obj.state || '').toLowerCase() && country === (obj.country || '').toLowerCase()) ||
//         (!country && (state === (obj.state || '').toLowerCase() ||
//           state === (obj.country || '').toLowerCase()))
//       )
//   );
//   console.log('selectedCity',selectedCity);
//   if(selectedCity){
//     possibleCities.length = 0;
//     possibleCities.push(selectedCity);
//     cityFound(selectedCity);
//     return;
//   }
  
//   const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${ak}`);
//   const results = await response.json();
//   possibleCities.length = 0;
//   $datalist.empty();
//   if(results.length > 1){
//     possibleCities.push(...results);
//     possibleCities.forEach(result => {
//       const locString = createFullCityName(result);
//       const $option = $(`<option value="${locString}">${locString}</option`);
//       $datalist.append($option);
//     });
//   }else if(results.length){
//     cityFound(results[0]);
//   }
// };
//Debounce the search function to prevent excessive API calls
const searchCities = async ()=>{
  const text = $searchInput.val();
  const result = await geocode({q:text});
  console.log(result);
};
const debouncedSearch = debounce(searchCities,250);

//Validate that there are enough characters to search with
const validateInput = ()=>{
  const text = $searchInput.val();
  return text.length >= 3 ?
    text :
    false;
};

$searchInput.on('input',debouncedSearch);
$searchInput.change(debouncedSearch);

//#endregion City searching