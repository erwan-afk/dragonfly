'use client';

import Inner from '@/components/ui/Inner';

export default function DemoTransitionsPage() {
  return (
    <Inner backgroundColor="#B0AD98" showNavigation={false}>
      <div className="min-h-screen p-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Page de Démonstration des Transitions
        </h1>

        <div className="body space-y-6 max-w-4xl">
          <p className="text-lg text-gray-700 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
            imperdiet nibh sit amet velit dignissim, non tempus nisl
            pellentesque. Praesent sagittis magna sit amet ex blandit, id
            pharetra lectus feugiat. Praesent sit amet congue ipsum, in ultrices
            neque. In dapibus in purus vitae dignissim. Quisque molestie
            ullamcorper elementum. Sed sodales erat augue. Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Duis aliquet quis lectus vitae
            venenatis. Aliquam erat volutpat. Nulla maximus sodales nibh dapibus
            congue. Integer nec pharetra felis, quis commodo elit. Fusce et
            aliquet neque. Vivamus leo diam, pharetra ut lorem eu, suscipit
            egestas ipsum. Aenean mauris ligula, laoreet ut volutpat sit amet,
            convallis et turpis.
          </p>

          <p className="text-lg text-gray-700 leading-relaxed">
            Quisque molestie ullamcorper elementum. Sed sodales erat augue.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
            aliquet quis lectus vitae venenatis. Aliquam erat volutpat. Nulla
            maximus sodales nibh dapibus congue. Integer nec pharetra felis,
            quis commodo elit. Fusce et aliquet neque. Vivamus leo diam,
            pharetra ut lorem eu, suscipit egestas ipsum. Aenean mauris ligula,
            laoreet ut volutpat sit amet, convallis et turpis.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Transition Perspective
              </h3>
              <p className="text-gray-600">
                Effet de mise à l'échelle et de translation sur l'axe Y avec
                opacité.
              </p>
            </div>

            <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Transition Slide
              </h3>
              <p className="text-gray-600">
                Animation de glissement vertical depuis le bas de l'écran.
              </p>
            </div>

            <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Transition Opacity
              </h3>
              <p className="text-gray-600">
                Fondu d'entrée fluide pour le contenu de la page.
              </p>
            </div>

            <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Easing Custom
              </h3>
              <p className="text-gray-600">
                Courbe d'accélération personnalisée [0.76, 0, 0.24, 1].
              </p>
            </div>
          </div>
        </div>
      </div>
    </Inner>
  );
}
