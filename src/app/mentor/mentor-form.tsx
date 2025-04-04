"use client";

import { useEffect } from "react";
import { ScheduleForm } from "@/components/timetable/schedule-form";
import { useSchedule } from "@/contexts/schedule-context";

export function MentorForm() {
  const { setRole } = useSchedule();

  useEffect(() => {
    setRole("mentor");
  }, [setRole]);

  return <ScheduleForm />;
}
