# APIs
- HERE EV Charge Points (Not usable due to need to purchase license)
- [Abstract IP Geolocation][Geolocation-url]
  - API Key: f5a55b450c8b428d8cc926b26d267de0
```js
//Example Call
const getLocation = async function(){
  const response = await fetch('https://ipgeolocation.abstractapi.com/v1/?api_key=f5a55b450c8b428d8cc926b26d267de0')
  const data = await response.json();
  console.log(data);
};
getLocation();
```
- [NREL Alt-Fuel-Stations API][NREL-alt-fuel]
  - API Key: kKioVYWtLSheIYeuhhDJEcNsDNdivdWsT3R0ayO4
```js
//Example Call
const getStations = async function(){
  const response = await fetch('https://developer.nrel.gov/api/alt-fuel-stations/v1.json?limit=5&fuel_type=ELEC&access=public&api_key=kKioVYWtLSheIYeuhhDJEcNsDNdivdWsT3R0ayO4')
  const data = await response.json();
  console.log(data);
}
getStations();
```
- [Open Weather Geocoding API][open-weather-url]
  - API Key: 3e0bc2bc17306f8b9a632d42c1b9d1c7
```js
//Example Zip code call
const getLocation = async function(zip){
  const response = await fetch(`https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=3e0bc2bc17306f8b9a632d42c1b9d1c7`)
  const data = await response.json();
  console.log(data);
};
getLocation(84124);
```
<!-- URL Variables -->
[NREL-alt-fuel]: https://developer.nrel.gov/docs/transportation/alt-fuel-stations-v1/
[Geolocation-url]: https://app.abstractapi.com/api/ip-geolocation/tester
[Open-weather-url]: https://openweathermap.org/api/geocoding-api