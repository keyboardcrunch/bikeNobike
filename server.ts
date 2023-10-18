#!/usr/bin/env -S deno run -A --unstable --allow-net --allow-env
import { format } from "https://deno.land/std@0.193.0/datetime/mod.ts";
import { Cron } from "https://deno.land/x/croner@7.0.3/dist/croner.js";
import { Application, Context, Router, Status } from "https://deno.land/x/oak/mod.ts";
import { update, query, BikeStatus} from "./db.ts";
import "https://deno.land/x/dotenv/load.ts";

// api and weather parameter config
const zipcode = Deno.env.get("zipcode");
const apikey = Deno.env.get("weather_api_key");
const uri = `https://api.weatherapi.com/v1/forecast.json?key=${apikey}&q=${zipcode}&days=1&aqi=yes&alerts=no`;
const max_temp_f = 103;
const min_temp_f = 50;
const max_uv = 6; // 3-5 Low, 6-7 moderate, 8-10 High

// bike-able logic validation
function toBike(fc): boolean {
    return (
        ( fc.day.maxtemp_f <= max_temp_f ) &&
        ( fc.day.mintemp_f >= min_temp_f ) &&
        ( fc.day.uv <= max_uv ) &&
        ( fc.day.daily_will_it_rain == 0 )
    );
}

// update the database every day at 3 AM
const job = new Cron("0 3 * * *", {}, async () => {
    //import weather_data from "./example.json" assert { type: "json"};
    const day = format(new Date, "yyyy-MM-dd");
    const data = await fetch(uri);
    const weather_data = await data.json();
    const forecast = weather_data.forecast.forecastday[0];
    const status: BikeStatus = {
        temp: forecast.day.maxtemp_f,
        uv: forecast.day.uv,
        rain: forecast.day.daily_will_it_rain,
        sunset: forecast.astro.sunset,
        sunrise: forecast.astro.sunrise,
        bike: toBike(forecast)
    };
    update(day, status);
    console.log("Database updated!");
});

// otherwise host an async http server for presenting data
const router = new Router();
const app = new Application();

function notFound(context: Context) {
    context.response.status = Status.NotFound;
    context.response.body = '';
}

router
    .get("/", async (context) => {
        // serve the index.html
        await context.send({
            root: `${Deno.cwd()}/static`,
            index: "index.html",
        });
    })
    .get("/refresh", (context) => {
        // trigger the database update immediately
        job.trigger();
        context.response.body = "Database update triggered.";
    })
    .get("/json", async (context) => {
        // serve the json payload for current date
        const data = (await query(format(new Date, "yyyy-MM-dd")));
        context.response.body = JSON.stringify(data);
        context.response.type = "application/json";
    })
    .get("/json/:day", async (context) => {
        // serve the json payload for a specific day
        const data = (await query(context.params.day));
        context.response.body = JSON.stringify(data);
        context.response.type = "application/json";
    });

app.use(router.routes());
app.use(router.allowedMethods());
app.use(notFound);
app.addEventListener("listen", ({ hostname, port, serverType }) => {
    console.log(`Listening on ${hostname}:${port} using ${serverType} server.`);
});

await app.listen({ hostname: "127.0.0.1", port: 8000});