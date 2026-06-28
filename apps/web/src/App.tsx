import React from 'react';

const sections = [
  {
    title: 'Developer / GitHub',
    description: 'Developer sign-in through GitHub App and local project management.',
  },
  {
    title: 'PM / Slack',
    description: 'PM sign-in through Slack to join an invited session.',
  },
];

export function App() {
  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
      <h1>PairDock MVP skeleton</h1>
      <p>Initial React surface for the Developer/GitHub and PM/Slack flows.</p>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {sections.map((section) => (
          <section
            key={section.title}
            style={{ border: '1px solid #d0d7de', borderRadius: '12px', padding: '1rem' }}
          >
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
