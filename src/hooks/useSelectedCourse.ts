import { useEffect, useState } from "react";
import { getSelectedCourse } from "@/lib/courseSelection";

export function useSelectedCourse(language: string) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh(n => n + 1);
    window.addEventListener("course-changed", update);
    window.addEventListener("storage", update);
    window.addEventListener("popstate", update);
    return () => { window.removeEventListener("course-changed", update); window.removeEventListener("storage", update); window.removeEventListener("popstate", update); };
  }, []);
  return getSelectedCourse(language);
}