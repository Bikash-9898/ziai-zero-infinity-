import type { GeneratedImage, GenerationOptions } from "@/types/image";

const API_BASE = "http://localhost:8000/api";

// export async function generateImage(opts: GenerationOptions, userId: string) {
//    if (!userId) {
//     throw new Error('User ID is missing. Please log in again.');
//   }
//   const res = await fetch(`${API_BASE}/image/generate`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       prompt: opts.prompt,
//       negative_prompt: opts.negativePrompt,
//       model: opts.model,
//       width: opts.width,
//       height: opts.height,
//       user_email: userEmail,
//       // user_id: userId,  // ← send user ID instead of email
//     }),
//   });

//   const data = await res.json().catch(() => null);

//   if (!res.ok) {
//     const message =
//       data?.detail?.[0]?.msg ??
//       data?.detail ??
//       data?.message ??
//       'Generation failed';
//     // const err = await res.json().catch(() => ({ detail: 'Generation failed' }));
//     // throw new Error(err.detail || 'Generation failed');
//     throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
//   }
//   return res.json();
// }

export async function generateImage(opts: GenerationOptions, userEmail: string) {
  const res = await fetch(`${API_BASE}/image/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: opts.prompt,
      negative_prompt: opts.negativePrompt,
      model: opts.model,
      width: opts.width,
      height: opts.height,
      user_id: userEmail,
    }),
  });

  // ← read body ONCE only
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || 'Generation failed');
  }

  return data;
}

export async function fetchImageHistory(userEmail: string) {
  const encoded = encodeURIComponent(userEmail);
  const res = await fetch(`${API_BASE}/image/history/${encoded}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  const data = await res.json();
  return data.images  as GeneratedImage[];
;
}