export default function BoatNotFound() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center bg-fullwhite">
      <div className="max-w-md w-full bg-lightgrey rounded-[16px] p-8 text-center">
        <h1 className="text-24 text-articblue font-medium">Listing not found</h1>
        <p className="text-16 text-darkgrey mt-3">
          This boat listing is not available. If you just paid, wait a few
          seconds and refresh—Stripe may still be confirming the payment.
        </p>
      </div>
    </div>
  );
}


