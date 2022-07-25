const platform = new H.service.Platform({
  apikey:'vHQte2zrv9XJ0YDqEdRTXf1WmE1fCCzbxnOVxs-JarU'
});
const geocoder = platform.getSearchService();

const geocode = (params) => new Promise((resolve,reject) => {
  geocoder.geocode(params,(result)=>resolve(result),(error)=>reject(error));
});