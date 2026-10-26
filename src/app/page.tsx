import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
        <p className="mt-2 text-gray-600">
          This is the landing page.
        </p>
      </main>
    </div>
  );
}