export default function Loading() {
  return (
    <section className="bg-fullwhite w-full flex items-center justify-center py-[112px]">
      <div className="max-w-screen-xl mx-auto py-[112px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading sign in…</p>
        </div>
      </div>
    </section>
  );
}
