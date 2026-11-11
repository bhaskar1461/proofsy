/**
 * Helper to ensure MongoDB URIs with special characters in credentials
 * (such as '@' in passwords) are safely percent-encoded.
 */
function normalizeMongoUri(uri) {
  if (!uri || typeof uri !== "string" || !uri.startsWith("mongodb")) return uri;
  try {
    const schemaIdx = uri.indexOf("://");
    if (schemaIdx === -1) return uri;
    const schema = uri.substring(0, schemaIdx + 3);
    const rest = uri.substring(schemaIdx + 3);
    const slashIdx = rest.indexOf("/");
    const questionIdx = rest.indexOf("?");
    let hostEnd = rest.length;
    if (slashIdx !== -1 && questionIdx !== -1) hostEnd = Math.min(slashIdx, questionIdx);
    else if (slashIdx !== -1) hostEnd = slashIdx;
    else if (questionIdx !== -1) hostEnd = questionIdx;

    const credsAndHost = rest.substring(0, hostEnd);
    const pathAndQuery = rest.substring(hostEnd);
    const lastAtIdx = credsAndHost.lastIndexOf("@");
    if (lastAtIdx === -1) return uri;
    const creds = credsAndHost.substring(0, lastAtIdx);
    const host = credsAndHost.substring(lastAtIdx + 1);
    const colonIdx = creds.indexOf(":");
    if (colonIdx === -1) return uri;
    const user = creds.substring(0, colonIdx);
    const pass = creds.substring(colonIdx + 1);
    const cleanUser = encodeURIComponent(decodeURIComponent(user));
    const cleanPass = encodeURIComponent(decodeURIComponent(pass));
    return schema + cleanUser + ":" + cleanPass + "@" + host + pathAndQuery;
  } catch (e) {
    return uri;
  }
}

module.exports = { normalizeMongoUri };
