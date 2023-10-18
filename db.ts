const kv = await Deno.openKv();

export interface BikeStatus {
    bike: boolean,
    temp: number,
    uv: number,
    rain: number,
    sunset: string,
    sunrise: string
};

export async function update(day: string, status: BikeStatus) {
    await kv.set(['bikeNobike', day], status);
}

export async function query(day: string) {
    const result = kv.get(["bikeNobike", day]);
    return (await result).value;
}