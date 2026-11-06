// A wish travels in the URL fragment (#w=…), which browsers never send to a server, as AES-GCM
// ciphertext bundled with its one-off key. Anyone holding the link can open it (that is how the
// friend sees it), but it isn't readable in the link, and it never reaches our server, logs or previews.

const b64u = (b) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export async function sealWish(text) {
  const raw = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text)));
  return b64u(new Uint8Array([...raw, ...iv, ...ct]));
}

/** The wish, or "" for a missing, tampered or garbled payload. */
export async function openWish(sealed) {
  try {
    const b = unb64u(sealed || "");
    const key = await crypto.subtle.importKey("raw", b.slice(0, 16), "AES-GCM", false, ["decrypt"]);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(16, 28) }, key, b.slice(28)));
  } catch {
    return "";
  }
}
