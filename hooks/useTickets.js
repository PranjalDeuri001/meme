// src/hooks/useTickets.js
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/authSlice";

// Use the environment variable for the backend URL.
const backendUrl = import.meta.env.VITE_API_URL_3 || "";
const API_URL = `${backendUrl}/devices/maintainence-tickets/`;

export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const userInfo = useSelector(selectCurrentUser);
  const username = userInfo?.username || userInfo?.user || null;

  // Ref to keep current AbortController so we can cancel in-flight requests
  const abortControllerRef = useRef(null);
  // Flag to avoid re-initializing (helps with StrictMode double-invoke)
  const initializedRef = useRef(false);

  const fetchTickets = useCallback(async () => {
    // If username is not available, don't attempt fetch.
    if (!username) {
      setTickets([]);
      setIsLoading(false);
      return null;
    }

    // If there's an in-flight request, abort it before starting a new one.
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        console.error(e);
      }
      abortControllerRef.current = null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(API_URL, {
        params: { username },
        signal: controller.signal,
      });
      // Use response data or empty array
      const data = response?.data ?? [];
      setTickets(data);
      setError(null);
      return data;
    } catch (err) {
      // If request was aborted, do not set an error (it was intentional)
      if (
        axios.isCancel?.(err) ||
        err?.name === "CanceledError" ||
        err?.code === "ERR_CANCELED"
      ) {
        // request was cancelled
        console.info("[useTickets] fetch cancelled");
        return null;
      }

      // For an aborted AbortController, axios v1 throws CanceledError with name 'CanceledError'
      if (err?.name === "AbortError") {
        console.info("[useTickets] fetch aborted");
        return null;
      }

      console.error("[useTickets] Fetch error:", err);
      setError("Failed to fetch tickets. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
      // Clear controller if it's still the one we used
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [username]);

  // Initialize once (defensive against StrictMode double mount)
  useEffect(() => {
    if (initializedRef.current) {
      // already initialized by a previous mount (React StrictMode may mount, unmount, then mount again)
      // still try to fetch but don't change initialization semantics
    } else {
      initializedRef.current = true;
    }

    // call fetchTickets on mount
    fetchTickets();

    // cleanup: abort in-flight request on unmount
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          console.error(e);
        }
        abortControllerRef.current = null;
      }
      // do not reset initializedRef here; allow true unmount -> remount behaviour if you need that
    };
  }, [fetchTickets]);

  // Add ticket — posts payload then re-fetches tickets
  const addTicket = useCallback(
    async (formData) => {
      if (!username) {
        throw new Error("User is not authenticated. Cannot create ticket.");
      }

      // Convert odometer from string to a number.
      const odometerValue = formData?.odometer
        ? parseFloat(formData.odometer)
        : null;

      const payload = {
        vrn: formData.vrn,
        device_specific_type: formData.vehicleType,
        chassis_number: formData.chassisNumber,
        scheduled_date: formData.date,
        location: formData.location,
        priority: formData.priority,
        category: formData.category,
        description: formData.problemDescription,
        username: username,
        odometer: isNaN(odometerValue) ? null : odometerValue,
      };

      try {
        await axios.post(API_URL, payload, {
          headers: { "Content-Type": "application/json" },
        });
        // Re-fetch tickets after adding a new one
        await fetchTickets();
      } catch (err) {
        console.error("[useTickets] POST error:", err);
        if (err.response) {
          console.error("[useTickets] Error Response Data:", err.response.data);
        }
        // rethrow so caller/UI can show notification
        throw new Error(
          "Failed to create ticket. Please check your connection or input."
        );
      }
    },
    [fetchTickets, username]
  );

  return { tickets, isLoading, error, fetchTickets, addTicket };
}
