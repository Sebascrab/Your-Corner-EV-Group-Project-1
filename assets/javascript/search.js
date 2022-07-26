const $datalist = $('#possible-locations');
const $searchInput = $('input[name="location"]');
const $form = $('form');
const $foundNames = $('#foundNames');
const userLocations = {};
const nrelak = 'kKioVYWtLSheIYeuhhDJEcNsDNdivdWsT3R0ayO4';
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
/**
 * Removes a location option from the search datalist as well as from the object of possible user locations.
 * @param {JQUERYCollection} $opt - The Jquery collection/element to work on
 */
const removeLocationOption = ($opt) => {
  delete userLocations[$opt.title];
  $opt.remove();
}

/**
 * 
 * @param {string} [bulmaState] - The bulma state to add to the element. If omitted, all status tags are removed.
 * @param {JQUERYCollection} [$element = $searchInput] - The jQuery element(s) to manipulate the state on.
 */
const setSearchState = (bulmaState,$element = $searchInput) => {
  $element.removeClass('is-success is-danger is-info is-warning is-loading');
  if(bulmaState){
    $element.addClass(`is-${bulmaState}`);
  }
}

/**
 * Clones the contents of the indicated template.
 * @param {string} id - The template ID to get
 * @param {string|number|jQuery Object} [toAppend] - Content to append to the cloned template
 * @returns {jQuery Object}
 */
const getTemplate = (id,toAppend)=>{
  const template = $(
    document
      .getElementById(id)
      .content
      .firstElementChild
      .cloneNode(true)
  );
  if(toAppend){
    template.append(toAppend);
  }
  return template;
}

/**
 * Loads the rest of the form once a valid location has been selected
 */
const loadFinalForm = () => {
  setSearchState('success');
  if(!document.getElementById('advanced-options')){
    getTemplate('final-form').appendTo($form);
    $('#fuel-type').change(fuelSpecificOptions);
  }
};

//Validate that there are enough characters to search with
const validInput = () => {
  const text = $searchInput.val();
  return text.length >= 3 ?
    text :
    false;
};
//#region station searching

const getNearestStations = function(parameters={}){
  const paramString = Object.entries(parameters).map(([key,val])=>`${key}=${val}`).join('&');
  return fetch(`https://developer.nrel.gov/api/alt-fuel-stations/v1/nearest.json?api_key=${nrelak}&${paramString}`)
    .then(response => response.json());
}
const findStations = async () => {
  const selectedLocation = userLocations[$searchInput.val()];
  const params = {
    latitude: selectedLocation.lat,
    longitude:selectedLocation.lng,
    radius:$('#search-radius').val(),
    fuel_type:$('#fuel-type').val()
  };
  const $evNetwork = $('#ev-network');
  if($evNetwork[0]){
    params.ev_network = $evNetwork.val();
  }
  const response = await getNearestStations(params);
  $foundNames.empty();
  console.log(response);
  response.fuel_stations.forEach((station)=>{
    const $li = $('<li></li>',{'class':'is-flex'});
    ['station_name','street_address','ev_network'].forEach(
      (prop) => {
        const $span = $('<span></span>');
        $span.append(station[prop]);
        $li.append($span);
      }
    )
    $foundNames.append($li);
  });
  $form.find(':is(input,select)').removeAttr('disabled');
  setSearchState(null,$('form button[type="submit"]'))
};
//#endregion

//#region Listener Functions
//#region City searching

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
  }else if(text === result.items[0].title){
    loadFinalForm();
  }
};
//Debounce the search function to prevent excessive API calls
const debouncedSearch = debounce(searchCities,250);

//#endregion City searching
const verifySelections = (event)=>{
  event.preventDefault();
  const $fuelType = $('#fuel-type');
  const $evNetwork = $('#ev-network');
  const $searchRadius = $('#search-radius');
  if(// Verify that the user has input the minimum required data
    !userLocations[$searchInput.val()] ||
    ($fuelType[0] && !$fuelType.val()) ||
    ($searchRadius[0] && !$searchRadius.val())
  ){
    if(!userLocations[$searchInput.val()]){
      setSearchState('danger');
    }
    if($fuelType[0] && !$fuelType.val()){
      setSearchState('danger',$($fuelType[0].parentElement));
    }
    if($searchRadius[0] && !$searchRadius.val()){
      setSearchState('danger',$searchRadius);
    }
    return;
  }
  [$($fuelType[0]?.parentElement),$($evNetwork[0]?.parentElement),$searchRadius]
    .forEach($elem => {
      if($elem[0]){
        setSearchState('success',$elem);
      }
    });
  $form.find(':is(input,select)').attr('disabled',true);
  setSearchState('loading',$('form button[type="submit"]'))
  findStations();
};

/**
 * Shows/hides the fuel type specific search options based on what fuel type is selected.
 * @param {DOMEvent} event - The event that triggered the function
 */
const fuelSpecificOptions = (event) => {
  console.log('value',event.target.value)
  if(event.target.value === 'ELEC' || event.target.value === 'all'){
    getTemplate('elec-pay-options')
      .appendTo($('#advanced-options'));
  }else{
    $('#electric-options').remove();
  }
};
//#endregion Listener Functions
//#region Listener declarations
$form.submit(verifySelections);
$searchInput.on('input',debouncedSearch);
$searchInput.change(debouncedSearch);
//#endregion
