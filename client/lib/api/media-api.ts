import { ApiError, apiFetch } from '@/lib/api/client';

export type UploadSlot = {
  uploadUrl: string;
  mediaKey: string;
  contentType: string;
  publicUrl?: string;
  avatarUrl?: string;
};

export type StatusItemResponse = {
  id: string;
  accountId: string;
  kind: 'image' | 'video';
  mediaKey: string;
  contentType: string;
  viewUrl?: string;
  postedAt: string;
  expiresAt: string;
};

export async function requestAvatarUploadUrl(
  accessToken: string,
  contentType = 'image/jpeg',
): Promise<UploadSlot> {
  return apiFetch<UploadSlot>('/v1/me/avatar/upload-url', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ contentType }),
  });
}

export async function requestStatusUploadUrl(
  accessToken: string,
  contentType: string,
): Promise<UploadSlot> {
  return apiFetch<UploadSlot>('/v1/me/status/upload-url', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ contentType }),
  });
}

export async function requestChatUploadUrl(
  accessToken: string,
  chatId: string,
  contentType: string,
): Promise<UploadSlot> {
  return apiFetch<UploadSlot>('/v1/media/chat/upload-url', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ chatId, contentType }),
  });
}

export async function requestMediaReadUrl(
  accessToken: string,
  mediaKey: string,
): Promise<string> {
  const res = await apiFetch<{ viewUrl: string }>('/v1/media/read-url', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ mediaKey }),
  });
  return res.viewUrl;
}

export async function putLocalFile(
  uploadUrl: string,
  localUri: string,
  contentType: string,
): Promise<void> {
  const fileRes = await fetch(localUri);
  if (!fileRes.ok) {
    throw new ApiError('UPLOAD_FAILED', 'Could not read the selected file.');
  }
  const blob = await fileRes.blob();

  let putRes: Response;
  try {
    putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });
  } catch {
    throw new ApiError('UPLOAD_FAILED', 'Could not upload. Check your connection.');
  }
  if (!putRes.ok) {
    throw new ApiError('UPLOAD_FAILED', 'Could not upload. Try again.');
  }
}

export async function listMyStatus(
  accessToken: string,
): Promise<StatusItemResponse[]> {
  const res = await apiFetch<{ items: StatusItemResponse[] }>('/v1/me/status', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.items ?? [];
}

export async function createStatusItem(
  accessToken: string,
  body: { mediaKey: string; contentType: string; kind: 'image' | 'video' },
): Promise<StatusItemResponse> {
  const res = await apiFetch<{ item: StatusItemResponse }>('/v1/me/status', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  return res.item;
}

export async function deleteStatusItem(
  accessToken: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(`/v1/me/status/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function listAccountStatus(
  accessToken: string,
  accountId: string,
): Promise<StatusItemResponse[]> {
  const res = await apiFetch<{ items: StatusItemResponse[] }>(
    `/v1/status/${encodeURIComponent(accountId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.items ?? [];
}
