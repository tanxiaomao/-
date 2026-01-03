
import { WeatherData } from "../types";

export const getCurrentWeather = async (): Promise<WeatherData> => {
  return new Promise((resolve) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // In a real app, we'd fetch from an API like OpenWeather using coords
          // Mocking response for demo
          resolve({
            temp: 22,
            condition: "多云",
            city: "上海"
          });
        },
        () => {
          resolve({
            temp: 20,
            condition: "晴",
            city: "北京"
          });
        }
      );
    } else {
      resolve({
        temp: 18,
        condition: "阴",
        city: "职场之城"
      });
    }
  });
};
