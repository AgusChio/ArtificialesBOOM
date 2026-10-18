export async function digest(text: string) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function passwordHash(username: string, password: string) {
  return digest(`${username.trim().toLowerCase()}:${password}`);
}

export function pesos(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("54") ? digits : `54${digits.replace(/^0/, "")}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function orderNumber(date = new Date()) {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BOOM-${stamp}-${tail}`;
}

export async function shrinkImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo leer la foto."));
      image.src = url;
    });
    const scale = Math.min(1, 1200 / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo preparar la foto.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.74);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function assetUrl(path: string) {
  if (!path || path.startsWith("data:") || path.startsWith("http") || path.startsWith("blob:")) return path;
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/") return path.startsWith("/") ? path : `/${path}`;
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  if (path.startsWith(cleanBase)) return path;
  return `${cleanBase}${path.replace(/^\/+/, "")}`;
}

