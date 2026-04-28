import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type WttrCurrent = {
  temp_C?: string;
  FeelsLikeC?: string;
  humidity?: string;
  weatherCode?: string;
  weatherDesc?: Array<{ value?: string }>;
};

function getWeatherKind(code?: string, desc = "") {
  const value = Number(code || 0);
  const text = desc.toLowerCase();

  if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 317, 350, 353, 356, 359, 362, 365, 374, 377, 386, 389, 392, 395].includes(value) || /rain|drizzle|shower|thunder|snow|sleet/.test(text)) return "rain";
  if (value === 113 || /sunny|clear/.test(text)) return "sunny";
  if ([119, 122, 143, 248, 260].includes(value) || /cloud|overcast|mist|fog|haze/.test(text)) return "cloudy";
  return "cloudy";
}

function getTip(kind: string) {
  if (kind === "rain") return "皇上出行记得备伞。";
  if (kind === "sunny") return "皇上出行注意防晒。";
  return "皇上出行注意天气变化。";
}

function weatherEndpoint(requestUrl: string) {
  const { searchParams } = new URL(requestUrl);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const query = lat && lon ? `${lat},${lon}` : searchParams.get("q") || "";
  return query ? `https://wttr.in/${encodeURIComponent(query)}?format=j1` : "https://wttr.in/?format=j1";
}

export async function GET(request: Request) {
  try {
    const response = await fetch(weatherEndpoint(request.url), {
      headers: { "User-Agent": "huangdi-system-weather" },
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "今日天气暂不可用。" }, { status: response.status });
    }

    const data = await response.json() as { current_condition?: WttrCurrent[]; nearest_area?: Array<{ areaName?: Array<{ value?: string }> }> };
    const current = data.current_condition?.[0] || {};
    const condition = current.weatherDesc?.[0]?.value || "Cloudy";
    const kind = getWeatherKind(current.weatherCode, condition);
    const city = data.nearest_area?.[0]?.areaName?.[0]?.value || "当前所在地";

    return NextResponse.json({
      city,
      condition,
      kind,
      tempC: current.temp_C || "",
      feelsLikeC: current.FeelsLikeC || "",
      humidity: current.humidity || "",
      tip: getTip(kind),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "今日天气暂不可用。" }, { status: 500 });
  }
}
