import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">시간표 등록 시스템</h1>
          <p className="mt-2 text-gray-600">
            면접 가능 시간대를 조사하는 시스템입니다. 역할을 선택하여 시간표를
            작성해주세요.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link href="/mentor" className="block w-full">
            <Button variant="default" className="w-full h-14 text-lg">
              멘토 / 운영진
            </Button>
          </Link>

          <Link href="/applicant" className="block w-full">
            <Button variant="outline" className="w-full h-14 text-lg">
              지원자
            </Button>
          </Link>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <Link href="/admin" className="block w-full">
              <Button variant="ghost" className="w-full">
                관리자 대시보드{" "}
                <span className="text-xs ml-2 text-gray-500">
                  시간 블록 설정
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
