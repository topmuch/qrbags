'use client';

import PublicLayout from '@/components/public/PublicLayout';
import { brandBadge } from '@/components/brand/BrandShell';

function AProposContent() {
  return (
    <>
      {/* Hero section — bandeau navy étiquette QRBag */}
      <section className="relative overflow-hidden bg-[#16234e] text-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
        <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#e6216e]/20 blur-[110px] pointer-events-none" aria-hidden />
        <div className="absolute -bottom-28 -left-24 w-80 h-80 rounded-full bg-[#2f9bff]/15 blur-[110px] pointer-events-none" aria-hidden />

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20">
          <span className={brandBadge}>À propos</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 mt-6">
            À propos de QRBag
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-xl leading-relaxed">
            Nous croyons qu&apos;un voyageur ne devrait jamais perdre son bagage — ni sa sérénité.
          </p>
        </div>
      </section>

      {/* Notre mission */}
      <section className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#16234e] mb-4">Notre mission</h2>
          <div className="w-24 h-1.5 bg-gradient-qrbag rounded-full mx-auto mb-6"></div>
          <p className="text-[#16234e]/70 text-lg max-w-3xl mx-auto">
            Créer une protection intelligente, universelle et sans friction pour tous les bagages —
            que vous soyez pèlerin, voyageur d&apos;affaires ou touriste. Notre objectif est de transformer
            l&apos;angoisse de la perte en une simple formalité résolue en quelques clics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Simplicité',
              desc: 'Activation en 30 secondes. Aucune application à télécharger, aucune batterie à charger, aucun GPS à configurer. Un simple scan suffit.',
              icon: '⚡',
              pill: 'bg-[#f8921f]/15',
            },
            {
              title: 'Sécurité',
              desc: 'Vos données personnelles sont protégées et cryptées de bout en bout. Aucune information sensible n&apos;est jamais exposée publiquement.',
              icon: '🔒',
              pill: 'bg-[#2f9bff]/10',
            },
            {
              title: 'Confiance',
              desc: 'Plus de 10 000 bagages protégés à travers le monde, avec un taux de récupération de 98 %. La preuve par le résultat.',
              icon: '🤝',
              pill: 'bg-[#e6216e]/10',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5 text-center hover:shadow-2xl hover:shadow-[#16234e]/10 hover:-translate-y-1 transition-all"
            >
              <div className={`w-16 h-16 rounded-2xl ${item.pill} flex items-center justify-center mx-auto mb-4 text-2xl`}>
                <span aria-hidden>{item.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-[#16234e] mb-2">{item.title}</h3>
              <p className="text-[#16234e]/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nos valeurs */}
      <section className="py-16 bg-[#f6f9ff]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#16234e] mb-12">Ce en quoi nous croyons</h2>

          <div className="space-y-6">
            {/* Valeur 1 */}
            <div className="flex items-start gap-5 bg-white p-6 rounded-2xl border border-[#16234e]/10 shadow-md shadow-[#16234e]/5">
              <div className="mt-1 w-10 h-10 rounded-full bg-gradient-qrbag flex items-center justify-center text-white font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#16234e] mb-2">L&apos;humain d&apos;abord</h3>
                <p className="text-[#16234e]/70 leading-relaxed">
                  Nous concevons nos solutions pour les personnes, pas pour les systèmes. Chaque pèlerin, chaque voyageur, chaque famille mérite une expérience fluide et rassurante. Nous plaçons l&apos;empathie au cœur de chaque décision produit.
                </p>
              </div>
            </div>

            {/* Valeur 2 */}
            <div className="flex items-start gap-5 bg-white p-6 rounded-2xl border border-[#16234e]/10 shadow-md shadow-[#16234e]/5">
              <div className="mt-1 w-10 h-10 rounded-full bg-gradient-qrbag flex items-center justify-center text-white font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#16234e] mb-2">L&apos;innovation au service de l&apos;utilité</h3>
                <p className="text-[#16234e]/70 leading-relaxed">
                  Pas de technologie pour la technologie — nous ne développons que ce qui résout un vrai problème. Si une fonctionnalité n&apos;apporte pas de valeur concrète à nos utilisateurs, nous ne la construisons pas.
                </p>
              </div>
            </div>

            {/* Valeur 3 */}
            <div className="flex items-start gap-5 bg-white p-6 rounded-2xl border border-[#16234e]/10 shadow-md shadow-[#16234e]/5">
              <div className="mt-1 w-10 h-10 rounded-full bg-gradient-qrbag flex items-center justify-center text-white font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#16234e] mb-2">La transparence totale</h3>
                <p className="text-[#16234e]/70 leading-relaxed">
                  Prix clairs et affichés dès le départ, pas de frais cachés, pas de verrouillage. Vous savez exactement ce que vous payez et ce que vous recevez. Nous croyons que la confiance se construit sur l&apos;honnêteté.
                </p>
              </div>
            </div>

            {/* Valeur 4 */}
            <div className="flex items-start gap-5 bg-white p-6 rounded-2xl border border-[#16234e]/10 shadow-md shadow-[#16234e]/5">
              <div className="mt-1 w-10 h-10 rounded-full bg-gradient-qrbag flex items-center justify-center text-white font-bold shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#16234e] mb-2">L&apos;engagement durable</h3>
                <p className="text-[#16234e]/70 leading-relaxed">
                  Nous investissons dans la fiabilité, la sécurité et le support client sur le long terme. Notre objectif n&apos;est pas de maximiser les profits à court terme, mais de construire une relation de confiance qui dure des années.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre équipe */}
      <section className="py-16 max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-[#16234e] mb-6">Qui sommes-nous ?</h2>
        <p className="text-[#16234e]/70 mb-8 max-w-2xl mx-auto leading-relaxed">
          QRBag est développé par <strong className="text-[#f8921f]">MMASOLUTION</strong>, une entreprise
          spécialisée dans les solutions digitales pour le tourisme religieux et les voyages internationaux.
          Notre équipe combine des expertises en technologie, logistique et expérience client pour créer
          des solutions qui font la différence.
        </p>

        <div className="bg-white rounded-3xl border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5 p-8 max-w-xl mx-auto">
          <div className="flex flex-col gap-4 text-[#16234e]/80">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl" aria-hidden>📍</span>
              <span>43 Rue Maryse Bastié, 78300 Poissy, France</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl" aria-hidden>📞</span>
              <a href="tel:+33745349339" className="hover:text-[#2f9bff] transition-colors">
                +33 7 45 34 93 39
              </a>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl" aria-hidden>✉️</span>
              <a href="mailto:contact@qrbag.com" className="hover:text-[#2f9bff] transition-colors">
                contact@qrbag.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres clés — bandeau navy */}
      <section className="relative overflow-hidden bg-[#16234e] py-16 px-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
        <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
        <div className="relative max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">QRBag en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '10 000+', label: 'Bagages protégés' },
              { number: '98%', label: 'Taux de récupération' },
              { number: '500+', label: 'Agences partenaires' },
              { number: '24/7', label: 'Support disponible' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gradient-qrbag mb-2">{stat.number}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function AProposPage() {
  return (
    <PublicLayout>
      <AProposContent />
    </PublicLayout>
  );
}
