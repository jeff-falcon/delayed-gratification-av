import { get } from "svelte/store";
import { ga } from "./store";
import { logEvent } from "@firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyCRw8a6TmKlSCbDuL683VJHf_JGfMHpGjQ",
  authDomain: "jfalcon-untitled.firebaseapp.com",
  databaseURL: "https://jfalcon-untitled-default-rtdb.firebaseio.com",
  projectId: "jfalcon-untitled",
  storageBucket: "jfalcon-untitled.appspot.com",
  messagingSenderId: "980493446348",
  appId: "1:980493446348:web:abe51f8d0d39280630a669",
  measurementId: "G-T9Y5XQ8T53"
};

export function trackEvent(name: string, params?: { [key: string]: string | number }) {
  const analytics = get(ga);
  if (analytics) {
    logEvent(analytics, name, params);
  }
}