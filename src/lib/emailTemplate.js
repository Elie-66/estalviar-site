export function enveloppeEmail({ titre, contenuHtml, siteUrl = "https://estalviar.com" }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titre}</title>
</head>
<body style="margin:0; padding:0; background-color:#F6F2E9; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F2E9; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color:#ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5ded0;">

          <tr>
            <td style="padding: 32px 32px 0 32px; text-align: center; background-color:#12172B;">
              <div style="padding-bottom: 24px;">
                <span style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #F6F2E9;">
                  Estalviar<span style="color:#C9A227;">.</span>
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px; background-color:#ffffff;">
              ${contenuHtml}
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #eee6d4; background-color:#ffffff;">
              <p style="margin:0; font-family: Arial, sans-serif; font-size: 11px; color: #999; text-align: center; line-height: 1.6;">
                Estalviar — La carte cadeau, offerte simplement.<br/>
                <a href="${siteUrl}" style="color: #C9A227; text-decoration: none;">${siteUrl.replace('https://', '')}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function boutonEmail({ texte, lien }) {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${lien}" style="display: inline-block; background-color: #C9A227; color: #12172B; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
        ${texte}
      </a>
    </div>
  `;
}

export function texteEmail(texte) {
  return `<p style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${texte}</p>`;
}

export function titreEmail(texte) {
  return `<h1 style="margin: 0 0 20px 0; font-family: Georgia, serif; font-size: 24px; color: #12172B; text-align: center;">${texte}</h1>`;
}