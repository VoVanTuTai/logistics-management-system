import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import {
  isLocalMediaUri,
  uploadCourierImage,
} from '../media/courier-media-upload.api';
import type {
  IssueAttachmentPayload,
  NdrCaseDto,
  ShipmentExceptionPayload,
} from './delivery.types';

export async function reportShipmentException(
  accessToken: string,
  payload: ShipmentExceptionPayload,
): Promise<NdrCaseDto> {
  const uploadResolvedPayload = await resolveAttachmentPayload(accessToken, payload);

  return courierApiClient.request<NdrCaseDto>(courierEndpoints.delivery.exception, {
    method: 'POST',
    accessToken,
    body: uploadResolvedPayload,
  });
}

async function resolveAttachmentPayload(
  accessToken: string,
  payload: ShipmentExceptionPayload,
): Promise<ShipmentExceptionPayload> {
  if (!payload.attachments?.length) {
    return payload;
  }

  const attachments = await Promise.all(
    payload.attachments.map((attachment, index) =>
      resolveAttachment(accessToken, payload.shipmentCode, attachment, index),
    ),
  );

  return {
    ...payload,
    attachments,
  };
}

async function resolveAttachment(
  accessToken: string,
  shipmentCode: string,
  attachment: IssueAttachmentPayload,
  index: number,
): Promise<IssueAttachmentPayload> {
  if (attachment.url || !isLocalMediaUri(attachment.uri)) {
    return attachment;
  }

  const publicUrl = await uploadCourierImage({
    accessToken,
    uri: attachment.uri,
    filename:
      attachment.name ||
      `${shipmentCode.replace(/[^a-zA-Z0-9_-]/g, '') || 'shipment'}-issue-${index + 1}.jpg`,
  });

  return {
    ...attachment,
    uri: null,
    url: publicUrl,
  };
}
