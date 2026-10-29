import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getSelectedCourse } from "@/lib/courseSelection";

export function useSelectedCourse(language: string) {
  const location = useLocation();
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh(n => n + 1);
    window.addEventListener("course-changed", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("course-changed", update); window.removeEventListener("storage", update); };
  }, []);
  const course = new URLSearchParams(location.search).get("course");
  return course === "health" && language !== "en" ? "health" : course === "general" ? "general" : getSelectedCourse(language);
}