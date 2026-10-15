// Téléchargement d'une facture PDF depuis le navigateur (route protégée par le jeton de session)
export async function telechargerFacture(numero, fetchAvecJeton) {
  const res = await fetchAvecJeton(`/api/facture-pdf?numero=${encodeURIComponent(numero)}`);
  if (!res.ok) throw new Error("Téléchargement impossible");
  const url = URL.createObjectURL(await res.blob());
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${numero.startsWith("A") ? "Avoir" : "Facture"}-Estalviar-${numero}.pdf`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
