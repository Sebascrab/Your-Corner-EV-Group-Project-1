//Initiate the HERE platform and necessary HERE services
const platform = new H.service.Platform({
  apikey:'vHQte2zrv9XJ0YDqEdRTXf1WmE1fCCzbxnOVxs-JarU'
});
//Initatie Geocoding service
const geocoder = platform.getSearchService();

/**
 * Alias for HERE geocoder.geocode that searches for a given address
 * @param {string} q - The address to search by. May be one or all of street address, city, state, zip
 * @returns {Promise} - Resolves to the HERE Geocoding result or error object
 */
const geocode = (address) => new Promise((resolve,reject) => {
  geocoder.geocode({q:address},(result)=>{
    //Filter the result items to be in the USA as that is where our fuel source data is limited to.
    result.items = result.items.filter((item)=>item.address.countryCode === 'USA');
    resolve(result)
  },(error)=>reject(error));
});