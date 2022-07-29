const $datalist = $('#possible-locations');
const $searchInput = $('input[name="location"]');
const $form = $('form');
const $foundNames = $('#foundNames');
const $currentButton = $('#current-location');
const userLocations = {};
const stationMarkers = {};
const nrelak = 'kKioVYWtLSheIYeuhhDJEcNsDNdivdWsT3R0ayO4';
const map = {};
const mapContainer = document.getElementById('map-container');
var localStorageData = JSON.parse(localStorage.getItem('FavoriteStations'))||[];
//#region Helper Functions
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
 * Rounds the provided number to two decimal places
 * @param {number} num - The number to convert
 * @returns {number} - Number rounded to 2 decimal places
 */
const twoDecimals = (num)=>{
  return Math.round(num * 100) / 100;
}

/**
 * Clones the contents of the indicated template.
 * @param {string} id - The template ID to get
 * @param {string|number|jQuery Object} [toAppend] - Content to append to the cloned template
 * @returns {jQuery Object}
 */
const getTemplate = (id,keys={})=>{
  //Get the template item
  const $template = $(`#${id}`);
  //Extract the html code for the template as text.
  const templateText = $('<div></div>').text($template.html()).text();
  //Render the template as html using the provided keys and the Mustache library
  return $(Mustache.render(templateText,keys));
}

//Validate that there are enough characters to search with
const validInput = () => {
  const text = $searchInput.val();
  return text.length >= 3 ?
    text :
    false;
};
//#endregion Helper Functions

//#region HTML Manipulation
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
 * Loads the rest of the form once a valid location has been selected
 */
const loadFinalForm = () => {
  setSearchState('success');
  if(!document.getElementById('advanced-options')){
    getTemplate('final-form').appendTo($form);
    $('#fuel-type').change(fuelSpecificOptions);
  }
};

/**
 * Creates the map and adds markers for each station to it
 * TODO: Add fuel type icons/custom markers to the map instead of the default HERE markers.
 * @param {object} selectedLocation - Object holding the latitude/longitude of the user's location
 * @param {object} stations - The stations that were found within the search area
 */
const createMap = (selectedLocation,stations) => {
  mapContainer.innerHTML = '';
  map.map = new H.Map(
    mapContainer,
    defaultLayers.vector.normal.map,
    {
      zoom:10,
      center:selectedLocation,
      padding:{top:100,left:100,bottom:100,right:100}
    },
  );
  map.behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map.map));
  map.ui = H.ui.UI.createDefault(map.map,defaultLayers);
  map.ui.setUnitSystem(H.ui.UnitSystem.IMPERIAL);
  map.group = new H.map.Group();
  console.log(stations);
  stations.forEach((station) => {
    //The data to store on the marker. This data is used by createPopup() to use the Mustache Renderer to create the card for a given marker.
    const data = {
      favList: station.id,
      header:{
        title:station.station_name,
      },
      content:{
        address:{
          street:station.street_address,
          city:station.city,
          state:station.state,
          zip:station.zip
        },
        phone:station.station_phone,
        hours:station.access_days_time,
        evNetwork:station.ev_network,
        'level1':station.ev_level1_evse_num,
        'level2':station.ev_level2_evse_num,
        'DCFast':station.ev_dc_fast_num,
        'other':station.ev_other_evse
      }
    };
    data.content = Object.entries(data.content).reduce((memo,[key,val]) => {
      if(val){
        memo[key] = val;
      }
      return memo;
    },{})
    const marker = new H.map.Marker({lat:station.latitude,lng:station.longitude},{data});
    stationMarkers[station.station_name] = marker;
    map.group.addObject(marker);
  });
  map.map.addObject(map.group);
  console.log(stationMarkers);
  map.group.addEventListener('tap',createPopup);
  map.map.getViewModel().setLookAtData({
    bounds: map.group.getBoundingBox()
  });
};

/**
 * Removes previously created bubbles from the map. Code from https://stackoverflow.com/a/33834185
 */
const clearBubbles = () => {
  map.ui.getBubbles().forEach(bub => map.ui.removeBubble(bub));
}

/**
 * Creates an infobubble for the clicked marker
 * @param {EventObject} event - The event that triggered the function
 */
const createPopup = (event)=>{
  clearBubbles();
  console.log(event.target);
  const template = getTemplate('marker-content',event.target.getData())[0];
  console.log(template);
  const bubble = new H.ui.InfoBubble(event.target.getGeometry(), {
    content:template
  });
  map.ui.addBubble(bubble);
};
//#endregion HTML Manipulation

//#region station searching

/**
 * Initiates a fetch request to NREL to look for nearby stations.
 * @param {object} parameters - The query parameters to send in the API fetch call
 * @returns {Promise} - Resolves to the json parsed data on nearby stations from NREL
 */
const getNearestStations = function(parameters={}){
  const paramString = Object.entries(parameters).map(([key,val])=>`${key}=${val}`).join('&');
  return fetch(`https://developer.nrel.gov/api/alt-fuel-stations/v1/nearest.json?api_key=${nrelak}&${paramString}`)
    .then(response => response.json());
}

/**
 * Collects the user's input to query NREL for nearby stations. Calls `createMap()` to create the map.
 */
const findStations = async () => {
  const locationName = $searchInput.val() || 'USECURRENT';
  const selectedLocation = userLocations[locationName];
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
  console.log('selectedLocation',selectedLocation);
  const response = await getNearestStations(params);

  createMap(selectedLocation,response.fuel_stations);
  $form.find(':is(input,select)').removeAttr('disabled');
  setSearchState(null,$('form button[type="submit"]'))
};
//#endregion

//#region Listener Functions
/**
 * Gets the user's current location using HTML 5 geolocationAPI
 */
const useCurrentLocation = async ()=>{
  setSearchState('loading is-info',$currentButton);
  $searchInput.attr('placeholder','Getting your location');
  const coords = await new Promise(resolve =>{
    navigator.geolocation.getCurrentPosition(position => {
      resolve(position.coords);
    });
  });
  userLocations['USECURRENT'] = {
    lat:coords.latitude,
    lng:coords.longitude
  };
  setSearchState('info',$currentButton);
  $searchInput.attr('placeholder','Using Current Location');
  loadFinalForm();
};

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

/**
 * Invoked when the user submits the search form. Checks all inputs to make sure that a valid option has been selected, or valid entry made.
 * TODO: Add verification of connector type input
 * @param {EventObject} event - The event that triggered the function
 */
const verifySelections = (event)=>{
  event.preventDefault();
  const $fuelType = $('#fuel-type');
  const $evNetwork = $('#ev-network');
  const $searchRadius = $('#search-radius');
  if(// Verify that the user has input the minimum required data
    ($searchInput.attr('placeholder') !== 'Using Current Location' && !userLocations[$searchInput.val()]) ||
    ($fuelType[0] && !$fuelType.val()) ||
    ($searchRadius[0] && !$searchRadius.val())
  ){
    if($searchInput.attr('placeholder') !== 'Using Current Location' && !userLocations[$searchInput.val()]){
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
 * TODO: Prevent duplicate fuel specific items from being created when they already exist on the page
 * @param {DOMEvent} event - The event that triggered the function
 */
const fuelSpecificOptions = (event) => {
  console.log('value',event.target.value)
  if(event.target.value === 'ELEC' || event.target.value === 'all'){
    if(!document.getElementById('electric-options')){
      getTemplate('elec-options')
      .insertAfter($('#advanced-options'));
    }
  }else{
    $('#electric-options').remove();
  }
};
const modifyLocal = async (event) => {
  console.log(event);
  const favLocals = $(event.target);
  const stationId = favLocals.data('favorite');
  localStorageData.push(stationId);
  localStorageData = [...new Set(localStorageData)];
  localStorage.setItem('FavoriteStations',JSON.stringify(localStorageData));
}
//#endregion Listener Functions

//#region Listener declarations
$currentButton.click(useCurrentLocation);
$form.submit(verifySelections);
$searchInput.on('input',debouncedSearch);
$searchInput.change(debouncedSearch);
$('#map-container').on('click','#favButton',modifyLocal);
window.addEventListener('resize',()=>{
  //If a map has been created, resize it when the viewport is resized.
  if(map.map){
    map.map.getViewPort().resize();
  }
});
//TODO: Add storage of favorite stations

//#endregion
