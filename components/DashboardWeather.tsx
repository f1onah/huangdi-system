"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun } from "lucide-react";

type WeatherInfo = {
  city: string;
  condition: string;
  kind: "rain" | "sunny" | "cloudy";
  tempC: string;
  feelsLikeC: string;
  humidity: string;
  tip: string;
};

function apiHref(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${basePath}${path}`;
}

function getPosition() {
  return new Promise<GeolocationPosition | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { maximumAge: 30 * 60 * 1000, timeout: 5000 });
  });
}

export function DashboardWeather() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const position = await getPosition();
        const query = position ? `?lat=${position.coords.latitude}&lon=${position.coords.longitude}` : "";
        const response = await fetch(apiHref(`/api/weather${query}`), { cache: "no-store" });
        const data = await response.json() as WeatherInfo | { error?: string };
        if (!response.ok || "error" in data) throw new Error("weather unavailable");
        if (active) {
          setWeather(data as WeatherInfo);
          setError("");
        }
      } catch {
        if (active) setError("今日天气暂不可用");
      }
    }

    loadWeather();
    return () => { active = false; };
  }, []);

  const Icon = weather?.kind === "sunny" ? Sun : weather?.kind === "rain" ? CloudRain : Cloud;
  const meta = weather ? `${weather.city} · ${weather.condition}` : error || "实时更新中";
  const temp = weather?.tempC ? `${weather.tempC}°C` : "--";
  const tip = weather?.tip || (error ? "今日天气暂不可用。" : "正在观天象...");

  return (
    <section className="rounded-[24px] border border-white/[0.1] bg-[#070606]/72 p-5 text-white shadow-glow backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/55">今日天气</p>
          <p className="mt-2 text-sm text-white/60">{meta}</p>
        </div>
        <span className="rounded-2xl bg-white/[0.08] p-3 text-white"><Icon size={22} /></span>
      </div>
      <div className="mt-4 flex items-end gap-3">
        <p className="text-5xl font-semibold">{temp}</p>
        {weather?.feelsLikeC ? <p className="pb-2 text-xs text-white/50">体感 {weather.feelsLikeC}°C</p> : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-white/72">{tip}</p>
      <p className="mt-2 text-xs text-white/45">{weather?.humidity ? `湿度 ${weather.humidity}% · ` : ""}每日实时更新</p>
    </section>
  );
}
