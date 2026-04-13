"use client";

import { useEffect, useState, useCallback } from "react";

export type MyLocationState =
  | { status: "pending" }
  | { status: "ready"; lat: number; lng: number }
  | { status: "denied" }
  | { status: "unavailable" };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 60_000,
};

export function useMyLocation() {
  const [state, setState] = useState<MyLocationState>({ status: "pending" });

  const refresh = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }
    setState({ status: "pending" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "ready",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: "denied" });
        } else {
          setState({ status: "unavailable" });
        }
      },
      GEO_OPTIONS
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
}
