import { BadRequestException } from '@nestjs/common';

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,49}$/;
const CONFIG_KEY_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function ensureString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string.`);
  }

  return value;
}

function trimAndValidateLength(
  value: string,
  fieldName: string,
  maxLength: number,
): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  if (normalizedValue.length > maxLength) {
    throw new BadRequestException(
      `${fieldName} exceeds max length ${maxLength}.`,
    );
  }

  return normalizedValue;
}

export function normalizeRequiredCode(value: unknown, fieldName = 'code'): string {
  const normalizedValue = trimAndValidateLength(
    ensureString(value, fieldName),
    fieldName,
    50,
  ).toUpperCase();

  if (!CODE_PATTERN.test(normalizedValue)) {
    throw new BadRequestException(
      `${fieldName} must match pattern ${CODE_PATTERN.source}.`,
    );
  }

  return normalizedValue;
}

export function normalizeOptionalCode(
  value: unknown,
  fieldName = 'code',
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalizedValue = ensureString(value, fieldName).trim();
  if (!normalizedValue) {
    return null;
  }

  return normalizeRequiredCode(normalizedValue, fieldName);
}

export function normalizeCodeQuery(
  value: string | undefined,
  fieldName = 'code',
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  return normalizeRequiredCode(normalizedValue, fieldName);
}

export function normalizeRequiredText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  return trimAndValidateLength(
    ensureString(value, fieldName),
    fieldName,
    maxLength,
  );
}

export function normalizeOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalizedValue = ensureString(value, fieldName).trim();
  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    throw new BadRequestException(
      `${fieldName} exceeds max length ${maxLength}.`,
    );
  }

  return normalizedValue;
}

export function normalizeTextQuery(
  value: string | undefined,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue.length > maxLength) {
    throw new BadRequestException(
      `${fieldName} exceeds max length ${maxLength}.`,
    );
  }

  return normalizedValue;
}

export function normalizeRequiredConfigKey(
  value: unknown,
  fieldName = 'key',
): string {
  const normalizedValue = trimAndValidateLength(
    ensureString(value, fieldName),
    fieldName,
    80,
  ).toLowerCase();

  if (!CONFIG_KEY_PATTERN.test(normalizedValue)) {
    throw new BadRequestException(
      `${fieldName} must match pattern ${CONFIG_KEY_PATTERN.source}.`,
    );
  }

  return normalizedValue;
}

export function normalizeOptionalConfigKey(
  value: unknown,
  fieldName = 'key',
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeRequiredConfigKey(value, fieldName);
}

export function normalizeConfigKeyQuery(
  value: string | undefined,
  fieldName = 'key',
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  return normalizeRequiredConfigKey(normalizedValue, fieldName);
}

export function parseBooleanQuery(
  value: string | undefined,
  fieldName: string,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) {
    return undefined;
  }

  if (['1', 'true', 'yes'].includes(normalizedValue)) {
    return true;
  }

  if (['0', 'false', 'no'].includes(normalizedValue)) {
    return false;
  }

  throw new BadRequestException(
    `${fieldName} must be one of: true, false, 1, 0.`,
  );
}
