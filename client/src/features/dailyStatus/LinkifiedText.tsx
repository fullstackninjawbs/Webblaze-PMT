import React from 'react';
import { Anchor } from '@mantine/core';

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

/**
 * Renders report text with http(s) links made clickable. Long words and URLs wrap
 * instead of overflowing their container.
 */
export const LinkifiedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <Anchor key={i} href={part} target="_blank" rel="noopener noreferrer" size="sm" style={{ overflowWrap: 'anywhere' }}>
            {part}
          </Anchor>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};
