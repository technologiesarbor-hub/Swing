import type { StatusItemResponse } from '@/lib/api/media-api';
import type { StatusItem } from '@/lib/user-settings-context';

export function apiStatusToLocal(item: StatusItemResponse): StatusItem {
  return {
    id: item.id,
    uri: item.viewUrl ?? '',
    mediaKey: item.mediaKey,
    kind: item.kind,
    postedAt: item.postedAt,
  };
}
