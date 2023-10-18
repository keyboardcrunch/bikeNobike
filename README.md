# Bike/Nobike

I wanted a web service that determines if today is a good day to go for a bike ride,
this is that service. Written in TypeScript/Deno and leveraging WeatherAPI, it'll 
respond with a json weather object.

## Routes

| route | response/action |
| --- | --- |
| / | serves a basic index.html with the tabled data |
| /json | returns a BikeStatus json object |
| /json/yyyy-mm-dd | returns a BikeStatus json object for the specified date |
| /refresh | updates the kv store with current day's weather |

## Clients
I've not written any yet but I'm going to create a python inky client for a Pi Zero
with an inkyphat display.
