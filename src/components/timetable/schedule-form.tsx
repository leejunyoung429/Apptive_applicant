"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScheduleGrid, TimeSlot } from "./schedule-grid";
import { useSchedule } from "@/contexts/schedule-context";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const ScheduleForm = () => {
  const { name, role, setName } = useSchedule();
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    if (selectedSlots.filter((slot) => slot.selected).length === 0) {
      toast.error("최소 한 개 이상의 시간대를 선택해주세요.");
      return;
    }

    // 여기서 데이터를 서버로 전송하는 로직을 구현할 수 있습니다.
    // 현재는 데이터를 콘솔에 출력하고 성공 메시지를 표시합니다.
    console.log({ name, role, selectedSlots });
    toast.success("시간표가 저장되었습니다!");

    // 사용자 입력 초기화
    setName("");
    setSelectedSlots([]);
  };

  // 사용자가 선택한 시간 슬롯만 초기화
  const handleReset = () => {
    setSelectedSlots([]);
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          required
        />
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          가능한 시간대를 드래그하여 선택해주세요.
          <ul className="mt-2 text-xs">
            <li>00:00 ~ 23:30 (30분 단위)</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            * 회색으로 표시된 시간대는 관리자에 의해 차단된 시간으로, 선택할 수
            없습니다.
          </p>
        </div>
        <ScheduleGrid
          selectedSlots={selectedSlots}
          onChange={setSelectedSlots}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleReset}>
          초기화
        </Button>
        <Button type="submit">저장하기</Button>
      </div>

      <Toaster position="top-center" />
    </form>
  );
};
