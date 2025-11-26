const KARTIK_BASE_URL = process.env.KARTIK_BASE_URL || "http://44.195.71.139:5001/fill";
const KARTIK_TIMEOUT_MS = Number(process.env.KARTIK_TIMEOUT_MS || 8000);

const buildQuery = (params) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      usp.set(key, value);
    }
  });
  return usp.toString();
};

export async function sendLeadToKartik({ website, name, email, phone, service, message, sourceWebsite }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), KARTIK_TIMEOUT_MS);
  try {
    const qs = buildQuery({
      urls: website,
      name,
      email,
      phone,
      service,
      message,
      website: sourceWebsite
    });
    const url = `${KARTIK_BASE_URL}?${qs}`;
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`kartiksetia responded ${res.status}`);
    return { success: true };
  } catch (err) {
    clearTimeout(timer);
    return { success: false, error: err.message || "kartiksetia call failed" };
  }
}
