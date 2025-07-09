export default function ErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Oups !</h1>
        <p className="text-gray-600 mb-6">Une erreur s'est produite</p>
        <a
          href="/"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
