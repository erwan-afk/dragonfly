export default function NotFound() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center bg-fullwhite">
      <div className="max-w-md w-full bg-lightgrey rounded-[16px] p-8 text-center">
        <h1 className="text-24 text-articblue font-medium">Page not found</h1>
        <p className="text-16 text-darkgrey mt-3">
          The page you are looking for doesn’t exist, or the listing is not
          available yet.
        </p>
      </div>
    </div>
  );
}


