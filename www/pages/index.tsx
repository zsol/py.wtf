import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { getPackageIndex } from '../lib/docs';

export async function getStaticProps() {
  const packages = getPackageIndex();
  return {
    props: {
      packages,
    }
  }
}

export default function Home({ packages }) {
  return (
    <div className="container">
      <Head>
        <title>py.wtf</title>
        {/*<link rel="icon" href="/favicon.ico" /> */}
      </Head>

      <main>
        <ul>
          {packages.map(({ name, version }) => (
            <li key="{name}-{version}">
              <Link href={'/' + name}><a>{name}</a></Link> ({version})
            </li>
          ))}
        </ul>
      </main>

      <footer>
        Footer.
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  )
}
