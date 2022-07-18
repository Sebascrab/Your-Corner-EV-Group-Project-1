# APIs
- HERE EV Charge Points
```js
//Example Call

```
- IP Location
```javascript
//Example call
const encodedParams = new URLSearchParams();
encodedParams.append("ip", "146.160.63.10");

const options = {
	method: 'POST',
	headers: {
		'content-type': 'application/x-www-form-urlencoded',
		'X-RapidAPI-Key': 'f88fe08056msh697b8a53209daecp1304bdjsn06fe253aa260',
		'X-RapidAPI-Host': 'ip-location5.p.rapidapi.com'
	},
	body: encodedParams
};

fetch('https://ip-location5.p.rapidapi.com/get_geo_info', options)
	.then(response => response.json())
	.then(response => console.log(response))
	.catch(err => console.error(err));
```