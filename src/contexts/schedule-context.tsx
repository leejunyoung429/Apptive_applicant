"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { TimeSlot } from "@/components/timetable/schedule-grid";

// 시간 블록 정보를 위한 인터페이스 (기존)
export interface TimeBlock {
  day: number;
  hour: number;
  minute: number;
  blocked: boolean;
}

// 날짜 기반 시간 블록 인터페이스 (새로운 형식)
export interface EnhancedTimeBlock {
  date: Date;
  hour: number;
  minute: number;
  blocked: boolean;
}

interface ScheduleContextProps {
  name: string;
  role: "mentor" | "applicant" | "admin";
  blockedTimeSlots: TimeBlock[] | EnhancedTimeBlock[];
  scheduledDates: Date[]; // 관리자가 설정한 날짜들
  startTime: { hour: number; minute: number } | null;
  endTime: { hour: number; minute: number } | null;
  setName: (name: string) => void;
  setRole: (role: "mentor" | "applicant" | "admin") => void;
  setBlockedTimeSlots: (slots: TimeBlock[] | EnhancedTimeBlock[]) => void;
  setScheduledDates: (dates: Date[]) => void; // 날짜 설정 함수
  setStartTime: (time: { hour: number; minute: number } | null) => void;
  setEndTime: (time: { hour: number; minute: number } | null) => void;
  resetSchedule: () => void; // 사용자 정보만 초기화 (이름만)
  resetAdminSettings: () => void; // 관리자 설정 초기화 (시간표 설정 포함)
  isTimeSlotBlocked: (
    dayOrDate: number | Date,
    hour: number,
    minute: number
  ) => boolean;
}

const ScheduleContext = createContext<ScheduleContextProps | undefined>(
  undefined
);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<"mentor" | "applicant" | "admin">(
    "applicant"
  );
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<
    TimeBlock[] | EnhancedTimeBlock[]
  >([]);
  const [scheduledDates, setScheduledDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState<{
    hour: number;
    minute: number;
  } | null>(null);
  const [endTime, setEndTime] = useState<{
    hour: number;
    minute: number;
  } | null>(null);

  // 해당 시간이 블록되어 있는지 확인하는 함수 (날짜 또는 요일 기반)
  const isTimeSlotBlocked = (
    dayOrDate: number | Date,
    hour: number,
    minute: number
  ): boolean => {
    if (typeof dayOrDate === "number") {
      // 기존 요일 기반 확인
      return blockedTimeSlots.some(
        (slot) =>
          "day" in slot &&
          slot.day === dayOrDate &&
          slot.hour === hour &&
          slot.minute === minute &&
          slot.blocked
      );
    } else {
      // 새로운 날짜 기반 확인
      return blockedTimeSlots.some(
        (slot) =>
          "date" in slot &&
          slot.date.toDateString() === dayOrDate.toDateString() &&
          slot.hour === hour &&
          slot.minute === minute &&
          slot.blocked
      );
    }
  };

  // 사용자 정보만 초기화 (지원자/멘토용)
  const resetSchedule = () => {
    setName("");
    // 관리자가 설정한 시간표는 유지
  };

  // 관리자 설정 초기화 (관리자용)
  const resetAdminSettings = () => {
    setBlockedTimeSlots([]);
    setScheduledDates([]);
    setStartTime(null);
    setEndTime(null);
  };

  return (
    <ScheduleContext.Provider
      value={{
        name,
        role,
        blockedTimeSlots,
        scheduledDates,
        startTime,
        endTime,
        setName,
        setRole,
        setBlockedTimeSlots,
        setScheduledDates,
        setStartTime,
        setEndTime,
        resetSchedule,
        resetAdminSettings,
        isTimeSlotBlocked,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
};
