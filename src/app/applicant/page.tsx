import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApplicantForm } from "./applicant-form";

export default function ApplicantPage() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">지원자 시간표</h1>
            <p className="text-gray-600">
              면접이 가능한 시간대를 선택해 주세요.
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              뒤로 가기
            </Button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <ApplicantForm />
        </div>
      </div>
    </main>
  );
}
