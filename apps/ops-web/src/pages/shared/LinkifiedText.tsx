import React from 'react';

interface LinkifiedTextProps {
  text: string | null | undefined;
  fallback?: string;
}

const URL_PATTERN = /(https?:\/\/[^\s,|]+)/gi;

export function LinkifiedText({
  text,
  fallback = 'Không có',
}: LinkifiedTextProps): React.JSX.Element {
  const normalizedText = text?.trim();

  if (!normalizedText) {
    return <>{fallback}</>;
  }

  const parts = normalizedText.split(URL_PATTERN);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) {
          return null;
        }

        if (!isHttpUrl(part)) {
          return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
        }

        return (
          <a
            key={`${part}-${index}`}
            className="ops-linkified-text__link"
            href={part}
            target="_blank"
            rel="noreferrer"
          >
            Xem ảnh
          </a>
        );
      })}
    </>
  );
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
