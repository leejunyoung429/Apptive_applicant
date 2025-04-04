import { AdminDashboard } from "./admin-dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">관리자 대시보드</h1>
            <p className="text-gray-600">
              시간표에서 차단할 시간대를 설정해주세요.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                홈으로
              </Button>
            </Link>
            <Link href="/mentor">
              <Button variant="ghost" size="sm">
                멘토 페이지
              </Button>
            </Link>
            <Link href="/applicant">
              <Button variant="ghost" size="sm">
                지원자 페이지
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <AdminDashboard />
        </div>
      </div>
    </main>
  );
}
