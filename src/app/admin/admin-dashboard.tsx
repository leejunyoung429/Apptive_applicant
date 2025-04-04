"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSchedule, TimeBlock } from "@/contexts/schedule-context";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

// 수정된 TimeBlock 타입 - day를 날짜(Date) 타입으로 변경
type EnhancedTimeBlock = {
  date: Date; // 날짜 정보 추가
  hour: number;
  minute: number;
  blocked: boolean;
};

// 블록 그리드 컴포넌트를 위한 타입
type BlockGridProps = {
  blockedSlots: EnhancedTimeBlock[];
  onChange: (slots: EnhancedTimeBlock[]) => void;
  startTime: { hour: number; minute: number } | null;
  endTime: { hour: number; minute: number } | null;
  selectedDates: Date[]; // 선택된 날짜 배열
};

// 블록 그리드 컴포넌트
const BlockGrid = ({
  blockedSlots,
  onChange,
  startTime,
  endTime,
  selectedDates,
}: BlockGridProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isBlocking, setIsBlocking] = useState(true);
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
  // 각 셀은 표시된 시간부터 30분 범위를 나타냄 (예: 12:00 셀은 12:00~12:30 범위)
  const filteredTimeBlocks = timeBlocks.filter((time) => {
    if (!startTime || !endTime) return true; // 시작/종료 시간이 설정되지 않았다면 모든 시간 표시

    const timeInMinutes = time.hour * 60 + time.minute;
    const startInMinutes = startTime.hour * 60 + startTime.minute;
    const endInMinutes = endTime.hour * 60 + endTime.minute;

    // 끝 시간은 제외함 (예: 13:00 선택 시 12:30까지만 표시)
    // 각 셀은 시작시간(표시된 시간)부터 30분을 의미하므로, 끝 시간과 동일한 셀은 제외
    return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
  });

  // 마지막 시간 라벨 표시를 위한 종료 시간 (마지막 셀 이후 시간)
  const endTimeLabel = endTime
    ? { hour: endTime.hour, minute: endTime.minute }
    : null;

  // 타임슬롯 위치를 인덱스로 변환
  const getSlotIndex = (
    dateIndex: number,
    hour: number,
    minute: number
  ): number => {
    if (!selectedDates[dateIndex]) return -1;

    return blockedSlots.findIndex(
      (slot) =>
        slot.date.getTime() === selectedDates[dateIndex].getTime() &&
        slot.hour === hour &&
        slot.minute === minute
    );
  };

  // 슬롯 설정 함수
  const setSlotBlocked = (
    slots: EnhancedTimeBlock[],
    dateIndex: number,
    hour: number,
    minute: number,
    blocked: boolean
  ) => {
    if (!selectedDates[dateIndex]) return slots;

    const newSlots = [...slots];
    const slotIndex = getSlotIndex(dateIndex, hour, minute);

    if (slotIndex !== -1) {
      newSlots[slotIndex] = { ...newSlots[slotIndex], blocked };
    } else {
      newSlots.push({
        date: selectedDates[dateIndex],
        hour,
        minute,
        blocked,
      });
    }
    return newSlots;
  };

  // 영역 내 모든 슬롯 선택
  const selectArea = () => {
    if (!dragStart || !dragEnd) return;

    const startDateIndex = Math.min(dragStart.dateIndex, dragEnd.dateIndex);
    const endDateIndex = Math.max(dragStart.dateIndex, dragEnd.dateIndex);

    // 시간 비교를 위해 분 단위로 변환
    const startTime = dragStart.hour * 60 + dragStart.minute;
    const endTime = dragEnd.hour * 60 + dragEnd.minute;
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);

    let updatedSlots = [...blockedSlots];

    for (
      let dateIndex = startDateIndex;
      dateIndex <= endDateIndex;
      dateIndex++
    ) {
      if (!selectedDates[dateIndex]) continue;

      filteredTimeBlocks.forEach(({ hour, minute }) => {
        const currentTime = hour * 60 + minute;
        if (currentTime >= minTime && currentTime <= maxTime) {
          updatedSlots = setSlotBlocked(
            updatedSlots,
            dateIndex,
            hour,
            minute,
            isBlocking
          );
        }
      });
    }

    onChange(updatedSlots);
  };

  // 드래그 시작 핸들러
  const handleMouseDown = (
    e: React.MouseEvent,
    dateIndex: number,
    hour: number,
    minute: number
  ) => {
    if (e.button !== 0) return; // 좌클릭만 처리

    const slotIndex = getSlotIndex(dateIndex, hour, minute);
    // 현재 슬롯의 상태를 확인하여 반대 상태로 설정 (토글)
    setIsBlocking(slotIndex === -1 || !blockedSlots[slotIndex].blocked);

    setIsDragging(true);
    setDragStart({ dateIndex, hour, minute });
    setDragEnd({ dateIndex, hour, minute });

    e.preventDefault(); // 기본 동작 방지
  };

  // 드래그 중 핸들러
  const handleMouseOver = (dateIndex: number, hour: number, minute: number) => {
    if (isDragging) {
      setDragEnd({ dateIndex, hour, minute });
    }
  };

  // 드래그 종료 핸들러
  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      // 영역 전체를 처리
      selectArea();

      // 드래그 상태 초기화
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  };

  // 셀이 현재 드래그 영역에 포함되는지 확인
  const isInDragArea = (
    dateIndex: number,
    hour: number,
    minute: number
  ): boolean => {
    if (!isDragging || !dragStart || !dragEnd) return false;

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

  // 선택된 날짜가 없는 경우 안내 메시지 표시
  if (selectedDates.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        달력에서 날짜를 선택하여 시간표를 생성하세요.
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
              {selectedDates.map((date, index) => (
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
                <td className="text-sm text-gray-600 font-medium text-right pr-2 relative">
                  <span className="absolute right-2 -top-3">
                    {formatTime(time.hour, time.minute)}
                  </span>
                </td>
                {selectedDates.map((_, dateIndex) => {
                  const slotIndex = getSlotIndex(
                    dateIndex,
                    time.hour,
                    time.minute
                  );
                  const isBlocked =
                    slotIndex !== -1 && blockedSlots[slotIndex].blocked;
                  const inDragArea = isInDragArea(
                    dateIndex,
                    time.hour,
                    time.minute
                  );

                  return (
                    <td key={`${dateIndex}-${idx}`} className="p-1">
                      <div
                        className={`h-6 w-full border border-gray-200 rounded transition-colors duration-100 ${
                          isBlocked
                            ? "bg-gray-300 hover:bg-gray-400"
                            : inDragArea
                            ? "bg-gray-200 hover:bg-gray-300"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onMouseDown={(e) =>
                          handleMouseDown(e, dateIndex, time.hour, time.minute)
                        }
                        onMouseOver={() =>
                          handleMouseOver(dateIndex, time.hour, time.minute)
                        }
                        aria-label={`${formatDate(
                          selectedDates[dateIndex]
                        )} ${formatTime(time.hour, time.minute)}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            const newSlots = setSlotBlocked(
                              blockedSlots,
                              dateIndex,
                              time.hour,
                              time.minute,
                              !isBlocked
                            );
                            onChange(newSlots);
                            e.preventDefault();
                          }
                        }}
                      ></div>
                    </td>
                  );
                })}
                <td className="text-sm text-gray-600 font-medium text-left pl-2 relative">
                  <span className="absolute left-2 -top-3">
                    {formatTime(time.hour, time.minute)}
                  </span>
                </td>
              </tr>
            ))}

            {/* 마지막 시간 라벨 행 추가 (셀 없이 라벨만 표시) */}
            {endTimeLabel && filteredTimeBlocks.length > 0 && (
              <tr>
                <td className="text-sm text-gray-600 font-medium text-right pr-2 relative">
                  <span className="absolute right-2 -top-3">
                    {formatTime(endTimeLabel.hour, endTimeLabel.minute)}
                  </span>
                </td>
                {selectedDates.map((_, dateIndex) => (
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

// 날짜 선택 컴포넌트
const DateSelector = ({
  selectedDates,
  onSelectedDatesChange,
}: {
  selectedDates: Date[];
  onSelectedDatesChange: (dates: Date[]) => void;
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    // 이미 선택된 날짜인지 확인
    const isSelected = selectedDates.some(
      (selectedDate) => selectedDate.toDateString() === date.toDateString()
    );

    // 선택된 날짜라면 제거, 아니라면 추가
    if (isSelected) {
      onSelectedDatesChange(
        selectedDates.filter(
          (selectedDate) => selectedDate.toDateString() !== date.toDateString()
        )
      );
    } else {
      // 날짜를 오름차순으로 정렬하여 추가
      const newDates = [...selectedDates, date].sort(
        (a, b) => a.getTime() - b.getTime()
      );
      onSelectedDatesChange(newDates);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDates.length && "text-gray-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDates.length > 0
                ? `${selectedDates.length}개 날짜 선택됨`
                : "날짜를 선택하세요"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleSelect}
              locale={ko}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {selectedDates.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-1">
            {selectedDates.map((date, index) => (
              <div
                key={index}
                className="text-xs bg-gray-100 rounded px-2 py-1 flex items-center"
              >
                {format(date, "M월 d일 (eee)", { locale: ko })}
                <button
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    onSelectedDatesChange(
                      selectedDates.filter((_, i) => i !== index)
                    );
                  }}
                  aria-label="날짜 제거"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => onSelectedDatesChange([])}
          >
            모두 지우기
          </Button>
        </div>
      )}
    </div>
  );
};

// 시간 선택 컴포넌트
const TimeSelector = ({
  label,
  selectedTime,
  onTimeChange,
}: {
  label: string;
  selectedTime: { hour: number; minute: number } | null;
  onTimeChange: (time: { hour: number; minute: number } | null) => void;
}) => {
  // 시간 옵션 (0시 ~ 24시)
  const hourOptions = Array.from({ length: 25 }, (_, i) => i);
  // 분 옵션 (0분, 30분)
  const minuteOptions = [0, 30];

  const handleHourChange = (hour: string) => {
    const newHour = parseInt(hour);
    if (selectedTime) {
      onTimeChange({ ...selectedTime, hour: newHour });
    } else {
      onTimeChange({ hour: newHour, minute: 0 });
    }
  };

  const handleMinuteChange = (minute: string) => {
    const newMinute = parseInt(minute);
    if (selectedTime) {
      onTimeChange({ ...selectedTime, minute: newMinute });
    } else {
      onTimeChange({ hour: 0, minute: newMinute });
    }
  };

  // 시간 포맷팅 함수
  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${label}-time`}>{label}</Label>
      <div className="flex gap-2">
        <Select
          value={selectedTime ? selectedTime.hour.toString() : ""}
          onValueChange={handleHourChange}
        >
          <SelectTrigger id={`${label}-hour`} className="w-24">
            <SelectValue placeholder="시간" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((hour) => (
              <SelectItem key={hour} value={hour.toString()}>
                {hour.toString().padStart(2, "0")}시
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedTime ? selectedTime.minute.toString() : ""}
          onValueChange={handleMinuteChange}
        >
          <SelectTrigger id={`${label}-minute`} className="w-24">
            <SelectValue placeholder="분" />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((minute) => (
              <SelectItem key={minute} value={minute.toString()}>
                {minute.toString().padStart(2, "0")}분
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTime && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTimeChange(null)}
            className="px-2"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  );
};

// 관리자 대시보드 컴포넌트
export function AdminDashboard() {
  const {
    blockedTimeSlots,
    setBlockedTimeSlots,
    setRole,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    setScheduledDates,
    resetAdminSettings,
  } = useSchedule();
  const [localBlockedSlots, setLocalBlockedSlots] = useState<
    EnhancedTimeBlock[]
  >([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // 역할을 관리자로 설정
  useEffect(() => {
    setRole("admin");
  }, [setRole]);

  // 초기 로드 시 컨텍스트에서 차단된 슬롯을 가져옴
  useEffect(() => {
    // 기존 TimeBlock에서 EnhancedTimeBlock으로 변환 (이전 데이터 마이그레이션)
    if (blockedTimeSlots.length > 0 && "day" in blockedTimeSlots[0]) {
      // 이전 형식의 데이터가 있는 경우, 현재 날짜로 날짜 정보 추가
      const today = new Date();
      const enhancedSlots: EnhancedTimeBlock[] = blockedTimeSlots.map(
        (slot: any) => ({
          date: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + slot.day
          ),
          hour: slot.hour,
          minute: slot.minute,
          blocked: slot.blocked,
        })
      );
      setLocalBlockedSlots(enhancedSlots);
    } else {
      // 이미 EnhancedTimeBlock 형식이면 그대로 사용
      setLocalBlockedSlots(blockedTimeSlots as unknown as EnhancedTimeBlock[]);
    }
  }, [blockedTimeSlots]);

  // 변경사항 저장
  const handleSave = () => {
    setBlockedTimeSlots(localBlockedSlots as any);
    // 선택된 날짜를 context에 저장
    setScheduledDates(selectedDates);
    toast.success("시간 블록 설정이 저장되었습니다.");
  };

  // 시간 블록 초기화
  const handleReset = () => {
    setLocalBlockedSlots([]);
    setSelectedDates([]);
    resetAdminSettings(); // 관리자 설정 초기화 함수 호출
  };

  // 시작 시간과 끝 시간이 유효한지 확인하는 함수
  const isTimeRangeValid = () => {
    if (!startTime || !endTime) return false;

    const startMinutes = startTime.hour * 60 + startTime.minute;
    const endMinutes = endTime.hour * 60 + endTime.minute;

    return endMinutes > startMinutes;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>운영 시간 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimeSelector
              label="시작 시간"
              selectedTime={startTime}
              onTimeChange={setStartTime}
            />
            <TimeSelector
              label="종료 시간"
              selectedTime={endTime}
              onTimeChange={setEndTime}
            />
          </div>
          {startTime && endTime && !isTimeRangeValid() && (
            <p className="text-sm text-red-500">
              종료 시간은 시작 시간보다 뒤여야 합니다.
            </p>
          )}
          <div className="text-sm text-gray-500 mt-2">
            * 시간 범위를 설정하면 해당 시간 범위에 맞춰 시간표가 생성됩니다.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>날짜 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <DateSelector
            selectedDates={selectedDates}
            onSelectedDatesChange={setSelectedDates}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>
            차단할 시간대를 드래그하여 선택해주세요. 차단된 시간대는 멘토와
            지원자가 선택할 수 없습니다.
          </p>
          <p className="mt-2 text-xs">
            * 회색으로 표시된 시간대는 차단된 시간대입니다.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            * 시간 간격은 30분 단위입니다. (예: 12:00은 12:00~12:30 시간대를
            의미합니다)
          </p>
        </div>

        <BlockGrid
          blockedSlots={localBlockedSlots}
          onChange={setLocalBlockedSlots}
          startTime={startTime}
          endTime={endTime}
          selectedDates={selectedDates}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleReset}>
          초기화
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!!(startTime && endTime && !isTimeRangeValid())}
        >
          저장하기
        </Button>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}
