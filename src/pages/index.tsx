import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading
          as="h1"
          className="hero__title"
        >
          {siteConfig.title}
        </Heading>
        <p
          className="hero__subtitle"
          style={{ fontSize: '1rem' }}
        >
          {siteConfig.tagline}
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary"
            to="/blog"
          >
            点击查看
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="首页"
      description="Description will go into a meta tag in <head />"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
