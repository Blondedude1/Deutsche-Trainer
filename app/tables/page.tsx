import { TablesContent } from "@/components/TablesContent";
import { TopBar } from "@/components/TopBar";

export default function TablesPage() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-4xl p-4">
        <div className="card overflow-hidden">
          <TablesContent />
        </div>
      </main>
    </>
  );
}
