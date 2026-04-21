import { useCallback, useEffect, useMemo, useState } from "react";

const MAX_BETA = 35;
const MAX_GAMMA = 35;

export interface GyroscopeTilt {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, max: number) {
  return clamp(value / max, -1, 1);
}

export function useGyroscope() {
  const [tilt, setTilt] = useState<GyroscopeTilt | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");

  const needsPermission = useMemo(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      return false;
    }

    const orientationCtor = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    return typeof orientationCtor.requestPermission === "function";
  }, []);

  const requestPermission = useCallback(async () => {
    if (!needsPermission || typeof window === "undefined") {
      setPermissionState("granted");
      return true;
    }

    try {
      const orientationCtor = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<"granted" | "denied">;
      };

      const result = await orientationCtor.requestPermission?.();
      const granted = result === "granted";
      setPermissionState(granted ? "granted" : "denied");
      return granted;
    } catch {
      setPermissionState("denied");
      return false;
    }
  }, [needsPermission]);

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    if (!needsPermission) {
      setPermissionState("granted");
    }
  }, [needsPermission]);

  useEffect(() => {
    if (!isSupported || permissionState !== "granted") {
      if (!isSupported) {
        setTilt(null);
      }
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;

      setTilt({
        x: normalize(gamma, MAX_GAMMA),
        y: normalize(beta, MAX_BETA),
      });
    };

    window.addEventListener(
      "deviceorientation",
      handleOrientation as EventListener,
      true,
    );

    return () => {
      window.removeEventListener(
        "deviceorientation",
        handleOrientation as EventListener,
        true,
      );
    };
  }, [isSupported, permissionState]);

  return {
    tilt,
    isSupported,
    needsPermission,
    permissionState,
    requestPermission,
  };
}
