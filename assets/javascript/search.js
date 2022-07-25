const $datalist = $('#possible-locations');
const $searchInput = $('input[name="location"]');
const $form = $('form');
const userLocations = {};
/**
 * Function copied from https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_debounce. Delays execution of a function until `wait` time has passed to prevent a function from being called too frequently.
 * @param {function} func - The function to call
 * @param {number} wait - Time to wait before calling in ms
 * @param {boolean} [leading = true] - Whether to fire immediately or not
 */
  function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      timeout = null;
      if (!immediate){
        func.apply(this, arguments);
      }
    }, wait);
    if (immediate && !timeout){
      func.apply(context, args);
    }
  };
};

//#region City searching
/**
 * Removes a location option from the search datalist as well as from the object of possible user locations.
 * @param {JQUERYCollection} $opt - The Jquery collection/element to work on
 */
const removeLocationOption = ($opt) => {
  delete userLocations[$opt.title];
  $opt.remove();
}

/**
 * Searches for cities that match the users input. Uses the HERE geolocation API to find matching geolocations based on street address, city, state, and/or zip code. When a single city is selected, it loads the rest of the search form.
 */
const searchCities = async ()=>{
  const text = $searchInput.val();
  console.log('Search Text',text);
  if(!validInput(text)) return;

  if(userLocations[text]){
    loadFinalForm();
    return;
  }

  const result = await geocode(text);

  if(!result.items.length){
    //Handling for empty result (aka invalid address)
    return;
  }
  console.log('result',result);

  //Handling for multiple results (Fill the datalist)
  //Assemble array of HERE item IDs that were returned in the query.
  const possibleTitles = result.items.map(item => item.title);
  $datalist.children().each((i,element) => {
    const $opt = $(element);
    const optTitle = $opt.attr('data-title');
    console.log(optTitle);
    if(possibleTitles.indexOf(optTitle) === -1){
      //Remove existing options in the datalist that are no longer possible
      removeLocationOption($opt);
    }
  });
  console.log(userLocations);
  //Append new options to the datalist
  for(item of result.items){
    console.log('item',item);
    if(userLocations[item.title]) continue;
    //Only execute if the item doesn't already exist
    const $option = $('<option>');
    const itemStats = {
      ...item.position,
      id:item.id
    };
    userLocations[item.title] = itemStats;
    Object
      .entries({...itemStats,title:item.title})
      .forEach(([key,val])=>$option.attr(`data-${key}`,val));
    $option.data();
    $option.append(item.title);
    $datalist.append($option);
  }
  if(result.items.length > 1){
    setSearchState('info');
    return;
  }
};

/**
 * Loads the rest of the form once a valid location has been selected
 */
const loadFinalForm = () => {
  setSearchState('success');
  $(
    `
    <div class="field is-grouped">
      <div class="control field">
        <label for="search-radius" class="label">distance</label>
        <div class="control has-icons-right">
          <input type="number" name="search-radius" id="search-radius" class="input" value="10">
          <span class="icon is-right">
            <span>mi</span>
          </span>
        </div>
      </div>
      <div class="control is-expanded field">
        <label for="fuel-type" class="label">fuel type</label>
        <div class="control has-icons-left">
          <select name="fuel-type" id="fuel-type" class="input">
            <option value="">Select a fuel type</option>
            <option value="all">all</option>
            <option value="BD">biodiesel (B20 and above)</option>
            <option value="cng">compressed natural gas (CNG)</option>
            <option value="ELEC">electric</option>
            <option value="E85">ethanol (E85)</option>
            <option value="HY">hydrogen</option>
            <option value="LNG">liquefied natural gas (LNG)</option>
            <option value="LPG">propane (LPG)</option>
          </select>
          <span class="icon is-left">
            <i class="material-icons">bolt</i>
          </span>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-centered" id="submit-container">
      <div class="control">
        <button type="submit" class="button is-primary">find your corner ev</button>
      </div>
    </div>
    `).appendTo($form);
};

/**
 * 
 * @param {string} [bulmaState] - The bulma state to add to the element. If omitted, all status tags are removed.
 * @param {JQUERYCollection} [$element = $searchInput] - The jQuery element(s) to manipulate the state on.
 */
const setSearchState = (bulmaState,$element = $searchInput) => {
  $element.removeClass('is-success is-danger is-info is-warning');
  if(bulmaState){
    $element.addClass(`is-${bulmaState}`);
  }
}
//Debounce the search function to prevent excessive API calls
const debouncedSearch = debounce(searchCities,250);

//Validate that there are enough characters to search with
const validInput = ()=>{
  const text = $searchInput.val();
  return text.length >= 3 ?
    text :
    false;
};

$searchInput.on('input',debouncedSearch);
$searchInput.change(debouncedSearch);

//#endregion City searching
const findStations = (event)=>{
  event.preventDefault();
};
$form.submit(findStations);