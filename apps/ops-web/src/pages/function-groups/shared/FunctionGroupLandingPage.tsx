import React from 'react';

import './FunctionGroupLandingPage.css';

interface FunctionGroupLandingPageProps {
  groupCode: string;
  title: string;
  summary: string;
}

export function FunctionGroupLandingPage({
  groupCode,
  title,
  summary,
}: FunctionGroupLandingPageProps): React.JSX.Element {
  return (
    <section className="ops-function-group-page">
      <header className="ops-function-group-page__header">
        <small>{groupCode}</small>
        <h2>{title}</h2>
        <p>{summary}</p>
      </header>

      <article className="ops-function-group-page__children">
        <h3>Danh sach chuc nang trong cum</h3>
        <p>Ban co the them cac chuc nang con vao thu muc cua cum nay sau.</p>
      </article>
    </section>
  );
}
