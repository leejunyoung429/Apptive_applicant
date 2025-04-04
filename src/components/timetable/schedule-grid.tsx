"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/contexts/schedule-context";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export interface TimeSlot {
  date: Date; // 날짜 기반으로 변경
  hour: number;
  minute: number;
  selected: boolean;
}

type ScheduleGridProps = {
  selectedSlots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
};

export const ScheduleGrid = ({
  selectedSlots,
  onChange,
}: ScheduleGridProps) => {
  const { isTimeSlotBlocked, scheduledDates, startTime, endTime } =
    useSchedule();
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(true);
  const [dragStart, setDragStart] = useState<{
    dateIndex: number;
    hour: number;
    minute: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<{
    dateIndex: number;
    hour: number;
    minute: number;
  } | null>(null);

  // 시간 범위 정의 (0:00부터 24:00까지, 30분 단위 => 총 49개 블록)
  const timeBlocks = Array.from({ length: 49 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return { hour, minute };
  });

  // 선택된 시간 범위만 표시하기 위한 필터링된 시간 블록
  const filteredTimeBlocks = timeBlocks.filter((time) => {
    if (!startTime || !endTime) return true; // 시작/종료 시간이 설정되지 않았다면 모든 시간 표시

    const timeInMinutes = time.hour * 60 + time.minute;
    const startInMinutes = startTime.hour * 60 + startTime.minute;
    const endInMinutes = endTime.hour * 60 + endTime.minute;

    // 끝 시간은 제외함
    return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
  });

  // 마지막 시간 라벨 표시를 위한 종료 시간
  const endTimeLabel = endTime
    ? { hour: endTime.hour, minute: endTime.minute }
    : null;

  // 셀이 사용 가능한지 (관리자에 의해 차단되지 않은 시간)
  const isCellAvailable = (
    dateIndex: number,
    hour: number,
    minute: number
  ): boolean => {
    if (!scheduledDates[dateIndex]) return false;

    if (isTimeSlotBlocked(scheduledDates[dateIndex], hour, minute))
      return false;
    return true;
  };

  // 선택된 슬롯 배열에서 date, hour, minute으로 인덱스를 찾음
  const getSlotIndex = (
    dateIndex: number,
    hour: number,
    minute: number
  ): number => {
    if (!scheduledDates[dateIndex]) return -1;

    return selectedSlots.findIndex(
      (slot) =>
        slot.date.toDateString() === scheduledDates[dateIndex].toDateString() &&
        slot.hour === hour &&
        slot.minute === minute
    );
  };

  // 셀의 선택 상태 토글
  const toggleSlot = (dateIndex: number, hour: number, minute: number) => {
    if (!isCellAvailable(dateIndex, hour, minute)) return;

    const slotIndex = getSlotIndex(dateIndex, hour, minute);
    const newSlots = [...selectedSlots];
    if (slotIndex !== -1) {
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        selected: isSelecting,
      };
    } else {
      newSlots.push({
        date: scheduledDates[dateIndex],
        hour,
        minute,
        selected: isSelecting,
      });
    }
    onChange(newSlots);
  };

  // 특정 셀의 상태를 직접 설정하는 함수
  const setSlotSelected = (
    slots: TimeSlot[],
    dateIndex: number,
    hour: number,
    minute: number,
    selected: boolean
  ) => {
    if (!isCellAvailable(dateIndex, hour, minute)) return slots;
    if (!scheduledDates[dateIndex]) return slots;

    const newSlots = [...slots];
    const slotIndex = newSlots.findIndex(
      (slot) =>
        slot.date.toDateString() === scheduledDates[dateIndex].toDateString() &&
        slot.hour === hour &&
        slot.minute === minute
    );
    if (slotIndex !== -1) {
      newSlots[slotIndex] = { ...newSlots[slotIndex], selected };
    } else {
      newSlots.push({
        date: scheduledDates[dateIndex],
        hour,
        minute,
        selected,
      });
    }
    return newSlots;
  };

  // 드래그 영역 내 모든 셀을 업데이트 (영역 내의 모든 블록 선택/해제)
  const selectArea = () => {
    if (!dragStart || !dragEnd) return;

    const startDateIndex = Math.min(dragStart.dateIndex, dragEnd.dateIndex);
    const endDateIndex = Math.max(dragStart.dateIndex, dragEnd.dateIndex);

    // 시간 비교를 위해 분 단위로 변환
    const startTime = dragStart.hour * 60 + dragStart.minute;
    const endTime = dragEnd.hour * 60 + dragEnd.minute;
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);

    let updatedSlots = [...selectedSlots];
    for (
      let dateIndex = startDateIndex;
      dateIndex <= endDateIndex;
      dateIndex++
    ) {
      if (!scheduledDates[dateIndex]) continue;

      filteredTimeBlocks.forEach(({ hour, minute }) => {
        const currentTime = hour * 60 + minute;
        if (currentTime >= minTime && currentTime <= maxTime) {
          updatedSlots = setSlotSelected(
            updatedSlots,
            dateIndex,
            hour,
            minute,
            isSelecting
          );
        }
      });
    }
    onChange(updatedSlots);
  };

  // 드래그 시작: 마우스 다운 시 시작 블록 설정
  const handleMouseDown = (
    e: React.MouseEvent,
    dateIndex: number,
    hour: number,
    minute: number
  ) => {
    if (e.button !== 0) return; // 좌클릭만 처리
    if (!isCellAvailable(dateIndex, hour, minute)) return;

    const slotIndex = getSlotIndex(dateIndex, hour, minute);
    setIsSelecting(slotIndex === -1 || !selectedSlots[slotIndex].selected);
    setIsDragging(true);
    setDragStart({ dateIndex, hour, minute });
    setDragEnd({ dateIndex, hour, minute });
    e.preventDefault();
  };

  // 드래그 중: 마우스 오버 시 마지막 블록 업데이트
  const handleMouseOver = (dateIndex: number, hour: number, minute: number) => {
    if (isDragging) {
      setDragEnd({ dateIndex, hour, minute });
    }
  };

  // 드래그 종료: 마우스 업 시 영역 선택 적용
  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      selectArea();
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  };

  // 컴포넌트 외부 클릭 시에도 드래그 종료
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragStart && dragEnd) {
        selectArea();
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragEnd]);

  // 현재 셀이 드래그 영역에 포함되는지 체크
  const isInDragArea = (
    dateIndex: number,
    hour: number,
    minute: number
  ): boolean => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    if (!isCellAvailable(dateIndex, hour, minute)) return false;

    const startDateIndex = Math.min(dragStart.dateIndex, dragEnd.dateIndex);
    const endDateIndex = Math.max(dragStart.dateIndex, dragEnd.dateIndex);
    const currentTime = hour * 60 + minute;
    const startTime = Math.min(
      dragStart.hour * 60 + dragStart.minute,
      dragEnd.hour * 60 + dragEnd.minute
    );
    const endTime = Math.max(
      dragStart.hour * 60 + dragStart.minute,
      dragEnd.hour * 60 + dragEnd.minute
    );
    return (
      dateIndex >= startDateIndex &&
      dateIndex <= endDateIndex &&
      currentTime >= startTime &&
      currentTime <= endTime
    );
  };

  // HH:MM 형식으로 시간 표시 (예: "12:00", "09:30")
  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  // 날짜를 포맷팅 (예: "4월 15일(월)")
  const formatDate = (date: Date): string => {
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
    return `${format(date, "M월 d일", { locale: ko })}(${
      weekDays[date.getDay()]
    })`;
  };

  // 관리자가 날짜를 설정하지 않은 경우
  if (scheduledDates.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        아직 가능한 일정이 없습니다. 관리자가 일정을 설정하면 이용할 수
        있습니다.
      </div>
    );
  }

  return (
    <div className="select-none" onMouseUp={handleMouseUp}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-24 p-2"></th>
              {scheduledDates.map((date, index) => (
                <th key={index} className="font-semibold text-center p-2">
                  {formatDate(date)}
                </th>
              ))}
              <th className="w-24 p-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTimeBlocks.map((time, idx) => (
              <tr key={idx}>
                {/* 왼쪽 시간 라벨 */}
                <td className="text-sm text-gray-600 font-medium text-right pr-2 relative">
                  <span className="absolute right-2 -top-3">
                    {formatTime(time.hour, time.minute)}
                  </span>
                </td>
                {scheduledDates.map((_, dateIndex) => {
                  const isAvailable = isCellAvailable(
                    dateIndex,
                    time.hour,
                    time.minute
                  );
                  const isBlocked = !isAvailable;
                  const slotIndex = getSlotIndex(
                    dateIndex,
                    time.hour,
                    time.minute
                  );
                  const isSelected =
                    slotIndex !== -1 && selectedSlots[slotIndex].selected;
                  const inDragArea = isInDragArea(
                    dateIndex,
                    time.hour,
                    time.minute
                  );

                  return (
                    <td key={`${dateIndex}-${idx}`} className="p-1">
                      <div
                        className={cn(
                          "h-6 w-full border rounded transition-colors duration-100",
                          isBlocked
                            ? "bg-gray-300 border-gray-300 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-500 border-blue-500 hover:bg-blue-600"
                            : inDragArea
                            ? "bg-blue-200 border-blue-200"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        )}
                        onMouseDown={(e) =>
                          handleMouseDown(e, dateIndex, time.hour, time.minute)
                        }
                        onMouseOver={() =>
                          handleMouseOver(dateIndex, time.hour, time.minute)
                        }
                        aria-label={`${formatDate(
                          scheduledDates[dateIndex]
                        )} ${formatTime(time.hour, time.minute)}`}
                        tabIndex={isBlocked ? -1 : 0}
                        onKeyDown={(e) => {
                          if (
                            !isBlocked &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            toggleSlot(dateIndex, time.hour, time.minute);
                            e.preventDefault();
                          }
                        }}
                      ></div>
                    </td>
                  );
                })}
                {/* 오른쪽 시간 라벨 */}
                <td className="text-sm text-gray-600 font-medium text-left pl-2 relative">
                  <span className="absolute left-2 -top-3">
                    {formatTime(time.hour, time.minute)}
                  </span>
                </td>
              </tr>
            ))}

            {/* 마지막 시간 라벨 행 추가 */}
            {endTimeLabel && filteredTimeBlocks.length > 0 && (
              <tr>
                <td className="text-sm text-gray-600 font-medium text-right pr-2 relative">
                  <span className="absolute right-2 -top-3">
                    {formatTime(endTimeLabel.hour, endTimeLabel.minute)}
                  </span>
                </td>
                {scheduledDates.map((_, dateIndex) => (
                  <td key={`${dateIndex}-end`} className="p-1">
                    {/* 빈 셀 - 여기에는 시간 블록이 없음 */}
                  </td>
                ))}
                <td className="text-sm text-gray-600 font-medium text-left pl-2 relative">
                  <span className="absolute left-2 -top-3">
                    {formatTime(endTimeLabel.hour, endTimeLabel.minute)}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
