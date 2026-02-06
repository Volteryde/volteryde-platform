import { VoltrydeMapData, VoltrydeFeature } from "./schema";

export const getUserMapData = (schema: VoltrydeMapData): VoltrydeMapData => {
  // User App: Sales/Booking focus
  // Hides service_zone (borders) - users don't need to see admin boundaries
  // Hides battery level from drivers
  const features = schema.features
    .filter((f) => f.properties.role !== "service_zone")
    .map((f) => {
      if (f.properties.role === "driver") {
        // Destructure to remove batteryLevel, keep the rest
        const { batteryLevel, ...rest } = f.properties;
        return {
          ...f,
          properties: rest,
        } as VoltrydeFeature;
      }
      return f;
    });

  return {
    ...schema,
    features,
  };
};

export const getDriverMapData = (schema: VoltrydeMapData): VoltrydeMapData => {
  // Driver App: Navigation/Safety focus
  // Hides ghost cars (competitors/other available cars not relevant to their job)
  const features = schema.features.filter(
    (f) => f.properties.role !== "ghost_car",
  );

  return {
    ...schema,
    features,
  };
};

export const getAdminMapData = (schema: VoltrydeMapData): VoltrydeMapData => {
  // Admin Dashboard: Operations/Monitoring focus
  // Returns everything including borders and all actors
  return schema;
};
