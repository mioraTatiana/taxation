// Requête partagée par recette.js, statistique.js et tableaudebord.js
//
// Elle met les factures marchandise ET les factures funéraires dans une seule liste,
// avec les mêmes noms de colonnes, et une colonne "transport" :
//   "Express"       : facture marchandise dont le wagon n'est pas complet
//   "Wagon complet" : facture marchandise en série 100 / série 400
//   "Funéraire"     : facture de la table facturefuneraire (poids et colis = 0)
// La dernière colonne, iduser, est le taxateur qui a enregistré la facture
// (utilisée par Route/Admin/enregistrement.js).
//
// On l'utilise comme une table : SELECT ... FROM (${TOUTES_FACTURES}) f WHERE ...
// ::float transforme les nombres en nombres JS (sinon Node renvoie parfois du texte).

const TOUTES_FACTURES = `
  SELECT fm.idfacturemarchandise AS idfacture,
         fm.numfacturemarchandise AS numfacture,
         fm.datefacturemarchandise AS datefacture,
         CASE WHEN w.modefacturation THEN 'Wagon complet' ELSE 'Express' END AS transport,
         fm.idclient,
         fm.iddestination,
         fm.montantttc::float AS recette,
         fm.poidsreeltotal::float AS poids,
         fm.nombrecolistotal AS colis,
         fm.iduser
  FROM public.facturemarchandise fm
  LEFT JOIN LATERAL (
         SELECT tw.modefacturation
           FROM public.detailfacture df
           JOIN public.tarifmarchandise t ON t.idtarifmarchandise = df.idtarifmarchandise
           JOIN public.typewagon tw ON tw.idtypewagon = t.idtypewagon
          WHERE df.idfacturemarchandise = fm.idfacturemarchandise
          ORDER BY df.iddetailfacture
          LIMIT 1) w ON true

  UNION ALL

  SELECT ff.idfacturefuneraire,
         ff.numfacturefuneraire,
         ff.datefacturefuneraire,
         'Funéraire',
         ff.idclient,
         ff.iddestination,
         ff.montantttcfunerare::float,
         0,
         0,
         ff.iduser
  FROM public.facturefuneraire ff`;

// Filtre commun : dates facultatives ($1, $2) et transport facultatif ($3)
//   ?debut=2026-02-01&fin=2026-02-28&transport=Funéraire
const FILTRE = `($1::date IS NULL OR f.datefacture >= $1::date)
  AND ($2::date IS NULL OR f.datefacture <= $2::date)
  AND ($3::text IS NULL OR f.transport = $3::text)`;

// Les 3 valeurs du filtre, lues dans l'adresse
// "tous" (ou rien) = tous les transports
function parametresFiltre(req) {
  const transport = req.query.transport && req.query.transport !== "tous" ? req.query.transport : null;
  return [req.query.debut || null, req.query.fin || null, transport];
}

module.exports = { TOUTES_FACTURES, FILTRE, parametresFiltre };
