"use client";

import { useEffect } from "react";
import { ScheduleForm } from "@/components/timetable/schedule-form";
import { useSchedule } from "@/contexts/schedule-context";

export function ApplicantForm() {
  const { setRole } = useSchedule();

  useEffect(() => {
    setRole("applicant");
  }, [setRole]);

  return <ScheduleForm />;
}
