
import { WeatherData } from "../types";

export const getCurrentWeather = async (): Promise<WeatherData> => {
  return new Promise((resolve) => {
    // 设置一个超时时间，防止在部分网络环境下 geolocation.getCurrentPosition 一直挂起
    const timeout = setTimeout(() => {
      resolve({
        temp: 20,
        condition: "晴",
        city: "北京" // 默认城市
      });
    }, 3000);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          // 在演示环境下，我们根据获取到的经纬度大致模拟城市
          // 实际开发中会调用高德/腾讯地图逆地址解析 API
          resolve({
            temp: 22,
            condition: "多云",
            city: "上海"
          });
        },
        (error) => {
          clearTimeout(timeout);
          console.warn("Geolocation failed or denied:", error.message);
          resolve({
            temp: 18,
            condition: "阴",
            city: "职场之城"
          });
        },
        { timeout: 2500, enableHighAccuracy: false }
      );
    } else {
      clearTimeout(timeout);
      resolve({
        temp: 18,
        condition: "阴",
        city: "职场之城"
      });
    }
  });
};
